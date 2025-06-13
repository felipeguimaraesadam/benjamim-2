import React, { useState, useEffect } from 'react';

const LocacaoForm = ({ initialData, obras, equipes, onSubmit, onCancel, isLoading }) => {
  const [formData, setFormData] = useState({
    obra: '',
    equipe: '',
    data_locacao_inicio: '',
    data_locacao_fim: '',
    servico_externo: '', // Added servico_externo
  });
  const [formErrors, setFormErrors] = useState({}); // For frontend validation

  useEffect(() => {
    if (initialData) {
      setFormData({
        obra: initialData.obra || '',
        equipe: initialData.equipe || '',
        servico_externo: initialData.servico_externo || '',
        data_locacao_inicio: initialData.data_locacao_inicio ? new Date(initialData.data_locacao_inicio).toISOString().split('T')[0] : '',
        data_locacao_fim: initialData.data_locacao_fim ? new Date(initialData.data_locacao_fim).toISOString().split('T')[0] : '',
      });
    } else {
      // Default for new form
      setFormData({
        obra: obras && obras.length > 0 ? obras[0].id : '',
        equipe: '', // Default to empty, user must choose or use servico_externo
        servico_externo: '',
        data_locacao_inicio: new Date().toISOString().split('T')[0],
        data_locacao_fim: '',
      });
    }
    setFormErrors({}); // Clear errors when initialData changes
  }, [initialData, obras]); // Removed equipes from deps as it might cause loop if not stable

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (formErrors[name]) {
      setFormErrors(prev => ({ ...prev, [name]: null }));
    }
    // Clear the other field if one is typed into/selected
    if (name === "equipe" && value) {
        setFormData(prev => ({ ...prev, servico_externo: '' }));
        if (formErrors.servico_externo) setFormErrors(prev => ({...prev, servico_externo: null}));
    } else if (name === "servico_externo" && value) {
        setFormData(prev => ({ ...prev, equipe: '' }));
        if (formErrors.equipe) setFormErrors(prev => ({...prev, equipe: null}));
    }
  };

  const validateFrontendForm = () => {
    const newErrors = {};
    if (!formData.obra) newErrors.obra = "Obra é obrigatória.";
    if (!formData.data_locacao_inicio) newErrors.data_locacao_inicio = "Data de início é obrigatória.";

    const equipeSelecionada = formData.equipe && formData.equipe !== '';
    const servicoExternoPreenchido = formData.servico_externo && formData.servico_externo.trim() !== '';

    if (equipeSelecionada && servicoExternoPreenchido) {
        newErrors.general = "Selecione uma equipe OU informe um serviço externo, não ambos.";
    } else if (!equipeSelecionada && !servicoExternoPreenchido) {
        newErrors.general = "Selecione uma equipe ou informe um serviço externo.";
    }
    // Basic date validation
    if (formData.data_locacao_inicio && formData.data_locacao_fim && formData.data_locacao_inicio > formData.data_locacao_fim) {
        newErrors.data_locacao_fim = 'Data de fim não pode ser anterior à data de início.';
    }

    setFormErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validateFrontendForm()) return;

    const dataToSubmit = {
      obra: parseInt(formData.obra, 10),
      equipe: formData.equipe ? parseInt(formData.equipe, 10) : null,
      servico_externo: formData.servico_externo.trim() || null,
      data_locacao_inicio: formData.data_locacao_inicio,
      data_locacao_fim: formData.data_locacao_fim || null,
    };
    onSubmit(dataToSubmit);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {formErrors.general && <p className="text-sm text-red-600 bg-red-100 p-2 rounded-md">{formErrors.general}</p>}
      <div>
        <label htmlFor="obra" className="block text-sm font-medium text-gray-900">Obra <span className="text-red-500">*</span></label>
        <select
          name="obra"
          id="obra"
          value={formData.obra}
          onChange={handleChange}
          className={`mt-1 block w-full bg-gray-50 border ${formErrors.obra ? 'border-red-500' : 'border-gray-300'} text-gray-900 sm:text-sm rounded-md focus:ring-primary-500 focus:border-primary-500 px-3 py-2`}
        >
          <option value="">Selecione uma Obra</option>
          {obras && obras.map(obra => (
            <option key={obra.id} value={obra.id}>{obra.nome_obra}</option>
          ))}
        </select>
        {formErrors.obra && <p className="mt-1 text-sm text-red-600">{formErrors.obra}</p>}
      </div>

      <div>
        <label htmlFor="equipe" className="block text-sm font-medium text-gray-900">Equipe Interna (opcional)</label>
        <select
          name="equipe"
          id="equipe"
          value={formData.equipe}
          onChange={handleChange}
          disabled={!!formData.servico_externo.trim()}
          className={`mt-1 block w-full bg-gray-50 border ${formErrors.equipe ? 'border-red-500' : 'border-gray-300'} text-gray-900 sm:text-sm rounded-md focus:ring-primary-500 focus:border-primary-500 px-3 py-2 disabled:bg-gray-200`}
        >
          <option value="">Selecione uma Equipe (se não preencher serviço externo)</option>
          {equipes && equipes.map(equipe => (
            <option key={equipe.id} value={equipe.id}>{equipe.nome_equipe}</option>
          ))}
        </select>
        {formErrors.equipe && <p className="mt-1 text-sm text-red-600">{formErrors.equipe}</p>}
      </div>

      <div className="my-2 text-center text-sm text-gray-500">OU</div>

      <div>
        <label htmlFor="servico_externo" className="block text-sm font-medium text-gray-900">Serviço Externo (opcional)</label>
        <input
          type="text"
          name="servico_externo"
          id="servico_externo"
          value={formData.servico_externo}
          onChange={handleChange}
          disabled={!!formData.equipe}
          className={`mt-1 block w-full bg-gray-50 border ${formErrors.servico_externo ? 'border-red-500' : 'border-gray-300'} text-gray-900 sm:text-sm rounded-md focus:ring-primary-500 focus:border-primary-500 px-3 py-2 disabled:bg-gray-200`}
          maxLength="255"
        />
        {formErrors.servico_externo && <p className="mt-1 text-sm text-red-600">{formErrors.servico_externo}</p>}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label htmlFor="data_locacao_inicio" className="block text-sm font-medium text-gray-900">Data Início Locação <span className="text-red-500">*</span></label>
          <input
            type="date"
            name="data_locacao_inicio"
            id="data_locacao_inicio"
            value={formData.data_locacao_inicio}
            onChange={handleChange}
            required
            className="mt-1 block w-full bg-gray-50 border border-gray-300 text-gray-900 sm:text-sm rounded-md focus:ring-primary-500 focus:border-primary-500 px-3 py-2"
          />
        </div>
        <div>
          <label htmlFor="data_locacao_fim" className="block text-sm font-medium text-gray-900">Data Fim Locação (Opcional)</label>
          <input
            type="date"
            name="data_locacao_fim"
            id="data_locacao_fim"
            value={formData.data_locacao_fim}
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
          {isLoading ? 'Salvando...' : (initialData ? 'Atualizar Locação' : 'Adicionar Locação')}
        </button>
      </div>
    </form>
  );
};

export default LocacaoForm;
