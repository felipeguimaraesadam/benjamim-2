import { useState, useEffect, useCallback } from 'react';

export const useApiData = (
    apiFunction,
    initialParams = undefined, // Default to undefined to better distinguish from null if null is a valid param
    initialData = null,
    autoFetch = true
) => {
    const [data, setData] = useState(initialData);
    const [isLoading, setIsLoading] = useState(autoFetch && initialParams !== undefined); // Only true if auto-fetching with params
    const [error, setError] = useState(null);
    const [currentParams, setCurrentParams] = useState(initialParams);

    // Effect to update currentParams if initialParams prop changes
    useEffect(() => {
        // Only update if initialParams has actually changed to avoid unnecessary re-renders/fetches
        if (JSON.stringify(initialParams) !== JSON.stringify(currentParams)) {
            setCurrentParams(initialParams);
        }
    }, [initialParams]); // currentParams removed from dep array to avoid loop with its own setter

    const executeFetch = useCallback(async (fetchParamsToUse) => {
        if (typeof apiFunction !== 'function') {
           console.error("apiFunction is not a function", apiFunction);
           setError("Erro de configuração: apiFunction inválida.");
           setIsLoading(false);
           return { success: false, error: "Erro de configuração: apiFunction inválida." };
        }

        // Check if the API function expects parameters (has arity > 0)
        // and if those parameters are not provided (undefined or null).
        // This check is simplified: if apiFunction has parameters, fetchParamsToUse must be provided.
        // A more robust check might inspect apiFunction.length more closely if some params are optional.
        if (apiFunction.length > 0 && (fetchParamsToUse === undefined || fetchParamsToUse === null)) {
            // If params are required but not provided, don't attempt fetch.
            // Set loading to false if it was true.
            // console.warn(`Parameters required for ${apiFunction.name} but not provided.`, fetchParamsToUse);
            setIsLoading(false);
            // Optionally set an error or return a specific status
            // setError("Parâmetros necessários não fornecidos para a requisição.");
            return { success: false, error: "Parâmetros necessários não fornecidos para a requisição." };
        }

        setIsLoading(true);
        setError(null);
        try {
            const response = await apiFunction(fetchParamsToUse); // Pass params even if undefined, let API func handle
            const responseData = response.data || response || (Array.isArray(initialData) ? [] : null);
            setData(responseData);
            return { success: true, data: responseData };
        } catch (err) {
            const errorMessage = err.response?.data?.detail || err.message || 'Falha ao buscar dados.';
            setError(errorMessage);
            console.error(`Error in useApiData with ${apiFunction?.name || 'anonymous API function'}:`, err);
            setData(initialData); // Reset to initialData on error
            return { success: false, error: errorMessage };
        } finally {
            setIsLoading(false);
        }
    }, [apiFunction, initialData]); // Removed JSON.stringify from initialData dependency

    useEffect(() => {
        if (autoFetch) {
            if (apiFunction.length > 0 && currentParams !== undefined) { // API func expects params
                executeFetch(currentParams);
            } else if (apiFunction.length === 0) { // API func takes no params
                executeFetch(); // No params to pass
            }
            // If apiFunction.length > 0 but currentParams IS undefined, it means params are required but not yet available.
            // In this case, we don't auto-fetch. The fetch can be triggered manually via fetchData later.
        } else {
            setIsLoading(false);
        }
    }, [executeFetch, currentParams, autoFetch, apiFunction]);

    const fetchData = useCallback(async (paramsForThisFetchOverride) => {
        // Use override if provided, otherwise use the hook's current internal params.
        const paramsToExecuteWith = paramsForThisFetchOverride !== undefined ? paramsForThisFetchOverride : currentParams;

        // Note: We are NOT calling setCurrentParams(paramsToExecuteWith) here.
        // If the intention is to change the hook's default params for reactive fetching,
        // the component using the hook should change the 'initialParams' prop it passes to useApiData.
        return executeFetch(paramsToExecuteWith);
    }, [executeFetch, currentParams]);


    return { data, isLoading, error, fetchData, setData, setError };
};
