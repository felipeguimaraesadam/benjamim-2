import React, { useState, useEffect, useCallback } from 'react';
import { debounce } from 'lodash';

const Autocomplete = ({
  fetchSuggestions,
  onSelect,
  placeholder,
  initialValue,
}) => {
  const [inputValue, setInputValue] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);

  useEffect(() => {
    if (initialValue) {
      setInputValue(initialValue.label);
    }
  }, [initialValue]);

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
    const value = e.target.value;
    setInputValue(value);
    setShowSuggestions(true);
    debouncedFetch(value);
  };

  const handleSelect = suggestion => {
    setInputValue(suggestion.label);
    setSuggestions([]);
    setShowSuggestions(false);
    onSelect(suggestion);
  };

  return (
    <div className="relative">
      <input
        type="text"
        value={inputValue}
        onChange={handleChange}
        onFocus={() => setShowSuggestions(true)}
        onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
        placeholder={placeholder}
        className="mt-1 block w-full bg-gray-50 border border-gray-300 text-gray-900 sm:text-sm rounded-md focus:ring-primary-500 focus:border-primary-500 px-3 py-2"
      />
      {showSuggestions && (
        <ul className="absolute z-10 w-full bg-white border border-gray-300 rounded-md mt-1 max-h-60 overflow-y-auto">
          {isLoading ? (
            <li className="px-3 py-2">Carregando...</li>
          ) : (
            suggestions.length > 0 ? (
              suggestions.map(suggestion => (
                <li
                  key={suggestion.value}
                  onClick={() => handleSelect(suggestion)}
                  className="px-3 py-2 cursor-pointer hover:bg-gray-100"
                >
                  {suggestion.label}
                </li>
              ))
            ) : (
              inputValue && <li className="px-3 py-2">Nenhum resultado encontrado</li>
            )
          )}
        </ul>
      )}
    </div>
  );
};

export default Autocomplete;
