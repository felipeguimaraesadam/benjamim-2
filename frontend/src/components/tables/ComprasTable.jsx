import React from 'react';
import { Table, Button } from 'react-bootstrap';

const ComprasTable = ({ compras, onEdit, onDelete }) => {
    return (
        <Table striped bordered hover responsive>
            <thead>
                <tr>
                    <th>Material</th>
                    <th>Obra</th>
                    <th>Quantidade</th>
                    <th>Custo Total</th>
                    <th>Fornecedor</th>
                    <th>Data da Compra</th>
                    <th>Ações</th>
                </tr>
            </thead>
            <tbody>
                {compras.map((compra) => (
                    <tr key={compra.id}>
                        <td>{compra.material?.nome || 'N/A'}</td>
                        <td>{compra.obra?.nome || 'N/A'}</td>
                        <td>{compra.quantidade}</td>
                        <td>R$ {parseFloat(compra.custo_total).toFixed(2)}</td>
                        <td>{compra.fornecedor}</td>
                        <td>{new Date(compra.data_compra).toLocaleDateString()}</td>
                        <td>
                            <Button variant="info" size="sm" onClick={() => onEdit(compra)} className="me-2">
                                Editar
                            </Button>
                            <Button variant="danger" size="sm" onClick={() => onDelete(compra.id)}>
                                Excluir
                            </Button>
                        </td>
                    </tr>
                ))}
            </tbody>
        </Table>
    );
};

export default ComprasTable;
