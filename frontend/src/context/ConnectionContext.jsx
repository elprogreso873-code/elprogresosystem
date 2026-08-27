import { createContext, useContext } from 'react';
import { useConnectionStatus } from '../hooks/useConnectionStatus';

const ConnectionContext = createContext(null);

export const ConnectionProvider = ({ children }) => {
  const connection = useConnectionStatus();
  return (
    <ConnectionContext.Provider value={connection}>{children}</ConnectionContext.Provider>
  );
};

export const useConnection = () => {
  const context = useContext(ConnectionContext);
  if (!context) {
    throw new Error('useConnection debe usarse dentro de ConnectionProvider');
  }
  return context;
};
