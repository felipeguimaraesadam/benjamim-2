import React, { useState, useEffect } from 'react';

// Warning Icon for validation errors
const WarningIcon = ({ className = "w-4 h-4 inline mr-1" }) => ( // Added className prop with default
  <svg className={className} fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.216 3.031-1.742 3.031H4.42c-1.526 0-2.492-1.697-1.742-3.031l5.58-9.92zM10 13a1 1 0 110-2 1 1 0 010 2zm-1.75-4.5a1.75 1.75 0 00-3.5 0v.25h3.5v-.25z" clipRule="evenodd" />
  </svg>
);

const OcorrenciaForm = ({ initialData, funcionarios, onSubmit, onCancel, isLoading }) => {
    const [formData, setFormData] = useState({
        funcionario_id: '',
        data: '',
        tipo_ocorrencia: 'atraso',
        observacao: '',
    });
    const [errors, setErrors] = useState({});

    const tipoOcorrenciaOptions = [
        { value: 'atraso', label: 'Atraso' },
        { value: 'falta_justificada', label: 'Falta Justificada' },
        { value: 'falta_nao_justificada', label: 'Falta Não Justificada' },
        // Add other types if necessary
    ];

    useEffect(() => {
        if (initialData) {
            setFormData({
                funcionario_id: initialData.funcionario_id || '',
                // Ensure date is in YYYY-MM-DD for the input field
                data: initialData.data ? new Date(initialData.data).toISOString().split('T')[0] : '',
                tipo_ocorrencia: initialData.tipo_ocorrencia || 'atraso',
                observacao: initialData.observacao || '',
            });
        } else {
            setFormData({
                funcionario_id: '',
                data: new Date().toISOString().split('T')[0], // Default to today
                tipo_ocorrencia: 'atraso',
                observacao: '',
            });
        }
        setErrors({}); // Clear errors when initialData changes or form is reset
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
        if (!formData.funcionario_id) newErrors.funcionario_id = 'Funcionário é obrigatório.';
        if (!formData.data) newErrors.data = 'Data é obrigatória.';
        if (!formData.tipo_ocorrencia) newErrors.tipo_ocorrencia = 'Tipo de ocorrência é obrigatório.';
        // Observacao is optional
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (validateForm()) {
            const dataToSubmit = {
                ...formData,
                // Ensure observacao is null if empty, if backend expects this
                observacao: formData.observacao.trim() === '' ? null : formData.observacao,
            };
            onSubmit(dataToSubmit);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4 md:space-y-6">
            <div>
                <label htmlFor="funcionario_id" className="block mb-2 text-sm font-medium text-gray-900">Funcionário <span className="text-red-500">*</span></label>
                <select
                    name="funcionario_id"
                    id="funcionario_id"
                    value={formData.funcionario_id}
                    onChange={handleChange}
                    className={`bg-gray-50 border ${errors.funcionario_id ? 'border-red-500' : 'border-gray-300'} text-gray-900 sm:text-sm rounded-md focus:ring-primary-500 focus:border-primary-500 block w-full px-3 py-2`}
                >
                    <option value="">Selecione o Funcionário</option>
                    {(funcionarios || []).map((funcionario) => (
                        <option key={funcionario.id} value={funcionario.id}>
                            {funcionario.nome}
                        </option>
                    ))}
                </select>
                {errors.funcionario_id && <p className="mt-1 text-sm text-red-600 flex items-center"><WarningIcon /> {errors.funcionario_id}</p>}
            </div>

            <div>
                <label htmlFor="data" className="block mb-2 text-sm font-medium text-gray-900">Data <span className="text-red-500">*</span></label>
                <input
                    type="date"
                    name="data"
                    id="data"
                    value={formData.data}
                    onChange={handleChange}
                    className={`bg-gray-50 border ${errors.data ? 'border-red-500' : 'border-gray-300'} text-gray-900 sm:text-sm rounded-md focus:ring-primary-500 focus:border-primary-500 block w-full px-3 py-2`}
                />
                {errors.data && <p className="mt-1 text-sm text-red-600 flex items-center"><WarningIcon /> {errors.data}</p>}
            </div>

            <div>
                <label htmlFor="tipo_ocorrencia" className="block mb-2 text-sm font-medium text-gray-900">Tipo de Ocorrência <span className="text-red-500">*</span></label>
                <select
                    name="tipo_ocorrencia"
                    id="tipo_ocorrencia"
                    value={formData.tipo_ocorrencia}
                    onChange={handleChange}
                    className={`bg-gray-50 border ${errors.tipo_ocorrencia ? 'border-red-500' : 'border-gray-300'} text-gray-900 sm:text-sm rounded-md focus:ring-primary-500 focus:border-primary-500 block w-full px-3 py-2`}
                >
                    {tipoOcorrenciaOptions.map(option => (
                        <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                </select>
                {errors.tipo_ocorrencia && <p className="mt-1 text-sm text-red-600 flex items-center"><WarningIcon /> {errors.tipo_ocorrencia}</p>}
            </div>

            <div>
                <label htmlFor="observacao" className="block mb-2 text-sm font-medium text-gray-900">Observação</label>
                <textarea
                    name="observacao"
                    id="observacao"
                    rows={3}
                    value={formData.observacao}
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

export default OcorrenciaForm;
