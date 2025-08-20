import React, { useState, useEffect, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import ComprasTable from '../components/tables/ComprasTable';
import CompraForm from '../components/forms/CompraForm';
import CompraItensModal from '../components/modals/CompraItensModal';
import ObraAutocomplete from '../components/forms/ObraAutocomplete';
import {
  getCompras,
  getCompraById,
  createCompra,
  updateCompra,
  deleteCompra,
  updateCompraStatus,
  approveOrcamento,
  generateBulkComprasPDF,
} from '../services/api';
import PaginationControls from '../components/utils/PaginationControls';
import { showSuccessToast, showErrorToast } from '../utils/toastUtils';
import SpinnerIcon from '../components/utils/SpinnerIcon';

const AlertIcon = ({ type = 'error', className = 'w-5 h-5 mr-2' }) => {
  const color = type === 'error' ? 'currentColor' : 'currentColor'; // Adjust as needed
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke={color}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
      />
    </svg>
  );
};

const ComprasPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [compras, setCompras] = useState([]);
  const [isLoading, setIsLoading] = useState(false); // For page data
  const [isLoadingForm, setIsLoadingForm] = useState(false); // For form submission
  const [isDeleting, setIsDeleting] = useState(false); // For delete operation
  const [error, setError] = useState(null); // General page/form errors (can be reduced if toasts handle all)
  // const [successMessage, setSuccessMessage] = useState(''); // Replaced by toasts

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [totalItems, setTotalItems] = useState(0);
  const PAGE_SIZE = 10;

  const [isAddingNew, setIsAddingNew] = useState(false); // Controls form visibility for new entry
  const [currentCompra, setCurrentCompra] = useState(null); // For editing

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [compraToDeleteId, setCompraToDeleteId] = useState(null);

  // State for Itens Modal
  const [isItensModalOpen, setIsItensModalOpen] = useState(false);
  const [selectedCompraParaModal, setSelectedCompraParaModal] = useState(null); // Renamed and initialized to null
  
  // Selection state for bulk operations
  const [selectedCompras, setSelectedCompras] = useState(new Set());
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);

  const handleDuplicateCompra = async compraSummary => {
    setIsLoadingForm(true);
    setError(null);
    try {
      const response = await getCompraById(compraSummary.id);
      const fullCompraData = response.data || response;
      const duplicatedCompra = {
        ...fullCompraData,
        id: null, // Important: nullify ID for creation
        data_compra: new Date().toISOString().split('T')[0], // Set to today or null
        nota_fiscal: '', // Clear nota fiscal
        // data_pagamento can be cleared or kept, depending on desired behavior
        data_pagamento: null,
      };
      setCurrentCompra(duplicatedCompra);
      setIsAddingNew(true); // This will show the form
    } catch (err) {
      const errorMsg = `Falha ao carregar dados para duplicar a compra ID ${compraSummary.id}.`;
      setError(errorMsg);
      showErrorToast(errorMsg);
      console.error('Error fetching compra details for duplication:', err);
    } finally {
      setIsLoadingForm(false);
    }
  };

  const handleToggleStatus = async (id, field) => {
    try {
      await updateCompraStatus(id, { [field]: true });
      fetchCompras(currentPage, {
        dataInicio,
        dataFim,
        fornecedor,
        tipo,
        obraId,
      });
      showSuccessToast('Status da compra atualizado com sucesso!');
    } catch {
      showErrorToast('Falha ao atualizar o status da compra.');
    }
  };

  // State for filters
  const [dataInicio, setDataInicio] = useState('');
  const [dataFim, setDataFim] = useState('');
  const [fornecedor, setFornecedor] = useState('');
  const [tipo, setTipo] = useState('');
  const [obraId, setObraId] = useState('');
  const [selectedObra, setSelectedObra] = useState(null);

  const fetchCompras = useCallback(
    async (page = 1, currentFilters = {}) => {
      setIsLoading(true);
      setError(null);

      const params = { page };
      if (currentFilters.dataInicio)
        params.data_inicio = currentFilters.dataInicio;
      if (currentFilters.dataFim) params.data_fim = currentFilters.dataFim;
      if (
        currentFilters.fornecedor &&
        currentFilters.fornecedor.trim() !== ''
      ) {
        params.fornecedor = currentFilters.fornecedor.trim();
      }
      if (currentFilters.tipo) params.tipo = currentFilters.tipo;
      if (currentFilters.obraId) params.obra_id = currentFilters.obraId;

      try {
        const response = await getCompras(params);
        const comprasData = response.data.results || response.data || [];
        console.log('[DEBUG ComprasPage] Fetched Compras Array:', comprasData);
        if (comprasData.length > 0) {
          console.log(
            '[DEBUG ComprasPage] First Compra Object:',
            comprasData[0]
          );
          console.log(
            '[DEBUG ComprasPage] First Compra.obra (PK or object):',
            comprasData[0]?.obra
          );
          console.log(
            '[DEBUG ComprasPage] First Compra.obra_nome (direct field):',
            comprasData[0]?.obra_nome
          );
        }
        setCompras(comprasData);
        setTotalItems(response.data.count || 0);
        setTotalPages(Math.ceil((response.data.count || 0) / PAGE_SIZE));
        setCurrentPage(page);
      } catch (err) {
        const errorMsg =
          err.message || 'Falha ao buscar compras. Tente novamente.';
        setError(errorMsg); // Still set page error for critical fetch failure
        showErrorToast(errorMsg);
        console.error('Fetch Compras Error:', err);
      } finally {
        setIsLoading(false);
      }
    },
    [PAGE_SIZE]
  );

  useEffect(() => {
    // Fetch data when page or filters change, but only if not in add/edit mode
    if (!currentCompra && !isAddingNew) {
      fetchCompras(currentPage, {
        dataInicio,
        dataFim,
        fornecedor,
        tipo,
        obraId,
      });
    }
  }, [
    currentPage,
    fetchCompras,
    currentCompra,
    isAddingNew,
    dataInicio,
    dataFim,
    fornecedor,
    tipo,
    obraId,
  ]);

  useEffect(() => {
    const obraIdFromState = location.state?.obraIdParaNovaCompra;
    if (obraIdFromState && !currentCompra && !isAddingNew) {
      setCurrentCompra({ obra: obraIdFromState });
      setIsAddingNew(true);
      setError(null);
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location.state, navigate, currentCompra, isAddingNew]);

  const handleAddNewCompraClick = () => {
    setCurrentCompra(null);
    setIsAddingNew(true);
    setError(null);
    // setSuccessMessage(''); // Replaced by toasts
  };

  const handleEditCompra = async compraSummary => {
    setIsLoadingForm(true); // Consider a different loading state if this is separate from main form loading
    setError(null);
    // setSuccessMessage('');
    try {
      const response = await getCompraById(compraSummary.id);
      const fullCompraData = response.data || response;

      // Ensure `obra` is passed correctly to the form.
      // The form can handle either an object with an `id` or just the `id`.
      let processedCompraData = { ...fullCompraData };

      // No special processing needed here if the form's Select component can handle
      // an object `{id: X, ...}` or a simple value `X` for its value prop.
      // Let's pass the obra data as is, assuming the form's Select can derive the ID.
      // If `fullCompraData.obra` is just an ID, the form's Select should find the matching option.

      // Ensure `tipo` is correctly passed and is in uppercase
      processedCompraData.tipo = fullCompraData.tipo
        ? fullCompraData.tipo.toUpperCase()
        : 'COMPRA';

      setCurrentCompra(processedCompraData);
      setIsAddingNew(false); // Not adding new, but opening form for edit
    } catch (err) {
      const errorMsg =
        err.message ||
        `Falha ao buscar detalhes da compra ID ${compraSummary.id}.`;
      setError(errorMsg); // Error for the main page or form area
      showErrorToast(errorMsg);
      console.error('Error fetching compra details for edit:', err);
    } finally {
      setIsLoadingForm(false);
    }
  };

  const handleDeleteCompra = id => {
    setCompraToDeleteId(id);
    setShowDeleteConfirm(true);
  };

  const confirmDeleteCompra = async () => {
    if (!compraToDeleteId) return;
    setIsDeleting(true);
    setError(null);
    // setSuccessMessage('');
    try {
      await deleteCompra(compraToDeleteId);
      showSuccessToast('Compra excluída com sucesso!');
      setCompraToDeleteId(null);
      setShowDeleteConfirm(false);
      const currentFilters = { dataInicio, dataFim, fornecedor, tipo, obraId };
      if (compras.length === 1 && currentPage > 1) {
        fetchCompras(currentPage - 1, currentFilters);
      } else {
        fetchCompras(currentPage, currentFilters);
      }
    } catch (err) {
      const errorMsg = err.message || 'Falha ao excluir compra.';
      setError(errorMsg);
      showErrorToast(errorMsg);
      console.error('Delete Compra Error:', err);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleFormSubmit = async formData => {
    setIsLoadingForm(true);
    setError(null); // Clear previous form-specific errors
    // setSuccessMessage('');
    const isEditing = currentCompra && currentCompra.id;
    try {
      if (isEditing) {
        await updateCompra(currentCompra.id, formData);
        showSuccessToast('Compra atualizada com sucesso!');
      } else {
        await createCompra(formData);
        showSuccessToast('Compra registrada com sucesso!');
      }
      setCurrentCompra(null);
      setIsAddingNew(false);
      // Refetch with current filters, go to page 1 if new item created
      fetchCompras(isEditing ? currentPage : 1, {
        dataInicio,
        dataFim,
        fornecedor,
        tipo,
        obraId,
      });
    } catch (err) {
      let detailedError = isEditing
        ? 'Falha ao atualizar compra.'
        : 'Falha ao criar compra.';
      if (err.response && err.response.data) {
        const errorData = err.response.data;
        const messages = [];
        if (errorData.non_field_errors)
          messages.push(errorData.non_field_errors.join(' '));
        for (const key in errorData) {
          if (key !== 'non_field_errors' && Array.isArray(errorData[key]))
            messages.push(`${key}: ${errorData[key].join(' ')}`);
          else if (
            key !== 'non_field_errors' &&
            typeof errorData[key] === 'string'
          )
            messages.push(`${key}: ${errorData[key]}`);
          else if (errorData.detail && typeof errorData.detail === 'string')
            messages.push(errorData.detail);
        }
        if (Array.isArray(errorData))
          errorData.forEach(e =>
            messages.push(
              e.loc
                ? `${e.loc.join('.')}: ${e.msg}`
                : e.detail || JSON.stringify(e)
            )
          );
        if (messages.length > 0) detailedError = messages.join('; ');
        else if (typeof errorData === 'string') detailedError = errorData;
        else if (err.response.statusText && messages.length === 0)
          detailedError = `${err.response.status}: ${err.response.statusText}`;
      } else if (err.message) detailedError = err.message;
      setError(detailedError); // For display within the form/modal
      showErrorToast(detailedError); // General toast
    } finally {
      setIsLoadingForm(false);
    }
  };

  const handleFormCancel = () => {
    setCurrentCompra(null);
    setIsAddingNew(false);
    setError(null);
    // setSuccessMessage(''); // Replaced by toasts
  };

  const handlePageChange = newPage => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
      // fetchCompras will be called by useEffect due to currentPage change
    }
  };

  const handleApplyFilters = () => {
    setCurrentPage(1); // Reset to page 1 when applying new filters
    fetchCompras(1, { dataInicio, dataFim, fornecedor, tipo, obraId });
  };

  const handleObraSelect = obra => {
    setSelectedObra(obra);
    setObraId(obra ? obra.id : '');
  };

  const handleApprove = async compraId => {
    try {
      await approveOrcamento(compraId);
      fetchCompras(currentPage, {
        dataInicio,
        dataFim,
        fornecedor,
        tipo,
        obraId,
      });
      showSuccessToast('Orçamento aprovado com sucesso!');
    } catch {
      showErrorToast('Falha ao aprovar o orçamento.');
    }
  };

  const handleClearFilters = () => {
    setDataInicio('');
    setDataFim('');
    setFornecedor('');
    setTipo('');
    setObraId('');
    setSelectedObra(null);
    setCurrentPage(1); // Reset to page 1
    // fetchCompras(1, {}); // useEffect will trigger this due to state changes if currentPage was not 1
    // or if filter states are deps. Explicit call for clarity.
    // Actually, useEffect depends on filter states, so it will refetch.
  };

  const handleViewCompraItens = compra => {
    setSelectedCompraParaModal(compra); // Store the whole compra object
    setIsItensModalOpen(true);
  };

  const handleCloseItensModal = () => {
    setIsItensModalOpen(false);
    setSelectedCompraParaModal(null);
  };

  // Selection handlers
  const handleSelectCompra = (compraId, isSelected) => {
    setSelectedCompras(prev => {
      const newSet = new Set(prev);
      if (isSelected) {
        newSet.add(compraId);
      } else {
        newSet.delete(compraId);
      }
      return newSet;
    });
  };

  const handleSelectAll = (isSelected) => {
    if (isSelected) {
      setSelectedCompras(new Set(compras.map(compra => compra.id)));
    } else {
      setSelectedCompras(new Set());
    }
  };

  const handleClearSelection = () => {
    setSelectedCompras(new Set());
  };

  // Bulk PDF generation handler
  const handleGenerateBulkPDF = async () => {
    if (selectedCompras.size === 0) {
      setError('Selecione pelo menos uma compra para gerar o PDF.');
      return;
    }

    setIsGeneratingPDF(true);
    setError('');

    try {
      const selectedIds = Array.from(selectedCompras);
      const response = await generateBulkComprasPDF(selectedIds);
      
      // Create blob URL and trigger download
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `compras_${new Date().toISOString().split('T')[0]}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      showSuccessToast(`PDF gerado com sucesso para ${selectedIds.length} compra${selectedIds.length > 1 ? 's' : ''}!`);
      setSelectedCompras(new Set()); // Clear selection after successful generation
    } catch (err) {
      console.error('Error generating bulk PDF:', err);
      const errorMessage = err.response?.data?.message || 'Erro ao gerar PDF das compras selecionadas.';
      setError(errorMessage);
      showErrorToast(errorMessage);
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  let formInitialData = null;
  if (isAddingNew) formInitialData = currentCompra;
  else if (currentCompra) formInitialData = currentCompra;

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {' '}
      {/* Increased py */}
      {currentCompra || isAddingNew ? (
        <>
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 mb-6">
            {currentCompra && currentCompra.id
              ? 'Editar Compra'
              : 'Registrar Nova Compra'}
          </h1>
          {error && (
            <div
              className="bg-red-100 dark:bg-red-900 border-l-4 border-red-500 text-red-700 dark:text-red-200 px-4 py-3 rounded-md relative mb-5 flex items-center"
              role="alert"
            >
              <AlertIcon type="error" />
              <div>
                <strong className="font-bold">Erro: </strong>
                <span className="block sm:inline">{error}</span>
              </div>
            </div>
          )}
          <CompraForm
            key={currentCompra ? currentCompra.id : 'new-compra'}
            initialData={formInitialData}
            onSubmit={handleFormSubmit}
            onCancel={handleFormCancel}
            isLoading={isLoadingForm}
          />
        </>
      ) : (
        <>
          <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
            <h1 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">
              Gestão de Compras
            </h1>
            <button
              onClick={handleAddNewCompraClick}
              className="bg-primary-600 hover:bg-primary-700 text-white font-semibold py-2.5 px-5 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors"
            >
              Adicionar Compra
            </button>
          </div>

          {/* Filter Section */}
          <div className="my-4 p-4 border dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-700 shadow">
            <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-3">
              Filtrar Compras
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
              <div>
                <label
                  htmlFor="dataInicio"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                >
                  Data Início
                </label>
                <input
                  type="date"
                  id="dataInicio"
                  value={dataInicio}
                  onChange={e => setDataInicio(e.target.value)}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                />
              </div>
              <div>
                <label
                  htmlFor="dataFim"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                >
                  Data Fim
                </label>
                <input
                  type="date"
                  id="dataFim"
                  value={dataFim}
                  onChange={e => setDataFim(e.target.value)}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                />
              </div>
              <div>
                <label
                  htmlFor="fornecedor"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                >
                  Fornecedor
                </label>
                <input
                  type="text"
                  id="fornecedor"
                  value={fornecedor}
                  onChange={e => setFornecedor(e.target.value)}
                  placeholder="Nome do fornecedor"
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                />
              </div>
              <div>
                <label
                  htmlFor="tipo"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                >
                  Tipo
                </label>
                <select
                  id="tipo"
                  value={tipo}
                  onChange={e => setTipo(e.target.value)}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                >
                  <option value="">Todos</option>
                  <option value="COMPRA">Compra</option>
                  <option value="ORCAMENTO">Orçamento</option>
                </select>
              </div>
              <div>
                <label
                  htmlFor="obra-autocomplete"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                >
                  Obra
                </label>
                <ObraAutocomplete
                  value={selectedObra}
                  onObraSelect={handleObraSelect}
                  placeholder="Digite para buscar uma obra..."
                />
              </div>
              <div className="flex space-x-2 sm:pt-5">
                <button
                  onClick={handleApplyFilters}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors w-full sm:w-auto"
                >
                  Filtrar
                </button>
                <button
                  onClick={handleClearFilters}
                  className="bg-gray-300 dark:bg-gray-600 hover:bg-gray-400 dark:hover:bg-gray-500 text-gray-800 dark:text-gray-200 font-semibold py-2 px-4 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-400 transition-colors w-full sm:w-auto"
                >
                  Limpar
                </button>
              </div>
            </div>
          </div>

          {/* Page-level spinner for table data */}
          {isLoading && compras.length === 0 && (
            <div className="flex justify-center items-center min-h-[200px]">
              <SpinnerIcon className="w-10 h-10 text-primary-500" />
            </div>
          )}

          {/* Error display for fetch errors if not loading and no form is open */}
          {error && !isLoading && !currentCompra && !isAddingNew && (
            <div
              className="bg-red-100 dark:bg-red-900 border-l-4 border-red-500 text-red-700 dark:text-red-200 px-4 py-3 rounded-md relative mb-5"
              role="alert"
            >
              <div>
                <strong className="font-bold">Erro: </strong>
                <span className="block sm:inline">{error}</span>
              </div>
            </div>
          )}

          {/* Selection Actions */}
          {selectedCompras.size > 0 && (
            <div className="mb-4 p-4 bg-blue-50 dark:bg-blue-900 border border-blue-200 dark:border-blue-700 rounded-md">
              <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                <div className="text-sm text-blue-800 dark:text-blue-200">
                  {selectedCompras.size} compra{selectedCompras.size > 1 ? 's' : ''} selecionada{selectedCompras.size > 1 ? 's' : ''}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={handleGenerateBulkPDF}
                    disabled={isGeneratingPDF}
                    className="bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white font-semibold py-2 px-4 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors flex items-center gap-2"
                  >
                    {isGeneratingPDF ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        Gerando PDF...
                      </>
                    ) : (
                      'Gerar PDF'
                    )}
                  </button>
                  <button
                    onClick={handleClearSelection}
                    className="bg-gray-500 hover:bg-gray-600 text-white font-semibold py-2 px-4 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors"
                  >
                    Limpar Seleção
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Table and Pagination - only show if not initial loading or if data is present */}
          {(!isLoading || compras.length > 0) && (
            <>
              <ComprasTable
                compras={compras} // Now receives paginated data
                onEdit={handleEditCompra}
                onDelete={handleDeleteCompra}
                onViewDetails={handleViewCompraItens} // Pass the new handler
                onDuplicate={handleDuplicateCompra}
                onApprove={handleApprove}
                onToggleStatus={handleToggleStatus}
                isLoading={isLoading || isDeleting}
                selectedCompras={selectedCompras}
                onSelectCompra={handleSelectCompra}
                onSelectAll={handleSelectAll}
              />
              {totalPages > 0 && (
                <PaginationControls
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={handlePageChange}
                  totalItems={totalItems}
                  itemsPerPage={PAGE_SIZE}
                />
              )}
            </>
          )}
        </>
      )}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-xl w-full max-w-md">
            <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100 mb-5">
              Confirmar Exclusão
            </h2>
            <p className="mb-6 text-gray-600 dark:text-gray-300">
              Tem certeza que deseja excluir esta compra? Esta ação não pode ser
              desfeita.
            </p>
            <div className="flex justify-end space-x-4">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                disabled={isDeleting}
                className="py-2.5 px-5 text-sm font-medium text-gray-700 dark:text-gray-200 bg-slate-100 dark:bg-gray-600 rounded-md border border-slate-300 dark:border-gray-500 hover:bg-slate-200 dark:hover:bg-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-400 disabled:opacity-60 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={confirmDeleteCompra}
                disabled={isDeleting}
                className="py-2.5 px-5 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:bg-red-400 transition-colors flex items-center justify-center"
              >
                {isDeleting ? <SpinnerIcon className="w-5 h-5 mr-2" /> : null}
                {isDeleting ? 'Excluindo...' : 'Excluir'}
              </button>
            </div>
          </div>
        </div>
      )}
      <CompraItensModal
        isOpen={isItensModalOpen}
        onClose={handleCloseItensModal}
        compra={selectedCompraParaModal} // Pass the whole compra object
      />
    </div>
  );
};

export default ComprasPage;
