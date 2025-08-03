import React from 'react';
import { Link } from 'react-router-dom';
import { getRelatorioObraGeral, getRelatorioObraCompleto } from '../../services/api';

const ObraDetailHeader = ({ obra, formatDate }) => {
  if (!obra) return null;

  const handleGerarRelatorio = async (tipoRelatorio) => {
    try {
      let response;
      if (tipoRelatorio === 'geral') {
        response = await getRelatorioObraGeral(obra.id);
      } else {
        response = await getRelatorioObraCompleto(obra.id);
      }

      const file = new Blob([response.data], { type: 'application/pdf' });
      const fileURL = URL.createObjectURL(file);
      window.open(fileURL, '_blank');
    } catch (error) {
      console.error(`Erro ao gerar relatório ${tipoRelatorio}:`, error);
      alert(`Não foi possível gerar o relatório ${tipoRelatorio}.`);
    }
  };

  return (
    <>
      {/* Breadcrumbs or Back Link */}
      <div className="mb-6">
        <Link
          to="/obras"
          className="text-primary-600 hover:text-primary-700 transition duration-150 ease-in-out inline-flex items-center"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5 mr-2"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z"
              clipRule="evenodd"
            />
          </svg>
          Voltar para Obras
        </Link>
      </div>

      {/* Main Details Section */}
      <div className="bg-white dark:bg-gray-800 shadow-xl rounded-lg p-6 mb-8">
        <div className="flex flex-wrap justify-between items-start mb-4">
          <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100">
            {obra.nome_obra}
          </h1>
          {/* Action Buttons Moved Up for better visibility */}
          <div className="flex flex-wrap gap-2 mt-2 sm:mt-0">
            <button
              onClick={() => handleGerarRelatorio('geral')}
              className="bg-purple-500 hover:bg-purple-600 text-white font-semibold py-2 px-3 rounded-md shadow-sm transition duration-150 ease-in-out text-xs"
            >
              Relatório Geral
            </button>
            <button
              onClick={() => handleGerarRelatorio('completo')}
              className="bg-gray-700 hover:bg-gray-800 text-white font-semibold py-2 px-3 rounded-md shadow-sm transition duration-150 ease-in-out text-xs"
            >
              Relatório Completo
            </button>
            <Link
              to="/obras" // This link should ideally go to an edit page: /obras/edit/${obra.id}
              className="bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-3 rounded-md shadow-sm transition duration-150 ease-in-out text-xs"
            >
              Editar Obra (Lista)
            </Link>
            <Link
              to="/compras"
              state={{ obraIdParaNovaCompra: obra.id }}
              className="bg-green-500 hover:bg-green-600 text-white font-semibold py-2 px-3 rounded-md shadow-sm transition duration-150 ease-in-out text-xs"
            >
              Adicionar Compra
            </Link>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-x-6 gap-y-4 mb-4 text-gray-700 dark:text-gray-200">
          <p>
            <strong>Endereço:</strong>{' '}
            {obra.endereco_completo ||
              `${obra.logradouro || ''}, ${obra.numero || ''}`}
            , {obra.bairro || ''}, {obra.cidade || ''} - {obra.estado || ''},
            CEP: {obra.cep || ''}
          </p>
          <p>
            <strong>Status:</strong>{' '}
            <span
              className={`px-3 py-1 text-sm font-semibold rounded-full ${obra.status === 'Em Andamento' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300' : obra.status === 'Concluída' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' : obra.status === 'Planejada' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300' : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'}`}
            >
              {obra.status}
            </span>
          </p>
          <p>
            <strong>Data de Início:</strong> {formatDate(obra.data_inicio)}
          </p>
          <p>
            <strong>Previsão de Término:</strong>{' '}
            {formatDate(obra.data_prevista_fim)}
          </p>
          {obra.data_real_fim && (
            <p>
              <strong>Data de Conclusão:</strong>{' '}
              {formatDate(obra.data_real_fim)}
            </p>
          )}
          <p>
            <strong>Responsável:</strong>{' '}
            {obra.responsavel_nome || 'Não definido'}
          </p>
          <p>
            <strong>Cliente:</strong> {obra.cliente_nome || 'Não definido'}
          </p>
        </div>
        {obra.descricao && (
          <div className="mt-4">
            <h2 className="text-xl font-semibold text-gray-700 dark:text-gray-200 mb-2">
              Descrição do Projeto
            </h2>
            <p className="text-gray-600 dark:text-gray-300 whitespace-pre-line">
              {obra.descricao}
            </p>
          </div>
        )}
      </div>
    </>
  );
};

export default React.memo(ObraDetailHeader);
