// frontend/src/utils/toastUtils.js
import { toast } from 'react-toastify';

/**
 * Displays a success toast notification.
 * @param {string} message - The message to display.
 */
export const showSuccessToast = (message) => {
  toast.success(message, {
    position: "top-right",
    autoClose: 5000,
    hideProgressBar: false,
    closeOnClick: true,
    pauseOnHover: true,
    draggable: true,
    progress: undefined,
    theme: "light",
    icon: false, // Add this line to disable the default icon
    // You can add more default options here if needed
  });
};

/**
 * Displays an error toast notification.
 * @param {string} message - The message to display.
 */
export const showErrorToast = (message) => {
  toast.error(message, {
    position: "top-right",
    autoClose: 5000,
    hideProgressBar: false,
    closeOnClick: true,
    pauseOnHover: true,
    draggable: true,
    progress: undefined,
    theme: "light",
  });
};

/**
 * Displays an info toast notification.
 * @param {string} message - The message to display.
 */
export const showInfoToast = (message) => {
  toast.info(message, {
    position: "top-right",
    autoClose: 5000,
    hideProgressBar: false,
    closeOnClick: true,
    pauseOnHover: true,
    draggable: true,
    progress: undefined,
    theme: "light",
  });
};

/**
 * Displays a warning toast notification.
 * @param {string} message - The message to display.
 */
export const showWarningToast = (message) => {
  toast.warn(message, {
    position: "top-right",
    autoClose: 5000,
    hideProgressBar: false,
    closeOnClick: true,
    pauseOnHover: true,
    draggable: true,
    progress: undefined,
    theme: "light",
  });
};
