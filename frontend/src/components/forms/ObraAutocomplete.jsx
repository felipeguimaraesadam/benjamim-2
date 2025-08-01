import React, {
  useState,
  useEffect,
  useCallback,
  useRef,
  useImperativeHandle,
} from 'react';
import PropTypes from 'prop-types';
import { createPortal } from 'react-dom';
import * as api from '../../services/api';

const debounce = (func, delay) => {
  let timeoutId;
  return (...args) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => {
      func.apply(null, args);
    }, delay);
  };
};

const ObraAutocomplete = React.memo(
  React.forwardRef(
    (
      {
        value,
        onObraSelect,
        error,
        onBlur,
        onKeyDown,
        placeholder = "Digite para buscar uma obra...",
        required = false,
      },
      ref
    ) => {
      const [inputValue, setInputValue] = useState('');
      const [suggestions, setSuggestions] = useState([]);
      const [isLoading, setIsLoading] = useState(false);
      const [showSuggestions, setShowSuggestions] = useState(false);
      const [highlightedIndex, setHighlightedIndex] = useState(-1);
      const [selectionMade, setSelectionMade] = useState(false);

      const [dropdownPosition, setDropdownPosition] = useState({
        top: 0,
        left: 0,
        width: 0,
      });
      const [portalTarget, setPortalTarget] = useState(null);

      const inputRef = useRef(null);
      const suggestionItemRefs = useRef([]);
      const containerRef = useRef(null);

      useImperativeHandle(ref, () => ({
        focus: () => {
          inputRef.current?.focus();
        },
        blur: () => {
          inputRef.current?.blur();
        },
        getValue: () => value,
        setValue: (newValue) => {
          if (newValue && newValue.nome_obra) {
            setInputValue(newValue.nome_obra);
          } else {
            setInputValue('');
          }
        },
      }));

      // Update input value when value prop changes
      useEffect(() => {
        if (value && value.nome_obra) {
          setInputValue(value.nome_obra);
          setSelectionMade(true);
        } else if (!value) {
          setInputValue('');
          setSelectionMade(false);
        }
      }, [value]);

      // Reset highlighted index when suggestions change
      useEffect(() => {
        if (!showSuggestions || suggestions.length === 0) {
          setHighlightedIndex(-1);
        }
        suggestionItemRefs.current = suggestionItemRefs.current.slice(
          0,
          suggestions.length
        );
      }, [suggestions, showSuggestions]);

      // Set portal target
      useEffect(() => {
        setPortalTarget(document.body);
      }, []);

      // Calculate dropdown position
      useEffect(() => {
        if (showSuggestions && inputRef.current) {
          const inputRect = inputRef.current.getBoundingClientRect();
          setDropdownPosition({
            top: inputRect.bottom + window.scrollY,
            left: inputRect.left + window.scrollX,
            width: inputRect.width,
          });
        }
      }, [showSuggestions]);

      // Debounced search function
      const debouncedSearch = useCallback(
        debounce(async (searchTerm) => {
          if (!searchTerm.trim()) {
            setSuggestions([]);
            setIsLoading(false);
            return;
          }

          try {
            setIsLoading(true);
            const response = await api.getObras();
            console.log('API Response:', response);
            const obras = response.data ? (Array.isArray(response.data) ? response.data : response.data.results) : [];
            if (!Array.isArray(obras)) {
              console.error('Expected obras to be an array, but got:', obras);
              setSuggestions([]);
              return;
            }
            const filteredObras = obras.filter(obra => {
              const searchLower = searchTerm.toLowerCase();
              return (
                obra.nome_obra.toLowerCase().includes(searchLower) ||
                (obra.endereco && obra.endereco.toLowerCase().includes(searchLower)) ||
                (obra.endereco_completo && obra.endereco_completo.toLowerCase().includes(searchLower))
              );
            });
            setSuggestions(filteredObras.slice(0, 10)); // Limit to 10 suggestions
          } catch (error) {
            console.error('Erro ao buscar obras:', error);
            setSuggestions([]);
          } finally {
            setIsLoading(false);
          }
        }, 300),
        []
      );

      const handleInputChange = (e) => {
        const newValue = e.target.value;
        setInputValue(newValue);
        setSelectionMade(false);
        setShowSuggestions(true);
        setHighlightedIndex(-1);
        
        if (!newValue.trim()) {
          onObraSelect(null);
          setSuggestions([]);
          setIsLoading(false);
        } else {
          debouncedSearch(newValue);
        }
      };

      const handleSuggestionClick = (obra) => {
        setInputValue(obra.nome_obra);
        setSelectionMade(true);
        setShowSuggestions(false);
        setHighlightedIndex(-1);
        onObraSelect(obra);
        inputRef.current?.focus();
      };

      const handleKeyDown = (e) => {
        if (!showSuggestions || suggestions.length === 0) {
          if (onKeyDown) {
            onKeyDown(e);
          }
          return;
        }

        switch (e.key) {
          case 'ArrowDown':
            e.preventDefault();
            setHighlightedIndex(prev => {
              const newIndex = prev < suggestions.length - 1 ? prev + 1 : 0;
              // Scroll highlighted item into view
              setTimeout(() => {
                if (suggestionItemRefs.current[newIndex]) {
                  suggestionItemRefs.current[newIndex].scrollIntoView({
                    block: 'nearest',
                    behavior: 'smooth'
                  });
                }
              }, 0);
              return newIndex;
            });
            break;

          case 'ArrowUp':
            e.preventDefault();
            setHighlightedIndex(prev => {
              const newIndex = prev > 0 ? prev - 1 : suggestions.length - 1;
              // Scroll highlighted item into view
              setTimeout(() => {
                if (suggestionItemRefs.current[newIndex]) {
                  suggestionItemRefs.current[newIndex].scrollIntoView({
                    block: 'nearest',
                    behavior: 'smooth'
                  });
                }
              }, 0);
              return newIndex;
            });
            break;

          case 'Enter':
          case 'Tab':
            if (highlightedIndex >= 0 && suggestions[highlightedIndex]) {
              e.preventDefault();
              handleSuggestionClick(suggestions[highlightedIndex]);
            } else if (onKeyDown) {
              onKeyDown(e);
            }
            break;

          case 'Escape':
            e.preventDefault();
            setShowSuggestions(false);
            setHighlightedIndex(-1);
            inputRef.current?.blur();
            break;

          default:
            if (onKeyDown) {
              onKeyDown(e);
            }
            break;
        }
      };

      const handleInputFocus = () => {
        if (inputValue && !selectionMade) {
          setShowSuggestions(true);
          debouncedSearch(inputValue);
        }
      };

      const handleInputBlur = (e) => {
        // Delay hiding suggestions to allow for clicks
        setTimeout(() => {
          setShowSuggestions(false);
          setHighlightedIndex(-1);
          if (onBlur) {
            onBlur(e);
          }
        }, 150);
      };

      const handleContainerClick = () => {
        inputRef.current?.focus();
      };

      return (
        <div ref={containerRef} className="relative">
          <div
            className={`relative cursor-text ${
              error ? 'ring-2 ring-red-500' : ''
            }`}
            onClick={handleContainerClick}
          >
            <input
              ref={inputRef}
              type="text"
              value={inputValue}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              onFocus={handleInputFocus}
              onBlur={handleInputBlur}
              placeholder={placeholder}
              className={`w-full px-3 py-2.5 border ${
                error
                  ? 'border-red-500 text-red-700 focus:ring-red-500 focus:border-red-500'
                  : 'border-slate-300 text-slate-700 focus:ring-primary-500 focus:border-primary-500'
              } rounded-md shadow-sm sm:text-sm transition-colors`}
              autoComplete="off"
              role="combobox"
              aria-expanded={showSuggestions}
              aria-haspopup="listbox"
              aria-autocomplete="list"
              aria-describedby={error ? `obra-error-${Date.now()}` : undefined}
              required={required}
            />
            {isLoading && (
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-600"></div>
              </div>
            )}
          </div>

          {/* Portal for suggestions dropdown */}
          {portalTarget &&
            showSuggestions &&
            (suggestions.length > 0 || isLoading) &&
            createPortal(
              <div
                className="fixed z-50 bg-white border border-slate-300 rounded-md shadow-lg max-h-60 overflow-y-auto"
                style={{
                  top: `${dropdownPosition.top}px`,
                  left: `${dropdownPosition.left}px`,
                  width: `${dropdownPosition.width}px`,
                }}
                role="listbox"
                aria-label="Sugestões de obras"
              >
                {isLoading && suggestions.length === 0 ? (
                  <div className="px-3 py-2 text-sm text-slate-500 flex items-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-600 mr-2"></div>
                    Buscando obras...
                  </div>
                ) : suggestions.length > 0 ? (
                  suggestions.map((obra, index) => (
                    <div
                      key={obra.id}
                      ref={(el) => (suggestionItemRefs.current[index] = el)}
                      className={`px-3 py-2 cursor-pointer text-sm transition-colors ${
                        index === highlightedIndex
                          ? 'bg-primary-100 text-primary-900'
                          : 'text-slate-700 hover:bg-slate-100'
                      }`}
                      onClick={() => handleSuggestionClick(obra)}
                      role="option"
                      aria-selected={index === highlightedIndex}
                    >
                      <div className="font-medium">{obra.nome_obra}</div>
                      {obra.endereco_completo && (
                        <div className="text-xs text-slate-500 mt-1">
                          {obra.endereco_completo}
                        </div>
                      )}
                    </div>
                  ))
                ) : (
                  !isLoading && (
                    <div className="px-3 py-2 text-sm text-slate-500">
                      Nenhuma obra encontrada
                    </div>
                  )
                )}
              </div>,
              portalTarget
            )}
        </div>
      );
    }
  )
);

ObraAutocomplete.displayName = 'ObraAutocomplete';

ObraAutocomplete.propTypes = {
  value: PropTypes.object,
  onObraSelect: PropTypes.func.isRequired,
  error: PropTypes.string,
  onBlur: PropTypes.func,
  onKeyDown: PropTypes.func,
  placeholder: PropTypes.string,
  required: PropTypes.bool,
};

export default ObraAutocomplete;