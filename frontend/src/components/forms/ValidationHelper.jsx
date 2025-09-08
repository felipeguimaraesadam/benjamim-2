import React from 'react';
import { AlertCircle, CheckCircle, Info } from 'lucide-react';

// Componente para exibir mensagens de validação com diferentes tipos
export const ValidationMessage = ({ type = 'error', message, className = '' }) => {
  if (!message) return null;

  const getIcon = () => {
    switch (type) {
      case 'success':
        return <CheckCircle className="w-4 h-4" />;
      case 'warning':
        return <Info className="w-4 h-4" />;
      case 'error':
      default:
        return <AlertCircle className="w-4 h-4" />;
    }
  };

  const getStyles = () => {
    switch (type) {
      case 'success':
        return 'text-green-600 bg-green-50 border-green-200';
      case 'warning':
        return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'error':
      default:
        return 'text-red-600 bg-red-50 border-red-200';
    }
  };

  return (
    <div className={`mt-1 p-2 border rounded-md flex items-center gap-2 text-sm ${getStyles()} ${className}`}>
      {getIcon()}
      <span>{message}</span>
    </div>
  );
};

// Componente para input com validação integrada
export const ValidatedInput = ({
  label,
  name,
  type = 'text',
  value,
  onChange,
  onBlur,
  error,
  success,
  warning,
  required = false,
  placeholder,
  className = '',
  inputClassName = '',
  ...props
}) => {
  const hasError = !!error;
  const hasSuccess = !!success;
  const hasWarning = !!warning;

  const getInputStyles = () => {
    if (hasError) {
      return 'border-red-500 text-red-700 focus:ring-red-500 focus:border-red-500';
    }
    if (hasSuccess) {
      return 'border-green-500 text-green-700 focus:ring-green-500 focus:border-green-500';
    }
    if (hasWarning) {
      return 'border-yellow-500 text-yellow-700 focus:ring-yellow-500 focus:border-yellow-500';
    }
    return 'border-slate-300 text-slate-700 focus:ring-primary-500 focus:border-primary-500';
  };

  return (
    <div className={className}>
      {label && (
        <label htmlFor={name} className="block mb-1.5 text-sm font-medium text-gray-700">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      <input
        id={name}
        name={name}
        type={type}
        value={value}
        onChange={onChange}
        onBlur={onBlur}
        placeholder={placeholder}
        className={`w-full px-3 py-2.5 border rounded-md shadow-sm sm:text-sm transition-colors duration-200 ${getInputStyles()} ${inputClassName}`}
        {...props}
      />
      {error && <ValidationMessage type="error" message={error} />}
      {warning && <ValidationMessage type="warning" message={warning} />}
      {success && <ValidationMessage type="success" message={success} />}
    </div>
  );
};

// Componente para select com validação integrada
export const ValidatedSelect = ({
  label,
  name,
  value,
  onChange,
  onBlur,
  options = [],
  error,
  success,
  warning,
  required = false,
  placeholder = 'Selecione uma opção',
  className = '',
  selectClassName = '',
  ...props
}) => {
  const hasError = !!error;
  const hasSuccess = !!success;
  const hasWarning = !!warning;

  const getSelectStyles = () => {
    if (hasError) {
      return 'border-red-500 text-red-700 focus:ring-red-500 focus:border-red-500';
    }
    if (hasSuccess) {
      return 'border-green-500 text-green-700 focus:ring-green-500 focus:border-green-500';
    }
    if (hasWarning) {
      return 'border-yellow-500 text-yellow-700 focus:ring-yellow-500 focus:border-yellow-500';
    }
    return 'border-slate-300 text-slate-700 focus:ring-primary-500 focus:border-primary-500';
  };

  return (
    <div className={className}>
      {label && (
        <label htmlFor={name} className="block mb-1.5 text-sm font-medium text-gray-700">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      <select
        id={name}
        name={name}
        value={value}
        onChange={onChange}
        onBlur={onBlur}
        className={`w-full px-3 py-2.5 border rounded-md shadow-sm sm:text-sm transition-colors duration-200 ${getSelectStyles()} ${selectClassName}`}
        {...props}
      >
        <option value="" disabled>
          {placeholder}
        </option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {error && <ValidationMessage type="error" message={error} />}
      {warning && <ValidationMessage type="warning" message={warning} />}
      {success && <ValidationMessage type="success" message={success} />}
    </div>
  );
};

// Hook para validação em tempo real
export const useFormValidation = (initialValues = {}, validationRules = {}) => {
  const [values, setValues] = React.useState(initialValues);
  const [errors, setErrors] = React.useState({});
  const [touched, setTouched] = React.useState({});

  // Função para validar um campo específico
  const validateField = React.useCallback((fieldName, value) => {
    const rule = validationRules[fieldName];
    if (!rule) return null;

    // Validação obrigatória
    if (rule.required && (!value || String(value).trim() === '')) {
      return rule.requiredMessage || `${fieldName} é obrigatório`;
    }

    // Validação de tipo
    if (value && rule.type) {
      switch (rule.type) {
        case 'email': {
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          if (!emailRegex.test(value)) {
            return rule.typeMessage || 'Email inválido';
          }
          break;
        }
        case 'number': {
          const numValue = parseFloat(String(value).replace(',', '.'));
          if (isNaN(numValue)) {
            return rule.typeMessage || 'Deve ser um número válido';
          }
          if (rule.min !== undefined && numValue < rule.min) {
            return rule.minMessage || `Valor mínimo é ${rule.min}`;
          }
          if (rule.max !== undefined && numValue > rule.max) {
            return rule.maxMessage || `Valor máximo é ${rule.max}`;
          }
          break;
        }
        case 'phone': {
          const phoneRegex = /^\(?\d{2}\)?[\s-]?\d{4,5}[\s-]?\d{4}$/;
          if (!phoneRegex.test(value)) {
            return rule.typeMessage || 'Telefone inválido';
          }
          break;
        }
      }
    }

    // Validação de comprimento
    if (value && rule.minLength && String(value).length < rule.minLength) {
      return rule.minLengthMessage || `Mínimo ${rule.minLength} caracteres`;
    }
    if (value && rule.maxLength && String(value).length > rule.maxLength) {
      return rule.maxLengthMessage || `Máximo ${rule.maxLength} caracteres`;
    }

    // Validação customizada
    if (rule.custom && typeof rule.custom === 'function') {
      return rule.custom(value, values);
    }

    return null;
  }, [validationRules, values]);

  // Função para validar todos os campos
  const validateAll = React.useCallback(() => {
    const newErrors = {};
    let isValid = true;

    Object.keys(validationRules).forEach(fieldName => {
      const error = validateField(fieldName, values[fieldName]);
      if (error) {
        newErrors[fieldName] = error;
        isValid = false;
      }
    });

    setErrors(newErrors);
    return isValid;
  }, [validateField, values, validationRules]);

  // Função para atualizar valor de campo
  const setValue = React.useCallback((fieldName, value) => {
    setValues(prev => ({ ...prev, [fieldName]: value }));
    
    // Validar em tempo real se o campo já foi tocado
    if (touched[fieldName]) {
      const error = validateField(fieldName, value);
      setErrors(prev => ({ ...prev, [fieldName]: error }));
    }
  }, [validateField, touched]);

  // Função para marcar campo como tocado e validar
  const markFieldAsTouched = React.useCallback((fieldName) => {
    setTouched(prev => ({ ...prev, [fieldName]: true }));
    const error = validateField(fieldName, values[fieldName]);
    setErrors(prev => ({ ...prev, [fieldName]: error }));
  }, [validateField, values]);

  // Função para resetar formulário
  const reset = React.useCallback((newValues = initialValues) => {
    setValues(newValues);
    setErrors({});
    setTouched({});
  }, [initialValues]);

  return {
    values,
    errors,
    touched,
    setValue,
    setTouched: markFieldAsTouched,
    validateField,
    validateAll,
    reset,
    isValid: Object.keys(errors).length === 0
  };
};

// Componente para exibir resumo de erros do formulário
export const FormErrorSummary = ({ errors, className = '' }) => {
  const errorEntries = Object.entries(errors).filter(([, error]) => error);
  
  if (errorEntries.length === 0) return null;

  return (
    <div className={`p-4 bg-red-50 border border-red-200 rounded-md ${className}`}>
      <div className="flex items-center mb-2">
        <AlertCircle className="w-5 h-5 text-red-600 mr-2" />
        <h3 className="text-sm font-medium text-red-800">
          Corrija os seguintes erros:
        </h3>
      </div>
      <ul className="list-disc list-inside text-sm text-red-700 space-y-1">
        {errorEntries.map(([field, error]) => (
          <li key={field}>{error}</li>
        ))}
      </ul>
    </div>
  );
};

export default {
  ValidationMessage,
  ValidatedInput,
  ValidatedSelect,
  useFormValidation,
  FormErrorSummary
};