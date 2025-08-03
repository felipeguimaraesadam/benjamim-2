import React, { useState, useEffect } from 'react';
import * as api from '../../services/api';
import SpinnerIcon from '../utils/SpinnerIcon'; // Import SpinnerIcon

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
  const [funcionarios, setFuncionarios] = useState([]);
  const [selectedFuncionarioObject, setSelectedFuncionarioObject] =
    useState(null); // New state
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
    observacoes: '', // New field
    anexos: [],
  });
  const [formErrors, setFormErrors] = useState({});
  const [showTransferConfirm, setShowTransferConfirm] = useState(false);
  const [transferDetails, setTransferDetails] = useState(null);
  const [isTransferring, setIsTransferring] = useState(false);

  // State for the new update default value prompt
  const [showUpdateDefaultConfirmModal, setShowUpdateDefaultConfirmModal] =
    useState(false);
  const [updateDefaultPromptData, setUpdateDefaultPromptData] = useState({
    formValue: null,
    defaultValue: null,
    paymentType: '',
    // To store user's choice from this modal
    userChoice: null, // 'update_default_and_save', 'save_without_update', 'cancel_operation'
  });

  // Fetch Funcionarios
  useEffect(() => {
    const fetchAllFuncionarios = async () => {
      try {
        // Request a large page size to get all/most funcionarios
        // Assuming 500 is a reasonable upper limit for selection in a dropdown.
        // Adjust if necessary.
        const response = await api.getFuncionarios({ page_size: 500 });
        // Ensure that we are setting an array to the state.
        // Access response.data.results for paginated data.
        // Default to an empty array if results are not available.
        setFuncionarios(response.data?.results || []);
      } catch (error) {
        console.error('Erro ao buscar funcionários:', error);
        setFuncionarios([]); // Set to empty array on error to prevent .map issues
        setFormErrors(prev => ({
          ...prev,
          funcionarios: 'Falha ao carregar funcionários.',
        }));
      }
    };

    fetchAllFuncionarios();
  }, []); // Empty dependency array means this runs once on mount.

  useEffect(() => {
    if (initialData) {
      const inicio = initialData.data_locacao_inicio
        ? new Date(initialData.data_locacao_inicio).toISOString().split('T')[0]
        : '';
      let fim = initialData.data_locacao_fim
        ? new Date(initialData.data_locacao_fim).toISOString().split('T')[0]
        : '';
      if (inicio && !fim) {
        fim = inicio;
      }
      setFormData({
        obra: initialData.obra?.id || initialData.obra || '', // Handle if obra is object or just ID
        equipe: initialData.equipe?.id || initialData.equipe || '',
        funcionario_locado:
          initialData.funcionario_locado?.id ||
          initialData.funcionario_locado ||
          '',
        servico_externo: initialData.servico_externo || '',
        data_locacao_inicio: inicio,
        data_locacao_fim: fim,
        tipo_pagamento: initialData.tipo_pagamento || 'diaria', // New
        valor_pagamento: initialData.valor_pagamento || '', // New
        data_pagamento: initialData.data_pagamento
          ? new Date(initialData.data_pagamento).toISOString().split('T')[0]
          : '', // New
        observacoes: initialData.observacoes || '', // New field
      });
      if (initialData.equipe) setLocacaoType('equipe');
      else if (initialData.funcionario_locado) setLocacaoType('funcionario');
      else if (initialData.servico_externo) setLocacaoType('servico_externo');
      else setLocacaoType('equipe'); // Default
    } else {
      const getLocalYYYYMMDD = () => {
        // Defined here for clarity in this block
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
        data_locacao_fim: localToday, // Default data_locacao_fim to data_locacao_inicio for new forms
        tipo_pagamento: 'diaria',
        valor_pagamento: '',
        data_pagamento: localToday, // Use local current date
        observacoes: '', // New field
      });
      setLocacaoType('equipe'); // Default for new
      setSelectedFuncionarioObject(null); // Reset selected funcionario on form reset
    }
    setFormErrors({});
  }, [initialData, obras]); // Removed 'funcionarios' from dependency array to prevent reset on fetch complete if editing

  // Helper function to get the next Friday
  function getNextFriday(dateString) {
    if (!dateString) return '';
    // Adjust dateString to be local timezone by default for 'new Date()'
    // Splitting and rejoining ensures that if dateString is 'YYYY-MM-DD', it's treated as local.
    const parts = dateString.split('-');
    const localDate = new Date(parts[0], parts[1] - 1, parts[2]);

    const dayOfWeek = localDate.getDay(); // Sunday = 0, ..., Friday = 5, Saturday = 6
    let daysUntilFriday = 5 - dayOfWeek;
    if (daysUntilFriday < 0) {
      // If dayOfWeek is Saturday (6), daysUntilFriday is -1. Next Friday is in 6 days.
      daysUntilFriday += 7;
    }
    localDate.setDate(localDate.getDate() + daysUntilFriday);
    return localDate.toISOString().split('T')[0]; // Format YYYY-MM-DD
  }

  const handleLocacaoTypeChange = e => {
    const newType = e.target.value;
    setLocacaoType(newType);

    let newFuncLocadoId = formData.funcionario_locado; // Preserve current ID by default
    let newSelectedFuncObj = selectedFuncionarioObject;
    let newValorPagamento = formData.valor_pagamento;

    if (newType !== 'funcionario') {
      newFuncLocadoId = ''; // Clear funcionario ID if type is not funcionario
      newSelectedFuncObj = null;
      newValorPagamento = ''; // Clear payment value as context is lost
    } else {
      // Switching TO 'funcionario' type.
      // If a funcionario ID already exists in formData (e.g. from initialData, or toggling type),
      // try to find that funcionario object and prefill payment.
      if (formData.funcionario_locado) {
        // formData.funcionario_locado holds the ID
        const func = funcionarios.find(
          f => f.id.toString() === formData.funcionario_locado.toString()
        );
        newSelectedFuncObj = func || null;
        if (func && formData.tipo_pagamento) {
          // Use current formData.tipo_pagamento
          const valorPadraoKey = `valor_${formData.tipo_pagamento}_padrao`;
          const valorPadrao = func[valorPadraoKey];
          if (
            valorPadrao !== null &&
            valorPadrao !== undefined &&
            valorPadrao !== ''
          ) {
            newValorPagamento = parseFloat(valorPadrao).toFixed(2);
          } else {
            newValorPagamento = ''; // No default for this type
          }
        } else {
          newValorPagamento = ''; // No func found or no tipo_pagamento, clear payment
        }
      } else {
        // Switching to 'funcionario' but no funcionario_locado ID is set yet in formData,
        // so clear selected object and payment.
        newSelectedFuncObj = null;
        newValorPagamento = '';
      }
      // newFuncLocadoId remains as formData.funcionario_locado (which could be '' or an ID)
    }

    setSelectedFuncionarioObject(newSelectedFuncObj);
    setFormData(prev => ({
      ...prev,
      equipe: newType === 'equipe' ? prev.equipe || '' : '', // Keep if type is equipe and exists, else clear
      funcionario_locado: newFuncLocadoId,
      servico_externo:
        newType === 'servico_externo' ? prev.servico_externo || '' : '', // Keep if type is servico_externo and exists, else clear
      valor_pagamento: newValorPagamento,
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

  // This useEffect is to handle the case where initialData sets a funcionario_locado
  // and we need to populate selectedFuncionarioObject and potentially valor_pagamento.
  useEffect(() => {
    if (initialData?.funcionario_locado && funcionarios.length > 0) {
      const funcId =
        initialData.funcionario_locado.id || initialData.funcionario_locado;
      const func = funcionarios.find(
        f => f.id.toString() === funcId.toString()
      );
      if (func) {
        setSelectedFuncionarioObject(func);
        // If valor_pagamento was not part of initialData or is empty, try to prefill
        // Ensure that we also check if formData.tipo_pagamento is already set (it should be by initialData)
        const tipoPagamento =
          initialData.tipo_pagamento || formData.tipo_pagamento; // Prefer initialData's type
        if (!initialData.valor_pagamento && tipoPagamento) {
          const valorPadraoKey = `valor_${tipoPagamento}_padrao`;
          const valorPadrao = func[valorPadraoKey];
          if (
            valorPadrao !== null &&
            valorPadrao !== undefined &&
            valorPadrao !== ''
          ) {
            setFormData(prev => ({
              ...prev,
              valor_pagamento: parseFloat(valorPadrao).toFixed(2),
            }));
          }
        }
      }
    }
  }, [initialData, funcionarios]); // Trigger when initialData or funcionarios list changes

  const handleChange = e => {
    const { name, value } = e.target;
    let newFormData = { ...formData, [name]: value };

    if (name === 'funcionario_locado') {
      const selectedFunc = funcionarios.find(f => f.id.toString() === value);
      setSelectedFuncionarioObject(selectedFunc || null);
      // Auto-fill payment value if funcionario and type of payment are set
      if (selectedFunc && newFormData.tipo_pagamento) {
        const valorPadraoKey = `valor_${newFormData.tipo_pagamento}_padrao`;
        const valorPadrao = selectedFunc[valorPadraoKey];
        if (
          valorPadrao !== null &&
          valorPadrao !== undefined &&
          valorPadrao !== ''
        ) {
          newFormData = {
            ...newFormData,
            valor_pagamento: parseFloat(valorPadrao).toFixed(2),
          };
        } else {
          // If no standard value for that type, clear it or set to default
          newFormData = { ...newFormData, valor_pagamento: '' };
        }
      } else if (!selectedFunc) {
        // Funcionario cleared
        newFormData = { ...newFormData, valor_pagamento: '' };
      }
    } else if (name === 'tipo_pagamento') {
      // Auto-fill payment value if funcionario is already selected and type of payment changes
      if (selectedFuncionarioObject) {
        const valorPadraoKey = `valor_${value}_padrao`; // value here is the new tipo_pagamento
        const valorPadrao = selectedFuncionarioObject[valorPadraoKey];
        if (
          valorPadrao !== null &&
          valorPadrao !== undefined &&
          valorPadrao !== ''
        ) {
          newFormData = {
            ...newFormData,
            valor_pagamento: parseFloat(valorPadrao).toFixed(2),
          };
        } else {
          newFormData = { ...newFormData, valor_pagamento: '' };
        }
      }
    } else if (name === 'data_locacao_inicio') {
      const newDataInicio = value; // value is the new data_locacao_inicio
      const currentDataFim = newFormData.data_locacao_fim;
      if (
        !currentDataFim ||
        (newDataInicio &&
          currentDataFim &&
          new Date(currentDataFim) < new Date(newDataInicio))
      ) {
        newFormData = { ...newFormData, data_locacao_fim: newDataInicio };
      }
      // If data_locacao_inicio is cleared, data_locacao_fim should also be cleared or handled as per business rule
      if (!newDataInicio) {
        newFormData = {
          ...newFormData,
          data_locacao_fim: '',
          data_pagamento: '',
        }; // Clear payment date if start date is cleared
      } else {
        // Auto-fill payment date
        const nextFriday = getNextFriday(newDataInicio);
        newFormData = { ...newFormData, data_pagamento: nextFriday };
      }
    }

    setFormData(newFormData);

    if (formErrors[name]) {
      setFormErrors(prev => ({ ...prev, [name]: null }));
    }
    // Clear specific errors if related fields change
    if (name === 'funcionario_locado' || name === 'tipo_pagamento') {
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

    // New validation rules
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

    // Detection logic for differing payment values
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
      let paymentTypeDisplay = ''; // For user-friendly display in prompt

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
        // Ensure currentDefaultValue is treated as null if it's an empty string or null/undefined
        const currentDefaultValue =
          currentDefaultValueString !== null &&
          currentDefaultValueString !== undefined &&
          currentDefaultValueString !== ''
            ? parseFloat(currentDefaultValueString)
            : null;

        // Prompt if:
        // 1. There was a meaningful default value (not null, not 0).
        // 2. The current form value is different from this default.
        if (
          currentDefaultValue !== null &&
          currentDefaultValue !== 0 &&
          Math.abs(currentDefaultValue - valorPagamentoFloat) > 0.001
        ) {
          shouldPromptUpdateDefault = true;
          formValueForPrompt = valorPagamentoFloat;
          defaultValueForPrompt = currentDefaultValue;
          paymentTypeForPrompt = paymentTypeDisplay; // Use the display name
        }
      }
    }

    // If shouldPromptUpdateDefault is true, show prompt and pause submission.
    if (shouldPromptUpdateDefault) {
      setUpdateDefaultPromptData({
        formValue: formValueForPrompt,
        defaultValue: defaultValueForPrompt,
        paymentType: paymentTypeForPrompt,
        userChoice: null, // Reset any previous choice
      });
      setShowUpdateDefaultConfirmModal(true);
      return; // Stop handleSubmit execution here; modal actions will continue it
    }

    // If not prompting, or if continuing after prompt (logic for this will be added in next step),
    // proceed to prepare data for submission.
    // For THIS SUBTASK, if prompt isn't shown, we don't proceed to actual onSubmit call yet.
    // This will be completed in the "Conditional Submission Logic" step.
    // So, if no prompt, we effectively do nothing further in handleSubmit for now.
    // The actual call to onSubmit(dataToSubmit) will be handled based on userChoice or if no prompt was needed.

    // If not prompting, call proceedWithSubmission directly.
    if (!shouldPromptUpdateDefault) {
      // setLoading(true) should be called before proceedWithSubmission
      // or handled consistently if proceedWithSubmission is always async.
      // For now, assuming parent component's isLoading handles this or proceedWithSubmission handles its own loading state.
      await proceedWithSubmission('save_only_no_prompt');
    }
    // If shouldPromptUpdateDefault is true, the modal buttons will call proceedWithSubmission.
    // setLoading(false) will be handled by proceedWithSubmission.
  };

  // New function to handle the actual submission logic
  const proceedWithSubmission = async userChoice => {
    // Ensure isLoading is true at the beginning of submission process
    // This might be redundant if parent component's isLoading is already true
    // and passed to this form, but good for self-contained logic if needed.
    // For now, assuming `onSubmit` (passed from parent) handles overall loading state.

    setFormErrors({}); // Clear previous errors

    if (userChoice === 'cancel_operation') {
      setShowUpdateDefaultConfirmModal(false); // Should already be false
      // onCancel(); // Call original form cancel if needed, or just ensure loading is false.
      // The parent's isLoading state should be managed.
      // If this component manages its own isLoading for the submit button, set it here.
      // For now, assuming parent's onCancel handles loading state.
      if (typeof onCancel === 'function') {
        // Ensure onCancel is a function before calling
        onCancel(); // This typically resets parent's form visibility and loading state.
      } else {
        // Fallback if onCancel is not provided or not a function.
        // Manage local loading state if applicable, or log.
        console.warn('onCancel prop is not a function or not provided.');
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
      // Payment fields
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

          // Update local selectedFuncionarioObject state
          const updatedEmployee = {
            ...selectedFuncionarioObject,
            [fieldToUpdate]: updateDefaultPromptData.formValue.toFixed(2),
          };
          setSelectedFuncionarioObject(updatedEmployee);

          // Also update this employee in the main 'funcionarios' list if present
          setFuncionarios(prevFuncionarios =>
            prevFuncionarios.map(func =>
              func.id === updatedEmployee.id ? updatedEmployee : func
            )
          );

          // Optionally, show success toast for default value update
          console.log('Valor padrão do funcionário atualizado com sucesso!');
        } catch (error) {
          console.error(
            'Falha ao atualizar valor padrão do funcionário:',
            error
          );
          setFormErrors(prev => ({
            ...prev,
            general: `Falha ao atualizar o valor padrão do funcionário: ${error.message}. A locação não foi salva.`,
          }));
          // If parent component handles isLoading via prop, ensure it's reset
          if (typeof onCancel === 'function' && isLoading) {
            // A bit of a hack, better to have explicit setLoading from parent
            // onCancel(); // This might be too drastic.
          }
          // Decide if we should stop or still try to save the locacao.
          // For now, if update fails, we stop. User can try again.
          // Or, ask: "Falha ao atualizar o padrão. Deseja salvar a locação mesmo assim?"
          const confirmSaveAnyway = window.confirm(
            'Falha ao atualizar o valor padrão do funcionário. Deseja salvar a locação mesmo assim?'
          );
          if (!confirmSaveAnyway) {
            if (typeof onCancel === 'function') onCancel(); // Or a specific setLoading(false)
            return;
          }
          // If they want to save anyway, proceed as if 'save_only'
        }
      }
    }

    // Proceed to save the lease if:
    // - No prompt was needed ('save_only_no_prompt')
    // - User chose to save without updating ('save_only')
    // - User chose to update, and update was successful OR they chose to save anyway after update failure.
    if (
      userChoice === 'save_only_no_prompt' ||
      userChoice === 'save_only' ||
      funcionarioDefaultUpdated ||
      (userChoice === 'update_default_and_save' &&
        !funcionarioDefaultUpdated &&
        window.confirm(
          'Falha ao atualizar o valor padrão do funcionário. Deseja salvar a locação mesmo assim?'
        ))
    ) {
      try {
        await onSubmit(dataToSubmit); // onSubmit is the prop from parent, handles actual locacao save
        // and subsequent state changes like closing modal, fetching data.
      } catch (err) {
        // Error handling for locacao submission (conflict, validation, etc.)
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
        // If onSubmit itself throws, the parent's isLoading should ideally be handled by the parent.
        // If this component's submit button has its own isLoading state, reset it here.
      }
    }
    // If we reached here, and not cancelled, the operation is considered complete from this function's perspective.
    // Parent's onSubmit or onCancel should handle final loading state.
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
        // Call the new success handler from parent
        onTransferSuccess();
      } else {
        // Fallback if prop not provided (though it should be)
        onCancel();
      }
    } catch (err) {
      const backendErrors = err.response?.data;
      if (backendErrors && typeof backendErrors === 'object') {
        const newFormErrors = {};
        // Display these errors in the main form area, or a dedicated area in transfer modal
        for (const key in backendErrors) {
          newFormErrors[key] = Array.isArray(backendErrors[key])
            ? backendErrors[key].join('; ')
            : backendErrors[key];
        }
        setFormErrors(newFormErrors); // These errors will show on the main form after transfer modal closes if not handled there.
        // Or, display them within the transfer modal itself if preferred.
        // For now, setting them on formErrors means they might appear if modal closes on error.
      } else {
        // Set general error to be displayed in the transfer modal or main form.
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
      {' '}
      {/* Fragment to wrap form and modal */}
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
          <select
            name="obra"
            id="obra"
            value={formData.obra}
            onChange={handleChange}
            className={`mt-1 block w-full bg-gray-50 border ${formErrors.obra ? 'border-red-500' : 'border-gray-300'} text-gray-900 sm:text-sm rounded-md focus:ring-primary-500 focus:border-primary-500 px-3 py-2`}
          >
            <option value="">Selecione uma Obra</option>
            {obras &&
              obras.map(obra => (
                <option key={obra.id} value={obra.id}>
                  {obra.nome_obra}
                </option>
              ))}
          </select>
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
            <select
              name="equipe"
              id="equipe"
              value={formData.equipe}
              onChange={handleChange}
              className={`mt-1 block w-full bg-gray-50 border ${formErrors.equipe ? 'border-red-500' : 'border-gray-300'} text-gray-900 sm:text-sm rounded-md focus:ring-primary-500 focus:border-primary-500 px-3 py-2`}
            >
              <option value="">Selecione uma Equipe</option>
              {equipes &&
                equipes.map(equipe => (
                  <option key={equipe.id} value={equipe.id}>
                    {equipe.nome_equipe}
                  </option>
                ))}
            </select>
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
            <select
              name="funcionario_locado"
              id="funcionario_locado"
              value={formData.funcionario_locado}
              onChange={handleChange}
              className={`mt-1 block w-full bg-gray-50 border ${formErrors.funcionario_locado ? 'border-red-500' : 'border-gray-300'} text-gray-900 sm:text-sm rounded-md focus:ring-primary-500 focus:border-primary-500 px-3 py-2`}
            >
              <option value="">Selecione um Funcionário</option>
              {funcionarios &&
                funcionarios.map(func => (
                  <option key={func.id} value={func.id}>
                    {func.nome_completo}
                  </option>
                ))}
            </select>
            {formErrors.funcionario_locado && (
              <p className="mt-1 text-sm text-red-600">
                {formErrors.funcionario_locado}
              </p>
            )}
            {formErrors.funcionarios && (
              <p className="mt-1 text-sm text-red-600">
                {formErrors.funcionarios}
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

        {/* Payment Fields Section */}
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

        {/* Observacoes Field Section */}
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
          {/* {formErrors.observacoes && <p className="mt-1 text-sm text-red-600">{formErrors.observacoes}</p>} */}
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
                ? 'Atualizar Locação'
                : 'Adicionar Locação'}
          </button>
        </div>
      </form>
      {/* Modal para confirmar atualização do valor padrão do funcionário */}
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
                -
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
            )}{' '}
            {/* Display general errors from transfer attempt */}
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
