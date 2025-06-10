import React from 'react';
import { Table, Button } from 'react-bootstrap';

const OcorrenciasTable = ({ ocorrencias, onEdit, onDelete, funcionarios }) => {

    const getFuncionarioNome = (id) => {
        const funcionario = funcionarios.find(f => f.id === id);
        return funcionario ? funcionario.nome : 'N/A';
    };

    const formatTipoOcorrencia = (tipo) => {
        switch (tipo) {
            case 'atraso':
                return 'Atraso';
            case 'falta_justificada':
                return 'Falta Justificada';
            case 'falta_nao_justificada':
                return 'Falta não Justificada';
            default:
                return tipo;
        }
    };

    return (
        <Table striped bordered hover responsive>
            <thead>
                <tr>
                    <th>Funcionário</th>
                    <th>Data</th>
                    <th>Tipo de Ocorrência</th>
                    <th>Observação</th>
                    <th>Ações</th>
                </tr>
            </thead>
            <tbody>
                {ocorrencias.map((ocorrencia) => (
                    <tr key={ocorrencia.id}>
                        <td>{getFuncionarioNome(ocorrencia.funcionario_id)}</td>
                        <td>{new Date(ocorrencia.data).toLocaleDateString()}</td>
                        <td>{formatTipoOcorrencia(ocorrencia.tipo_ocorrencia)}</td>
                        <td>{ocorrencia.observacao}</td>
                        <td>
                            <Button variant="info" size="sm" onClick={() => onEdit(ocorrencia)} className="me-2">
                                Editar
                            </Button>
                            <Button variant="danger" size="sm" onClick={() => onDelete(ocorrencia.id)}>
                                Excluir
                            </Button>
                        </td>
                    </tr>
                ))}
            </tbody>
        </Table>
    );
};

export default OcorrenciasTable;
