import React from 'react';
import AnexoS3Manager from '../components/anexos/AnexoS3Manager';

const AnexosS3Page = () => {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Gerenciamento de Anexos S3</h1>
          <p className="mt-2 text-gray-600">
            Gerencie arquivos armazenados no Amazon S3, faça upload de novos arquivos e migre anexos existentes.
          </p>
        </div>
        
        <AnexoS3Manager />
      </div>
    </div>
  );
};

export default AnexosS3Page;