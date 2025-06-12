import React, { useState, useEffect, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import ComprasTable from '../components/tables/ComprasTable';
import CompraForm from '../components/forms/CompraForm';
import * as api from '../services/api';

// Icon for alerts
const AlertIcon = ({ type = 'error', className = "w-5 h-5 mr-2" }) => {
    const iconPaths = {
        error: "M10 18a8 8 0 100-16 8 8 0 000 16zm-1-5.006V7h2v6h-2zm0 3.002V14h2v2h-2z", // Circle with exclamation
        success: "M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" // Circle with check
    };
    return (
        <svg className={className} fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
            <path fillRule="evenodd" d={iconPaths[type]} clipRule="evenodd" />
        </svg>
    );
};


const ComprasPage = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const [compras, setCompras] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isLoadingForm, setIsLoadingForm] = useState(false);
    const [error, setError] = useState(null);
    const [successMessage, setSuccessMessage] = useState('');

    const [isAddingNew, setIsAddingNew] = useState(false);
    const [currentCompra, setCurrentCompra] = useState(null);

    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [compraToDeleteId, setCompraToDeleteId] = useState(null);

    const fetchCompras = useCallback(async () => {
        setIsLoading(true);
        try {
            const response = await api.getCompras();
            setCompras(response.data || response);
        } catch (err) {
            setError(err.message || 'Falha ao buscar compras. Tente novamente.');
            console.error("Fetch Compras Error:", err);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        if (!currentCompra && !isAddingNew) {
            fetchCompras();
        }
    }, [fetchCompras, currentCompra, isAddingNew]);

    useEffect(() => {
        const obraIdFromState = location.state?.obraIdParaNovaCompra;
        if (obraIdFromState && !currentCompra && !isAddingNew) {
            setCurrentCompra({ obra: obraIdFromState });
            setIsAddingNew(true);
            setError(null);
            setSuccessMessage('');
            navigate(location.pathname, { replace: true, state: {} });
        }
    }, [location.state, navigate, currentCompra, isAddingNew]);


    const handleAddNewCompraClick = () => {
        setCurrentCompra(null);
        setIsAddingNew(true);
        setError(null);
        setSuccessMessage('');
    };

    const handleEditCompra = async (compraSummary) => {
        setIsLoadingForm(true);
        setError(null);
        setSuccessMessage('');
        try {
            const response = await api.getCompraById(compraSummary.id);
            const fullCompraData = response.data || response;
            if (fullCompraData.obra && typeof fullCompraData.obra === 'object' && fullCompraData.obra.id) {
                setCurrentCompra({ ...fullCompraData, obra: fullCompraData.obra.id });
            } else {
                setCurrentCompra(fullCompraData);
            }
            setIsAddingNew(false);
        } catch (err) {
            console.error("Error fetching compra details for edit:", err);
            setError(err.message || `Falha ao buscar detalhes da compra ID ${compraSummary.id}.`);
        } finally {
            setIsLoadingForm(false);
        }
    };

    const handleDeleteCompra = (id) => {
        setCompraToDeleteId(id);
        setShowDeleteConfirm(true);
    };

    const confirmDeleteCompra = async () => {
        if (!compraToDeleteId) return;
        setIsLoading(true);
        setError(null);
        setSuccessMessage('');
        try {
            await api.deleteCompra(compraToDeleteId);
            setSuccessMessage('Compra excluída com sucesso!');
            setCompraToDeleteId(null);
            setShowDeleteConfirm(false);
            await fetchCompras();
        } catch (err) {
            setError(err.message || 'Falha ao excluir compra.');
            console.error("Delete Compra Error:", err);
        } finally {
            setIsLoading(false);
        }
    };

    const handleFormSubmit = async (formData) => {
        setIsLoadingForm(true);
        setError(null);
        setSuccessMessage('');
        try {
            if (currentCompra && currentCompra.id) {
                await api.updateCompra(currentCompra.id, formData);
                setSuccessMessage('Compra atualizada com sucesso!');
            } else {
                await api.createCompra(formData);
                setSuccessMessage('Compra registrada com sucesso!');
            }
            setCurrentCompra(null);
            setIsAddingNew(false);
            await fetchCompras();
        } catch (err) {
            let detailedError = (currentCompra && currentCompra.id) ? 'Falha ao atualizar compra.' : 'Falha ao criar compra.';
            if (err.response && err.response.data) {
                const errorData = err.response.data; const messages = [];
                if (errorData.non_field_errors) messages.push(errorData.non_field_errors.join(' '));
                for (const key in errorData) {
                    if (key !== 'non_field_errors' && Array.isArray(errorData[key])) messages.push(`${key}: ${errorData[key].join(' ')}`);
                    else if (key !== 'non_field_errors' && typeof errorData[key] === 'string') messages.push(`${key}: ${errorData[key]}`);
                    else if (errorData.detail && typeof errorData.detail === 'string') messages.push(errorData.detail);
                }
                if (Array.isArray(errorData)) errorData.forEach(e => messages.push(e.loc ? `${e.loc.join('.')}: ${e.msg}`: (e.detail || JSON.stringify(e)) ));
                if (messages.length > 0) detailedError = messages.join('; ');
                else if (typeof errorData === 'string') detailedError = errorData;
                else if (err.response.statusText && messages.length === 0) detailedError = `${err.response.status}: ${err.response.statusText}`;
            } else if (err.message) detailedError = err.message;
            setError(detailedError);
        } finally {
            setIsLoadingForm(false);
        }
    };

    const handleFormCancel = () => {
        setCurrentCompra(null); setIsAddingNew(false); setError(null); setSuccessMessage('');
    };

    let formInitialData = null;
    if (isAddingNew) formInitialData = currentCompra;
    else if (currentCompra) formInitialData = currentCompra;

    return (
        <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8"> {/* Increased py */}
            { (currentCompra || isAddingNew) ? (
                <>
                    <h1 className="text-2xl font-semibold text-gray-900 mb-6">
                        {currentCompra && currentCompra.id ? 'Editar Compra' : 'Registrar Nova Compra'}
                    </h1>
                    {error && (
                        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 px-4 py-3 rounded-md relative mb-5 flex items-center" role="alert">
                            <AlertIcon type="error" />
                            <div>
                                <strong className="font-bold">Erro: </strong>
                                <span className="block sm:inline">{error}</span>
                            </div>
                        </div>
                    )}
                    <CompraForm
                        key={currentCompra ? currentCompra.id : 'new-compra'}
                        initialData={formInitialData}
                        onSubmit={handleFormSubmit}
                        onCancel={handleFormCancel}
                        isLoading={isLoadingForm}
                    />
                </>
            ) : (
                <>
                    <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
                        <h1 className="text-2xl font-semibold text-gray-900">Gestão de Compras</h1>
                        <button
                            onClick={handleAddNewCompraClick}
                            className="bg-primary-600 hover:bg-primary-700 text-white font-semibold py-2.5 px-5 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors"
                        >
                            Adicionar Compra
                        </button>
                    </div>
                    {successMessage && (
                        <div className="bg-green-100 border-l-4 border-green-500 text-green-700 px-4 py-3 rounded-md relative mb-5 flex items-center" role="alert">
                            <AlertIcon type="success" />
                            <div>
                                <strong className="font-bold">Sucesso! </strong>
                                <span className="block sm:inline">{successMessage}</span>
                            </div>
                        </div>
                    )}
                    {error && (
                        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 px-4 py-3 rounded-md relative mb-5 flex items-center" role="alert">
                            <AlertIcon type="error" />
                            <div>
                                <strong className="font-bold">Erro: </strong>
                                <span className="block sm:inline">{error}</span>
                            </div>
                        </div>
                    )}
                    <ComprasTable
                        compras={compras}
                        onEdit={handleEditCompra}
                        onDelete={handleDeleteCompra}
                        isLoading={isLoading}
                    />
                </>
            )}

            {showDeleteConfirm && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60 backdrop-blur-sm p-4">
                    <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-md">
                        <h2 className="text-xl font-semibold text-gray-800 mb-5">Confirmar Exclusão</h2>
                        <p className="mb-6 text-gray-600">Tem certeza que deseja excluir esta compra? Esta ação não pode ser desfeita.</p>
                        <div className="flex justify-end space-x-4">
                            <button
                                onClick={() => setShowDeleteConfirm(false)}
                                disabled={isLoading}
                                className="py-2.5 px-5 text-sm font-medium text-gray-700 bg-slate-100 rounded-md border border-slate-300 hover:bg-slate-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-400 disabled:opacity-60 transition-colors"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={confirmDeleteCompra}
                                disabled={isLoading}
                                className="py-2.5 px-5 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:bg-red-400 transition-colors"
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
