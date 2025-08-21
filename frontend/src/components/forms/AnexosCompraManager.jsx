import React, { useState, useRef } from 'react';
import { Upload, X, FileText, Image, File, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import * as api from '../../services/api';

const AnexosCompraManager = ({ compraId, anexos = [], onAnexosChange, isEditing = false }) => {
  // Garantir que anexos seja sempre um array
  const anexosArray = Array.isArray(anexos) ? anexos : [];
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef(null);

  // Debug logs
  console.log('🔍 AnexosCompraManager - Props recebidas:', {
    compraId,
    anexos,
    anexosLength: anexos?.length,
    isEditing,
    timestamp: new Date().toISOString()
  });

  const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
  const ACCEPTED_TYPES = {
    'image/jpeg': 'IMAGE',
    'image/jpg': 'IMAGE',
    'image/png': 'IMAGE',
    'image/gif': 'IMAGE',
    'image/bmp': 'IMAGE',
    'application/pdf': 'PDF',
    'application/msword': 'DOCUMENT',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'DOCUMENT',
    'application/vnd.ms-excel': 'DOCUMENT',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'DOCUMENT'
  };

  const validateFile = (file) => {
    if (file.size > MAX_FILE_SIZE) {
      toast.error(`Arquivo "${file.name}" excede o limite de 10MB`);
      return false;
    }

    if (!ACCEPTED_TYPES[file.type]) {
      toast.error(`Tipo de arquivo "${file.name}" não é suportado`);
      return false;
    }

    return true;
  };

  const handleFileSelect = async (files) => {
    if (!files || files.length === 0) return;
    
    console.log('=== INÍCIO DO UPLOAD DE ARQUIVOS ===');
    console.log('Número de arquivos selecionados:', files.length);
    console.log('CompraId:', compraId);
    
    setUploading(true);
    const novosAnexos = [];
    
    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        
        console.log(`\n--- Processando arquivo ${i + 1}/${files.length} ---`);
        console.log('Arquivo:', {
          name: file.name,
          type: file.type,
          size: file.size,
          lastModified: file.lastModified
        });
        
        // Validações
        if (file.size > MAX_FILE_SIZE) {
          console.warn('Arquivo muito grande:', file.name, 'Tamanho:', file.size);
          toast.error(`Arquivo ${file.name} é muito grande. Máximo permitido: 10MB`);
          continue;
        }
        
        if (!ACCEPTED_TYPES[file.type]) {
          console.warn('Tipo de arquivo não suportado:', file.name, 'Tipo:', file.type);
          toast.error(`Tipo de arquivo não suportado: ${file.name}`);
          continue;
        }
        
        console.log('Arquivo passou nas validações');
        
        if (compraId) {
          // Upload imediato para compras existentes
          console.log('Iniciando upload para compra existente. CompraId:', compraId);
          
          try {
             console.log('Criando FormData para upload...');
             const formData = new FormData();
             formData.append('arquivo', file);
             formData.append('descricao', '');
             
             console.log('FormData criado:');
             for (let [key, value] of formData.entries()) {
               console.log(`${key}:`, value);
             }
             
             console.log('Chamando api.uploadAnexoCompra...');
             const response = await api.uploadAnexoCompra(compraId, formData);
             console.log('Upload bem-sucedido! Resposta completa:', response);
             console.log('Dados da resposta:', response.data);
            
            const anexoSalvo = response.data;
            const anexoFormatado = {
              id: anexoSalvo.id,
              arquivo: anexoSalvo.arquivo,
              nome_original: anexoSalvo.nome_original || anexoSalvo.arquivo_nome || file.name,
              tipo_arquivo: anexoSalvo.tipo_arquivo || ACCEPTED_TYPES[file.type],
              tamanho_arquivo: anexoSalvo.tamanho_arquivo || anexoSalvo.arquivo_tamanho || file.size,
              uploaded_at: anexoSalvo.uploaded_at,
              isTemp: false
            };
            
            console.log('Anexo formatado para exibição:', anexoFormatado);
            novosAnexos.push(anexoFormatado);
            console.log('Arquivo adicionado à lista de novos anexos');
            
          } catch (error) {
            console.error('\n!!! ERRO NO UPLOAD !!!');
            console.error('Erro completo:', error);
            console.error('Mensagem:', error.message);
            console.error('Stack:', error.stack);
            
            if (error.response) {
              console.error('Resposta do servidor:');
              console.error('Status:', error.response.status);
              console.error('Headers:', error.response.headers);
              console.error('Data:', error.response.data);
            } else if (error.request) {
              console.error('Requisição feita mas sem resposta:', error.request);
            } else {
              console.error('Erro na configuração da requisição:', error.message);
            }
            
            toast.error(`Erro ao fazer upload do arquivo ${file.name}: ${error.message}`);
            continue;
          }
        } else {
          // Armazenar temporariamente para novas compras
          console.log('Armazenando arquivo temporariamente (nova compra)');
          const anexoTemp = {
            id: `temp-${Date.now()}-${i}`,
            arquivo: file,
            nome_original: file.name,
            tipo_arquivo: ACCEPTED_TYPES[file.type],
            tamanho_arquivo: file.size,
            isTemp: true
          };
          console.log('Anexo temporário criado:', anexoTemp);
          novosAnexos.push(anexoTemp);
        }
      }
      
      console.log('\n=== FINALIZANDO UPLOAD ===');
      console.log('Total de novos anexos processados:', novosAnexos.length);
      console.log('Anexos atuais:', anexosArray.length);
      console.log('Anexos após adição:', anexosArray.length + novosAnexos.length);
      
      onAnexosChange([...anexosArray, ...novosAnexos]);
      
      if (novosAnexos.length > 0) {
        toast.success(`${novosAnexos.length} arquivo(s) adicionado(s) com sucesso`);
      }
      
    } catch (error) {
      console.error('\n!!! ERRO GERAL NO PROCESSO DE UPLOAD !!!');
      console.error('Erro:', error);
      toast.error('Erro ao fazer upload dos arquivos');
    } finally {
      console.log('Finalizando processo de upload...');
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      console.log('=== FIM DO UPLOAD DE ARQUIVOS ===\n');
    }
  };

  const handleRemoveAnexo = async (anexoId) => {
    try {
      const anexo = anexosArray.find(a => a.id === anexoId);
      
      if (!anexo.isTemp && compraId) {
        // Remover anexo do servidor
        try {
          await api.deleteAnexoCompra(compraId, anexoId);
        } catch (error) {
          console.error('Erro ao remover anexo do servidor:', error);
          toast.error('Erro ao remover arquivo do servidor');
          return;
        }
      }
      
      // Limpar URL temporária se existir
      if (anexo.arquivo && typeof anexo.arquivo === 'string' && anexo.arquivo.startsWith('blob:')) {
        URL.revokeObjectURL(anexo.arquivo);
      }
      
      onAnexosChange(anexosArray.filter(a => a.id !== anexoId));
      toast.success('Arquivo removido com sucesso');
    } catch (error) {
      console.error('Erro ao remover anexo:', error);
      toast.error('Erro ao remover arquivo');
    }
  };

  const getFileIcon = (tipo) => {
    switch (tipo) {
      case 'IMAGE': return <Image className="w-5 h-5 text-green-600" />;
      case 'PDF': return <FileText className="w-5 h-5 text-red-600" />;
      default: return <File className="w-5 h-5 text-blue-600" />;
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setDragOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFileSelect(files);
    }
  };

  return (
    <div className="mt-6 p-4 border border-gray-200 rounded-lg bg-white">
      <h3 className="text-lg font-medium text-gray-900 mb-4">Anexos da Compra</h3>
      
      {/* Upload Area */}
      <div className="mb-4">
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept=".pdf,.jpg,.jpeg,.png,.gif,.bmp,.doc,.docx,.xls,.xlsx"
          onChange={(e) => handleFileSelect(e.target.files)}
          className="hidden"
        />
        
        <div
          onClick={() => fileInputRef.current?.click()}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`flex items-center justify-center w-full p-6 border-2 border-dashed rounded-lg cursor-pointer transition-colors ${
            dragOver 
              ? 'border-blue-400 bg-blue-50' 
              : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50'
          } ${uploading ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          <div className="text-center">
            <Upload className={`w-8 h-8 mx-auto mb-2 ${dragOver ? 'text-blue-500' : 'text-gray-400'}`} />
            <div className="text-sm text-gray-600">
              {uploading ? (
                <span className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
                  Enviando arquivos...
                </span>
              ) : (
                <>
                  <span className="font-medium text-blue-600">Clique para selecionar</span> ou arraste arquivos aqui
                </>
              )}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Formatos aceitos: PDF, imagens (JPG, PNG, GIF), documentos (DOC, XLS) • Máximo 10MB por arquivo
            </p>
          </div>
        </div>
      </div>

      {/* Lista de Anexos */}
      {anexosArray.length > 0 && (
        <div className="space-y-3">
          <h4 className="font-medium text-gray-700 flex items-center">
            Arquivos Anexados ({anexosArray.length})
          </h4>
          
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {anexosArray.map((anexo) => (
              <div key={anexo.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200 hover:bg-gray-100 transition-colors">
                <div className="flex items-center space-x-3 flex-1 min-w-0">
                  {getFileIcon(anexo.tipo_arquivo)}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate" title={anexo.nome_original}>
                      {anexo.nome_original}
                    </p>
                    <div className="flex items-center space-x-2 text-xs text-gray-500">
                      <span>{formatFileSize(anexo.tamanho_arquivo)}</span>
                      {anexo.isTemp && (
                        <>
                          <span>•</span>
                          <span className="flex items-center text-amber-600">
                            <AlertCircle className="w-3 h-3 mr-1" />
                            Será enviado ao salvar
                          </span>
                        </>
                      )}
                      {anexo.uploaded_at && !anexo.isTemp && (
                        <>
                          <span>•</span>
                          <span>Enviado em {new Date(anexo.uploaded_at).toLocaleDateString('pt-BR')}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
                
                <button
                  type="button"
                  onClick={() => handleRemoveAnexo(anexo.id)}
                  className="p-1 text-red-600 hover:text-red-800 hover:bg-red-50 rounded focus:outline-none focus:ring-2 focus:ring-red-500 transition-colors"
                  title="Remover arquivo"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
          
          {anexosArray.some(a => a.isTemp) && (
            <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-lg">
              <div className="flex items-start">
                <AlertCircle className="w-4 h-4 text-amber-600 mt-0.5 mr-2 flex-shrink-0" />
                <div className="text-sm text-amber-800">
                  <p className="font-medium">Arquivos pendentes</p>
                  <p>Os arquivos marcados serão enviados quando você salvar a compra.</p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AnexosCompraManager;