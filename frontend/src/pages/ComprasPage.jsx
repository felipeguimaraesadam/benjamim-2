import React, { useState, useEffect, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom'; // Added useLocation and useNavigate
import ComprasTable from '../components/tables/ComprasTable';
import CompraForm from '../components/forms/CompraForm';
import * as api from '../services/api'; // Import all functions from api.js

const ComprasPage = () => {
    const location = useLocation(); // Hook to access location state
    const navigate = useNavigate(); // Hook to navigate and modify state
    const [compras, setCompras] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isLoadingForm, setIsLoadingForm] = useState(false);
    const [error, setError] = useState(null);

    const [showFormModal, setShowFormModal] = useState(false);
    const [currentCompra, setCurrentCompra] = useState(null); // For editing or null for new

    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [compraToDeleteId, setCompraToDeleteId] = useState(null);

    const fetchCompras = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const response = await api.getCompras();
            // Assuming API returns { data: [...] } or just [...]
            // Adjust if your API returns data directly or wrapped in a 'data' property like ObrasPage
            setCompras(response.data || response);
        } catch (err) {
            setError(err.message || 'Falha ao buscar compras. Tente novamente.');
            console.error("Fetch Compras Error:", err);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchCompras();
    }, [fetchCompras]);

    const handleAddNew = () => {
        const obraIdFromState = location.state?.obraIdParaNovaCompra;
        setCurrentCompra(obraIdFromState ? { obra_id: obraIdFromState } : null);
        setError(null); // Clear previous errors
        setShowFormModal(true);
        // Clear location state after using it
        if (obraIdFromState) {
            navigate(location.pathname, { replace: true, state: {} });
        }
    };

    const handleEdit = (compra) => {
        setCurrentCompra(compra);
        setError(null); // Clear previous errors
        setShowFormModal(true);
    };

    const handleDelete = (id) => {
        setCompraToDeleteId(id);
        setShowDeleteConfirm(true);
    };

    const confirmDelete = async () => {
        if (!compraToDeleteId) return;
        setIsLoading(true); // Use main loading for table refresh
        setError(null);
        try {
            await api.deleteCompra(compraToDeleteId);
            setCompraToDeleteId(null);
            setShowDeleteConfirm(false);
            await fetchCompras(); // Re-fetch
        } catch (err) {
            setError(err.message || 'Falha ao excluir compra.');
            console.error("Delete Compra Error:", err);
            // Ensure loading is stopped if delete fails before fetch, otherwise fetchCompras will handle it
            if (!showFormModal) setIsLoading(false);
        }
    };

    const handleFormSubmit = async (formData) => {
        setIsLoadingForm(true);
        setError(null);
        try {
            if (currentCompra && currentCompra.id) {
                await api.updateCompra(currentCompra.id, formData);
            } else {
                await api.createCompra(formData);
            }
            setShowFormModal(false);
            setCurrentCompra(null);
            await fetchCompras(); // Re-fetch
        } catch (err) {
            let detailedError = currentCompra ? 'Falha ao atualizar compra.' : 'Falha ao criar compra.';
            if (err.response && err.response.data) {
                console.error("Compra Form Submission Error Details:", JSON.stringify(err.response.data, null, 2));
                const errorData = err.response.data;
                const messages = [];
                // Standard DRF errors are often field-based, e.g., { field_name: ["error message"] }
                // Or non_field_errors: ["global error"]
                if (errorData.non_field_errors) {
                    messages.push(errorData.non_field_errors.join(' '));
                }
                for (const key in errorData) {
                    if (key !== 'non_field_errors' && Array.isArray(errorData[key])) {
                        messages.push(`${key}: ${errorData[key].join(' ')}`);
                    } else if (key !== 'non_field_errors' && typeof errorData[key] === 'string') {
                         messages.push(`${key}: ${errorData[key]}`);
                    }
                }
                // Handle cases where errorData is a list of errors (e.g. FastAPI)
                if (Array.isArray(errorData)) {
                    errorData.forEach(e => {
                        if (e.msg && e.loc) {
                            messages.push(`${e.loc.join('.')}: ${e.msg}`);
                        } else if (typeof e === 'string') {
                            messages.push(e);
                        }
                    });
                }

                if (messages.length > 0) {
                    detailedError = messages.join('; ');
                } else if (typeof errorData === 'string') { // Fallback for simple string error
                    detailedError = errorData;
                } else if (err.response.statusText && messages.length === 0) { // Use status text if no specific message
                    detailedError = `${err.response.status}: ${err.response.statusText}`;
                }
            } else {
                console.error("Compra Form Submission Error (No response data):", err.message || err);
                if (err.message) {
                    detailedError = err.message;
                }
            }
            setError(detailedError);
            // Keep form open on error so user can see/correct
        } finally {
            setIsLoadingForm(false);
        }
    };

    const handleFormCancel = () => {
        setShowFormModal(false);
        setCurrentCompra(null);
        setError(null); // Clear form-specific errors
    };

    return (
        <div className="container mx-auto px-4 py-6">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold text-gray-800">Gestão de Compras de Material</h1>
                <button
                    onClick={handleAddNew}
                    className="bg-primary-600 hover:bg-primary-700 text-white font-medium py-2 px-4 rounded-md focus:outline-none focus:ring-4 focus:ring-primary-300 disabled:bg-primary-300"
                >
                    Adicionar Compra
                </button>
            </div>

            {error && !showFormModal && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
                    <strong className="font-bold">Erro: </strong>
                    <span className="block sm:inline">{error}</span>
                </div>
            )}

            <ComprasTable
                compras={compras}
                onEdit={handleEdit}
                onDelete={handleDelete}
                isLoading={isLoading}
            />

            {/* Form Modal */}
            {showFormModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 transition-opacity duration-300 ease-in-out">
                    <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                        <h2 className="text-lg font-semibold mb-4 text-gray-800">
                            {currentCompra ? 'Editar Compra' : 'Adicionar Nova Compra'}
                        </h2>
                        {error && ( // Display error specific to form submission attempt inside modal
                            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
                                <strong className="font-bold">Erro: </strong>
                                <span className="block sm:inline">{error}</span>
                            </div>
                        )}
                        <CompraForm
                            initialData={currentCompra}
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
                        <p className="mb-6">Tem certeza que deseja excluir esta compra? Esta ação não pode ser desfeita.</p>
                        <div className="flex justify-end space-x-3">
                            <button
                                onClick={() => setShowDeleteConfirm(false)}
                                disabled={isLoading} // Use main isLoading here as delete affects the table
                                className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium py-2 px-4 rounded-md focus:ring-4 focus:outline-none focus:ring-gray-300 disabled:opacity-50"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={confirmDelete}
                                disabled={isLoading} // Use main isLoading
                                className="bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-4 rounded-md focus:ring-4 focus:outline-none focus:ring-red-300 disabled:opacity-50"
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

export default ComprasPage;
