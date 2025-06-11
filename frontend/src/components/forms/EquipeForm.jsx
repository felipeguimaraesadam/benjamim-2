import React, { useState, useEffect } from 'react';
import * as api from '../../services/api'; // Adjust path as needed

// Warning Icon for validation errors
const WarningIcon = () => (
  <svg className="w-4 h-4 inline mr-1" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.216 3.031-1.742 3.031H4.42c-1.526 0-2.492-1.697-1.742-3.031l5.58-9.92zM10 13a1 1 0 110-2 1 1 0 010 2zm-1.75-4.5a1.75 1.75 0 00-3.5 0v.25h3.5v-.25z" clipRule="evenodd" />
  </svg>
);

const EquipeForm = ({ initialData, onSubmit, onCancel, isLoading }) => {
  const [formData, setFormData] = useState({
    nome_equipe: '',
    lider: '', // Stores ID of the Funcionario
    membros: [], // Stores array of IDs of Funcionarios
  });
  const [funcionarios, setFuncionarios] = useState([]);
  const [errors, setErrors] = useState({});
  const [isLoadingFuncionarios, setIsLoadingFuncionarios] = useState(false);

  useEffect(() => {
    setIsLoadingFuncionarios(true);
    api.getFuncionarios()
      .then(response => {
        setFuncionarios(response.data);
      })
      .catch(error => {
        console.error("Failed to fetch funcionarios for form", error);
        setErrors(prev => ({ ...prev, form: 'Falha ao carregar lista de funcionários.' }));
      })
      .finally(() => {
        setIsLoadingFuncionarios(false);
      });
  }, []);

  useEffect(() => {
    if (initialData) {
      setFormData({
        nome_equipe: initialData.nome_equipe || '',
        lider: initialData.lider || '',
        membros: initialData.membros || [],
      });
    } else {
      setFormData({
        nome_equipe: '',
        lider: '',
        membros: [],
      });
    }
  }, [initialData]);

  const handleChange = (e) => {
    const { name, value, options, type } = e.target;
    if (name === "membros" && type === "select-multiple") {
      const selectedMembros = Array.from(options).filter(option => option.selected).map(option => option.value);
      setFormData(prev => ({ ...prev, [name]: selectedMembros.map(id => parseInt(id, 10)) })); // Ensure IDs are numbers
    } else {
      setFormData(prev => ({ ...prev, [name]: name === "lider" ? (value ? parseInt(value, 10) : '') : value }));
    }
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: null }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.nome_equipe.trim()) newErrors.nome_equipe = 'Nome da equipe é obrigatório.';
    // Lider can be optional depending on requirements, for now, let's not make it mandatory in form
    // if (!formData.lider) newErrors.lider = 'Líder da equipe é obrigatório.';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validateForm()) {
      const dataToSubmit = {
        ...formData,
        lider: formData.lider || null, // Send null if leader is empty string (optional)
      };
      onSubmit(dataToSubmit);
    }
  };

  if (isLoadingFuncionarios) {
    return <p className="text-center p-4">Carregando dados do formulário...</p>;
  }
  if (errors.form) {
     return <p className="text-center p-4 text-red-500">{errors.form}</p>;
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 md:space-y-6">
      <div>
        <label htmlFor="nome_equipe" className="block mb-2 text-sm font-medium text-gray-900">Nome da Equipe</label>
        <input type="text" name="nome_equipe" id="nome_equipe" value={formData.nome_equipe} onChange={handleChange}
               className={`bg-gray-50 border ${errors.nome_equipe ? 'border-red-500' : 'border-gray-300'} text-gray-900 sm:text-sm rounded-md focus:ring-primary-500 focus:border-primary-500 block w-full px-3 py-2`} />
        {errors.nome_equipe && <p className="mt-1 text-sm text-red-600 flex items-center"><WarningIcon /> {errors.nome_equipe}</p>}
      </div>

      <div>
        <label htmlFor="lider" className="block mb-2 text-sm font-medium text-gray-900">Líder da Equipe</label>
        <select name="lider" id="lider" value={formData.lider} onChange={handleChange}
                className={`bg-gray-50 border ${errors.lider ? 'border-red-500' : 'border-gray-300'} text-gray-900 sm:text-sm rounded-md focus:ring-primary-500 focus:border-primary-500 block w-full px-3 py-2`}>
          <option value="">Selecione um Líder (Opcional)</option>
          {funcionarios.map(f => (
            <option key={f.id} value={f.id}>{f.nome_completo}</option>
          ))}
        </select>
        {errors.lider && <p className="mt-1 text-sm text-red-600 flex items-center"><WarningIcon /> {errors.lider}</p>}
      </div>

      <div>
        <label htmlFor="membros" className="block mb-2 text-sm font-medium text-gray-900">Membros da Equipe</label>
        <select multiple name="membros" id="membros" value={formData.membros.map(String)} onChange={handleChange} // Value needs to be array of strings for multi-select
                className="bg-gray-50 border border-gray-300 text-gray-900 sm:text-sm rounded-md focus:ring-primary-500 focus:border-primary-500 block w-full px-3 py-2 h-32">
          {funcionarios.map(f => (
            // Prevent leader from being listed as a member if a leader is selected and it's the same person (optional UX improvement)
            // For now, allow anyone to be a member.
            <option key={f.id} value={f.id}>{f.nome_completo}</option>
          ))}
        </select>
        <p className="mt-1 text-xs text-gray-500">Segure Ctrl (ou Cmd) para selecionar múltiplos membros.</p>
      </div>

      <div className="flex items-center justify-end space-x-3 pt-2">
        <button type="button" onClick={onCancel} disabled={isLoading}
                className="py-2 px-4 text-sm font-medium text-gray-800 bg-gray-200 rounded-md hover:bg-gray-300 focus:ring-4 focus:outline-none focus:ring-gray-300 disabled:opacity-50">
          Cancelar
        </button>
        <button type="submit" disabled={isLoading || isLoadingFuncionarios}
                className="py-2 px-4 text-sm font-medium text-white bg-primary-600 rounded-md hover:bg-primary-700 focus:ring-4 focus:outline-none focus:ring-primary-300 disabled:bg-primary-300">
          {isLoading ? 'Salvando...' : 'Salvar'}
        </button>
      </div>
    </form>
  );
};

export default EquipeForm;
