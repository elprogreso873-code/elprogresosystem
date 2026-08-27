import { create } from 'zustand';

const normalizeError = (error) => {
  if (!error) return { message: 'Error desconocido', detail: null };
  if (typeof error === 'string') return { message: error, detail: null };
  if (error instanceof Error) {
    return {
      message: error.message || 'Error inesperado',
      detail: error.stack || null,
    };
  }
  if (error?.message) {
    return { message: String(error.message), detail: null };
  }
  return { message: 'Error inesperado', detail: null };
};

export const useErrorStore = create((set) => ({
  globalError: null,
  reportError: (error) =>
    set({
      globalError: {
        ...normalizeError(error),
        at: Date.now(),
      },
    }),
  clearGlobalError: () => set({ globalError: null }),
}));
