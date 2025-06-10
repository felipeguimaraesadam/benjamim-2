import React, { useState, useEffect } from 'react';
import ComprasTable from '../components/tables/ComprasTable';
import CompraForm from '../components/forms/CompraForm';
import { getCompras, createCompra, updateCompra, deleteCompra } from '../services/api';
import { Button, Modal } from 'react-bootstrap';

const ComprasPage = () => {
    const [compras, setCompras] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [selectedCompra, setSelectedCompra] = useState(null);
    const [isEditing, setIsEditing] = useState(false);

    useEffect(() => {
        fetchCompras();
    }, []);

    const fetchCompras = async () => {
        try {
            const data = await getCompras();
            setCompras(data);
        } catch (error) {
            console.error('Error fetching compras:', error);
        }
    };

    const handleShowModal = (compra = null) => {
        setSelectedCompra(compra);
        setIsEditing(!!compra);
        setShowModal(true);
    };

    const handleCloseModal = () => {
        setShowModal(false);
        setSelectedCompra(null);
        setIsEditing(false);
    };

    const handleSaveCompra = async (compraData) => {
        try {
            if (isEditing) {
                await updateCompra(selectedCompra.id, compraData);
            } else {
                await createCompra(compraData);
            }
            fetchCompras();
            handleCloseModal();
        } catch (error) {
            console.error('Error saving compra:', error);
        }
    };

    const handleDeleteCompra = async (id) => {
        try {
            await deleteCompra(id);
            fetchCompras();
        } catch (error) {
            console.error('Error deleting compra:', error);
        }
    };

    return (
        <div className="container mt-4">
            <h1>Gestão de Compras de Material</h1>
            <Button variant="primary" onClick={() => handleShowModal()} className="mb-3">
                Adicionar Compra
            </Button>
            <ComprasTable
                compras={compras}
                onEdit={(compra) => handleShowModal(compra)}
                onDelete={handleDeleteCompra}
            />
            <Modal show={showModal} onHide={handleCloseModal}>
                <Modal.Header closeButton>
                    <Modal.Title>{isEditing ? 'Editar Compra' : 'Adicionar Compra'}</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <CompraForm
                        initialData={selectedCompra}
                        onSubmit={handleSaveCompra}
                        onCancel={handleCloseModal}
                    />
                </Modal.Body>
            </Modal>
        </div>
    );
};

export default ComprasPage;
