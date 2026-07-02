import {
  IconCircleCheck,
  IconAlertCircle,
  IconAlertTriangle,
  IconInfoCircle,
  IconX,
} from '@tabler/icons-react';
import { TOAST_VARIANTS } from '../../colors';

const iconByType = {
  success: IconCircleCheck,
  error: IconAlertCircle,
  warning: IconAlertTriangle,
  info: IconInfoCircle,
};

function BrandToast({ toast, onClose }) {
  if (!toast) return null;

  const type = toast.tipo || 'info';
  const ToastIcon = iconByType[type] || IconInfoCircle;
  const palette = TOAST_VARIANTS[type] || TOAST_VARIANTS.info;

  return (
    <div
      className={`vb-toast vb-toast--${type} px-4 py-3`}
      style={{
        top: 'calc(var(--navbar-height, 64px) + 18px)',
      }}
      role="status"
      aria-live="polite"
    >
      <div className="flex items-start gap-3">
        <ToastIcon 
          size={22} 
          stroke={2.2} 
          className="mt-0.5 shrink-0"
          style={{ color: palette.icon }}
        />
        <div className="flex-1">
          <p className="font-body text-sm font-semibold leading-5">
            {toast.mensaje}
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Cerrar notificacion"
          className="rounded-lg p-1 transition hover:bg-white/20"
          style={{ color: palette.icon }}
        >
          <IconX size={18} />
        </button>
      </div>
    </div>
  );
}

export default BrandToast;
