import React, { useState, useEffect, useCallback, useRef } from 'react';
import * as api from '../../services/api';
import MaterialAutocomplete from './MaterialAutocomplete';

const WarningIcon = ({ className = "w-4 h-4 inline mr-1" }) => (
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

    const isLastAndEmptyNewRow = totalItems <= 1 && !initialData &&
                                 !item.material && !item.quantidade && !item.valorUnitario;

    return (
        <tr className={`${index % 2 === 0 ? 'bg-slate-50' : 'bg-white'} transition-colors duration-150 ease-in-out hover:bg-slate-100`}>
            <td className="px-3 py-2.5 border-b border-slate-200 text-sm min-w-[250px] align-top">
                <MaterialAutocomplete
                    ref={materialRef}
                    value={item.material}
                    onMaterialSelect={onMaterialSelectForItem}
                    itemIndex={index}
                    error={getError('material')}
                    onKeyDown={(e) => onItemKeyDown(e, index, 'material')}
                />
            </td>
            <td className="px-3 py-2.5 border-b border-slate-200 text-sm align-top">
                <input
                    ref={quantityRef}
                    type="text"
                    inputMode="decimal"
                    name="quantidade"
                    value={item.quantidade}
                    onChange={(e) => onItemChange(index, 'quantidade', e.target.value)}
                    onKeyDown={(e) => onItemKeyDown(e, index, 'quantity')}
                    className={`w-24 p-1.5 border ${getError('quantidade') ? 'border-red-500' : 'border-slate-300'} rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 text-sm`}
                    placeholder="0.000"
                />
                {getError('quantidade') && <p className="text-xs text-red-600 mt-1 flex items-center"><WarningIcon className="w-3 h-3 mr-0.5"/>{getError('quantidade')}</p>}
            </td>
            <td className="px-3 py-2.5 border-b border-slate-200 text-sm text-slate-600 align-middle">
                {item.unidadeMedida || 'N/A'}
            </td>
            <td className="px-3 py-2.5 border-b border-slate-200 text-sm align-top">
                <input
                    ref={unitPriceRef}
                    type="text"
                    inputMode="decimal"
                    name="valorUnitario"
                    value={item.valorUnitario}
                    onChange={(e) => onItemChange(index, 'valorUnitario', e.target.value)}
                    onKeyDown={(e) => onItemKeyDown(e, index, 'unitPrice')}
                    className={`w-28 p-1.5 border ${getError('valorUnitario') ? 'border-red-500' : 'border-slate-300'} rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 text-sm`}
                    placeholder="0.00"
                />
                {getError('valorUnitario') && <p className="text-xs text-red-600 mt-1 flex items-center"><WarningIcon className="w-3 h-3 mr-0.5"/>{getError('valorUnitario')}</p>}
            </td>
            <td className="px-3 py-2.5 border-b border-slate-200 text-sm text-slate-800 font-medium align-middle">
                R$ {parseFloat(item.valorTotalItem || 0).toFixed(2).replace('.',',')}
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

    const itemFieldRefs = useRef([]);
    const focusAfterAddRef = useRef(false);

    useEffect(() => {
        itemFieldRefs.current = items.map(
            (_, i) => itemFieldRefs.current[i] || {
                material: React.createRef(),
                quantity: React.createRef(),
                unitPrice: React.createRef(),
            }
        );
    }, [items.length]);

    useEffect(() => {
        if (focusAfterAddRef.current && items.length > 0) {
            const lastItemIndex = items.length - 1;
            setTimeout(() => {
                itemFieldRefs.current[lastItemIndex]?.material?.current?.focus();
            }, 0);
            focusAfterAddRef.current = false;
        }
    }, [items]);


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
            setDesconto(String(initialData.desconto || '0.00').replace(',', '.'));

            const initialItems = initialData.itens?.map(item => ({
                id: item.id || generateItemUniqueId(),
                material: item.material_obj || { id: String(item.material), nome: item.material_nome, unidade_medida: item.unidade_medida },
                materialId: String(item.material) || '',
                materialNome: item.material_nome || (item.material_obj ? item.material_obj.nome : ''),
                quantidade: String(item.quantidade || '').replace(',', '.'),
                unidadeMedida: item.unidade_medida || (item.material_obj ? item.material_obj.unidade_medida : ''),
                valorUnitario: String(item.valor_unitario || '').replace(',', '.'),
                valorTotalItem: String(item.valor_total_item || '0.00').replace(',', '.')
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
        let processedValue = value;
        if (name === 'desconto') {
            processedValue = typeof value === 'string' ? value.replace(',', '.') : value;
        }

        if (name === 'obraId') setObraId(value); // obraId is already string from select
        else if (name === 'dataCompra') setDataCompra(value);
        else if (name === 'fornecedor') setFornecedor(value);
        else if (name === 'notaFiscal') setNotaFiscal(value);
        else if (name === 'observacoes') setObservacoes(value); // observacoes is a string
        else if (name === 'desconto') setDesconto(processedValue);


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

    const handleItemChange = (index, fieldName, rawValue) => {
        const updatedItems = items.map((item, i) => {
            if (i === index) {
                let processedValue = rawValue;
                if (fieldName === 'valorUnitario' || fieldName === 'quantidade') {
                    processedValue = typeof rawValue === 'string' ? rawValue.replace(',', '.') : rawValue;
                }

                const newItem = { ...item, [fieldName]: processedValue };

                if (fieldName === 'quantidade' || fieldName === 'valorUnitario') {
                    const qty = parseFloat(newItem.quantidade) || 0;
                    const price = parseFloat(newItem.valorUnitario) || 0;
                    newItem.valorTotalItem = (qty * price).toFixed(2);
                }

                const errorKey = `item_${index}_${fieldName}`;
                if (errors[errorKey]) {
                    setErrors(prevErrors => {
                        const newErrors = { ...prevErrors };
                        delete newErrors[errorKey];
                        return newErrors;
                    });
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

        const currentDescontoStr = String(desconto); // Ensure 'desconto' is string before replace
        const standardizedDesconto = currentDescontoStr.replace(',', '.');
        if (standardizedDesconto.trim() !== '' && (isNaN(parseFloat(standardizedDesconto)) || parseFloat(standardizedDesconto) < 0)) {
            newErrors.desconto = 'Desconto deve ser um número válido e não negativo.';
        }

        items.forEach((item, index) => {
            if (!item.material && !item.materialId) {
                newErrors[`item_${index}_material`] = 'Material é obrigatório.';
            }
            const standardizedQuantidade = String(item.quantidade).replace(',', '.');
            if (standardizedQuantidade === '' || parseFloat(standardizedQuantidade) <= 0) {
                newErrors[`item_${index}_quantidade`] = 'Quantidade deve ser positiva.';
            }
            const standardizedValorUnitario = String(item.valorUnitario).replace(',', '.');
            if (standardizedValorUnitario === '' || parseFloat(standardizedValorUnitario) < 0) {
                newErrors[`item_${index}_valorUnitario`] = 'Valor unitário deve ser positivo ou zero.';
            }
        });
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (validateForm()) {
            const finalDesconto = parseFloat(String(desconto).replace(',', '.')) || 0;
            const compraData = {
                obra: parseInt(obraId, 10),
                data_compra: dataCompra,
                fornecedor: fornecedor,
                nota_fiscal: notaFiscal || null,
                desconto: finalDesconto,
                observacoes: observacoes || null,
                itens: items
                    .filter(item =>
                        item.materialId &&
                        String(item.quantidade).replace(',', '.') !== '' && parseFloat(String(item.quantidade).replace(',', '.')) > 0 &&
                        String(item.valorUnitario).replace(',', '.') !== '' && parseFloat(String(item.valorUnitario).replace(',', '.')) >= 0
                    )
                    .map(item => ({
                        material: parseInt(item.materialId, 10),
                        quantidade: parseFloat(String(item.quantidade).replace(',', '.')),
                        valor_unitario: parseFloat(String(item.valorUnitario).replace(',', '.'))
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

    // Calculate Subtotal and Total Geral
    const subtotalCalculado = items.reduce((sum, item) => {
        const valorTotal = parseFloat(String(item.valorTotalItem).replace(',', '.')) || 0;
        return sum + valorTotal;
    }, 0);

    const descontoNumerico = parseFloat(String(desconto).replace(',', '.')) || 0;
    const totalGeralCalculado = subtotalCalculado - descontoNumerico;

    return (
        <form onSubmit={handleSubmit} className="w-full max-w-5xl mx-auto p-6 md:p-8 space-y-6 bg-white rounded-lg shadow-xl">
            <h2 className="text-2xl font-semibold text-gray-700 mb-6 border-b pb-3">Informações da Compra</h2>
            {/* Header Section ... */}
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

            {/* Dynamic Item Table Section ... */}
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
                                    key={item.id} item={item} index={index}
                                    onItemChange={handleItemChange}
                                    onRemoveItem={removeItemRow}
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
                 {items.length === 0 && (
                    <p className="text-sm text-center text-gray-500 py-4">Nenhum item adicionado. Clique em "Adicionar Novo Item".</p>
                )}
            </div>

            {/* Footer and Summary Section */}
            <div className="mt-8 pt-6 border-t border-slate-300">
                <h3 className="text-xl font-semibold text-gray-700 mb-4">Resumo da Compra</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                    <div className="md:col-span-2">
                        <label htmlFor="observacoes" className="block mb-1 text-sm font-medium text-gray-700">Observações</label>
                        <textarea
                            name="observacoes" id="observacoes" value={observacoes}
                            onChange={handleHeaderChange}
                            rows="3" placeholder="Notas ou observações sobre a compra (opcional)"
                            className="w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                        ></textarea>
                    </div>
                </div>

                <div className="mt-6 bg-slate-50 p-4 rounded-lg shadow">
                    <div className="space-y-2">
                        <div className="flex justify-between items-center text-sm">
                            <span className="text-slate-600">Subtotal dos Itens:</span>
                            <span className="font-semibold text-slate-800">R$ {subtotalCalculado.toFixed(2).replace('.', ',')}</span>
                        </div>

                        <div className="flex justify-between items-center text-sm">
                            <label htmlFor="desconto" className="text-slate-600">Desconto (R$):</label>
                            <input
                                type="text" inputMode="decimal" name="desconto" id="desconto"
                                value={desconto}
                                onChange={handleHeaderChange}
                                placeholder="0,00"
                                className={`w-28 p-1.5 border ${errors.desconto ? 'border-red-500' : 'border-slate-300'} rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 text-sm text-right`}
                            />
                        </div>
                        {errors.desconto && <p className="text-xs text-red-600 text-right -mt-1 mb-1">{errors.desconto}</p>}

                        <div className="flex justify-between items-center text-lg font-semibold border-t border-slate-300 pt-2 mt-2">
                            <span className="text-gray-700">Total Geral:</span>
                            <span className="text-primary-600">R$ {totalGeralCalculado.toFixed(2).replace('.', ',')}</span>
                        </div>
                    </div>
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
