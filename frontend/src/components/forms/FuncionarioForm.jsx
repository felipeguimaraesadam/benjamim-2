import React, { useState, useEffect } from 'react';

// Warning Icon for validation errors
const WarningIcon = () => (
  <svg className="w-4 h-4 inline mr-1" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.216 3.031-1.742 3.031H4.42c-1.526 0-2.492-1.697-1.742-3.031l5.58-9.92zM10 13a1 1 0 110-2 1 1 0 010 2zm-1.75-4.5a1.75 1.75 0 00-3.5 0v.25h3.5v-.25z" clipRule="evenodd" />
  </svg>
);

const FuncionarioForm = ({ initialData, onSubmit, onCancel, isLoading }) => {
  const [formData, setFormData] = useState({
    nome_completo: '',
    cargo: '',
    salario: '',
    data_contratacao: '',
  });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (initialData) {
      setFormData({
        nome_completo: initialData.nome_completo || '',
        cargo: initialData.cargo || '',
        salario: initialData.salario || '',
        data_contratacao: initialData.data_contratacao ? initialData.data_contratacao.split('T')[0] : '',
      });
    } else {
      // Reset form for new entry
      setFormData({
        nome_completo: '',
        cargo: '',
        salario: '',
        data_contratacao: '',
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
    if (!formData.nome_completo.trim()) newErrors.nome_completo = 'Nome completo é obrigatório.';
    if (!formData.cargo.trim()) newErrors.cargo = 'Cargo é obrigatório.';
    if (!formData.salario || parseFloat(formData.salario) <= 0) {
      newErrors.salario = 'Salário deve ser um valor positivo.';
    } else if (isNaN(parseFloat(formData.salario))) {
        newErrors.salario = 'Salário deve ser um número válido.';
    }
    if (!formData.data_contratacao) newErrors.data_contratacao = 'Data de contratação é obrigatória.';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validateForm()) {
      const dataToSubmit = {
        ...formData,
        salario: parseFloat(formData.salario).toFixed(2), // Ensure two decimal places for currency
        data_contratacao: formData.data_contratacao || null,
      };
      onSubmit(dataToSubmit);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 md:space-y-6">
      <div>
        <label htmlFor="nome_completo" className="block mb-2 text-sm font-medium text-gray-900">Nome Completo</label>
        <input type="text" name="nome_completo" id="nome_completo" value={formData.nome_completo} onChange={handleChange}
               className={`bg-gray-50 border ${errors.nome_completo ? 'border-red-500' : 'border-gray-300'} text-gray-900 sm:text-sm rounded-md focus:ring-primary-500 focus:border-primary-500 block w-full px-3 py-2`} />
        {errors.nome_completo && <p className="mt-1 text-sm text-red-600 flex items-center"><WarningIcon /> {errors.nome_completo}</p>}
      </div>
      <div>
        <label htmlFor="cargo" className="block mb-2 text-sm font-medium text-gray-900">Cargo</label>
        <input type="text" name="cargo" id="cargo" value={formData.cargo} onChange={handleChange}
               className={`bg-gray-50 border ${errors.cargo ? 'border-red-500' : 'border-gray-300'} text-gray-900 sm:text-sm rounded-md focus:ring-primary-500 focus:border-primary-500 block w-full px-3 py-2`} />
        {errors.cargo && <p className="mt-1 text-sm text-red-600 flex items-center"><WarningIcon /> {errors.cargo}</p>}
      </div>
      <div>
        <label htmlFor="salario" className="block mb-2 text-sm font-medium text-gray-900">Salário</label>
        <input type="number" name="salario" id="salario" value={formData.salario} onChange={handleChange} step="0.01"
               className={`bg-gray-50 border ${errors.salario ? 'border-red-500' : 'border-gray-300'} text-gray-900 sm:text-sm rounded-md focus:ring-primary-500 focus:border-primary-500 block w-full px-3 py-2`} />
        {errors.salario && <p className="mt-1 text-sm text-red-600 flex items-center"><WarningIcon /> {errors.salario}</p>}
      </div>
      <div>
        <label htmlFor="data_contratacao" className="block mb-2 text-sm font-medium text-gray-900">Data de Contratação</label>
        <input type="date" name="data_contratacao" id="data_contratacao" value={formData.data_contratacao} onChange={handleChange}
               className={`bg-gray-50 border ${errors.data_contratacao ? 'border-red-500' : 'border-gray-300'} text-gray-900 sm:text-sm rounded-md focus:ring-primary-500 focus:border-primary-500 block w-full px-3 py-2`} />
        {errors.data_contratacao && <p className="mt-1 text-sm text-red-600 flex items-center"><WarningIcon /> {errors.data_contratacao}</p>}
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

export default FuncionarioForm;
