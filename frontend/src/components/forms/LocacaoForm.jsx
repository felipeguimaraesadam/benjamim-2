import React, { useState, useEffect } from 'react';
import * as api from '../../services/api'; // Import API service

const LocacaoForm = ({ initialData, obras, equipes, onSubmit, onCancel, isLoading }) => {
  const [locacaoType, setLocacaoType] = useState('equipe'); // 'equipe', 'funcionario', 'servico_externo'
  const [funcionarios, setFuncionarios] = useState([]);
  const [formData, setFormData] = useState({
    obra: '',
    equipe: '',
    funcionario_locado: '',
    data_locacao_inicio: '',
    data_locacao_fim: '',
    servico_externo: '',
  });
  const [formErrors, setFormErrors] = useState({});

  // Fetch Funcionarios
  useEffect(() => {
    api.getFuncionarios()
      .then(response => setFuncionarios(response.data || response)) // Adjust based on API response structure
      .catch(error => {
        console.error("Erro ao buscar funcionários:", error);
        setFormErrors(prev => ({ ...prev, funcionarios: "Falha ao carregar funcionários."}));
      });
  }, []);

  useEffect(() => {
    if (initialData) {
      setFormData({
        obra: initialData.obra?.id || initialData.obra || '', // Handle if obra is object or just ID
        equipe: initialData.equipe?.id || initialData.equipe || '',
        funcionario_locado: initialData.funcionario_locado?.id || initialData.funcionario_locado || '',
        servico_externo: initialData.servico_externo || '',
        data_locacao_inicio: initialData.data_locacao_inicio ? new Date(initialData.data_locacao_inicio).toISOString().split('T')[0] : '',
        data_locacao_fim: initialData.data_locacao_fim ? new Date(initialData.data_locacao_fim).toISOString().split('T')[0] : '',
      });
      if (initialData.equipe) setLocacaoType('equipe');
      else if (initialData.funcionario_locado) setLocacaoType('funcionario');
      else if (initialData.servico_externo) setLocacaoType('servico_externo');
      else setLocacaoType('equipe'); // Default
    } else {
      setFormData({
        obra: obras && obras.length > 0 ? obras[0].id : '',
        equipe: '',
        funcionario_locado: '',
        servico_externo: '',
        data_locacao_inicio: new Date().toISOString().split('T')[0],
        data_locacao_fim: '',
      });
      setLocacaoType('equipe'); // Default for new
    }
    setFormErrors({});
  }, [initialData, obras]);

  const handleLocacaoTypeChange = (e) => {
    const newType = e.target.value;
    setLocacaoType(newType);
    setFormData(prev => ({
      ...prev,
      equipe: newType === 'equipe' ? prev.equipe : '', // Keep existing if switching back, else clear
      funcionario_locado: newType === 'funcionario' ? prev.funcionario_locado : '',
      servico_externo: newType === 'servico_externo' ? prev.servico_externo : '',
    }));
    setFormErrors(prev => ({...prev, general: null, equipe: null, funcionario_locado: null, servico_externo: null}));
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (formErrors[name]) {
      setFormErrors(prev => ({ ...prev, [name]: null }));
    }
  };

  const validateFrontendForm = () => {
    const newErrors = {};
    if (!formData.obra) newErrors.obra = "Obra é obrigatória.";
    if (!formData.data_locacao_inicio) newErrors.data_locacao_inicio = "Data de início é obrigatória.";

    if (locacaoType === 'equipe' && !formData.equipe) {
      newErrors.equipe = "Equipe é obrigatória.";
    } else if (locacaoType === 'funcionario' && !formData.funcionario_locado) {
      newErrors.funcionario_locado = "Funcionário é obrigatório.";
    } else if (locacaoType === 'servico_externo' && !formData.servico_externo.trim()) {
      newErrors.servico_externo = "Serviço externo é obrigatório.";
    }

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
      data_locacao_inicio: formData.data_locacao_inicio,
      data_locacao_fim: formData.data_locacao_fim || null,
      equipe: null,
      funcionario_locado: null,
      servico_externo: '',
    };

    if (locacaoType === 'equipe') {
      dataToSubmit.equipe = formData.equipe ? parseInt(formData.equipe, 10) : null;
    } else if (locacaoType === 'funcionario') {
      dataToSubmit.funcionario_locado = formData.funcionario_locado ? parseInt(formData.funcionario_locado, 10) : null;
    } else if (locacaoType === 'servico_externo') {
      dataToSubmit.servico_externo = formData.servico_externo.trim() || null;
    }
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

      <div className="mb-4">
        <label className="block mb-2 text-sm font-medium text-gray-900">Tipo de Locação <span className="text-red-500">*</span></label>
        <div className="flex items-center space-x-4">
          <label className="flex items-center">
            <input type="radio" name="locacaoType" value="equipe" checked={locacaoType === 'equipe'} onChange={handleLocacaoTypeChange} className="mr-1 h-4 w-4 text-primary-600 border-gray-300 focus:ring-primary-500"/> Equipe
          </label>
          <label className="flex items-center">
            <input type="radio" name="locacaoType" value="funcionario" checked={locacaoType === 'funcionario'} onChange={handleLocacaoTypeChange} className="mr-1 h-4 w-4 text-primary-600 border-gray-300 focus:ring-primary-500"/> Funcionário
          </label>
          <label className="flex items-center">
            <input type="radio" name="locacaoType" value="servico_externo" checked={locacaoType === 'servico_externo'} onChange={handleLocacaoTypeChange} className="mr-1 h-4 w-4 text-primary-600 border-gray-300 focus:ring-primary-500"/> Serviço Externo
          </label>
        </div>
      </div>

      {locacaoType === 'equipe' && (
        <div>
          <label htmlFor="equipe" className="block text-sm font-medium text-gray-900">Equipe Interna <span className="text-red-500">*</span></label>
          <select
            name="equipe"
            id="equipe"
            value={formData.equipe}
            onChange={handleChange}
            className={`mt-1 block w-full bg-gray-50 border ${formErrors.equipe ? 'border-red-500' : 'border-gray-300'} text-gray-900 sm:text-sm rounded-md focus:ring-primary-500 focus:border-primary-500 px-3 py-2`}
          >
            <option value="">Selecione uma Equipe</option>
            {equipes && equipes.map(equipe => (
              <option key={equipe.id} value={equipe.id}>{equipe.nome_equipe}</option>
            ))}
          </select>
          {formErrors.equipe && <p className="mt-1 text-sm text-red-600">{formErrors.equipe}</p>}
        </div>
      )}

      {locacaoType === 'funcionario' && (
        <div>
          <label htmlFor="funcionario_locado" className="block text-sm font-medium text-gray-900">Funcionário <span className="text-red-500">*</span></label>
          <select
            name="funcionario_locado"
            id="funcionario_locado"
            value={formData.funcionario_locado}
            onChange={handleChange}
            className={`mt-1 block w-full bg-gray-50 border ${formErrors.funcionario_locado ? 'border-red-500' : 'border-gray-300'} text-gray-900 sm:text-sm rounded-md focus:ring-primary-500 focus:border-primary-500 px-3 py-2`}
          >
            <option value="">Selecione um Funcionário</option>
            {funcionarios && funcionarios.map(func => (
              <option key={func.id} value={func.id}>{func.nome_completo}</option>
            ))}
          </select>
          {formErrors.funcionario_locado && <p className="mt-1 text-sm text-red-600">{formErrors.funcionario_locado}</p>}
          {formErrors.funcionarios && <p className="mt-1 text-sm text-red-600">{formErrors.funcionarios}</p>}
        </div>
      )}

      {locacaoType === 'servico_externo' && (
        <div>
          <label htmlFor="servico_externo" className="block text-sm font-medium text-gray-900">Serviço Externo <span className="text-red-500">*</span></label>
          <input
            type="text"
            name="servico_externo"
            id="servico_externo"
            value={formData.servico_externo}
            onChange={handleChange}
            className={`mt-1 block w-full bg-gray-50 border ${formErrors.servico_externo ? 'border-red-500' : 'border-gray-300'} text-gray-900 sm:text-sm rounded-md focus:ring-primary-500 focus:border-primary-500 px-3 py-2`}
            maxLength="255"
          />
          {formErrors.servico_externo && <p className="mt-1 text-sm text-red-600">{formErrors.servico_externo}</p>}
        </div>
      )}

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
