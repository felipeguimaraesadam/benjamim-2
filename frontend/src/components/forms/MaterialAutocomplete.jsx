import React, {
  useState,
  useEffect,
  useCallback,
  useRef,
  useImperativeHandle,
} from 'react';
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

const MaterialAutocomplete = React.memo(
  React.forwardRef(
    (
      {
        value,
        onMaterialSelect,
        itemIndex,
        error,
        parentOnKeyDown,
        onBlurReport,
        onNewMaterialError,
      },
      ref
    ) => {
      const [inputValue, setInputValue] = useState('');
      const [suggestions, setSuggestions] = useState([]);
      const [isLoading, setIsLoading] = useState(false);
      const [showSuggestions, setShowSuggestions] = useState(false);
      const [showNewMaterialModal, setShowNewMaterialModal] = useState(false);
      const [isSubmittingNewMaterial, setIsSubmittingNewMaterial] =
        useState(false);
      const [newMaterialError, setNewMaterialError] = useState(null);
      const [selectionMadeViaEnter, setSelectionMadeViaEnter] = useState(false);
      const [selectionMadeViaClick, setSelectionMadeViaClick] = useState(false); // New state
      const [highlightedIndex, setHighlightedIndex] = useState(-1);

      const [dropdownPosition, setDropdownPosition] = useState({
        top: 0,
        left: 0,
        width: 0,
      });
      const [portalTarget, setPortalTarget] = useState(null);

      const inputRef = useRef(null);
      const suggestionItemRefs = useRef([]);

      useImperativeHandle(ref, () => ({
        focus: () => {
          // console.log("MaterialAutocomplete: focus() method called via ref.");
          inputRef.current?.focus();
        },
      }));

      useEffect(() => {
        if (value && value.nome) {
          setInputValue(value.nome);
        } else if (typeof value === 'string' && value) {
          // If value is a non-empty string (e.g. materialNome from parent)
          setInputValue(value);
        } else if (!value) {
          // If value is null, undefined, or empty object without 'nome'
          setInputValue('');
        }
      }, [value]);

      useEffect(() => {
        if (!showSuggestions || suggestions.length === 0) {
          setHighlightedIndex(-1);
        }
        suggestionItemRefs.current = suggestionItemRefs.current.slice(
          0,
          suggestions.length
        );
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

      const scrollToSuggestion = index => {
        if (suggestionItemRefs.current[index]) {
          suggestionItemRefs.current[index].scrollIntoView({
            behavior: 'smooth',
            block: 'nearest',
          });
        }
      };

      const debouncedFetchSuggestions = useCallback(
        debounce(async query => {
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
            const response = await api.getMateriais({
              search: query,
              page_size: 10,
            });
            setSuggestions(
              response.data?.results || response.data || response || []
            );
          } catch (err) {
            console.error('Error fetching material suggestions:', err);
            setSuggestions([]);
          } finally {
            setIsLoading(false);
          }
        }, 300),
        []
      );

      const handleInputChange = e => {
        const newInputValue = e.target.value;
        setInputValue(newInputValue);
        setHighlightedIndex(-1);
        if (newInputValue.trim() === '') {
          setSuggestions([]);
          setShowSuggestions(false);
          if (value) {
            // If there was a selected material object
            onMaterialSelect(itemIndex, null); // Notify parent that selection is cleared
          }
        } else {
          debouncedFetchSuggestions(newInputValue);
        }
      };

      const handleSuggestionClick = material => {
        console.log('🧪 MaterialAutocomplete: Suggestion clicked:', material);
        console.log('🧪 MaterialAutocomplete: Current inputValue:', inputValue);
        console.log('🧪 MaterialAutocomplete: Calling onMaterialSelect with:', material);

        setSelectionMadeViaClick(true); // Set the flag here
        setInputValue(material.nome);
        setSuggestions([]);
        setShowSuggestions(false);
        setHighlightedIndex(-1);

        if (onMaterialSelect) {
          onMaterialSelect(itemIndex, material);
        }

        // Force blur to trigger validation
        setTimeout(() => {
          if (inputRef.current) {
            inputRef.current.blur();
            console.log('🧪 MaterialAutocomplete: Input blurred after selection');
          }
        }, 100);
      };

      const handleFocus = () => {
        if (inputValue.trim() && !showNewMaterialModal) {
          if (suggestions.length > 0 && inputValue === (value?.nome || value)) {
            // Show existing suggestions if input matches current value
            setShowSuggestions(true);
          } else {
            // Otherwise, fetch new ones
            debouncedFetchSuggestions(inputValue);
          }
        } else if (suggestions.length > 0 && !showNewMaterialModal) {
          setShowSuggestions(true);
        }
        // If input is empty on focus, don't fetch, wait for user input.
      };

      const handleBlur = () => {
        // We need a short delay to check if the focus is moving to a suggestion.
        // If we call onBlurReport immediately, it might fire before a click on a suggestion is registered.
        setTimeout(() => {
          // Check if a selection was made via click just before the blur. The click handler sets this.
          if (selectionMadeViaClick) {
            // If a click selection was made, the click handler has already managed the state.
            // We just need to reset the flag and not fire another onBlurReport.
            setSelectionMadeViaClick(false);
            return;
          }

          // If no click selection, proceed with blur logic.
          setShowSuggestions(false);

          if (typeof onBlurReport === 'function') {
            // Report the blur event to the parent. The parent will decide whether to validate.
            // Pass the necessary state for the parent to make an informed decision.
            onBlurReport({
              selectionMade: selectionMadeViaEnter, // Was the selection made via Enter/Tab?
              currentInputValue: inputValue, // What is the current text in the input?
            });
          }

          // Reset the Enter flag after reporting.
          setSelectionMadeViaEnter(false);
        }, 200); // A 200ms delay is usually enough to capture clicks.
      };

      const handleShowNewMaterialModal = () => {
        setShowSuggestions(false);
        setNewMaterialError(null);
        setShowNewMaterialModal(true);
      };

      const handleCloseNewMaterialModal = (
        materialSuccessfullySubmitted = false
      ) => {
        setShowNewMaterialModal(false);
        setNewMaterialError(null);
        if (!materialSuccessfullySubmitted) {
          inputRef.current?.focus();
        }
      };

      const handleNewMaterialSubmit = async materialFormData => {
        // Initial phase: setting loading and clearing previous errors
        // No try-catch here as per original structure; state setters are unlikely to fail.
        // If they were to fail, it would be a React-level issue.
        setIsSubmittingNewMaterial(true);
        setNewMaterialError(null);

        try {
          const response = await api.createMaterial(materialFormData);
          // Ensure createdMaterial is correctly assigned, checking response.data first
          const createdMaterial =
            response && response.data ? response.data : response;

          // SUCCESS PATH:
          // Access props directly as they are destructured in the component's function signature
          console.log(
            'DEBUG: Selected Material in MaterialAutocomplete (new material submit):',
            createdMaterial
          );
          onMaterialSelect(itemIndex, createdMaterial, true); // Pass true for isNewMaterial

          // Ensure `setInputValue` is the state setter for the component's inputValue state
          // and `createdMaterial.nome` is safely accessed.
          if (createdMaterial && typeof createdMaterial.nome === 'string') {
            setInputValue(createdMaterial.nome);
          }

          // Ensure `handleCloseNewMaterialModal` is a method of this component
          handleCloseNewMaterialModal(true); // true indicates success
        } catch (err) {
          // MAIN ERROR HANDLING for api.createMaterial
          let errorMessage =
            'Ocorreu um erro desconhecido ao criar o material.';
          if (err.response && err.response.data) {
            const errorData = err.response.data;
            if (
              errorData.nome &&
              Array.isArray(errorData.nome) &&
              errorData.nome.length > 0
            ) {
              errorMessage = `Nome: ${errorData.nome[0]}`; // More specific error for 'nome'
            } else if (
              errorData.unidade_medida &&
              Array.isArray(errorData.unidade_medida) &&
              errorData.unidade_medida.length > 0
            ) {
              errorMessage = `Unidade de Medida: ${errorData.unidade_medida[0]}`; // Specific for 'unidade_medida'
            } else if (errorData.detail) {
              errorMessage = errorData.detail;
            } else {
              try {
                // Attempt to stringify if it's an object, otherwise use as is if string.
                errorMessage =
                  typeof errorData === 'string'
                    ? errorData
                    : JSON.stringify(errorData);
              } catch (e_stringify) {
                console.error(
                  'Error stringifying API error data:',
                  e_stringify
                );
                errorMessage =
                  'Erro complexo e não serializável retornado pela API.';
              }
            }
          } else if (err.message) {
            errorMessage = err.message;
          }

          console.error(
            'Erro ao criar material (api.createMaterial call):',
            err
          );
          setNewMaterialError(errorMessage);
        } finally {
          // CLEANUP: This will always run, regardless of success or failure in try/catch.
          setIsSubmittingNewMaterial(false);
        }
      };

      const selectHighlighted = () => {
        let materialToSelect = null;
        
        // First, try to select highlighted item
        if (highlightedIndex >= 0 && highlightedIndex < suggestions.length) {
          materialToSelect = suggestions[highlightedIndex];
        }
        // If no highlighted item, but there are suggestions, try to find exact match or select first one
        else if (suggestions.length > 0) {
          // Try to find exact match first
          const exactMatch = suggestions.find(s => 
            s.nome.toLowerCase().trim() === inputValue.toLowerCase().trim()
          );
          
          if (exactMatch) {
            materialToSelect = exactMatch;
          } else if (suggestions.length === 1) {
            // If only one suggestion, select it
            materialToSelect = suggestions[0];
          }
        }
        
        if (materialToSelect) {
          // Immediately update UI state
          setInputValue(materialToSelect.nome);
          setSuggestions([]);
          setShowSuggestions(false);
          setHighlightedIndex(-1);
          
          // Call onMaterialSelect immediately to ensure selection is processed
          onMaterialSelect(itemIndex, materialToSelect);
          
          return true; // Indicates a selection was made
        }
        
        return false;
      };

      const handleInputKeyDown = e => {
        console.log('🔍 DEBUG: handleInputKeyDown - key:', e.key, 'showSuggestions:', showSuggestions, 'highlightedIndex:', highlightedIndex, 'suggestions:', suggestions.length);

        if (showNewMaterialModal) {
          if (e.key === 'Escape') {
            console.log('🔍 DEBUG: Escape in modal');
            handleCloseNewMaterialModal(false);
          }
          return;
        }

        if (showSuggestions && suggestions.length > 0) {
          if (e.key === 'ArrowDown') {
            e.preventDefault();
            const nextIndex = (highlightedIndex + 1) % suggestions.length;
            setHighlightedIndex(nextIndex);
            scrollToSuggestion(nextIndex);
            console.log('🔍 DEBUG: ArrowDown - new highlightedIndex:', nextIndex);
            return;
          }
          if (e.key === 'ArrowUp') {
            e.preventDefault();
            const prevIndex = (highlightedIndex - 1 + suggestions.length) % suggestions.length;
            setHighlightedIndex(prevIndex);
            scrollToSuggestion(prevIndex);
            console.log('🔍 DEBUG: ArrowUp - new highlightedIndex:', prevIndex);
            return;
          }
          if (e.key === 'Enter' || e.key === 'Tab') {
            e.preventDefault();
            console.log('🔍 DEBUG: Enter/Tab pressed - highlightedIndex:', highlightedIndex, 'suggestions:', suggestions);
            setSelectionMadeViaEnter(true); // Mark that selection was made via keyboard
            if (selectHighlighted()) {
              console.log('🔍 DEBUG: Selection made via Enter/Tab');
              // The blur will be triggered by the state update and subsequent re-render, 
              // which will then call handleBlur and onBlurReport.
            } else {
              console.log('🔍 DEBUG: No selection made, blurring directly');
              inputRef.current.blur(); // Manually blur if no selection was made
            }
            return;
          }
        }

        if (e.key === 'Escape') {
          e.preventDefault();
          console.log('🔍 DEBUG: Escape pressed - hiding suggestions');
          setShowSuggestions(false);
          setHighlightedIndex(-1);
          return;
        }

        if (parentOnKeyDown) {
          parentOnKeyDown(e);
        }
      };

      const suggestionsJsx = showSuggestions && (
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
            <div className="w-full bg-white dark:bg-gray-800 border border-slate-300 dark:border-gray-600 rounded-md px-3 py-2 text-sm text-slate-500 dark:text-gray-400 shadow-lg">
              Buscando...
            </div>
          )}
          {!isLoading &&
            suggestions.length === 0 &&
            inputValue.trim() !== '' &&
            !showNewMaterialModal && (
              <div className="w-full bg-white dark:bg-gray-800 border border-slate-300 dark:border-gray-600 rounded-md p-3 text-sm text-slate-500 dark:text-gray-400 shadow-lg">
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
            <ul
              id={`suggestions-list-${itemIndex}`}
              role="listbox"
              className="w-full bg-white dark:bg-gray-800 border border-slate-300 dark:border-gray-600 rounded-md max-h-60 overflow-y-auto shadow-lg"
            >
              {' '}
              {/* Removed absolute, z-10, mt-1 */}
              {suggestions.map((material, idx) => (
                <li
                  key={material.id}
                  ref={el => (suggestionItemRefs.current[idx] = el)}
                  id={`suggestion-${itemIndex}-${idx}`}
                  role="option"
                  aria-selected={idx === highlightedIndex}
                  onMouseDown={() => handleSuggestionClick(material)}
                  onMouseEnter={() => setHighlightedIndex(idx)}
                  className={`px-3 py-2 cursor-pointer text-sm ${idx === highlightedIndex ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 font-semibold' : 'text-slate-700 dark:text-gray-300 hover:bg-slate-100 dark:hover:bg-gray-700'}`}
                >
                  {material.nome}{' '}
                  <span className="text-slate-500 dark:text-gray-400">
                    ({material.unidade_medida})
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      );

      return (
        <div className="relative w-full">
          {' '}
          {/* This relative div is for the input itself if needed, or can be simplified if not strictly necessary for input layout */}
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
            className={`w-full p-1.5 border ${error ? 'border-red-500 text-red-700 dark:text-red-400' : 'border-slate-300 dark:border-gray-600 text-slate-700 dark:text-gray-300'} bg-white dark:bg-gray-800 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm`}
            aria-autocomplete="list"
            aria-expanded={showSuggestions && !showNewMaterialModal}
            aria-controls={`suggestions-list-${itemIndex}`}
            aria-activedescendant={
              highlightedIndex >= 0
                ? `suggestion-${itemIndex}-${highlightedIndex}`
                : undefined
            }
            autoComplete="off"
          />
          {error && (
            <p className="text-xs text-red-600 dark:text-red-400 mt-0.5">
              {error}
            </p>
          )}
          {portalTarget ? createPortal(suggestionsJsx, portalTarget) : null}
          {showNewMaterialModal && (
            <div
              className="fixed inset-0 z-[100] flex items-center justify-center bg-black bg-opacity-70 backdrop-blur-sm p-4 new-material-modal-container"
              role="dialog"
              aria-modal="true"
              aria-labelledby="new-material-modal-title"
            >
              <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
                {' '}
                {/* Increased padding to p-6, max-w-lg */}
                <div className="flex justify-between items-center mb-5">
                  {' '}
                  {/* Increased mb */}
                  <h2
                    id="new-material-modal-title"
                    className="text-xl font-semibold text-slate-800 dark:text-gray-200"
                  >
                    Cadastrar Novo Material
                  </h2>
                  <button
                    onClick={handleCloseNewMaterialModal}
                    className="text-slate-400 dark:text-gray-500 hover:text-slate-600 dark:hover:text-gray-300 text-3xl leading-none p-1 -mr-2 -mt-2"
                    aria-label="Fechar modal"
                  >
                    &times;
                  </button>
                </div>
                {newMaterialError && (
                  <div
                    className="bg-red-100 dark:bg-red-900/30 border-l-4 border-red-500 dark:border-red-600 text-red-700 dark:text-red-300 p-4 rounded mb-4 text-sm"
                    role="alert"
                  >
                    {' '}
                    {/* Increased padding */}
                    <p>
                      <span className="font-bold">Erro:</span>{' '}
                      {newMaterialError}
                    </p>
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
    }
  )
);

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
