import { Link } from 'react-router-dom';
import { Button } from '../components/ui/Button';

export const NotFoundPage = () => (
  <div className="flex flex-col items-center justify-center p-6 py-16 text-center min-h-[50vh]">
    <h1 className="text-6xl font-bold text-brand-500">404</h1>
    <p className="text-xl text-slate-600 mt-2">Página no encontrada</p>
    <Link to="/dashboard" className="mt-6">
      <Button>Volver al inicio</Button>
    </Link>
  </div>
);
