import React, { useState, useEffect } from 'react';
import SpinnerIcon from '../utils/SpinnerIcon';
import Autocomplete from './Autocomplete';
import { searchObras } from '../../services/api';

const DespesaExtraForm = ({
  initialData,
  obras, // This is now used only for initial value lookup
  onSubmit,
  onCancel,
  isLoading,
}) => {
  const [formData, setFormData] = useState({
    descricao: '',
    valor: '',
    data: '',
    categoria: 'Outros',
    obra: null, // Changed to null
    anexos: [],
  });
  const [obraInitial, setObraInitial] = useState(null);

  const categoriasDespesa = [
    'Alimentação',
    'Transporte',
    'Ferramentas',
    'Outros',
  ];

  useEffect(() => {
    const obraData = initialData?.obra
      ? obras.find(o => o.id === initialData.obra)
      : null;

    if (initialData) {
      setFormData({
        descricao: initialData.descricao || '',
        valor: initialData.valor || '',
        data: initialData.data
          ? new Date(initialData.data).toISOString().split('T')[0]
          : '',
        categoria: initialData.categoria || 'Outros',
        obra: initialData.obra || null,
      });
      if (obraData) {
        setObraInitial({
          value: obraData.id,
          label: obraData.nome_obra,
        });
      }
    } else {
      setFormData({
        descricao: '',
        valor: '',
        data: new Date().toISOString().split('T')[0],
        categoria: 'Outros',
        obra: null,
      });
    }
  }, [initialData, obras]);

  const handleChange = e => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleObraSelect = selection => {
    setFormData(prev => ({ ...prev, obra: selection ? selection.value : null }));
  };

  const fetchObrasSuggestions = async query => {
    try {
      const response = await searchObras(query);
      return response.data.map(obra => ({
        value: obra.id,
        label: obra.nome_obra,
      }));
    } catch (error) {
      console.error('Error fetching obras:', error);
      return [];
    }
  };

  const handleFileChange = e => {
    setFormData(prevFormData => ({
      ...prevFormData,
      anexos: [...e.target.files],
    }));
  };
  };

  const handleSubmit = e => {
    e.preventDefault();
    const { anexos, ...rest } = formData;
    const dataToSubmit = {
      ...rest,
      valor: parseFloat(formData.valor),
      obra: formData.obra,
    };
    onSubmit(dataToSubmit, anexos);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label
          htmlFor="obra"
          className="block text-sm font-medium text-gray-900"
        >
          Obra Associada
        </label>
        <Autocomplete
          fetchSuggestions={fetchObrasSuggestions}
          onSelect={handleObraSelect}
          placeholder="Digite para buscar uma obra..."
          initialValue={obraInitial}
        />
      </div>

      <div>
        <label
          htmlFor="descricao"
          className="block text-sm font-medium text-gray-900"
        >
          Descrição
        </label>
        <textarea
          name="descricao"
          id="descricao"
          rows="3"
          value={formData.descricao}
          onChange={handleChange}
          required
          className="mt-1 block w-full bg-gray-50 border border-gray-300 text-gray-900 sm:text-sm rounded-md focus:ring-primary-500 focus:border-primary-500 px-3 py-2"
        ></textarea>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label
            htmlFor="valor"
            className="block text-sm font-medium text-gray-900"
          >
            Valor (R$)
          </label>
          <input
            type="number"
            name="valor"
            id="valor"
            step="0.01" // Allows decimal input
            value={formData.valor}
            onChange={handleChange}
            required
            className="mt-1 block w-full bg-gray-50 border border-gray-300 text-gray-900 sm:text-sm rounded-md focus:ring-primary-500 focus:border-primary-500 px-3 py-2"
          />
        </div>
        <div>
          <label
            htmlFor="data"
            className="block text-sm font-medium text-gray-900"
          >
            Data
          </label>
          <input
            type="date"
            name="data"
            id="data"
            value={formData.data}
            onChange={handleChange}
            required
            className="mt-1 block w-full bg-gray-50 border border-gray-300 text-gray-900 sm:text-sm rounded-md focus:ring-primary-500 focus:border-primary-500 px-3 py-2"
          />
        </div>
      </div>

      <div>
        <label
          htmlFor="categoria"
          className="block text-sm font-medium text-gray-900"
        >
          Categoria
        </label>
        <select
          name="categoria"
          id="categoria"
          value={formData.categoria}
          onChange={handleChange}
          required
          className="mt-1 block w-full bg-gray-50 border border-gray-300 text-gray-900 sm:text-sm rounded-md focus:ring-primary-500 focus:border-primary-500 px-3 py-2"
        >
          {categoriasDespesa.map(cat => (
            <option key={cat} value={cat}>
              {cat}
            </option>
          ))}
        </select>
      </div>

      {/* Anexos Field Section */}
      <div className="mt-6 pt-6 border-t">
        <label
          htmlFor="anexos"
          className="block text-sm font-medium text-gray-900"
        >
          Anexos (PDF, Imagens)
        </label>
        <input
          type="file"
          name="anexos"
          id="anexos"
          onChange={handleFileChange}
          multiple
          className="mt-1 block w-full text-sm text-gray-900 border border-gray-300 rounded-md cursor-pointer bg-gray-50 focus:outline-none"
        />
      </div>

      <div className="flex justify-end space-x-3 pt-4">
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
              ? 'Atualizar Despesa'
              : 'Adicionar Despesa'}
        </button>
      </div>
    </form>
  );
};

export default DespesaExtraForm;
