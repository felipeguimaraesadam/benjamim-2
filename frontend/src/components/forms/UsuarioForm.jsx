import React, { useState, useEffect } from 'react';

const UsuarioForm = ({ initialData, onSubmit, onCancel, isLoading }) => {
  const [formData, setFormData] = useState({
    nome_completo: '',
    login: '',
    senha: '',
    nivel_acesso: 'gerente', // Default level
  });
  const [errors, setErrors] = useState({});

  const nivelAcessoOptions = [
    { value: 'admin', label: 'Admin' },
    { value: 'gerente', label: 'Gerente' },
    // Add other roles as necessary, e.g., 'funcionario'
  ];

  useEffect(() => {
    if (initialData) {
      setFormData({
        nome_completo: initialData.nome_completo || '',
        login: initialData.login || '',
        senha: '', // Password should be empty for editing, or handled specifically
        nivel_acesso: initialData.nivel_acesso || 'gerente',
      });
    } else {
      // Reset form for new entry
      setFormData({
        nome_completo: '',
        login: '',
        senha: '',
        nivel_acesso: 'gerente',
      });
    }
    setErrors({}); // Clear errors when initialData changes
  }, [initialData]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: null }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.nome_completo.trim()) newErrors.nome_completo = 'Nome completo é obrigatório.';
    if (!formData.login.trim()) newErrors.login = 'Login é obrigatório.';

    // Password is required for new users (initialData is null)
    // For existing users, it's optional (only if they want to change it)
    if (!initialData && !formData.senha) {
      newErrors.senha = 'Senha é obrigatória para novos usuários.';
    }
    // Basic password complexity (example: min 6 chars) - adjust as needed
    if (formData.senha && formData.senha.length < 6) {
        newErrors.senha = 'Senha deve ter pelo menos 6 caracteres.';
    }

    if (!formData.nivel_acesso) newErrors.nivel_acesso = 'Nível de acesso é obrigatório.';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validateForm()) {
      const dataToSubmit = { ...formData };
      // If password field is empty during an update, don't send it
      // The backend should be designed to ignore empty/null password fields on update
      if (initialData && !dataToSubmit.senha) {
        delete dataToSubmit.senha;
      }
      onSubmit(dataToSubmit);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 md:space-y-6">
      <div>
        <label htmlFor="nome_completo" className="block mb-2 text-sm font-medium text-gray-900">Nome Completo <span className="text-red-500">*</span></label>
        <input type="text" name="nome_completo" id="nome_completo" value={formData.nome_completo} onChange={handleChange}
               className={`bg-gray-50 border ${errors.nome_completo ? 'border-red-500' : 'border-gray-300'} text-gray-900 sm:text-sm rounded-lg focus:ring-primary-600 focus:border-primary-600 block w-full p-2.5`} />
        {errors.nome_completo && <p className="mt-1 text-xs text-red-500">{errors.nome_completo}</p>}
      </div>
      <div>
        <label htmlFor="login" className="block mb-2 text-sm font-medium text-gray-900">Login <span className="text-red-500">*</span></label>
        <input type="text" name="login" id="login" value={formData.login} onChange={handleChange}
               className={`bg-gray-50 border ${errors.login ? 'border-red-500' : 'border-gray-300'} text-gray-900 sm:text-sm rounded-lg focus:ring-primary-600 focus:border-primary-600 block w-full p-2.5`} />
        {errors.login && <p className="mt-1 text-xs text-red-500">{errors.login}</p>}
      </div>
      <div>
        <label htmlFor="senha" className="block mb-2 text-sm font-medium text-gray-900">
          Senha {initialData ? '(Deixe em branco para não alterar)' : <span className="text-red-500">*</span>}
        </label>
        <input type="password" name="senha" id="senha" value={formData.senha} onChange={handleChange}
               className={`bg-gray-50 border ${errors.senha ? 'border-red-500' : 'border-gray-300'} text-gray-900 sm:text-sm rounded-lg focus:ring-primary-600 focus:border-primary-600 block w-full p-2.5`} />
        {errors.senha && <p className="mt-1 text-xs text-red-500">{errors.senha}</p>}
      </div>
      <div>
        <label htmlFor="nivel_acesso" className="block mb-2 text-sm font-medium text-gray-900">Nível de Acesso <span className="text-red-500">*</span></label>
        <select name="nivel_acesso" id="nivel_acesso" value={formData.nivel_acesso} onChange={handleChange}
                className={`bg-gray-50 border ${errors.nivel_acesso ? 'border-red-500' : 'border-gray-300'} text-gray-900 sm:text-sm rounded-lg focus:ring-primary-600 focus:border-primary-600 block w-full p-2.5`}>
          {nivelAcessoOptions.map(option => (
            <option key={option.value} value={option.value}>{option.label}</option>
          ))}
        </select>
        {errors.nivel_acesso && <p className="mt-1 text-xs text-red-500">{errors.nivel_acesso}</p>}
      </div>
      <div className="flex items-center justify-end space-x-3 pt-2">
        <button type="button" onClick={onCancel} disabled={isLoading}
                className="py-2 px-4 text-sm font-medium text-gray-700 bg-white rounded-lg border border-gray-200 hover:bg-gray-100 focus:ring-4 focus:outline-none focus:ring-primary-300 hover:text-gray-900 focus:z-10 disabled:opacity-50">
          Cancelar
        </button>
        <button type="submit" disabled={isLoading}
                className="py-2 px-4 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 focus:ring-4 focus:outline-none focus:ring-primary-300 disabled:bg-primary-300">
          {isLoading ? 'Salvando...' : (initialData ? 'Atualizar Usuário' : 'Criar Usuário')}
        </button>
      </div>
    </form>
  );
};

export default UsuarioForm;
