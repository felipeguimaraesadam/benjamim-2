import React, { useState, useEffect } from 'react';

// Warning Icon for validation errors
const WarningIcon = ({ className = "w-4 h-4 inline mr-1" }) => ( // Added className prop with default
  <svg className={className} fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.216 3.031-1.742 3.031H4.42c-1.526 0-2.492-1.697-1.742-3.031l5.58-9.92zM10 13a1 1 0 110-2 1 1 0 010 2zm-1.75-4.5a1.75 1.75 0 00-3.5 0v.25h3.5v-.25z" clipRule="evenodd" />
  </svg>
);

// Note: isLoading prop is passed from MateriaisPage (as isLoadingForm)
// We can rename it to isSubmitting internally or use it as is.
// For consistency with the subtask, let's assume MaterialForm itself doesn't define a new 'isSubmitting'
// but relies on the 'isLoading' prop passed from the parent page which indicates submission state.
const MaterialForm = ({ initialData, onSubmit, onCancel, isLoading }) => {
  const [formData, setFormData] = useState({
    nome: '',
    unidade_medida: 'un', // Default unit
    quantidade_em_estoque: '0.00', // Added
    nivel_minimo_estoque: 0,   // Added
  });
  const [errors, setErrors] = useState({});

  // Updated labels for buttons
  const unidadeMedidaOptions = [
    { value: 'un', label: 'UN' },
    { value: 'm²', label: 'M²' },
    { value: 'kg', label: 'KG' },
    { value: 'saco', label: 'SACO' },
  ];

  useEffect(() => {
    if (initialData) {
      setFormData({
        nome: initialData.nome || '',
        unidade_medida: initialData.unidade_medida || 'un',
        quantidade_em_estoque: initialData.quantidade_em_estoque || '0.00', // Added
        nivel_minimo_estoque: initialData.nivel_minimo_estoque || 0,     // Added
      });
    } else {
      // Reset form for new entry
      setFormData({
        nome: '',
        unidade_medida: 'un',
        quantidade_em_estoque: '0.00', // Added
        nivel_minimo_estoque: 0,   // Added
      });
    }
  }, [initialData]);

  const handleChange = (e) => {
    const { name, value, type } = e.target; // Added type
    setFormData(prev => ({
      ...prev,
      // Parse numbers if input type is number, otherwise use value directly
      [name]: type === 'number' ? (value === '' ? '' : parseFloat(value)) : value
    }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: null }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.nome.trim()) newErrors.nome = 'Nome do material é obrigatório.';
    if (!formData.unidade_medida) newErrors.unidade_medida = 'Unidade de medida é obrigatória.';
    else if (!unidadeMedidaOptions.find(opt => opt.value === formData.unidade_medida)) {
        newErrors.unidade_medida = 'Selecione uma unidade de medida válida.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    // e.preventDefault(); // Not strictly necessary for type="button" but harmless if kept
    if (e && typeof e.preventDefault === 'function') { // Keep if e might sometimes be an event
        e.preventDefault();
    }
    if (validateForm()) {
      // Prepare data for submission, ensuring correct types
      const dataToSubmit = {
        ...formData,
        quantidade_em_estoque: parseFloat(formData.quantidade_em_estoque).toFixed(2), // Ensure it's a string with 2 decimal places
        nivel_minimo_estoque: parseInt(formData.nivel_minimo_estoque, 10) || 0, // Ensure it's an integer
      };
      onSubmit(dataToSubmit);
    }
  };

  return (
    <div className="space-y-4 md:space-y-6"> {/* Changed from form to div, removed onSubmit */}
      <div>
        <label htmlFor="nome" className="block mb-2 text-sm font-medium text-gray-900">Nome do Material</label>
        <input type="text" name="nome" id="nome" value={formData.nome} onChange={handleChange}
               className={`bg-gray-50 border ${errors.nome ? 'border-red-500' : 'border-gray-300'} text-gray-900 sm:text-sm rounded-md focus:ring-primary-500 focus:border-primary-500 block w-full px-3 py-2`} />
        {errors.nome && <p className="mt-1 text-sm text-red-600 flex items-center"><WarningIcon /> {errors.nome}</p>}
      </div>

      <div>
        <label className="block mb-1 text-sm font-medium text-gray-900">Unidade de Medida</label>
        <div className="flex space-x-2 mt-1">
          {unidadeMedidaOptions.map(unit => (
            <button
              type="button"
              key={unit.value}
              onClick={() => {
                setFormData(prev => ({ ...prev, unidade_medida: unit.value }));
                if (errors.unidade_medida) { // Clear error if one was set
                  setErrors(prev => ({ ...prev, unidade_medida: null }));
                }
              }}
              className={`py-2 px-4 rounded-md border text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-primary-500
                ${formData.unidade_medida === unit.value
                  ? 'bg-primary-600 text-white border-primary-600 hover:bg-primary-700'
                  : 'bg-gray-100 text-gray-700 border-gray-300 hover:bg-gray-200 hover:border-gray-400'
                }`}
            >
              {unit.label}
            </button>
          ))}
        </div>
        {errors.unidade_medida && <p className="mt-1 text-sm text-red-600 flex items-center"><WarningIcon /> {errors.unidade_medida}</p>}
      </div>

      <div>
        <label htmlFor="quantidade_em_estoque" className="block mb-2 text-sm font-medium text-gray-900">Quantidade em Estoque</label>
        <input
          type="number"
          name="quantidade_em_estoque"
          id="quantidade_em_estoque"
          value={formData.quantidade_em_estoque}
          onChange={handleChange}
          min="0"
          step="0.01"
          required
          className="bg-gray-50 border border-gray-300 text-gray-900 sm:text-sm rounded-md focus:ring-primary-500 focus:border-primary-500 block w-full px-3 py-2"
        />
        {/* Basic validation message example, can be expanded in validateForm if needed */}
        {errors.quantidade_em_estoque && <p className="mt-1 text-sm text-red-600 flex items-center"><WarningIcon /> {errors.quantidade_em_estoque}</p>}
      </div>

      <div>
        <label htmlFor="nivel_minimo_estoque" className="block mb-2 text-sm font-medium text-gray-900">Nível Mínimo de Estoque para Alerta</label>
        <input
          type="number"
          name="nivel_minimo_estoque"
          id="nivel_minimo_estoque"
          value={formData.nivel_minimo_estoque}
          onChange={handleChange}
          min="0"
          step="1"
          required
          className="bg-gray-50 border border-gray-300 text-gray-900 sm:text-sm rounded-md focus:ring-primary-500 focus:border-primary-500 block w-full px-3 py-2"
        />
        <p className="mt-1 text-xs text-gray-500">Defina como 0 para não receber alertas para este material.</p>
        {errors.nivel_minimo_estoque && <p className="mt-1 text-sm text-red-600 flex items-center"><WarningIcon /> {errors.nivel_minimo_estoque}</p>}
      </div>

      <div className="flex items-center justify-end space-x-3 pt-2">
        <button type="button" onClick={onCancel} disabled={isLoading}
                className="py-2 px-4 text-sm font-medium text-gray-800 bg-gray-200 rounded-md hover:bg-gray-300 focus:ring-4 focus:outline-none focus:ring-gray-300 disabled:opacity-50">
          Cancelar
        </button>
        <button type="button" onClick={handleSubmit} disabled={isLoading}
                className="py-2 px-4 text-sm font-medium text-white bg-primary-600 rounded-md hover:bg-primary-700 focus:ring-4 focus:outline-none focus:ring-primary-300 disabled:bg-primary-300 flex items-center justify-center">
          {isLoading ? <SpinnerIcon className="w-5 h-5 mr-2" /> : null}
          {isLoading ? 'Salvando...' : (initialData && initialData.id ? 'Atualizar Material' : 'Salvar Material')}
        </button>
      </div>
    </div> // Changed from /form to /div
  );
};

export default MaterialForm;
