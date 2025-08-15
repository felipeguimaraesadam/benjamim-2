import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const RegisterPage = () => {
  const [login, setLogin] = useState('');
  const [nomeCompleto, setNomeCompleto] = useState('');
  const [password, setPassword] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [showAdminPassword, setShowAdminPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { register } = useAuth();

  const handleSubmit = async e => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    const userData = {
      login,
      nome_completo: nomeCompleto,
      password,
      nivel_acesso: 'user', // Default level
    };

    if (showAdminPassword) {
      userData.admin_password = adminPassword;
    }

    try {
      await register(userData);
      navigate('/login');
    } catch (err) {
      setError(err.message || 'Erro ao registrar. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900">
      <div className="w-full max-w-md p-8 space-y-6 bg-white dark:bg-gray-800 shadow-xl rounded-xl">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-primary-600 dark:text-primary-400">
            Registrar
          </h1>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
            Crie sua conta para acessar o sistema.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label
              htmlFor="login"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
            >
              Login
            </label>
            <input
              id="login"
              name="login"
              type="text"
              autoComplete="username"
              required
              value={login}
              onChange={e => setLogin(e.target.value)}
              className="form-input"
              placeholder="Seu login"
            />
          </div>

          <div>
            <label
              htmlFor="nomeCompleto"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
            >
              Nome Completo
            </label>
            <input
              id="nomeCompleto"
              name="nomeCompleto"
              type="text"
              autoComplete="name"
              required
              value={nomeCompleto}
              onChange={e => setNomeCompleto(e.target.value)}
              className="form-input"
              placeholder="Seu nome completo"
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
            >
              Senha
            </label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="new-password"
              required
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="form-input"
              placeholder="Sua senha"
            />
          </div>

          <div className="flex items-center">
            <input
              id="showAdminPassword"
              type="checkbox"
              checked={showAdminPassword}
              onChange={() => setShowAdminPassword(!showAdminPassword)}
              className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
            />
            <label
              htmlFor="showAdminPassword"
              className="ml-2 block text-sm text-gray-900 dark:text-gray-300"
            >
              Criar como Administrador
            </label>
          </div>

          {showAdminPassword && (
            <div>
              <label
                htmlFor="adminPassword"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
              >
                Senha de Administrador
              </label>
              <input
                id="adminPassword"
                name="adminPassword"
                type="password"
                value={adminPassword}
                onChange={e => setAdminPassword(e.target.value)}
                className="form-input"
                placeholder="Senha de segurança para admin"
              />
            </div>
          )}

          {error && (
            <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 rounded-md text-sm">
              {error}
            </div>
          )}

          <div>
            <button
              type="submit"
              disabled={isLoading}
              className="w-full btn-primary flex items-center justify-center"
            >
              {isLoading ? 'Registrando...' : 'Registrar'}
            </button>
          </div>
        </form>

        <p className="text-sm text-center text-gray-600 dark:text-gray-300">
          Já tem uma conta?{' '}
          <Link
            to="/login"
            className="font-medium text-primary-600 hover:text-primary-500 dark:text-primary-400 dark:hover:text-primary-300"
          >
            Faça login
          </Link>
        </p>
      </div>
    </div>
  );
};

export default RegisterPage;
