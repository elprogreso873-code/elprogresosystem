import { useCallback, useEffect, useRef, useState } from 'react';
import { productService } from '../services/productService';
import { getErrorMessage } from '../utils/getErrorMessage';
import { isBarcodeLike, pickScannedProduct } from '../utils/barcodeScan';

const SCAN_BURST_GAP_MS = 55;
const SCAN_IDLE_MS = 160;
const SCAN_DEDUPE_MS = 180;

export const useBarcodeProductSearch = ({
  productSearch,
  setProductSearch,
  setSearchResults,
  setSearchError,
  setSearchLoading,
  addToCart,
  enabled = true,
}) => {
  const inputRef = useRef(null);
  const valueRef = useRef(productSearch);
  const lastKeyAtRef = useRef(0);
  const isBurstRef = useRef(false);
  const idleTimerRef = useRef(null);
  const queueRef = useRef([]);
  const busyRef = useRef(false);
  const lastScanRef = useRef({ term: '', at: 0 });
  const [scanBusy, setScanBusy] = useState(false);

  valueRef.current = productSearch;

  const focusSearch = useCallback(() => {
    requestAnimationFrame(() => inputRef.current?.focus());
  }, []);

  const resolveAndAdd = useCallback(
    async (raw, source) => {
      const term = String(raw || '').trim();
      if (!term) return;

      setScanBusy(true);
      setSearchLoading?.(true);

      try {
        const items = await productService.quickSearch(term, 25);
        const product = pickScannedProduct(items, term, {
          allowSingleName: source === 'enter',
        });

        if (product) {
          addToCart(product);
          setProductSearch('');
          setSearchResults([]);
          setSearchError('');
          focusSearch();
          return;
        }

        setSearchResults(items);
        setSearchError(items.length ? '' : `No se encontró el código «${term}»`);
        focusSearch();
      } catch (err) {
        setSearchError(getErrorMessage(err));
        focusSearch();
      } finally {
        setSearchLoading?.(false);
        setScanBusy(false);
      }
    },
    [
      addToCart,
      focusSearch,
      setProductSearch,
      setSearchError,
      setSearchLoading,
      setSearchResults,
    ]
  );

  const processQueue = useCallback(async () => {
    if (busyRef.current) return;
    busyRef.current = true;
    while (queueRef.current.length) {
      const next = queueRef.current.shift();
      await resolveAndAdd(next.term, next.source);
    }
    busyRef.current = false;
  }, [resolveAndAdd]);

  const enqueueScan = useCallback(
    (raw, source) => {
      const term = String(raw || '').trim();
      if (!term) return;

      const now = Date.now();
      if (term === lastScanRef.current.term && now - lastScanRef.current.at < SCAN_DEDUPE_MS) {
        return;
      }
      lastScanRef.current = { term, at: now };
      queueRef.current.push({ term, source });
      processQueue();
    },
    [processQueue]
  );

  const onKeyDown = useCallback(
    (event) => {
      if (!enabled || event.key !== 'Enter') return;
      event.preventDefault();
      if (idleTimerRef.current) {
        clearTimeout(idleTimerRef.current);
        idleTimerRef.current = null;
      }
      isBurstRef.current = false;
      enqueueScan(event.currentTarget.value, 'enter');
    },
    [enabled, enqueueScan]
  );

  const ingestValue = useCallback(
    (value) => {
      const now = performance.now();
      const gap = now - lastKeyAtRef.current;
      lastKeyAtRef.current = now;

      if (gap <= SCAN_BURST_GAP_MS) isBurstRef.current = true;
      else if (gap > 120) isBurstRef.current = false;

      setProductSearch(value);
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
      if (!enabled) return;

      idleTimerRef.current = setTimeout(() => {
        const current = valueRef.current.trim();
        if (isBurstRef.current && isBarcodeLike(current)) {
          isBurstRef.current = false;
          enqueueScan(current, 'idle');
        }
      }, SCAN_IDLE_MS);
    },
    [enabled, enqueueScan, setProductSearch]
  );

  const onChange = useCallback(
    (event) => {
      ingestValue(event.target.value);
    },
    [ingestValue]
  );

  useEffect(() => {
    if (!enabled) return;

    const isOtherEditable = (el) => {
      if (!el || el === inputRef.current) return false;
      return Boolean(el.closest?.('input, textarea, select, [contenteditable="true"]'));
    };

    const onDocKeyDown = (event) => {
      if (isOtherEditable(event.target)) return;

      if (event.key === 'Enter') {
        if (event.target === inputRef.current) return;
        const pending = valueRef.current.trim();
        if (!pending || (!isBurstRef.current && !isBarcodeLike(pending))) return;
        event.preventDefault();
        if (idleTimerRef.current) {
          clearTimeout(idleTimerRef.current);
          idleTimerRef.current = null;
        }
        isBurstRef.current = false;
        enqueueScan(pending, 'enter');
        return;
      }

      if (event.target === inputRef.current) return;
      if (event.key.length !== 1 || event.ctrlKey || event.metaKey || event.altKey) return;

      event.preventDefault();
      inputRef.current?.focus();
      ingestValue(`${valueRef.current}${event.key}`);
    };

    document.addEventListener('keydown', onDocKeyDown, true);
    return () => document.removeEventListener('keydown', onDocKeyDown, true);
  }, [enabled, enqueueScan, ingestValue]);

  useEffect(
    () => () => {
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
    },
    []
  );

  return { inputRef, onKeyDown, onChange, focusSearch, scanBusy };
};
