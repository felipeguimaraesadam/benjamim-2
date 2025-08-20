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
import { isAuthenticated, getCurrentUser } from '../../services/api';
import SpinnerIcon from '../utils/SpinnerIcon';

const debounce = (func, delay) => {
  let timeoutId;
  return (...args) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => {
      func.apply(null, args);
    }, delay);
  };
};

const FuncionarioAutocompleteMultiple = React.memo(
  React.forwardRef(
    (
      {
        value = [],
        onFuncionariosSelect,
        error,
        onBlur,
        onKeyDown,
        placeholder = 'Digite para buscar funcionários...',
        required = false,
      },
      ref
    ) => {
      const [inputValue, setInputValue] = useState('');
      const [suggestions, setSuggestions] = useState([]);
      const [isLoading, setIsLoading] = useState(false);
      const [showSuggestions, setShowSuggestions] = useState(false);
      const [highlightedIndex, setHighlightedIndex] = useState(-1);

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
        setValue: newValue => {
          // newValue should be an array of funcionarios
          if (Array.isArray(newValue)) {
            onFuncionariosSelect(newValue);
          }
        },
      }));

      useEffect(() => {
        if (!showSuggestions || suggestions.length === 0) {
          setHighlightedIndex(-1);
        }
        suggestionItemRefs.current = suggestionItemRefs.current.slice(
          0,
          suggestions.length
        );
      }, [suggestions, showSuggestions]);

      useEffect(() => {
        setPortalTarget(document.body);
      }, []);

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

      const debouncedSearch = useCallback(
        debounce(async searchTerm => {
          if (searchTerm.length < 2) {
            setSuggestions([]);
            return;
          }

          // Verificar autenticação antes de fazer a requisição
          if (!isAuthenticated()) {
            console.warn('🔐 [Multiple] Usuário não está autenticado - cancelando busca');
            setSuggestions([]);
            setIsLoading(false);
            return;
          }
          
          const currentUser = getCurrentUser();
          console.log('👤 [Multiple] Usuário atual:', currentUser);
          
          setIsLoading(true);
          try {
            console.log('🔍 [Multiple] Iniciando busca de funcionários:', { searchTerm, selectedCount: value.length });
            const response = await api.getFuncionarios({ search: searchTerm });
            console.log('✅ [Multiple] Resposta da API recebida:', {
              status: response.status,
              dataLength: response.data?.length || 0,
              data: response.data
            });
            
            const funcionarios = response.data
              ? Array.isArray(response.data)
                ? response.data
                : response.data.results
              : [];
            if (!Array.isArray(funcionarios)) {
              console.error(
                'Expected funcionarios to be an array, but got:',
                funcionarios
              );
              setSuggestions([]);
              return;
            }
            // Filter out already selected funcionarios
            const filteredFuncionarios = funcionarios.filter(
              funcionario => !value.some(selected => selected.id === funcionario.id)
            );
            
            console.log('📋 [Multiple] Funcionários filtrados:', {
              totalReceived: funcionarios.length,
              afterFilter: filteredFuncionarios.length,
              selectedIds: value.map(f => f.id)
            });
            
            setSuggestions(filteredFuncionarios.slice(0, 10));
          } catch (error) {
            console.error('❌ [Multiple] Erro detalhado ao buscar funcionários:', {
              message: error.message,
              status: error.response?.status,
              statusText: error.response?.statusText,
              data: error.response?.data,
              headers: error.response?.headers,
              config: {
                url: error.config?.url,
                method: error.config?.method,
                headers: error.config?.headers
              }
            });
            
            // Verificar se é erro de autenticação
            if (error.response?.status === 401) {
              console.warn('🔐 [Multiple] Erro de autenticação - usuário não está logado');
            } else if (error.response?.status === 403) {
              console.warn('🚫 [Multiple] Erro de permissão - usuário não tem acesso');
            } else if (error.response?.status >= 500) {
              console.warn('🔥 [Multiple] Erro do servidor - problema no backend');
            }
            
            setSuggestions([]);
          } finally {
            setIsLoading(false);
          }
        }, 300),
        [value]
      );

      const handleInputChange = e => {
        const newValue = e.target.value;
        setInputValue(newValue);
        setShowSuggestions(true);
        setHighlightedIndex(-1);

        if (!newValue.trim()) {
          setSuggestions([]);
          setIsLoading(false);
        } else {
          debouncedSearch(newValue);
        }
      };

      const handleSuggestionClick = funcionario => {
        const newSelectedFuncionarios = [...value, funcionario];
        onFuncionariosSelect(newSelectedFuncionarios);
        setInputValue('');
        setShowSuggestions(false);
        setHighlightedIndex(-1);
        setSuggestions([]);
        inputRef.current?.focus();
      };

      const handleRemoveFuncionario = funcionarioToRemove => {
        const newSelectedFuncionarios = value.filter(
          funcionario => funcionario.id !== funcionarioToRemove.id
        );
        onFuncionariosSelect(newSelectedFuncionarios);
      };

      const handleKeyDown = e => {
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
              setTimeout(() => {
                if (suggestionItemRefs.current[newIndex]) {
                  suggestionItemRefs.current[newIndex].scrollIntoView({
                    block: 'nearest',
                    behavior: 'smooth',
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
              setTimeout(() => {
                if (suggestionItemRefs.current[newIndex]) {
                  suggestionItemRefs.current[newIndex].scrollIntoView({
                    block: 'nearest',
                    behavior: 'smooth',
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

          case 'Backspace':
            if (!inputValue && value.length > 0) {
              e.preventDefault();
              handleRemoveFuncionario(value[value.length - 1]);
            }
            break;

          default:
            if (onKeyDown) {
              onKeyDown(e);
            }
            break;
        }
      };

      const handleInputFocus = () => {
        if (inputValue) {
          setShowSuggestions(true);
          debouncedSearch(inputValue);
        }
      };

      const handleInputBlur = e => {
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
            className={`relative cursor-text min-h-[42px] border rounded-md px-3 py-2 flex flex-wrap gap-1 items-center ${
              error
                ? 'border-red-500 ring-2 ring-red-500'
                : 'border-slate-300 focus-within:ring-primary-500 focus-within:border-primary-500'
            } transition-colors`}
            onClick={handleContainerClick}
          >
            {/* Selected funcionarios tags */}
            {value.map(funcionario => (
              <span
                key={funcionario.id}
                className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-primary-100 text-primary-800 border border-primary-200"
              >
                {funcionario.nome_completo}
                <button
                  type="button"
                  className="ml-1 inline-flex items-center justify-center w-4 h-4 rounded-full text-primary-600 hover:bg-primary-200 hover:text-primary-800 focus:outline-none focus:bg-primary-200 focus:text-primary-800"
                  onClick={e => {
                    e.stopPropagation();
                    handleRemoveFuncionario(funcionario);
                  }}
                  aria-label={`Remover ${funcionario.nome_completo}`}
                >
                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                      clipRule="evenodd"
                    />
                  </svg>
                </button>
              </span>
            ))}

            {/* Input field */}
            <input
              ref={inputRef}
              type="text"
              value={inputValue}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              onFocus={handleInputFocus}
              onBlur={handleInputBlur}
              placeholder={value.length === 0 ? placeholder : ''}
              className="flex-1 min-w-[120px] outline-none bg-transparent text-slate-700 sm:text-sm"
              autoComplete="off"
              role="combobox"
              aria-expanded={showSuggestions}
              aria-haspopup="listbox"
              aria-autocomplete="list"
              aria-describedby={
                error ? `funcionarios-error-${Date.now()}` : undefined
              }
              required={required && value.length === 0}
            />

            {isLoading && (
              <div className="flex-shrink-0">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-600"></div>
              </div>
            )}
          </div>

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
                aria-label="Sugestões de funcionários"
              >
                {isLoading && suggestions.length === 0 ? (
                  <div className="px-3 py-2 text-sm text-slate-500 flex items-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-600 mr-2"></div>
                    Buscando funcionários...
                  </div>
                ) : suggestions.length > 0 ? (
                  suggestions.map((funcionario, index) => (
                    <div
                      key={funcionario.id}
                      ref={el => (suggestionItemRefs.current[index] = el)}
                      className={`px-3 py-2 cursor-pointer text-sm transition-colors ${
                        index === highlightedIndex
                          ? 'bg-primary-100 text-primary-900'
                          : 'text-slate-700 hover:bg-slate-100'
                      }`}
                      onClick={() => handleSuggestionClick(funcionario)}
                      role="option"
                      aria-selected={index === highlightedIndex}
                    >
                      <div className="font-medium">
                        {funcionario.nome_completo}
                      </div>
                    </div>
                  ))
                ) : (
                  !isLoading && (
                    <div className="px-3 py-2 text-sm text-slate-500">
                      {inputValue.trim()
                        ? 'Nenhum funcionário encontrado'
                        : 'Digite para buscar funcionários'}
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

FuncionarioAutocompleteMultiple.displayName = 'FuncionarioAutocompleteMultiple';

FuncionarioAutocompleteMultiple.propTypes = {
  value: PropTypes.array,
  onFuncionariosSelect: PropTypes.func.isRequired,
  error: PropTypes.string,
  onBlur: PropTypes.func,
  onKeyDown: PropTypes.func,
  placeholder: PropTypes.string,
  required: PropTypes.bool,
};

export default FuncionarioAutocompleteMultiple;