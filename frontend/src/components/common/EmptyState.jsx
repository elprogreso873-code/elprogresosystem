import { Inbox } from 'lucide-react';

export const EmptyState = ({ title = 'Sin resultados', description }) => (
  <div className="flex flex-col items-center justify-center py-16 text-center">
    <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mb-4">
      <Inbox className="w-8 h-8 text-slate-400" />
    </div>
    <h3 className="text-lg font-medium text-slate-700">{title}</h3>
    {description && <p className="text-sm text-slate-500 mt-1 max-w-sm">{description}</p>}
  </div>
);
