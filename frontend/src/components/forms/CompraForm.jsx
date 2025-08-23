import React, {
  useState,
  useEffect,
  useCallback,
  useRef,
  useReducer,
  forwardRef,
} from 'react'; // Added useReducer
import DatePicker, { registerLocale } from 'react-datepicker';
import { ptBR } from 'date-fns/locale';
import 'react-datepicker/dist/react-datepicker.css';
import { Calendar as CalendarIcon } from 'lucide-react';
import * as api from '../../services/api';
import MaterialAutocomplete from './MaterialAutocomplete';
import ObraAutocomplete from './ObraAutocomplete';
import SpinnerIcon from '../utils/SpinnerIcon';
import PagamentoParceladoForm from './PagamentoParceladoForm';
import AnexosCompraManager from './AnexosCompraManager';

registerLocale('pt-BR', ptBR);

// Global counter and ID generator for items
let itemUniqueIdCounter = 0;
const generateItemUniqueId = () => `temp-item-${itemUniqueIdCounter++}`;

const CATEGORIA_USO_CHOICES = [
  { value: 'Geral', label: 'Geral' },
  { value: 'Eletrica', label: 'Elétrica' },
  { value: 'Hidraulica', label: 'Hidráulica' },
  { value: 'Alvenaria', label: 'Alvenaria' },
  { value: 'Acabamento', label: 'Acabamento' },
  { value: 'Fundacao', label: 'Fundação' },
];

const WarningIcon = (
  { className = 'w-3 h-3 inline mr-1' } // Adjusted default size
) => (
  <svg
    className={className}
    fill="currentColor"
    viewBox="0 0 20 20"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      fillRule="evenodd"
      d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.216 3.031-1.742 3.031H4.42c-1.526 0-2.492-1.697-1.742-3.031l5.58-9.92zM10 13a1 1 0 110-2 1 1 0 010 2zm-1.75-4.5a1.75 1.75 0 00-3.5 0v.25h3.5v-.25z"
      clipRule="evenodd"
    />
  </svg>
);

const ITEM_ACTION_TYPES = {
  SET_ITEMS: 'SET_ITEMS',
  ADD_ITEM: 'ADD_ITEM',
  REMOVE_ITEM: 'REMOVE_ITEM',
  UPDATE_ITEM_FIELD: 'UPDATE_ITEM_FIELD',
  SET_MATERIAL: 'SET_MATERIAL',
};

const createNewEmptyItemPayload = () => ({
  originalId: null,
  material: null,
  materialId: '',
  materialNome: '',
  quantidade: '',
  unidadeMedida: '',
  valorUnitario: '',
  valorTotalItem: '0.00',
  categoria_uso: '',
});

const itemsReducer = (state, action) => {
  switch (action.type) {
    case ITEM_ACTION_TYPES.SET_ITEMS:
      return action.payload;
    case ITEM_ACTION_TYPES.ADD_ITEM:
      return [
        ...state,
        { ...createNewEmptyItemPayload(), id: action.payload.id },
      ];
    case ITEM_ACTION_TYPES.REMOVE_ITEM:
      return state.filter((_, i) => i !== action.payload);
    case ITEM_ACTION_TYPES.UPDATE_ITEM_FIELD:
      return state.map((item, i) => {
        if (i === action.payload.index) {
          let processedValue = action.payload.value;
          if (
            action.payload.fieldName === 'valorUnitario' ||
            action.payload.fieldName === 'quantidade'
          ) {
            processedValue =
              typeof action.payload.value === 'string'
                ? action.payload.value.replace(',', '.')
                : action.payload.value;
          }
          const newItem = {
            ...item,
            [action.payload.fieldName]: processedValue,
          };
          if (
            action.payload.fieldName === 'quantidade' ||
            action.payload.fieldName === 'valorUnitario'
          ) {
            const qty = parseFloat(newItem.quantidade) || 0;
            const price = parseFloat(newItem.valorUnitario) || 0;
            newItem.valorTotalItem = (qty * price).toFixed(2);
          }
          return newItem;
        }
        return item;
      });
    case ITEM_ACTION_TYPES.SET_MATERIAL: {
      return state.map((item, i) => {
        if (i === action.payload.index) {
          const selectedMaterial = action.payload.material;
          if (selectedMaterial) {
            return {
              ...item,
              material: selectedMaterial,
              materialId: String(selectedMaterial.id),
              materialNome: selectedMaterial.nome,
              unidadeMedida: selectedMaterial.unidade_medida,
              categoria_uso: selectedMaterial.categoria_uso_padrao || '',
            };
          }
          return {
            ...item,
            material: null,
            materialId: '',
            materialNome: '',
            unidadeMedida: '',
            categoria_uso: '',
          };
        }
        return item;
      });
    }
    default:
      return state;
  }
};

const ItemRowInternal = ({
  item,
  index,
  setCategoriaUsoRef,
  onItemChange,
  onRemoveItem,
  totalItems,
  errors,
  onMaterialSelectForItem,
  initialData,
  onItemKeyDown,
  materialRef,
  quantityRef,
  unitPriceRef,
  onItemFieldBlur,
}) => {
  const getError = fieldName => errors && errors[`item_${index}_${fieldName}`];

  const isLastAndEmptyNewRow =
    totalItems <= 1 &&
    !(initialData && initialData.id) &&
    !item.material &&
    !item.quantidade &&
    !item.valorUnitario;

  const handleMaterialAutocompleteKeyDown = useCallback(
    e => {
      onItemKeyDown(e, index, 'material');
    },
    [onItemKeyDown, index]
  );

  return (
    <tr
      className={`${index % 2 === 0 ? 'bg-slate-50' : 'bg-white'} hover:bg-slate-100 transition-colors duration-150 ease-in-out`}
    >
      <td className="px-3 py-2.5 border-b border-slate-200 text-sm min-w-[250px] md:min-w-[280px] align-top">
        <MaterialAutocomplete
          ref={materialRef}
          value={item.material}
          onMaterialSelect={onMaterialSelectForItem}
          itemIndex={index}
          error={getError('material')}
          parentOnKeyDown={handleMaterialAutocompleteKeyDown}
          onBlurReport={blurState =>
            onItemFieldBlur(
              index,
              'material',
              blurState.currentInputValue,
              blurState
            )
          }
        />
      </td>
      <td className="px-3 py-2.5 border-b border-slate-200 text-sm align-top w-[120px]">
        <input
          ref={quantityRef}
          type="text"
          inputMode="decimal"
          name="quantidade"
          value={item.quantidade}
          onChange={e => onItemChange(index, 'quantidade', e.target.value)}
          onKeyDown={e => onItemKeyDown(e, index, 'quantity')}
          onBlur={e => onItemFieldBlur(index, 'quantidade', e.target.value)}
          className={`w-full p-2 border ${getError('quantidade') ? 'border-red-500 text-red-700' : 'border-slate-300 text-slate-700'} rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm text-right`}
          placeholder="0,000"
        />
        {getError('quantidade') && (
          <p className="mt-1 text-xs text-red-600 flex items-center">
            <WarningIcon />
            {getError('quantidade')}
          </p>
        )}
      </td>
      <td className="px-3 py-2.5 border-b border-slate-200 text-sm text-slate-600 align-middle text-center w-[100px]">
        {item.unidadeMedida || '--'}
      </td>
      <td className="px-3 py-2.5 border-b border-slate-200 text-sm align-top w-[150px]">
        <input
          ref={unitPriceRef}
          type="text"
          inputMode="decimal"
          name="valorUnitario"
          value={item.valorUnitario}
          onChange={e => onItemChange(index, 'valorUnitario', e.target.value)}
          onKeyDown={e => onItemKeyDown(e, index, 'unitPrice')}
          onBlur={e => onItemFieldBlur(index, 'valorUnitario', e.target.value)}
          className={`w-full p-2 border ${getError('valorUnitario') ? 'border-red-500 text-red-700' : 'border-slate-300 text-slate-700'} rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm text-right`}
          placeholder="0,00"
        />
        {getError('valorUnitario') && (
          <p className="mt-1 text-xs text-red-600 flex items-center">
            <WarningIcon />
            {getError('valorUnitario')}
          </p>
        )}
      </td>
      <td className="px-3 py-2.5 border-b border-slate-200 text-sm text-slate-800 font-medium align-middle text-right w-[140px]">
        R${' '}
        {parseFloat(item.valorTotalItem || 0)
          .toFixed(2)
          .replace('.', ',')}
      </td>
      <td className="px-3 py-2.5 border-b border-slate-200 text-sm align-top w-[180px]">
        <select
          name="categoria_uso"
          value={item.categoria_uso || ''}
          onChange={e => {
            onItemChange(index, 'categoria_uso', e.target.value);
          }}
          ref={el => setCategoriaUsoRef(el, index)}
          onKeyDown={e => onItemKeyDown(e, index, 'categoria_uso')}
          className={`w-full p-2 border ${getError('categoria_uso') ? 'border-red-500 text-red-700' : 'border-slate-300 text-slate-700'} rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm`}
        >
          <option value="" disabled>
            Selecione
          </option>
          {CATEGORIA_USO_CHOICES.map(cat => (
            <option key={cat.value} value={cat.value}>
              {cat.label}
            </option>
          ))}
        </select>
        {getError('categoria_uso') && (
          <p className="mt-1 text-xs text-red-600 flex items-center">
            <WarningIcon />
            {getError('categoria_uso')}
          </p>
        )}
      </td>
      <td className="px-3 py-2.5 border-b border-slate-200 text-center align-middle w-[100px]">
        <button
          type="button"
          onClick={() => onRemoveItem(index)}
          className="text-red-600 hover:text-red-800 disabled:text-slate-400 disabled:cursor-not-allowed font-medium p-1.5 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-1 transition-colors"
          disabled={isLastAndEmptyNewRow}
          title={
            isLastAndEmptyNewRow
              ? 'Pelo menos um item é necessário'
              : 'Remover Item'
          }
        >
          Excluir
        </button>
      </td>
    </tr>
  );
};
const ItemRow = React.memo(ItemRowInternal);

const CompraForm = ({ initialData, onSubmit, onCancel, isLoading }) => {
  const itemFieldRefs = useRef([]);
  const [tipo, setTipo] = useState(
    initialData?.tipo ? initialData.tipo.toUpperCase() : 'COMPRA'
  );
  const [obraId, setObraId] = useState('');
  const [obraSelecionada, setObraSelecionada] = useState(null);
  const [dataCompra, setDataCompra] = useState('');
  const [dataPagamento, setDataPagamento] = useState('');
  const [fornecedor, setFornecedor] = useState('');
  const [notaFiscal, setNotaFiscal] = useState('');
  const [observacoes, setObservacoes] = useState('');
  const [desconto, setDesconto] = useState('0.00');
  const [items, dispatchItems] = useReducer(itemsReducer, []);
  const [obras, setObras] = useState([]);
  const [errors, setErrors] = useState({});
  const [itemToFocusId, setItemToFocusId] = useState(null);
  
  const [pagamentoParcelado, setPagamentoParcelado] = useState({
    tipo: 'UNICO',
    parcelas: []
  });
  const [anexos, setAnexos] = useState([]);

  const handleTipoPagamentoChange = useCallback((tipo) => {
    setPagamentoParcelado(prev => ({ ...prev, tipo }));
  }, []);

  useEffect(() => {
    if (obras.length > 0 && obraId && !obraSelecionada) {
      const obraObj = obras.find(o => String(o.id) === String(obraId));
      if (obraObj) {
        setObraSelecionada(obraObj);
      }
    }
  }, [obras, obraId, obraSelecionada]);

  const handleParcelasChange = useCallback((parcelas) => {
    setPagamentoParcelado(prev => ({ ...prev, parcelas }));
  }, []);

  const tipoCompraRef = useRef(null);
  const tipoOrcamentoRef = useRef(null);
  const obraAutocompleteRef = useRef(null);
  const fornecedorRef = useRef(null);
  const prevDataCompraRef = useRef();

  const validateField = (fieldName, value, itemIndex = null) => {
    if (itemIndex === null) {
      if (fieldName === 'dataCompra' && !value)
        return 'Data da compra é obrigatória.';
      if (fieldName === 'obraId' && !value) 
        return 'Obra é obrigatória.';
      if (fieldName === 'desconto') {
        const standardizedDesconto = String(value || '').replace(',', '.');
        if (
          standardizedDesconto.trim() !== '' &&
          (isNaN(parseFloat(standardizedDesconto)) ||
            parseFloat(standardizedDesconto) < 0)
        ) {
          return 'Desconto deve ser um número válido e não negativo.';
        }
      }
      return null;
    }
    
    const item = items[itemIndex];
    if (!item) return null;

    if (fieldName === 'material') {
      const materialIsValid = !!(item.material && item.material.id) || !!(item.materialId && String(item.materialId).trim());
      if (!materialIsValid) return 'Material é obrigatório.';
    } else if (fieldName === 'quantidade') {
      const quantidadeStr = String(value || '').replace(',', '.').trim();
      if (quantidadeStr === '' || isNaN(parseFloat(quantidadeStr)) || parseFloat(quantidadeStr) <= 0)
        return 'Quantidade deve ser positiva.';
    } else if (fieldName === 'valorUnitario') {
      const valorStr = String(value || '').replace(',', '.').trim();
      if (valorStr === '' || isNaN(parseFloat(valorStr)) || parseFloat(valorStr) < 0)
        return 'Valor unitário deve ser positivo ou zero.';
    }
    
    return null;
  };

  const handleFieldBlur = useCallback(
    (fieldName, fieldValue) => {
      const error = validateField(fieldName, fieldValue);
      setErrors(prev => ({ ...prev, [fieldName]: error }));
    },
    [items]
  );

  const handleObraSelect = useCallback(obra => {
    if (obra) {
      setObraId(obra.id);
      setObraSelecionada(obra);
      setErrors(prev => ({ ...prev, obraId: null }));
    } else {
      setObraId('');
      setObraSelecionada(null);
    }
  }, []);

  const handleItemFieldBlur = useCallback(
    (itemIndex, fieldName, fieldValue, blurState) => {
      if (fieldName === 'material') {
        if (blurState?.selectionMade) {
          setErrors(prev => ({
            ...prev,
            [`item_${itemIndex}_material`]: null,
          }));
          return;
        }
        setTimeout(() => {
          const error = validateField('material', fieldValue, itemIndex);
          setErrors(prev => ({
            ...prev,
            [`item_${itemIndex}_material`]: error,
          }));
        }, 150);
        return;
      }
      const error = validateField(fieldName, fieldValue, itemIndex);
      setErrors(prev => ({
        ...prev,
        [`item_${itemIndex}_${fieldName}`]: error,
      }));
    },
    [items]
  );

  useEffect(() => {
    itemFieldRefs.current = items.map((item, i) =>
      itemFieldRefs.current[i] && itemFieldRefs.current[i].id === item.id
        ? itemFieldRefs.current[i]
        : {
            id: item.id,
            material: React.createRef(),
            quantity: React.createRef(),
            unitPrice: React.createRef(),
          }
    );
  }, [items]);

  useEffect(() => {
    if (itemToFocusId && items.length > 0) {
      const focusIndex = items.findIndex(item => item.id === itemToFocusId);
      if (focusIndex !== -1) {
        if (
          itemFieldRefs.current &&
          itemFieldRefs.current[focusIndex] &&
          itemFieldRefs.current[focusIndex].material
        ) {
          const materialAutocompleteInstance =
            itemFieldRefs.current[focusIndex].material.current;

          if (
            materialAutocompleteInstance &&
            typeof materialAutocompleteInstance.focus === 'function'
          ) {
            setTimeout(() => {
              materialAutocompleteInstance.focus();
            }, 0);
          }
        }
        setItemToFocusId(null);
      } else {
        setItemToFocusId(null);
      }
    }
  }, [items, itemToFocusId]);

  useEffect(() => {
    const fetchObras = async () => {
      try {
        const response = await api.getObras({ page_size: 500 });
        setObras(
          response.data && Array.isArray(response.data.results)
            ? response.data.results
            : Array.isArray(response.data)
              ? response.data
              : []
        );
      } catch (error) {
        console.error('Error fetching obras:', error);
        setObras([]);
      }
    };
    fetchObras();
  }, []);

  const createNewEmptyItem = () => ({
    id: generateItemUniqueId(),
    originalId: null,
    material: null,
    materialId: '',
    materialNome: '',
    quantidade: '',
    unidadeMedida: '',
    valorUnitario: '',
    valorTotalItem: '0.00',
    categoria_uso: '',
  });

  useEffect(() => {
    itemUniqueIdCounter = 0;
    setErrors({});

    if (initialData) {
      setTipo(initialData.tipo ? initialData.tipo.toUpperCase() : 'COMPRA');

      if (initialData.obra_details) {
        setObraId(String(initialData.obra_details.id));
        setObraSelecionada(initialData.obra_details);
      } else if (initialData.obra) {
        const obraIdentifier = initialData.obra.id || initialData.obra;
        setObraId(String(obraIdentifier));
        setObraSelecionada(null);
      }

      const initialDataCompra = initialData.data_compra
        ? new Date(initialData.data_compra).toISOString().split('T')[0]
        : new Date().toISOString().split('T')[0];
      setDataCompra(initialDataCompra);

      setDataPagamento(
        initialData.data_pagamento
          ? new Date(initialData.data_pagamento).toISOString().split('T')[0]
          : null
      );

      setFornecedor(initialData.fornecedor || '');
      setNotaFiscal(initialData.nota_fiscal || '');
      setObservacoes(initialData.observacoes || '');
      setDesconto(
        initialData.desconto != null
          ? String(initialData.desconto).replace(',', '.')
          : '0.00'
      );
      
      if (initialData.pagamento_parcelado) {
        setPagamentoParcelado(initialData.pagamento_parcelado);
      } else {
        setPagamentoParcelado({
          tipo: 'UNICO',
          parcelas: []
        });
      }
      
      if (initialData.anexos && Array.isArray(initialData.anexos) && initialData.anexos.length > 0) {
        setAnexos(initialData.anexos);
      } else if (initialData.id) {
        const loadAnexos = async () => {
          try {
            const response = await api.getAnexosByCompra(initialData.id);
            const anexosData = response.data || response;
            setAnexos(anexosData);
          } catch (error) {
            console.error('Erro ao carregar anexos:', error);
            setAnexos([]);
          }
        };
        loadAnexos();
      } else {
        setAnexos([]);
      }

      if (initialData.itens && Array.isArray(initialData.itens)) {
        const mappedItems = initialData.itens.map(apiItem => {
          let materialForState = null;
          if (apiItem.material_obj) materialForState = apiItem.material_obj;
          else if (apiItem.material && apiItem.material_nome)
            materialForState = {
              id: String(apiItem.material),
              nome: apiItem.material_nome,
              unidade_medida: apiItem.unidade_medida || '',
            };
          else if (apiItem.material && typeof apiItem.material === 'object')
            materialForState = apiItem.material;

          const newItem = {
            id: generateItemUniqueId(),
            originalId: initialData.id ? apiItem.id : null,
            material: materialForState,
            materialId: materialForState ? String(materialForState.id) : '',
            materialNome: materialForState ? materialForState.nome : '',
            unidadeMedida: materialForState
              ? materialForState.unidade_medida
              : '',
            quantidade:
              apiItem.quantidade != null
                ? String(apiItem.quantidade).replace(',', '.')
                : '',
            valorUnitario:
              apiItem.valor_unitario != null
                ? String(apiItem.valor_unitario).replace(',', '.')
                : '',
            valorTotalItem: '0.00',
            categoria_uso:
              apiItem.categoria_uso ||
              (materialForState ? materialForState.categoria_uso_padrao : '') ||
              '',
          };
          const qty = parseFloat(newItem.quantidade) || 0;
          const price = parseFloat(newItem.valorUnitario) || 0;
          newItem.valorTotalItem = (qty * price).toFixed(2);
          return newItem;
        });

        const initialItemsToSet =
          mappedItems.length > 0 ? mappedItems : [createNewEmptyItem()];
        dispatchItems({
          type: ITEM_ACTION_TYPES.SET_ITEMS,
          payload: initialItemsToSet,
        });
      } else {
        dispatchItems({
          type: ITEM_ACTION_TYPES.SET_ITEMS,
          payload: [createNewEmptyItem()],
        });
      }
    } else {
      const today = new Date().toISOString().split('T')[0];
      setDataCompra(today);
      setDataPagamento(today);
      setFornecedor('');
      setNotaFiscal('');
      setObservacoes('');
      setDesconto('0.00');
      setTipo('COMPRA');
      setObraId('');
      setObraSelecionada(null);
      setPagamentoParcelado({
        tipo: 'UNICO',
        parcelas: []
      });
      setAnexos([]);
      dispatchItems({
        type: ITEM_ACTION_TYPES.SET_ITEMS,
        payload: [createNewEmptyItem()],
      });
    }
  }, [initialData]);

  useEffect(() => {
    if (prevDataCompraRef.current === dataPagamento || !dataPagamento) {
      setDataPagamento(dataCompra);
    }
    prevDataCompraRef.current = dataCompra;
  }, [dataCompra, dataPagamento]);

  const handleHeaderChange = e => {
    const { name, value } = e.target;
    let processedValue = value;
    if (name === 'desconto')
      processedValue =
        typeof value === 'string' ? value.replace(',', '.') : value;

    const setters = {
      obraId: setObraId,
      dataCompra: setDataCompra,
      fornecedor: setFornecedor,
      notaFiscal: setNotaFiscal,
      observacoes: setObservacoes,
      desconto: setDesconto,
    };
    if (setters[name]) setters[name](processedValue);

    if (errors[name]) setErrors(prev => ({ ...prev, [name]: null }));
  };

  const handleMaterialSelected = useCallback(
    (index, selectedMaterialObj) => {
      dispatchItems({
        type: ITEM_ACTION_TYPES.SET_MATERIAL,
        payload: { index, material: selectedMaterialObj },
      });
      setErrors(prevErr => ({
        ...prevErr,
        [`item_${index}_material`]: null,
        [`item_${index}_categoria_uso`]: null,
      }));
      if (
        itemFieldRefs.current &&
        itemFieldRefs.current[index] &&
        itemFieldRefs.current[index].quantity &&
        itemFieldRefs.current[index].quantity.current
      ) {
        setTimeout(() => {
          itemFieldRefs.current[index].quantity.current.focus();
        }, 50);
      }
    },
    [dispatchItems]
  );

  const handleItemChange = useCallback(
    (index, fieldName, rawValue) => {
      dispatchItems({
        type: ITEM_ACTION_TYPES.UPDATE_ITEM_FIELD,
        payload: { index, fieldName, value: rawValue },
      });
      setErrors(prevErr => ({
        ...prevErr,
        [`item_${index}_${fieldName}`]: null,
      }));
    },
    [dispatchItems]
  );

  const addNewItemRow = useCallback(() => {
    const newTempId = generateItemUniqueId();
    setItemToFocusId(newTempId);
    dispatchItems({
      type: ITEM_ACTION_TYPES.ADD_ITEM,
      payload: { id: newTempId },
    });
  }, [dispatchItems]);

  const removeItemRow = useCallback(
    index => {
      const itemToRemove = items[index];
      const isNewFormAndOnlyEmptyRow =
        items.length <= 1 &&
        !(initialData && initialData.id) &&
        !itemToRemove.material &&
        !itemToRemove.quantidade &&
        !itemToRemove.valorUnitario &&
        itemToRemove.id?.toString().startsWith('temp-item-');
      if (isNewFormAndOnlyEmptyRow) return;
      dispatchItems({ type: ITEM_ACTION_TYPES.REMOVE_ITEM, payload: index });
    },
    [items, initialData, dispatchItems]
  );

  const handleItemKeyDown = useCallback(
    (event, itemIndex, currentFieldType) => {
      if (event.key === 'Enter') {
        event.preventDefault();
        const currentItemRefs = itemFieldRefs.current[itemIndex];
        if (!currentItemRefs) return;
        if (currentFieldType === 'material') {
          return;
        } else if (currentFieldType === 'quantity') {
          currentItemRefs.unitPrice?.current?.focus();
        } else if (currentFieldType === 'unitPrice') {
          currentItemRefs.categoria_uso?.focus();
        } else if (currentFieldType === 'categoria_uso') {
          if (itemIndex === items.length - 1) {
            addNewItemRow();
          } else {
            itemFieldRefs.current[itemIndex + 1]?.material?.current?.focus();
          }
        }
      } else if (event.key === 'Tab' && !event.shiftKey) {
        if (currentFieldType !== 'material') {
          event.preventDefault();
          const currentItemRefs = itemFieldRefs.current[itemIndex];
          if (!currentItemRefs) return;

          if (currentFieldType === 'quantity') {
            currentItemRefs.unitPrice?.current?.focus();
          } else if (currentFieldType === 'unitPrice') {
            currentItemRefs.categoria_uso?.focus();
          } else if (currentFieldType === 'categoria_uso') {
            if (itemIndex === items.length - 1) {
              addNewItemRow();
            } else {
              itemFieldRefs.current[itemIndex + 1]?.material?.current?.focus();
            }
          }
        }
      }
    },
    [items, addNewItemRow]
  );

  const setCategoriaUsoRef = useCallback((element, index) => {
    if (!itemFieldRefs.current[index]) {
      itemFieldRefs.current[index] = {};
    }
    itemFieldRefs.current[index].categoria_uso = element;
  }, []);

  const validateForm = () => {
    const newErrors = {};
    const dataCompraError = validateField('dataCompra', dataCompra);
    if (dataCompraError) newErrors.dataCompra = dataCompraError;
    const obraError = validateField('obraId', obraId);
    if (obraError) newErrors.obraId = obraError;
    const descontoError = validateField('desconto', desconto);
    if (descontoError) newErrors.desconto = descontoError;
    let hasValidItems = false;
    items.forEach((item, index) => {
      const hasMaterial = !!(item.material && item.material.id) || !!(item.materialId && String(item.materialId).trim());
      const hasQuantidade = !!(item.quantidade && String(item.quantidade).trim());
      const hasValorUnitario = !!(item.valorUnitario && String(item.valorUnitario).trim());
      const itemHasAnyData = hasMaterial || hasQuantidade || hasValorUnitario;
      if (itemHasAnyData) {
        const materialError = validateField('material', item.material || item.materialId, index);
        const quantidadeError = validateField('quantidade', item.quantidade, index);
        const valorError = validateField('valorUnitario', item.valorUnitario, index);
        if (materialError) newErrors[`item_${index}_material`] = materialError;
        if (quantidadeError) newErrors[`item_${index}_quantidade`] = quantidadeError;
        if (valorError) newErrors[`item_${index}_valorUnitario`] = valorError;
        if (!materialError && !quantidadeError && !valorError) {
          hasValidItems = true;
        }
      }
    });
    if (!hasValidItems) {
      newErrors.form = 'Adicione pelo menos um item válido à compra.';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = e => {
    e.preventDefault();
    if (validateForm()) {
      try {
        const finalDesconto = parseFloat(String(desconto).replace(',', '.')) || 0;
        const itemsToSubmit = items
          .filter(item => {
            const hasMaterial = !!(item.materialId || item.material?.id);
            const quantidade = parseFloat(String(item.quantidade || '0').replace(',', '.'));
            return hasMaterial && quantidade > 0;
          })
          .map(item => {
            const quantidade = parseFloat(String(item.quantidade).replace(',', '.')) || 0;
            const valor_unitario = parseFloat(String(item.valorUnitario).replace(',', '.')) || 0;
            return {
              id: item.originalId || undefined,
              material: parseInt(item.materialId || item.material?.id, 10),
              quantidade: quantidade,
              valor_unitario: valor_unitario,
              categoria_uso: item.categoria_uso || null,
            };
          });
        if (itemsToSubmit.length === 0) {
          setErrors(prev => ({
            ...prev,
            form: 'Adicione pelo menos um item válido à compra.',
          }));
          return;
        }
        const formaPagamento = pagamentoParcelado?.tipo === 'PARCELADO' ? 'PARCELADO' : 'AVISTA';
        const compraData = {
          tipo,
          obra: parseInt(obraId, 10),
          data_compra: dataCompra,
          data_pagamento: dataPagamento || null,
          fornecedor: fornecedor,
          nota_fiscal: notaFiscal || null,
          desconto: finalDesconto,
          observacoes: observacoes || null,
          forma_pagamento: formaPagamento,
          itens: itemsToSubmit,
          pagamento_parcelado: JSON.stringify(pagamentoParcelado),
          anexos: Array.isArray(anexos) ? anexos : [],
        };
        onSubmit(compraData);
      } catch (error) {
        setErrors(prev => ({
          ...prev,
          form: error.message,
        }));
      }
    }
  };

  const subtotalCalculado = items.reduce(
    (sum, item) =>
      sum + (parseFloat(String(item.valorTotalItem).replace(',', '.')) || 0),
    0
  );
  const descontoNumerico = parseFloat(String(desconto).replace(',', '.')) || 0;
  const totalGeralCalculado = subtotalCalculado - descontoNumerico;

  const CustomDateInput = forwardRef(({ value, onClick, error }, ref) => (
    <div className="relative">
      <input
        type="text"
        className={`w-full px-3 py-2.5 border ${error ? 'border-red-500 text-red-700' : 'border-slate-300 text-slate-700'} rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm`}
        onClick={onClick}
        ref={ref}
        value={value}
        readOnly
      />
      <CalendarIcon className="absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-400" />
    </div>
  ));

  return (
    <>
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-6xl mx-auto p-6 md:p-8 space-y-6 bg-white rounded-lg shadow-xl"
      >
        <h2 className="text-2xl font-semibold text-gray-800 mb-6 border-b border-slate-300 pb-3">
          Informações da Compra
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-x-6 gap-y-5">
          <div>
            <label
              htmlFor="tipo"
              className="block mb-1.5 text-sm font-medium text-gray-700"
            >
              Tipo
            </label>
            <div className="flex space-x-2 border border-slate-300 rounded-md p-1 bg-slate-50">
              <button
                ref={tipoCompraRef}
                type="button"
                onClick={() => setTipo('COMPRA')}
                onKeyDown={e => {
                  if (e.key === 'ArrowRight') {
                    e.preventDefault();
                    tipoOrcamentoRef.current?.focus();
                  } else if (e.key === 'Tab' || e.key === 'Enter') {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      setTipo('COMPRA');
                    }
                  }
                }}
                className={`flex-1 py-2 px-4 text-sm font-medium rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-primary-500 ${tipo === 'COMPRA' ? 'bg-primary-600 text-white shadow' : 'bg-transparent text-slate-600 hover:bg-slate-200'}`}
              >
                Compra
              </button>
              <button
                ref={tipoOrcamentoRef}
                type="button"
                onClick={() => setTipo('ORCAMENTO')}
                onKeyDown={e => {
                  if (e.key === 'ArrowLeft') {
                    e.preventDefault();
                    tipoCompraRef.current?.focus();
                  } else if (e.key === 'Tab' || e.key === 'Enter') {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      setTipo('ORCAMENTO');
                    }
                  }
                }}
                className={`flex-1 py-2 px-4 text-sm font-medium rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-primary-500 ${tipo === 'ORCAMENTO' ? 'bg-primary-600 text-white shadow' : 'bg-transparent text-slate-600 hover:bg-slate-200'}`}
              >
                Orçamento
              </button>
            </div>
          </div>
          <div>
            <label
              htmlFor="dataCompra"
              className="block mb-1.5 text-sm font-medium text-gray-700"
            >
              Data da Compra <span className="text-red-500">*</span>
            </label>
            <DatePicker
              selected={dataCompra ? new Date(dataCompra + 'T00:00:00') : null}
              onChange={date => setDataCompra(date.toISOString().split('T')[0])}
              onBlur={() => handleFieldBlur('dataCompra', dataCompra)}
              dateFormat="dd/MM/yyyy"
              locale="pt-BR"
              customInput={<CustomDateInput error={errors.dataCompra} />}
            />
            {errors.dataCompra && (
              <p className="mt-1.5 text-xs text-red-600 flex items-center">
                <WarningIcon /> {errors.dataCompra}
              </p>
            )}
          </div>
          <div>
            <label
              htmlFor="obraId"
              className="block mb-1.5 text-sm font-medium text-gray-700"
            >
              Obra <span className="text-red-500">*</span>
            </label>
            <ObraAutocomplete
              ref={obraAutocompleteRef}
              value={obraSelecionada}
              onObraSelect={handleObraSelect}
              onBlur={() => handleFieldBlur('obraId', obraId)}
              placeholder="Digite para buscar a obra"
              error={errors.obraId}
              obras={obras}
            />
            {errors.obraId && (
              <p className="mt-1.5 text-xs text-red-600 flex items-center">
                <WarningIcon /> {errors.obraId}
              </p>
            )}
          </div>
          <div>
            <label
              htmlFor="fornecedor"
              className="block mb-1.5 text-sm font-medium text-gray-700"
            >
              Fornecedor
            </label>
            <input
              ref={fornecedorRef}
              type="text"
              name="fornecedor"
              id="fornecedor"
              value={fornecedor}
              onChange={handleHeaderChange}
              placeholder="Nome do fornecedor"
              onBlur={e => handleFieldBlur(e.target.name, e.target.value)}
              className={`w-full px-3 py-2.5 border ${errors.fornecedor ? 'border-red-500 text-red-700' : 'border-slate-300 text-slate-700'} rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm`}
            />
            {errors.fornecedor && (
              <p className="mt-1.5 text-xs text-red-600 flex items-center">
                <WarningIcon /> {errors.fornecedor}
              </p>
            )}
          </div>
          <div>
            <label
              htmlFor="notaFiscal"
              className="block mb-1.5 text-sm font-medium text-gray-700"
            >
              Nota Fiscal
            </label>
            <input
              type="text"
              name="notaFiscal"
              id="notaFiscal"
              value={notaFiscal}
              onChange={handleHeaderChange}
              placeholder="Número da nota fiscal (opcional)"
              onBlur={e => handleFieldBlur(e.target.name, e.target.value)}
              className={`w-full px-3 py-2.5 border ${errors.notaFiscal ? 'border-red-500 text-red-700' : 'border-slate-300 text-slate-700'} rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm`}
            />
            {errors.notaFiscal && (
              <p className="mt-1.5 text-xs text-red-600 flex items-center">
                <WarningIcon /> {errors.notaFiscal}
              </p>
            )}
          </div>
        </div>
        <div className="mt-8 pt-6 border-t border-slate-300">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-semibold text-gray-700">
              Itens da Compra
            </h3>
            <button
              type="button"
              onClick={addNewItemRow}
              className="py-2 px-4 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-70 transition-colors"
              disabled={isLoading}
            >
              Adicionar Novo Item
            </button>
          </div>
          <div className="overflow-visible rounded-md shadow-sm border border-slate-200">
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead className="bg-slate-100">
                  <tr>
                    <th
                      scope="col"
                      className="px-3 py-2.5 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider min-w-[280px]"
                    >
                      Material
                    </th>
                    <th
                      scope="col"
                      className="px-3 py-2.5 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider w-[120px]"
                    >
                      Qtd.
                    </th>
                    <th
                      scope="col"
                      className="px-3 py-2.5 text-center text-xs font-semibold text-slate-600 uppercase tracking-wider w-[100px]"
                    >
                      Un.
                    </th>
                    <th
                      scope="col"
                      className="px-3 py-2.5 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider w-[150px]"
                    >
                      Val. Unit. (R$)
                    </th>
                    <th
                      scope="col"
                      className="px-3 py-2.5 text-right text-xs font-semibold text-slate-600 uppercase tracking-wider w-[140px]"
                    >
                      Val. Total (R$)
                    </th>
                    <th
                      scope="col"
                      className="px-3 py-2.5 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider w-[180px]"
                    >
                      Categoria de Uso
                    </th>
                    <th
                      scope="col"
                      className="px-3 py-2.5 text-center text-xs font-semibold text-slate-600 uppercase tracking-wider w-[100px]"
                    >
                      Ação
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-slate-200">
                  {items.map((item, index) => (
                    <ItemRow
                      key={item.id}
                      item={item}
                      index={index}
                      onItemChange={handleItemChange}
                      onRemoveItem={removeItemRow}
                      onMaterialSelectForItem={handleMaterialSelected}
                      totalItems={items.length}
                      errors={errors}
                      initialData={initialData}
                      onItemKeyDown={handleItemKeyDown}
                      onItemFieldBlur={(...args) =>
                        handleItemFieldBlur(...args)
                      }
                      setCategoriaUsoRef={setCategoriaUsoRef}
                      materialRef={itemFieldRefs.current[index]?.material}
                      quantityRef={itemFieldRefs.current[index]?.quantity}
                      unitPriceRef={itemFieldRefs.current[index]?.unitPrice}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          {items.length === 0 && (
            <p className="text-sm text-center text-gray-500 py-4">
              Nenhum item adicionado. Clique em "Adicionar Novo Item".
            </p>
          )}
        </div>
        
        <div className="mt-8 pt-6 border-t border-slate-300">
          <h3 className="text-xl font-semibold text-gray-700 mb-4">
            Pagamento e Anexos
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4 bg-slate-50 p-4 rounded-lg">
            <div>
              <PagamentoParceladoForm
                valorTotal={totalGeralCalculado}
                tipoPagamento={pagamentoParcelado?.tipo || 'UNICO'}
                onTipoPagamentoChange={handleTipoPagamentoChange}
                parcelas={pagamentoParcelado?.parcelas || []}
                onParcelasChange={handleParcelasChange}
                errors={errors}
                dataPagamento={dataPagamento}
                onDataPagamentoChange={setDataPagamento}
                CustomDateInput={CustomDateInput}
              />
            </div>
            <div>
              <AnexosCompraManager
                anexos={anexos}
                onAnexosChange={setAnexos}
                compraId={initialData?.id}
                isEditing={!!(initialData?.id)}
              />
            </div>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-slate-300">
          <h3 className="text-xl font-semibold text-gray-700 mb-4">
            Resumo da Compra
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-x-8 gap-y-4">
            <div className="md:col-span-2">
              <label
                htmlFor="observacoes"
                className="block mb-1.5 text-sm font-medium text-gray-700"
              >
                Observações
              </label>
              <textarea
                name="observacoes"
                id="observacoes"
                value={observacoes}
                onChange={handleHeaderChange}
                onBlur={e => handleFieldBlur(e.target.name, e.target.value)}
                rows="4"
                placeholder="Notas ou observações sobre a compra (opcional)"
                className="w-full px-3 py-2.5 border border-slate-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm text-slate-700"
              ></textarea>
            </div>
            <div className="md:col-span-1">
              <div className="bg-slate-50 p-4 rounded-lg shadow space-y-3">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-slate-600">Subtotal dos Itens:</span>
                  <span className="font-semibold text-slate-800">
                    R$ {subtotalCalculado.toFixed(2).replace('.', ',')}
                  </span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <label htmlFor="desconto" className="text-slate-600">
                    Desconto (R$):
                  </label>
                  <input
                    type="text"
                    inputMode="decimal"
                    name="desconto"
                    id="desconto"
                    value={desconto}
                    onChange={handleHeaderChange}
                    placeholder="0,00"
                    onBlur={e => handleFieldBlur(e.target.name, e.target.value)}
                    className={`w-28 p-1.5 border ${errors.desconto ? 'border-red-500 text-red-700' : 'border-slate-300 text-slate-700'} rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 text-sm text-right`}
                  />
                </div>
                {errors.desconto && (
                  <p className="text-xs text-red-600 text-right -mt-2 mb-1">
                    {errors.desconto}
                  </p>
                )}
                <div className="flex justify-between items-center text-lg font-bold border-t border-slate-300 pt-3 mt-3">
                  <span className="text-gray-700">Total Geral:</span>
                  <span className="text-primary-700">
                    R$ {totalGeralCalculado.toFixed(2).replace('.', ',')}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
        {errors.form && (
          <div
            className="mt-6 p-4 bg-red-50 border-l-4 border-red-500 text-red-700 rounded-md text-sm"
            role="alert"
          >
            <p>
              <span className="font-bold">Erro:</span> {errors.form}
            </p>
          </div>
        )}
        <div className="flex justify-end space-x-3 pt-6 mt-8 border-t border-slate-300">
          <button
            type="button"
            onClick={onCancel}
            disabled={isLoading}
            className="py-2.5 px-6 text-sm font-medium text-gray-700 bg-white rounded-md border border-gray-300 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-70 transition-colors"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={isLoading}
            className="py-2.5 px-6 text-sm font-medium text-white bg-primary-600 rounded-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:bg-primary-400 transition-colors flex items-center justify-center"
          >
            {isLoading ? <SpinnerIcon className="w-5 h-5 mr-2" /> : null}
            {isLoading
              ? 'Salvando...'
              : initialData && initialData.id
                ? 'Atualizar Compra'
                : 'Salvar Compra'}
          </button>
        </div>
      </form>
    </>
  );
};

export default CompraForm;
