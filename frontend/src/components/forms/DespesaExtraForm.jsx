import React, { useState, useEffect } from 'react';

const DespesaExtraForm = ({ initialData, obras, onSubmit, onCancel, isLoading }) => {
  const [formData, setFormData] = useState({
    descricao: '',
    valor: '',
    data: '',
    categoria: 'Outros',
    obra: '',
  });

  const categoriasDespesa = ['Alimentação', 'Transporte', 'Ferramentas', 'Outros'];

  useEffect(() => {
    if (initialData) {
      setFormData({
        descricao: initialData.descricao || '',
        valor: initialData.valor || '',
        // Ensure date is formatted as YYYY-MM-DD for the input type="date"
        data: initialData.data ? new Date(initialData.data).toISOString().split('T')[0] : '',
        categoria: initialData.categoria || 'Outros',
        obra: initialData.obra || '', // Assuming 'obra' stores the ID
      });
    } else {
      // Default for new despesa
      setFormData({
        descricao: '',
        valor: '',
        data: new Date().toISOString().split('T')[0], // Default to today
        categoria: 'Outros',
        // Set a default obra if obras list is available and not empty
        obra: obras && obras.length > 0 ? obras[0].id : '',
      });
    }
  }, [initialData, obras]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // Ensure 'valor' is a number and 'obra' is an integer ID
    const dataToSubmit = {
      ...formData,
      valor: parseFloat(formData.valor),
      obra: parseInt(formData.obra, 10),
    };
    onSubmit(dataToSubmit);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label htmlFor="obra" className="block text-sm font-medium text-gray-700">Obra Associada</label>
        <select
          name="obra"
          id="obra"
          value={formData.obra}
          onChange={handleChange}
          required
          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
        >
          <option value="">Selecione uma Obra</option>
          {obras && obras.map(obra => (
            <option key={obra.id} value={obra.id}>{obra.nome_obra}</option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="descricao" className="block text-sm font-medium text-gray-700">Descrição</label>
        <textarea
          name="descricao"
          id="descricao"
          rows="3"
          value={formData.descricao}
          onChange={handleChange}
          required
          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
        ></textarea>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label htmlFor="valor" className="block text-sm font-medium text-gray-700">Valor (R$)</label>
          <input
            type="number"
            name="valor"
            id="valor"
            step="0.01" // Allows decimal input
            value={formData.valor}
            onChange={handleChange}
            required
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
          />
        </div>
        <div>
          <label htmlFor="data" className="block text-sm font-medium text-gray-700">Data</label>
          <input
            type="date"
            name="data"
            id="data"
            value={formData.data}
            onChange={handleChange}
            required
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
          />
        </div>
      </div>

      <div>
        <label htmlFor="categoria" className="block text-sm font-medium text-gray-700">Categoria</label>
        <select
          name="categoria"
          id="categoria"
          value={formData.categoria}
          onChange={handleChange}
          required
          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
        >
          {categoriasDespesa.map(cat => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
        </select>
      </div>

      <div className="flex justify-end space-x-3 pt-4">
        <button
          type="button"
          onClick={onCancel}
          disabled={isLoading}
          className="py-2 px-4 text-sm font-medium text-gray-700 bg-white rounded-lg border border-gray-300 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={isLoading}
          className="py-2 px-4 text-sm font-medium text-white bg-primary-600 rounded-lg shadow-sm hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
        >
          {isLoading ? 'Salvando...' : (initialData ? 'Atualizar Despesa' : 'Adicionar Despesa')}
        </button>
      </div>
    </form>
  );
};

export default DespesaExtraForm;
