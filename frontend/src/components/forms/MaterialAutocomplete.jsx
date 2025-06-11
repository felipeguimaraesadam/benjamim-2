import React, { useState, useEffect, useCallback, useRef, useImperativeHandle } from 'react';
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

const MaterialAutocomplete = React.forwardRef(({ value, onMaterialSelect, itemIndex, error, parentOnKeyDown }, ref) => {
    const [inputValue, setInputValue] = useState('');
    const [suggestions, setSuggestions] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [showNewMaterialModal, setShowNewMaterialModal] = useState(false);
    const [isSubmittingNewMaterial, setIsSubmittingNewMaterial] = useState(false);
    const [newMaterialError, setNewMaterialError] = useState(null);
    const [highlightedIndex, setHighlightedIndex] = useState(-1);

    const inputRef = useRef(null);
    const suggestionItemRefs = useRef([]);

    useImperativeHandle(ref, () => ({
        focus: () => {
            // console.log("MaterialAutocomplete: focus() method called via ref.");
            inputRef.current?.focus();
        }
    }));

    useEffect(() => {
        if (value && value.nome) {
            setInputValue(value.nome);
        } else if (typeof value === 'string' && value) { // If value is a non-empty string (e.g. materialNome from parent)
            setInputValue(value);
        } else if (!value) { // If value is null, undefined, or empty object without 'nome'
            setInputValue('');
        }
    }, [value]);

    useEffect(() => {
        if (!showSuggestions || suggestions.length === 0) {
            setHighlightedIndex(-1);
        }
        suggestionItemRefs.current = suggestionItemRefs.current.slice(0, suggestions.length);
    }, [suggestions, showSuggestions]);

    const scrollToSuggestion = (index) => {
        if (suggestionItemRefs.current[index]) {
            suggestionItemRefs.current[index].scrollIntoView({
                behavior: 'smooth',
                block: 'nearest',
            });
        }
    };

    const debouncedFetchSuggestions = useCallback(
        debounce(async (query) => {
            if (!query || query.length < 1) {
                setSuggestions([]);
                setShowSuggestions(false);
                setHighlightedIndex(-1);
                return;
            }
            setIsLoading(true);
            setShowSuggestions(true);
            setHighlightedIndex(-1);
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
        setHighlightedIndex(-1);
        if (newInputValue.trim() === '') {
            setSuggestions([]);
            setShowSuggestions(false);
            if (value) { // If there was a selected material object
              onMaterialSelect(itemIndex, null); // Notify parent that selection is cleared
            }
        } else {
            debouncedFetchSuggestions(newInputValue);
        }
    };

    const handleSuggestionClick = (material) => {
        setInputValue(material.nome);
        setSuggestions([]);
        setShowSuggestions(false);
        setHighlightedIndex(-1);
        onMaterialSelect(itemIndex, material);
    };

    const handleFocus = () => {
        if (inputValue.trim() && !showNewMaterialModal) {
            if (suggestions.length > 0 && inputValue === (value?.nome || value)) { // Show existing suggestions if input matches current value
                setShowSuggestions(true);
            } else { // Otherwise, fetch new ones
                 debouncedFetchSuggestions(inputValue);
            }
        } else if (suggestions.length > 0 && !showNewMaterialModal) {
             setShowSuggestions(true);
        }
        // If input is empty on focus, don't fetch, wait for user input.
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
        inputRef.current?.focus();
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

    const handleInputKeyDown = (e) => {
        if (showNewMaterialModal) { // If modal is open, don't interfere with its inputs
            if (e.key === 'Escape') {
                 handleCloseNewMaterialModal();
            }
            return;
        }

        if (showSuggestions && suggestions.length > 0) {
            if (e.key === 'ArrowDown') {
                e.preventDefault();
                const nextIndex = highlightedIndex >= suggestions.length - 1 ? 0 : highlightedIndex + 1;
                setHighlightedIndex(nextIndex);
                scrollToSuggestion(nextIndex);
                return;
            }
            if (e.key === 'ArrowUp') {
                e.preventDefault();
                const prevIndex = highlightedIndex <= 0 ? suggestions.length - 1 : highlightedIndex - 1;
                setHighlightedIndex(prevIndex);
                scrollToSuggestion(prevIndex);
                return;
            }
            if (e.key === 'Enter' && highlightedIndex >= 0 && highlightedIndex < suggestions.length) {
                e.preventDefault();
                handleSuggestionClick(suggestions[highlightedIndex]);
                setHighlightedIndex(-1);
                return;
            }
        }

        if (e.key === 'Escape') {
            e.preventDefault();
            setShowSuggestions(false);
            setHighlightedIndex(-1);
            return;
        }

        if (parentOnKeyDown) {
            parentOnKeyDown(e);
        }
    };

    return (
        <div className="relative w-full">
            <input
                ref={inputRef}
                type="text"
                id={`material-input-${itemIndex}`}
                value={inputValue}
                onChange={handleInputChange}
                onFocus={handleFocus}
                onBlur={handleBlur}
                onKeyDown={handleInputKeyDown}
                placeholder="Digite para buscar material..."
                className={`w-full p-1.5 border ${error ? 'border-red-500 text-red-700' : 'border-slate-300 text-slate-700'} rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm`}
                aria-autocomplete="list"
                aria-expanded={showSuggestions && !showNewMaterialModal}
                aria-controls={`suggestions-list-${itemIndex}`}
                aria-activedescendant={highlightedIndex >= 0 ? `suggestion-${itemIndex}-${highlightedIndex}` : undefined}
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
                                ref={el => suggestionItemRefs.current[idx] = el}
                                id={`suggestion-${itemIndex}-${idx}`}
                                role="option"
                                aria-selected={idx === highlightedIndex}
                                onMouseDown={() => handleSuggestionClick(material)}
                                onMouseEnter={() => setHighlightedIndex(idx)}
                                className={`px-3 py-2 cursor-pointer text-sm ${idx === highlightedIndex ? 'bg-primary-100 text-primary-700 font-semibold' : 'text-slate-700 hover:bg-slate-100'}`}
                            >
                                {material.nome} <span className="text-slate-500">({material.unidade_medida})</span>
                            </li>
                        ))}
                    </ul>
                )}
                 {isLoading && showSuggestions && !showNewMaterialModal && (
                    <div className="absolute z-10 w-full bg-white border border-slate-300 rounded-md mt-1 px-3 py-2 text-sm text-slate-500 shadow-lg">
                        Buscando...
                    </div>
                )}
            </div>

            {showNewMaterialModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black bg-opacity-70 backdrop-blur-sm p-4 new-material-modal-container" role="dialog" aria-modal="true" aria-labelledby="new-material-modal-title">
                    <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto"> {/* Increased padding to p-6, max-w-lg */}
                        <div className="flex justify-between items-center mb-5"> {/* Increased mb */}
                            <h2 id="new-material-modal-title" className="text-xl font-semibold text-slate-800">Cadastrar Novo Material</h2>
                            <button onClick={handleCloseNewMaterialModal} className="text-slate-400 hover:text-slate-600 text-3xl leading-none p-1 -mr-2 -mt-2" aria-label="Fechar modal">&times;</button>
                        </div>
                        {newMaterialError && (
                             <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded mb-4 text-sm" role="alert"> {/* Increased padding */}
                                <p><span className="font-bold">Erro:</span> {newMaterialError}</p>
                            </div>
                        )}
                        <MaterialForm
                            initialData={{ nome: inputValue.trim() }}
                            onSubmit={handleNewMaterialSubmit}
                            onCancel={handleCloseNewMaterialModal}
                            isLoading={isSubmittingNewMaterial}
                            isModalContext={true} // Indicate modal context if MaterialForm needs different styling/behavior
                        />
                    </div>
                </div>
            )}
        </div>
    );
});

export default MaterialAutocomplete;
