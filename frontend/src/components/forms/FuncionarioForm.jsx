import React, { useState, useEffect } from 'react';

// Warning Icon for validation errors
const WarningIcon = () => (
  <svg
    className="w-4 h-4 inline mr-1"
    fill="currentColor"
    viewBox="0 0 20 20"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      fillRule="evenodd"
      d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.216 3.031-1.742 3.031H4.42c-1.526 0-2.492-1.697-1.742-3.031l5.58-9.92zM10 13a1 1 0 110-2 1 1 0 010 2zm-1.75-4.5a1.75 1.75 0 00-3.5 0v.25h3.5v-.25z"
      clipRule="evenodd"
    />
  </svg>
);

import SpinnerIcon from '../utils/SpinnerIcon'; // Import SpinnerIcon

const FuncionarioForm = ({ initialData, onSubmit, onCancel, isLoading }) => {
  const [formData, setFormData] = useState({
    nome_completo: '',
    cargo: '',
    data_contratacao: '',
    valor_diaria_padrao: '',
    valor_metro_padrao: '',
    valor_empreitada_padrao: '',
  });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (initialData) {
      setFormData({
        nome_completo: initialData.nome_completo || '',
        cargo: initialData.cargo || '',
        data_contratacao: initialData.data_contratacao
          ? initialData.data_contratacao.split('T')[0]
          : '',
        valor_diaria_padrao: initialData.valor_diaria_padrao || '',
        valor_metro_padrao: initialData.valor_metro_padrao || '',
        valor_empreitada_padrao: initialData.valor_empreitada_padrao || '',
      });
    } else {
      // Reset form for new entry
      setFormData({
        nome_completo: '',
        cargo: '',
        data_contratacao: '',
        valor_diaria_padrao: '',
        valor_metro_padrao: '',
        valor_empreitada_padrao: '',
      });
    }
  }, [initialData]);

  const handleChange = e => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: null }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.nome_completo.trim())
      newErrors.nome_completo = 'Nome completo é obrigatório.';
    if (!formData.cargo.trim()) newErrors.cargo = 'Cargo é obrigatório.';
    if (!formData.data_contratacao)
      newErrors.data_contratacao = 'Data de contratação é obrigatória.';
    // Optional fields, so no specific validation unless they have values
    if (
      formData.valor_diaria_padrao &&
      (isNaN(parseFloat(formData.valor_diaria_padrao)) ||
        parseFloat(formData.valor_diaria_padrao) < 0)
    ) {
      newErrors.valor_diaria_padrao =
        'Valor da diária deve ser um número positivo.';
    }
    if (
      formData.valor_metro_padrao &&
      (isNaN(parseFloat(formData.valor_metro_padrao)) ||
        parseFloat(formData.valor_metro_padrao) < 0)
    ) {
      newErrors.valor_metro_padrao =
        'Valor do metro deve ser um número positivo.';
    }
    if (
      formData.valor_empreitada_padrao &&
      (isNaN(parseFloat(formData.valor_empreitada_padrao)) ||
        parseFloat(formData.valor_empreitada_padrao) < 0)
    ) {
      newErrors.valor_empreitada_padrao =
        'Valor da empreitada deve ser um número positivo.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = e => {
    e.preventDefault();
    if (validateForm()) {
      const dataToSubmit = {
        ...formData,
        data_contratacao: formData.data_contratacao || null,
        valor_diaria_padrao: formData.valor_diaria_padrao
          ? parseFloat(formData.valor_diaria_padrao).toFixed(2)
          : null,
        valor_metro_padrao: formData.valor_metro_padrao
          ? parseFloat(formData.valor_metro_padrao).toFixed(2)
          : null,
        valor_empreitada_padrao: formData.valor_empreitada_padrao
          ? parseFloat(formData.valor_empreitada_padrao).toFixed(2)
          : null,
      };
      onSubmit(dataToSubmit);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 md:space-y-6">
      <div>
        <label
          htmlFor="nome_completo"
          className="block mb-2 text-sm font-medium text-gray-900"
        >
          Nome Completo
        </label>
        <input
          type="text"
          name="nome_completo"
          id="nome_completo"
          value={formData.nome_completo}
          onChange={handleChange}
          className={`bg-gray-50 border ${errors.nome_completo ? 'border-red-500' : 'border-gray-300'} text-gray-900 sm:text-sm rounded-md focus:ring-primary-500 focus:border-primary-500 block w-full px-3 py-2`}
        />
        {errors.nome_completo && (
          <p className="mt-1 text-sm text-red-600 flex items-center">
            <WarningIcon /> {errors.nome_completo}
          </p>
        )}
      </div>
      <div>
        <label
          htmlFor="cargo"
          className="block mb-2 text-sm font-medium text-gray-900"
        >
          Cargo
        </label>
        <input
          type="text"
          name="cargo"
          id="cargo"
          value={formData.cargo}
          onChange={handleChange}
          className={`bg-gray-50 border ${errors.cargo ? 'border-red-500' : 'border-gray-300'} text-gray-900 sm:text-sm rounded-md focus:ring-primary-500 focus:border-primary-500 block w-full px-3 py-2`}
        />
        {errors.cargo && (
          <p className="mt-1 text-sm text-red-600 flex items-center">
            <WarningIcon /> {errors.cargo}
          </p>
        )}
      </div>
      <div>
        <label
          htmlFor="data_contratacao"
          className="block mb-2 text-sm font-medium text-gray-900"
        >
          Data de Contratação
        </label>
        <input
          type="date"
          name="data_contratacao"
          id="data_contratacao"
          value={formData.data_contratacao}
          onChange={handleChange}
          className={`bg-gray-50 border ${errors.data_contratacao ? 'border-red-500' : 'border-gray-300'} text-gray-900 sm:text-sm rounded-md focus:ring-primary-500 focus:border-primary-500 block w-full px-3 py-2`}
        />
        {errors.data_contratacao && (
          <p className="mt-1 text-sm text-red-600 flex items-center">
            <WarningIcon /> {errors.data_contratacao}
          </p>
        )}
      </div>

      <div className="pt-4">
        <h3 className="mb-3 text-md font-medium text-gray-800">
          Valores Padrão de Pagamento (Opcional)
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label
              htmlFor="valor_diaria_padrao"
              className="block mb-2 text-sm font-medium text-gray-900"
            >
              Valor Diária Padrão (R$)
            </label>
            <input
              type="number"
              name="valor_diaria_padrao"
              id="valor_diaria_padrao"
              value={formData.valor_diaria_padrao}
              onChange={handleChange}
              step="0.01"
              className={`bg-gray-50 border ${errors.valor_diaria_padrao ? 'border-red-500' : 'border-gray-300'} text-gray-900 sm:text-sm rounded-md focus:ring-primary-500 focus:border-primary-500 block w-full px-3 py-2`}
            />
            {errors.valor_diaria_padrao && (
              <p className="mt-1 text-sm text-red-600 flex items-center">
                <WarningIcon /> {errors.valor_diaria_padrao}
              </p>
            )}
          </div>
          <div>
            <label
              htmlFor="valor_metro_padrao"
              className="block mb-2 text-sm font-medium text-gray-900"
            >
              Valor Metro Padrão (R$)
            </label>
            <input
              type="number"
              name="valor_metro_padrao"
              id="valor_metro_padrao"
              value={formData.valor_metro_padrao}
              onChange={handleChange}
              step="0.01"
              className={`bg-gray-50 border ${errors.valor_metro_padrao ? 'border-red-500' : 'border-gray-300'} text-gray-900 sm:text-sm rounded-md focus:ring-primary-500 focus:border-primary-500 block w-full px-3 py-2`}
            />
            {errors.valor_metro_padrao && (
              <p className="mt-1 text-sm text-red-600 flex items-center">
                <WarningIcon /> {errors.valor_metro_padrao}
              </p>
            )}
          </div>
          <div>
            <label
              htmlFor="valor_empreitada_padrao"
              className="block mb-2 text-sm font-medium text-gray-900"
            >
              Valor Empreitada Padrão (R$)
            </label>
            <input
              type="number"
              name="valor_empreitada_padrao"
              id="valor_empreitada_padrao"
              value={formData.valor_empreitada_padrao}
              onChange={handleChange}
              step="0.01"
              className={`bg-gray-50 border ${errors.valor_empreitada_padrao ? 'border-red-500' : 'border-gray-300'} text-gray-900 sm:text-sm rounded-md focus:ring-primary-500 focus:border-primary-500 block w-full px-3 py-2`}
            />
            {errors.valor_empreitada_padrao && (
              <p className="mt-1 text-sm text-red-600 flex items-center">
                <WarningIcon /> {errors.valor_empreitada_padrao}
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="flex items-center justify-end space-x-3 pt-6">
        <button
          type="button"
          onClick={onCancel}
          disabled={isLoading}
          className="py-2 px-4 text-sm font-medium text-gray-800 bg-gray-200 rounded-md hover:bg-gray-300 focus:ring-4 focus:outline-none focus:ring-gray-300 disabled:opacity-50"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={isLoading}
          className="py-2 px-4 text-sm font-medium text-white bg-primary-600 rounded-md hover:bg-primary-700 focus:ring-4 focus:outline-none focus:ring-primary-300 disabled:bg-primary-300 flex items-center justify-center"
        >
          {isLoading ? <SpinnerIcon className="w-5 h-5 mr-2" /> : null}
          {isLoading
            ? 'Salvando...'
            : initialData
              ? 'Atualizar Funcionário'
              : 'Salvar Funcionário'}
        </button>
      </div>
    </form>
  );
};

export default FuncionarioForm;
