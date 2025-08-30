import React from 'react';

const MoveOrDuplicateModal = ({ onMove, onDuplicate, onCancel }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-xl w-full max-w-sm">
        <h2 className="text-lg font-semibold mb-4 text-gray-800 dark:text-gray-100">
          Mover ou Duplicar?
        </h2>
        <p className="text-gray-600 dark:text-gray-300 mb-6">
          Você deseja mover a compra para a nova data ou criar uma duplicata?
        </p>
        <div className="flex justify-end space-x-4">
          <button
            onClick={onCancel}
            className="bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500 text-gray-800 dark:text-gray-200 font-medium py-2 px-4 rounded-md"
          >
            Cancelar
          </button>
          <button
            onClick={onMove}
            className="bg-blue-500 hover:bg-blue-600 text-white font-medium py-2 px-4 rounded-md"
          >
            Mover
          </button>
          <button
            onClick={onDuplicate}
            className="bg-green-500 hover:bg-green-600 text-white font-medium py-2 px-4 rounded-md"
          >
            Duplicar
          </button>
        </div>
      </div>
    </div>
  );
};

export default MoveOrDuplicateModal;
