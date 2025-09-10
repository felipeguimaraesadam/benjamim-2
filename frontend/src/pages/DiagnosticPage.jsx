import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';

const DiagnosticPage = () => {
  const [healthData, setHealthData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const checkHealth = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Testar conectividade local
      const localResponse = await fetch('http://localhost:8000/api/health-check/');
      const localData = await localResponse.json();
      
      // Testar conectividade com produção (Render)
      let prodData = null;
      try {
        const prodResponse = await fetch('https://backend-sgo-core.onrender.com/api/health-check/');
        prodData = await prodResponse.json();
      } catch (prodError) {
        console.warn('Produção não acessível:', prodError);
      }
      
      setHealthData({
        local: localData,
        production: prodData,
        timestamp: new Date().toISOString()
      });
    } catch (err) {
      setError(`Erro ao verificar saúde do sistema: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkHealth();
  }, []);

  const getStatusBadge = (status) => {
    if (status === 'ok') return <Badge variant="success">Online</Badge>;
    if (status === 'error') return <Badge variant="error">Erro</Badge>;
    return <Badge variant="warning">Desconhecido</Badge>;
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Diagnóstico do Sistema</h1>
        <Button onClick={checkHealth} disabled={loading}>
          {loading ? 'Verificando...' : 'Atualizar'}
        </Button>
      </div>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
          {error}
        </div>
      )}
      
      <div className="grid gap-6 md:grid-cols-2">
        {/* Ambiente Local */}
        <Card>
          <CardHeader>
            <CardTitle>Ambiente Local</CardTitle>
          </CardHeader>
          <CardContent>
            {healthData?.local ? (
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span>Status Geral</span>
                  {getStatusBadge(healthData.local.status)}
                </div>
                <div className="flex justify-between items-center">
                  <span>Banco de Dados</span>
                  {getStatusBadge(healthData.local.database?.status)}
                </div>
                <div className="text-sm text-gray-600">
                  <p><strong>Engine:</strong> {healthData.local.environment?.database_engine}</p>
                  <p><strong>Debug:</strong> {healthData.local.environment?.debug ? 'Ativo' : 'Inativo'}</p>
                  <p><strong>CORS Origins:</strong> {healthData.local.environment?.cors_origins?.length || 0} configurados</p>
                </div>
              </div>
            ) : (
              <div className="text-gray-500">Carregando...</div>
            )}
          </CardContent>
        </Card>

        {/* Ambiente de Produção */}
        <Card>
          <CardHeader>
            <CardTitle>Produção (Render)</CardTitle>
          </CardHeader>
          <CardContent>
            {healthData?.production ? (
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span>Status Geral</span>
                  {getStatusBadge(healthData.production.status)}
                </div>
                <div className="flex justify-between items-center">
                  <span>Banco de Dados</span>
                  {getStatusBadge(healthData.production.database?.status)}
                </div>
                <div className="text-sm text-gray-600">
                  <p><strong>Engine:</strong> {healthData.production.environment?.database_engine}</p>
                  <p><strong>Debug:</strong> {healthData.production.environment?.debug ? 'Ativo' : 'Inativo'}</p>
                  <p><strong>CORS Origins:</strong> {healthData.production.environment?.cors_origins?.length || 0} configurados</p>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span>Status</span>
                  <Badge variant="error">Inacessível</Badge>
                </div>
                <div className="text-sm text-red-600">
                  Não foi possível conectar com o servidor de produção
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Variáveis de Ambiente */}
      {healthData && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Configurações de Ambiente</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <h4 className="font-semibold mb-2">Local</h4>
                <div className="space-y-1 text-sm">
                  {Object.entries(healthData.local?.environment?.env_vars || {}).map(([key, value]) => (
                    <div key={key} className="flex justify-between">
                      <span>{key}:</span>
                      <Badge variant={value ? "success" : "error"}>
                        {value ? "Configurado" : "Ausente"}
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
              
              {healthData.production && (
                <div>
                  <h4 className="font-semibold mb-2">Produção</h4>
                  <div className="space-y-1 text-sm">
                    {Object.entries(healthData.production?.environment?.env_vars || {}).map(([key, value]) => (
                      <div key={key} className="flex justify-between">
                        <span>{key}:</span>
                        <Badge variant={value ? "success" : "error"}>
                          {value ? "Configurado" : "Ausente"}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Timestamp */}
      {healthData && (
        <div className="mt-4 text-sm text-gray-500 text-center">
          Última verificação: {new Date(healthData.timestamp).toLocaleString('pt-BR')}
        </div>
      )}
    </div>
  );
};

export default DiagnosticPage;