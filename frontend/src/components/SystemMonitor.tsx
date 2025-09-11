import React, { useState, useEffect } from 'react';
import { AlertCircle, Activity, Server, Database, Cpu, HardDrive, Users, RefreshCw, Download, Trash2 } from 'lucide-react';
import * as api from '../services/api';

interface SystemMetrics {
  system: {
    cpu_percent: number;
    memory_percent: number;
    memory_used_gb: number;
    memory_total_gb: number;
    disk_percent: number;
    disk_used_gb: number;
    disk_total_gb: number;
  };
  database: {
    users: number;
    obras: number;
    backups: number;
  };
  timestamp: string;
}

interface SystemStatus {
  status: 'healthy' | 'warning' | 'error';
  checks: {
    database: boolean;
    storage: boolean;
    memory: boolean;
  };
  timestamp: string;
}

interface LogEntry {
  timestamp: string;
  level: string;
  message: string;
}

const SystemMonitor: React.FC = () => {
  const [metrics, setMetrics] = useState<SystemMetrics | null>(null);
  const [status, setStatus] = useState<SystemStatus | null>(null);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [selectedLogType, setSelectedLogType] = useState<'info' | 'error' | 'security'>('info');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(false);

  const fetchMetrics = async () => {
    try {
      const response = await api.get('/metrics/');
      setMetrics(response.data);
    } catch (err) {
      console.error('Erro ao buscar métricas:', err);
      setError('Erro ao carregar métricas do sistema');
    }
  };

  const fetchStatus = async () => {
    try {
      const response = await api.get('/status/');
      setStatus(response.data);
    } catch (err) {
      console.error('Erro ao buscar status:', err);
      setError('Erro ao carregar status do sistema');
    }
  };

  const fetchLogs = async (logType: 'info' | 'error' | 'security' = selectedLogType) => {
    try {
      setLoading(true);
      const response = await api.get(`/logs/?type=${logType}&lines=50`);
      
      // Parse logs (assumindo formato simples de texto)
      const logLines = response.data.logs || [];
      const parsedLogs = logLines.map((line: string, index: number) => ({
        timestamp: new Date().toISOString(), // Simplificado
        level: logType.toUpperCase(),
        message: line
      }));
      
      setLogs(parsedLogs);
    } catch (err) {
      console.error('Erro ao buscar logs:', err);
      setError('Erro ao carregar logs do sistema');
    } finally {
      setLoading(false);
    }
  };

  const clearLogs = async () => {
    try {
      await api.post('/logs/clear/', { type: selectedLogType });
      await fetchLogs();
    } catch (err) {
      console.error('Erro ao limpar logs:', err);
      setError('Erro ao limpar logs');
    }
  };

  const refreshAll = async () => {
    setLoading(true);
    setError(null);
    
    try {
      await Promise.all([
        fetchMetrics(),
        fetchStatus(),
        fetchLogs()
      ]);
    } catch (err) {
      setError('Erro ao atualizar dados do sistema');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshAll();
  }, []);

  useEffect(() => {
    fetchLogs(selectedLogType);
  }, [selectedLogType]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (autoRefresh) {
      interval = setInterval(() => {
        fetchMetrics();
        fetchStatus();
      }, 30000); // Atualizar a cada 30 segundos
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [autoRefresh]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'text-green-600 bg-green-100';
      case 'warning': return 'text-yellow-600 bg-yellow-100';
      case 'error': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getProgressColor = (percentage: number) => {
    if (percentage < 50) return 'bg-green-500';
    if (percentage < 80) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">Monitor do Sistema</h1>
        <div className="flex items-center space-x-4">
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
              className="rounded"
            />
            <span className="text-sm text-gray-600">Auto-atualizar</span>
          </label>
          <button
            onClick={refreshAll}
            disabled={loading}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            <span>Atualizar</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          <div className="flex items-center">
            <AlertCircle className="h-5 w-5 mr-2" />
            {error}
          </div>
        </div>
      )}

      {/* Status do Sistema */}
      {status && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4 flex items-center">
            <Activity className="h-5 w-5 mr-2" />
            Status do Sistema
          </h2>
          <div className="flex items-center space-x-4">
            <div className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(status.status)}`}>
              {status.status === 'healthy' ? 'Saudável' : 
               status.status === 'warning' ? 'Atenção' : 'Erro'}
            </div>
            <div className="text-sm text-gray-500">
              Última verificação: {new Date(status.timestamp).toLocaleString('pt-BR')}
            </div>
          </div>
          <div className="mt-4 grid grid-cols-3 gap-4">
            <div className="flex items-center space-x-2">
              <Database className="h-4 w-4" />
              <span className="text-sm">Banco de dados:</span>
              <span className={`text-sm font-medium ${status.checks.database ? 'text-green-600' : 'text-red-600'}`}>
                {status.checks.database ? 'OK' : 'Erro'}
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <HardDrive className="h-4 w-4" />
              <span className="text-sm">Armazenamento:</span>
              <span className={`text-sm font-medium ${status.checks.storage ? 'text-green-600' : 'text-red-600'}`}>
                {status.checks.storage ? 'OK' : 'Erro'}
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <Cpu className="h-4 w-4" />
              <span className="text-sm">Memória:</span>
              <span className={`text-sm font-medium ${status.checks.memory ? 'text-green-600' : 'text-red-600'}`}>
                {status.checks.memory ? 'OK' : 'Erro'}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Métricas do Sistema */}
      {metrics && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* CPU */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold flex items-center">
                <Cpu className="h-5 w-5 mr-2" />
                CPU
              </h3>
              <span className="text-2xl font-bold">{metrics.system.cpu_percent}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className={`h-2 rounded-full ${getProgressColor(metrics.system.cpu_percent)}`}
                style={{ width: `${metrics.system.cpu_percent}%` }}
              ></div>
            </div>
          </div>

          {/* Memória */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold flex items-center">
                <Server className="h-5 w-5 mr-2" />
                Memória
              </h3>
              <span className="text-2xl font-bold">{metrics.system.memory_percent}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
              <div 
                className={`h-2 rounded-full ${getProgressColor(metrics.system.memory_percent)}`}
                style={{ width: `${metrics.system.memory_percent}%` }}
              ></div>
            </div>
            <div className="text-sm text-gray-600">
              {metrics.system.memory_used_gb}GB / {metrics.system.memory_total_gb}GB
            </div>
          </div>

          {/* Disco */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold flex items-center">
                <HardDrive className="h-5 w-5 mr-2" />
                Disco
              </h3>
              <span className="text-2xl font-bold">{metrics.system.disk_percent}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
              <div 
                className={`h-2 rounded-full ${getProgressColor(metrics.system.disk_percent)}`}
                style={{ width: `${metrics.system.disk_percent}%` }}
              ></div>
            </div>
            <div className="text-sm text-gray-600">
              {metrics.system.disk_used_gb}GB / {metrics.system.disk_total_gb}GB
            </div>
          </div>

          {/* Estatísticas do Banco */}
          <div className="bg-white rounded-lg shadow p-6 md:col-span-2 lg:col-span-3">
            <h3 className="text-lg font-semibold mb-4 flex items-center">
              <Database className="h-5 w-5 mr-2" />
              Estatísticas do Banco de Dados
            </h3>
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-600">{metrics.database.users}</div>
                <div className="text-sm text-gray-600">Usuários</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-green-600">{metrics.database.obras}</div>
                <div className="text-sm text-gray-600">Obras</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-purple-600">{metrics.database.backups}</div>
                <div className="text-sm text-gray-600">Backups</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Logs do Sistema */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Logs do Sistema</h2>
          <div className="flex items-center space-x-4">
            <select
              value={selectedLogType}
              onChange={(e) => setSelectedLogType(e.target.value as 'info' | 'error' | 'security')}
              className="border border-gray-300 rounded px-3 py-1 text-sm"
            >
              <option value="info">Informações</option>
              <option value="error">Erros</option>
              <option value="security">Segurança</option>
            </select>
            <button
              onClick={clearLogs}
              className="flex items-center space-x-1 px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700"
            >
              <Trash2 className="h-4 w-4" />
              <span>Limpar</span>
            </button>
          </div>
        </div>
        
        <div className="bg-gray-900 text-green-400 p-4 rounded font-mono text-sm max-h-96 overflow-y-auto">
          {loading ? (
            <div className="text-center text-gray-500">Carregando logs...</div>
          ) : logs.length > 0 ? (
            logs.map((log, index) => (
              <div key={index} className="mb-1">
                <span className="text-gray-500">[{log.level}]</span> {log.message}
              </div>
            ))
          ) : (
            <div className="text-center text-gray-500">Nenhum log encontrado</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SystemMonitor;