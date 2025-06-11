import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import * as api from '../../services/api';

const DistribuicaoMaterialForm = ({ obraId, onClose, onSubmitSuccess, showModal }) => {
  const initialFormData = {
    compra_id: '',
    quantidade_usada: '',
    andar: 'Terreo', // Default value
    categoria_uso: 'Geral', // Default value
    descricao: '',
  };

  const [formData, setFormData] = useState(initialFormData);
  const [comprasDisponiveis, setComprasDisponiveis] = useState([]);
  const [selectedCompraInfo, setSelectedCompraInfo] = useState({
    quantidade_disponivel: 0,
    unidade_medida: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [fieldErrors, setFieldErrors] = useState({});

  const andarOptions = ['Terreo', '1 Andar', '2 Andar', 'Cobertura', 'Area Externa', 'Outro'];
  const categoriaUsoOptions = ['Geral', 'Eletrica', 'Hidraulica', 'Alvenaria', 'Acabamento', 'Estrutura', 'Uso da Equipe'];

  useEffect(() => {
    const fetchCompras = async () => {
      if (!obraId) return;
      setIsLoading(true);
      setError(null);
      try {
        const response = await api.getCompras({ obra_id: obraId });
        const disponiveis = response.data.filter(c => parseFloat(c.quantidade_disponivel) > 0);
        setComprasDisponiveis(disponiveis);
        if (disponiveis.length > 0) {
          // Pre-select first compra and set its info
          // setFormData(prev => ({ ...prev, compra_id: disponiveis[0].id }));
          // updateSelectedCompraInfo(disponiveis[0].id, disponiveis);
          // No pre-selection to force user choice.
        } else {
            setError('Nenhum material com estoque disponível encontrado para esta obra.');
        }
      } catch (err) {
        setError('Falha ao carregar materiais disponíveis.');
        console.error("Fetch Compras Error:", err);
      } finally {
        setIsLoading(false);
      }
    };

    if (showModal) { // Fetch only when modal becomes visible or obraId changes
      fetchCompras();
    }
  }, [obraId, showModal]);

  const updateSelectedCompraInfo = (compraId, comprasList) => {
    const selected = (comprasList || comprasDisponiveis).find(c => c.id.toString() === compraId.toString());
    if (selected) {
      setSelectedCompraInfo({
        quantidade_disponivel: parseFloat(selected.quantidade_disponivel),
        unidade_medida: selected.material_unidade_medida || selected.material_details?.unidade_medida || '' // Adjust based on actual material details
      });
    } else {
      setSelectedCompraInfo({ quantidade_disponivel: 0, unidade_medida: '' });
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setFieldErrors(prev => ({ ...prev, [name]: null })); // Clear error on change

    if (name === 'compra_id') {
      updateSelectedCompraInfo(value);
    }
  };

  const validateForm = () => {
    const errors = {};
    const { compra_id, quantidade_usada } = formData;

    if (!compra_id) {
      errors.compra_id = 'Selecione um material da lista de compras.';
    }

    const qtdUsada = parseFloat(quantidade_usada);
    if (isNaN(qtdUsada) || qtdUsada <= 0) {
      errors.quantidade_usada = 'A quantidade usada deve ser um número maior que zero.';
    } else if (selectedCompraInfo.quantidade_disponivel > 0 && qtdUsada > selectedCompraInfo.quantidade_disponivel) {
      errors.quantidade_usada = `Quantidade excede o disponível (${selectedCompraInfo.quantidade_disponivel} ${selectedCompraInfo.unidade_medida}).`;
    }

    // Add other field validations if necessary (e.g., andar, categoria_uso)
    if (!formData.andar) errors.andar = "Selecione um andar.";
    if (!formData.categoria_uso) errors.categoria_uso = "Selecione uma categoria de uso.";

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setFieldErrors({});

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    try {
      // The 'obra' field for UsoMaterial will be set by the backend model's save method
      const dataToSubmit = {
        compra: formData.compra_id, // Ensure backend expects 'compra' not 'compra_id' if using PK
        quantidade_usada: formData.quantidade_usada,
        andar: formData.andar,
        categoria_uso: formData.categoria_uso,
        descricao: formData.descricao,
      };
      await api.createUsoMaterial(dataToSubmit);
      onSubmitSuccess(); // Callback to refresh parent data
      onClose(); // Close modal
    } catch (err) {
      console.error("Submit UsoMaterial Error:", err);
      const apiError = err.response?.data;
      if (apiError) {
        if (typeof apiError === 'object') {
          // Handle field errors (e.g., { quantidade_usada: ["Ensure this value is less than or equal to X."] })
          const backendFieldErrors = {};
          for (const key in apiError) {
            backendFieldErrors[key] = Array.isArray(apiError[key]) ? apiError[key].join(' ') : apiError[key];
          }
          setFieldErrors(backendFieldErrors);
          setError("Erro de validação. Verifique os campos.");
        } else {
           setError(apiError.detail || apiError.message || 'Falha ao registrar uso do material.');
        }
      } else {
        setError('Falha ao registrar uso do material. Tente novamente.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (!showModal) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex justify-center items-center">
      <div className="relative mx-auto p-5 border w-full max-w-lg shadow-lg rounded-md bg-white">
        <h3 className="text-lg font-medium leading-6 text-gray-900 mb-4">Registrar Uso de Material</h3>

        {error && <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md">{error}</div>}

        <form onSubmit={handleSubmit} noValidate>
          <div className="space-y-4">
            {/* Compra (Material) Select */}
            <div>
              <label htmlFor="compra_id" className="block text-sm font-medium text-gray-700">
                Material (Compra)
              </label>
              <select
                id="compra_id"
                name="compra_id"
                value={formData.compra_id}
                onChange={handleChange}
                className={`mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md ${fieldErrors.compra_id ? 'border-red-500' : ''}`}
                disabled={isLoading || comprasDisponiveis.length === 0}
              >
                <option value="">Selecione um material...</option>
                {comprasDisponiveis.map(compra => (
                  <option key={compra.id} value={compra.id}>
                    {compra.material_nome} (Disp: {parseFloat(compra.quantidade_disponivel).toLocaleString('pt-BR')} {compra.material_unidade_medida || compra.material_details?.unidade_medida || ''}) - Compra: {new Date(compra.data_compra).toLocaleDateString('pt-BR')}
                  </option>
                ))}
              </select>
              {fieldErrors.compra_id && <p className="mt-1 text-xs text-red-500">{fieldErrors.compra_id}</p>}
              {formData.compra_id && selectedCompraInfo.quantidade_disponivel > 0 && (
                <p className="mt-1 text-xs text-gray-500">
                  Disponível nesta compra: {selectedCompraInfo.quantidade_disponivel.toLocaleString('pt-BR')} {selectedCompraInfo.unidade_medida}
                </p>
              )}
            </div>

            {/* Quantidade Usada */}
            <div>
              <label htmlFor="quantidade_usada" className="block text-sm font-medium text-gray-700">
                Quantidade Utilizada ({selectedCompraInfo.unidade_medida || 'unidade'})
              </label>
              <input
                type="number"
                name="quantidade_usada"
                id="quantidade_usada"
                value={formData.quantidade_usada}
                onChange={handleChange}
                step="0.01"
                className={`mt-1 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md ${fieldErrors.quantidade_usada ? 'border-red-500' : ''}`}
                disabled={isLoading}
              />
              {fieldErrors.quantidade_usada && <p className="mt-1 text-xs text-red-500">{fieldErrors.quantidade_usada}</p>}
            </div>

            {/* Andar Select */}
            <div>
              <label htmlFor="andar" className="block text-sm font-medium text-gray-700">Andar</label>
              <select
                name="andar"
                id="andar"
                value={formData.andar}
                onChange={handleChange}
                className={`mt-1 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md ${fieldErrors.andar ? 'border-red-500' : ''}`}
                disabled={isLoading}
              >
                {andarOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
              </select>
              {fieldErrors.andar && <p className="mt-1 text-xs text-red-500">{fieldErrors.andar}</p>}
            </div>

            {/* Categoria de Uso Select */}
            <div>
              <label htmlFor="categoria_uso" className="block text-sm font-medium text-gray-700">Categoria de Uso</label>
              <select
                name="categoria_uso"
                id="categoria_uso"
                value={formData.categoria_uso}
                onChange={handleChange}
                className={`mt-1 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md ${fieldErrors.categoria_uso ? 'border-red-500' : ''}`}
                disabled={isLoading}
              >
                {categoriaUsoOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
              </select>
              {fieldErrors.categoria_uso && <p className="mt-1 text-xs text-red-500">{fieldErrors.categoria_uso}</p>}
            </div>

            {/* Descrição */}
            <div>
              <label htmlFor="descricao" className="block text-sm font-medium text-gray-700">
                Descrição (Opcional)
              </label>
              <textarea
                name="descricao"
                id="descricao"
                rows="3"
                value={formData.descricao}
                onChange={handleChange}
                className="mt-1 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                disabled={isLoading}
              ></textarea>
            </div>
          </div>

          <div className="mt-6 flex items-center justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isLoading || comprasDisponiveis.length === 0}
              className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 border border-transparent rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
            >
              {isLoading ? 'Salvando...' : 'Salvar Uso'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

DistribuicaoMaterialForm.propTypes = {
  obraId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  onClose: PropTypes.func.isRequired,
  onSubmitSuccess: PropTypes.func.isRequired,
  showModal: PropTypes.bool.isRequired,
};

export default DistribuicaoMaterialForm;
