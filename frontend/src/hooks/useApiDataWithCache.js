import { useApiCache } from './useApiCache';

/**
 * Hook que combina useApiData com cache para facilitar migração gradual
 * Mantém a mesma interface do useApiData mas adiciona funcionalidades de cache
 */
export const useApiDataWithCache = (
  apiFunction,
  initialParams = undefined,
  initialData = null,
  autoFetch = true,
  cacheOptions = {}
) => {
  const {
    ttl = 5 * 60 * 1000, // 5 minutos padrão
    staleWhileRevalidate = 10 * 60 * 1000, // 10 minutos padrão
    enabled = true,
    onSuccess,
    onError,
  } = cacheOptions;

  const {
    data,
    isLoading,
    error,
    isValidating,
    lastFetch,
    fetchData: cachedFetchData,
    invalidateCache,
    mutate,
    refetch,
  } = useApiCache({
    apiFunction,
    params: initialParams,
    initialData,
    autoFetch,
    ttl,
    staleWhileRevalidate,
    enabled,
    onSuccess,
    onError,
  });

  // Manter compatibilidade com useApiData
  const fetchData = async (paramsOverride) => {
    if (paramsOverride !== undefined) {
      // Se parâmetros foram fornecidos, criar uma nova instância temporária
      // Isso não é ideal para cache, mas mantém compatibilidade
      console.warn('useApiDataWithCache: Usar parâmetros override pode reduzir eficiência do cache');
      
      try {
        const response = await apiFunction(paramsOverride);
        return { 
          success: true, 
          data: response?.data || response || initialData 
        };
      } catch (err) {
        const errorMessage = err.response?.data?.detail || err.message || 'Erro ao buscar dados';
        return { 
          success: false, 
          error: errorMessage 
        };
      }
    }
    
    return cachedFetchData();
  };

  // Função para atualizar dados (compatibilidade com useApiData)
  const setData = (newData) => {
    mutate(newData);
  };

  // Função para definir erro (compatibilidade com useApiData)
  const setError = () => {
    // Implementação básica - em um cenário real, você pode querer
    // atualizar o cache com o erro também
    console.warn('setError chamado - considere usar invalidateCache() em vez disso');
  };

  return {
    data,
    isLoading,
    error,
    fetchData,
    setData,
    setError,
    // Funcionalidades extras do cache
    isValidating,
    lastFetch,
    invalidateCache,
    mutate,
    refetch,
  };
};

/**
 * Hook otimizado para listas com paginação
 */
export const useApiListWithCache = (
  apiFunction,
  initialParams = { page: 1, page_size: 10 },
  cacheOptions = {}
) => {
  const {
    ttl = 2 * 60 * 1000, // 2 minutos para listas (mais dinâmicas)
    staleWhileRevalidate = 5 * 60 * 1000, // 5 minutos
    ...otherOptions
  } = cacheOptions;

  return useApiDataWithCache(
    apiFunction,
    initialParams,
    { results: [], count: 0, next: null, previous: null },
    true,
    { ttl, staleWhileRevalidate, ...otherOptions }
  );
};

/**
 * Hook otimizado para dados de detalhes (menos voláteis)
 */
export const useApiDetailWithCache = (
  apiFunction,
  id,
  cacheOptions = {}
) => {
  const {
    ttl = 10 * 60 * 1000, // 10 minutos para detalhes
    staleWhileRevalidate = 30 * 60 * 1000, // 30 minutos
    ...otherOptions
  } = cacheOptions;

  return useApiDataWithCache(
    apiFunction,
    id,
    null,
    !!id, // só busca se tiver ID
    { ttl, staleWhileRevalidate, ...otherOptions }
  );
};

/**
 * Hook para dados de dashboard/estatísticas (atualizações frequentes)
 */
export const useApiStatsWithCache = (
  apiFunction,
  params = undefined,
  cacheOptions = {}
) => {
  const {
    ttl = 30 * 1000, // 30 segundos para stats
    staleWhileRevalidate = 2 * 60 * 1000, // 2 minutos
    ...otherOptions
  } = cacheOptions;

  return useApiDataWithCache(
    apiFunction,
    params,
    null,
    true,
    { ttl, staleWhileRevalidate, ...otherOptions }
  );
};