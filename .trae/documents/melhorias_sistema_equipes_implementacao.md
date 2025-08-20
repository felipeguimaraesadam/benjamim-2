# Melhorias no Sistema de Equipes - Guia de Implementação

## 1. Modificações no Backend

### 1.1 Atualização do Modelo Equipe

**Arquivo**: `backend/core/models.py`

```python
# Modificar a classe Equipe existente (linha ~111)
class Equipe(models.Model):
    nome_equipe = models.CharField(max_length=100, unique=True)
    lider = models.ForeignKey(
        Funcionario, 
        on_delete=models.SET_NULL, 
        null=True, 
        related_name='equipes_lideradas'
    )
    membros = models.ManyToManyField(
        Funcionario, 
        related_name='equipes_membro'
    )
    # NOVO CAMPO ADICIONADO
    descricao = models.TextField(
        blank=True, 
        null=True, 
        verbose_name='Descrição da Equipe',
        help_text='Descrição detalhada sobre a finalidade e características da equipe'
    )
    
    def __str__(self):
        return self.nome_equipe
```

### 1.2 Atualização dos Serializers

**Arquivo**: `backend/core/serializers.py`

```python
# Modificar EquipeComMembrosBasicSerializer (linha ~141)
class EquipeComMembrosBasicSerializer(serializers.ModelSerializer):
    membros = FuncionarioBasicSerializer(many=True, read_only=True)
    lider = FuncionarioBasicSerializer(read_only=True, allow_null=True)
    
    class Meta:
        model = Equipe
        fields = ['id', 'nome_equipe', 'lider', 'membros', 'descricao']  # Adicionado 'descricao'

# Atualizar EquipeDetailSerializer se existir, ou criar se não existir
class EquipeDetailSerializer(serializers.ModelSerializer):
    membros = FuncionarioBasicSerializer(many=True, read_only=True)
    lider = FuncionarioBasicSerializer(read_only=True, allow_null=True)
    total_membros = serializers.SerializerMethodField()
    
    class Meta:
        model = Equipe
        fields = [
            'id', 'nome_equipe', 'lider', 'membros', 'descricao', 'total_membros'
        ]
    
    def get_total_membros(self, obj):
        return obj.membros.count()
```

### 1.3 Criação da Migração

**Comando para executar**:

```bash
python manage.py makemigrations --name add_descricao_equipe
```

**Arquivo gerado**: `backend/core/migrations/XXXX_add_descricao_equipe.py`

```python
from django.db import migrations, models

class Migration(migrations.Migration):
    dependencies = [
        ('core', 'XXXX_previous_migration'),  # Será preenchido automaticamente
    ]
    
    operations = [
        migrations.AddField(
            model_name='equipe',
            name='descricao',
            field=models.TextField(
                blank=True, 
                null=True, 
                verbose_name='Descrição da Equipe',
                help_text='Descrição detalhada sobre a finalidade e características da equipe'
            ),
        ),
    ]
```

### 1.4 Atualização da API de Funcionários

**Arquivo**: `backend/core/views.py`

```python
# Modificar FuncionarioViewSet para suportar busca (linha ~117)
class FuncionarioViewSet(viewsets.ModelViewSet):
    """
    API endpoint that allows funcionarios to be viewed or edited.
    """
    queryset = Funcionario.objects.all().order_by('nome_completo')  # Ordenar por nome
    serializer_class = FuncionarioSerializer
    permission_classes = [IsNivelAdmin | IsNivelGerente]
    
    def get_queryset(self):
        queryset = Funcionario.objects.all().order_by('nome_completo')
        search = self.request.query_params.get('search', None)
        if search is not None:
            queryset = queryset.filter(
                nome_completo__icontains=search
            )
        return queryset
```

## 2. Modificações no Frontend

### 2.1 Criação do Componente FuncionarioAutocompleteMultiple

**Arquivo**: `frontend/src/components/forms/FuncionarioAutocompleteMultiple.jsx`

```jsx
import React, { useState, useRef, useCallback } from 'react';
import FuncionarioAutocomplete from './FuncionarioAutocomplete';
import { X } from 'lucide-react';

const FuncionarioAutocompleteMultiple = ({ 
  selectedFuncionarios = [], 
  onFuncionariosChange, 
  placeholder = "Digite para adicionar membros...",
  error 
}) => {
  const [inputValue, setInputValue] = useState('');
  const autocompleteRef = useRef(null);

  const handleFuncionarioSelect = useCallback((funcionario) => {
    if (funcionario && !selectedFuncionarios.find(f => f.id === funcionario.id)) {
      const newFuncionarios = [...selectedFuncionarios, funcionario];
      onFuncionariosChange(newFuncionarios);
      setInputValue('');
      // Limpar o autocomplete
      if (autocompleteRef.current) {
        autocompleteRef.current.setValue('');
      }
    }
  }, [selectedFuncionarios, onFuncionariosChange]);

  const handleRemoveFuncionario = useCallback((funcionarioId) => {
    const newFuncionarios = selectedFuncionarios.filter(f => f.id !== funcionarioId);
    onFuncionariosChange(newFuncionarios);
  }, [selectedFuncionarios, onFuncionariosChange]);

  const handleKeyDown = useCallback((e) => {
    // Se pressionar Backspace com input vazio, remover último membro
    if (e.key === 'Backspace' && !inputValue && selectedFuncionarios.length > 0) {
      const lastFuncionario = selectedFuncionarios[selectedFuncionarios.length - 1];
      handleRemoveFuncionario(lastFuncionario.id);
    }
  }, [inputValue, selectedFuncionarios, handleRemoveFuncionario]);

  return (
    <div className="space-y-2">
      {/* Tags dos funcionários selecionados */}
      {selectedFuncionarios.length > 0 && (
        <div className="flex flex-wrap gap-2 p-2 bg-gray-50 rounded-md border">
          {selectedFuncionarios.map((funcionario) => (
            <div
              key={funcionario.id}
              className="flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-800 rounded-md text-sm"
            >
              <span>{funcionario.nome_completo}</span>
              <button
                type="button"
                onClick={() => handleRemoveFuncionario(funcionario.id)}
                className="hover:bg-blue-200 rounded-full p-0.5 transition-colors"
              >
                <X size={14} />
              </button>
            </div>
          ))}
        </div>
      )}
      
      {/* Campo de autocomplete */}
      <FuncionarioAutocomplete
        ref={autocompleteRef}
        value={null}
        onFuncionarioSelect={handleFuncionarioSelect}
        placeholder={placeholder}
        error={error}
        onKeyDown={handleKeyDown}
      />
      
      {/* Contador de membros */}
      {selectedFuncionarios.length > 0 && (
        <p className="text-sm text-gray-600">
          {selectedFuncionarios.length} membro{selectedFuncionarios.length !== 1 ? 's' : ''} selecionado{selectedFuncionarios.length !== 1 ? 's' : ''}
        </p>
      )}
    </div>
  );
};

export default FuncionarioAutocompleteMultiple;
```

### 2.2 Atualização do EquipeForm

**Arquivo**: `frontend/src/components/forms/EquipeForm.jsx`

```jsx
import React, { useState, useEffect } from 'react';
import FuncionarioAutocomplete from './FuncionarioAutocomplete';
import FuncionarioAutocompleteMultiple from './FuncionarioAutocompleteMultiple';
import SpinnerIcon from '../utils/SpinnerIcon';

// Warning Icon component (manter existente)
const WarningIcon = ({ className = 'w-4 h-4 inline mr-1' }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 20 20">
    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.216 3.031-1.742 3.031H4.42c-1.526 0-2.492-1.697-1.742-3.031l5.58-9.92zM10 13a1 1 0 110-2 1 1 0 010 2zm-1.75-4.5a1.75 1.75 0 00-3.5 0v.25h3.5v-.25z" clipRule="evenodd" />
  </svg>
);

const EquipeForm = ({ initialData, onSubmit, onCancel, isLoading }) => {
  const [formData, setFormData] = useState({
    nome_equipe: '',
    lider: null,
    membros: [],
    descricao: ''  // NOVO CAMPO
  });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (initialData) {
      setFormData({
        nome_equipe: initialData.nome_equipe || '',
        lider: initialData.lider || null,
        membros: initialData.membros || [],
        descricao: initialData.descricao || ''  // NOVO CAMPO
      });
    } else {
      setFormData({
        nome_equipe: '',
        lider: null,
        membros: [],
        descricao: ''  // NOVO CAMPO
      });
    }
  }, [initialData]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: null }));
    }
  };

  const handleLiderSelect = (lider) => {
    setFormData(prev => ({ ...prev, lider }));
    if (errors.lider) {
      setErrors(prev => ({ ...prev, lider: null }));
    }
  };

  const handleMembrosChange = (membros) => {
    setFormData(prev => ({ ...prev, membros }));
    if (errors.membros) {
      setErrors(prev => ({ ...prev, membros: null }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.nome_equipe.trim()) {
      newErrors.nome_equipe = 'Nome da equipe é obrigatório.';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validateForm()) {
      const dataToSubmit = {
        nome_equipe: formData.nome_equipe,
        lider: formData.lider?.id || null,
        membros: formData.membros.map(m => m.id),
        descricao: formData.descricao  // NOVO CAMPO
      };
      onSubmit(dataToSubmit);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Nome da Equipe */}
      <div>
        <label htmlFor="nome_equipe" className="block mb-2 text-sm font-medium text-gray-900">
          Nome da Equipe *
        </label>
        <input
          type="text"
          name="nome_equipe"
          id="nome_equipe"
          value={formData.nome_equipe}
          onChange={handleChange}
          className={`bg-gray-50 border ${
            errors.nome_equipe ? 'border-red-500' : 'border-gray-300'
          } text-gray-900 sm:text-sm rounded-md focus:ring-primary-500 focus:border-primary-500 block w-full px-3 py-2`}
        />
        {errors.nome_equipe && (
          <p className="mt-1 text-sm text-red-600 flex items-center">
            <WarningIcon /> {errors.nome_equipe}
          </p>
        )}
      </div>

      {/* Líder da Equipe - AUTOCOMPLETAR */}
      <div>
        <label className="block mb-2 text-sm font-medium text-gray-900">
          Líder da Equipe
        </label>
        <FuncionarioAutocomplete
          value={formData.lider}
          onFuncionarioSelect={handleLiderSelect}
          placeholder="Digite para buscar um líder..."
          error={errors.lider}
        />
        {errors.lider && (
          <p className="mt-1 text-sm text-red-600 flex items-center">
            <WarningIcon /> {errors.lider}
          </p>
        )}
      </div>

      {/* Membros da Equipe - AUTOCOMPLETAR MÚLTIPLO */}
      <div>
        <label className="block mb-2 text-sm font-medium text-gray-900">
          Membros da Equipe
        </label>
        <FuncionarioAutocompleteMultiple
          selectedFuncionarios={formData.membros}
          onFuncionariosChange={handleMembrosChange}
          placeholder="Digite para adicionar membros da equipe..."
          error={errors.membros}
        />
        {errors.membros && (
          <p className="mt-1 text-sm text-red-600 flex items-center">
            <WarningIcon /> {errors.membros}
          </p>
        )}
      </div>

      {/* Descrição da Equipe - NOVO CAMPO */}
      <div>
        <label htmlFor="descricao" className="block mb-2 text-sm font-medium text-gray-900">
          Descrição da Equipe
        </label>
        <textarea
          name="descricao"
          id="descricao"
          rows={4}
          value={formData.descricao}
          onChange={handleChange}
          placeholder="Descreva a finalidade, características e responsabilidades desta equipe..."
          className={`bg-gray-50 border ${
            errors.descricao ? 'border-red-500' : 'border-gray-300'
          } text-gray-900 sm:text-sm rounded-md focus:ring-primary-500 focus:border-primary-500 block w-full px-3 py-2 resize-vertical`}
        />
        {errors.descricao && (
          <p className="mt-1 text-sm text-red-600 flex items-center">
            <WarningIcon /> {errors.descricao}
          </p>
        )}
        <p className="mt-1 text-sm text-gray-500">
          Forneça informações detalhadas sobre a equipe para facilitar a gestão e alocação.
        </p>
      </div>

      {/* Botões */}
      <div className="flex items-center justify-end space-x-3 pt-4 border-t">
        <button
          type="button"
          onClick={onCancel}
          disabled={isLoading}
          className="py-2 px-4 text-sm font-medium text-gray-800 bg-gray-200 rounded-md hover:bg-gray-300 focus:ring-4 focus:outline-none focus:ring-gray-300 disabled:opacity-50"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={isLoading}
          className="py-2 px-4 text-sm font-medium text-white bg-primary-600 rounded-md hover:bg-primary-700 focus:ring-4 focus:outline-none focus:ring-primary-300 disabled:bg-primary-300 flex items-center justify-center"
        >
          {isLoading ? <SpinnerIcon className="w-5 h-5 mr-2" /> : null}
          {isLoading
            ? 'Salvando...'
            : initialData
              ? 'Atualizar Equipe'
              : 'Salvar Equipe'}
        </button>
      </div>
    </form>
  );
};

export default EquipeForm;
```

### 2.3 Atualização da Página de Detalhes

**Arquivo**: `frontend/src/pages/EquipeDetailPage.jsx`

```jsx
// Adicionar após a linha 95 (seção de informações da equipe)

{/* Seção de Descrição - NOVA */}
{equipeDetails.descricao && (
  <div className="bg-white rounded-lg shadow-md p-6 mb-6">
    <h2 className="text-xl font-semibold text-gray-800 mb-4">
      Descrição da Equipe
    </h2>
    <div className="prose max-w-none">
      <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
        {equipeDetails.descricao}
      </p>
    </div>
  </div>
)}

{/* Informações Gerais da Equipe */}
<div className="bg-white rounded-lg shadow-md p-6 mb-6">
  <h2 className="text-xl font-semibold text-gray-800 mb-4">
    Informações Gerais
  </h2>
  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
    <div>
      <span className="font-medium text-gray-600">Nome da Equipe:</span>
      <p className="text-gray-800">{equipeDetails.nome_equipe}</p>
    </div>
    <div>
      <span className="font-medium text-gray-600">Líder:</span>
      <p className="text-gray-800">
        {equipeDetails.lider ? equipeDetails.lider.nome_completo : 'Não definido'}
      </p>
    </div>
    <div>
      <span className="font-medium text-gray-600">Total de Membros:</span>
      <p className="text-gray-800">{equipeDetails.membros?.length || 0}</p>
    </div>
  </div>
</div>
```

## 3. Scripts de Migração e Configuração

### 3.1 Script de Migração Segura

**Arquivo**: `scripts/migrate_equipes_safely.py`

```python
#!/usr/bin/env python
import os
import sys
import django
from django.core.management import execute_from_command_line
from django.conf import settings

def run_safe_migration():
    """Executa migração de forma segura preservando dados existentes"""
    print("=== MIGRAÇÃO SEGURA DO SISTEMA DE EQUIPES ===")
    
    try:
        # Verificar se há migrações pendentes
        print("1. Verificando migrações pendentes...")
        result = os.system('python manage.py showmigrations --plan')
        
        # Criar backup antes da migração
        print("2. Criando backup do banco de dados...")
        backup_result = os.system('python manage.py dbbackup --clean')
        if backup_result != 0:
            print("AVISO: Não foi possível criar backup automático.")
            print("Recomenda-se fazer backup manual antes de continuar.")
            response = input("Deseja continuar mesmo assim? (s/N): ")
            if response.lower() != 's':
                print("Migração cancelada pelo usuário.")
                return False
        
        # Executar migração
        print("3. Executando migração...")
        execute_from_command_line(['manage.py', 'migrate', '--verbosity=2'])
        
        print("4. Verificando integridade dos dados...")
        # Verificar se as equipes existentes ainda estão íntegras
        os.system('python manage.py shell -c "from core.models import Equipe; print(f\'Total de equipes: {Equipe.objects.count()}\')"')
        
        print("\n✅ MIGRAÇÃO CONCLUÍDA COM SUCESSO!")
        print("   - Campo 'descricao' adicionado ao modelo Equipe")
        print("   - Dados existentes preservados")
        print("   - Sistema pronto para usar as novas funcionalidades")
        return True
        
    except Exception as e:
        print(f"\n❌ ERRO DURANTE MIGRAÇÃO: {e}")
        print("\nEm caso de problemas:")
        print("1. Restaure o backup: python manage.py dbrestore")
        print("2. Verifique os logs de erro")
        print("3. Entre em contato com o suporte técnico")
        return False

if __name__ == '__main__':
    # Configurar Django
    os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'sgo_core.settings')
    django.setup()
    
    success = run_safe_migration()
    sys.exit(0 if success else 1)
```

### 3.2 Atualização do config.bat

**Arquivo**: `scripts/config.bat`

```batch
@echo off
echo ========================================
echo   CONFIGURACAO DO SISTEMA SGO
echo ========================================
echo.

echo [1/4] Verificando ambiente Python...
python --version
if %ERRORLEVEL% NEQ 0 (
    echo ERRO: Python nao encontrado. Instale Python 3.8+ primeiro.
    pause
    exit /b 1
)

echo [2/4] Instalando dependencias...
pip install -r requirements.txt
if %ERRORLEVEL% NEQ 0 (
    echo ERRO: Falha ao instalar dependencias.
    pause
    exit /b 1
)

echo [3/4] Executando migracoes do sistema de equipes...
python scripts/migrate_equipes_safely.py
if %ERRORLEVEL% NEQ 0 (
    echo ERRO: Falha na migracao. Verifique os logs.
    pause
    exit /b 1
)

echo [4/4] Coletando arquivos estaticos...
python manage.py collectstatic --noinput
if %ERRORLEVEL% NEQ 0 (
    echo AVISO: Falha ao coletar arquivos estaticos.
)

echo.
echo ========================================
echo   CONFIGURACAO CONCLUIDA COM SUCESSO!
echo ========================================
echo.
echo O sistema esta pronto para uso.
echo Execute 'start.bat' para iniciar o servidor.
echo.
pause
```

## 4. Checklist de Implementação

### Backend

* [ ] Adicionar campo `descricao` ao modelo `Equipe`

* [ ] Atualizar serializers para incluir campo `descricao`

* [ ] Modificar `FuncionarioViewSet` para suportar busca

* [ ] Criar e executar migração

* [ ] Testar endpoints da API

### Frontend

* [ ] Criar componente `FuncionarioAutocompleteMultiple`

* [ ] Atualizar `EquipeForm` com novos campos

* [ ] Modificar `EquipeDetailPage` para exibir descrição

* [ ] Testar navegação por teclado nos autocompletares

* [ ] Validar responsividade em dispositivos móveis

### Migração e Deploy

* [ ] Criar script de migração segura

* [ ] Atualizar `config.bat` e `start.bat`

* [ ] Testar processo completo em ambiente de desenvolvimento

* [ ] Documentar processo para ambiente de produção

* [ ] Criar backup antes da implementação

### Testes

* [ ] Testar criação de equipe com novos campos

* [ ] Testar edição de equipe existente

* [ ] Testar visualização de detalhes da equipe

* [ ] Validar autocompletar de líder

* [ ] Validar autocompletar múltiplo de membros

* [ ] Testar navegação por teclado (setas + Enter)

* [ ] Verificar preservação de dados existentes

