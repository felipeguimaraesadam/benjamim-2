import React, { useState, useRef, useEffect } from 'react';
import { Upload, X, FileText, Image, File, AlertCircle, FolderOpen, FileCheck, Building } from 'lucide-react';
import { toast } from 'sonner';
import api from '../../services/api';

const ArquivoObraManager = ({ obraId, arquivos = [], onArquivosChange, isEditing = false }) => {
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('FOTO');
  const fileInputRef = useRef(null);

  const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB
  const ACCEPTED_TYPES = {
    'image/jpeg': 'FOTO',
    'image/jpg': 'FOTO',
    'image/png': 'FOTO',
    'image/gif': 'FOTO',
    'image/bmp': 'FOTO',
    'application/pdf': 'DOCUMENTO',
    'application/msword': 'DOCUMENTO',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'DOCUMENTO',
    'application/vnd.ms-excel': 'DOCUMENTO',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'DOCUMENTO',
    'text/plain': 'DOCUMENTO',
    'application/vnd.ms-powerpoint': 'DOCUMENTO',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation': 'DOCUMENTO'
  };

  const CATEGORIA_CHOICES = [
    { value: 'FOTO', label: 'Foto', icon: Image, color: 'text-green-600' },
    { value: 'DOCUMENTO', label: 'Documento', icon: FileText, color: 'text-blue-600' },
    { value: 'PLANTA', label: 'Planta/Projeto', icon: Building, color: 'text-purple-600' },
    { value: 'CONTRATO', label: 'Contrato', icon: FileCheck, color: 'text-orange-600' },
    { value: 'LICENCA', label: 'Licença', icon: FolderOpen, color: 'text-red-600' },
    { value: 'OUTROS', label: 'Outros', icon: File, color: 'text-gray-600' }
  ];

  // Carregar arquivos da obra quando o componente for montado
  useEffect(() => {
    if (obraId && isEditing) {
      loadArquivos();
    }
  }, [obraId, isEditing]);

  const loadArquivos = async () => {
    if (!obraId) return;
    
    setLoading(true);
    try {
      const response = await api.get(`/arquivos-obra/?obra=${obraId}`);
      onArquivosChange(response.data.results || response.data || []);
    } catch (error) {
      console.error('Erro ao carregar arquivos:', error);
      toast.error('Erro ao carregar arquivos da obra');
    } finally {
      setLoading(false);
    }
  };

  const validateFile = (file) => {
    if (file.size > MAX_FILE_SIZE) {
      toast.error(`Arquivo "${file.name}" excede o limite de 50MB`);
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
      const novosArquivos = [];
      
      for (const file of validFiles) {
        if (isEditing && obraId) {
          // Upload direto para obra existente
          const formData = new FormData();
          formData.append('arquivo', file);
          formData.append('obra', obraId);
          formData.append('categoria', selectedCategory);
          formData.append('descricao', '');
          
          try {
            const response = await api.post('/arquivos-obra/', formData, {
              headers: {
                'Content-Type': 'multipart/form-data'
              }
            });
            novosArquivos.push(response.data);
          } catch (error) {
            console.error('Erro ao fazer upload do arquivo:', file.name, error);
            toast.error(`Erro ao fazer upload do arquivo: ${file.name}`);
          }
        } else {
          // Preparar para upload posterior (nova obra)
          const arquivoTemp = {
            id: `temp-${Date.now()}-${Math.random()}`,
            arquivo: file,
            nome_original: file.name,
            categoria: selectedCategory,
            tipo_arquivo: ACCEPTED_TYPES[file.type],
            tamanho_arquivo: file.size,
            isTemp: true
          };
          novosArquivos.push(arquivoTemp);
        }
      }
      
      onArquivosChange([...arquivos, ...novosArquivos]);
      toast.success(`${novosArquivos.length} arquivo(s) adicionado(s) com sucesso`);
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

  const handleRemoveArquivo = async (arquivoId) => {
    try {
      const arquivo = arquivos.find(a => a.id === arquivoId);
      
      if (!arquivo.isTemp && obraId) {
        // Deletar arquivo do servidor
        await api.delete(`/arquivos-obra/${arquivoId}/`);
      }
      
      // Limpar URL temporária se existir
      if (arquivo.arquivo && typeof arquivo.arquivo === 'string' && arquivo.arquivo.startsWith('blob:')) {
        URL.revokeObjectURL(arquivo.arquivo);
      }
      
      onArquivosChange(arquivos.filter(a => a.id !== arquivoId));
      toast.success('Arquivo removido com sucesso');
    } catch (error) {
      console.error('Erro ao remover arquivo:', error);
      toast.error('Erro ao remover arquivo');
    }
  };

  const handleBulkDelete = async (arquivoIds) => {
    if (arquivoIds.length === 0) return;
    
    try {
      // Separar arquivos temporários dos permanentes
      const tempIds = [];
      const permanentIds = [];
      
      arquivoIds.forEach(id => {
        const arquivo = arquivos.find(a => a.id === id);
        if (arquivo?.isTemp) {
          tempIds.push(id);
        } else {
          permanentIds.push(id);
        }
      });
      
      // Deletar arquivos permanentes do servidor
      if (permanentIds.length > 0) {
        await api.post('/arquivos-obra/bulk_delete/', {
          arquivo_ids: permanentIds
        });
      }
      
      // Remover todos os arquivos da lista local
      onArquivosChange(arquivos.filter(a => !arquivoIds.includes(a.id)));
      toast.success(`${arquivoIds.length} arquivo(s) removido(s) com sucesso`);
    } catch (error) {
      console.error('Erro ao remover arquivos:', error);
      toast.error('Erro ao remover arquivos');
    }
  };

  const getCategoryIcon = (categoria) => {
    const categoryInfo = CATEGORIA_CHOICES.find(c => c.value === categoria);
    if (!categoryInfo) return <File className="w-5 h-5 text-gray-600" />;
    
    const IconComponent = categoryInfo.icon;
    return <IconComponent className={`w-5 h-5 ${categoryInfo.color}`} />;
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

  const groupedArquivos = arquivos.reduce((acc, arquivo) => {
    const categoria = arquivo.categoria || 'OUTROS';
    if (!acc[categoria]) acc[categoria] = [];
    acc[categoria].push(arquivo);
    return acc;
  }, {});

  if (loading) {
    return (
      <div className="mt-6 p-4 border border-gray-200 rounded-lg bg-white">
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mr-3"></div>
          <span className="text-gray-600">Carregando arquivos...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-6 p-4 border border-gray-200 rounded-lg bg-white">
      <h3 className="text-lg font-medium text-gray-900 mb-4">Arquivos da Obra</h3>
      
      {/* Seletor de Categoria */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Categoria do arquivo
        </label>
        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
        >
          {CATEGORIA_CHOICES.map(categoria => (
            <option key={categoria.value} value={categoria.value}>
              {categoria.label}
            </option>
          ))}
        </select>
      </div>
      
      {/* Upload Area */}
      <div className="mb-4">
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept=".pdf,.jpg,.jpeg,.png,.gif,.bmp,.doc,.docx,.xls,.xlsx,.txt,.ppt,.pptx"
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
              Formatos aceitos: PDF, imagens (JPG, PNG, GIF), documentos (DOC, XLS, PPT) • Máximo 50MB por arquivo
            </p>
            <p className="text-xs text-blue-600 mt-1">
              Categoria selecionada: {CATEGORIA_CHOICES.find(c => c.value === selectedCategory)?.label}
            </p>
          </div>
        </div>
      </div>

      {/* Lista de Arquivos Agrupados por Categoria */}
      {Object.keys(groupedArquivos).length > 0 && (
        <div className="space-y-6">
          {Object.entries(groupedArquivos).map(([categoria, arquivosCategoria]) => {
            const categoryInfo = CATEGORIA_CHOICES.find(c => c.value === categoria);
            const IconComponent = categoryInfo?.icon || File;
            
            return (
              <div key={categoria} className="border border-gray-200 rounded-lg p-4">
                <h4 className="font-medium text-gray-700 flex items-center mb-3">
                  <IconComponent className={`w-5 h-5 mr-2 ${categoryInfo?.color || 'text-gray-600'}`} />
                  {categoryInfo?.label || categoria} ({arquivosCategoria.length})
                </h4>
                
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {arquivosCategoria.map((arquivo) => (
                    <div key={arquivo.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200 hover:bg-gray-100 transition-colors">
                      <div className="flex items-center space-x-3 flex-1 min-w-0">
                        {getCategoryIcon(arquivo.categoria)}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate" title={arquivo.nome_original || arquivo.arquivo?.name}>
                            {arquivo.nome_original || arquivo.arquivo?.name}
                          </p>
                          <div className="flex items-center space-x-2 text-xs text-gray-500">
                            <span>{formatFileSize(arquivo.tamanho_arquivo || arquivo.arquivo?.size || 0)}</span>
                            {arquivo.isTemp && (
                              <>
                                <span>•</span>
                                <span className="flex items-center text-amber-600">
                                  <AlertCircle className="w-3 h-3 mr-1" />
                                  Será enviado ao salvar
                                </span>
                              </>
                            )}
                            {arquivo.uploaded_at && !arquivo.isTemp && (
                              <>
                                <span>•</span>
                                <span>Enviado em {new Date(arquivo.uploaded_at).toLocaleDateString('pt-BR')}</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      <button
                        type="button"
                        onClick={() => handleRemoveArquivo(arquivo.id)}
                        className="p-1 text-red-600 hover:text-red-800 hover:bg-red-50 rounded focus:outline-none focus:ring-2 focus:ring-red-500 transition-colors"
                        title="Remover arquivo"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
          
          {arquivos.some(a => a.isTemp) && (
            <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-lg">
              <div className="flex items-start">
                <AlertCircle className="w-4 h-4 text-amber-600 mt-0.5 mr-2 flex-shrink-0" />
                <div className="text-sm text-amber-800">
                  <p className="font-medium">Arquivos pendentes</p>
                  <p>Os arquivos marcados serão enviados quando você salvar a obra.</p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ArquivoObraManager;