import React, { useState, useEffect } from 'react';
import * as api from '../../services/api'; // Adjust path as needed
import FuncionarioAutocomplete from './FuncionarioAutocomplete';
import FuncionarioAutocompleteMultiple from './FuncionarioAutocompleteMultiple';

// Warning Icon for validation errors
const WarningIcon = (
  { className = 'w-4 h-4 inline mr-1' } // Added className prop with default
) => (
  <svg
    className={className}
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

const EquipeForm = ({ initialData, onSubmit, onCancel, isLoading }) => {
  const [formData, setFormData] = useState({
    nome_equipe: '',
    descricao: '',
    lider: null, // Stores Funcionario object
    membros: [], // Stores array of Funcionario objects
  });
  const [errors, setErrors] = useState({});



  useEffect(() => {
    if (initialData) {
      setFormData({
        nome_equipe: initialData.nome_equipe || '',
        descricao: initialData.descricao || '',
        lider: initialData.lider || null,
        membros: initialData.membros || [],
      });
    } else {
      setFormData({
        nome_equipe: '',
        descricao: '',
        lider: null,
        membros: [],
      });
    }
  }, [initialData]);

  const handleChange = e => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: null }));
    }
  };

  const handleLiderSelect = funcionario => {
    setFormData(prev => ({
      ...prev,
      lider: funcionario,
    }));
    if (errors.lider) {
      setErrors(prev => ({ ...prev, lider: null }));
    }
  };

  const handleMembrosSelect = funcionarios => {
    setFormData(prev => ({
      ...prev,
      membros: funcionarios,
    }));
    if (errors.membros) {
      setErrors(prev => ({ ...prev, membros: null }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.nome_equipe.trim())
      newErrors.nome_equipe = 'Nome da equipe é obrigatório.';
    // Lider can be optional depending on requirements, for now, let's not make it mandatory in form
    // if (!formData.lider) newErrors.lider = 'Líder da equipe é obrigatório.';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };



  const handleSubmit = e => {
    e.preventDefault();
    if (validateForm()) {
      const dataToSubmit = {
        nome_equipe: formData.nome_equipe,
        descricao: formData.descricao,
        lider: formData.lider ? formData.lider.id : null,
        membros: formData.membros.map(funcionario => funcionario.id),
      };
      onSubmit(dataToSubmit);
    }
  };

  if (errors.form) {
    return <p className="text-center p-4 text-red-500">{errors.form}</p>;
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 md:space-y-6">
      <div>
        <label
          htmlFor="nome_equipe"
          className="block mb-2 text-sm font-medium text-gray-900"
        >
          Nome da Equipe
        </label>
        <input
          type="text"
          name="nome_equipe"
          id="nome_equipe"
          value={formData.nome_equipe}
          onChange={handleChange}
          className={`bg-gray-50 border ${errors.nome_equipe ? 'border-red-500' : 'border-gray-300'} text-gray-900 sm:text-sm rounded-md focus:ring-primary-500 focus:border-primary-500 block w-full px-3 py-2`}
        />
        {errors.nome_equipe && (
          <p className="mt-1 text-sm text-red-600 flex items-center">
            <WarningIcon /> {errors.nome_equipe}
          </p>
        )}
      </div>

      <div>
        <label className="block mb-2 text-sm font-medium text-gray-900">
          Descrição da Equipe
        </label>
        <textarea
          name="descricao"
          id="descricao"
          value={formData.descricao}
          onChange={handleChange}
          rows={3}
          placeholder="Descreva o propósito e responsabilidades da equipe..."
          className={`bg-gray-50 border ${errors.descricao ? 'border-red-500' : 'border-gray-300'} text-gray-900 sm:text-sm rounded-md focus:ring-primary-500 focus:border-primary-500 block w-full px-3 py-2 resize-vertical`}
        />
        {errors.descricao && (
          <p className="mt-1 text-sm text-red-600 flex items-center">
            <WarningIcon /> {errors.descricao}
          </p>
        )}
      </div>

      <div>
        <label className="block mb-2 text-sm font-medium text-gray-900">
          Líder da Equipe
        </label>
        <FuncionarioAutocomplete
          value={formData.lider}
          onFuncionarioSelect={handleLiderSelect}
          error={errors.lider}
          placeholder="Busque e selecione o líder da equipe..."
        />
        {errors.lider && (
          <p className="mt-1 text-sm text-red-600 flex items-center">
            <WarningIcon /> {errors.lider}
          </p>
        )}
      </div>

      <div>
        <label className="block mb-2 text-sm font-medium text-gray-900">
          Membros da Equipe
        </label>
        <FuncionarioAutocompleteMultiple
          value={formData.membros}
          onFuncionariosSelect={handleMembrosSelect}
          error={errors.membros}
          placeholder="Busque e selecione os membros da equipe..."
        />
        {errors.membros && (
          <p className="mt-1 text-sm text-red-600 flex items-center">
            <WarningIcon /> {errors.membros}
          </p>
        )}
      </div>

      <div className="flex items-center justify-end space-x-3 pt-2">
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
              ? 'Atualizar Equipe'
              : 'Salvar Equipe'}
        </button>
      </div>
    </form>
  );
};

export default EquipeForm;
