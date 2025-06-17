import React, { useState, useEffect, useCallback, useRef, useReducer } from 'react'; // Added useReducer
import * as api from '../../services/api';
import MaterialAutocomplete from './MaterialAutocomplete';

const WarningIcon = ({ className = "w-3 h-3 inline mr-1" }) => ( // Adjusted default size
  <svg className={className} fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.216 3.031-1.742 3.031H4.42c-1.526 0-2.492-1.697-1.742-3.031l5.58-9.92zM10 13a1 1 0 110-2 1 1 0 010 2zm-1.75-4.5a1.75 1.75 0 00-3.5 0v.25h3.5v-.25z" clipRule="evenodd" /></svg>
);

// itemUniqueIdCounter and generateItemUniqueId are defined below CompraForm, will keep them there.
// For now, ensure CompraForm has access if they are used within it for ID generation before dispatch.

const ITEM_ACTION_TYPES = {
    SET_ITEMS: 'SET_ITEMS',
    ADD_ITEM: 'ADD_ITEM',
    REMOVE_ITEM: 'REMOVE_ITEM',
    UPDATE_ITEM_FIELD: 'UPDATE_ITEM_FIELD',
    SET_MATERIAL: 'SET_MATERIAL',
};

// Helper for reducer (does not generate ID)
const createNewEmptyItemPayload = () => ({
    originalId: null, material: null, materialId: '', materialNome: '',
    quantidade: '', unidadeMedida: '', valorUnitario: '', valorTotalItem: '0.00'
});

import SpinnerIcon from '../utils/SpinnerIcon'; // Import SpinnerIcon

const itemsReducer = (state, action) => {
    switch (action.type) {
        case ITEM_ACTION_TYPES.SET_ITEMS:
            return action.payload;
        case ITEM_ACTION_TYPES.ADD_ITEM: // payload: { id }
            return [...state, { ...createNewEmptyItemPayload(), id: action.payload.id }];
        case ITEM_ACTION_TYPES.REMOVE_ITEM: // payload: index
            return state.filter((_, i) => i !== action.payload);
        case ITEM_ACTION_TYPES.UPDATE_ITEM_FIELD: // payload: { index, fieldName, value }
            return state.map((item, i) => {
                if (i === action.payload.index) {
                    let processedValue = action.payload.value;
                    if (action.payload.fieldName === 'valorUnitario' || action.payload.fieldName === 'quantidade') {
                        processedValue = typeof action.payload.value === 'string' ? action.payload.value.replace(',', '.') : action.payload.value;
                    }
                    const newItem = { ...item, [action.payload.fieldName]: processedValue };
                    if (action.payload.fieldName === 'quantidade' || action.payload.fieldName === 'valorUnitario') {
                        const qty = parseFloat(newItem.quantidade) || 0;
                        const price = parseFloat(newItem.valorUnitario) || 0;
                        newItem.valorTotalItem = (qty * price).toFixed(2);
                    }
                    return newItem;
                }
                return item;
            });
        case ITEM_ACTION_TYPES.SET_MATERIAL: // payload: { index, material }
            return state.map((item, i) => {
                if (i === action.payload.index) {
                    return action.payload.material ?
                        { ...item, material: action.payload.material, materialId: String(action.payload.material.id), materialNome: action.payload.material.nome, unidadeMedida: action.payload.material.unidade_medida } :
                        { ...item, material: null, materialId: '', materialNome: '', unidadeMedida: '' };
                }
                return item;
            });
        default:
            return state;
    }
};

// Define ItemRowInternal first
const ItemRowInternal = ({
    item, index, onItemChange, onRemoveItem, totalItems, errors,
    onMaterialSelectForItem, initialData,
    onItemKeyDown,
    materialRef, // input ref for MaterialAutocomplete's input
    quantityRef, // input ref for quantity
    unitPriceRef, // input ref for unitPrice
    onItemFieldBlur, // New prop for blur handling
}) => {
    const getError = (fieldName) => errors && errors[`item_${index}_${fieldName}`];

    const isLastAndEmptyNewRow = totalItems <= 1 && !(initialData && initialData.id) &&
                                 !item.material && !item.quantidade && !item.valorUnitario;

    // Memoize the callback for MaterialAutocomplete's parentOnKeyDown
    const handleMaterialAutocompleteKeyDown = useCallback((e) => {
        onItemKeyDown(e, index, 'material');
    }, [onItemKeyDown, index]);

    return (
        <tr className={`${index % 2 === 0 ? 'bg-slate-50' : 'bg-white'} hover:bg-slate-100 transition-colors duration-150 ease-in-out`}>
            <td className="px-3 py-2.5 border-b border-slate-200 text-sm min-w-[250px] md:min-w-[280px] align-top">
                <MaterialAutocomplete
                    ref={materialRef} // Pass the ref to MaterialAutocomplete
                    value={item.material}
                    onMaterialSelect={onMaterialSelectForItem}
                    itemIndex={index}
                    error={getError('material')}
                    parentOnKeyDown={handleMaterialAutocompleteKeyDown}
                    onBlurReport={(blurState) => onItemFieldBlur(index, 'material', blurState.selectedMaterial)} // New onBlurReport
                />
            </td>
            <td className="px-3 py-2.5 border-b border-slate-200 text-sm align-top w-[120px]">
                <input
                    ref={quantityRef} // Pass the ref
                    type="text" inputMode="decimal" name="quantidade"
                    value={item.quantidade}
                    onChange={(e) => onItemChange(index, 'quantidade', e.target.value)}
                    onKeyDown={(e) => onItemKeyDown(e, index, 'quantity')}
                    onBlur={(e) => onItemFieldBlur(index, 'quantidade', e.target.value)} // Added onBlur
                    className={`w-full p-2 border ${getError('quantidade') ? 'border-red-500 text-red-700' : 'border-slate-300 text-slate-700'} rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm text-right`}
                    placeholder="0,000"
                />
                {getError('quantidade') && <p className="mt-1 text-xs text-red-600 flex items-center"><WarningIcon />{getError('quantidade')}</p>}
            </td>
            <td className="px-3 py-2.5 border-b border-slate-200 text-sm text-slate-600 align-middle text-center w-[100px]">
                {item.unidadeMedida || '--'}
            </td>
            <td className="px-3 py-2.5 border-b border-slate-200 text-sm align-top w-[150px]">
                <input
                    ref={unitPriceRef} // Pass the ref
                    type="text" inputMode="decimal" name="valorUnitario"
                    value={item.valorUnitario}
                    onChange={(e) => onItemChange(index, 'valorUnitario', e.target.value)}
                    onKeyDown={(e) => onItemKeyDown(e, index, 'unitPrice')}
                    onBlur={(e) => onItemFieldBlur(index, 'valorUnitario', e.target.value)} // Added onBlur
                    className={`w-full p-2 border ${getError('valorUnitario') ? 'border-red-500 text-red-700' : 'border-slate-300 text-slate-700'} rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm text-right`}
                    placeholder="0,00"
                />
                {getError('valorUnitario') && <p className="mt-1 text-xs text-red-600 flex items-center"><WarningIcon />{getError('valorUnitario')}</p>}
            </td>
            <td className="px-3 py-2.5 border-b border-slate-200 text-sm text-slate-800 font-medium align-middle text-right w-[140px]">
                R$ {parseFloat(item.valorTotalItem || 0).toFixed(2).replace('.',',')}
            </td>
            <td className="px-3 py-2.5 border-b border-slate-200 text-center align-middle w-[100px]"> {/* Adjusted width */}
                <button type="button" onClick={() => onRemoveItem(index)}
                        className="text-red-600 hover:text-red-800 disabled:text-slate-400 disabled:cursor-not-allowed font-medium p-1.5 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-1 transition-colors"
                        disabled={isLastAndEmptyNewRow}
                        title={isLastAndEmptyNewRow ? "Pelo menos um item é necessário" : "Remover Item"}>
                    Excluir
                </button>
            </td>
        </tr>
    );
};
// Wrap ItemRowInternal with React.memo for export
const ItemRow = React.memo(ItemRowInternal);


const CompraForm = ({ initialData, onSubmit, onCancel, isLoading }) => {
    const [obraId, setObraId] = useState('');
    const [dataCompra, setDataCompra] = useState('');
    const [dataPagamento, setDataPagamento] = useState(''); // Added state for payment date
    const [fornecedor, setFornecedor] = useState('');
    const [notaFiscal, setNotaFiscal] = useState('');
    const [observacoes, setObservacoes] = useState('');
    const [desconto, setDesconto] = useState('0.00');
    // const [items, setItems] = useState([]); // Replaced with useReducer
    const [items, dispatchItems] = useReducer(itemsReducer, []); // useReducer for items
    const [obras, setObras] = useState([]);
    const [errors, setErrors] = useState({});
    const [itemToFocusId, setItemToFocusId] = useState(null);

    const itemFieldRefs = useRef([]);
    const prevDataCompraRef = useRef(); // Added ref for previous dataCompra

    // Function to get field error (can be defined outside or memoized if complex)
    // For simplicity, defined here. If it used CompraForm state/props not passed as args, it would need useCallback.
    const getFieldError = (fieldName, value, itemIndex = null, currentItems = null) => {
        // Header fields
        if (itemIndex === null) {
            if (fieldName === 'dataCompra' && !value) return 'Data da compra é obrigatória.';
            if (fieldName === 'obraId' && !value) return 'Obra é obrigatória.';
            if (fieldName === 'desconto') {
                const standardizedDesconto = String(value).replace(',', '.');
                if (standardizedDesconto.trim() !== '' && (isNaN(parseFloat(standardizedDesconto)) || parseFloat(standardizedDesconto) < 0)) {
                    return 'Desconto deve ser um número válido e não negativo.';
                }
            }
            // No onBlur validation for fornecedor or notaFiscal in this scope, but can be added.
        } else { // Item fields
            const itemToValidate = currentItems && currentItems[itemIndex];
            if (!itemToValidate) return null;

            if (fieldName === 'material') {
                if (!value || !value.id) return 'Material é obrigatório.';
            } else if (fieldName === 'quantidade') {
                const stdQty = String(value).replace(',', '.');
                if (stdQty.trim() === '' || parseFloat(stdQty) <= 0) return 'Quantidade deve ser positiva.';
            } else if (fieldName === 'valorUnitario') {
                const stdVU = String(value).replace(',', '.');
                // Validate if field is not empty or if other related item fields have values
                if (stdVU.trim() !== '' || itemToValidate.materialId || itemToValidate.quantidade.trim() !== '') {
                    if (stdVU.trim() === '' || parseFloat(stdVU) < 0) return 'Valor unitário deve ser positivo ou zero.';
                }
            }
        }
        return null; // No error
    };

    const handleFieldBlur = useCallback((fieldName, fieldValue) => {
        const error = getFieldError(fieldName, fieldValue);
        setErrors(prev => ({ ...prev, [fieldName]: error }));
    }, [setErrors]); // getFieldError is stable if defined outside or has no external deps from CompraForm scope

    const handleItemFieldBlur = useCallback((itemIndex, fieldName, fieldValue) => {
        const error = getFieldError(fieldName, fieldValue, itemIndex, items);
        setErrors(prev => ({ ...prev, [`item_${itemIndex}_${fieldName}`]: error }));
    }, [items, setErrors]); // getFieldError is stable, items is a dependency for currentItems access

    useEffect(() => {
        itemFieldRefs.current = items.map(
            (_, i) => itemFieldRefs.current[i] || {
                material: React.createRef(), quantity: React.createRef(), unitPrice: React.createRef(),
            }
        );
    }, [items.length]);

    // New useEffect for focusing based on itemToFocusId
    useEffect(() => {
        if (itemToFocusId && items.length > 0) {
            const focusIndex = items.findIndex(item => item.id === itemToFocusId);

            if (focusIndex !== -1) {
                // Ensure the refs array for this index is populated and material ref exists
                if (itemFieldRefs.current && itemFieldRefs.current[focusIndex] && itemFieldRefs.current[focusIndex].material) {
                    const materialAutocompleteInstance = itemFieldRefs.current[focusIndex].material.current;

                    if (materialAutocompleteInstance && typeof materialAutocompleteInstance.focus === 'function') {
                        setTimeout(() => {
                            materialAutocompleteInstance.focus();
                            // setItemToFocusId(null); // Moved down to always consume ID after attempt
                        }, 0); // Delay to allow DOM updates and ref attachment
                    }
                }
                setItemToFocusId(null); // Consume the ID to prevent re-focusing on subsequent renders
            } else {
                setItemToFocusId(null); // Item not found, consume ID
            }
        }
    }, [items, itemToFocusId, itemFieldRefs]); // Added itemFieldRefs

    useEffect(() => {
        const fetchObras = async () => {
            try {
                const response = await api.getObras({ page_size: 500 });
                setObras(response.data && Array.isArray(response.data.results) ? response.data.results : (Array.isArray(response.data) ? response.data : []));
            } catch (error) { console.error('Error fetching obras:', error); setObras([]); }
        };
        fetchObras();
    }, []);

    const createNewEmptyItem = () => ({
        id: generateItemUniqueId(), originalId: null, material: null, materialId: '', materialNome: '',
        quantidade: '', unidadeMedida: '', valorUnitario: '', valorTotalItem: '0.00'
    });

    useEffect(() => {
        itemUniqueIdCounter = 0; setErrors({});
        if (initialData && initialData.id) {
            setObraId(initialData.obra?.id?.toString() || initialData.obra?.toString() || '');
            const initialDataCompra = initialData.data_compra ? new Date(initialData.data_compra).toISOString().split('T')[0] : '';
            setDataCompra(initialDataCompra);
            setDataPagamento(initialData.data_pagamento ? new Date(initialData.data_pagamento).toISOString().split('T')[0] : initialDataCompra); // Set dataPagamento from initialData or default to data_compra
            setFornecedor(initialData.fornecedor || '');
            setNotaFiscal(initialData.nota_fiscal || '');
            setObservacoes(initialData.observacoes || '');
            setDesconto(initialData.desconto != null ? initialData.desconto.toString().replace(',', '.') : '0.00');

            if (initialData.itens && Array.isArray(initialData.itens)) {
                const mappedItems = initialData.itens.map(apiItem => {
                    let materialForState = null;
                    if (apiItem.material_obj) materialForState = apiItem.material_obj;
                    else if (apiItem.material && apiItem.material_nome) materialForState = { id: String(apiItem.material), nome: apiItem.material_nome, unidade_medida: apiItem.unidade_medida || '' };
                    else if (apiItem.material && typeof apiItem.material === 'object') materialForState = apiItem.material;

                    const newItem = {
                        id: generateItemUniqueId(), originalId: apiItem.id || null, material: materialForState,
                        materialId: materialForState ? String(materialForState.id) : (apiItem.material ? String(apiItem.material.id || apiItem.material) : ''),
                        materialNome: materialForState ? materialForState.nome : (apiItem.material_nome || ''),
                        unidadeMedida: materialForState ? materialForState.unidade_medida : (apiItem.material_unidade_medida || ''),
                        quantidade: apiItem.quantidade != null ? apiItem.quantidade.toString().replace(',', '.') : '',
                        valorUnitario: apiItem.valor_unitario != null ? apiItem.valor_unitario.toString().replace(',', '.') : '',
                        valorTotalItem: '0.00',
                    };
                    const qty = parseFloat(newItem.quantidade) || 0; const price = parseFloat(newItem.valorUnitario) || 0;
                    newItem.valorTotalItem = (qty * price).toFixed(2);
                    return newItem;
                });
                const initialItemsToSet = mappedItems.length > 0 ? mappedItems : [createNewEmptyItem()];
                dispatchItems({ type: ITEM_ACTION_TYPES.SET_ITEMS, payload: initialItemsToSet });
            } else {
                dispatchItems({ type: ITEM_ACTION_TYPES.SET_ITEMS, payload: [createNewEmptyItem()] });
            }
        } else {
            setObraId(initialData?.obra?.toString() || initialData?.obra_id?.toString() || '');
            const today = new Date().toISOString().split('T')[0];
            setDataCompra(today);
            setDataPagamento(today); // Default dataPagamento to today for new entries
            setFornecedor(''); setNotaFiscal(''); setObservacoes(''); setDesconto('0.00');
            dispatchItems({ type: ITEM_ACTION_TYPES.SET_ITEMS, payload: [createNewEmptyItem()] });
        }
    }, [initialData]);

    // Synchronize dataPagamento with dataCompra if dataPagamento is not manually set
    useEffect(() => {
        if (prevDataCompraRef.current === dataPagamento || !dataPagamento) {
            setDataPagamento(dataCompra);
        }
        prevDataCompraRef.current = dataCompra;
    }, [dataCompra]);

    const handleHeaderChange = (e) => {
        const { name, value } = e.target;
        let processedValue = value;
        if (name === 'desconto') processedValue = typeof value === 'string' ? value.replace(',', '.') : value;

        const setters = { obraId: setObraId, dataCompra: setDataCompra, fornecedor: setFornecedor, notaFiscal: setNotaFiscal, observacoes: setObservacoes, desconto: setDesconto };
        if (setters[name]) setters[name](processedValue);

        if (errors[name]) setErrors(prev => ({ ...prev, [name]: null }));
    };

    const handleMaterialSelected = useCallback((index, selectedMaterialObj) => {
        try {
            dispatchItems({
                type: ITEM_ACTION_TYPES.SET_MATERIAL,
                payload: { index, material: selectedMaterialObj }
            });
            setErrors(prevErr => ({...prevErr, [`item_${index}_material`]: null}));
            setTimeout(() => {
                if (itemFieldRefs.current && itemFieldRefs.current[index] && itemFieldRefs.current[index].quantity && itemFieldRefs.current[index].quantity.current) {
                    itemFieldRefs.current[index].quantity.current.focus();
                } else {
                    // console.warn(`Could not focus quantity for item index ${index}: Refs not available.`);
                }
            }, 0);
        } catch (error) {
            console.error("Error in handleMaterialSelected:", error);
            // Optionally, set some error state here to inform the user if appropriate
        }
    }, [dispatchItems]);

    const handleItemChange = useCallback((index, fieldName, rawValue) => {
        dispatchItems({
            type: ITEM_ACTION_TYPES.UPDATE_ITEM_FIELD,
            payload: { index, fieldName, value: rawValue }
        });
        setErrors(prevErr => ({...prevErr, [`item_${index}_${fieldName}`]: null})); // setErrors is stable
    }, [dispatchItems]); // dispatchItems is stable

    const addNewItemRow = useCallback(() => {
        const newTempId = generateItemUniqueId(); // Global function
        setItemToFocusId(newTempId); // setItemToFocusId is stable
        dispatchItems({ type: ITEM_ACTION_TYPES.ADD_ITEM, payload: { id: newTempId } });
    }, [dispatchItems, setItemToFocusId]); // dispatchItems and setItemToFocusId are stable

    const removeItemRow = useCallback((index) => {
        const itemToRemove = items[index];
        const isNewFormAndOnlyEmptyRow = items.length <= 1 && !(initialData && initialData.id) &&
                                       !itemToRemove.material && !itemToRemove.quantidade && !itemToRemove.valorUnitario &&
                                       itemToRemove.id?.toString().startsWith('temp-item-');
        if (isNewFormAndOnlyEmptyRow) return;
        dispatchItems({ type: ITEM_ACTION_TYPES.REMOVE_ITEM, payload: index });
    }, [items, initialData, dispatchItems]); // items, initialData are dependencies

    const handleItemKeyDown = useCallback((event, itemIndex, currentFieldType) => {
        if (event.key === 'Enter' || (event.key === 'Tab' && !event.shiftKey)) {
            event.preventDefault();
            const currentItemRefs = itemFieldRefs.current[itemIndex]; // Accessing .current
            if (currentFieldType === 'material') {
                currentItemRefs?.quantity?.current?.focus();
            } else if (currentFieldType === 'quantity') {
                currentItemRefs?.unitPrice?.current?.focus();
            } else if (currentFieldType === 'unitPrice') {
                if (itemIndex === items.length - 1) { // items.length depends on items
                    addNewItemRow(); // addNewItemRow is a dependency
                } else {
                    itemFieldRefs.current[itemIndex + 1]?.material?.current?.focus();
                }
            }
        }
    }, [items, addNewItemRow]); // items (for .length), addNewItemRow are dependencies. itemFieldRefs (object) is stable.

    const validateForm = () => { // Not passed as prop, but if it were, it'd need useCallback with its own deps (obraId, dataCompra, desconto, items)
        const newErrors = {};
        if (!obraId) newErrors.obraId = 'Obra é obrigatória.';
        if (!dataCompra) newErrors.dataCompra = 'Data da compra é obrigatória.';
        const currentDescontoStr = String(desconto);
        const standardizedDesconto = currentDescontoStr.replace(',', '.');
        if (standardizedDesconto.trim() !== '' && (isNaN(parseFloat(standardizedDesconto)) || parseFloat(standardizedDesconto) < 0)) {
            newErrors.desconto = 'Desconto deve ser um número válido e não negativo.';
        }
        let hasAtLeastOneValidItem = false;
        items.forEach((item, index) => {
            const materialIsSet = item.material || item.materialId;
            const quantidadeIsSet = String(item.quantidade).replace(',', '.').trim() !== '';
            const valorUnitarioIsSet = String(item.valorUnitario).replace(',', '.').trim() !== '';

            if (items.length === 1 || materialIsSet || quantidadeIsSet || valorUnitarioIsSet) {
                if (!materialIsSet) newErrors[`item_${index}_material`] = 'Material é obrigatório.';
                const stdQty = String(item.quantidade).replace(',', '.');
                if (stdQty === '' || parseFloat(stdQty) <= 0) newErrors[`item_${index}_quantidade`] = 'Quantidade deve ser positiva.';
                const stdVU = String(item.valorUnitario).replace(',', '.');
                if (stdVU === '' || parseFloat(stdVU) < 0) newErrors[`item_${index}_valorUnitario`] = 'Valor unitário deve ser positivo ou zero.';

                if (materialIsSet && parseFloat(stdQty) > 0 && parseFloat(stdVU) >= 0) hasAtLeastOneValidItem = true;
            }
        });
        if (items.length > 0 && !hasAtLeastOneValidItem && items.some(i => i.materialId || i.quantidade || i.valorUnitario)) {
             newErrors.form = "Pelo menos um item deve ser preenchido corretamente.";
        } else if (items.length === 0 && !(initialData && initialData.id)) {
            newErrors.form = "Uma compra deve ter pelo menos um item.";
        }
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (validateForm()) {
            const finalDesconto = parseFloat(String(desconto).replace(',', '.')) || 0;
            const itemsToSubmit = items
                .filter(item => (item.materialId || item.material?.id) && String(item.quantidade).replace(',', '.').trim() !== '' && parseFloat(String(item.quantidade).replace(',', '.')) > 0 && String(item.valorUnitario).replace(',', '.').trim() !== '' && parseFloat(String(item.valorUnitario).replace(',', '.')) >= 0)
                .map(item => ({
                    id: item.originalId || undefined,
                    material: parseInt(item.materialId || item.material?.id, 10),
                    quantidade: parseFloat(String(item.quantidade).replace(',', '.')),
                    valor_unitario: parseFloat(String(item.valorUnitario).replace(',', '.'))
            }));
            if (itemsToSubmit.length === 0 && !(initialData && initialData.id)) {
                 setErrors(prev => ({...prev, form: "Adicione pelo menos um item válido à compra."})); return;
            }
            const compraData = {
                obra: parseInt(obraId, 10), data_compra: dataCompra, data_pagamento: dataPagamento || null,
                fornecedor: fornecedor, nota_fiscal: notaFiscal || null, desconto: finalDesconto,
                observacoes: observacoes || null, itens: itemsToSubmit
            };
            onSubmit(compraData);
        }
    };

    const subtotalCalculado = items.reduce((sum, item) => (sum + (parseFloat(String(item.valorTotalItem).replace(',', '.')) || 0)), 0);
    const descontoNumerico = parseFloat(String(desconto).replace(',', '.')) || 0;
    const totalGeralCalculado = subtotalCalculado - descontoNumerico;

    return (
        <form onSubmit={handleSubmit} className="w-full max-w-6xl mx-auto p-6 md:p-8 space-y-6 bg-white rounded-lg shadow-xl"> {/* Changed to max-w-6xl */}
            <h2 className="text-2xl font-semibold text-gray-800 mb-6 border-b border-slate-300 pb-3">Informações da Compra</h2>

            {/* Header Section */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-x-6 gap-y-5"> {/* Adjusted to md:grid-cols-3 and gap-x-6 */}
                <div>
                    <label htmlFor="dataCompra" className="block mb-1.5 text-sm font-medium text-gray-700">Data da Compra <span className="text-red-500">*</span></label>
                    <input type="date" name="dataCompra" id="dataCompra" value={dataCompra} onChange={handleHeaderChange}
                           onBlur={(e) => handleFieldBlur(e.target.name, e.target.value)}
                           className={`w-full px-3 py-2.5 border ${errors.dataCompra ? 'border-red-500 text-red-700' : 'border-slate-300 text-slate-700'} rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm`} />
                    {errors.dataCompra && <p className="mt-1.5 text-xs text-red-600 flex items-center"><WarningIcon /> {errors.dataCompra}</p>}
                </div>
                <div>
                    <label htmlFor="dataPagamento" className="block mb-1.5 text-sm font-medium text-gray-700">Data de Pagamento</label>
                    <input type="date" name="dataPagamento" id="dataPagamento" value={dataPagamento}
                           onChange={(e) => setDataPagamento(e.target.value)}
                           className={`w-full px-3 py-2.5 border ${errors.dataPagamento ? 'border-red-500 text-red-700' : 'border-slate-300 text-slate-700'} rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm`} />
                    {/* Optional: {errors.dataPagamento && <p className="mt-1.5 text-xs text-red-600 flex items-center"><WarningIcon /> {errors.dataPagamento}</p>} */}
                </div>
                <div>
                    <label htmlFor="obraId" className="block mb-1.5 text-sm font-medium text-gray-700">Obra <span className="text-red-500">*</span></label>
                    <select name="obraId" id="obraId" value={obraId} onChange={handleHeaderChange}
                            onBlur={(e) => handleFieldBlur(e.target.name, e.target.value)}
                            className={`w-full px-3 py-2.5 border ${errors.obraId ? 'border-red-500 text-red-700' : 'border-slate-300 text-slate-700'} rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm`}>
                        <option value="">Selecione a Obra</option>
                        {Array.isArray(obras) && obras.map((obra) => (
                            <option key={obra.id} value={obra.id}>{obra.nome_obra}</option>
                        ))}
                    </select>
                    {errors.obraId && <p className="mt-1.5 text-xs text-red-600 flex items-center"><WarningIcon /> {errors.obraId}</p>}
                </div>
                <div>
                    <label htmlFor="fornecedor" className="block mb-1.5 text-sm font-medium text-gray-700">Fornecedor</label>
                    <input type="text" name="fornecedor" id="fornecedor" value={fornecedor} onChange={handleHeaderChange} placeholder="Nome do fornecedor"
                           onBlur={(e) => handleFieldBlur(e.target.name, e.target.value)}
                           className={`w-full px-3 py-2.5 border ${errors.fornecedor ? 'border-red-500 text-red-700' : 'border-slate-300 text-slate-700'} rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm`} />
                    {errors.fornecedor && <p className="mt-1.5 text-xs text-red-600 flex items-center"><WarningIcon /> {errors.fornecedor}</p>}
                </div>
                <div>
                    <label htmlFor="notaFiscal" className="block mb-1.5 text-sm font-medium text-gray-700">Nota Fiscal</label>
                    <input type="text" name="notaFiscal" id="notaFiscal" value={notaFiscal} onChange={handleHeaderChange} placeholder="Número da nota fiscal (opcional)"
                           onBlur={(e) => handleFieldBlur(e.target.name, e.target.value)}
                           className={`w-full px-3 py-2.5 border ${errors.notaFiscal ? 'border-red-500 text-red-700' : 'border-slate-300 text-slate-700'} rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm`} />
                    {errors.notaFiscal && <p className="mt-1.5 text-xs text-red-600 flex items-center"><WarningIcon /> {errors.notaFiscal}</p>}
                </div>
            </div>

            {/* Dynamic Item Table Section */}
            <div className="mt-8 pt-6 border-t border-slate-300">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-semibold text-gray-700">Itens da Compra</h3>
                    <button type="button" onClick={addNewItemRow}
                            className="py-2 px-4 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-70 transition-colors"
                            disabled={isLoading}>
                        Adicionar Novo Item
                    </button>
                </div>
                <div className="overflow-visible rounded-md shadow-sm border border-slate-200"> {/* Kept overflow-visible for autocomplete, might not be needed if portal is only solution */}
                    <div className="overflow-x-auto"> {/* Reverted: Removed overflow-y-visible as portal handles clipping */}
                        <table className="min-w-full">
                            <thead className="bg-slate-100">
                                <tr>
                                    <th scope="col" className="px-3 py-2.5 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider min-w-[280px]">Material</th>
                                    <th scope="col" className="px-3 py-2.5 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider w-[120px]">Qtd.</th>
                                    <th scope="col" className="px-3 py-2.5 text-center text-xs font-semibold text-slate-600 uppercase tracking-wider w-[100px]">Un.</th>
                                    <th scope="col" className="px-3 py-2.5 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider w-[150px]">Val. Unit. (R$)</th>
                                    <th scope="col" className="px-3 py-2.5 text-right text-xs font-semibold text-slate-600 uppercase tracking-wider w-[140px]">Val. Total (R$)</th>
                                    <th scope="col" className="px-3 py-2.5 text-center text-xs font-semibold text-slate-600 uppercase tracking-wider w-[100px]">Ação</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-slate-200">
                                {items.map((item, index) => (
                                    <ItemRow key={item.id} item={item} index={index}
                                        onItemChange={handleItemChange}
                                        onRemoveItem={removeItemRow}
                                        onMaterialSelectForItem={handleMaterialSelected}
                                        totalItems={items.length}
                                        errors={errors}
                                        initialData={initialData}
                                        onItemKeyDown={handleItemKeyDown}
                                        onItemFieldBlur={handleItemFieldBlur} // Pass blur handler to ItemRow
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
                    <p className="text-sm text-center text-gray-500 py-4">Nenhum item adicionado. Clique em "Adicionar Novo Item".</p>
                )}
            </div>

            {/* Summary Section */}
            <div className="mt-8 pt-6 border-t border-slate-300">
                <h3 className="text-xl font-semibold text-gray-700 mb-4">Resumo da Compra</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-x-8 gap-y-4">
                    <div className="md:col-span-2">
                        <label htmlFor="observacoes" className="block mb-1.5 text-sm font-medium text-gray-700">Observações</label>
                        <textarea
                            name="observacoes" id="observacoes" value={observacoes} onChange={handleHeaderChange}
                            onBlur={(e) => handleFieldBlur(e.target.name, e.target.value)}
                            rows="4" placeholder="Notas ou observações sobre a compra (opcional)"
                            className="w-full px-3 py-2.5 border border-slate-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm text-slate-700"
                        ></textarea>
                    </div>
                    <div className="md:col-span-1">
                        <div className="bg-slate-50 p-4 rounded-lg shadow space-y-3">
                            <div className="flex justify-between items-center text-sm">
                                <span className="text-slate-600">Subtotal dos Itens:</span>
                                <span className="font-semibold text-slate-800">R$ {subtotalCalculado.toFixed(2).replace('.', ',')}</span>
                            </div>
                            <div className="flex justify-between items-center text-sm">
                                <label htmlFor="desconto" className="text-slate-600">Desconto (R$):</label>
                                <input
                                    type="text" inputMode="decimal" name="desconto" id="desconto" value={desconto}
                                    onChange={handleHeaderChange} placeholder="0,00"
                                    onBlur={(e) => handleFieldBlur(e.target.name, e.target.value)}
                                    className={`w-28 p-1.5 border ${errors.desconto ? 'border-red-500 text-red-700' : 'border-slate-300 text-slate-700'} rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 text-sm text-right`}
                                />
                            </div>
                            {errors.desconto && <p className="text-xs text-red-600 text-right -mt-2 mb-1">{errors.desconto}</p>}
                            <div className="flex justify-between items-center text-lg font-bold border-t border-slate-300 pt-3 mt-3">
                                <span className="text-gray-700">Total Geral:</span>
                                <span className="text-primary-700">R$ {totalGeralCalculado.toFixed(2).replace('.', ',')}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {errors.form && (
                 <div className="mt-6 p-4 bg-red-50 border-l-4 border-red-500 text-red-700 rounded-md text-sm" role="alert">
                    <p><span className="font-bold">Erro:</span> {errors.form}</p>
                </div>
            )}

            <div className="flex justify-end space-x-3 pt-6 mt-8 border-t border-slate-300">
                <button type="button" onClick={onCancel} disabled={isLoading}
                        className="py-2.5 px-6 text-sm font-medium text-gray-700 bg-white rounded-md border border-gray-300 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-70 transition-colors">
                    Cancelar
                </button>
                <button type="submit" disabled={isLoading}
                        className="py-2.5 px-6 text-sm font-medium text-white bg-primary-600 rounded-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:bg-primary-400 transition-colors flex items-center justify-center">
                    {isLoading ? <SpinnerIcon className="w-5 h-5 mr-2"/> : null}
                    {isLoading ? 'Salvando...' : (initialData && initialData.id ? 'Atualizar Compra' : 'Salvar Compra')}
                </button>
            </div>
        </form>
    );
};

export default CompraForm;

// Moved from top for tool processing, ensure correct scope in actual file.
let itemUniqueIdCounter = 0;
const generateItemUniqueId = () => `temp-item-${itemUniqueIdCounter++}`;