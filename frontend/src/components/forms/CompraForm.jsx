import React, { useState, useEffect, useCallback, useRef } from 'react';
import * as api from '../../services/api';
import MaterialAutocomplete from './MaterialAutocomplete';

const WarningIcon = ({ className = "w-4 h-4 inline mr-1" }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.216 3.031-1.742 3.031H4.42c-1.526 0-2.492-1.697-1.742-3.031l5.58-9.92zM10 13a1 1 0 110-2 1 1 0 010 2zm-1.75-4.5a1.75 1.75 0 00-3.5 0v.25h3.5v-.25z" clipRule="evenodd" /></svg>
);

let itemUniqueIdCounter = 0;
const generateItemUniqueId = () => `temp-item-${itemUniqueIdCounter++}`;

// ItemRow Sub-Component Definition
const ItemRow = ({
    item, index, onItemChange, onRemoveItem, totalItems, errors,
    onMaterialSelectForItem, initialData,
    onItemKeyDown,
    materialRef, // Changed from materialInputRef to materialRef for clarity
    quantityRef, // Changed from quantityInputRef to quantityRef
    unitPriceRef   // Changed from unitPriceInputRef to unitPriceRef
}) => {
    const getError = (fieldName) => errors && errors[`item_${index}_${fieldName}`];

    const isLastAndEmptyNewRow = totalItems <= 1 && !initialData &&
                                 !item.material && !item.quantidade && !item.valorUnitario;

    return (
        <tr className={`${index % 2 === 0 ? 'bg-slate-50' : 'bg-white'} transition-colors duration-150 ease-in-out hover:bg-slate-100`}>
            <td className="px-3 py-2.5 border-b border-slate-200 text-sm min-w-[250px] align-top">
                <MaterialAutocomplete
                    ref={materialRef} // Use the passed ref
                    value={item.material}
                    onMaterialSelect={onMaterialSelectForItem}
                    itemIndex={index}
                    error={getError('material')}
                    onKeyDown={(e) => onItemKeyDown(e, index, 'material')}
                />
            </td>
            <td className="px-3 py-2.5 border-b border-slate-200 text-sm align-top">
                <input
                    ref={quantityRef} // Use the passed ref
                    type="number"
                    name="quantidade"
                    value={item.quantidade}
                    onChange={(e) => onItemChange(index, 'quantidade', e.target.value)}
                    onKeyDown={(e) => onItemKeyDown(e, index, 'quantity')}
                    className={`w-24 p-1.5 border ${getError('quantidade') ? 'border-red-500' : 'border-slate-300'} rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 text-sm`}
                    placeholder="0.000" step="0.001" min="0"
                />
                {getError('quantidade') && <p className="text-xs text-red-600 mt-1 flex items-center"><WarningIcon className="w-3 h-3 mr-0.5"/>{getError('quantidade')}</p>}
            </td>
            <td className="px-3 py-2.5 border-b border-slate-200 text-sm text-slate-600 align-middle">
                {item.unidadeMedida || 'N/A'}
            </td>
            <td className="px-3 py-2.5 border-b border-slate-200 text-sm align-top">
                <input
                    ref={unitPriceRef} // Use the passed ref
                    type="number"
                    name="valorUnitario"
                    value={item.valorUnitario}
                    onChange={(e) => onItemChange(index, 'valorUnitario', e.target.value)}
                    onKeyDown={(e) => onItemKeyDown(e, index, 'unitPrice')}
                    className={`w-28 p-1.5 border ${getError('valorUnitario') ? 'border-red-500' : 'border-slate-300'} rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 text-sm`}
                    placeholder="0.00" step="0.01" min="0"
                />
                {getError('valorUnitario') && <p className="text-xs text-red-600 mt-1 flex items-center"><WarningIcon className="w-3 h-3 mr-0.5"/>{getError('valorUnitario')}</p>}
            </td>
            <td className="px-3 py-2.5 border-b border-slate-200 text-sm text-slate-800 font-medium align-middle">
                R$ {parseFloat(item.valorTotalItem || 0).toFixed(2)}
            </td>
            <td className="px-3 py-2.5 border-b border-slate-200 text-center align-middle">
                <button type="button" onClick={() => onRemoveItem(index)}
                        className="text-red-500 hover:text-red-700 disabled:text-slate-300 disabled:cursor-not-allowed text-sm p-1 focus:outline-none focus:ring-2 focus:ring-red-300 focus:ring-opacity-50 rounded-md"
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

    const itemFieldRefs = useRef([]); // Stores refs for [material, quantity, unitPrice] per item
    const focusAfterAddRef = useRef(false);

    useEffect(() => {
        // Ensure itemFieldRefs array has a ref object for each item
        itemFieldRefs.current = items.map(
            (_, i) => itemFieldRefs.current[i] || {
                material: React.createRef(),
                quantity: React.createRef(),
                unitPrice: React.createRef(),
            }
        );
    }, [items.length]); // Only re-run if the number of items changes

    useEffect(() => {
        if (focusAfterAddRef.current && items.length > 0) {
            const lastItemIndex = items.length - 1;
            setTimeout(() => { // Use setTimeout to ensure DOM is updated
                itemFieldRefs.current[lastItemIndex]?.material?.current?.focus();
            }, 0);
            focusAfterAddRef.current = false;
        }
    }, [items]); // Depend on items state to catch new row addition


    useEffect(() => {
        const fetchObras = async () => {
            try {
                const response = await api.getObras();
                setObras(response.data || response || []);
            } catch (error) {
                console.error('Error fetching obras:', error);
                setObras([]);
            }
        };
        fetchObras();
    }, []);

    const createNewEmptyItem = () => ({
        id: generateItemUniqueId(),
        material: null, materialId: '', materialNome: '',
        quantidade: '', unidadeMedida: '', valorUnitario: '', valorTotalItem: '0.00'
    });

    useEffect(() => {
        itemUniqueIdCounter = 0;
        if (initialData) {
            setObraId(String(initialData.obra_id || initialData.obra || ''));
            setDataCompra(initialData.data_compra ? new Date(initialData.data_compra).toISOString().split('T')[0] : '');
            setFornecedor(initialData.fornecedor || '');
            setNotaFiscal(initialData.nota_fiscal || '');
            setObservacoes(initialData.observacoes || '');
            setDesconto(String(initialData.desconto || '0.00'));

            const initialItems = initialData.itens?.map(item => ({
                id: item.id || generateItemUniqueId(),
                material: item.material_obj || { id: String(item.material), nome: item.material_nome, unidade_medida: item.unidade_medida },
                materialId: String(item.material) || '',
                materialNome: item.material_nome || (item.material_obj ? item.material_obj.nome : ''),
                quantidade: String(item.quantidade || ''),
                unidadeMedida: item.unidade_medida || (item.material_obj ? item.material_obj.unidade_medida : ''),
                valorUnitario: String(item.valor_unitario || ''),
                valorTotalItem: String(item.valor_total_item || '0.00')
            })) || [];

            setItems(initialItems.length > 0 ? initialItems : [createNewEmptyItem()]);
        } else {
            setObraId('');
            setDataCompra(new Date().toISOString().split('T')[0]);
            setFornecedor('');
            setNotaFiscal('');
            setObservacoes('');
            setDesconto('0.00');
            setItems([createNewEmptyItem()]);
        }
        setErrors({});
    }, [initialData]);

    const handleHeaderChange = (e) => {
        const { name, value } = e.target;
        if (name === 'obraId') setObraId(value);
        else if (name === 'dataCompra') setDataCompra(value);
        else if (name === 'fornecedor') setFornecedor(value);
        else if (name === 'notaFiscal') setNotaFiscal(value);
        else if (name === 'observacoes') setObservacoes(value);
        else if (name === 'desconto') setDesconto(value);

        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: null }));
        }
    };

    const handleMaterialSelected = (index, selectedMaterialObj) => {
        const updatedItems = items.map((item, i) => {
            if (i === index) {
                const errorKey = `item_${index}_material`;
                setErrors(prev => ({...prev, [errorKey]: null}));
                if (selectedMaterialObj) {
                    return {
                        ...item,
                        material: selectedMaterialObj,
                        materialId: String(selectedMaterialObj.id),
                        materialNome: selectedMaterialObj.nome,
                        unidadeMedida: selectedMaterialObj.unidade_medida,
                    };
                } else {
                    return {
                        ...item,
                        material: null, materialId: '', materialNome: '', unidadeMedida: '',
                    };
                }
            }
            return item;
        });
        setItems(updatedItems);
        setTimeout(() => itemFieldRefs.current[index]?.quantity?.current?.focus(), 0);
    };

    const handleItemChange = (index, fieldName, value) => {
        const updatedItems = items.map((item, i) => {
            if (i === index) {
                const newItem = { ...item, [fieldName]: value };
                if (fieldName === 'quantidade' || fieldName === 'valorUnitario') {
                    const qty = parseFloat(newItem.quantidade) || 0;
                    const price = parseFloat(newItem.valorUnitario) || 0;
                    newItem.valorTotalItem = (qty * price).toFixed(2);
                }
                const errorKey = `item_${index}_${fieldName}`;
                if(errors[errorKey]) {
                    setErrors(prev => ({...prev, [errorKey]: null}));
                }
                return newItem;
            }
            return item;
        });
        setItems(updatedItems);
    };

    const addNewItemRow = () => {
        setItems(prevItems => [...prevItems, createNewEmptyItem()]);
        focusAfterAddRef.current = true;
    };

    const removeItemRow = (index) => {
        const itemToRemove = items[index];
        const isNewRowOnly = items.length <= 1 && !initialData &&
                             !itemToRemove.material && !itemToRemove.quantidade && !itemToRemove.valorUnitario;
        if (isNewRowOnly && itemToRemove.id?.toString().startsWith('temp-item-')) {
            return;
        }
        setItems(items.filter((_, i) => i !== index));
    };

    const handleItemKeyDown = (event, itemIndex, currentFieldType) => {
        if (event.key === 'Enter' || (event.key === 'Tab' && !event.shiftKey)) {
            event.preventDefault();
            const currentItemRefs = itemFieldRefs.current[itemIndex];

            if (currentFieldType === 'material') {
                currentItemRefs?.quantity?.current?.focus();
            } else if (currentFieldType === 'quantity') {
                currentItemRefs?.unitPrice?.current?.focus();
            } else if (currentFieldType === 'unitPrice') {
                if (itemIndex === items.length - 1) {
                    addNewItemRow();
                } else {
                    itemFieldRefs.current[itemIndex + 1]?.material?.current?.focus();
                }
            }
        }
    };

    const validateForm = () => {
        const newErrors = {};
        if (!obraId) newErrors.obraId = 'Obra é obrigatória.';
        if (!dataCompra) newErrors.dataCompra = 'Data da compra é obrigatória.';
        const parsedDesconto = parseFloat(desconto);
        if (isNaN(parsedDesconto) || parsedDesconto < 0) {
            newErrors.desconto = 'Desconto deve ser um número positivo ou zero.';
        }
        items.forEach((item, index) => {
            if (!item.material && !item.materialId) {
                newErrors[`item_${index}_material`] = 'Material é obrigatório.';
            }
            if (item.quantidade === '' || parseFloat(item.quantidade) <= 0) {
                newErrors[`item_${index}_quantidade`] = 'Quantidade deve ser positiva.';
            }
            if (item.valorUnitario === '' || parseFloat(item.valorUnitario) < 0) {
                newErrors[`item_${index}_valorUnitario`] = 'Valor unitário deve ser positivo ou zero.';
            }
        });
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (validateForm()) {
            const compraData = {
                obra: parseInt(obraId, 10),
                data_compra: dataCompra,
                fornecedor: fornecedor,
                nota_fiscal: notaFiscal || null,
                desconto: parseFloat(desconto) || 0,
                observacoes: observacoes || null,
                itens: items.filter(item => item.materialId && item.quantidade && item.valorUnitario)
                           .map(item => ({
                    material: parseInt(item.materialId, 10),
                    quantidade: parseFloat(item.quantidade),
                    valor_unitario: parseFloat(item.valorUnitario)
                }))
            };
            if (compraData.itens.length === 0 && items.length > 0 && items.some(i => i.materialId || i.quantidade || i.valorUnitario)) {
                setErrors(prev => ({...prev, form: "Preencha os itens corretamente ou remova linhas desnecessárias."}));
                return;
            }
            if (compraData.itens.length === 0 && items.length === 0 && !initialData) {
                setErrors(prev => ({...prev, form: "Uma compra deve ter pelo menos um item."}));
                return;
            }
            onSubmit(compraData);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="w-full max-w-5xl mx-auto p-6 md:p-8 space-y-6 bg-white rounded-lg shadow-xl">
            <h2 className="text-2xl font-semibold text-gray-700 mb-6 border-b pb-3">Informações da Compra</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                <div>
                    <label htmlFor="dataCompra" className="block mb-1 text-sm font-medium text-gray-700">Data da Compra <span className="text-red-500">*</span></label>
                    <input type="date" name="dataCompra" id="dataCompra" value={dataCompra} onChange={handleHeaderChange}
                           className={`w-full px-3 py-2 border ${errors.dataCompra ? 'border-red-500' : 'border-gray-300'} rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm`}/>
                    {errors.dataCompra && <p className="mt-1 text-xs text-red-600 flex items-center"><WarningIcon className="w-3 h-3 mr-1"/> {errors.dataCompra}</p>}
                </div>
                <div>
                    <label htmlFor="obraId" className="block mb-1 text-sm font-medium text-gray-700">Obra <span className="text-red-500">*</span></label>
                    <select name="obraId" id="obraId" value={obraId} onChange={handleHeaderChange}
                            className={`w-full px-3 py-2 border ${errors.obraId ? 'border-red-500' : 'border-gray-300'} rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm`}>
                        <option value="">Selecione a Obra</option>
                        {Array.isArray(obras) && obras.map((obra) => (
                            <option key={obra.id} value={obra.id}>{obra.nome_obra}</option>
                        ))}
                    </select>
                    {errors.obraId && <p className="mt-1 text-xs text-red-600 flex items-center"><WarningIcon className="w-3 h-3 mr-1"/> {errors.obraId}</p>}
                </div>
                <div>
                    <label htmlFor="fornecedor" className="block mb-1 text-sm font-medium text-gray-700">Fornecedor</label>
                    <input type="text" name="fornecedor" id="fornecedor" value={fornecedor} onChange={handleHeaderChange} placeholder="Nome do fornecedor"
                           className={`w-full px-3 py-2 border ${errors.fornecedor ? 'border-red-500' : 'border-gray-300'} rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm`}/>
                    {errors.fornecedor && <p className="mt-1 text-xs text-red-600 flex items-center"><WarningIcon className="w-3 h-3 mr-1"/> {errors.fornecedor}</p>}
                </div>
                <div>
                    <label htmlFor="notaFiscal" className="block mb-1 text-sm font-medium text-gray-700">Nota Fiscal</label>
                    <input type="text" name="notaFiscal" id="notaFiscal" value={notaFiscal} onChange={handleHeaderChange} placeholder="Número da nota fiscal (opcional)"
                           className={`w-full px-3 py-2 border ${errors.notaFiscal ? 'border-red-500' : 'border-gray-300'} rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm`}/>
                    {errors.notaFiscal && <p className="mt-1 text-xs text-red-600 flex items-center"><WarningIcon className="w-3 h-3 mr-1"/> {errors.notaFiscal}</p>}
                </div>
            </div>

            <div className="mt-8 pt-6 border-t">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-semibold text-gray-700">Itens da Compra</h3>
                    <button type="button" onClick={addNewItemRow}
                            className="py-2 px-4 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
                            disabled={isLoading}>
                        Adicionar Novo Item
                    </button>
                </div>
                <div className="overflow-visible rounded-md shadow-sm border border-slate-200">
                    <table className="min-w-full divide-y divide-slate-200">
                        <thead className="bg-slate-100">
                            <tr>
                                <th scope="col" className="px-3 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider min-w-[250px]">Material</th>
                                <th scope="col" className="px-3 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Qtd.</th>
                                <th scope="col" className="px-3 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Un.</th>
                                <th scope="col" className="px-3 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Val. Unit. (R$)</th>
                                <th scope="col" className="px-3 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Val. Total (R$)</th>
                                <th scope="col" className="px-3 py-3 text-center text-xs font-semibold text-slate-600 uppercase tracking-wider">Ação</th>
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
                                    materialRef={itemFieldRefs.current[index]?.material}
                                    quantityRef={itemFieldRefs.current[index]?.quantity}
                                    unitPriceRef={itemFieldRefs.current[index]?.unitPrice}
                                />
                            ))}
                        </tbody>
                    </table>
                </div>
                 {items.length === 0 && (
                    <p className="text-sm text-center text-gray-500 py-4">Nenhum item adicionado. Clique em "Adicionar Novo Item".</p>
                )}
            </div>

            <div className="mt-8 pt-6 border-t">
                <h3 className="text-xl font-semibold text-gray-700 mb-4">Resumo da Compra</h3>
                <div className="p-4 border border-dashed border-gray-300 rounded-md min-h-[50px]">
                     <p className="text-sm text-gray-500">
                        A seção de resumo (Subtotal, Desconto, Total Geral, Observações) será implementada aqui.
                    </p>
                    <div>Desconto Atual (state): {desconto}</div>
                    <div>Observações Atuais (state): {observacoes}</div>
                </div>
            </div>

            {errors.form && (
                 <div className="mt-4 p-3 bg-red-50 border border-red-300 rounded-md text-sm text-red-700">
                    <p>{errors.form}</p>
                </div>
            )}

            <div className="flex justify-end space-x-4 pt-6 mt-6 border-t">
                <button type="button" onClick={onCancel} disabled={isLoading}
                        className="py-2 px-5 text-sm font-medium text-gray-700 bg-white rounded-md border border-gray-300 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-70">
                    Cancelar
                </button>
                <button type="submit" disabled={isLoading}
                        className="py-2 px-5 text-sm font-medium text-white bg-primary-600 rounded-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:bg-primary-300">
                    {isLoading ? 'Salvando...' : 'Salvar Compra'}
                </button>
            </div>
        </form>
    );
};

export default CompraForm;
