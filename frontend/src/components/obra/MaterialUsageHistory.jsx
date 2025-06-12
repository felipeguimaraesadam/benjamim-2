import React from 'react';
import HistoricoUsoTable from '../tables/HistoricoUsoTable'; // Assuming path

const MaterialUsageHistory = ({ usosMaterial, isLoading, error }) => {
  return (
    <div className="bg-white shadow-lg rounded-lg p-6 mt-6">
      <h2 className="text-2xl font-semibold mb-4 text-gray-800 border-b pb-2">
        Histórico de Uso de Materiais
      </h2>
      <HistoricoUsoTable
        usosMaterial={usosMaterial}
        isLoading={isLoading} // Pass isLoading specific to usosMaterial if available, else general page isLoading
        error={error} // Pass error specific to usosMaterial if available, else general page error
      />
    </div>
  );
};

export default React.memo(MaterialUsageHistory);
