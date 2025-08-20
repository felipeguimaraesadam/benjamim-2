import React, { useState, useRef } from 'react';
import { Upload, X, FileText, Image, File, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

const AnexosCompraManager = ({ compraId, anexos = [], onAnexosChange, isEditing = false }) => {
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef(null);

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
    const validFiles = Array.from(files).filter(validateFile);
    if (validFiles.length === 0) return;

    setUploading(true);
    
    try {
      const novosAnexos = [];
      
      for (const file of validFiles) {
        if (isEditing && compraId) {
          // Upload direto para compra existente
          try {
            const formData = new FormData();
            formData.append('arquivo', file);
            formData.append('compra', compraId);
            
            const response = await api.uploadAnexoCompra(compraId, formData);
            const anexoSalvo = response.data;
            
            const anexoFormatado = {
              id: anexoSalvo.id,
              arquivo: anexoSalvo.arquivo,
              nome_original: anexoSalvo.nome_original,
              tipo_arquivo: anexoSalvo.tipo_arquivo,
              tamanho_arquivo: anexoSalvo.tamanho_arquivo,
              uploaded_at: anexoSalvo.uploaded_at,
              isTemp: false
            };
            novosAnexos.push(anexoFormatado);
          } catch (error) {
            console.error('Erro ao fazer upload do arquivo:', error);
            toast.error(`Erro ao enviar ${file.name}`);
            continue;
          }
        } else {
          // Preparar para upload posterior (nova compra)
          const anexoTemp = {
            id: `temp-${Date.now()}-${Math.random()}`,
            arquivo: file,
            nome_original: file.name,
            tipo_arquivo: ACCEPTED_TYPES[file.type],
            tamanho_arquivo: file.size,
            isTemp: true
          };
          novosAnexos.push(anexoTemp);
        }
      }
      
      onAnexosChange([...anexos, ...novosAnexos]);
      toast.success(`${novosAnexos.length} arquivo(s) adicionado(s) com sucesso`);
    } catch (error) {
      console.error('Erro ao fazer upload:', error);
      toast.error('Erro ao fazer upload dos arquivos');
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleRemoveAnexo = async (anexoId) => {
    try {
      const anexo = anexos.find(a => a.id === anexoId);
      
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
      
      onAnexosChange(anexos.filter(a => a.id !== anexoId));
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
            <p className="text-sm text-gray-600">
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
            </p>
            <p className="text-xs text-gray-500 mt-1">
              Formatos aceitos: PDF, imagens (JPG, PNG, GIF), documentos (DOC, XLS) • Máximo 10MB por arquivo
            </p>
          </div>
        </div>
      </div>

      {/* Lista de Anexos */}
      {anexos.length > 0 && (
        <div className="space-y-3">
          <h4 className="font-medium text-gray-700 flex items-center">
            Arquivos Anexados ({anexos.length})
          </h4>
          
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {anexos.map((anexo) => (
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
          
          {anexos.some(a => a.isTemp) && (
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