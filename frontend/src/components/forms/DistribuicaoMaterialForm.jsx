import React, { useState, useEffect } from 'react';
import * as api from '../../services/api'; // Path to api.js

const ANDAR_CHOICES = [
  { value: 'Terreo', label: 'Térreo' },
  { value: '1 Andar', label: '1º Andar' },
  { value: '2 Andar', label: '2º Andar' },
  { value: 'Cobertura', label: 'Cobertura' },
  { value: 'Area Externa', label: 'Área Externa' },
  { value: 'Outro', label: 'Outro' },
];

const CATEGORIA_USO_CHOICES = [
  { value: 'Geral', label: 'Geral' },
  { value: 'Eletrica', label: 'Elétrica' },
  { value: 'Hidraulica', label: 'Hidráulica' },
  { value: 'Alvenaria', label: 'Alvenaria' },
  { value: 'Acabamento', label: 'Acabamento' },
  { value: 'Estrutura', label: 'Estrutura' },
  { value: 'Uso da Equipe', label: 'Uso da Equipe' },
];

const DistribuicaoMaterialForm = ({ obraId, onClose, onSubmitSuccess, showModal }) => {
  const [formData, setFormData] = useState({
    item_compra: '', // Will store item_compra ID
    quantidade_usada: '',
    andar: ANDAR_CHOICES[0].value,
    categoria_uso: CATEGORIA_USO_CHOICES[0].value,
    descricao: '',
  });
  const [itensDisponiveis, setItensDisponiveis] = useState([]);
  const [selectedItemEstoque, setSelectedItemEstoque] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (obraId && showModal) {
      setIsLoading(true);
      setError(null); // Clear previous errors
      setItensDisponiveis([]); // Reset itens list
      setSelectedItemEstoque(0); // Reset stock
      setFormData(prev => ({ // Reset relevant parts of form
        ...prev,
        item_compra: '',
        quantidade_usada: '',
        andar: ANDAR_CHOICES[0].value,
        categoria_uso: CATEGORIA_USO_CHOICES[0].value,
        descricao: '',
      }));

      api.getItensDisponiveisPorObra(obraId)
        .then(response => {
          // A API já retorna os itens filtrados com quantidade_disponivel > 0
          const itens = response.data || [];
          setItensDisponiveis(itens);
          if (itens.length === 0) {
            setError({ general: 'Nenhum item com material disponível encontrado para esta obra.' });
          }
        })
        .catch(err => {
          console.error("Erro ao buscar itens disponíveis:", err);
          setError({ general: 'Falha ao carregar lista de itens disponíveis. ' + (err.response?.data?.detail || err.message) });
        })
        .finally(() => setIsLoading(false));
    }
  }, [obraId, showModal]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setError(prevError => prevError ? { ...prevError, [name]: null, general: null } : null);


    if (name === 'item_compra') {
      const selected = itensDisponiveis.find(i => i.id.toString() === value);
      if (selected) {
        setSelectedItemEstoque(parseFloat(selected.quantidade_disponivel));
      } else {
        setSelectedItemEstoque(0);
      }
      // Reset quantidade_usada when item_compra changes
      setFormData(prev => ({ ...prev, quantidade_usada: '' }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.item_compra) {
      newErrors.item_compra = 'Selecione um material disponível (item de compra).';
    }
    const quantidade = parseFloat(formData.quantidade_usada);
    if (isNaN(quantidade) || quantidade <= 0) {
      newErrors.quantidade_usada = 'Quantidade usada deve ser um número maior que zero.';
    }
    if (selectedItemEstoque > 0 && quantidade > selectedItemEstoque) { // Only validate against stock if stock is known
      newErrors.quantidade_usada = `Quantidade usada (${quantidade.toLocaleString('pt-BR')}) não pode ser maior que a disponível (${selectedItemEstoque.toLocaleString('pt-BR')}).`;
    }
    if (!formData.andar) {
      newErrors.andar = 'Selecione o andar/destino.';
    }
    if (!formData.categoria_uso) {
      newErrors.categoria_uso = 'Selecione a categoria de uso.';
    }

    if (Object.keys(newErrors).length > 0) {
      setError(newErrors);
      return false;
    }
    setError(null);
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      // Do not send obraId, backend derives it from compra
      // const { obra, ...payload } = { ...formData, obra: obraId }; // Ensure obra is included if needed by backend

      // Correct payload: backend expects 'item_compra' (ID), 'quantidade_usada', 'andar', 'categoria_uso', 'descricao'
      const submissionPayload = {
        item_compra: formData.item_compra, // This is item_compra_id
        quantidade_usada: formData.quantidade_usada,
        andar: formData.andar,
        categoria_uso: formData.categoria_uso,
        descricao: formData.descricao,
      };

      await api.createUsoMaterial(submissionPayload);
      onSubmitSuccess();
      onClose();
    } catch (err) {
      console.error("Erro ao registrar uso de material:", err);
      const apiError = err.response?.data;
      if (apiError && typeof apiError === 'object') {
        const processedErrors = {};
        for (const key in apiError) {
            processedErrors[key] = Array.isArray(apiError[key]) ? apiError[key].join(', ') : apiError[key];
        }
        setError(processedErrors);
      } else if (apiError && typeof apiError === 'string') {
        setError({ general: apiError });
      } else {
        setError({ general: 'Falha ao registrar uso. Verifique os dados e tente novamente.' });
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (!showModal) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex justify-center items-center p-4">
      <div className="relative mx-auto p-5 border w-full max-w-lg shadow-lg rounded-md bg-white">
        <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg leading-6 font-medium text-gray-900">Registrar Uso de Material</h3>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                <span className="sr-only">Fechar</span>
                <svg className="h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
            </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error?.general && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-3" role="alert">
              <span className="block sm:inline">{error.general}</span>
            </div>
          )}

          <div>
            <label htmlFor="item_compra" className="block text-sm font-medium text-gray-700">Material Disponível (Item de Compra)</label>
            <select
              id="item_compra"
              name="item_compra"
              value={formData.item_compra}
              onChange={handleChange}
              className={`mt-1 block w-full py-2 px-3 border ${error?.item_compra ? 'border-red-500' : 'border-gray-300'} bg-white rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm`}
              disabled={isLoading || (itensDisponiveis.length === 0 && !error?.general?.includes('Falha ao carregar'))}
            >
              <option value="">{isLoading ? "Carregando..." : (itensDisponiveis.length === 0 && !error?.general?.includes('Falha ao carregar')) ? "Nenhum item disponível" : "Selecione um item"}</option>
              {itensDisponiveis.map(item => (
                <option key={item.id} value={item.id}>
                  {item.material_nome} (Disponível: {parseFloat(item.quantidade_disponivel).toLocaleString('pt-BR')})
                </option>
              ))}
            </select>
            {selectedItemEstoque > 0 && formData.item_compra && (
              <p className="text-xs text-gray-500 mt-1">Estoque selecionado: {selectedItemEstoque.toLocaleString('pt-BR')}</p>
            )}
            {error?.item_compra && <p className="text-xs text-red-500 mt-1">{error.item_compra}</p>}
          </div>

          <div>
            <label htmlFor="quantidade_usada" className="block text-sm font-medium text-gray-700">Quantidade Usada</label>
            <input
              type="number"
              id="quantidade_usada"
              name="quantidade_usada"
              value={formData.quantidade_usada}
              onChange={handleChange}
              className={`mt-1 block w-full py-2 px-3 border ${error?.quantidade_usada ? 'border-red-500' : 'border-gray-300'} rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm`}
              step="0.01"
              placeholder="Ex: 10.50"
              disabled={isLoading || !formData.item_compra}
            />
            {error?.quantidade_usada && <p className="text-xs text-red-500 mt-1">{error.quantidade_usada}</p>}
          </div>

          <div>
            <label htmlFor="andar" className="block text-sm font-medium text-gray-700">Andar/Destino</label>
            <select
              id="andar"
              name="andar"
              value={formData.andar}
              onChange={handleChange}
              className={`mt-1 block w-full py-2 px-3 border ${error?.andar ? 'border-red-500' : 'border-gray-300'} bg-white rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm`}
              disabled={isLoading}
            >
              {ANDAR_CHOICES.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
            </select>
            {error?.andar && <p className="text-xs text-red-500 mt-1">{error.andar}</p>}
          </div>

          <div>
            <label htmlFor="categoria_uso" className="block text-sm font-medium text-gray-700">Categoria de Uso</label>
            <select
              id="categoria_uso"
              name="categoria_uso"
              value={formData.categoria_uso}
              onChange={handleChange}
              className={`mt-1 block w-full py-2 px-3 border ${error?.categoria_uso ? 'border-red-500' : 'border-gray-300'} bg-white rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm`}
              disabled={isLoading}
            >
              {CATEGORIA_USO_CHOICES.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
            </select>
            {error?.categoria_uso && <p className="text-xs text-red-500 mt-1">{error.categoria_uso}</p>}
          </div>

          <div>
            <label htmlFor="descricao" className="block text-sm font-medium text-gray-700">Descrição (Opcional)</label>
            <textarea
              id="descricao"
              name="descricao"
              value={formData.descricao}
              onChange={handleChange}
              rows="3"
              className="mt-1 block w-full py-2 px-3 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              disabled={isLoading}
            />
          </div>

          <div className="flex items-center justify-end gap-4 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="py-2 px-4 bg-gray-200 text-gray-800 font-medium rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
              disabled={isLoading}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="py-2 px-4 bg-indigo-600 text-white font-medium rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
              disabled={isLoading || (itensDisponiveis.length === 0 && !error?.general?.includes('Falha ao carregar'))}
            >
              {isLoading ? 'Salvando...' : 'Salvar Uso'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default DistribuicaoMaterialForm;
