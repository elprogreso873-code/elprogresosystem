import { useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { LogIn } from 'lucide-react';
import { loginSchema } from '../validations/authSchemas';
import { authService } from '../services/authService';
import { useAuthStore } from '../store/authStore';
import { Input } from '../components/ui/Input';
import { PasswordInput } from '../components/ui/PasswordInput';
import { Button } from '../components/ui/Button';
import { Alert } from '../components/ui/Alert';
import { Card } from '../components/ui/Card';
import { getErrorMessage } from '../utils/getErrorMessage';

export const LoginPage = () => {
  const navigate = useNavigate();
  const { isAuthenticated, setAuth } = useAuthStore();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(loginSchema),
    defaultValues: { nombre_usuario: '', contrasena: '' },
  });

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  const onSubmit = async (data) => {
    setError('');
    setLoading(true);
    try {
      const result = await authService.login(data);
      setAuth(result.token, result.user);
      navigate('/dashboard');
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="!p-8">
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-brand-100 text-brand-700 mb-4">
          <LogIn className="w-7 h-7" />
        </div>
        <h2 className="text-2xl font-bold text-slate-800">Iniciar sesión</h2>
        <p className="text-slate-500 mt-1">Ingrese sus credenciales de acceso</p>
      </div>

      {error && <Alert className="mb-4">{error}</Alert>}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <Input
          id="nombre_usuario"
          label="Usuario"
          size="lg"
          placeholder="Ingrese su usuario"
          autoComplete="username"
          error={errors.nombre_usuario?.message}
          {...register('nombre_usuario')}
        />

        <PasswordInput
          label="Contraseña"
          size="lg"
          placeholder="Ingrese su contraseña"
          autoComplete="current-password"
          error={errors.contrasena?.message}
          {...register('contrasena')}
        />

        <Button type="submit" className="w-full" size="lg" isLoading={loading}>
          Ingresar
        </Button>
      </form>
    </Card>
  );
};
