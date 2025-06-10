import React, { useState, useEffect } from 'react';
import OcorrenciasTable from '../components/tables/OcorrenciasTable';
import OcorrenciaForm from '../components/forms/OcorrenciaForm';
import { getOcorrencias, createOcorrencia, updateOcorrencia, deleteOcorrencia, getFuncionarios } from '../services/api';
import { Button, Modal } from 'react-bootstrap';

const OcorrenciasPage = () => {
    const [ocorrencias, setOcorrencias] = useState([]);
    const [funcionarios, setFuncionarios] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [selectedOcorrencia, setSelectedOcorrencia] = useState(null);
    const [isEditing, setIsEditing] = useState(false);

    useEffect(() => {
        fetchOcorrencias();
        fetchFuncionarios();
    }, []);

    const fetchOcorrencias = async () => {
        try {
            const response = await getOcorrencias();
            setOcorrencias(response.data);
        } catch (error) {
            console.error('Error fetching ocorrencias:', error);
            // Handle error appropriately
        }
    };

    const fetchFuncionarios = async () => {
        try {
            const response = await getFuncionarios();
            setFuncionarios(response.data);
        } catch (error) {
            console.error('Error fetching funcionarios:', error);
            // Handle error appropriately
        }
    };

    const handleShowModal = (ocorrencia = null) => {
        setSelectedOcorrencia(ocorrencia);
        setIsEditing(!!ocorrencia);
        setShowModal(true);
    };

    const handleCloseModal = () => {
        setShowModal(false);
        setSelectedOcorrencia(null);
        setIsEditing(false);
    };

    const handleSaveOcorrencia = async (ocorrenciaData) => {
        try {
            if (isEditing) {
                await updateOcorrencia(selectedOcorrencia.id, ocorrenciaData);
            } else {
                await createOcorrencia(ocorrenciaData);
            }
            fetchOcorrencias();
            handleCloseModal();
        } catch (error) {
            console.error('Error saving ocorrencia:', error);
            // Handle error appropriately
        }
    };

    const handleDeleteOcorrencia = async (id) => {
        try {
            await deleteOcorrencia(id);
            fetchOcorrencias();
        } catch (error) {
            console.error('Error deleting ocorrencia:', error);
            // Handle error appropriately
        }
    };

    return (
        <div className="container mt-4">
            <h1>Gestão de Ocorrências de Funcionários</h1>
            <Button variant="primary" onClick={() => handleShowModal()} className="mb-3">
                Adicionar Ocorrência
            </Button>
            <OcorrenciasTable
                ocorrencias={ocorrencias}
                onEdit={(ocorrencia) => handleShowModal(ocorrencia)}
                onDelete={handleDeleteOcorrencia}
                funcionarios={funcionarios} // Pass funcionarios to table for display
            />
            <Modal show={showModal} onHide={handleCloseModal}>
                <Modal.Header closeButton>
                    <Modal.Title>{isEditing ? 'Editar Ocorrência' : 'Adicionar Ocorrência'}</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <OcorrenciaForm
                        initialData={selectedOcorrencia}
                        funcionarios={funcionarios}
                        onSubmit={handleSaveOcorrencia}
                        onCancel={handleCloseModal}
                    />
                </Modal.Body>
            </Modal>
        </div>
    );
};

export default OcorrenciasPage;
