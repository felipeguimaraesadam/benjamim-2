# Documentação Técnica - Melhorias do Sistema de Compras e Obras

## 1. Visão Geral das Funcionalidades

Este documento detalha as implementações necessárias para as seguintes funcionalidades:

### 1.1 Seção de Compras
- **Pagamento Parcelado**: Sistema de pagamentos únicos ou parcelados com datas específicas
- **Gerenciamento de Anexos**: Upload e remoção de PDFs e imagens
- **Geração de PDF em Lote**: Seleção múltipla e geração de relatórios consolidados

### 1.2 Seção de Obras
- **Exclusão de Anexos**: Botão "X" para remover imagens
- **Suporte Expandido de Arquivos**: PDFs e outros documentos além de imagens

## 2. Alterações no Backend

### 2.1 Modelos de Dados

#### 2.1.1 Novo Modelo: Parcela de Compra
```python
# backend/core/models.py

class ParcelaCompra(models.Model):
    compra = models.ForeignKey(Compra, on_delete=models.CASCADE, related_name='parcelas')
    numero_parcela = models.PositiveIntegerField()
    valor_parcela = models.DecimalField(max_digits=15, decimal_places=2)
    data_vencimento = models.DateField()
    data_pagamento = models.DateField(null=True, blank=True)
    status = models.CharField(
        max_length=20,
        choices=[
            ('PENDENTE', 'Pendente'),
            ('PAGO', 'Pago'),
            ('VENCIDO', 'Vencido')
        ],
        default='PENDENTE'
    )
    observacoes = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['numero_parcela']
        unique_together = ['compra', 'numero_parcela']

    def __str__(self):
        return f"Parcela {self.numero_parcela} - {self.compra.fornecedor}"
```

#### 2.1.2 Modelo: Anexo de Compra
```python
# backend/core/models.py

def anexo_compra_path(instance, filename):
    """Generates path for purchase attachments"""
    ext = filename.split('.')[-1]
    filename_base = f"{uuid4().hex}"
    filename = f"{filename_base}.{ext}"
    return os.path.join('anexos_compras', str(instance.compra.id), filename)

class AnexoCompra(models.Model):
    compra = models.ForeignKey(Compra, on_delete=models.CASCADE, related_name='anexos')
    arquivo = models.FileField(upload_to=anexo_compra_path)
    nome_original = models.CharField(max_length=255)
    tipo_arquivo = models.CharField(max_length=50)  # 'PDF', 'IMAGE', 'DOCUMENT'
    tamanho_arquivo = models.PositiveIntegerField()  # em bytes
    uploaded_at = models.DateTimeField(auto_now_add=True)
    uploaded_by = models.ForeignKey('Usuario', on_delete=models.SET_NULL, null=True)

    def __str__(self):
        return f"Anexo: {self.nome_original} - {self.compra.fornecedor}"
```

#### 2.1.3 Atualização do Modelo Compra
```python
# backend/core/models.py

class Compra(models.Model):
    # ... campos existentes ...
    
    # Novos campos para pagamento parcelado
    tipo_pagamento = models.CharField(
        max_length=20,
        choices=[
            ('UNICO', 'Pagamento Único'),
            ('PARCELADO', 'Pagamento Parcelado')
        ],
        default='UNICO'
    )
    quantidade_parcelas = models.PositiveIntegerField(default=1)
    
    def save(self, *args, **kwargs):
        # ... lógica existente ...
        super().save(*args, **kwargs)
        
        # Criar parcelas automaticamente se for pagamento parcelado
        if self.tipo_pagamento == 'PARCELADO' and not self.parcelas.exists():
            self.criar_parcelas()
    
    def criar_parcelas(self):
        """Cria parcelas baseadas na quantidade especificada"""
        if self.quantidade_parcelas <= 1:
            return
            
        valor_parcela = self.valor_total_liquido / self.quantidade_parcelas
        
        for i in range(1, self.quantidade_parcelas + 1):
            # Data de vencimento: primeira parcela 30 dias após compra, demais mensalmente
            data_vencimento = self.data_compra + timedelta(days=30 * i)
            
            ParcelaCompra.objects.create(
                compra=self,
                numero_parcela=i,
                valor_parcela=valor_parcela,
                data_vencimento=data_vencimento
            )
```

#### 2.1.4 Atualização do Modelo FotoObra
```python
# backend/core/models.py

def obra_arquivo_path(instance, filename):
    """Generates path for obra files (images and documents)"""
    ext = filename.split('.')[-1]
    filename_base = f"{uuid4().hex}"
    filename = f"{filename_base}.{ext}"
    return os.path.join('arquivos_obras', str(instance.obra.id), filename)

class ArquivoObra(models.Model):
    """Modelo unificado para arquivos de obra (imagens, PDFs, documentos)"""
    obra = models.ForeignKey(Obra, related_name='arquivos', on_delete=models.CASCADE)
    arquivo = models.FileField(upload_to=obra_arquivo_path)
    nome_original = models.CharField(max_length=255)
    tipo_arquivo = models.CharField(
        max_length=20,
        choices=[
            ('IMAGE', 'Imagem'),
            ('PDF', 'PDF'),
            ('DOCUMENT', 'Documento')
        ]
    )
    tamanho_arquivo = models.PositiveIntegerField()  # em bytes
    descricao = models.CharField(max_length=255, blank=True, null=True)
    uploaded_at = models.DateTimeField(auto_now_add=True)
    uploaded_by = models.ForeignKey('Usuario', on_delete=models.SET_NULL, null=True)

    def __str__(self):
        return f"Arquivo: {self.nome_original} - {self.obra.nome_obra}"

# Manter FotoObra para compatibilidade, mas migrar gradualmente para ArquivoObra
```

### 2.2 Serializers

#### 2.2.1 Serializer para Parcelas
```python
# backend/core/serializers.py

class ParcelaCompraSerializer(serializers.ModelSerializer):
    class Meta:
        model = ParcelaCompra
        fields = '__all__'
        read_only_fields = ['created_at', 'updated_at']

class AnexoCompraSerializer(serializers.ModelSerializer):
    class Meta:
        model = AnexoCompra
        fields = '__all__'
        read_only_fields = ['uploaded_at', 'uploaded_by', 'tamanho_arquivo']
    
    def create(self, validated_data):
        # Extrair informações do arquivo
        arquivo = validated_data['arquivo']
        validated_data['nome_original'] = arquivo.name
        validated_data['tamanho_arquivo'] = arquivo.size
        
        # Determinar tipo do arquivo
        ext = arquivo.name.split('.')[-1].lower()
        if ext in ['jpg', 'jpeg', 'png', 'gif', 'bmp']:
            validated_data['tipo_arquivo'] = 'IMAGE'
        elif ext == 'pdf':
            validated_data['tipo_arquivo'] = 'PDF'
        else:
            validated_data['tipo_arquivo'] = 'DOCUMENT'
            
        return super().create(validated_data)
```

#### 2.2.2 Atualização do CompraSerializer
```python
# backend/core/serializers.py

class CompraSerializer(serializers.ModelSerializer):
    parcelas = ParcelaCompraSerializer(many=True, read_only=True)
    anexos = AnexoCompraSerializer(many=True, read_only=True)
    
    class Meta:
        model = Compra
        fields = '__all__'
        
    def create(self, validated_data):
        compra = super().create(validated_data)
        
        # Criar parcelas se necessário
        if compra.tipo_pagamento == 'PARCELADO':
            compra.criar_parcelas()
            
        return compra
```

### 2.3 Views e Endpoints

#### 2.3.1 ViewSet para Parcelas
```python
# backend/core/views.py

class ParcelaCompraViewSet(viewsets.ModelViewSet):
    queryset = ParcelaCompra.objects.all()
    serializer_class = ParcelaCompraSerializer
    permission_classes = [IsNivelAdmin | IsNivelGerente]
    
    def get_queryset(self):
        compra_id = self.request.query_params.get('compra_id')
        if compra_id:
            return self.queryset.filter(compra__id=compra_id)
        return self.queryset
    
    @action(detail=True, methods=['post'])
    def marcar_como_pago(self, request, pk=None):
        parcela = self.get_object()
        parcela.status = 'PAGO'
        parcela.data_pagamento = request.data.get('data_pagamento', timezone.now().date())
        parcela.save()
        return Response({'status': 'Parcela marcada como paga'})

class AnexoCompraViewSet(viewsets.ModelViewSet):
    queryset = AnexoCompra.objects.all()
    serializer_class = AnexoCompraSerializer
    permission_classes = [IsNivelAdmin | IsNivelGerente]
    parser_classes = (MultiPartParser, FormParser)
    
    def get_queryset(self):
        compra_id = self.request.query_params.get('compra_id')
        if compra_id:
            return self.queryset.filter(compra__id=compra_id)
        return self.queryset
    
    def perform_create(self, serializer):
        serializer.save(uploaded_by=self.request.user)
```

#### 2.3.2 Endpoint para Geração de PDF em Lote
```python
# backend/core/views.py

class GerarPDFComprasLoteView(APIView):
    permission_classes = [IsNivelAdmin | IsNivelGerente]
    
    def post(self, request):
        compra_ids = request.data.get('compra_ids', [])
        
        if not compra_ids:
            return Response(
                {'error': 'Nenhuma compra selecionada'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            compras = Compra.objects.filter(
                id__in=compra_ids
            ).prefetch_related('itens__material', 'anexos', 'parcelas')
            
            # Gerar PDF consolidado
            pdf_buffer = self.gerar_pdf_consolidado(compras)
            
            response = HttpResponse(pdf_buffer.getvalue(), content_type='application/pdf')
            response['Content-Disposition'] = f'attachment; filename="compras_consolidadas_{timezone.now().strftime("%Y%m%d_%H%M%S")}.pdf"'
            
            return response
            
        except Exception as e:
            return Response(
                {'error': f'Erro ao gerar PDF: {str(e)}'}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    def gerar_pdf_consolidado(self, compras):
        # Implementar lógica de geração de PDF usando reportlab
        # Similar ao GerarRelatorioPDFObraView existente
        pass
```

### 2.4 URLs
```python
# backend/core/urls.py

# Adicionar aos urlpatterns:
router.register(r'parcelas-compra', ParcelaCompraViewSet)
router.register(r'anexos-compra', AnexoCompraViewSet)
router.register(r'arquivos-obra', ArquivoObraViewSet)

urlpatterns = [
    # ... URLs existentes ...
    path('compras/gerar-pdf-lote/', GerarPDFComprasLoteView.as_view(), name='gerar-pdf-compras-lote'),
]
```

## 3. Alterações no Frontend

### 3.1 Componente de Pagamento Parcelado

#### 3.1.1 Componente PagamentoParceladoForm
```jsx
// frontend/src/components/forms/PagamentoParceladoForm.jsx

import React, { useState, useEffect } from 'react';
import DatePicker from 'react-datepicker';

const PagamentoParceladoForm = ({ 
  tipoPagamento, 
  onTipoPagamentoChange, 
  parcelas, 
  onParcelasChange,
  valorTotal 
}) => {
  const [quantidadeParcelas, setQuantidadeParcelas] = useState(1);
  const [parcelasCustomizadas, setParcelasCustomizadas] = useState([]);

  useEffect(() => {
    if (tipoPagamento === 'PARCELADO' && quantidadeParcelas > 1) {
      const valorParcela = valorTotal / quantidadeParcelas;
      const novasParcelas = Array.from({ length: quantidadeParcelas }, (_, index) => ({
        numero: index + 1,
        valor: valorParcela,
        dataVencimento: new Date(Date.now() + (index + 1) * 30 * 24 * 60 * 60 * 1000)
      }));
      setParcelasCustomizadas(novasParcelas);
      onParcelasChange(novasParcelas);
    }
  }, [tipoPagamento, quantidadeParcelas, valorTotal, onParcelasChange]);

  const handleParcelaChange = (index, field, value) => {
    const novasParcelas = [...parcelasCustomizadas];
    novasParcelas[index][field] = value;
    setParcelasCustomizadas(novasParcelas);
    onParcelasChange(novasParcelas);
  };

  return (
    <div className="mt-6 p-4 border border-gray-200 rounded-lg">
      <h3 className="text-lg font-medium mb-4">Forma de Pagamento</h3>
      
      <div className="space-y-4">
        <div className="flex space-x-4">
          <label className="flex items-center">
            <input
              type="radio"
              value="UNICO"
              checked={tipoPagamento === 'UNICO'}
              onChange={(e) => onTipoPagamentoChange(e.target.value)}
              className="mr-2"
            />
            Pagamento Único
          </label>
          
          <label className="flex items-center">
            <input
              type="radio"
              value="PARCELADO"
              checked={tipoPagamento === 'PARCELADO'}
              onChange={(e) => onTipoPagamentoChange(e.target.value)}
              className="mr-2"
            />
            Pagamento Parcelado
          </label>
        </div>

        {tipoPagamento === 'PARCELADO' && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Quantidade de Parcelas
              </label>
              <select
                value={quantidadeParcelas}
                onChange={(e) => setQuantidadeParcelas(parseInt(e.target.value))}
                className="w-32 px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
              >
                {Array.from({ length: 12 }, (_, i) => i + 2).map(num => (
                  <option key={num} value={num}>{num}x</option>
                ))}
              </select>
            </div>

            <div className="space-y-3">
              <h4 className="font-medium">Detalhes das Parcelas</h4>
              {parcelasCustomizadas.map((parcela, index) => (
                <div key={index} className="flex items-center space-x-4 p-3 bg-gray-50 rounded">
                  <span className="w-16 text-sm font-medium">
                    {parcela.numero}ª parcela
                  </span>
                  
                  <div>
                    <label className="block text-xs text-gray-600">Valor</label>
                    <input
                      type="number"
                      step="0.01"
                      value={parcela.valor}
                      onChange={(e) => handleParcelaChange(index, 'valor', parseFloat(e.target.value))}
                      className="w-24 px-2 py-1 text-sm border border-gray-300 rounded"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-xs text-gray-600">Data de Vencimento</label>
                    <DatePicker
                      selected={parcela.dataVencimento}
                      onChange={(date) => handleParcelaChange(index, 'dataVencimento', date)}
                      dateFormat="dd/MM/yyyy"
                      className="w-28 px-2 py-1 text-sm border border-gray-300 rounded"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PagamentoParceladoForm;
```

### 3.2 Componente de Gerenciamento de Anexos

#### 3.2.1 Componente AnexosCompraManager
```jsx
// frontend/src/components/forms/AnexosCompraManager.jsx

import React, { useState, useRef } from 'react';
import { Upload, X, FileText, Image, File } from 'lucide-react';

const AnexosCompraManager = ({ compraId, anexos = [], onAnexosChange, isEditing = false }) => {
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);

  const handleFileSelect = async (event) => {
    const files = Array.from(event.target.files);
    if (files.length === 0) return;

    setUploading(true);
    
    try {
      const novosAnexos = [];
      
      for (const file of files) {
        if (isEditing && compraId) {
          // Upload direto para compra existente
          const formData = new FormData();
          formData.append('arquivo', file);
          formData.append('compra', compraId);
          
          const response = await api.createAnexoCompra(formData);
          novosAnexos.push(response.data);
        } else {
          // Preparar para upload posterior (nova compra)
          const anexoTemp = {
            id: `temp-${Date.now()}-${Math.random()}`,
            arquivo: file,
            nome_original: file.name,
            tipo_arquivo: getFileType(file.name),
            tamanho_arquivo: file.size,
            isTemp: true
          };
          novosAnexos.push(anexoTemp);
        }
      }
      
      onAnexosChange([...anexos, ...novosAnexos]);
    } catch (error) {
      console.error('Erro ao fazer upload:', error);
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
        await api.deleteAnexoCompra(anexoId);
      }
      
      onAnexosChange(anexos.filter(a => a.id !== anexoId));
    } catch (error) {
      console.error('Erro ao remover anexo:', error);
    }
  };

  const getFileType = (filename) => {
    const ext = filename.split('.').pop().toLowerCase();
    if (['jpg', 'jpeg', 'png', 'gif', 'bmp'].includes(ext)) return 'IMAGE';
    if (ext === 'pdf') return 'PDF';
    return 'DOCUMENT';
  };

  const getFileIcon = (tipo) => {
    switch (tipo) {
      case 'IMAGE': return <Image className="w-5 h-5" />;
      case 'PDF': return <FileText className="w-5 h-5" />;
      default: return <File className="w-5 h-5" />;
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="mt-6 p-4 border border-gray-200 rounded-lg">
      <h3 className="text-lg font-medium mb-4">Anexos da Compra</h3>
      
      {/* Upload Area */}
      <div className="mb-4">
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept=".pdf,.jpg,.jpeg,.png,.gif,.bmp,.doc,.docx,.xls,.xlsx"
          onChange={handleFileSelect}
          className="hidden"
        />
        
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="flex items-center justify-center w-full p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:opacity-50"
        >
          <Upload className="w-6 h-6 mr-2" />
          {uploading ? 'Enviando...' : 'Clique para adicionar arquivos'}
        </button>
        
        <p className="text-sm text-gray-500 mt-2">
          Formatos aceitos: PDF, imagens (JPG, PNG, GIF), documentos (DOC, XLS)
        </p>
      </div>

      {/* Lista de Anexos */}
      {anexos.length > 0 && (
        <div className="space-y-2">
          <h4 className="font-medium text-gray-700">Arquivos Anexados</h4>
          {anexos.map((anexo) => (
            <div key={anexo.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-3">
                {getFileIcon(anexo.tipo_arquivo)}
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    {anexo.nome_original}
                  </p>
                  <p className="text-xs text-gray-500">
                    {formatFileSize(anexo.tamanho_arquivo)}
                    {anexo.isTemp && ' (será enviado ao salvar)'}
                  </p>
                </div>
              </div>
              
              <button
                type="button"
                onClick={() => handleRemoveAnexo(anexo.id)}
                className="p-1 text-red-600 hover:text-red-800 focus:outline-none"
                title="Remover anexo"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AnexosCompraManager;
```

### 3.3 Atualização do CompraForm

```jsx
// frontend/src/components/forms/CompraForm.jsx
// Adicionar imports
import PagamentoParceladoForm from './PagamentoParceladoForm';
import AnexosCompraManager from './AnexosCompraManager';

// Adicionar estados no componente CompraForm
const [tipoPagamento, setTipoPagamento] = useState(initialData?.tipo_pagamento || 'UNICO');
const [parcelas, setParcelas] = useState([]);
const [anexos, setAnexos] = useState(initialData?.anexos || []);

// Adicionar antes do botão de submit
<PagamentoParceladoForm
  tipoPagamento={tipoPagamento}
  onTipoPagamentoChange={setTipoPagamento}
  parcelas={parcelas}
  onParcelasChange={setParcelas}
  valorTotal={totalGeralCalculado}
/>

<AnexosCompraManager
  compraId={initialData?.id}
  anexos={anexos}
  onAnexosChange={setAnexos}
  isEditing={!!initialData?.id}
/>
```

### 3.4 Componente de Seleção Múltipla e PDF

#### 3.4.1 Atualização da ComprasTable
```jsx
// frontend/src/components/tables/ComprasTable.jsx
// Adicionar checkbox na primeira coluna

const ComprasTable = ({ 
  compras, 
  onEdit, 
  onDelete, 
  onViewDetails, 
  onApprove, 
  isLoading,
  onDuplicate,
  selectedCompras = [],
  onCompraSelect,
  onSelectAll
}) => {
  // ... código existente ...
  
  return (
    <div className="overflow-x-auto shadow-md sm:rounded-lg">
      <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400">
        <thead className="text-xs text-gray-700 dark:text-gray-300 uppercase bg-gray-50 dark:bg-gray-700">
          <tr>
            <th scope="col" className="px-6 py-3">
              <input
                type="checkbox"
                checked={compras.length > 0 && selectedCompras.length === compras.length}
                onChange={onSelectAll}
                className="w-4 h-4 text-primary-600 bg-gray-100 border-gray-300 rounded focus:ring-primary-500"
              />
            </th>
            {/* ... outras colunas existentes ... */}
          </tr>
        </thead>
        <tbody>
          {compras.map(compra => (
            <tr key={compra.id} className="bg-white border-b hover:bg-gray-50">
              <td className="px-6 py-4">
                <input
                  type="checkbox"
                  checked={selectedCompras.includes(compra.id)}
                  onChange={() => onCompraSelect(compra.id)}
                  className="w-4 h-4 text-primary-600 bg-gray-100 border-gray-300 rounded focus:ring-primary-500"
                />
              </td>
              {/* ... outras células existentes ... */}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
```

#### 3.4.2 Atualização da ComprasPage
```jsx
// frontend/src/pages/ComprasPage.jsx
// Adicionar estados para seleção múltipla

const [selectedCompras, setSelectedCompras] = useState([]);
const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);

const handleCompraSelect = (compraId) => {
  setSelectedCompras(prev => 
    prev.includes(compraId) 
      ? prev.filter(id => id !== compraId)
      : [...prev, compraId]
  );
};

const handleSelectAll = () => {
  setSelectedCompras(
    selectedCompras.length === compras.length 
      ? [] 
      : compras.map(c => c.id)
  );
};

const handleGeneratePDF = async () => {
  if (selectedCompras.length === 0) {
    showErrorToast('Selecione pelo menos uma compra para gerar o PDF.');
    return;
  }
  
  setIsGeneratingPDF(true);
  try {
    const response = await api.gerarPDFComprasLote({ compra_ids: selectedCompras });
    
    // Download do PDF
    const blob = new Blob([response.data], { type: 'application/pdf' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `compras_selecionadas_${new Date().toISOString().split('T')[0]}.pdf`;
    link.click();
    window.URL.revokeObjectURL(url);
    
    showSuccessToast('PDF gerado com sucesso!');
  } catch (error) {
    showErrorToast('Erro ao gerar PDF. Tente novamente.');
  } finally {
    setIsGeneratingPDF(false);
  }
};

// Adicionar botão na interface
<div className="flex justify-between items-center mb-6">
  <h1 className="text-3xl font-bold text-gray-800">Gestão de Compras</h1>
  <div className="flex space-x-3">
    {selectedCompras.length > 0 && (
      <button
        onClick={handleGeneratePDF}
        disabled={isGeneratingPDF}
        className="bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-4 rounded-md disabled:opacity-50"
      >
        {isGeneratingPDF ? 'Gerando PDF...' : `Gerar PDF (${selectedCompras.length})`}
      </button>
    )}
    <button
      onClick={handleAddNewCompraClick}
      className="bg-primary-600 hover:bg-primary-700 text-white font-medium py-2 px-4 rounded-md"
    >
      Adicionar Nova Compra
    </button>
  </div>
</div>
```

### 3.5 Melhorias na Seção de Obras

#### 3.5.1 Atualização do ObraGaleria com Botão de Exclusão
```jsx
// frontend/src/components/obra/ObraGaleria.jsx
// Adicionar botão X para cada imagem

const handleDeleteFoto = async (fotoId) => {
  if (!window.confirm('Tem certeza que deseja excluir esta foto?')) {
    return;
  }
  
  try {
    await apiClient.delete(`/fotosobras/${fotoId}/`);
    setFotos(prev => prev.filter(foto => foto.id !== fotoId));
    // Mostrar toast de sucesso
  } catch (error) {
    console.error('Erro ao excluir foto:', error);
    // Mostrar toast de erro
  }
};

// No JSX, adicionar botão X
<div className="group relative border rounded-lg overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300 ease-in-out">
  <img
    src={foto.imagem}
    alt={foto.descricao || `Foto da obra ${obraId}`}
    className="w-full h-48 object-cover cursor-pointer"
    onClick={() => openModal(foto)}
  />
  
  {/* Botão de exclusão */}
  <button
    onClick={(e) => {
      e.stopPropagation();
      handleDeleteFoto(foto.id);
    }}
    className="absolute top-2 right-2 bg-red-600 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200 hover:bg-red-700"
    title="Excluir foto"
  >
    <X className="w-4 h-4" />
  </button>
  
  {/* ... resto do código ... */}
</div>
```

#### 3.5.2 Atualização do ObraFotosUpload para Múltiplos Tipos
```jsx
// frontend/src/components/obra/ObraFotosUpload.jsx
// Atualizar para aceitar múltiplos tipos de arquivo

<input
  type="file"
  id="arquivoObraInput"
  ref={fileInputRef}
  accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.txt"
  onChange={handleFileChange}
  className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
/>

// Atualizar label
<label htmlFor="arquivoObraInput" className="block text-sm font-medium text-gray-700 mb-1">
  Selecionar Arquivo (Imagens, PDFs, Documentos)
</label>
```

## 4. Serviços de API

### 4.1 Novos Endpoints
```javascript
// frontend/src/services/api.js

// Parcelas
export const getParcelasCompra = (compraId) => 
  apiClient.get(`/parcelas-compra/?compra_id=${compraId}`);

export const updateParcela = (parcelaId, data) => 
  apiClient.patch(`/parcelas-compra/${parcelaId}/`, data);

export const marcarParcelaComoPaga = (parcelaId, dataPagamento) => 
  apiClient.post(`/parcelas-compra/${parcelaId}/marcar_como_pago/`, { data_pagamento: dataPagamento });

// Anexos de Compra
export const getAnexosCompra = (compraId) => 
  apiClient.get(`/anexos-compra/?compra_id=${compraId}`);

export const createAnexoCompra = (formData) => 
  apiClient.post('/anexos-compra/', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });

export const deleteAnexoCompra = (anexoId) => 
  apiClient.delete(`/anexos-compra/${anexoId}/`);

// PDF em Lote
export const gerarPDFComprasLote = (data) => 
  apiClient.post('/compras/gerar-pdf-lote/', data, {
    responseType: 'blob'
  });

// Arquivos de Obra
export const getArquivosObra = (obraId) => 
  apiClient.get(`/arquivos-obra/?obra_id=${obraId}`);

export const createArquivoObra = (formData) => 
  apiClient.post('/arquivos-obra/', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });

export const deleteArquivoObra = (arquivoId) => 
  apiClient.delete(`/arquivos-obra/${arquivoId}/`);
```

## 5. Migrações de Banco de Dados

### 5.1 Migração para Parcelas
```python
# backend/core/migrations/XXXX_add_parcelas_compra.py

from django.db import migrations, models
import django.db.models.deletion

class Migration(migrations.Migration):
    dependencies = [
        ('core', 'XXXX_previous_migration'),
    ]

    operations = [
        migrations.AddField(
            model_name='compra',
            name='tipo_pagamento',
            field=models.CharField(
                choices=[('UNICO', 'Pagamento Único'), ('PARCELADO', 'Pagamento Parcelado')],
                default='UNICO',
                max_length=20
            ),
        ),
        migrations.AddField(
            model_name='compra',
            name='quantidade_parcelas',
            field=models.PositiveIntegerField(default=1),
        ),
        migrations.CreateModel(
            name='ParcelaCompra',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('numero_parcela', models.PositiveIntegerField()),
                ('valor_parcela', models.DecimalField(decimal_places=2, max_digits=15)),
                ('data_vencimento', models.DateField()),
                ('data_pagamento', models.DateField(blank=True, null=True)),
                ('status', models.CharField(choices=[('PENDENTE', 'Pendente'), ('PAGO', 'Pago'), ('VENCIDO', 'Vencido')], default='PENDENTE', max_length=20)),
                ('observacoes', models.TextField(blank=True, null=True)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('compra', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='parcelas', to='core.compra')),
            ],
            options={
                'ordering': ['numero_parcela'],
            },
        ),
        migrations.AlterUniqueTogether(
            name='parcelacompra',
            unique_together={('compra', 'numero_parcela')},
        ),
    ]
```

## 6. Estratégia de Implementação

### 6.1 Fase 1: Backend Base
1. Criar modelos ParcelaCompra e AnexoCompra
2. Implementar serializers básicos
3. Criar ViewSets e endpoints
4. Executar migrações

### 6.2 Fase 2: Frontend - Pagamento Parcelado
1. Criar componente PagamentoParceladoForm
2. Integrar ao CompraForm
3. Testar criação e edição de compras parceladas

### 6.3 Fase 3: Frontend - Anexos de Compra
1. Criar componente AnexosCompraManager
2. Integrar ao CompraForm
3. Implementar upload e remoção de anexos

### 6.4 Fase 4: Seleção Múltipla e PDF
1. Atualizar ComprasTable com checkboxes
2. Implementar lógica de seleção múltipla
3. Criar endpoint e funcionalidade de PDF em lote

### 6.5 Fase 5: Melhorias em Obras
1. Adicionar botão de exclusão nas fotos
2. Expandir tipos de arquivo aceitos
3. Migrar gradualmente para ArquivoObra

### 6.6 Fase 6: Testes e Refinamentos
1. Testes de integração
2. Validação de UX/UI
3. Otimizações de performance
4. Documentação final

## 7. Considerações de Segurança

### 7.1 Upload de Arquivos
- Validação de tipos de arquivo no backend
- Limite de tamanho de arquivo (ex: 10MB)
- Sanitização de nomes de arquivo
- Armazenamento seguro (fora do webroot)

### 7.2 Permissões
- Verificar permissões antes de operações CRUD
- Logs de auditoria para exclusões
- Validação de propriedade de recursos

### 7.3 Validações
- Validação de dados de parcelas
- Verificação de integridade de valores
- Prevenção de uploads maliciosos

## 8. Monitoramento e Logs

### 8.1 Métricas
- Taxa de uso de pagamento parcelado
- Volume de uploads de anexos
- Frequência de geração de PDFs

### 8.2 Logs de Auditoria
- Criação/edição de parcelas
- Upload/exclusão de anexos
- Geração de relatórios PDF

Esta documentação fornece uma base sólida para implementar todas as funcionalidades solicitadas, mantendo a consistência com a arquitetura existente do sistema.