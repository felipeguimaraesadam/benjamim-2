import React, { useState, useEffect } from 'react';

const AlocacaoForm = ({ initialData, obras, equipes, onSubmit, onCancel, isLoading }) => {
  const [formData, setFormData] = useState({
    obra: '',
    equipe: '',
    data_alocacao_inicio: '',
    data_alocacao_fim: '',
  });

  useEffect(() => {
    if (initialData) {
      setFormData({
        obra: initialData.obra || '',
        equipe: initialData.equipe || '',
        data_alocacao_inicio: initialData.data_alocacao_inicio ? new Date(initialData.data_alocacao_inicio).toISOString().split('T')[0] : '',
        data_alocacao_fim: initialData.data_alocacao_fim ? new Date(initialData.data_alocacao_fim).toISOString().split('T')[0] : '',
      });
    } else {
      setFormData({
        obra: obras && obras.length > 0 ? obras[0].id : '',
        equipe: equipes && equipes.length > 0 ? equipes[0].id : '',
        data_alocacao_inicio: new Date().toISOString().split('T')[0],
        data_alocacao_fim: '',
      });
    }
  }, [initialData, obras, equipes]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const dataToSubmit = {
      ...formData,
      obra: parseInt(formData.obra, 10),
      equipe: parseInt(formData.equipe, 10),
      // Backend might expect null for empty data_alocacao_fim
      data_alocacao_fim: formData.data_alocacao_fim === '' ? null : formData.data_alocacao_fim,
    };
    onSubmit(dataToSubmit);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label htmlFor="obra" className="block text-sm font-medium text-gray-900">Obra</label>
        <select
          name="obra"
          id="obra"
          value={formData.obra}
          onChange={handleChange}
          required
          className="mt-1 block w-full bg-gray-50 border border-gray-300 text-gray-900 sm:text-sm rounded-md focus:ring-primary-500 focus:border-primary-500 px-3 py-2"
        >
          <option value="">Selecione uma Obra</option>
          {obras && obras.map(obra => (
            <option key={obra.id} value={obra.id}>{obra.nome_obra}</option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="equipe" className="block text-sm font-medium text-gray-900">Equipe</label>
        <select
          name="equipe"
          id="equipe"
          value={formData.equipe}
          onChange={handleChange}
          required
          className="mt-1 block w-full bg-gray-50 border border-gray-300 text-gray-900 sm:text-sm rounded-md focus:ring-primary-500 focus:border-primary-500 px-3 py-2"
        >
          <option value="">Selecione uma Equipe</option>
          {equipes && equipes.map(equipe => (
            <option key={equipe.id} value={equipe.id}>{equipe.nome_equipe}</option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label htmlFor="data_alocacao_inicio" className="block text-sm font-medium text-gray-900">Data Início Alocação</label>
          <input
            type="date"
            name="data_alocacao_inicio"
            id="data_alocacao_inicio"
            value={formData.data_alocacao_inicio}
            onChange={handleChange}
            required
            className="mt-1 block w-full bg-gray-50 border border-gray-300 text-gray-900 sm:text-sm rounded-md focus:ring-primary-500 focus:border-primary-500 px-3 py-2"
          />
        </div>
        <div>
          <label htmlFor="data_alocacao_fim" className="block text-sm font-medium text-gray-900">Data Fim Alocação (Opcional)</label>
          <input
            type="date"
            name="data_alocacao_fim"
            id="data_alocacao_fim"
            value={formData.data_alocacao_fim}
            onChange={handleChange}
            className="mt-1 block w-full bg-gray-50 border border-gray-300 text-gray-900 sm:text-sm rounded-md focus:ring-primary-500 focus:border-primary-500 px-3 py-2"
          />
        </div>
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
          className="py-2 px-4 text-sm font-medium text-white bg-primary-600 rounded-md hover:bg-primary-700 focus:ring-4 focus:outline-none focus:ring-primary-300 disabled:bg-primary-300"
        >
          {isLoading ? 'Salvando...' : (initialData ? 'Atualizar Alocação' : 'Adicionar Alocação')}
        </button>
      </div>
    </form>
  );
};

export default AlocacaoForm;
