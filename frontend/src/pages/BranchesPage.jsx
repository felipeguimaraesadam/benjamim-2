import React from 'react';
import BranchManager from '../components/branches/BranchManager';

const BranchesPage = () => {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Gerenciamento de Branches</h1>
          <p className="mt-2 text-gray-600">
            Gerencie branches do sistema, crie novos branches, faça merge e visualize commits.
          </p>
        </div>
        
        <BranchManager />
      </div>
    </div>
  );
};

export default BranchesPage;