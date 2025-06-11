import React, { useState, useEffect } from 'react';

// Warning Icon for validation errors
const WarningIcon = () => (
  <svg className="w-4 h-4 inline mr-1" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.216 3.031-1.742 3.031H4.42c-1.526 0-2.492-1.697-1.742-3.031l5.58-9.92zM10 13a1 1 0 110-2 1 1 0 010 2zm-1.75-4.5a1.75 1.75 0 00-3.5 0v.25h3.5v-.25z" clipRule="evenodd" />
  </svg>
);

const MaterialForm = ({ initialData, onSubmit, onCancel, isLoading }) => {
  const [formData, setFormData] = useState({
    nome: '',
    unidade_medida: 'un', // Default unit
  });
  const [errors, setErrors] = useState({});

  const unidadeMedidaOptions = [
    { value: 'un', label: 'Unidade (un)' },
    { value: 'm²', label: 'Metro Quadrado (m²)' },
    { value: 'kg', label: 'Quilograma (kg)' },
    { value: 'saco', label: 'Saco (saco)' },
  ];

  useEffect(() => {
    if (initialData) {
      setFormData({
        nome: initialData.nome || '',
        unidade_medida: initialData.unidade_medida || 'un',
      });
    } else {
      // Reset form for new entry
      setFormData({
        nome: '',
        unidade_medida: 'un',
      });
    }
  }, [initialData]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
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
    e.preventDefault();
    if (validateForm()) {
      onSubmit(formData);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 md:space-y-6">
      <div>
        <label htmlFor="nome" className="block mb-2 text-sm font-medium text-gray-900">Nome do Material</label>
        <input type="text" name="nome" id="nome" value={formData.nome} onChange={handleChange}
               className={`bg-gray-50 border ${errors.nome ? 'border-red-500' : 'border-gray-300'} text-gray-900 sm:text-sm rounded-md focus:ring-primary-500 focus:border-primary-500 block w-full px-3 py-2`} />
        {errors.nome && <p className="mt-1 text-sm text-red-600 flex items-center"><WarningIcon /> {errors.nome}</p>}
      </div>

      <div>
        <label htmlFor="unidade_medida" className="block mb-2 text-sm font-medium text-gray-900">Unidade de Medida</label>
        <select name="unidade_medida" id="unidade_medida" value={formData.unidade_medida} onChange={handleChange}
                className={`bg-gray-50 border ${errors.unidade_medida ? 'border-red-500' : 'border-gray-300'} text-gray-900 sm:text-sm rounded-md focus:ring-primary-500 focus:border-primary-500 block w-full px-3 py-2`}>
          {unidadeMedidaOptions.map(option => (
            <option key={option.value} value={option.value}>{option.label}</option>
          ))}
        </select>
        {errors.unidade_medida && <p className="mt-1 text-sm text-red-600 flex items-center"><WarningIcon /> {errors.unidade_medida}</p>}
      </div>

      <div className="flex items-center justify-end space-x-3 pt-2">
        <button type="button" onClick={onCancel} disabled={isLoading}
                className="py-2 px-4 text-sm font-medium text-gray-800 bg-gray-200 rounded-md hover:bg-gray-300 focus:ring-4 focus:outline-none focus:ring-gray-300 disabled:opacity-50">
          Cancelar
        </button>
        <button type="submit" disabled={isLoading}
                className="py-2 px-4 text-sm font-medium text-white bg-primary-600 rounded-md hover:bg-primary-700 focus:ring-4 focus:outline-none focus:ring-primary-300 disabled:bg-primary-300">
          {isLoading ? 'Salvando...' : 'Salvar'}
        </button>
      </div>
    </form>
  );
};

export default MaterialForm;
