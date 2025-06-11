import React, { useState, useEffect, useCallback, useRef, useImperativeHandle } from 'react'; // Added useRef, useImperativeHandle
import * as api from '../../services/api';
import MaterialForm from './MaterialForm';

const debounce = (func, delay) => {
    let timeoutId;
    return (...args) => {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => {
            func.apply(null, args);
        }, delay);
    };
};

const MaterialAutocomplete = React.forwardRef(({ value, onMaterialSelect, itemIndex, error, onKeyDown }, ref) => { // Added onKeyDown prop and ref
    const [inputValue, setInputValue] = useState('');
    const [suggestions, setSuggestions] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [showNewMaterialModal, setShowNewMaterialModal] = useState(false);
    const [isSubmittingNewMaterial, setIsSubmittingNewMaterial] = useState(false);
    const [newMaterialError, setNewMaterialError] = useState(null);

    const inputRef = useRef(null); // Ref for the actual input element

    // Expose focus method to parent components
    useImperativeHandle(ref, () => ({
        focus: () => {
            inputRef.current.focus();
        }
    }));

    useEffect(() => {
        if (value && value.nome) {
            setInputValue(value.nome);
        } else if (typeof value === 'string') {
            setInputValue(value);
        } else {
            setInputValue('');
        }
    }, [value]);

    const debouncedFetchSuggestions = useCallback(
        debounce(async (query) => {
            if (!query || query.length < 1) {
                setSuggestions([]);
                setShowSuggestions(false);
                return;
            }
            setIsLoading(true);
            setShowSuggestions(true);
            try {
                const response = await api.getMateriais({ nome__icontains: query, page_size: 10 });
                setSuggestions(response.data?.results || response.data || response || []);
            } catch (err) {
                console.error("Error fetching material suggestions:", err);
                setSuggestions([]);
            } finally {
                setIsLoading(false);
            }
        }, 300),
        []
    );

    const handleInputChange = (e) => {
        const newInputValue = e.target.value;
        setInputValue(newInputValue);
        if (newInputValue.trim() === '') {
            setSuggestions([]);
            setShowSuggestions(false);
            if (value) {
              onMaterialSelect(itemIndex, null);
            }
        } else {
            debouncedFetchSuggestions(newInputValue);
        }
    };

    const handleSuggestionClick = (material) => {
        setInputValue(material.nome);
        setSuggestions([]);
        setShowSuggestions(false);
        onMaterialSelect(itemIndex, material);
    };

    const handleFocus = () => {
        if (inputValue.trim() && !showNewMaterialModal) {
            if (suggestions.length > 0) {
                setShowSuggestions(true);
            } else {
                 debouncedFetchSuggestions(inputValue);
            }
        } else if (suggestions.length > 0 && !showNewMaterialModal) {
             setShowSuggestions(true);
        }
    };

    const handleBlur = () => {
        setTimeout(() => {
            const activeEl = document.activeElement;
            if (activeEl && (activeEl.closest('.suggestions-list-container') || activeEl.closest('.new-material-modal-container'))) {
                return;
            }
            setShowSuggestions(false);
        }, 200);
    };

    const handleShowNewMaterialModal = () => {
        setShowSuggestions(false);
        setNewMaterialError(null);
        setShowNewMaterialModal(true);
    };

    const handleCloseNewMaterialModal = () => {
        setShowNewMaterialModal(false);
        setNewMaterialError(null);
        inputRef.current?.focus(); // Focus back to autocomplete input
    };

    const handleNewMaterialSubmit = async (materialFormData) => {
        setIsSubmittingNewMaterial(true);
        setNewMaterialError(null);
        try {
            const response = await api.createMaterial(materialFormData);
            const createdMaterial = response.data || response;
            onMaterialSelect(itemIndex, createdMaterial);
            setInputValue(createdMaterial.nome);
            handleCloseNewMaterialModal();
        } catch (err) {
            console.error("Error creating new material:", err);
            let errorMessage = 'Falha ao criar novo material.';
            if (err.response && err.response.data) {
                const errorData = err.response.data;
                if (typeof errorData === 'string') errorMessage = errorData;
                else if (errorData.detail) errorMessage = errorData.detail;
                else if (errorData.nome && Array.isArray(errorData.nome)) errorMessage = `Nome: ${errorData.nome.join(' ')}`;
                else if (errorData.unidade_medida && Array.isArray(errorData.unidade_medida)) errorMessage = `Unidade: ${errorData.unidade_medida.join(' ')}`;
                else if (errorData.non_field_errors && Array.isArray(errorData.non_field_errors)) errorMessage = errorData.non_field_errors.join('; ');
                else {
                    const fieldErrors = Object.entries(errorData).map(([key, val]) => `${key}: ${Array.isArray(val) ? val.join(', ') : val}`).join('; ');
                    if (fieldErrors) errorMessage = fieldErrors;
                }
            } else if (err.message) errorMessage = err.message;
            setNewMaterialError(errorMessage);
        } finally {
            setIsSubmittingNewMaterial(false);
        }
    };

    // Propagate keydown event to parent if it's provided (for navigation)
    const internalOnKeyDown = (e) => {
        if (onKeyDown) {
            onKeyDown(e);
        }
        // Prevent suggestions list from stealing Enter key if it's not handled by parent
        if (e.key === 'Enter' && showSuggestions && suggestions.length > 0) {
             // Potentially select first suggestion or handle as needed, or let parent handle
        }
    };


    return (
        <div className="relative w-full">
            <input
                ref={inputRef} // Assign ref to the input
                type="text"
                id={`material-input-${itemIndex}`}
                value={inputValue}
                onChange={handleInputChange}
                onFocus={handleFocus}
                onBlur={handleBlur}
                onKeyDown={internalOnKeyDown} // Use internal handler that calls prop
                placeholder="Digite para buscar material..."
                className={`w-full p-1.5 border ${error ? 'border-red-500' : 'border-slate-300'} rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 text-sm`}
                aria-autocomplete="list"
                aria-expanded={showSuggestions && suggestions.length > 0 && !showNewMaterialModal}
                aria-controls={`suggestions-list-${itemIndex}`}
                autoComplete="off"
            />
            {error && <p className="text-xs text-red-600 mt-0.5">{error}</p>}

            <div className="suggestions-list-container">
                {showSuggestions && !isLoading && suggestions.length === 0 && inputValue.trim() !== '' && !showNewMaterialModal && (
                    <div className="absolute z-10 w-full bg-white border border-slate-300 rounded-md mt-1 p-3 text-sm text-slate-500 shadow-lg">
                        <span>Nenhum material encontrado com "{inputValue}".</span>
                        <button
                            type="button"
                            onClick={handleShowNewMaterialModal}
                            className="ml-2 text-sm text-primary-600 hover:text-primary-700 font-semibold focus:outline-none underline"
                        >
                            + Cadastrar Novo Material
                        </button>
                    </div>
                )}
                {showSuggestions && suggestions.length > 0 && !showNewMaterialModal && (
                     <ul id={`suggestions-list-${itemIndex}`} role="listbox" className="absolute z-10 w-full bg-white border border-slate-300 rounded-md mt-1 max-h-60 overflow-y-auto shadow-lg">
                        {suggestions.map((material, idx) => (
                            <li
                                key={material.id}
                                id={`suggestion-${itemIndex}-${idx}`}
                                role="option"
                                aria-selected={false}
                                onMouseDown={() => handleSuggestionClick(material)}
                                className="px-3 py-2 hover:bg-primary-100 cursor-pointer text-sm text-slate-700"
                            >
                                {material.nome} ({material.unidade_medida})
                            </li>
                        ))}
                    </ul>
                )}
                 {isLoading && showSuggestions && !showNewMaterialModal && (
                    <div className="absolute z-10 w-full bg-white border border-slate-300 rounded-md mt-1 p-3 text-sm text-slate-500 shadow-lg">
                        Buscando...
                    </div>
                )}
            </div>

            {showNewMaterialModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black bg-opacity-70 backdrop-blur-sm p-4 new-material-modal-container" role="dialog" aria-modal="true" aria-labelledby="new-material-modal-title">
                    <div className="bg-white p-5 rounded-lg shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
                        <div className="flex justify-between items-center mb-4">
                            <h2 id="new-material-modal-title" className="text-xl font-semibold text-slate-800">Cadastrar Novo Material</h2>
                            <button onClick={handleCloseNewMaterialModal} className="text-slate-500 hover:text-slate-700 text-2xl leading-none p-1 -mr-1 -mt-1" aria-label="Fechar modal">&times;</button>
                        </div>
                        {newMaterialError && (
                             <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-3 rounded mb-3 text-sm" role="alert">
                                <p><span className="font-bold">Erro:</span> {newMaterialError}</p>
                            </div>
                        )}
                        <MaterialForm
                            initialData={{ nome: inputValue.trim() }}
                            onSubmit={handleNewMaterialSubmit}
                            onCancel={handleCloseNewMaterialModal}
                            isLoading={isSubmittingNewMaterial}
                        />
                    </div>
                </div>
            )}
        </div>
    );
}); // End of React.forwardRef

export default MaterialAutocomplete;
