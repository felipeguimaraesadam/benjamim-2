import React, { useState, useEffect, useCallback } from 'react';
import { debounce } from 'lodash';

const SearchableSelect = ({
  fetchSuggestions,
  onSelect,
  placeholder,
  displayValue,
  className = '',
}) => {
  const [inputValue, setInputValue] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);

  useEffect(() => {
    if (displayValue) {
      setInputValue(displayValue);
    } else {
      setInputValue('');
    }
  }, [displayValue]);

  const debouncedFetch = useCallback(
    debounce(async query => {
      if (query) {
        setIsLoading(true);
        try {
          const items = await fetchSuggestions(query);
          setSuggestions(items);
        } catch (error) {
          console.error('Error fetching suggestions:', error);
          setSuggestions([]);
        } finally {
          setIsLoading(false);
        }
      } else {
        setSuggestions([]);
      }
    }, 300),
    [fetchSuggestions]
  );

  const handleChange = e => {
    const inputVal = e.target.value;
    setInputValue(inputVal);
    setShowSuggestions(true);
    if (inputVal) {
      debouncedFetch(inputVal);
    } else {
      setSuggestions([]);
      if (onSelect) {
        onSelect(null);
      }
    }
  };

  const handleSelect = suggestion => {
    setInputValue(suggestion.label || suggestion.nome || suggestion.name || '');
    setSuggestions([]);
    setShowSuggestions(false);
    if (onSelect) {
      onSelect(suggestion);
    }
  };

  return (
    <div className={`relative ${className}`}>
      <input
        type="text"
        value={inputValue}
        onChange={handleChange}
        onFocus={() => setShowSuggestions(true)}
        onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
        placeholder={placeholder}
        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
      />
      {showSuggestions && (
        <ul className="absolute z-10 w-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md mt-1 max-h-60 overflow-y-auto shadow-lg">
          {isLoading ? (
            <li className="px-3 py-2 text-gray-500 dark:text-gray-400">Carregando...</li>
          ) : suggestions.length > 0 ? (
            suggestions.map((suggestion, index) => (
              <li
                key={suggestion.id || suggestion.value || index}
                onClick={() => handleSelect(suggestion)}
                className="px-3 py-2 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-900 dark:text-gray-100"
              >
                {suggestion.label || suggestion.nome || suggestion.name || suggestion.toString()}
              </li>
            ))
          ) : (
            inputValue && (
              <li className="px-3 py-2 text-gray-500 dark:text-gray-400">Nenhum resultado encontrado</li>
            )
          )}
        </ul>
      )}
    </div>
  );
};

export default SearchableSelect;