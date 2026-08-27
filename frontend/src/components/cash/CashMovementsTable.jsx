import { formatDate } from '../../utils/formatDate';
import { formatCurrency } from '../../utils/formatCurrency';
import { movTipoClass, movTipoLabel } from './cashConstants';

export const CashMovementsTable = ({ movements, compact = false }) => {
  if (!movements?.length) {
    return <p className="text-sm text-slate-500 py-4 text-center">Sin movimientos</p>;
  }

  return (
    <>
      <div className="sm:hidden space-y-2">
        {movements.map((m) => (
          <div
            key={m.id}
            className="rounded-xl border border-slate-200 bg-white p-3 space-y-1.5"
          >
            <div className="flex items-center justify-between gap-2">
              <span
                className={`px-2 py-0.5 rounded text-xs font-medium ${movTipoClass[m.tipo] || movTipoClass.ingreso}`}
              >
                {movTipoLabel[m.tipo] || m.tipo}
              </span>
              <span className="font-semibold tabular-nums">{formatCurrency(m.monto)}</span>
            </div>
            <p className="text-sm text-slate-700 truncate">
              {m.descripcion || m.referencia || '—'}
            </p>
            <div className="flex items-center justify-between text-xs text-slate-500">
              <span>{m.metodo_pago_nombre || m.metodo_pago || '—'}</span>
              <span>{formatDate(m.fecha)}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="hidden sm:block overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-slate-500 border-b">
            <th className="py-2 text-left">Tipo</th>
            {!compact && <th className="py-2 text-left">Método</th>}
            <th className="py-2 text-left">Descripción</th>
            <th className="py-2 text-right">Monto</th>
            <th className="py-2 text-right">Fecha</th>
          </tr>
        </thead>
        <tbody>
          {movements.map((m) => (
            <tr key={m.id} className="border-b border-slate-100">
              <td className="py-2.5">
                <span
                  className={`px-2 py-0.5 rounded text-xs font-medium ${movTipoClass[m.tipo] || movTipoClass.ingreso}`}
                >
                  {movTipoLabel[m.tipo] || m.tipo}
                </span>
              </td>
              {!compact && (
                <td className="py-2.5 text-slate-600 text-xs">
                  {m.metodo_pago_nombre || m.metodo_pago || '—'}
                </td>
              )}
              <td className="py-2.5 max-w-[200px] truncate">{m.descripcion || m.referencia || '—'}</td>
              <td className="py-2.5 text-right font-medium">{formatCurrency(m.monto)}</td>
              <td className="py-2.5 text-right text-slate-500 whitespace-nowrap">
                {formatDate(m.fecha)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      </div>
    </>
  );
};
