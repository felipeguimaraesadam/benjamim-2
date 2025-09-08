import { toast } from 'react-toastify';
import React from 'react';
import { CheckCircle, AlertCircle, Info, AlertTriangle, X } from 'lucide-react';

// Detectar tema atual
const getCurrentTheme = () => {
  return document.documentElement.classList.contains('dark') ? 'dark' : 'light';
};

// Componentes de ícones customizados
const SuccessIcon = () => (
  <CheckCircle className="w-5 h-5 text-green-500" />
);

const ErrorIcon = () => (
  <AlertCircle className="w-5 h-5 text-red-500" />
);

const InfoIcon = () => (
  <Info className="w-5 h-5 text-blue-500" />
);

const WarningIcon = () => (
  <AlertTriangle className="w-5 h-5 text-yellow-500" />
);

// Opções base com tema dinâmico
const getBaseToastOptions = () => ({
  position: 'top-right',
  autoClose: 5000,
  hideProgressBar: false,
  closeOnClick: true,
  pauseOnHover: true,
  draggable: true,
  progress: undefined,
  theme: getCurrentTheme(),
  className: 'toast-custom',
  bodyClassName: 'toast-body-custom',
  progressClassName: 'toast-progress-custom',
});

/**
 * Displays a success toast notification.
 * @param {string} message - The message to display.
 * @param {Object} options - Additional options to override defaults.
 */
export const showSuccessToast = (message, options = {}) => {
  toast.success(message, {
    ...getBaseToastOptions(),
    icon: SuccessIcon,
    ...options,
  });
};

/**
 * Displays an error toast notification.
 * @param {string} message - The message to display.
 * @param {Object} options - Additional options to override defaults.
 */
export const showErrorToast = (message, options = {}) => {
  toast.error(message, {
    ...getBaseToastOptions(),
    icon: ErrorIcon,
    ...options,
  });
};

/**
 * Displays an info toast notification.
 * @param {string} message - The message to display.
 * @param {Object} options - Additional options to override defaults.
 */
export const showInfoToast = (message, options = {}) => {
  toast.info(message, {
    ...getBaseToastOptions(),
    icon: InfoIcon,
    ...options,
  });
};

/**
 * Displays a warning toast notification.
 * @param {string} message - The message to display.
 * @param {Object} options - Additional options to override defaults.
 */
export const showWarningToast = (message, options = {}) => {
  toast.warn(message, {
    ...getBaseToastOptions(),
    icon: WarningIcon,
    ...options,
  });
};

/**
 * Displays a loading toast notification that can be updated.
 * @param {string} message - The message to display.
 * @param {Object} options - Additional options to override defaults.
 * @returns {string} - Toast ID for updating the toast.
 */
export const showLoadingToast = (message, options = {}) => {
  return toast.loading(message, {
    ...getBaseToastOptions(),
    autoClose: false,
    closeOnClick: false,
    draggable: false,
    ...options,
  });
};

/**
 * Updates a loading toast to success.
 * @param {string} toastId - The ID of the toast to update.
 * @param {string} message - The success message.
 * @param {Object} options - Additional options.
 */
export const updateToastToSuccess = (toastId, message, options = {}) => {
  toast.update(toastId, {
    render: message,
    type: 'success',
    icon: SuccessIcon,
    isLoading: false,
    autoClose: 5000,
    closeOnClick: true,
    draggable: true,
    ...options,
  });
};

/**
 * Updates a loading toast to error.
 * @param {string} toastId - The ID of the toast to update.
 * @param {string} message - The error message.
 * @param {Object} options - Additional options.
 */
export const updateToastToError = (toastId, message, options = {}) => {
  toast.update(toastId, {
    render: message,
    type: 'error',
    icon: ErrorIcon,
    isLoading: false,
    autoClose: 5000,
    closeOnClick: true,
    draggable: true,
    ...options,
  });
};

/**
 * Dismisses a specific toast.
 * @param {string} toastId - The ID of the toast to dismiss.
 */
export const dismissToast = (toastId) => {
  toast.dismiss(toastId);
};

/**
 * Dismisses all toasts.
 */
export const dismissAllToasts = () => {
  toast.dismiss();
};

/**
 * Shows a promise-based toast that automatically updates based on promise state.
 * @param {Promise} promise - The promise to track.
 * @param {Object} messages - Object with pending, success, and error messages.
 * @param {Object} options - Additional options.
 */
export const showPromiseToast = (promise, messages, options = {}) => {
  return toast.promise(
    promise,
    {
      pending: {
        render: messages.pending || 'Carregando...',
        ...getBaseToastOptions(),
        autoClose: false,
        closeOnClick: false,
      },
      success: {
        render: messages.success || 'Sucesso!',
        icon: SuccessIcon,
        ...getBaseToastOptions(),
      },
      error: {
        render: messages.error || 'Erro!',
        icon: ErrorIcon,
        ...getBaseToastOptions(),
      },
    },
    options
  );
};
