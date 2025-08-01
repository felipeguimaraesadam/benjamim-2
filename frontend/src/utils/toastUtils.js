import { toast } from 'react-toastify';

// Common options, but icon will be overridden explicitly below
const baseToastOptions = {
  position: 'top-right',
  autoClose: 5000,
  hideProgressBar: false,
  closeOnClick: true,
  pauseOnHover: true,
  draggable: true,
  progress: undefined,
  theme: 'light',
  // icon: () => null // This can be removed from here if explicitly set in each function
};

/**
 * Displays a success toast notification.
 * @param {string} message - The message to display.
 */
export const showSuccessToast = message => {
  toast.success(message, {
    ...baseToastOptions,
    icon: () => null,
  });
};

/**
 * Displays an error toast notification.
 * @param {string} message - The message to display.
 */
export const showErrorToast = message => {
  toast.error(message, {
    ...baseToastOptions,
    icon: () => null,
  });
};

/**
 * Displays an info toast notification.
 * @param {string} message - The message to display.
 */
export const showInfoToast = message => {
  toast.info(message, {
    ...baseToastOptions,
    icon: () => null,
  });
};

/**
 * Displays a warning toast notification.
 * @param {string} message - The message to display.
 */
export const showWarningToast = message => {
  toast.warn(message, {
    ...baseToastOptions,
    icon: () => null,
  });
};
