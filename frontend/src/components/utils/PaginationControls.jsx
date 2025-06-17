// Re-processing trigger for PaginationControls
import React from 'react';

const PaginationControls = ({
  currentPage,
  totalPages,
  onPageChange,
  totalItems,
  itemsPerPage // Included prop, though not used in this basic version for calculation
}) => {
  // Don't render controls if there's only one page or no pages
  if (totalPages <= 1) {
    // Optionally, still show total items if desired even for a single page
    if (totalItems !== undefined && totalPages === 1) {
        return (
            <div className="flex items-center justify-center mt-4 py-3">
                <div className="text-sm text-gray-700">
                    Total de itens: <span className="font-medium">{totalItems}</span>
                    {itemsPerPage && ` (${itemsPerPage} por página)`}
                </div>
            </div>
        );
    }
    return null;
  }

  // Determine page numbers to display for more advanced pagination (not implemented in this basic version)
  // For now, just Prev/Next and page info

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between mt-4 py-3 bg-white px-4 sm:px-6 border-t border-gray-200">
      <div className="text-sm text-gray-700 mb-2 sm:mb-0">
        Página <span className="font-medium">{currentPage}</span> de <span className="font-medium">{totalPages}</span>
        {totalItems !== undefined && (
          <span className="hidden sm:inline-block ml-2">| Total de itens: <span className="font-medium">{totalItems}</span></span>
        )}
      </div>
      <div className="flex space-x-2">
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="relative inline-flex items-center px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          Anterior
        </button>
        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages || totalPages === 0}
          className="relative inline-flex items-center px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          Próxima
        </button>
      </div>
    </div>
  );
};

export default PaginationControls;
