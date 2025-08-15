import React, { useState, useEffect } from 'react';
import * as api from '../../services/api';
import SpinnerIcon from '../utils/SpinnerIcon';
import ObraAutocomplete from './ObraAutocomplete';
import EquipeAutocomplete from './EquipeAutocomplete';
import FuncionarioAutocomplete from './FuncionarioAutocomplete';

const LocacaoForm = ({
  initialData,
  obras,
  equipes,
  onSubmit,
  onCancel,
  isLoading,
  onTransferSuccess,
}) => {
  const [locacaoType, setLocacaoType] = useState('equipe');

  // State for selected objects from autocomplete components
  const [selectedObraObject, setSelectedObraObject] = useState(null);
  const [selectedEquipeObject, setSelectedEquipeObject] = useState(null);
  const [selectedFuncionarioObject, setSelectedFuncionarioObject] =
    useState(null);

  const [formData, setFormData] = useState({
    obra: '',
    equipe: '',
    funcionario_locado: '',
    data_locacao_inicio: '',
    data_locacao_fim: '',
    servico_externo: '',
    tipo_pagamento: 'diaria',
    valor_pagamento: '',
    data_pagamento: '',
    observacoes: '',
    anexos: [],
  });

  const [formErrors, setFormErrors] = useState({});
  const [showTransferConfirm, setShowTransferConfirm] = useState(false);
  const [transferDetails, setTransferDetails] = useState(null);
  const [isTransferring, setIsTransferring] = useState(false);
  const [showUpdateDefaultConfirmModal, setShowUpdateDefaultConfirmModal] =
    useState(false);
  const [updateDefaultPromptData, setUpdateDefaultPromptData] = useState({
    formValue: null,
    defaultValue: null,
    paymentType: '',
    userChoice: null,
  });

  useEffect(() => {
    if (initialData) {
      const inicio = initialData.data_locacao_inicio
        ? new Date(initialData.data_locacao_inicio).toISOString().split('T')[0]
        : '';
      let fim = initialData.data_locacao_fim
        ? new Date(initialData.data_locacao_fim).toISOString().split('T')[0]
        : '';
      if (inicio && !fim) fim = inicio;

      const obraId = initialData.obra?.id || initialData.obra || '';
      const equipeId = initialData.equipe?.id || initialData.equipe || '';
      const funcionarioId =
        initialData.funcionario_locado?.id ||
        initialData.funcionario_locado ||
        '';

      setFormData({
        obra: obraId,
        equipe: equipeId,
        funcionario_locado: funcionarioId,
        servico_externo: initialData.servico_externo || '',
        data_locacao_inicio: inicio,
        data_locacao_fim: fim,
        tipo_pagamento: initialData.tipo_pagamento || 'diaria',
        valor_pagamento: initialData.valor_pagamento || '',
        data_pagamento: initialData.data_pagamento
          ? new Date(initialData.data_pagamento).toISOString().split('T')[0]
          : '',
        observacoes: initialData.observacoes || '',
      });

      if (obraId && obras?.length > 0) {
        setSelectedObraObject(
          obras.find(o => o.id.toString() === obraId.toString()) || null
        );
      }

      if (initialData.equipe) {
        setLocacaoType('equipe');
        if (equipeId && equipes?.length > 0) {
          setSelectedEquipeObject(
            equipes.find(e => e.id.toString() === equipeId.toString()) || null
          );
        }
      } else if (initialData.funcionario_locado) {
        setLocacaoType('funcionario');
        // The full funcionario object should be in initialData
        setSelectedFuncionarioObject(initialData.funcionario_locado || null);
      } else if (initialData.servico_externo) {
        setLocacaoType('servico_externo');
      } else {
        setLocacaoType('equipe');
      }
    } else {
      // Reset for new form
      const getLocalYYYYMMDD = () => {
        const todayDate = new Date();
        const year = todayDate.getFullYear();
        const month = String(todayDate.getMonth() + 1).padStart(2, '0');
        const day = String(todayDate.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
      };
      const localToday = getLocalYYYYMMDD();
      setFormData({
        obra: '',
        equipe: '',
        funcionario_locado: '',
        servico_externo: '',
        data_locacao_inicio: localToday,
        data_locacao_fim: localToday,
        tipo_pagamento: 'diaria',
        valor_pagamento: '',
        data_pagamento: '',
        observacoes: '',
        anexos: [],
      });
      setLocacaoType('equipe');
      setSelectedObraObject(null);
      setSelectedEquipeObject(null);
      setSelectedFuncionarioObject(null);
    }
    setFormErrors({});
  }, [initialData, obras, equipes]);

  function getNextFriday(dateString) {
    if (!dateString) return '';
    const parts = dateString.split('-');
    const localDate = new Date(parts[0], parts[1] - 1, parts[2]);
    const dayOfWeek = localDate.getDay();
    let daysUntilFriday = 5 - dayOfWeek;
    if (daysUntilFriday < 0) {
      daysUntilFriday += 7;
    }
    localDate.setDate(localDate.getDate() + daysUntilFriday);
    return localDate.toISOString().split('T')[0];
  }

  const handleLocacaoTypeChange = e => {
    const newType = e.target.value;
    setLocacaoType(newType);

    // Clear data for other types
    setSelectedEquipeObject(null);
    setSelectedFuncionarioObject(null);
    setFormData(prev => ({
      ...prev,
      equipe: '',
      funcionario_locado: '',
      servico_externo: '',
      valor_pagamento: '',
    }));

    setFormErrors(prevErrs => ({
      ...prevErrs,
      general: null,
      equipe: null,
      funcionario_locado: null,
      servico_externo: null,
      valor_pagamento: null,
    }));
  };

  const handleObraSelect = obra => {
    setSelectedObraObject(obra);
    setFormData(prev => ({ ...prev, obra: obra ? obra.id : '' }));
    if (formErrors.obra) {
      setFormErrors(prev => ({ ...prev, obra: null }));
    }
  };

  const handleEquipeSelect = equipe => {
    setSelectedEquipeObject(equipe);
    setFormData(prev => ({ ...prev, equipe: equipe ? equipe.id : '' }));
    if (formErrors.equipe) {
      setFormErrors(prev => ({ ...prev, equipe: null }));
    }
  };

  const handleFuncionarioSelect = funcionario => {
    setSelectedFuncionarioObject(funcionario);
    setFormData(prev => ({
      ...prev,
      funcionario_locado: funcionario ? funcionario.id : '',
    }));

    let newValorPagamento = '';
    if (funcionario && formData.tipo_pagamento) {
      const valorPadraoKey = `valor_${formData.tipo_pagamento}_padrao`;
      const valorPadrao = funcionario[valorPadraoKey];
      if (valorPadrao != null && valorPadrao !== '') {
        newValorPagamento = parseFloat(valorPadrao).toFixed(2);
      }
    }
    setFormData(prev => ({ ...prev, valor_pagamento: newValorPagamento }));

    if (formErrors.funcionario_locado) {
      setFormErrors(prev => ({ ...prev, funcionario_locado: null }));
    }
  };

  const handleChange = e => {
    const { name, value } = e.target;
    let newFormData = { ...formData, [name]: value };

    if (name === 'tipo_pagamento') {
      if (selectedFuncionarioObject) {
        const valorPadraoKey = `valor_${value}_padrao`;
        const valorPadrao = selectedFuncionarioObject[valorPadraoKey];
        if (valorPadrao != null && valorPadrao !== '') {
          newFormData = {
            ...newFormData,
            valor_pagamento: parseFloat(valorPadrao).toFixed(2),
          };
        } else {
          newFormData = { ...newFormData, valor_pagamento: '' };
        }
      }
    } else if (name === 'data_locacao_inicio') {
      const newDataInicio = value;
      const currentDataFim = newFormData.data_locacao_fim;
      if (
        !currentDataFim ||
        (newDataInicio &&
          currentDataFim &&
          new Date(currentDataFim) < new Date(newDataInicio))
      ) {
        newFormData = { ...newFormData, data_locacao_fim: newDataInicio };
      }
      if (!newDataInicio) {
        newFormData = {
          ...newFormData,
          data_locacao_fim: '',
          data_pagamento: '',
        };
      } else {
        const nextFriday = getNextFriday(newDataInicio);
        newFormData = { ...newFormData, data_pagamento: nextFriday };
      }
    }

    setFormData(newFormData);

    if (formErrors[name]) {
      setFormErrors(prev => ({ ...prev, [name]: null }));
    }
    if (name === 'tipo_pagamento') {
      if (formErrors.valor_pagamento)
        setFormErrors(prev => ({ ...prev, valor_pagamento: null }));
    }
  };

  const handleFileChange = e => {
    setFormData(prevFormData => ({
      ...prevFormData,
      anexos: [...e.target.files],
    }));
  };

  const validateFrontendForm = () => {
    const newErrors = {};
    if (!formData.obra) newErrors.obra = 'Obra é obrigatória.';
    if (!formData.data_locacao_inicio)
      newErrors.data_locacao_inicio = 'Data de início é obrigatória.';

    if (locacaoType === 'equipe' && !formData.equipe) {
      newErrors.equipe = 'Equipe é obrigatória.';
    } else if (locacaoType === 'funcionario' && !formData.funcionario_locado) {
      newErrors.funcionario_locado = 'Funcionário é obrigatório.';
    } else if (
      locacaoType === 'servico_externo' &&
      !formData.servico_externo.trim()
    ) {
      newErrors.servico_externo = 'Serviço externo é obrigatório.';
    }

    if (
      formData.data_locacao_inicio &&
      formData.data_locacao_fim &&
      formData.data_locacao_inicio > formData.data_locacao_fim
    ) {
      newErrors.data_locacao_fim =
        'Data de fim não pode ser anterior à data de início.';
    }

    if (!formData.tipo_pagamento)
      newErrors.tipo_pagamento = 'Tipo de pagamento é obrigatório.';
    if (!formData.valor_pagamento) {
      newErrors.valor_pagamento = 'Valor do pagamento é obrigatório.';
    } else if (parseFloat(formData.valor_pagamento) <= 0) {
      newErrors.valor_pagamento = 'Valor do pagamento deve ser positivo.';
    }
    if (
      formData.data_pagamento &&
      formData.data_locacao_inicio &&
      formData.data_pagamento < formData.data_locacao_inicio
    ) {
      newErrors.data_pagamento =
        'Data de pagamento não pode ser anterior à data de início da locação.';
    }

    setFormErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async e => {
    e.preventDefault();
    setFormErrors({});
    setShowTransferConfirm(false);
    setTransferDetails(null);

    if (!validateFrontendForm()) return;

    let shouldPromptUpdateDefault = false;
    let formValueForPrompt = null;
    let defaultValueForPrompt = null;
    let paymentTypeForPrompt = '';
    const valorPagamentoFloat = parseFloat(formData.valor_pagamento);

    if (
      locacaoType === 'funcionario' &&
      selectedFuncionarioObject &&
      formData.tipo_pagamento &&
      !isNaN(valorPagamentoFloat)
    ) {
      let defaultFieldKey = '';
      let paymentTypeDisplay = '';

      if (formData.tipo_pagamento === 'diaria') {
        defaultFieldKey = 'valor_diaria_padrao';
        paymentTypeDisplay = 'diária';
      } else if (formData.tipo_pagamento === 'metro') {
        defaultFieldKey = 'valor_metro_padrao';
        paymentTypeDisplay = 'metro';
      } else if (formData.tipo_pagamento === 'empreitada') {
        defaultFieldKey = 'valor_empreitada_padrao';
        paymentTypeDisplay = 'empreitada';
      }

      if (defaultFieldKey) {
        const currentDefaultValueString =
          selectedFuncionarioObject[defaultFieldKey];
        const currentDefaultValue =
          currentDefaultValueString != null && currentDefaultValueString !== ''
            ? parseFloat(currentDefaultValueString)
            : null;

        if (
          currentDefaultValue !== null &&
          currentDefaultValue !== 0 &&
          Math.abs(currentDefaultValue - valorPagamentoFloat) > 0.001
        ) {
          shouldPromptUpdateDefault = true;
          formValueForPrompt = valorPagamentoFloat;
          defaultValueForPrompt = currentDefaultValue;
          paymentTypeForPrompt = paymentTypeDisplay;
        }
      }
    }

    if (shouldPromptUpdateDefault) {
      setUpdateDefaultPromptData({
        formValue: formValueForPrompt,
        defaultValue: defaultValueForPrompt,
        paymentType: paymentTypeForPrompt,
        userChoice: null,
      });
      setShowUpdateDefaultConfirmModal(true);
      return;
    }

    await proceedWithSubmission('save_only_no_prompt');
  };

  const proceedWithSubmission = async userChoice => {
    setFormErrors({});

    if (userChoice === 'cancel_operation') {
      setShowUpdateDefaultConfirmModal(false);
      if (typeof onCancel === 'function') {
        onCancel();
      }
      return;
    }

    const dataToSubmit = {
      obra: parseInt(formData.obra, 10),
      data_locacao_inicio: formData.data_locacao_inicio,
      data_locacao_fim: formData.data_locacao_fim || null,
      equipe: null,
      funcionario_locado: null,
      servico_externo: '',
      tipo_pagamento: formData.tipo_pagamento,
      valor_pagamento: parseFloat(formData.valor_pagamento),
      data_pagamento: formData.data_pagamento || null,
      observacoes: formData.observacoes.trim() || null,
    };

    if (locacaoType === 'equipe') {
      dataToSubmit.equipe = formData.equipe
        ? parseInt(formData.equipe, 10)
        : null;
    } else if (locacaoType === 'funcionario') {
      dataToSubmit.funcionario_locado = formData.funcionario_locado
        ? parseInt(formData.funcionario_locado, 10)
        : null;
    } else if (locacaoType === 'servico_externo') {
      dataToSubmit.servico_externo = formData.servico_externo.trim() || null;
    }

    let funcionarioDefaultUpdated = false;

    if (
      userChoice === 'update_default_and_save' &&
      selectedFuncionarioObject &&
      updateDefaultPromptData.paymentType
    ) {
      let fieldToUpdate = '';
      if (updateDefaultPromptData.paymentType === 'diária')
        fieldToUpdate = 'valor_diaria_padrao';
      else if (updateDefaultPromptData.paymentType === 'metro')
        fieldToUpdate = 'valor_metro_padrao';
      else if (updateDefaultPromptData.paymentType === 'empreitada')
        fieldToUpdate = 'valor_empreitada_padrao';

      if (fieldToUpdate) {
        try {
          await api.updateFuncionario(selectedFuncionarioObject.id, {
            [fieldToUpdate]: updateDefaultPromptData.formValue.toFixed(2),
          });
          funcionarioDefaultUpdated = true;
          const updatedEmployee = {
            ...selectedFuncionarioObject,
            [fieldToUpdate]: updateDefaultPromptData.formValue.toFixed(2),
          };
          setSelectedFuncionarioObject(updatedEmployee);
        } catch (error) {
          setFormErrors(prev => ({
            ...prev,
            general: `Falha ao atualizar o valor padrão do funcionário: ${error.message}. A locação não foi salva.`,
          }));
          const confirmSaveAnyway = window.confirm(
            'Falha ao atualizar o valor padrão do funcionário. Deseja salvar a locação mesmo assim?'
          );
          if (!confirmSaveAnyway) {
            if (typeof onCancel === 'function') onCancel();
            return;
          }
        }
      }
    }

    if (
      userChoice === 'save_only_no_prompt' ||
      userChoice === 'save_only' ||
      funcionarioDefaultUpdated ||
      (userChoice === 'update_default_and_save' &&
        !funcionarioDefaultUpdated &&
        window.confirm(
          'Falha ao atualizar o valor padrão. Salvar mesmo assim?'
        ))
    ) {
      try {
        await onSubmit(dataToSubmit, formData.anexos);
      } catch (err) {
        const backendErrors = err.response?.data;
        if (
          backendErrors?.conflict_details &&
          backendErrors?.funcionario_locado
        ) {
          setTransferDetails({
            conflictingLocacao: backendErrors.conflict_details,
            newLocacaoData: dataToSubmit,
            conflictMessage:
              typeof backendErrors.funcionario_locado === 'string'
                ? backendErrors.funcionario_locado
                : JSON.stringify(backendErrors.funcionario_locado),
          });
          setShowTransferConfirm(true);
        } else if (backendErrors && typeof backendErrors === 'object') {
          const newFormErrors = {};
          for (const key in backendErrors) {
            if (key === 'conflict_details') continue;
            newFormErrors[key] = Array.isArray(backendErrors[key])
              ? backendErrors[key].join('; ')
              : typeof backendErrors[key] === 'string'
                ? backendErrors[key]
                : JSON.stringify(backendErrors[key]);
          }
          setFormErrors(newFormErrors);
        } else if (err.message) {
          setFormErrors({ general: err.message });
        } else {
          setFormErrors({
            general: 'Ocorreu um erro desconhecido ao salvar a locação.',
          });
        }
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
        new_locacao_data: transferDetails.newLocacaoData,
      });
      setShowTransferConfirm(false);
      setTransferDetails(null);
      if (onTransferSuccess) {
        onTransferSuccess();
      } else {
        onCancel();
      }
    } catch (err) {
      const backendErrors = err.response?.data;
      if (backendErrors && typeof backendErrors === 'object') {
        const newFormErrors = {};
        for (const key in backendErrors) {
          newFormErrors[key] = Array.isArray(backendErrors[key])
            ? backendErrors[key].join('; ')
            : backendErrors[key];
        }
        setFormErrors(newFormErrors);
      } else {
        setFormErrors({
          general: `Falha ao transferir funcionário: ${err.message || 'Erro desconhecido.'}`,
        });
      }
    } finally {
      setIsTransferring(false);
    }
  };

  return (
    <>
      <form onSubmit={handleSubmit} className="space-y-6">
        {formErrors.general && (
          <p className="text-sm text-red-600 bg-red-100 p-2 rounded-md">
            {formErrors.general}
          </p>
        )}

        <div>
          <label
            htmlFor="obra"
            className="block text-sm font-medium text-gray-900"
          >
            Obra <span className="text-red-500">*</span>
          </label>
          <ObraAutocomplete
            value={selectedObraObject}
            onObraSelect={handleObraSelect}
            error={formErrors.obra}
          />
          {formErrors.obra && (
            <p className="mt-1 text-sm text-red-600">{formErrors.obra}</p>
          )}
        </div>

        <div className="mb-4">
          <label className="block mb-2 text-sm font-medium text-gray-900">
            Tipo de Locação <span className="text-red-500">*</span>
          </label>
          <div className="flex items-center space-x-4">
            <label className="flex items-center">
              <input
                type="radio"
                name="locacaoType"
                value="equipe"
                checked={locacaoType === 'equipe'}
                onChange={handleLocacaoTypeChange}
                className="mr-1 h-4 w-4 text-primary-600 border-gray-300 focus:ring-primary-500"
              />{' '}
              Equipe
            </label>
            <label className="flex items-center">
              <input
                type="radio"
                name="locacaoType"
                value="funcionario"
                checked={locacaoType === 'funcionario'}
                onChange={handleLocacaoTypeChange}
                className="mr-1 h-4 w-4 text-primary-600 border-gray-300 focus:ring-primary-500"
              />{' '}
              Funcionário
            </label>
            <label className="flex items-center">
              <input
                type="radio"
                name="locacaoType"
                value="servico_externo"
                checked={locacaoType === 'servico_externo'}
                onChange={handleLocacaoTypeChange}
                className="mr-1 h-4 w-4 text-primary-600 border-gray-300 focus:ring-primary-500"
              />{' '}
              Serviço Externo
            </label>
          </div>
        </div>

        {locacaoType === 'equipe' && (
          <div>
            <label
              htmlFor="equipe"
              className="block text-sm font-medium text-gray-900"
            >
              Equipe Interna <span className="text-red-500">*</span>
            </label>
            <EquipeAutocomplete
              value={selectedEquipeObject}
              onEquipeSelect={handleEquipeSelect}
              error={formErrors.equipe}
            />
            {formErrors.equipe && (
              <p className="mt-1 text-sm text-red-600">{formErrors.equipe}</p>
            )}
          </div>
        )}

        {locacaoType === 'funcionario' && (
          <div>
            <label
              htmlFor="funcionario_locado"
              className="block text-sm font-medium text-gray-900"
            >
              Funcionário <span className="text-red-500">*</span>
            </label>
            <FuncionarioAutocomplete
              value={selectedFuncionarioObject}
              onFuncionarioSelect={handleFuncionarioSelect}
              error={formErrors.funcionario_locado}
            />
            {formErrors.funcionario_locado && (
              <p className="mt-1 text-sm text-red-600">
                {formErrors.funcionario_locado}
              </p>
            )}
          </div>
        )}

        {locacaoType === 'servico_externo' && (
          <div>
            <label
              htmlFor="servico_externo"
              className="block text-sm font-medium text-gray-900"
            >
              Serviço Externo <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="servico_externo"
              id="servico_externo"
              value={formData.servico_externo}
              onChange={handleChange}
              className={`mt-1 block w-full bg-gray-50 border ${formErrors.servico_externo ? 'border-red-500' : 'border-gray-300'} text-gray-900 sm:text-sm rounded-md focus:ring-primary-500 focus:border-primary-500 px-3 py-2`}
              maxLength="255"
            />
            {formErrors.servico_externo && (
              <p className="mt-1 text-sm text-red-600">
                {formErrors.servico_externo}
              </p>
            )}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label
              htmlFor="data_locacao_inicio"
              className="block text-sm font-medium text-gray-900"
            >
              Data de Início da Locação <span className="text-red-500">*</span>
            </label>
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
            <label
              htmlFor="data_locacao_fim"
              className="block text-sm font-medium text-gray-900"
            >
              Data Fim Locação (Opcional)
            </label>
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

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6 pt-6 border-t">
          <div>
            <label
              htmlFor="tipo_pagamento"
              className="block text-sm font-medium text-gray-900"
            >
              Tipo de Pagamento <span className="text-red-500">*</span>
            </label>
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
            {formErrors.tipo_pagamento && (
              <p className="mt-1 text-sm text-red-600">
                {formErrors.tipo_pagamento}
              </p>
            )}
          </div>
          <div>
            <label
              htmlFor="valor_pagamento"
              className="block text-sm font-medium text-gray-900"
            >
              Valor do Pagamento <span className="text-red-500">*</span>
            </label>
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
            {formErrors.valor_pagamento && (
              <p className="mt-1 text-sm text-red-600">
                {formErrors.valor_pagamento}
              </p>
            )}
          </div>
          <div>
            <label
              htmlFor="data_pagamento"
              className="block text-sm font-medium text-gray-900"
            >
              Data Pagamento (Opcional)
            </label>
            <input
              type="date"
              name="data_pagamento"
              id="data_pagamento"
              value={formData.data_pagamento}
              onChange={handleChange}
              className="mt-1 block w-full bg-gray-50 border border-gray-300 text-gray-900 sm:text-sm rounded-md focus:ring-primary-500 focus:border-primary-500 px-3 py-2"
            />
            {formErrors.data_pagamento && (
              <p className="mt-1 text-sm text-red-600">
                {formErrors.data_pagamento}
              </p>
            )}
          </div>
        </div>

        <div className="mt-6 pt-6 border-t">
          <label
            htmlFor="observacoes"
            className="block text-sm font-medium text-gray-900"
          >
            Observações
          </label>
          <textarea
            name="observacoes"
            id="observacoes"
            value={formData.observacoes}
            onChange={handleChange}
            rows="3"
            className="mt-1 block w-full bg-gray-50 border border-gray-300 text-gray-900 sm:text-sm rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 px-3 py-2"
            placeholder="Adicione observações relevantes sobre a locação..."
          ></textarea>
        </div>

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
                ? 'Atualizar Locação'
                : 'Adicionar Locação'}
          </button>
        </div>
      </form>

      {showUpdateDefaultConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60">
          <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-lg">
            <h2 className="text-xl font-semibold mb-4 text-gray-800">
              Atualizar Valor Padrão?
            </h2>
            <p className="mb-6 text-sm text-gray-700">
              O valor da {updateDefaultPromptData.paymentType} (R${' '}
              {updateDefaultPromptData.formValue?.toFixed(2)}) é diferente do
              padrão atual do funcionário (R${' '}
              {updateDefaultPromptData.defaultValue?.toFixed(2)}).
              <br />
              Deseja atualizar o valor padrão do funcionário para R${' '}
              {updateDefaultPromptData.formValue?.toFixed(2)}?
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowUpdateDefaultConfirmModal(false);
                  proceedWithSubmission('cancel_operation');
                }}
                className="py-2 px-4 text-sm font-medium text-gray-800 bg-gray-200 rounded-md hover:bg-gray-300"
              >
                Cancelar Operação
              </button>
              <button
                onClick={() => {
                  setShowUpdateDefaultConfirmModal(false);
                  proceedWithSubmission('save_only');
                }}
                className="py-2 px-4 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md"
              >
                Não, salvar locação sem atualizar
              </button>
              <button
                onClick={() => {
                  setShowUpdateDefaultConfirmModal(false);
                  proceedWithSubmission('update_default_and_save');
                }}
                className="py-2 px-4 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-md"
              >
                Sim, atualizar e salvar locação
              </button>
            </div>
          </div>
        </div>
      )}

      {showTransferConfirm && transferDetails && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60">
          <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-lg">
            <h2 className="text-xl font-semibold mb-4 text-yellow-700">
              Conflito de Locação Detectado
            </h2>
            <p className="mb-2 text-sm text-gray-700">
              {transferDetails.conflictMessage ||
                'Este funcionário já possui uma locação que conflita com as datas informadas.'}
            </p>
            <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md text-sm">
              <p>
                <strong>Obra Conflitante:</strong>{' '}
                {transferDetails.conflictingLocacao.obra_nome}
              </p>
              <p>
                <strong>Período Conflitante:</strong>
                {new Date(
                  transferDetails.conflictingLocacao.data_inicio + 'T00:00:00'
                ).toLocaleDateString()}{' '}
                -{' '}
                {transferDetails.conflictingLocacao.data_fim
                  ? new Date(
                      transferDetails.conflictingLocacao.data_fim + 'T00:00:00'
                    ).toLocaleDateString()
                  : 'Indefinido'}
              </p>
            </div>
            <p className="mb-6 text-sm text-gray-700">
              Deseja transferir o funcionário para esta nova locação? A locação
              anterior na obra '{transferDetails.conflictingLocacao.obra_nome}'
              será finalizada em{' '}
              {new Date(
                new Date(
                  transferDetails.newLocacaoData.data_locacao_inicio
                ).getTime() - 86400000
              ).toLocaleDateString()}{' '}
              (um dia antes) e seu custo será removido da obra anterior.
            </p>
            {formErrors.general && (
              <p className="text-red-600 text-sm mb-3">{formErrors.general}</p>
            )}
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowTransferConfirm(false);
                  setTransferDetails(null);
                  setFormErrors({});
                }}
                disabled={isTransferring}
                className="py-2 px-4 text-sm font-medium text-gray-800 bg-gray-200 rounded-md hover:bg-gray-300 disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirmTransfer}
                disabled={isTransferring}
                className="py-2 px-4 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 disabled:bg-primary-300"
              >
                {isTransferring
                  ? 'Transferindo...'
                  : 'Sim, Transferir Funcionário'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default LocacaoForm;
