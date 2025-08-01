import React, { useState, useEffect } from 'react';
import { useErrorMonitoring } from '../../services/errorMonitoring';

const ErrorMonitoringPanel = ({ isVisible = false, onClose }) => {
  const { getErrors, getStats, clearErrors } = useErrorMonitoring();
  const [errors, setErrors] = useState([]);
  const [stats, setStats] = useState({});
  const [selectedError, setSelectedError] = useState(null);
  const [filter, setFilter] = useState('all');
  const [isExpanded, setIsExpanded] = useState(isVisible);

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 5000); // Atualiza a cada 5 segundos
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    setIsExpanded(isVisible);
  }, [isVisible]);

  const handleClose = () => {
    setIsExpanded(false);
    if (onClose) {
      onClose();
    }
  };

  const loadData = () => {
    setErrors(getErrors(100));
    setStats(getStats());
  };

  const filteredErrors = errors.filter(error => {
    if (filter === 'all') return true;
    return error.type === filter;
  });

  const handleClearErrors = () => {
    if (window.confirm('Tem certeza que deseja limpar todos os erros?')) {
      clearErrors();
      loadData();
    }
  };

  const formatTimestamp = (timestamp) => {
    return new Date(timestamp).toLocaleString('pt-BR');
  };

  const getErrorTypeColor = (type) => {
    const colors = {
      javascript: 'bg-red-100 text-red-800',
      network_error: 'bg-orange-100 text-orange-800',
      http_error: 'bg-yellow-100 text-yellow-800',
      unhandled_promise_rejection: 'bg-purple-100 text-purple-800',
      resource: 'bg-blue-100 text-blue-800',
      manual: 'bg-green-100 text-green-800',
      message: 'bg-gray-100 text-gray-800'
    };
    return colors[type] || 'bg-gray-100 text-gray-800';
  };

  const getLevelColor = (level) => {
    const colors = {
      error: 'text-red-600',
      warning: 'text-yellow-600',
      info: 'text-blue-600',
      debug: 'text-gray-600'
    };
    return colors[level] || 'text-gray-600';
  };

  if (!isExpanded) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <button
          onClick={() => setIsExpanded(true)}
          className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg shadow-lg flex items-center space-x-2"
        >
          <span className="text-sm font-medium">Erros: {stats.total || 0}</span>
          {stats.recent > 0 && (
            <span className="bg-red-800 text-xs px-2 py-1 rounded-full">
              {stats.recent} recentes
            </span>
          )}
        </button>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gray-50 px-6 py-4 border-b border-gray-200 flex justify-between items-center">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Monitoramento de Erros</h2>
            <p className="text-sm text-gray-600">
              Total: {stats.total} | Última hora: {stats.recent}
            </p>
          </div>
          <div className="flex space-x-2">
            <button
              onClick={handleClearErrors}
              className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 text-sm"
            >
              Limpar Todos
            </button>
            <button
              onClick={handleClose}
              className="px-3 py-1 bg-gray-600 text-white rounded hover:bg-gray-700 text-sm"
            >
              Fechar
            </button>
          </div>
        </div>

        <div className="flex h-[calc(90vh-120px)]">
          {/* Lista de Erros */}
          <div className="w-1/2 border-r border-gray-200 overflow-hidden">
            {/* Filtros */}
            <div className="p-4 border-b border-gray-200">
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
              >
                <option value="all">Todos os tipos</option>
                <option value="javascript">JavaScript</option>
                <option value="network_error">Erro de Rede</option>
                <option value="http_error">Erro HTTP</option>
                <option value="unhandled_promise_rejection">Promise Rejeitada</option>
                <option value="resource">Recurso</option>
                <option value="manual">Manual</option>
                <option value="message">Mensagem</option>
              </select>
            </div>

            {/* Lista */}
            <div className="overflow-y-auto h-full">
              {filteredErrors.length === 0 ? (
                <div className="p-4 text-center text-gray-500">
                  Nenhum erro encontrado
                </div>
              ) : (
                filteredErrors.map((error, index) => (
                  <div
                    key={index}
                    onClick={() => setSelectedError(error)}
                    className={`p-4 border-b border-gray-100 cursor-pointer hover:bg-gray-50 ${
                      selectedError === error ? 'bg-blue-50 border-blue-200' : ''
                    }`}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getErrorTypeColor(error.type)}`}>
                        {error.type}
                      </span>
                      <span className="text-xs text-gray-500">
                        {formatTimestamp(error.timestamp)}
                      </span>
                    </div>
                    <p className={`text-sm font-medium ${error.level ? getLevelColor(error.level) : 'text-gray-900'}`}>
                      {error.message}
                    </p>
                    {error.url && (
                      <p className="text-xs text-gray-500 mt-1 truncate">
                        {new URL(error.url).pathname}
                      </p>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Detalhes do Erro */}
          <div className="w-1/2 overflow-y-auto">
            {selectedError ? (
              <div className="p-6">
                <div className="mb-4">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    Detalhes do Erro
                  </h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-medium text-gray-700">Tipo:</span>
                      <span className={`ml-2 px-2 py-1 rounded text-xs ${getErrorTypeColor(selectedError.type)}`}>
                        {selectedError.type}
                      </span>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700">Timestamp:</span>
                      <span className="ml-2 text-gray-600">
                        {formatTimestamp(selectedError.timestamp)}
                      </span>
                    </div>
                    {selectedError.level && (
                      <div>
                        <span className="font-medium text-gray-700">Nível:</span>
                        <span className={`ml-2 ${getLevelColor(selectedError.level)}`}>
                          {selectedError.level}
                        </span>
                      </div>
                    )}
                    {selectedError.status && (
                      <div>
                        <span className="font-medium text-gray-700">Status:</span>
                        <span className="ml-2 text-gray-600">
                          {selectedError.status}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="mb-4">
                  <h4 className="font-medium text-gray-700 mb-2">Mensagem:</h4>
                  <p className="text-sm text-gray-900 bg-gray-50 p-3 rounded">
                    {selectedError.message}
                  </p>
                </div>

                {selectedError.stack && (
                  <div className="mb-4">
                    <h4 className="font-medium text-gray-700 mb-2">Stack Trace:</h4>
                    <pre className="text-xs text-gray-800 bg-gray-50 p-3 rounded overflow-x-auto">
                      {selectedError.stack}
                    </pre>
                  </div>
                )}

                {selectedError.url && (
                  <div className="mb-4">
                    <h4 className="font-medium text-gray-700 mb-2">URL:</h4>
                    <p className="text-sm text-gray-900 bg-gray-50 p-3 rounded break-all">
                      {selectedError.url}
                    </p>
                  </div>
                )}

                {selectedError.user && (
                  <div className="mb-4">
                    <h4 className="font-medium text-gray-700 mb-2">Usuário:</h4>
                    <p className="text-sm text-gray-900">
                      ID: {selectedError.user.id} | Username: {selectedError.user.username}
                    </p>
                  </div>
                )}

                {selectedError.context && (
                  <div className="mb-4">
                    <h4 className="font-medium text-gray-700 mb-2">Contexto:</h4>
                    <pre className="text-xs text-gray-800 bg-gray-50 p-3 rounded overflow-x-auto">
                      {JSON.stringify(selectedError.context, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            ) : (
              <div className="p-6 text-center text-gray-500">
                Selecione um erro para ver os detalhes
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ErrorMonitoringPanel;