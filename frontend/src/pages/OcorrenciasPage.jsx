import React, { useState, useEffect, useCallback } from 'react';
import OcorrenciasTable from '../components/tables/OcorrenciasTable';
import OcorrenciaForm from '../components/forms/OcorrenciaForm';
import * as api from '../services/api';

const OcorrenciasPage = () => {
    const [ocorrencias, setOcorrencias] = useState([]);
    const [funcionarios, setFuncionarios] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isLoadingForm, setIsLoadingForm] = useState(false);
    const [error, setError] = useState(null);

    const [showFormModal, setShowFormModal] = useState(false);
    const [currentOcorrencia, setCurrentOcorrencia] = useState(null);

    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [ocorrenciaToDeleteId, setOcorrenciaToDeleteId] = useState(null);

    const fetchAllData = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const [ocorrenciasResponse, funcionariosResponse] = await Promise.all([
                api.getOcorrencias(),
                api.getFuncionarios()
            ]);
            setOcorrencias(ocorrenciasResponse.data || ocorrenciasResponse);
            setFuncionarios(funcionariosResponse.data || funcionariosResponse);
        } catch (err) {
            const errorMessage = err.message || 'Falha ao buscar dados. Tente novamente.';
            setError(errorMessage);
            console.error("Fetch Data Error:", err);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchAllData();
    }, [fetchAllData]);

    const handleAddNew = () => {
        setCurrentOcorrencia(null);
        setError(null);
        setShowFormModal(true);
    };

    const handleEdit = (ocorrencia) => {
        setCurrentOcorrencia(ocorrencia);
        setError(null);
        setShowFormModal(true);
    };

    const handleDelete = (id) => {
        setOcorrenciaToDeleteId(id);
        setShowDeleteConfirm(true);
    };

    const confirmDelete = async () => {
        if (!ocorrenciaToDeleteId) return;
        setIsLoading(true); // Or setIsLoadingForm if preferred for delete action affecting main content
        setError(null);
        try {
            await api.deleteOcorrencia(ocorrenciaToDeleteId);
            setOcorrenciaToDeleteId(null);
            setShowDeleteConfirm(false);
            await fetchAllData(); // Re-fetch all data, or just ocorrencias if funcionarios don't change
        } catch (err) {
            const errorMessage = err.response?.data?.detail || err.message || 'Falha ao excluir ocorrência.';
            setError(errorMessage);
            console.error("Delete Ocorrencia Error:", err.response?.data || err.message);
            if (!showFormModal) setIsLoading(false); // Ensure loading stops if not in form context
        }
        // setIsLoading(false) will be called by fetchAllData if successful
    };

    const handleFormSubmit = async (formData) => {
        setIsLoadingForm(true);
        setError(null);
        try {
            if (currentOcorrencia && currentOcorrencia.id) {
                await api.updateOcorrencia(currentOcorrencia.id, formData);
            } else {
                await api.createOcorrencia(formData);
            }
            setShowFormModal(false);
            setCurrentOcorrencia(null);
            await fetchAllData(); // Re-fetch all data
        } catch (err) {
            const errorMessage = err.response?.data?.detail ||
                               (Array.isArray(err.response?.data) && err.response?.data.map(e => e.msg).join(', ')) ||
                               err.message ||
                               (currentOcorrencia ? 'Falha ao atualizar ocorrência.' : 'Falha ao criar ocorrência.');
            setError(errorMessage);
            console.error("Form Submit Ocorrencia Error:", err.response?.data || err.message);
        } finally {
            setIsLoadingForm(false);
        }
    };

    const handleFormCancel = () => {
        setShowFormModal(false);
        setCurrentOcorrencia(null);
        setError(null);
    };

    return (
        <div className="container mx-auto px-4 py-6">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-semibold text-gray-800">Gestão de Ocorrências</h1>
                <button
                    onClick={handleAddNew}
                    className="bg-primary-600 hover:bg-primary-700 text-white font-semibold py-2 px-4 rounded-lg shadow-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-opacity-75"
                >
                    Adicionar Ocorrência
                </button>
            </div>

            {error && !showFormModal && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
                    <strong className="font-bold">Erro: </strong>
                    <span className="block sm:inline">{error}</span>
                </div>
            )}

            <OcorrenciasTable
                ocorrencias={ocorrencias}
                funcionarios={funcionarios} // Still needed if backend doesn't send populated funcionario names
                onEdit={handleEdit}
                onDelete={handleDelete}
                isLoading={isLoading}
            />

            {/* Form Modal */}
            {showFormModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 transition-opacity duration-300 ease-in-out">
                    <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
                        <h2 className="text-2xl font-semibold mb-4 text-gray-700">
                            {currentOcorrencia ? 'Editar Ocorrência' : 'Adicionar Nova Ocorrência'}
                        </h2>
                        {error && (
                            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
                                <strong className="font-bold">Erro: </strong>
                                <span className="block sm:inline">{error}</span>
                            </div>
                        )}
                        <OcorrenciaForm
                            initialData={currentOcorrencia}
                            funcionarios={funcionarios}
                            onSubmit={handleFormSubmit}
                            onCancel={handleFormCancel}
                            isLoading={isLoadingForm}
                        />
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {showDeleteConfirm && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
                    <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-md">
                        <h2 className="text-xl font-semibold mb-4">Confirmar Exclusão</h2>
                        <p className="mb-6">Tem certeza que deseja excluir esta ocorrência? Esta ação não pode ser desfeita.</p>
                        <div className="flex justify-end space-x-3">
                            <button
                                onClick={() => setShowDeleteConfirm(false)}
                                disabled={isLoading}
                                className="py-2 px-4 text-sm font-medium text-gray-700 bg-white rounded-lg border border-gray-300 hover:bg-gray-100 focus:ring-4 focus:outline-none focus:ring-primary-300"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={confirmDelete}
                                disabled={isLoading}
                                className="py-2 px-4 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 focus:ring-4 focus:outline-none focus:ring-red-300"
                            >
                                {isLoading ? 'Excluindo...' : 'Excluir'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default OcorrenciasPage;
