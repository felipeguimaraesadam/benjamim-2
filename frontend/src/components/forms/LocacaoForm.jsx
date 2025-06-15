import React, { useState, useEffect } from 'react';
import * as api from '../../services/api'; // Import API service

const LocacaoForm = ({ initialData, obras, equipes, onSubmit, onCancel, isLoading, onTransferSuccess }) => {
  const [locacaoType, setLocacaoType] = useState('equipe'); // 'equipe', 'funcionario', 'servico_externo'
  const [funcionarios, setFuncionarios] = useState([]);
  const [formData, setFormData] = useState({
    obra: '',
    equipe: '',
    funcionario_locado: '',
    data_locacao_inicio: '',
    data_locacao_fim: '',
    servico_externo: '',
    tipo_pagamento: 'diaria', // New
    valor_pagamento: '', // New
    data_pagamento: '', // New
  });
  const [formErrors, setFormErrors] = useState({});
  const [showTransferConfirm, setShowTransferConfirm] = useState(false);
  const [transferDetails, setTransferDetails] = useState(null);
  const [isTransferring, setIsTransferring] = useState(false);

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
        tipo_pagamento: initialData.tipo_pagamento || 'diaria', // New
        valor_pagamento: initialData.valor_pagamento || '', // New
        data_pagamento: initialData.data_pagamento ? new Date(initialData.data_pagamento).toISOString().split('T')[0] : '', // New
      });
      if (initialData.equipe) setLocacaoType('equipe');
      else if (initialData.funcionario_locado) setLocacaoType('funcionario');
      else if (initialData.servico_externo) setLocacaoType('servico_externo');
      else setLocacaoType('equipe'); // Default
    } else {
      const getLocalYYYYMMDD = () => { // Defined here for clarity in this block
        const todayDate = new Date();
        const year = todayDate.getFullYear();
        const month = String(todayDate.getMonth() + 1).padStart(2, '0');
        const day = String(todayDate.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
      };
      const localToday = getLocalYYYYMMDD();

      setFormData({
        obra: obras && obras.length > 0 ? obras[0].id : '',
        equipe: '',
        funcionario_locado: '',
        servico_externo: '',
        data_locacao_inicio: localToday, // Use local current date
        data_locacao_fim: '',
        tipo_pagamento: 'diaria',
        valor_pagamento: '',
        data_pagamento: localToday, // Use local current date
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

    // New validation rules
    if (!formData.tipo_pagamento) newErrors.tipo_pagamento = "Tipo de pagamento é obrigatório.";
    if (!formData.valor_pagamento) {
        newErrors.valor_pagamento = "Valor do pagamento é obrigatório.";
    } else if (parseFloat(formData.valor_pagamento) <= 0) {
        newErrors.valor_pagamento = "Valor do pagamento deve ser positivo.";
    }
    if (formData.data_pagamento && formData.data_locacao_inicio && formData.data_pagamento < formData.data_locacao_inicio) {
        newErrors.data_pagamento = "Data de pagamento não pode ser anterior à data de início da locação.";
    }

    setFormErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormErrors({});
    setShowTransferConfirm(false);
    setTransferDetails(null);

    if (!validateFrontendForm()) return;

    const dataToSubmit = {
      obra: parseInt(formData.obra, 10),
      data_locacao_inicio: formData.data_locacao_inicio,
      data_locacao_fim: formData.data_locacao_fim || null,
      // Initialize resource type fields to null/empty
      equipe: null,
      funcionario_locado: null,
      servico_externo: '',
      // Payment fields
      tipo_pagamento: formData.tipo_pagamento,
      valor_pagamento: parseFloat(formData.valor_pagamento),
      data_pagamento: formData.data_pagamento || null,
    };

    if (locacaoType === 'equipe') {
      dataToSubmit.equipe = formData.equipe ? parseInt(formData.equipe, 10) : null;
    } else if (locacaoType === 'funcionario') {
      dataToSubmit.funcionario_locado = formData.funcionario_locado ? parseInt(formData.funcionario_locado, 10) : null;
    } else if (locacaoType === 'servico_externo') {
      dataToSubmit.servico_externo = formData.servico_externo.trim() || null;
    }

    try {
      await onSubmit(dataToSubmit);
    } catch (err) {
      const backendErrors = err.response?.data;
      if (backendErrors?.conflict_details && backendErrors?.funcionario_locado) {
        setTransferDetails({
          conflictingLocacao: backendErrors.conflict_details,
          newLocacaoData: dataToSubmit,
          conflictMessage: typeof backendErrors.funcionario_locado === 'string'
                           ? backendErrors.funcionario_locado
                           : JSON.stringify(backendErrors.funcionario_locado)
        });
        setShowTransferConfirm(true);
        // Optionally set a specific form error
        // setFormErrors({ funcionario_locado: "Conflito detectado. Opção de transferência disponível." });
      } else if (backendErrors && typeof backendErrors === 'object') {
        const newFormErrors = {};
        for (const key in backendErrors) {
          if (key === 'conflict_details') continue;
          newFormErrors[key] = Array.isArray(backendErrors[key])
                             ? backendErrors[key].join('; ')
                             : (typeof backendErrors[key] === 'string' ? backendErrors[key] : JSON.stringify(backendErrors[key]));
        }
        setFormErrors(newFormErrors);
      } else if (err.message) {
        setFormErrors({ general: err.message });
      } else {
        setFormErrors({ general: 'Ocorreu um erro desconhecido.' });
      }
    }
  };

  const handleConfirmTransfer = async () => {
    if (!transferDetails) return;
    setIsTransferring(true);
    setFormErrors({});
    try {
      await api.transferFuncionarioLocacao({
        conflicting_locacao_id: transferDetails.conflictingLocacao.locacao_id,
        new_locacao_data: transferDetails.newLocacaoData
      });
      setShowTransferConfirm(false);
      setTransferDetails(null);

      if (onTransferSuccess) { // Call the new success handler from parent
        onTransferSuccess();
      } else { // Fallback if prop not provided (though it should be)
        onCancel();
      }
    } catch (err) {
      const backendErrors = err.response?.data;
      if (backendErrors && typeof backendErrors === 'object') {
        const newFormErrors = {};
        // Display these errors in the main form area, or a dedicated area in transfer modal
        for (const key in backendErrors) {
          newFormErrors[key] = Array.isArray(backendErrors[key]) ? backendErrors[key].join('; ') : backendErrors[key];
        }
        setFormErrors(newFormErrors); // These errors will show on the main form after transfer modal closes if not handled there.
                                      // Or, display them within the transfer modal itself if preferred.
                                      // For now, setting them on formErrors means they might appear if modal closes on error.
      } else {
        // Set general error to be displayed in the transfer modal or main form.
        setFormErrors({ general: `Falha ao transferir funcionário: ${err.message || 'Erro desconhecido.'}` });
      }
    } finally {
      setIsTransferring(false);
    }
  };

  return (
    <> {/* Fragment to wrap form and modal */}
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

      {/* Payment Fields Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6 pt-6 border-t">
        <div>
          <label htmlFor="tipo_pagamento" className="block text-sm font-medium text-gray-900">Tipo de Pagamento <span className="text-red-500">*</span></label>
          <select
            name="tipo_pagamento"
            id="tipo_pagamento"
            value={formData.tipo_pagamento}
            onChange={handleChange}
            className={`mt-1 block w-full bg-gray-50 border ${formErrors.tipo_pagamento ? 'border-red-500' : 'border-gray-300'} text-gray-900 sm:text-sm rounded-md focus:ring-primary-500 focus:border-primary-500 px-3 py-2`}
          >
            <option value="diaria">Diária</option>
            <option value="metro">Por Metro</option>
            <option value="empreitada">Empreitada</option>
          </select>
          {formErrors.tipo_pagamento && <p className="mt-1 text-sm text-red-600">{formErrors.tipo_pagamento}</p>}
        </div>
        <div>
          <label htmlFor="valor_pagamento" className="block text-sm font-medium text-gray-900">Valor do Pagamento <span className="text-red-500">*</span></label>
          <input
            type="number"
            name="valor_pagamento"
            id="valor_pagamento"
            value={formData.valor_pagamento}
            onChange={handleChange}
            className={`mt-1 block w-full bg-gray-50 border ${formErrors.valor_pagamento ? 'border-red-500' : 'border-gray-300'} text-gray-900 sm:text-sm rounded-md focus:ring-primary-500 focus:border-primary-500 px-3 py-2`}
            placeholder="Ex: 150.00"
            step="0.01"
          />
          {formErrors.valor_pagamento && <p className="mt-1 text-sm text-red-600">{formErrors.valor_pagamento}</p>}
        </div>
        <div>
          <label htmlFor="data_pagamento" className="block text-sm font-medium text-gray-900">Data Pagamento (Opcional)</label>
          <input
            type="date"
            name="data_pagamento"
            id="data_pagamento"
            value={formData.data_pagamento}
            onChange={handleChange}
            className="mt-1 block w-full bg-gray-50 border border-gray-300 text-gray-900 sm:text-sm rounded-md focus:ring-primary-500 focus:border-primary-500 px-3 py-2"
          />
         {formErrors.data_pagamento && <p className="mt-1 text-sm text-red-600">{formErrors.data_pagamento}</p>}
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

    {showTransferConfirm && transferDetails && (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60">
        <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-lg">
          <h2 className="text-xl font-semibold mb-4 text-yellow-700">Conflito de Locação Detectado</h2>
          <p className="mb-2 text-sm text-gray-700">
            {transferDetails.conflictMessage || "Este funcionário já possui uma locação que conflita com as datas informadas."}
          </p>
          <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md text-sm">
            <p><strong>Obra Conflitante:</strong> {transferDetails.conflictingLocacao.obra_nome}</p>
            <p><strong>Período Conflitante:</strong>
              {new Date(transferDetails.conflictingLocacao.data_inicio + 'T00:00:00').toLocaleDateString()} -
              {transferDetails.conflictingLocacao.data_fim ? new Date(transferDetails.conflictingLocacao.data_fim + 'T00:00:00').toLocaleDateString() : 'Indefinido'}
            </p>
          </div>
          <p className="mb-6 text-sm text-gray-700">
            Deseja transferir o funcionário para esta nova locação? A locação anterior na obra '{transferDetails.conflictingLocacao.obra_nome}' será finalizada em {new Date(new Date(transferDetails.newLocacaoData.data_locacao_inicio).getTime() - 86400000).toLocaleDateString()} (um dia antes) e seu custo será removido da obra anterior.
          </p>
          {formErrors.general && <p className="text-red-600 text-sm mb-3">{formErrors.general}</p>} {/* Display general errors from transfer attempt */}
          <div className="flex justify-end space-x-3">
            <button
              onClick={() => { setShowTransferConfirm(false); setTransferDetails(null); setFormErrors({}); }}
              disabled={isTransferring}
              className="py-2 px-4 text-sm font-medium text-gray-800 bg-gray-200 rounded-md hover:bg-gray-300 disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              onClick={handleConfirmTransfer}
              disabled={isTransferring}
              className="py-2 px-4 text-sm font-medium text-white bg-primary-600 rounded-md hover:bg-primary-700 disabled:bg-primary-300"
            >
              {isTransferring ? 'Transferindo...' : 'Sim, Transferir Funcionário'}
            </button>
          </div>
        </div>
      </div>
    )}
    </>
  );
};

export default LocacaoForm;
