import React, { useState, useEffect, useRef } from 'react';
import SpinnerIcon from '../utils/SpinnerIcon';
import Autocomplete from './Autocomplete';
import * as api from '../../services/api';
import { showSuccessToast, showErrorToast } from '../../utils/toastUtils';
import { UploadCloud, X, Paperclip } from 'lucide-react';

const DespesaExtraForm = ({
  initialData,
  obras,
  onSubmit,
  onCancel,
  isLoading,
  onRemoveAnexo,
}) => {
  const [formData, setFormData] = useState({
    descricao: '',
    valor: '',
    data: '',
    categoria: 'Outros',
    obra: null,
    anexos: [], // Holds only NEW files for upload
  });
  const [existingAnexos, setExistingAnexos] = useState([]);
  const [obraInitial, setObraInitial] = useState(null);
  const fileInputRef = useRef(null);

  const categoriasDespesa = [
    'Alimentação',
    'Transporte',
    'Ferramentas',
    'Outros',
  ];

  useEffect(() => {
    if (initialData) {
      const obraData = initialData.obra
        ? obras.find(o => o.id === initialData.obra)
        : null;

      setFormData({
        descricao: initialData.descricao || '',
        valor: initialData.valor || '',
        data: initialData.data
          ? new Date(initialData.data).toISOString().split('T')[0]
          : '',
        categoria: initialData.categoria || 'Outros',
        obra: initialData.obra || null,
        anexos: [], // Clear new anexos on edit
      });

      setExistingAnexos(initialData.anexos || []);

      if (obraData) {
        setObraInitial({ value: obraData.id, label: obraData.nome_obra });
      } else {
        setObraInitial(null);
      }
    } else {
      // Reset form for new entry
      setFormData({
        descricao: '',
        valor: '',
        data: new Date().toISOString().split('T')[0],
        categoria: 'Outros',
        obra: null,
        anexos: [],
      });
      setExistingAnexos([]);
      setObraInitial(null);
    }
  }, [initialData, obras]);

  const handleChange = e => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleObraSelect = selection => {
    setFormData(prev => ({
      ...prev,
      obra: selection ? selection.value : null,
    }));
  };

  const fetchObrasSuggestions = async query => {
    try {
      const response = await api.searchObras(query);
      return response.data.map(obra => ({
        value: obra.id,
        label: obra.nome_obra,
      }));
    } catch (error) {
      console.error('Error fetching obras:', error);
      return [];
    }
  };

  const handleFileChange = e => {
    const newFiles = Array.from(e.target.files);
    if (newFiles.length > 0) {
      setFormData(prev => ({ ...prev, anexos: [...prev.anexos, ...newFiles] }));
    }
  };

  const handleRemoveNewAnexo = index => {
    setFormData(prev => ({
      ...prev,
      anexos: prev.anexos.filter((_, i) => i !== index),
    }));
  };

  const handleDeleteExistingAnexo = async anexoId => {
    if (
      !window.confirm(
        'Tem certeza que deseja excluir este anexo? Esta ação não pode ser desfeita.'
      )
    )
      return;
    try {
      await api.deleteAnexoDespesa(anexoId);
      setExistingAnexos(prev => prev.filter(anexo => anexo.id !== anexoId));
      showSuccessToast('Anexo excluído com sucesso!');
    } catch (error) {
      showErrorToast(
        `Falha ao excluir o anexo: ${error.message || 'Erro desconhecido'}`
      );
      console.error('Erro ao excluir anexo:', error);
    }
  };

  const handleSubmit = e => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label
          htmlFor="obra"
          className="block text-sm font-medium text-gray-900"
        >
          Obra Associada
        </label>
        <Autocomplete
          key={obraInitial ? obraInitial.value : 'new'}
          fetchSuggestions={fetchObrasSuggestions}
          onSelect={handleObraSelect}
          placeholder="Digite para buscar uma obra..."
          initialValue={obraInitial}
        />
      </div>
      <div>
        <label
          htmlFor="descricao"
          className="block text-sm font-medium text-gray-900"
        >
          Descrição
        </label>
        <textarea
          name="descricao"
          id="descricao"
          rows="3"
          value={formData.descricao}
          onChange={handleChange}
          required
          className="mt-1 block w-full bg-gray-50 border border-gray-300 text-gray-900 sm:text-sm rounded-md focus:ring-primary-500 focus:border-primary-500 px-3 py-2"
        ></textarea>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label
            htmlFor="valor"
            className="block text-sm font-medium text-gray-900"
          >
            Valor (R$)
          </label>
          <input
            type="number"
            name="valor"
            id="valor"
            step="0.01"
            value={formData.valor}
            onChange={handleChange}
            required
            className="mt-1 block w-full bg-gray-50 border border-gray-300 text-gray-900 sm:text-sm rounded-md focus:ring-primary-500 focus:border-primary-500 px-3 py-2"
          />
        </div>
        <div>
          <label
            htmlFor="data"
            className="block text-sm font-medium text-gray-900"
          >
            Data
          </label>
          <input
            type="date"
            name="data"
            id="data"
            value={formData.data}
            onChange={handleChange}
            required
            className="mt-1 block w-full bg-gray-50 border border-gray-300 text-gray-900 sm:text-sm rounded-md focus:ring-primary-500 focus:border-primary-500 px-3 py-2"
          />
        </div>
      </div>
      <div>
        <label
          htmlFor="categoria"
          className="block text-sm font-medium text-gray-900"
        >
          Categoria
        </label>
        <select
          name="categoria"
          id="categoria"
          value={formData.categoria}
          onChange={handleChange}
          required
          className="mt-1 block w-full bg-gray-50 border border-gray-300 text-gray-900 sm:text-sm rounded-md focus:ring-primary-500 focus:border-primary-500 px-3 py-2"
        >
          {categoriasDespesa.map(cat => (
            <option key={cat} value={cat}>
              {cat}
            </option>
          ))}
        </select>
      </div>

      <div className="mt-6 pt-6 border-t border-gray-200">
        <h3 className="text-lg font-medium leading-6 text-gray-900">Anexos</h3>
        <div className="mt-4 space-y-4">
          {existingAnexos.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-gray-600 mb-2">
                Anexos Salvos
              </h4>
              <ul className="border border-gray-200 rounded-md divide-y divide-gray-200">
                {existingAnexos.map(anexo => (
                  <li
                    key={anexo.id}
                    className="pl-3 pr-4 py-3 flex items-center justify-between text-sm"
                  >
                    <div className="w-0 flex-1 flex items-center">
                      <Paperclip
                        className="flex-shrink-0 h-5 w-5 text-gray-400"
                        aria-hidden="true"
                      />
                      <span className="ml-2 flex-1 w-0 truncate">
                        <a
                          href={anexo.anexo}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-medium text-blue-600 hover:text-blue-500"
                        >
                          {anexo.descricao || anexo.anexo.split('/').pop()}
                        </a>
                      </span>
                    </div>
                    <div className="ml-4 flex-shrink-0">
                      <button
                        type="button"
                        onClick={() => onRemoveAnexo(anexo.id)}
                        className="font-medium text-red-600 hover:text-red-500"
                        title="Excluir anexo"
                      >
                        Remover
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {formData.anexos.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-gray-600 mb-2">
                Novos Anexos para Envio
              </h4>
              <ul className="border border-gray-200 rounded-md divide-y divide-gray-200">
                {formData.anexos.map((file, index) => (
                  <li
                    key={index}
                    className="pl-3 pr-4 py-3 flex items-center justify-between text-sm"
                  >
                    <div className="w-0 flex-1 flex items-center">
                      <Paperclip
                        className="flex-shrink-0 h-5 w-5 text-gray-400"
                        aria-hidden="true"
                      />
                      <span className="ml-2 flex-1 w-0 truncate">
                        {file.name}
                      </span>
                    </div>
                    <div className="ml-4 flex-shrink-0">
                      <button
                        type="button"
                        onClick={() => handleRemoveNewAnexo(index)}
                        className="p-1 rounded-full text-red-500 hover:bg-red-100"
                        title="Remover novo anexo"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div>
            <button
              type="button"
              onClick={() => fileInputRef.current && fileInputRef.current.click()}
              className="w-full flex justify-center py-2 px-4 border border-dashed border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
            >
              <UploadCloud className="mr-2 h-5 w-5 text-gray-400" />
              Adicionar mais anexos
            </button>
            <input
              ref={fileInputRef}
              type="file"
              id="anexos-input"
              name="anexos"
              multiple
              onChange={handleFileChange}
              className="hidden"
            />
          </div>
        </div>
      </div>

      <div className="flex justify-end space-x-3 pt-4">
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
          className="py-2 px-4 text-sm font-medium text-white bg-primary-600 rounded-md hover:bg-primary-700 focus:ring-4 focus:outline-none focus:ring-primary-300 disabled:bg-primary-300 flex items-center justify-center min-w-[120px]"
        >
          {isLoading ? (
            <>
              <SpinnerIcon className="w-5 h-5 mr-2" />
              Salvando...
            </>
          ) : initialData ? (
            'Atualizar Despesa'
          ) : (
            'Adicionar Despesa'
          )}
        </button>
      </div>
    </form>
  );
};

export default DespesaExtraForm;
