import React from 'react';
import { Link } from 'react-router-dom';
import ObraCompletaComprasTable from '../tables/ObraCompletaComprasTable'; // Assuming path

const ObraPurchasesTabContent = ({
  todasCompras,
  isLoading,
  obraId,
  obraNome,
}) => {
  return (
    <div className="bg-white shadow-lg rounded-lg p-6">
      <div className="flex justify-between items-center mb-4 border-b pb-2">
        <h2 className="text-xl font-semibold text-gray-700">
          Todas as Compras da Obra
        </h2>
        <Link
          to="/compras" // Link to general compras page or a modal for new compra
          state={{ obraIdParaNovaCompra: obraId, obraNome: obraNome }} // Pass obraId and name
          className="bg-green-500 hover:bg-green-600 text-white font-semibold py-1 px-3 rounded-md shadow-sm transition duration-150 ease-in-out text-xs"
        >
          + Adicionar Nova Compra
        </Link>
      </div>
      <ObraCompletaComprasTable
        compras={todasCompras}
        isLoading={isLoading}
      />
    </div>
  );
};

export default React.memo(ObraPurchasesTabContent);
