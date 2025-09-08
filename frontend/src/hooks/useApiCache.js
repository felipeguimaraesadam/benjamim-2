import { useState, useEffect, useCallback, useRef } from 'react';

// Cache global para armazenar dados entre componentes
const globalCache = new Map();

// Configurações padrão do cache
const DEFAULT_TTL = 5 * 60 * 1000; // 5 minutos
const DEFAULT_STALE_WHILE_REVALIDATE = 10 * 60 * 1000; // 10 minutos

// Utilitário para gerar chave do cache
const generateCacheKey = (apiFunction, params) => {
  const functionName = apiFunction.name || 'anonymous';
  const paramsString = params ? JSON.stringify(params) : 'no-params';
  return `${functionName}:${paramsString}`;
};

// Utilitário para verificar se o cache está válido
const isCacheValid = (cacheEntry, ttl) => {
  if (!cacheEntry) return false;
  return Date.now() - cacheEntry.timestamp < ttl;
};

// Utilitário para verificar se pode usar stale data
const canUseStaleData = (cacheEntry, staleTime) => {
  if (!cacheEntry) return false;
  return Date.now() - cacheEntry.timestamp < staleTime;
};

export const useApiCache = ({
  apiFunction,
  params = undefined,
  initialData = null,
  autoFetch = true,
  ttl = DEFAULT_TTL,
  staleWhileRevalidate = DEFAULT_STALE_WHILE_REVALIDATE,
  enabled = true,
  onSuccess,
  onError,
}) => {
  const [data, setData] = useState(initialData);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isValidating, setIsValidating] = useState(false);
  const [lastFetch, setLastFetch] = useState(null);
  
  const abortControllerRef = useRef(null);
  const cacheKey = generateCacheKey(apiFunction, params);

  // Função para buscar dados da API
  const fetchFromApi = useCallback(async (signal) => {
    if (typeof apiFunction !== 'function') {
      throw new Error('apiFunction deve ser uma função válida');
    }

    // Verificar se a função espera parâmetros
    if (apiFunction.length > 0 && (params === undefined || params === null)) {
      throw new Error('Parâmetros são obrigatórios para esta função da API');
    }

    try {
      const response = await apiFunction(params);
      const responseData = response?.data || response || initialData;
      
      // Armazenar no cache
      globalCache.set(cacheKey, {
        data: responseData,
        timestamp: Date.now(),
        error: null,
      });

      return responseData;
    } catch (err) {
      if (signal?.aborted) {
        throw new Error('Request aborted');
      }
      
      const errorMessage = err.response?.data?.detail || err.message || 'Erro ao buscar dados';
      
      // Armazenar erro no cache por um tempo menor
      globalCache.set(cacheKey, {
        data: null,
        timestamp: Date.now(),
        error: errorMessage,
        isError: true,
      });
      
      throw new Error(errorMessage);
    }
  }, [apiFunction, params, cacheKey, initialData]);

  // Função principal para buscar dados
  const fetchData = useCallback(async (forceRefresh = false) => {
    if (!enabled) return { success: false, error: 'Fetch desabilitado' };

    // Cancelar requisição anterior se existir
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    const cacheEntry = globalCache.get(cacheKey);
    
    // Se não forçar refresh e tiver cache válido, usar cache
    if (!forceRefresh && isCacheValid(cacheEntry, ttl) && !cacheEntry?.isError) {
      setData(cacheEntry.data);
      setError(null);
      setLastFetch(cacheEntry.timestamp);
      return { success: true, data: cacheEntry.data, fromCache: true };
    }

    // Se tiver dados stale, usar enquanto revalida
    const hasStaleData = canUseStaleData(cacheEntry, staleWhileRevalidate) && !cacheEntry?.isError;
    
    if (hasStaleData && !forceRefresh) {
      setData(cacheEntry.data);
      setError(null);
      setIsValidating(true);
    } else {
      setIsLoading(true);
      setError(null);
    }

    // Criar novo AbortController
    abortControllerRef.current = new AbortController();
    const signal = abortControllerRef.current.signal;

    try {
      const responseData = await fetchFromApi(signal);
      
      setData(responseData);
      setError(null);
      setLastFetch(Date.now());
      
      onSuccess?.(responseData);
      
      return { success: true, data: responseData, fromCache: false };
    } catch (err) {
      if (err.message === 'Request aborted') {
        return { success: false, error: 'Requisição cancelada' };
      }
      
      // Se não tiver dados stale, mostrar erro
      if (!hasStaleData) {
        setData(initialData);
        setError(err.message);
      }
      
      onError?.(err);
      
      return { success: false, error: err.message };
    } finally {
      setIsLoading(false);
      setIsValidating(false);
      abortControllerRef.current = null;
    }
  }, [enabled, cacheKey, ttl, staleWhileRevalidate, fetchFromApi, initialData, onSuccess, onError]);

  // Função para invalidar cache
  const invalidateCache = useCallback(() => {
    globalCache.delete(cacheKey);
  }, [cacheKey]);

  // Função para atualizar dados localmente (otimistic updates)
  const mutate = useCallback((newData) => {
    if (typeof newData === 'function') {
      setData(prevData => {
        const updatedData = newData(prevData);
        // Atualizar cache também
        globalCache.set(cacheKey, {
          data: updatedData,
          timestamp: Date.now(),
          error: null,
        });
        return updatedData;
      });
    } else {
      setData(newData);
      // Atualizar cache
      globalCache.set(cacheKey, {
        data: newData,
        timestamp: Date.now(),
        error: null,
      });
    }
  }, [cacheKey]);

  // Ref para armazenar a função fetchData e evitar loop infinito
  const fetchDataRef = useRef();
  fetchDataRef.current = fetchData;

  // Auto-fetch no mount e quando parâmetros mudam
  useEffect(() => {
    if (autoFetch && enabled) {
      fetchDataRef.current();
    }

    // Cleanup: cancelar requisição ao desmontar
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [autoFetch, enabled]);

  // Verificar cache inicial
  useEffect(() => {
    const cacheEntry = globalCache.get(cacheKey);
    if (cacheEntry && isCacheValid(cacheEntry, ttl) && !cacheEntry?.isError) {
      setData(cacheEntry.data);
      setLastFetch(cacheEntry.timestamp);
    }
  }, [cacheKey, ttl]);

  return {
    data,
    isLoading,
    error,
    isValidating,
    lastFetch,
    fetchData,
    invalidateCache,
    mutate,
    refetch: () => fetchData(true),
  };
};

// Hook para limpar todo o cache
export const useClearCache = () => {
  return useCallback(() => {
    globalCache.clear();
  }, []);
};

// Hook para obter estatísticas do cache
export const useCacheStats = () => {
  const [stats, setStats] = useState({ size: 0, keys: [] });

  const updateStats = useCallback(() => {
    setStats({
      size: globalCache.size,
      keys: Array.from(globalCache.keys()),
    });
  }, []);

  useEffect(() => {
    updateStats();
    
    // Atualizar stats periodicamente
    const interval = setInterval(updateStats, 5000);
    return () => clearInterval(interval);
  }, [updateStats]);

  return { ...stats, refresh: updateStats };
};