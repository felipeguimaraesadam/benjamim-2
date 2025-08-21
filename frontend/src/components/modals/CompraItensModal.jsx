import React, { useState, useEffect } from 'react';
import { X, Download, Trash2, FileText, Image } from 'lucide-react';
import { getAnexosByCompra, deleteAnexoCompra, downloadAnexoCompra } from '../../services/api';
import { toast } from 'sonner';

const CompraItensModal = ({ isOpen, onClose, compra }) => {
  const [anexos, setAnexos] = useState([]);
  const [loadingAnexos, setLoadingAnexos] = useState(false);

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

  const loadAnexos = async () => {
    try {
      setLoadingAnexos(true);
      const response = await getAnexosByCompra(compra.id);
      console.log('Response getAnexosByCompra:', response);
      
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
      setAnexos([]); // Garantir que anexos seja um array vazio em caso de erro
    } finally {
      setLoadingAnexos(false);
    }
  };

  const handleDownloadAnexo = async (anexo) => {
    try {
      const response = await downloadAnexoCompra(compra.id, anexo.id);
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
      await deleteAnexoCompra(compra.id, anexo.id);
      setAnexos(prev => prev.filter(a => a.id !== anexo.id));
      toast.success('Anexo removido com sucesso');
    } catch (error) {
      console.error('Erro ao remover anexo:', error);
      toast.error('Erro ao remover anexo');
    }
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

  // Carregar anexos quando o modal abrir
  useEffect(() => {
    if (isOpen && compra?.id) {
      loadAnexos();
    }
  }, [isOpen, compra?.id]);

  // Early return after hooks
  if (!isOpen || !compra) {
    return null;
  }

  const itens = compra?.itens || [];

  const DetailItem = ({ label, value }) => (
    <div className="flex justify-between py-1.5 border-b border-gray-100 dark:border-gray-700">
      <dt className="text-sm font-medium text-gray-600 dark:text-gray-300">
        {label}:
      </dt>
      <dd className="text-sm text-gray-800 dark:text-gray-200 text-right">
        {value || 'N/A'}
      </dd>
    </div>
  );

  const DetailTextareaItem = ({ value }) => (
    <div className="py-1.5">
      <dd className="text-sm text-gray-800 dark:text-gray-200 whitespace-pre-wrap bg-gray-50 dark:bg-gray-700 p-2 rounded-md max-h-28 overflow-y-auto">
        {value || 'Nenhuma observação.'}
      </dd>
    </div>
  );

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-75 overflow-y-auto h-full w-full flex justify-center items-center z-50 px-4">
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-xl w-full max-w-3xl mx-auto my-8">
        <div className="flex justify-between items-center mb-5 border-b border-gray-200 dark:border-gray-700 pb-3">
          <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200">
            Detalhes da Compra
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
            aria-label="Fechar modal"
          >
            <X className="h-6 w-6" />
          </button>
        </div>
        
        <div className="space-y-4 mb-6">
          <h3 className="text-lg font-medium text-gray-700 dark:text-gray-300 mb-3">
            Informações Gerais
          </h3>
          <dl className="divide-y divide-gray-100 dark:divide-gray-700 bg-white dark:bg-gray-700 shadow-sm ring-1 ring-gray-900/5 dark:ring-gray-600/20 sm:rounded-xl p-4">
            <DetailItem label="Obra" value={compra.obra_nome} />
            <DetailItem label="Fornecedor" value={compra.fornecedor} />
            <DetailItem label="Nota Fiscal" value={compra.nota_fiscal} />
            <DetailItem
              label="Data da Compra"
              value={formatDate(compra.data_compra)}
            />
            <DetailItem
              label="Data de Pagamento"
              value={formatDate(compra.data_pagamento)}
            />
            <DetailItem
              label="Data do Registro"
              value={formatDateTime(compra.created_at)}
            />
          </dl>

          <h3 className="text-lg font-medium text-gray-700 dark:text-gray-300 mb-3 pt-3">
            Valores
          </h3>
          <dl className="divide-y divide-gray-100 dark:divide-gray-700 bg-white dark:bg-gray-700 shadow-sm ring-1 ring-gray-900/5 dark:ring-gray-600/20 sm:rounded-xl p-4">
            <DetailItem
              label="Subtotal dos Itens"
              value={formatCurrency(compra.valor_total_bruto)}
            />
            <DetailItem
              label="Desconto"
              value={formatCurrency(compra.desconto)}
            />
            <DetailItem
              label="Valor Total (Líquido)"
              value={formatCurrency(compra.valor_total_liquido)}
            />
          </dl>

          {/* Seção de Pagamento Parcelado */}
          {compra.parcelas && compra.parcelas.length > 0 && (
            <>
              <h3 className="text-lg font-medium text-gray-700 dark:text-gray-300 mb-3 pt-3">
                Pagamento Parcelado
              </h3>
              <div className="bg-white dark:bg-gray-700 shadow-sm ring-1 ring-gray-900/5 dark:ring-gray-600/20 sm:rounded-xl p-4">
                <div className="mb-3">
                  <span className="text-sm font-medium text-gray-600 dark:text-gray-300">
                    Total de {compra.parcelas.length} parcela{compra.parcelas.length > 1 ? 's' : ''}
                  </span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="text-xs text-gray-700 dark:text-gray-300 uppercase bg-gray-50 dark:bg-gray-600">
                      <tr>
                        <th className="px-3 py-2 text-left">Parcela</th>
                        <th className="px-3 py-2 text-right">Valor</th>
                        <th className="px-3 py-2 text-center">Vencimento</th>
                        <th className="px-3 py-2 text-center">Status</th>
                        <th className="px-3 py-2 text-center">Pagamento</th>
                      </tr>
                    </thead>
                    <tbody>
                      {compra.parcelas.map((parcela, index) => (
                        <tr key={parcela.id || index} className="border-b border-gray-200 dark:border-gray-600">
                          <td className="px-3 py-2 font-medium text-gray-900 dark:text-gray-200">
                            {parcela.numero_parcela}ª
                          </td>
                          <td className="px-3 py-2 text-right text-gray-700 dark:text-gray-300">
                            {formatCurrency(parcela.valor_parcela)}
                          </td>
                          <td className="px-3 py-2 text-center text-gray-700 dark:text-gray-300">
                            {formatDate(parcela.data_vencimento)}
                          </td>
                          <td className="px-3 py-2 text-center">
                            <span className={`px-2 py-1 text-xs rounded-full ${
                              parcela.status === 'PAGO' 
                                ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                                : parcela.status === 'VENCIDO'
                                ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                                : parcela.status === 'CANCELADO'
                                ? 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
                                : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                            }`}>
                              {parcela.status === 'PAGO' ? 'Pago' : 
                               parcela.status === 'VENCIDO' ? 'Vencido' :
                               parcela.status === 'CANCELADO' ? 'Cancelado' : 'Pendente'}
                            </span>
                          </td>
                          <td className="px-3 py-2 text-center text-gray-700 dark:text-gray-300">
                            {parcela.data_pagamento ? formatDate(parcela.data_pagamento) : '-'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}

          {compra.observacoes && (
            <>
              <h3 className="text-lg font-medium text-gray-700 dark:text-gray-300 mb-2 pt-3">
                Observações
              </h3>
              <div className="bg-white dark:bg-gray-700 shadow-sm ring-1 ring-gray-900/5 dark:ring-gray-600/20 sm:rounded-xl p-4">
                <DetailTextareaItem value={compra.observacoes} />
              </div>
            </>
          )}
        </div>
        
        <h3 className="text-lg font-medium text-gray-700 dark:text-gray-300 mb-3 pt-3 border-t border-gray-200 dark:border-gray-700">
          Itens da Compra
        </h3>
        {!itens || itens.length === 0 ? (
          <p className="text-center text-gray-500 dark:text-gray-400 py-4">
            Nenhum item encontrado para esta compra.
          </p>
        ) : (
          <div className="overflow-x-auto shadow-md sm:rounded-lg border border-gray-200 dark:border-gray-700">
            <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400">
              <thead className="text-xs text-gray-700 dark:text-gray-300 uppercase bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th scope="col" className="px-4 py-3">
                    Material
                  </th>
                  <th scope="col" className="px-4 py-3 text-right">
                    Quantidade
                  </th>
                  <th scope="col" className="px-4 py-3 text-right">
                    Valor Unitário
                  </th>
                  <th scope="col" className="px-4 py-3">
                    Categoria de Uso
                  </th>
                  <th scope="col" className="px-4 py-3 text-right">
                    Valor Total
                  </th>
                </tr>
              </thead>
              <tbody>
                {itens.map((item, index) => (
                  <tr
                    key={item.id || index}
                    className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700"
                  >
                    <td className="px-4 py-3 font-medium text-gray-900 dark:text-gray-200 whitespace-nowrap">
                      {item.material_nome || 'N/A'}
                    </td>
                    <td className="px-4 py-3 text-right text-gray-700 dark:text-gray-300">
                      {item.quantidade}
                    </td>
                    <td className="px-4 py-3 text-right text-gray-700 dark:text-gray-300">
                      {formatCurrency(item.valor_unitario)}
                    </td>
                    <td className="px-4 py-3 text-gray-700 dark:text-gray-300">
                      {item.categoria_uso || 'N/A'}
                    </td>
                    <td className="px-4 py-3 text-right text-gray-700 dark:text-gray-300">
                      {formatCurrency(item.valor_total_item)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Seção de Anexos */}
        <div className="mt-6">
          <h3 className="text-lg font-medium text-gray-700 dark:text-gray-300 mb-3 pt-3 border-t border-gray-200 dark:border-gray-700">
            Anexos
          </h3>
          
          {loadingAnexos ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="ml-2 text-gray-600 dark:text-gray-300">Carregando anexos...</span>
            </div>
          ) : !Array.isArray(anexos) || anexos.length === 0 ? (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              <FileText className="mx-auto h-12 w-12 text-gray-300 mb-2" />
              <p>Nenhum anexo encontrado</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {Array.isArray(anexos) && anexos.map((anexo) => (
                <div key={anexo.id} className="border border-gray-200 dark:border-gray-600 rounded-lg p-4 hover:shadow-md transition-shadow bg-white dark:bg-gray-700">
                  {/* Preview da imagem ou ícone de arquivo */}
                  <div className="mb-3">
                    {isImageFile(anexo.arquivo_nome) ? (
                      <div className="relative">
                        <img
                          src={anexo.arquivo_url}
                          alt={anexo.arquivo_nome}
                          className="w-full h-32 object-cover rounded-md cursor-pointer hover:opacity-80 transition-opacity"
                          onClick={() => window.open(anexo.arquivo_url, '_blank')}
                        />
                        <div className="absolute top-2 right-2">
                          <Image className="h-4 w-4 text-white bg-black bg-opacity-50 rounded p-0.5" />
                        </div>
                      </div>
                    ) : (
                      <div className="w-full h-32 bg-gray-100 dark:bg-gray-600 rounded-md flex items-center justify-center">
                        <FileText className="h-12 w-12 text-gray-400" />
                      </div>
                    )}
                  </div>

                  {/* Informações do arquivo */}
                  <div className="space-y-2">
                    <h4 className="font-medium text-sm text-gray-900 dark:text-gray-200 truncate" title={anexo.arquivo_nome}>
                      {anexo.arquivo_nome}
                    </h4>
                    
                    <div className="text-xs text-gray-500 dark:text-gray-400 space-y-1">
                      <div>Tamanho: {formatFileSize(anexo.arquivo_tamanho)}</div>
                      <div>Adicionado: {formatDateTime(anexo.uploaded_at)}</div>
                      {anexo.descricao && (
                        <div className="text-gray-600 dark:text-gray-300">Descrição: {anexo.descricao}</div>
                      )}
                    </div>

                    {/* Botões de ação */}
                    <div className="flex space-x-2 pt-2">
                      <button
                        onClick={() => handleDownloadAnexo(anexo)}
                        className="flex-1 flex items-center justify-center px-3 py-1.5 text-xs font-medium text-blue-600 bg-blue-50 border border-blue-200 rounded-md hover:bg-blue-100 transition-colors dark:text-blue-400 dark:bg-blue-900/20 dark:border-blue-800 dark:hover:bg-blue-900/30"
                      >
                        <Download className="h-3 w-3 mr-1" />
                        Download
                      </button>
                      <button
                        onClick={() => handleRemoveAnexo(anexo)}
                        className="flex-1 flex items-center justify-center px-3 py-1.5 text-xs font-medium text-red-600 bg-red-50 border border-red-200 rounded-md hover:bg-red-100 transition-colors dark:text-red-400 dark:bg-red-900/20 dark:border-red-800 dark:hover:bg-red-900/30"
                      >
                        <Trash2 className="h-3 w-3 mr-1" />
                        Remover
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="mt-8 flex justify-end space-x-3 border-t border-gray-200 dark:border-gray-700 pt-5">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-200 dark:bg-gray-600 text-gray-800 dark:text-gray-200 rounded-md hover:bg-gray-300 dark:hover:bg-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-400 dark:focus:ring-gray-500 transition-colors"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};

export default CompraItensModal;
