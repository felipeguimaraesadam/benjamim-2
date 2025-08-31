import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Download, Trash2, FileText, Image } from 'lucide-react';
import { getCompraById, getAnexosByCompra, deleteAnexoCompra, downloadAnexoCompra } from '../services/api';
import { toast } from 'sonner';
import SpinnerIcon from '../components/utils/SpinnerIcon';

const CompraDetailsPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [compra, setCompra] = useState(null);
  const [anexos, setAnexos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingAnexos, setLoadingAnexos] = useState(false);
  const [error, setError] = useState(null);

  // Helper functions
  const formatCurrency = value => {
    if (value === null || value === undefined) return 'N/A';
    return parseFloat(value).toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    });
  };

  const formatDate = dateString => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString + 'T00:00:00Z');
    return date.toLocaleDateString('pt-BR', { timeZone: 'UTC' });
  };

  const formatDateTime = dateTimeString => {
    if (!dateTimeString) return 'N/A';
    const date = new Date(dateTimeString);
    return date.toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  const isImageFile = (fileName) => {
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp'];
    return imageExtensions.some(ext => fileName?.toLowerCase().endsWith(ext));
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return 'N/A';
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  };

  const loadCompra = useCallback(async () => {
    try {
      setLoading(true);
      const response = await getCompraById(id);
      setCompra(response.data || response);
    } catch (error) {
      console.error('Erro ao carregar compra:', error);
      setError('Erro ao carregar detalhes da compra');
      toast.error('Erro ao carregar detalhes da compra');
    } finally {
      setLoading(false);
    }
  }, [id]);

  const loadAnexos = useCallback(async () => {
    try {
      setLoadingAnexos(true);
      const response = await getAnexosByCompra(id);
      
      // Garantir que anexos seja sempre um array
      let anexosData = [];
      if (response && response.data) {
        if (Array.isArray(response.data)) {
          anexosData = response.data;
        } else if (Array.isArray(response.data.results)) {
          anexosData = response.data.results;
        } else {
          console.warn('Formato inesperado de dados de anexos:', response.data);
        }
      }
      
      setAnexos(anexosData);
    } catch (error) {
      console.error('Erro ao carregar anexos:', error);
      toast.error('Erro ao carregar anexos');
      setAnexos([]);
    } finally {
      setLoadingAnexos(false);
    }
  }, [id]);

  const handleDownloadAnexo = async (anexo) => {
    try {
      const response = await downloadAnexoCompra(id, anexo.id);
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', anexo.arquivo_nome || 'anexo');
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      toast.success('Download iniciado');
    } catch (error) {
      console.error('Erro ao fazer download:', error);
      toast.error('Erro ao fazer download do anexo');
    }
  };

  const handleRemoveAnexo = async (anexo) => {
    if (!window.confirm(`Tem certeza que deseja remover o anexo "${anexo.arquivo_nome}"?`)) {
      return;
    }

    try {
      await deleteAnexoCompra(id, anexo.id);
      setAnexos(prev => prev.filter(a => a.id !== anexo.id));
      toast.success('Anexo removido com sucesso');
    } catch (error) {
      console.error('Erro ao remover anexo:', error);
      toast.error('Erro ao remover anexo');
    }
  };

  useEffect(() => {
    if (id) {
      loadCompra();
      loadAnexos();
    }
  }, [id, loadCompra, loadAnexos]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex items-center space-x-2">
          <SpinnerIcon className="w-8 h-8" />
          <span className="text-gray-600">Carregando detalhes da compra...</span>
        </div>
      </div>
    );
  }

  if (error || !compra) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Erro</h2>
          <p className="text-gray-600 mb-4">{error || 'Compra não encontrada'}</p>
          <button
            onClick={() => navigate('/compras')}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar para Compras
          </button>
        </div>
      </div>
    );
  }

  const itens = compra?.itens || [];

  const DetailItem = ({ label, value }) => (
    <div className="flex justify-between py-3 border-b border-gray-100">
      <dt className="text-sm font-medium text-gray-600">
        {label}:
      </dt>
      <dd className="text-sm text-gray-900 text-right font-medium">
        {value || 'N/A'}
      </dd>
    </div>
  );

  const DetailTextareaItem = ({ value }) => (
    <div className="py-3">
      <dd className="text-sm text-gray-900 whitespace-pre-wrap bg-gray-50 p-4 rounded-md max-h-32 overflow-y-auto">
        {value || 'Nenhuma observação.'}
      </dd>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate('/compras')}
                className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Voltar
              </button>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">
                  Detalhes da Compra #{compra.id}
                </h1>
                <p className="text-sm text-gray-500 mt-1">
                  {compra.tipo === 'COMPRA' ? 'Compra' : 'Orçamento'} • {formatDate(compra.data_compra)}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Coluna Principal */}
          <div className="lg:col-span-2 space-y-8">
            {/* Informações Gerais */}
            <div className="bg-white shadow-sm rounded-lg">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-medium text-gray-900">Informações Gerais</h2>
              </div>
              <div className="px-6 py-4">
                <dl className="space-y-0">
                  <DetailItem label="Obra" value={compra.obra_nome} />
                  <DetailItem label="Fornecedor" value={compra.fornecedor} />
                  <DetailItem label="Status Orçamento" value={compra.status_orcamento} />
                  <DetailItem label="Forma de Pagamento" value={compra.forma_pagamento} />
                  <DetailItem label="Nota Fiscal" value={compra.nota_fiscal} />
                  <DetailItem label="Data da Compra" value={formatDate(compra.data_compra)} />
                  <DetailItem label="Data de Pagamento" value={formatDate(compra.data_pagamento)} />
                  <DetailItem label="Data do Registro" value={formatDateTime(compra.created_at)} />
                </dl>
              </div>
            </div>

            {/* Itens da Compra */}
            <div className="bg-white shadow-sm rounded-lg">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-medium text-gray-900">
                  Itens da Compra ({itens.length})
                </h2>
              </div>
              <div className="px-6 py-4">
                {itens.length === 0 ? (
                  <p className="text-center py-8 text-gray-500">
                    Nenhum item encontrado para esta compra.
                  </p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-gray-200">
                          <th className="text-left py-3 px-4 font-medium text-gray-900">
                            Material
                          </th>
                          <th className="text-right py-3 px-4 font-medium text-gray-900">
                            Quantidade
                          </th>
                          <th className="text-right py-3 px-4 font-medium text-gray-900">
                            Valor Unitário
                          </th>
                          <th className="text-left py-3 px-4 font-medium text-gray-900">
                            Categoria de Uso
                          </th>
                          <th className="text-right py-3 px-4 font-medium text-gray-900">
                            Valor Total
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {itens.map((item, index) => (
                          <tr
                            key={item.id || index}
                            className="border-b border-gray-100 hover:bg-gray-50"
                          >
                            <td className="py-4 px-4 font-medium text-gray-900">
                              {item.material_nome || 'N/A'}
                            </td>
                            <td className="py-4 px-4 text-right text-gray-700">
                              {item.quantidade}
                            </td>
                            <td className="py-4 px-4 text-right text-gray-700">
                              {formatCurrency(item.valor_unitario)}
                            </td>
                            <td className="py-4 px-4 text-gray-700">
                              {item.categoria_uso || 'N/A'}
                            </td>
                            <td className="py-4 px-4 text-right font-medium text-gray-900">
                              {formatCurrency(item.quantidade * item.valor_unitario)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>

            {/* Observações */}
            {compra.observacoes && (
              <div className="bg-white shadow-sm rounded-lg">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h2 className="text-lg font-medium text-gray-900">Observações</h2>
                </div>
                <div className="px-6 py-4">
                  <DetailTextareaItem value={compra.observacoes} />
                </div>
              </div>
            )}
          </div>

          {/* Coluna Lateral */}
          <div className="space-y-8">
            {/* Valores */}
            <div className="bg-white shadow-sm rounded-lg">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-medium text-gray-900">Valores</h2>
              </div>
              <div className="px-6 py-4">
                <dl className="space-y-0">
                  <DetailItem
                    label="Subtotal dos Itens"
                    value={formatCurrency(compra.valor_total_bruto)}
                  />
                  <DetailItem
                    label="Desconto"
                    value={formatCurrency(compra.desconto)}
                  />
                  <div className="flex justify-between py-3 border-t-2 border-gray-200">
                    <dt className="text-base font-semibold text-gray-900">
                      Valor Total (Líquido):
                    </dt>
                    <dd className="text-base font-bold text-gray-900">
                      {formatCurrency(compra.valor_total_liquido)}
                    </dd>
                  </div>
                </dl>
              </div>
            </div>

            {/* Pagamento Parcelado */}
            {compra.pagamento_parcelado && compra.pagamento_parcelado.tipo === 'PARCELADO' && (
              <div className="bg-white shadow-sm rounded-lg">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h2 className="text-lg font-medium text-gray-900">Pagamento Parcelado</h2>
                </div>
                <div className="px-6 py-4">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-gray-200">
                          <th className="text-left py-2">Parcela</th>
                          <th className="text-right py-2">Valor</th>
                          <th className="text-center py-2">Vencimento</th>
                        </tr>
                      </thead>
                      <tbody>
                        {compra.pagamento_parcelado.parcelas.map((parcela, index) => (
                          <tr key={index} className="border-b border-gray-100">
                            <td className="py-2 font-medium text-gray-900">
                              {index + 1}ª
                            </td>
                            <td className="py-2 text-right text-gray-700">
                              {formatCurrency(parcela.valor)}
                            </td>
                            <td className="py-2 text-center text-gray-700">
                              {formatDate(parcela.data_vencimento)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* Pagamento Único */}
            {compra.pagamento_parcelado && compra.pagamento_parcelado.tipo === 'UNICO' && (
              <div className="bg-white shadow-sm rounded-lg">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h2 className="text-lg font-medium text-gray-900">Forma de Pagamento</h2>
                </div>
                <div className="px-6 py-4">
                  <div className="text-sm text-gray-600">
                    <span className="font-medium">Pagamento Único:</span> {formatCurrency(compra.valor_total_liquido)}
                  </div>
                </div>
              </div>
            )}

            {/* Anexos */}
            <div className="bg-white shadow-sm rounded-lg">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-medium text-gray-900">Anexos</h2>
              </div>
              <div className="px-6 py-4">
                {loadingAnexos ? (
                  <div className="flex items-center justify-center py-8">
                    <SpinnerIcon className="w-6 h-6 mr-2" />
                    <span className="text-gray-600">Carregando anexos...</span>
                  </div>
                ) : !Array.isArray(anexos) || anexos.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <FileText className="mx-auto h-12 w-12 text-gray-300 mb-2" />
                    <p>Nenhum anexo encontrado</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {anexos.map((anexo, index) => (
                      <div key={anexo.id || index} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-2">
                              {isImageFile(anexo.arquivo_nome) ? (
                                <Image className="h-5 w-5 text-blue-500" />
                              ) : (
                                <FileText className="h-5 w-5 text-gray-500" />
                              )}
                              <span className="font-medium text-gray-900">
                                {anexo.arquivo_nome}
                              </span>
                            </div>
                            <div className="text-sm text-gray-500 space-y-1">
                              <div>Tamanho: {formatFileSize(anexo.arquivo_tamanho)}</div>
                              <div>Enviado em: {formatDateTime(anexo.created_at)}</div>
                              {anexo.descricao && (
                                <div className="text-gray-600">Descrição: {anexo.descricao}</div>
                              )}
                            </div>
                          </div>
                          <div className="flex space-x-2 ml-4">
                            <button
                              onClick={() => handleDownloadAnexo(anexo)}
                              className="p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-md transition-colors"
                              title="Download"
                            >
                              <Download className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleRemoveAnexo(anexo)}
                              className="p-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-md transition-colors"
                              title="Remover"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                        
                        {/* Preview de imagem */}
                        {isImageFile(anexo.arquivo_nome) && anexo.arquivo_url && (
                          <div className="mt-3">
                            <img
                              src={anexo.arquivo_url}
                              alt={anexo.arquivo_nome}
                              className="w-full h-48 object-cover rounded-md cursor-pointer hover:opacity-80 transition-opacity"
                              onClick={() => window.open(anexo.arquivo_url, '_blank')}
                            />
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CompraDetailsPage;