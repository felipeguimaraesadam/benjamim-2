import React from 'react';
import Navegacao from './Navegacao';
import { Outlet } from 'react-router-dom';

const Layout = () => {
  return (
    <div className="flex h-screen bg-gray-100">
      <Navegacao />
      {/* Apply left margin for sidebar only on medium screens and up */}
      <main className="flex-1 p-4 md:p-6 overflow-auto md:ml-64">
        <Outlet />
      </main>
    </div>
  );
};
export default Layout;
