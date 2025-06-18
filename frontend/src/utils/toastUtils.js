import { toast } from 'react-toastify';

const toastOptions = {
  position: "top-right",
  autoClose: 5000,
  hideProgressBar: false,
  closeOnClick: true,
  pauseOnHover: true,
  draggable: true,
  progress: undefined,
  theme: "light",
  icon: () => null // Correção: Fornece um componente nulo para o ícone.
};

/**
 * Displays a success toast notification.
 * @param {string} message - The message to display.
 */
export const showSuccessToast = (message) => {
  toast.success(message, toastOptions);
};

/**
 * Displays an error toast notification.
 * @param {string} message - The message to display.
 */
export const showErrorToast = (message) => {
  toast.error(message, toastOptions);
};

/**
 * Displays an info toast notification.
 * @param {string} message - The message to display.
 */
export const showInfoToast = (message) => {
  toast.info(message, toastOptions);
};

/**
 * Displays a warning toast notification.
 * @param {string} message - The message to display.
 */
export const showWarningToast = (message) => {
  toast.warn(message, toastOptions);
};
