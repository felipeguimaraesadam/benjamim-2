import React from 'react';

const QuickActionsSection = ({ onOpenDistribuicaoModal }) => {
  return (
    <div className="mb-8 p-6 bg-white dark:bg-gray-800 shadow-lg rounded-lg">
      <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-100 mb-4">Ações Rápidas</h2>
      <button
        onClick={onOpenDistribuicaoModal}
        className="bg-green-500 hover:bg-green-600 text-white font-semibold py-2 px-4 rounded-md shadow-sm transition duration-150 ease-in-out"
      >
        Distribuir Materiais (Registrar Uso)
      </button>
      {/* Placeholder for other actions */}
    </div>
  );
};

export default React.memo(QuickActionsSection);
