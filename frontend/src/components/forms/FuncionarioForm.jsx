import React, { useState, useEffect } from 'react';

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
               className={`bg-gray-50 border ${errors.nome_completo ? 'border-red-500' : 'border-gray-300'} text-gray-900 sm:text-sm rounded-lg focus:ring-primary-600 focus:border-primary-600 block w-full p-2.5`} />
        {errors.nome_completo && <p className="mt-1 text-xs text-red-500">{errors.nome_completo}</p>}
      </div>
      <div>
        <label htmlFor="cargo" className="block mb-2 text-sm font-medium text-gray-900">Cargo</label>
        <input type="text" name="cargo" id="cargo" value={formData.cargo} onChange={handleChange}
               className={`bg-gray-50 border ${errors.cargo ? 'border-red-500' : 'border-gray-300'} text-gray-900 sm:text-sm rounded-lg focus:ring-primary-600 focus:border-primary-600 block w-full p-2.5`} />
        {errors.cargo && <p className="mt-1 text-xs text-red-500">{errors.cargo}</p>}
      </div>
      <div>
        <label htmlFor="salario" className="block mb-2 text-sm font-medium text-gray-900">Salário</label>
        <input type="number" name="salario" id="salario" value={formData.salario} onChange={handleChange} step="0.01"
               className={`bg-gray-50 border ${errors.salario ? 'border-red-500' : 'border-gray-300'} text-gray-900 sm:text-sm rounded-lg focus:ring-primary-600 focus:border-primary-600 block w-full p-2.5`} />
        {errors.salario && <p className="mt-1 text-xs text-red-500">{errors.salario}</p>}
      </div>
      <div>
        <label htmlFor="data_contratacao" className="block mb-2 text-sm font-medium text-gray-900">Data de Contratação</label>
        <input type="date" name="data_contratacao" id="data_contratacao" value={formData.data_contratacao} onChange={handleChange}
               className={`bg-gray-50 border ${errors.data_contratacao ? 'border-red-500' : 'border-gray-300'} text-gray-900 sm:text-sm rounded-lg focus:ring-primary-600 focus:border-primary-600 block w-full p-2.5`} />
        {errors.data_contratacao && <p className="mt-1 text-xs text-red-500">{errors.data_contratacao}</p>}
      </div>

      <div className="flex items-center justify-end space-x-3 pt-2">
        <button type="button" onClick={onCancel} disabled={isLoading}
                className="py-2 px-4 text-sm font-medium text-gray-700 bg-white rounded-lg border border-gray-200 hover:bg-gray-100 focus:ring-4 focus:outline-none focus:ring-primary-300 hover:text-gray-900 focus:z-10 disabled:opacity-50">
          Cancelar
        </button>
        <button type="submit" disabled={isLoading}
                className="py-2 px-4 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 focus:ring-4 focus:outline-none focus:ring-primary-300 disabled:bg-primary-300">
          {isLoading ? 'Salvando...' : 'Salvar'}
        </button>
      </div>
    </form>
  );
};

export default FuncionarioForm;
