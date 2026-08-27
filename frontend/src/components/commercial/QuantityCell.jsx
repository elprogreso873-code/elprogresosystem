import { QuantityLineDisplay } from './QuantityLineDisplay';

/**
 * Celda de tabla para cantidad + tipo de venta (suelto/paquete).
 * Evita el efecto "1,00Suelto" por columnas pegadas.
 */
export const QuantityCell = ({ line, className = '', align = 'right' }) => (
  <td className={`py-3 ${align === 'right' ? 'text-right' : 'text-left'} ${className}`}>
    <QuantityLineDisplay line={line} align={align} />
  </td>
);
