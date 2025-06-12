import React, { useState, useEffect, useCallback, useRef } from 'react';
import * as api from '../../services/api';
import MaterialAutocomplete from './MaterialAutocomplete';

const WarningIcon = ({ className = "w-3 h-3 inline mr-1" }) => ( // Adjusted default size
  <svg className={className} fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.216 3.031-1.742 3.031H4.42c-1.526 0-2.492-1.697-1.742-3.031l5.58-9.92zM10 13a1 1 0 110-2 1 1 0 010 2zm-1.75-4.5a1.75 1.75 0 00-3.5 0v.25h3.5v-.25z" clipRule="evenodd" /></svg>
);

let itemUniqueIdCounter = 0;
const generateItemUniqueId = () => `temp-item-${itemUniqueIdCounter++}`;

const ItemRow = ({
    item, index, onItemChange, onRemoveItem, totalItems, errors,
    onMaterialSelectForItem, initialData,
    onItemKeyDown,
    materialRef,
    quantityRef,
    unitPriceRef
}) => {
    const getError = (fieldName) => errors && errors[`item_${index}_${fieldName}`];

    const isLastAndEmptyNewRow = totalItems <= 1 && !(initialData && initialData.id) &&
                                 !item.material && !item.quantidade && !item.valorUnitario;

    return (
        <tr className={`${index % 2 === 0 ? 'bg-slate-50' : 'bg-white'} hover:bg-slate-100 transition-colors duration-150 ease-in-out`}>
            <td className="px-3 py-2.5 border-b border-slate-200 text-sm min-w-[250px] md:min-w-[280px] align-top">
                <MaterialAutocomplete
                    ref={materialRef}
                    value={item.material}
                    onMaterialSelect={onMaterialSelectForItem}
                    itemIndex={index}
                    error={getError('material')}
                    parentOnKeyDown={(e) => onItemKeyDown(e, index, 'material')}
                />
            </td>
            <td className="px-3 py-2.5 border-b border-slate-200 text-sm align-top w-[120px]"> {/* Adjusted width */}
                <input
                    ref={quantityRef} type="text" inputMode="decimal" name="quantidade"
                    value={item.quantidade}
                    onChange={(e) => onItemChange(index, 'quantidade', e.target.value)}
                    onKeyDown={(e) => onItemKeyDown(e, index, 'quantity')}
                    className={`w-full p-2 border ${getError('quantidade') ? 'border-red-500 text-red-700' : 'border-slate-300 text-slate-700'} rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm text-right`}
                    placeholder="0,000"
                />
                {getError('quantidade') && <p className="mt-1 text-xs text-red-600 flex items-center"><WarningIcon />{getError('quantidade')}</p>}
            </td>
            <td className="px-3 py-2.5 border-b border-slate-200 text-sm text-slate-600 align-middle text-center w-[100px]"> {/* Adjusted width */}
                {item.unidadeMedida || '--'}
            </td>
            <td className="px-3 py-2.5 border-b border-slate-200 text-sm align-top w-[150px]"> {/* Adjusted width */}
                <input
                    ref={unitPriceRef} type="text" inputMode="decimal" name="valorUnitario"
                    value={item.valorUnitario}
                    onChange={(e) => onItemChange(index, 'valorUnitario', e.target.value)}
                    onKeyDown={(e) => onItemKeyDown(e, index, 'unitPrice')}
                    className={`w-full p-2 border ${getError('valorUnitario') ? 'border-red-500 text-red-700' : 'border-slate-300 text-slate-700'} rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm text-right`}
                    placeholder="0,00"
                />
                {getError('valorUnitario') && <p className="mt-1 text-xs text-red-600 flex items-center"><WarningIcon />{getError('valorUnitario')}</p>}
            </td>
            <td className="px-3 py-2.5 border-b border-slate-200 text-sm text-slate-800 font-medium align-middle text-right w-[140px]"> {/* Adjusted width */}
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


const CompraForm = ({ initialData, onSubmit, onCancel, isLoading }) => {
    const [obraId, setObraId] = useState('');
    const [dataCompra, setDataCompra] = useState('');
    const [fornecedor, setFornecedor] = useState('');
    const [notaFiscal, setNotaFiscal] = useState('');
    const [observacoes, setObservacoes] = useState('');
    const [desconto, setDesconto] = useState('0.00');
    const [items, setItems] = useState([]);
    const [obras, setObras] = useState([]);
    const [errors, setErrors] = useState({});

    const itemFieldRefs = useRef([]);
    const focusAfterAddRef = useRef(false);

    useEffect(() => {
        itemFieldRefs.current = items.map(
            (_, i) => itemFieldRefs.current[i] || {
                material: React.createRef(), quantity: React.createRef(), unitPrice: React.createRef(),
            }
        );
    }, [items.length]);

    useEffect(() => {
        if (focusAfterAddRef.current && items.length > 0) {
            const lastItemIndex = items.length - 1;
            const materialRefCurrentInstance = itemFieldRefs.current[lastItemIndex]?.material?.current;
            if (materialRefCurrentInstance && typeof materialRefCurrentInstance.focus === 'function') {
                setTimeout(() => materialRefCurrentInstance.focus(), 0);
            }
            focusAfterAddRef.current = false;
        }
    }, [items]);

    useEffect(() => {
        const fetchObras = async () => {
            try {
                const response = await api.getObras();
                setObras(response.data || response || []);
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
            setDataCompra(initialData.data_compra ? new Date(initialData.data_compra).toISOString().split('T')[0] : '');
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
                setItems(mappedItems.length > 0 ? mappedItems : [createNewEmptyItem()]);
            } else setItems([createNewEmptyItem()]);
        } else {
            setObraId(initialData?.obra?.toString() || initialData?.obra_id?.toString() || '');
            setDataCompra(new Date().toISOString().split('T')[0]);
            setFornecedor(''); setNotaFiscal(''); setObservacoes(''); setDesconto('0.00');
            setItems([createNewEmptyItem()]);
        }
    }, [initialData]);

    const handleHeaderChange = (e) => {
        const { name, value } = e.target;
        let processedValue = value;
        if (name === 'desconto') processedValue = typeof value === 'string' ? value.replace(',', '.') : value;

        const setters = { obraId: setObraId, dataCompra: setDataCompra, fornecedor: setFornecedor, notaFiscal: setNotaFiscal, observacoes: setObservacoes, desconto: setDesconto };
        if (setters[name]) setters[name](processedValue);

        if (errors[name]) setErrors(prev => ({ ...prev, [name]: null }));
    };

    const handleMaterialSelected = (index, selectedMaterialObj) => {
        setItems(prevItems => prevItems.map((item, i) => {
            if (i === index) {
                setErrors(prevErr => ({...prevErr, [`item_${index}_material`]: null}));
                return selectedMaterialObj ?
                    { ...item, material: selectedMaterialObj, materialId: String(selectedMaterialObj.id), materialNome: selectedMaterialObj.nome, unidadeMedida: selectedMaterialObj.unidade_medida } :
                    { ...item, material: null, materialId: '', materialNome: '', unidadeMedida: '' };
            }
            return item;
        }));
        setTimeout(() => itemFieldRefs.current[index]?.quantity?.current?.focus(), 0);
    };

    const handleItemChange = (index, fieldName, rawValue) => {
        setItems(prevItems => prevItems.map((item, i) => {
            if (i === index) {
                let processedValue = rawValue;
                if (fieldName === 'valorUnitario' || fieldName === 'quantidade') processedValue = typeof rawValue === 'string' ? rawValue.replace(',', '.') : rawValue;

                const newItem = { ...item, [fieldName]: processedValue };
                if (fieldName === 'quantidade' || fieldName === 'valorUnitario') {
                    const qty = parseFloat(newItem.quantidade) || 0;
                    const price = parseFloat(newItem.valorUnitario) || 0;
                    newItem.valorTotalItem = (qty * price).toFixed(2);
                }
                setErrors(prevErr => ({...prevErr, [`item_${index}_${fieldName}`]: null}));
                return newItem;
            }
            return item;
        }));
    };

    const addNewItemRow = () => { setItems(prevItems => [...prevItems, createNewEmptyItem()]); focusAfterAddRef.current = true; };

    const removeItemRow = (index) => {
        const itemToRemove = items[index];
        const isNewFormAndOnlyEmptyRow = items.length <= 1 && !(initialData && initialData.id) &&
                                       !itemToRemove.material && !itemToRemove.quantidade && !itemToRemove.valorUnitario &&
                                       itemToRemove.id?.toString().startsWith('temp-item-');
        if (isNewFormAndOnlyEmptyRow) return;
        setItems(prevItems => prevItems.filter((_, i) => i !== index));
    };

    const handleItemKeyDown = (event, itemIndex, currentFieldType) => {
        if (event.key === 'Enter' || (event.key === 'Tab' && !event.shiftKey)) {
            event.preventDefault();
            const currentItemRefs = itemFieldRefs.current[itemIndex];
            if (currentFieldType === 'material') currentItemRefs?.quantity?.current?.focus();
            else if (currentFieldType === 'quantity') currentItemRefs?.unitPrice?.current?.focus();
            else if (currentFieldType === 'unitPrice') {
                if (itemIndex === items.length - 1) addNewItemRow();
                else itemFieldRefs.current[itemIndex + 1]?.material?.current?.focus();
            }
        }
    };

    const validateForm = () => { /* ... (existing validation logic is kept, minor tweaks for clarity below) ... */
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

    const handleSubmit = (e) => { /* ... (existing submit logic is largely kept) ... */
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
                obra: parseInt(obraId, 10), data_compra: dataCompra, fornecedor: fornecedor,
                nota_fiscal: notaFiscal || null, desconto: finalDesconto, observacoes: observacoes || null, itens: itemsToSubmit
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-5"> {/* Increased gap */}
                <div>
                    <label htmlFor="dataCompra" className="block mb-1.5 text-sm font-medium text-gray-700">Data da Compra <span className="text-red-500">*</span></label>
                    <input type="date" name="dataCompra" id="dataCompra" value={dataCompra} onChange={handleHeaderChange}
                           className={`w-full px-3 py-2.5 border ${errors.dataCompra ? 'border-red-500 text-red-700' : 'border-slate-300 text-slate-700'} rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm`} />
                    {errors.dataCompra && <p className="mt-1.5 text-xs text-red-600 flex items-center"><WarningIcon /> {errors.dataCompra}</p>}
                </div>
                <div>
                    <label htmlFor="obraId" className="block mb-1.5 text-sm font-medium text-gray-700">Obra <span className="text-red-500">*</span></label>
                    <select name="obraId" id="obraId" value={obraId} onChange={handleHeaderChange}
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
                           className={`w-full px-3 py-2.5 border ${errors.fornecedor ? 'border-red-500 text-red-700' : 'border-slate-300 text-slate-700'} rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm`} />
                    {errors.fornecedor && <p className="mt-1.5 text-xs text-red-600 flex items-center"><WarningIcon /> {errors.fornecedor}</p>}
                </div>
                <div>
                    <label htmlFor="notaFiscal" className="block mb-1.5 text-sm font-medium text-gray-700">Nota Fiscal</label>
                    <input type="text" name="notaFiscal" id="notaFiscal" value={notaFiscal} onChange={handleHeaderChange} placeholder="Número da nota fiscal (opcional)"
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
                <div className="overflow-visible rounded-md shadow-sm border border-slate-200"> {/* Kept overflow-visible for autocomplete */}
                    <div className="overflow-x-auto"> {/* Added inner div for table scroll on small screens */}
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
                                        onItemChange={handleItemChange} onRemoveItem={removeItemRow}
                                        onMaterialSelectForItem={handleMaterialSelected}
                                        totalItems={items.length} errors={errors} initialData={initialData}
                                        onItemKeyDown={handleItemKeyDown}
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
                <div className="grid grid-cols-1 md:grid-cols-3 gap-x-8 gap-y-4"> {/* Changed to 3 cols for summary layout */}
                    <div className="md:col-span-2"> {/* Observacoes takes 2 cols */}
                        <label htmlFor="observacoes" className="block mb-1.5 text-sm font-medium text-gray-700">Observações</label>
                        <textarea
                            name="observacoes" id="observacoes" value={observacoes} onChange={handleHeaderChange}
                            rows="4" placeholder="Notas ou observações sobre a compra (opcional)"
                            className="w-full px-3 py-2.5 border border-slate-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm text-slate-700"
                        ></textarea>
                    </div>
                    <div className="md:col-span-1"> {/* Financial summary takes 1 col */}
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
                        className="py-2.5 px-6 text-sm font-medium text-white bg-primary-600 rounded-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:bg-primary-400 transition-colors">
                    {isLoading ? 'Salvando...' : (initialData && initialData.id ? 'Atualizar Compra' : 'Salvar Compra')}
                </button>
            </div>
        </form>
    );
};

export default CompraForm;
