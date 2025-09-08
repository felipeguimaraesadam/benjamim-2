import React, { useState, useEffect, useCallback } from 'react';
import {
  DndContext,
  DragOverlay,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { restrictToWindowEdges } from '@dnd-kit/modifiers';
import {
  format,
  addDays,
  startOfWeek,
  endOfWeek,
  isSameDay,
  parseISO,
  isValid,
} from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'react-toastify';
import * as api from '../../services/api';
import WeekNavigator from './WeekNavigator';
import ComprasDayColumn from './ComprasDayColumn';
import CompraCard from './CompraCard';
import CompraDetailModal from '../modals/CompraDetailModal';
import CompraForm from '../forms/CompraForm';
import ContextMenu from '../utils/ContextMenu';
import { showSuccessToast, showErrorToast } from '../../utils/toastUtils';

const ComprasWeeklyPlanner = ({ selectedObra }) => {
  const [currentWeek, setCurrentWeek] = useState(new Date());
  const [compras, setCompras] = useState([]);
  const [fornecedores, setFornecedores] = useState([]);
  const [obras, setObras] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [activeId, setActiveId] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedCompraId, setSelectedCompraId] = useState(null);
  const [showFormModal, setShowFormModal] = useState(false);
  const [formInitialData, setFormInitialData] = useState(null);
  const [showDragConfirmModal, setShowDragConfirmModal] = useState(false);
  const [draggedCompra, setDraggedCompra] = useState(null);
  const [targetDate, setTargetDate] = useState(null);
  const [contextMenu, setContextMenu] = useState({ show: false, x: 0, y: 0, compraId: null });
  const [isLoadingForm, setIsLoadingForm] = useState(false);
  const [mostUsedFornecedores, setMostUsedFornecedores] = useState([]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const fetchComprasDaSemana = useCallback(async () => {
    setIsLoading(true);
    try {
      const startDate = format(startOfWeek(currentWeek, { weekStartsOn: 1 }), 'yyyy-MM-dd');
      const endDate = format(endOfWeek(currentWeek, { weekStartsOn: 1 }), 'yyyy-MM-dd');
      
      const params = {
        start_date: startDate,
        end_date: endDate,
      };
      
      if (selectedObra?.id) {
        params.obra_id = selectedObra.id;
      }
      
      const response = await api.getComprasDaSemana(params);
      setCompras(response.data || []);
    } catch (error) {
      console.error('Erro ao buscar compras da semana:', error);
      showErrorToast('Erro ao carregar compras da semana');
      setCompras([]);
    } finally {
      setIsLoading(false);
    }
  }, [currentWeek, selectedObra]);

  const fetchObras = useCallback(async () => {
    try {
      const response = await api.getObras();
      const obrasData = response?.data?.results || response?.data || [];
      setObras(Array.isArray(obrasData) ? obrasData : []);
    } catch (error) {
      console.error('Erro ao buscar obras:', error);
      setObras([]);
    }
  }, []);

  const fetchFornecedores = useCallback(async () => {
    try {
      const response = await api.getFornecedores();
      const fornecedoresData = response?.data?.results || response?.data || [];
      setFornecedores(Array.isArray(fornecedoresData) ? fornecedoresData : []);
      
      // Calcular fornecedores mais utilizados
      const fornecedorCount = {};
      compras.forEach(compra => {
        if (compra.fornecedor?.id) {
          fornecedorCount[compra.fornecedor.id] = (fornecedorCount[compra.fornecedor.id] || 0) + 1;
        }
      });
      
      const sortedFornecedores = fornecedoresData
        .map(fornecedor => ({
          ...fornecedor,
          count: fornecedorCount[fornecedor.id] || 0,
        }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);
      
      setMostUsedFornecedores(sortedFornecedores);
    } catch (error) {
      console.error('Erro ao buscar fornecedores:', error);
      setFornecedores([]);
      setMostUsedFornecedores([]);
    }
  }, [compras]);

  useEffect(() => {
    fetchObras();
  }, [fetchObras]);

  useEffect(() => {
    fetchComprasDaSemana();
  }, [fetchComprasDaSemana]);

  useEffect(() => {
    fetchFornecedores();
  }, [fetchFornecedores]);

  const handleWeekChange = (newWeek) => {
    setCurrentWeek(newWeek);
  };

  const handleDragStart = (event) => {
    setActiveId(event.active.id);
  };

  const handleDragEnd = (event) => {
    const { active, over } = event;
    
    if (!over) {
      setActiveId(null);
      return;
    }

    const activeCompra = compras.find(c => c.id.toString() === active.id);
    if (!activeCompra) {
      setActiveId(null);
      return;
    }

    const targetDateStr = over.id;
    const targetDateObj = parseISO(targetDateStr);
    
    if (!isValid(targetDateObj)) {
      setActiveId(null);
      return;
    }

    const currentDate = parseISO(activeCompra.data_prevista);
    if (isSameDay(currentDate, targetDateObj)) {
      setActiveId(null);
      return;
    }

    setDraggedCompra(activeCompra);
    setTargetDate(targetDateObj);
    setShowDragConfirmModal(true);
    setActiveId(null);
  };

  const handleDragCancel = () => {
    setActiveId(null);
  };

  const handleMoveCompra = async () => {
    if (!draggedCompra || !targetDate) return;

    try {
      const updatedData = {
        ...draggedCompra,
        data_prevista: format(targetDate, 'yyyy-MM-dd'),
      };

      await api.updateCompra(draggedCompra.id, updatedData);
      showSuccessToast('Compra movida com sucesso!');
      fetchComprasDaSemana();
    } catch (error) {
      console.error('Erro ao mover compra:', error);
      showErrorToast('Erro ao mover compra');
    } finally {
      setShowDragConfirmModal(false);
      setDraggedCompra(null);
      setTargetDate(null);
    }
  };

  const handleDuplicateCompra = async () => {
    if (!draggedCompra || !targetDate) return;

    try {
      const duplicatedData = {
        ...draggedCompra,
        data_prevista: format(targetDate, 'yyyy-MM-dd'),
        id: undefined, // Remove ID para criar nova compra
      };

      await api.createCompra(duplicatedData);
      showSuccessToast('Compra duplicada com sucesso!');
      fetchComprasDaSemana();
    } catch (error) {
      console.error('Erro ao duplicar compra:', error);
      showErrorToast('Erro ao duplicar compra');
    } finally {
      setShowDragConfirmModal(false);
      setDraggedCompra(null);
      setTargetDate(null);
    }
  };

  const handleShowContextMenu = (event, compraId) => {
    event.preventDefault();
    setContextMenu({
      show: true,
      x: event.clientX,
      y: event.clientY,
      compraId,
    });
  };

  const handleCloseContextMenu = () => {
    setContextMenu({ show: false, x: 0, y: 0, compraId: null });
  };

  const handleDeleteCompra = async (compraId) => {
    try {
      await api.deleteCompra(compraId);
      showSuccessToast('Compra excluída com sucesso!');
      fetchComprasDaSemana();
    } catch (error) {
      console.error('Erro ao excluir compra:', error);
      showErrorToast('Erro ao excluir compra');
    }
    handleCloseContextMenu();
  };

  const handleOpenDetailModal = (compraId) => {
    setSelectedCompraId(compraId);
    setShowDetailModal(true);
  };

  const handleCloseDetailModal = () => {
    setShowDetailModal(false);
    setSelectedCompraId(null);
  };

  const handleOpenFormModal = (initialData = null) => {
    setFormInitialData(initialData);
    setShowFormModal(true);
  };

  const handleCloseFormModal = () => {
    setShowFormModal(false);
    setFormInitialData(null);
  };

  const handleFormSubmit = async (formData, anexos) => {
    setIsLoadingForm(true);
    try {
      const data = new FormData();
      Object.keys(formData).forEach(key => {
        if (formData[key] !== null && formData[key] !== undefined) {
          data.append(key, formData[key]);
        }
      });

      if (anexos && anexos.length > 0) {
        anexos.forEach(anexo => {
          data.append('anexos', anexo);
        });
      }

      if (formInitialData?.id) {
        await api.updateCompra(formInitialData.id, data);
        showSuccessToast('Compra atualizada com sucesso!');
      } else {
        await api.createCompra(data);
        showSuccessToast('Compra criada com sucesso!');
      }

      handleCloseFormModal();
      fetchComprasDaSemana();
    } catch (error) {
      console.error('Erro ao salvar compra:', error);
      showErrorToast('Erro ao salvar compra');
    } finally {
      setIsLoadingForm(false);
    }
  };

  const getWeekDays = () => {
    const start = startOfWeek(currentWeek, { weekStartsOn: 1 });
    return Array.from({ length: 7 }, (_, i) => addDays(start, i));
  };

  const getComprasForDate = (date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    return compras.filter(compra => {
      const compraDate = parseISO(compra.data_prevista);
      return isValid(compraDate) && format(compraDate, 'yyyy-MM-dd') === dateStr;
    });
  };

  const weekDays = getWeekDays();
  const activeCompra = compras.find(c => c.id.toString() === activeId);

  return (
    <div className="flex flex-col h-full">
      <WeekNavigator
        currentDate={currentWeek}
        onDateChange={handleWeekChange}
      />
      
      <div className="flex-1 flex gap-4 overflow-hidden">
        <div className="flex-1">
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
            onDragCancel={handleDragCancel}
            modifiers={[restrictToWindowEdges]}
          >
            <div className="grid grid-cols-7 gap-2 h-full">
              {weekDays.map(day => (
                <ComprasDayColumn
                  key={format(day, 'yyyy-MM-dd')}
                  date={day}
                  compras={getComprasForDate(day)}
                  onAddCompra={(date) => handleOpenFormModal({ data_prevista: format(date, 'yyyy-MM-dd') })}
                  onCompraClick={handleOpenDetailModal}
                  onContextMenu={handleShowContextMenu}
                  isLoading={isLoading}
                />
              ))}
            </div>
            
            <DragOverlay>
              {activeCompra ? (
                <CompraCard
                  compra={activeCompra}
                  isDraggingOverlay
                />
              ) : null}
            </DragOverlay>
          </DndContext>
        </div>
        
        {/* Painel de Fornecedores Mais Utilizados */}
        <div className="w-64 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
            Fornecedores Mais Utilizados
          </h3>
          <div className="space-y-2">
            {mostUsedFornecedores.map(fornecedor => (
              <div
                key={fornecedor.id}
                className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                onClick={() => handleOpenFormModal({ fornecedor: fornecedor.id })}
              >
                <div className="font-medium text-gray-900 dark:text-gray-100 text-sm">
                  {fornecedor.nome}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  {fornecedor.count} compras
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Modal de Detalhes */}
      {showDetailModal && selectedCompraId && (
        <CompraDetailModal
          compraId={selectedCompraId}
          onClose={handleCloseDetailModal}
        />
      )}

      {/* Modal de Formulário */}
      {showFormModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-medium leading-6 text-gray-900 dark:text-gray-100 mb-4">
              {formInitialData?.id ? 'Editar Compra' : 'Nova Compra'}
            </h3>
            <CompraForm
              initialData={formInitialData}
              obras={obras}
              fornecedores={fornecedores}
              onSubmit={handleFormSubmit}
              onCancel={handleCloseFormModal}
              isLoading={isLoadingForm}
            />
          </div>
        </div>
      )}

      {/* Modal de Confirmação de Arrastar e Soltar */}
      {showDragConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-xl w-full max-w-md">
            <h3 className="text-lg font-medium leading-6 text-gray-900 dark:text-gray-100 mb-4">
              Mover Compra
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
              Deseja mover ou duplicar esta compra para {targetDate && format(targetDate, 'dd/MM/yyyy', { locale: ptBR })}?
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowDragConfirmModal(false)}
                className="py-2 px-4 text-sm font-medium text-gray-800 dark:text-gray-200 bg-gray-200 dark:bg-gray-600 rounded-md hover:bg-gray-300 dark:hover:bg-gray-500"
              >
                Cancelar
              </button>
              <button
                onClick={handleDuplicateCompra}
                className="py-2 px-4 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md"
              >
                Duplicar
              </button>
              <button
                onClick={handleMoveCompra}
                className="py-2 px-4 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-md"
              >
                Mover
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Menu de Contexto */}
      {contextMenu.show && (
        <ContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          onClose={handleCloseContextMenu}
          onEdit={() => {
            const compra = compras.find(c => c.id === contextMenu.compraId);
            if (compra) {
              handleOpenFormModal(compra);
            }
            handleCloseContextMenu();
          }}
          onDelete={() => handleDeleteCompra(contextMenu.compraId)}
          onDuplicate={() => {
            const compra = compras.find(c => c.id === contextMenu.compraId);
            if (compra) {
              const duplicatedData = { ...compra, id: undefined };
              handleOpenFormModal(duplicatedData);
            }
            handleCloseContextMenu();
          }}
        />
      )}
    </div>
  );
};

export default ComprasWeeklyPlanner;