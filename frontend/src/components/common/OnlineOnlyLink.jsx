import { Link } from 'react-router-dom';
import { Button } from '../ui/Button';
import { useConnection } from '../../context/ConnectionContext';

const OFFLINE_MSG =
  'Sin conexión — no podés registrar ventas hasta recuperar internet.';

export const OnlineOnlyLink = ({ to, children, className = '', buttonVariant = 'primary', buttonSize = 'md' }) => {
  const { isOffline } = useConnection();

  if (isOffline) {
    return (
      <span title={OFFLINE_MSG} className={className}>
        <Button variant={buttonVariant} size={buttonSize} disabled>
          {children}
        </Button>
      </span>
    );
  }

  return (
    <Link to={to} className={className}>
      <Button variant={buttonVariant} size={buttonSize}>
        {children}
      </Button>
    </Link>
  );
};

export const OnlineOnlyButton = ({
  children,
  offlineMessage = OFFLINE_MSG,
  disabled = false,
  ...props
}) => {
  const { isOffline } = useConnection();

  return (
    <Button
      {...props}
      disabled={disabled || isOffline}
      title={isOffline ? offlineMessage : props.title}
    >
      {children}
    </Button>
  );
};
