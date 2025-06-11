import React, { useState, useEffect } from 'react';

// Warning Icon for validation errors
const WarningIcon = ({ className = "w-4 h-4 inline mr-1" }) => ( // Added className prop with default
  <svg className={className} fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.216 3.031-1.742 3.031H4.42c-1.526 0-2.492-1.697-1.742-3.031l5.58-9.92zM10 13a1 1 0 110-2 1 1 0 010 2zm-1.75-4.5a1.75 1.75 0 00-3.5 0v.25h3.5v-.25z" clipRule="evenodd" />
  </svg>
);

const ObraForm = ({ initialData, onSubmit, onCancel, isLoading }) => {
  const [formData, setFormData] = useState({
    nome_obra: '',
    endereco_completo: '',
    cidade: '',
    status: 'Planejada', // Default status
    data_inicio: '',
    data_prevista_fim: '',
    data_real_fim: '',
  });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (initialData) {
      // Format dates for input type="date" (YYYY-MM-DD)
      setFormData({
        nome_obra: initialData.nome_obra || '',
        endereco_completo: initialData.endereco_completo || '',
        cidade: initialData.cidade || '',
        status: initialData.status || 'Planejada',
        data_inicio: initialData.data_inicio ? initialData.data_inicio.split('T')[0] : '',
        data_prevista_fim: initialData.data_prevista_fim ? initialData.data_prevista_fim.split('T')[0] : '',
        data_real_fim: initialData.data_real_fim ? initialData.data_real_fim.split('T')[0] : '',
      });
    } else {
      // Reset form for new entry
      setFormData({
        nome_obra: '',
        endereco_completo: '',
        cidade: '',
        status: 'Planejada',
        data_inicio: '',
        data_prevista_fim: '',
        data_real_fim: '',
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
    if (!formData.nome_obra.trim()) newErrors.nome_obra = 'Nome da obra é obrigatório.';
    if (!formData.endereco_completo.trim()) newErrors.endereco_completo = 'Endereço é obrigatório.';
    if (!formData.cidade.trim()) newErrors.cidade = 'Cidade é obrigatória.';
    if (!formData.status) newErrors.status = 'Status é obrigatório.';
    // Basic date validation: data_inicio should not be after data_prevista_fim if both are set
    if (formData.data_inicio && formData.data_prevista_fim && formData.data_inicio > formData.data_prevista_fim) {
        newErrors.data_prevista_fim = 'Data prevista de fim não pode ser anterior à data de início.';
    }
    // data_real_fim should not be before data_inicio if both are set
     if (formData.data_inicio && formData.data_real_fim && formData.data_real_fim < formData.data_inicio) {
        newErrors.data_real_fim = 'Data real de fim não pode ser anterior à data de início.';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validateForm()) {
      // Prepare data: ensure empty date strings are null for the backend if necessary
      const dataToSubmit = {
        ...formData,
        data_inicio: formData.data_inicio || null,
        data_prevista_fim: formData.data_prevista_fim || null,
        data_real_fim: formData.data_real_fim || null,
      };
      onSubmit(dataToSubmit);
    }
  };

  const statusOptions = [
    { value: 'Planejada', label: 'Planejada' },
    { value: 'Em Andamento', label: 'Em Andamento' },
    { value: 'Concluída', label: 'Concluída' },
    { value: 'Cancelada', label: 'Cancelada' },
  ];

  return (
    <form onSubmit={handleSubmit} className="space-y-4 md:space-y-6">
      <div>
        <label htmlFor="nome_obra" className="block mb-2 text-sm font-medium text-gray-900">Nome da Obra</label>
        <input type="text" name="nome_obra" id="nome_obra" value={formData.nome_obra} onChange={handleChange}
               className={`bg-gray-50 border ${errors.nome_obra ? 'border-red-500' : 'border-gray-300'} text-gray-900 sm:text-sm rounded-md focus:ring-primary-500 focus:border-primary-500 block w-full px-3 py-2`} />
        {errors.nome_obra && <p className="mt-1 text-sm text-red-600 flex items-center"><WarningIcon /> {errors.nome_obra}</p>}
      </div>
      <div>
        <label htmlFor="endereco_completo" className="block mb-2 text-sm font-medium text-gray-900">Endereço Completo</label>
        <textarea name="endereco_completo" id="endereco_completo" value={formData.endereco_completo} onChange={handleChange} rows="3"
                  className={`bg-gray-50 border ${errors.endereco_completo ? 'border-red-500' : 'border-gray-300'} text-gray-900 sm:text-sm rounded-md focus:ring-primary-500 focus:border-primary-500 block w-full px-3 py-2`}></textarea>
        {errors.endereco_completo && <p className="mt-1 text-sm text-red-600 flex items-center"><WarningIcon /> {errors.endereco_completo}</p>}
      </div>
      <div>
        <label htmlFor="cidade" className="block mb-2 text-sm font-medium text-gray-900">Cidade</label>
        <input type="text" name="cidade" id="cidade" value={formData.cidade} onChange={handleChange}
               className={`bg-gray-50 border ${errors.cidade ? 'border-red-500' : 'border-gray-300'} text-gray-900 sm:text-sm rounded-md focus:ring-primary-500 focus:border-primary-500 block w-full px-3 py-2`} />
        {errors.cidade && <p className="mt-1 text-sm text-red-600 flex items-center"><WarningIcon /> {errors.cidade}</p>}
      </div>
      <div>
        <label htmlFor="status" className="block mb-2 text-sm font-medium text-gray-900">Status</label>
        <select name="status" id="status" value={formData.status} onChange={handleChange}
                className={`bg-gray-50 border ${errors.status ? 'border-red-500' : 'border-gray-300'} text-gray-900 sm:text-sm rounded-md focus:ring-primary-500 focus:border-primary-500 block w-full px-3 py-2`}>
          {statusOptions.map(option => (
            <option key={option.value} value={option.value}>{option.label}</option>
          ))}
        </select>
        {errors.status && <p className="mt-1 text-sm text-red-600 flex items-center"><WarningIcon /> {errors.status}</p>}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label htmlFor="data_inicio" className="block mb-2 text-sm font-medium text-gray-900">Data Início</label>
          <input type="date" name="data_inicio" id="data_inicio" value={formData.data_inicio} onChange={handleChange}
                 className="bg-gray-50 border border-gray-300 text-gray-900 sm:text-sm rounded-md focus:ring-primary-500 focus:border-primary-500 block w-full px-3 py-2" />
        </div>
        <div>
          <label htmlFor="data_prevista_fim" className="block mb-2 text-sm font-medium text-gray-900">Data Prev. Fim</label>
          <input type="date" name="data_prevista_fim" id="data_prevista_fim" value={formData.data_prevista_fim} onChange={handleChange}
                 className={`bg-gray-50 border ${errors.data_prevista_fim ? 'border-red-500' : 'border-gray-300'} text-gray-900 sm:text-sm rounded-md focus:ring-primary-500 focus:border-primary-500 block w-full px-3 py-2`} />
          {errors.data_prevista_fim && <p className="mt-1 text-sm text-red-600 flex items-center"><WarningIcon /> {errors.data_prevista_fim}</p>}
        </div>
        <div>
          <label htmlFor="data_real_fim" className="block mb-2 text-sm font-medium text-gray-900">Data Real Fim</label>
          <input type="date" name="data_real_fim" id="data_real_fim" value={formData.data_real_fim} onChange={handleChange}
                 className={`bg-gray-50 border ${errors.data_real_fim ? 'border-red-500' : 'border-gray-300'} text-gray-900 sm:text-sm rounded-md focus:ring-primary-500 focus:border-primary-500 block w-full px-3 py-2`} />
          {errors.data_real_fim && <p className="mt-1 text-sm text-red-600 flex items-center"><WarningIcon /> {errors.data_real_fim}</p>}
        </div>
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

export default ObraForm;
