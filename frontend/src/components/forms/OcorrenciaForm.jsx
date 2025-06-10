import React, { useState, useEffect } from 'react';
import { Form, Button } from 'react-bootstrap';

const OcorrenciaForm = ({ initialData, funcionarios, onSubmit, onCancel }) => {
    const [formData, setFormData] = useState({
        funcionario_id: '',
        data: '',
        tipo_ocorrencia: 'atraso', // Default value
        observacao: '',
    });

    useEffect(() => {
        if (initialData) {
            setFormData({
                funcionario_id: initialData.funcionario_id || '',
                data: initialData.data ? new Date(initialData.data).toISOString().split('T')[0] : '',
                tipo_ocorrencia: initialData.tipo_ocorrencia || 'atraso',
                observacao: initialData.observacao || '',
            });
        } else {
            // Reset to default when adding a new one, especially if form is reused
            setFormData({
                funcionario_id: '',
                data: new Date().toISOString().split('T')[0], // Default to today
                tipo_ocorrencia: 'atraso',
                observacao: '',
            });
        }
    }, [initialData]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        onSubmit(formData);
    };

    return (
        <Form onSubmit={handleSubmit}>
            <Form.Group controlId="funcionario_id" className="mb-3">
                <Form.Label>Funcionário</Form.Label>
                <Form.Control
                    as="select"
                    name="funcionario_id"
                    value={formData.funcionario_id}
                    onChange={handleChange}
                    required
                >
                    <option value="">Selecione o Funcionário</option>
                    {funcionarios.map((funcionario) => (
                        <option key={funcionario.id} value={funcionario.id}>
                            {funcionario.nome}
                        </option>
                    ))}
                </Form.Control>
            </Form.Group>

            <Form.Group controlId="data" className="mb-3">
                <Form.Label>Data</Form.Label>
                <Form.Control
                    type="date"
                    name="data"
                    value={formData.data}
                    onChange={handleChange}
                    required
                />
            </Form.Group>

            <Form.Group controlId="tipo_ocorrencia" className="mb-3">
                <Form.Label>Tipo de Ocorrência</Form.Label>
                <Form.Control
                    as="select"
                    name="tipo_ocorrencia"
                    value={formData.tipo_ocorrencia}
                    onChange={handleChange}
                    required
                >
                    <option value="atraso">Atraso</option>
                    <option value="falta_justificada">Falta Justificada</option>
                    <option value="falta_nao_justificada">Falta não Justificada</option>
                </Form.Control>
            </Form.Group>

            <Form.Group controlId="observacao" className="mb-3">
                <Form.Label>Observação</Form.Label>
                <Form.Control
                    as="textarea"
                    rows={3}
                    name="observacao"
                    value={formData.observacao}
                    onChange={handleChange}
                />
            </Form.Group>

            <div className="d-flex justify-content-end">
                <Button variant="secondary" onClick={onCancel} className="me-2">
                    Cancelar
                </Button>
                <Button variant="primary" type="submit">
                    Salvar
                </Button>
            </div>
        </Form>
    );
};

export default OcorrenciaForm;
