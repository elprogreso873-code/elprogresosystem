import { useEffect } from 'react';
import { useAuthStore } from '../store/authStore';
import { authService } from '../services/authService';

/** Actualiza permisos del usuario al cargar la app (sesión persistida) */
export const useAuthRefresh = () => {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const updateUser = useAuthStore((s) => s.updateUser);

  useEffect(() => {
    if (!isAuthenticated) return;

    authService
      .getMe()
      .then((user) => updateUser(user))
      .catch(() => {});
  }, [isAuthenticated, updateUser]);
};
