import React, { useState, useEffect, useCallback, useRef, useImperativeHandle } from 'react';
import PropTypes from 'prop-types'; // Import PropTypes
import { createPortal } from 'react-dom'; // Import createPortal
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

const MaterialAutocomplete = React.memo(React.forwardRef(({ value, onMaterialSelect, itemIndex, error, parentOnKeyDown, onBlurReport, onNewMaterialError }, ref) => {
    const [inputValue, setInputValue] = useState('');
    const [suggestions, setSuggestions] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [showNewMaterialModal, setShowNewMaterialModal] = useState(false);
    const [isSubmittingNewMaterial, setIsSubmittingNewMaterial] = useState(false);
    const [newMaterialError, setNewMaterialError] = useState(null);
    const [highlightedIndex, setHighlightedIndex] = useState(-1);

    const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0, width: 0 });
    const [portalTarget, setPortalTarget] = useState(null);

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

    // Effect to set portal target
    useEffect(() => {
        setPortalTarget(document.body); // Target document.body for the portal
    }, []);

    // Effect to calculate dropdown position
    useEffect(() => {
        if (showSuggestions && inputRef.current) {
            const inputRect = inputRef.current.getBoundingClientRect();
            setDropdownPosition({
                top: inputRect.bottom + window.scrollY,
                left: inputRect.left + window.scrollX,
                width: inputRect.width,
            });
        }
    }, [showSuggestions]); // Recalculate if showSuggestions changes (or inputRef.current if it could change)


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
                // Use 'search' parameter for DRF SearchFilter
                const response = await api.getMateriais({ search: query, page_size: 10 });
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
                return; // Don't run blur logic if focus moved to suggestions or modal
            }
            setShowSuggestions(false);
            if (typeof onBlurReport === 'function') {
                // Pass the current selected material object (value) and the raw input value
                onBlurReport({ selectedMaterial: value, currentInputValue: inputValue });
            }
        }, 200);
    };

    const handleShowNewMaterialModal = () => {
        setShowSuggestions(false);
        setNewMaterialError(null);
        setShowNewMaterialModal(true);
    };

    const handleCloseNewMaterialModal = (materialSuccessfullySubmitted = false) => {
        setShowNewMaterialModal(false);
        setNewMaterialError(null);
        if (!materialSuccessfullySubmitted) {
            inputRef.current?.focus();
        }
    };

    const handleNewMaterialSubmit = async (materialFormData) => {
        setIsSubmittingNewMaterial(true); // Renamed from setIsLoading for clarity with other isLoading state
        setNewMaterialError(null);
        try {
            const response = await api.createMaterial(materialFormData);
            const createdMaterial = response.data || response;
            onMaterialSelect(itemIndex, createdMaterial); // Propagate selection to parent
            setInputValue(createdMaterial.nome); // Update input field
            handleCloseNewMaterialModal(true); // Close modal on success
            // Any other success-specific logic should be here
        } catch (err) {
            // Robust error message extraction
            let errorMessage = "Ocorreu um erro ao criar o material."; // Default message
            if (err.response && err.response.data) {
                if (err.response.data.nome && Array.isArray(err.response.data.nome) && err.response.data.nome.length > 0) {
                    errorMessage = `Nome: ${err.response.data.nome[0]}`;
                } else if (err.response.data.unidade_medida && Array.isArray(err.response.data.unidade_medida) && err.response.data.unidade_medida.length > 0) {
                    errorMessage = `Unidade de Medida: ${err.response.data.unidade_medida[0]}`;
                } else if (err.response.data.detail) {
                    errorMessage = err.response.data.detail;
                } else if (typeof err.response.data === 'string') {
                    errorMessage = err.response.data;
                } else {
                    // Fallback for other structured errors (e.g., non_field_errors or multiple field errors)
                    const errors = err.response.data;
                    const messages = Object.entries(errors).map(([key, value]) => {
                        if (Array.isArray(value)) {
                            return `${key}: ${value.join(', ')}`;
                        }
                        return `${key}: ${value}`;
                    });
                    if (messages.length > 0) {
                        errorMessage = messages.join('; ');
                    }
                }
            } else if (err.message) {
                errorMessage = err.message;
            }
            setNewMaterialError(errorMessage);
            // Ensure no other calls like props.onError or props.onNewMaterialCreated here
        } finally {
            setIsSubmittingNewMaterial(false); // This correctly uses the state variable for the modal submission
        }
    };

    const handleInputKeyDown = (e) => {
        if (showNewMaterialModal) { // If modal is open, don't interfere with its inputs
            if (e.key === 'Escape') {
                 handleCloseNewMaterialModal(false); // Pass false here
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

    const suggestionsJsx = (
        showSuggestions && (
            <div
                className="suggestions-list-content" // This div will be portaled and styled
                style={{
                    position: 'absolute',
                    top: `${dropdownPosition.top}px`,
                    left: `${dropdownPosition.left}px`,
                    width: `${dropdownPosition.width}px`,
                    zIndex: 1050, // High z-index
                }}
            >
                {isLoading && (
                    <div className="w-full bg-white border border-slate-300 rounded-md px-3 py-2 text-sm text-slate-500 shadow-lg">
                        Buscando...
                    </div>
                )}
                {!isLoading && suggestions.length === 0 && inputValue.trim() !== '' && !showNewMaterialModal && (
                    <div className="w-full bg-white border border-slate-300 rounded-md p-3 text-sm text-slate-500 shadow-lg">
                        <span>Nenhum material encontrado com "{inputValue}".</span>
                        <button
                            type="button"
                            onClick={handleShowNewMaterialModal}
                            className="ml-2 p-2 bg-primary-600 hover:bg-primary-700 text-white rounded-md flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-1"
                            aria-label="Cadastrar Novo Material"
                        >
                            <span className="text-lg font-bold">+</span>
                        </button>
                    </div>
                )}
                {suggestions.length > 0 && !showNewMaterialModal && (
                     <ul id={`suggestions-list-${itemIndex}`} role="listbox" className="w-full bg-white border border-slate-300 rounded-md max-h-60 overflow-y-auto shadow-lg"> {/* Removed absolute, z-10, mt-1 */}
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
            </div>
        )
    );

    return (
        <div className="relative w-full"> {/* This relative div is for the input itself if needed, or can be simplified if not strictly necessary for input layout */}
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

            {portalTarget ? createPortal(suggestionsJsx, portalTarget) : null}

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
                            onCancel={() => handleCloseNewMaterialModal(false)} // Pass false for explicit cancel
                            isLoading={isSubmittingNewMaterial}
                            isModalContext={true} // Indicate modal context if MaterialForm needs different styling/behavior
                        />
                    </div>
                </div>
            )}
        </div>
    );
}));

MaterialAutocomplete.displayName = 'MaterialAutocomplete';

// PropTypes for MaterialAutocomplete
MaterialAutocomplete.propTypes = {
    value: PropTypes.oneOfType([PropTypes.object, PropTypes.string]),
    onMaterialSelect: PropTypes.func.isRequired,
    itemIndex: PropTypes.number.isRequired,
    error: PropTypes.string,
    parentOnKeyDown: PropTypes.func,
    onBlurReport: PropTypes.func,
};

export default MaterialAutocomplete;
