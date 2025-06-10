import React, { useState, useEffect } from 'react';
import * as api from '../../services/api'; // Adjust path as needed

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
               className={`bg-gray-50 border ${errors.nome_equipe ? 'border-red-500' : 'border-gray-300'} text-gray-900 sm:text-sm rounded-lg focus:ring-primary-600 focus:border-primary-600 block w-full p-2.5`} />
        {errors.nome_equipe && <p className="mt-1 text-xs text-red-500">{errors.nome_equipe}</p>}
      </div>

      <div>
        <label htmlFor="lider" className="block mb-2 text-sm font-medium text-gray-900">Líder da Equipe</label>
        <select name="lider" id="lider" value={formData.lider} onChange={handleChange}
                className={`bg-gray-50 border ${errors.lider ? 'border-red-500' : 'border-gray-300'} text-gray-900 sm:text-sm rounded-lg focus:ring-primary-600 focus:border-primary-600 block w-full p-2.5`}>
          <option value="">Selecione um Líder (Opcional)</option>
          {funcionarios.map(f => (
            <option key={f.id} value={f.id}>{f.nome_completo}</option>
          ))}
        </select>
        {errors.lider && <p className="mt-1 text-xs text-red-500">{errors.lider}</p>}
      </div>

      <div>
        <label htmlFor="membros" className="block mb-2 text-sm font-medium text-gray-900">Membros da Equipe</label>
        <select multiple name="membros" id="membros" value={formData.membros.map(String)} onChange={handleChange} // Value needs to be array of strings for multi-select
                className="bg-gray-50 border border-gray-300 text-gray-900 sm:text-sm rounded-lg focus:ring-primary-600 focus:border-primary-600 block w-full p-2.5 h-32">
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
                className="py-2 px-4 text-sm font-medium text-gray-700 bg-white rounded-lg border border-gray-200 hover:bg-gray-100 focus:ring-4 focus:outline-none focus:ring-primary-300 hover:text-gray-900 focus:z-10 disabled:opacity-50">
          Cancelar
        </button>
        <button type="submit" disabled={isLoading || isLoadingFuncionarios}
                className="py-2 px-4 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 focus:ring-4 focus:outline-none focus:ring-primary-300 disabled:bg-primary-300">
          {isLoading ? 'Salvando...' : 'Salvar'}
        </button>
      </div>
    </form>
  );
};

export default EquipeForm;
