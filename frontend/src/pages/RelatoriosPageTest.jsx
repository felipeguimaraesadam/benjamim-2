import React from 'react';

const RelatoriosPageTest = () => {
  const weekOptions = [
    { label: 'Esta Semana', value: 0 },
    { label: 'Semana Passada', value: -1 },
  ];

  return (
    <div>
      <select>
        <option value="" disabled>
          Escolha uma semana...
        </option>
        {weekOptions.map(opt => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
};

export default RelatoriosPageTest;