import React, { useState, useEffect } from 'react';
import * as api from '../../services/api';

// Warning Icon for validation errors
const WarningIcon = ({ className = "w-4 h-4 inline mr-1" }) => ( // Added className prop with default
  <svg className={className} fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.216 3.031-1.742 3.031H4.42c-1.526 0-2.492-1.697-1.742-3.031l5.58-9.92zM10 13a1 1 0 110-2 1 1 0 010 2zm-1.75-4.5a1.75 1.75 0 00-3.5 0v.25h3.5v-.25z" clipRule="evenodd" />
  </svg>
);

const CompraForm = ({ initialData, onSubmit, onCancel, isLoading }) => {
    const [formData, setFormData] = useState({
        material_id: '',
        obra_id: '',
        quantidade: '',
        custo_total: '',
        fornecedor: '',
        data_compra: '',
        nota_fiscal: '',
    });
    const [materiais, setMateriais] = useState([]);
    const [obras, setObras] = useState([]);
    const [errors, setErrors] = useState({});

    useEffect(() => {
        const fetchDropdownData = async () => {
            try {
                const materiaisResponse = await api.getMateriais();
                setMateriais(materiaisResponse.data || materiaisResponse); // Adjust based on actual API response structure
            } catch (error) {
                console.error('Error fetching materiais:', error);
                // Optionally set an error state to display to the user
            }
            try {
                const obrasResponse = await api.getObras();
                setObras(obrasResponse.data || obrasResponse); // Adjust based on actual API response structure
            } catch (error) {
                console.error('Error fetching obras:', error);
                // Optionally set an error state to display to the user
            }
        };
        fetchDropdownData();
    }, []);

    useEffect(() => {
        if (initialData) {
            setFormData({
                material_id: initialData.material_id || '',
                obra_id: initialData.obra_id || '',
                quantidade: initialData.quantidade || '',
                custo_total: initialData.custo_total || '',
                fornecedor: initialData.fornecedor || '',
                data_compra: initialData.data_compra ? new Date(initialData.data_compra).toISOString().split('T')[0] : '',
                nota_fiscal: initialData.nota_fiscal || '',
            });
        } else {
            // Reset form for new entry
            setFormData({
                material_id: '',
                obra_id: '',
                quantidade: '',
                custo_total: '',
                fornecedor: '',
                data_compra: '',
                nota_fiscal: '',
            });
        }
        setErrors({}); // Clear errors when initialData changes
    }, [initialData]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: null }));
        }
    };

    const validateForm = () => {
        const newErrors = {};
        if (!formData.material_id) newErrors.material_id = 'Material é obrigatório.';
        if (!formData.obra_id) newErrors.obra_id = 'Obra é obrigatória.';
        if (!formData.quantidade || parseFloat(formData.quantidade) <= 0) newErrors.quantidade = 'Quantidade deve ser um número positivo.';
        if (!formData.custo_total || parseFloat(formData.custo_total) < 0) newErrors.custo_total = 'Custo total deve ser um número positivo ou zero.';
        if (!formData.fornecedor.trim()) newErrors.fornecedor = 'Fornecedor é obrigatório.';
        if (!formData.data_compra) newErrors.data_compra = 'Data da compra é obrigatória.';

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (validateForm()) {
            // Ensure numeric fields are numbers
            const dataToSubmit = {
                ...formData,
                quantidade: parseFloat(formData.quantidade),
                custo_total: parseFloat(formData.custo_total),
                // Backend might expect null for empty optional fields like nota_fiscal
                nota_fiscal: formData.nota_fiscal || null,
            };
            onSubmit(dataToSubmit);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4 md:space-y-6">
            <div>
                <label htmlFor="material_id" className="block mb-2 text-sm font-medium text-gray-900">Material <span className="text-red-500">*</span></label>
                <select
                    name="material_id"
                    id="material_id"
                    value={formData.material_id}
                    onChange={handleChange}
                    className={`bg-gray-50 border ${errors.material_id ? 'border-red-500' : 'border-gray-300'} text-gray-900 sm:text-sm rounded-md focus:ring-primary-500 focus:border-primary-500 block w-full px-3 py-2`}
                >
                    <option value="">Selecione o Material</option>
                    {materiais.map((material) => (
                        <option key={material.id} value={material.id}>
                            {material.nome} ({material.unidade_medida})
                        </option>
                    ))}
                </select>
                {errors.material_id && <p className="mt-1 text-sm text-red-600 flex items-center"><WarningIcon /> {errors.material_id}</p>}
            </div>

            <div>
                <label htmlFor="obra_id" className="block mb-2 text-sm font-medium text-gray-900">Obra <span className="text-red-500">*</span></label>
                <select
                    name="obra_id"
                    id="obra_id"
                    value={formData.obra_id}
                    onChange={handleChange}
                    className={`bg-gray-50 border ${errors.obra_id ? 'border-red-500' : 'border-gray-300'} text-gray-900 sm:text-sm rounded-md focus:ring-primary-500 focus:border-primary-500 block w-full px-3 py-2`}
                >
                    <option value="">Selecione a Obra</option>
                    {obras.map((obra) => (
                        <option key={obra.id} value={obra.id}>
                            {obra.nome_obra}
                        </option>
                    ))}
                </select>
                {errors.obra_id && <p className="mt-1 text-sm text-red-600 flex items-center"><WarningIcon /> {errors.obra_id}</p>}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label htmlFor="quantidade" className="block mb-2 text-sm font-medium text-gray-900">Quantidade <span className="text-red-500">*</span></label>
                    <input
                        type="number"
                        name="quantidade"
                        id="quantidade"
                        value={formData.quantidade}
                        onChange={handleChange}
                        min="0"
                        className={`bg-gray-50 border ${errors.quantidade ? 'border-red-500' : 'border-gray-300'} text-gray-900 sm:text-sm rounded-md focus:ring-primary-500 focus:border-primary-500 block w-full px-3 py-2`}
                    />
                    {errors.quantidade && <p className="mt-1 text-sm text-red-600 flex items-center"><WarningIcon /> {errors.quantidade}</p>}
                </div>
                <div>
                    <label htmlFor="custo_total" className="block mb-2 text-sm font-medium text-gray-900">Custo Total (R$) <span className="text-red-500">*</span></label>
                    <input
                        type="number"
                        name="custo_total"
                        id="custo_total"
                        value={formData.custo_total}
                        onChange={handleChange}
                        min="0"
                        step="0.01"
                        className={`bg-gray-50 border ${errors.custo_total ? 'border-red-500' : 'border-gray-300'} text-gray-900 sm:text-sm rounded-md focus:ring-primary-500 focus:border-primary-500 block w-full px-3 py-2`}
                    />
                    {errors.custo_total && <p className="mt-1 text-sm text-red-600 flex items-center"><WarningIcon /> {errors.custo_total}</p>}
                </div>
            </div>

            <div>
                <label htmlFor="fornecedor" className="block mb-2 text-sm font-medium text-gray-900">Fornecedor <span className="text-red-500">*</span></label>
                <input
                    type="text"
                    name="fornecedor"
                    id="fornecedor"
                    value={formData.fornecedor}
                    onChange={handleChange}
                    className={`bg-gray-50 border ${errors.fornecedor ? 'border-red-500' : 'border-gray-300'} text-gray-900 sm:text-sm rounded-md focus:ring-primary-500 focus:border-primary-500 block w-full px-3 py-2`}
                />
                {errors.fornecedor && <p className="mt-1 text-sm text-red-600 flex items-center"><WarningIcon /> {errors.fornecedor}</p>}
            </div>

            <div>
                <label htmlFor="data_compra" className="block mb-2 text-sm font-medium text-gray-900">Data da Compra <span className="text-red-500">*</span></label>
                <input
                    type="date"
                    name="data_compra"
                    id="data_compra"
                    value={formData.data_compra}
                    onChange={handleChange}
                    className={`bg-gray-50 border ${errors.data_compra ? 'border-red-500' : 'border-gray-300'} text-gray-900 sm:text-sm rounded-md focus:ring-primary-500 focus:border-primary-500 block w-full px-3 py-2`}
                />
                {errors.data_compra && <p className="mt-1 text-sm text-red-600 flex items-center"><WarningIcon /> {errors.data_compra}</p>}
            </div>

            <div>
                <label htmlFor="nota_fiscal" className="block mb-2 text-sm font-medium text-gray-900">Nota Fiscal (Opcional)</label>
                <input
                    type="text"
                    name="nota_fiscal"
                    id="nota_fiscal"
                    value={formData.nota_fiscal}
                    onChange={handleChange}
                    className="bg-gray-50 border border-gray-300 text-gray-900 sm:text-sm rounded-md focus:ring-primary-500 focus:border-primary-500 block w-full px-3 py-2"
                />
            </div>

            <div className="flex items-center justify-end space-x-3 pt-2">
                <button type="button" onClick={onCancel} disabled={isLoading}
                        className="py-2 px-4 text-sm font-medium text-gray-800 bg-gray-200 rounded-md hover:bg-gray-300 focus:ring-4 focus:outline-none focus:ring-gray-300 disabled:opacity-50">
                    Cancelar
                </button>
                <button type="submit" disabled={isLoading}
                        className="py-2 px-4 text-sm font-medium text-white bg-primary-600 rounded-md hover:bg-primary-700 focus:ring-4 focus:outline-none focus:ring-primary-300 disabled:bg-primary-300">
                    {isLoading ? 'Salvando...' : 'Salvar'}
                </button>
            </div>
        </form>
    );
};

export default CompraForm;
