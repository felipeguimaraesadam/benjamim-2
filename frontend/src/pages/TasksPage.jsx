import React from 'react';
import TaskManager from '../components/tasks/TaskManager';

const TasksPage = () => {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Gerenciamento de Tarefas</h1>
          <p className="mt-2 text-gray-600">
            Monitore e gerencie tarefas do sistema, visualize histórico e estatísticas de execução.
          </p>
        </div>
        
        <TaskManager />
      </div>
    </div>
  );
};

export default Tasks