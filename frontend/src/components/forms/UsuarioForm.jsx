import React, { useState, useEffect } from 'react';

// Warning Icon for validation errors
const WarningIcon = ({ className = "w-4 h-4 inline mr-1" }) => ( // Added className prop with default
  <svg className={className} fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.216 3.031-1.742 3.031H4.42c-1.526 0-2.492-1.697-1.742-3.031l5.58-9.92zM10 13a1 1 0 110-2 1 1 0 010 2zm-1.75-4.5a1.75 1.75 0 00-3.5 0v.25h3.5v-.25z" clipRule="evenodd" />
  </svg>
);

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
      const { senha, ...otherData } = formData; // Destructure senha from formData
      const dataToSubmit = { ...otherData }; // Spread other data

      if (senha) { // If a new password is provided (for create or update)
        dataToSubmit.password = senha;
      }
      // If it's a new user (!initialData), validateForm already ensures 'senha' is not empty.
      // So, 'password' will be included.
      // If it's an update (initialData exists) and 'senha' is empty,
      // 'password' will not be added to dataToSubmit, so password remains unchanged.

      onSubmit(dataToSubmit);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 md:space-y-6">
      <div>
        <label htmlFor="nome_completo" className="block mb-2 text-sm font-medium text-gray-900">Nome Completo <span className="text-red-500">*</span></label>
        <input type="text" name="nome_completo" id="nome_completo" value={formData.nome_completo} onChange={handleChange}
               className={`bg-gray-50 border ${errors.nome_completo ? 'border-red-500' : 'border-gray-300'} text-gray-900 sm:text-sm rounded-md focus:ring-primary-500 focus:border-primary-500 block w-full px-3 py-2`} />
        {errors.nome_completo && <p className="mt-1 text-sm text-red-600 flex items-center"><WarningIcon /> {errors.nome_completo}</p>}
      </div>
      <div>
        <label htmlFor="login" className="block mb-2 text-sm font-medium text-gray-900">Login <span className="text-red-500">*</span></label>
        <input type="text" name="login" id="login" value={formData.login} onChange={handleChange}
               className={`bg-gray-50 border ${errors.login ? 'border-red-500' : 'border-gray-300'} text-gray-900 sm:text-sm rounded-md focus:ring-primary-500 focus:border-primary-500 block w-full px-3 py-2`} />
        {errors.login && <p className="mt-1 text-sm text-red-600 flex items-center"><WarningIcon /> {errors.login}</p>}
      </div>
      <div>
        <label htmlFor="senha" className="block mb-2 text-sm font-medium text-gray-900">
          Senha {initialData ? '(Deixe em branco para não alterar)' : <span className="text-red-500">*</span>}
        </label>
        <input type="password" name="senha" id="senha" value={formData.senha} onChange={handleChange}
               className={`bg-gray-50 border ${errors.senha ? 'border-red-500' : 'border-gray-300'} text-gray-900 sm:text-sm rounded-md focus:ring-primary-500 focus:border-primary-500 block w-full px-3 py-2`} />
        {errors.senha && <p className="mt-1 text-sm text-red-600 flex items-center"><WarningIcon /> {errors.senha}</p>}
      </div>
      <div>
        <label htmlFor="nivel_acesso" className="block mb-2 text-sm font-medium text-gray-900">Nível de Acesso <span className="text-red-500">*</span></label>
        <select name="nivel_acesso" id="nivel_acesso" value={formData.nivel_acesso} onChange={handleChange}
                className={`bg-gray-50 border ${errors.nivel_acesso ? 'border-red-500' : 'border-gray-300'} text-gray-900 sm:text-sm rounded-md focus:ring-primary-500 focus:border-primary-500 block w-full px-3 py-2`}>
          {nivelAcessoOptions.map(option => (
            <option key={option.value} value={option.value}>{option.label}</option>
          ))}
        </select>
        {errors.nivel_acesso && <p className="mt-1 text-sm text-red-600 flex items-center"><WarningIcon /> {errors.nivel_acesso}</p>}
      </div>
      <div className="flex items-center justify-end space-x-3 pt-2">
        <button type="button" onClick={onCancel} disabled={isLoading}
                className="py-2 px-4 text-sm font-medium text-gray-800 bg-gray-200 rounded-md hover:bg-gray-300 focus:ring-4 focus:outline-none focus:ring-gray-300 disabled:opacity-50">
          Cancelar
        </button>
        <button type="submit" disabled={isLoading}
                className="py-2 px-4 text-sm font-medium text-white bg-primary-600 rounded-md hover:bg-primary-700 focus:ring-4 focus:outline-none focus:ring-primary-300 disabled:bg-primary-300">
          {isLoading ? 'Salvando...' : (initialData ? 'Atualizar Usuário' : 'Criar Usuário')}
        </button>
      </div>
    </form>
  );
};

export default UsuarioForm;
