import React, { useState, useEffect } from 'react';
import { Form, Button } from 'react-bootstrap';
import { getMateriais, getObras } from '../../services/api'; // Assuming you have these API functions

const CompraForm = ({ initialData, onSubmit, onCancel }) => {
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

    useEffect(() => {
        fetchMateriais();
        fetchObras();
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
        }
    }, [initialData]);

    const fetchMateriais = async () => {
        try {
            const data = await getMateriais();
            setMateriais(data);
        } catch (error) {
            console.error('Error fetching materiais:', error);
        }
    };

    const fetchObras = async () => {
        try {
            const data = await getObras();
            setObras(data);
        } catch (error) {
            console.error('Error fetching obras:', error);
        }
    };

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
            <Form.Group controlId="material_id" className="mb-3">
                <Form.Label>Material</Form.Label>
                <Form.Control
                    as="select"
                    name="material_id"
                    value={formData.material_id}
                    onChange={handleChange}
                    required
                >
                    <option value="">Selecione o Material</option>
                    {materiais.map((material) => (
                        <option key={material.id} value={material.id}>
                            {material.nome}
                        </option>
                    ))}
                </Form.Control>
            </Form.Group>

            <Form.Group controlId="obra_id" className="mb-3">
                <Form.Label>Obra</Form.Label>
                <Form.Control
                    as="select"
                    name="obra_id"
                    value={formData.obra_id}
                    onChange={handleChange}
                    required
                >
                    <option value="">Selecione a Obra</option>
                    {obras.map((obra) => (
                        <option key={obra.id} value={obra.id}>
                            {obra.nome}
                        </option>
                    ))}
                </Form.Control>
            </Form.Group>

            <Form.Group controlId="quantidade" className="mb-3">
                <Form.Label>Quantidade</Form.Label>
                <Form.Control
                    type="number"
                    name="quantidade"
                    value={formData.quantidade}
                    onChange={handleChange}
                    required
                    min="0"
                />
            </Form.Group>

            <Form.Group controlId="custo_total" className="mb-3">
                <Form.Label>Custo Total</Form.Label>
                <Form.Control
                    type="number"
                    name="custo_total"
                    value={formData.custo_total}
                    onChange={handleChange}
                    required
                    min="0"
                    step="0.01"
                />
            </Form.Group>

            <Form.Group controlId="fornecedor" className="mb-3">
                <Form.Label>Fornecedor</Form.Label>
                <Form.Control
                    type="text"
                    name="fornecedor"
                    value={formData.fornecedor}
                    onChange={handleChange}
                    required
                />
            </Form.Group>

            <Form.Group controlId="data_compra" className="mb-3">
                <Form.Label>Data da Compra</Form.Label>
                <Form.Control
                    type="date"
                    name="data_compra"
                    value={formData.data_compra}
                    onChange={handleChange}
                    required
                />
            </Form.Group>

            <Form.Group controlId="nota_fiscal" className="mb-3">
                <Form.Label>Nota Fiscal (Opcional)</Form.Label>
                <Form.Control
                    type="text"
                    name="nota_fiscal"
                    value={formData.nota_fiscal}
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

export default CompraForm;
