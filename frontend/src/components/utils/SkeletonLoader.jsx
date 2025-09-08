import React from 'react';

const SkeletonLoader = ({ 
  type = 'default', 
  rows = 3, 
  className = '',
  animate = true,
  message = null 
}) => {
  const baseClasses = `bg-gray-200 dark:bg-gray-700 rounded ${animate ? 'animate-pulse' : ''}`;
  
  const renderSkeleton = () => {
    switch (type) {
      case 'table':
        return (
          <div className={`space-y-3 ${className}`}>
            {/* Table header */}
            <div className="grid grid-cols-4 gap-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <div className={`h-4 ${baseClasses}`}></div>
              <div className={`h-4 ${baseClasses}`}></div>
              <div className={`h-4 ${baseClasses}`}></div>
              <div className={`h-4 ${baseClasses}`}></div>
            </div>
            {/* Table rows */}
            {Array.from({ length: rows }).map((_, index) => (
              <div key={index} className="grid grid-cols-4 gap-4 p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                <div className={`h-4 ${baseClasses}`}></div>
                <div className={`h-4 ${baseClasses}`}></div>
                <div className={`h-4 ${baseClasses}`}></div>
                <div className={`h-4 ${baseClasses} w-3/4`}></div>
              </div>
            ))}
          </div>
        );
      
      case 'card':
        return (
          <div className={`space-y-4 ${className}`}>
            {Array.from({ length: rows }).map((_, index) => (
              <div key={index} className="p-6 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700">
                <div className="flex items-center space-x-4 mb-4">
                  <div className={`h-12 w-12 rounded-full ${baseClasses}`}></div>
                  <div className="flex-1 space-y-2">
                    <div className={`h-4 ${baseClasses} w-3/4`}></div>
                    <div className={`h-3 ${baseClasses} w-1/2`}></div>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className={`h-3 ${baseClasses}`}></div>
                  <div className={`h-3 ${baseClasses} w-5/6`}></div>
                  <div className={`h-3 ${baseClasses} w-4/6`}></div>
                </div>
              </div>
            ))}
          </div>
        );
      
      case 'stats':
        return (
          <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 ${className}`}>
            {Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between mb-4">
                  <div className={`h-8 w-8 rounded ${baseClasses}`}></div>
                  <div className={`h-4 w-4 rounded ${baseClasses}`}></div>
                </div>
                <div className="space-y-2">
                  <div className={`h-8 ${baseClasses} w-2/3`}></div>
                  <div className={`h-3 ${baseClasses} w-1/2`}></div>
                </div>
              </div>
            ))}
          </div>
        );
      
      case 'chart':
        return (
          <div className={`bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 ${className}`}>
            <div className="mb-6">
              <div className={`h-6 ${baseClasses} w-1/3 mb-2`}></div>
              <div className={`h-4 ${baseClasses} w-1/2`}></div>
            </div>
            <div className="h-64 flex items-end justify-between space-x-2">
              {Array.from({ length: 7 }).map((_, index) => (
                <div 
                  key={index} 
                  className={`${baseClasses} w-full`}
                  style={{ height: `${Math.random() * 80 + 20}%` }}
                ></div>
              ))}
            </div>
          </div>
        );
      
      case 'form':
        return (
          <div className={`space-y-6 ${className}`}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {Array.from({ length: 4 }).map((_, index) => (
                <div key={index} className="space-y-2">
                  <div className={`h-4 ${baseClasses} w-1/3`}></div>
                  <div className={`h-10 ${baseClasses} w-full`}></div>
                </div>
              ))}
            </div>
            <div className="space-y-2">
              <div className={`h-4 ${baseClasses} w-1/4`}></div>
              <div className={`h-24 ${baseClasses} w-full`}></div>
            </div>
            <div className="flex justify-end space-x-4">
              <div className={`h-10 w-20 ${baseClasses}`}></div>
              <div className={`h-10 w-24 ${baseClasses}`}></div>
            </div>
          </div>
        );
      
      case 'list':
        return (
          <div className={`space-y-3 ${className}`}>
            {Array.from({ length: rows }).map((_, index) => (
              <div key={index} className="flex items-center space-x-4 p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                <div className={`h-10 w-10 rounded-full ${baseClasses}`}></div>
                <div className="flex-1 space-y-2">
                  <div className={`h-4 ${baseClasses} w-3/4`}></div>
                  <div className={`h-3 ${baseClasses} w-1/2`}></div>
                </div>
                <div className={`h-8 w-16 ${baseClasses}`}></div>
              </div>
            ))}
          </div>
        );
      
      case 'dashboard':
        return (
          <div className={`space-y-8 ${className}`}>
            {message && (
              <div className="text-center text-gray-500 dark:text-gray-400 mb-4">
                {message}
              </div>
            )}
            {/* Hero Section */}
            <div className="text-center space-y-4">
              <div className={`h-8 ${baseClasses} w-2/3 mx-auto`}></div>
              <div className={`h-4 ${baseClasses} w-1/2 mx-auto`}></div>
            </div>
            
            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {Array.from({ length: 4 }).map((_, index) => (
                <div key={index} className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg">
                  <div className="flex items-center justify-between mb-4">
                    <div className={`h-8 w-8 rounded ${baseClasses}`}></div>
                    <div className={`h-4 w-4 rounded ${baseClasses}`}></div>
                  </div>
                  <div className={`h-8 ${baseClasses} w-2/3 mb-2`}></div>
                  <div className={`h-3 ${baseClasses} w-1/2`}></div>
                </div>
              ))}
            </div>
            
            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg">
                <div className={`h-6 ${baseClasses} w-1/3 mb-4`}></div>
                <div className="h-64 flex items-end justify-between space-x-2">
                  {Array.from({ length: 7 }).map((_, i) => (
                    <div key={i} className={`${baseClasses} w-full`} style={{ height: `${Math.random() * 80 + 20}%` }}></div>
                  ))}
                </div>
              </div>
              <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg">
                <div className={`h-6 ${baseClasses} w-1/3 mb-4`}></div>
                <div className="h-64 rounded-lg bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
                  <div className={`h-32 w-32 rounded-full ${baseClasses}`}></div>
                </div>
              </div>
            </div>
          </div>
        );
      
      case 'materials':
        return (
          <div className={`space-y-6 ${className}`}>
            {message && (
              <div className="text-center text-gray-500 dark:text-gray-400 mb-4">
                {message}
              </div>
            )}
            {/* Filters */}
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className={`h-10 ${baseClasses}`}></div>
                <div className={`h-10 ${baseClasses}`}></div>
                <div className={`h-10 ${baseClasses}`}></div>
              </div>
            </div>
            
            {/* Materials Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array.from({ length: rows || 6 }).map((_, index) => (
                <div key={index} className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border">
                  <div className="flex items-center space-x-4 mb-4">
                    <div className={`h-12 w-12 rounded ${baseClasses}`}></div>
                    <div className="flex-1">
                      <div className={`h-4 ${baseClasses} w-3/4 mb-2`}></div>
                      <div className={`h-3 ${baseClasses} w-1/2`}></div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className={`h-3 ${baseClasses} w-full`}></div>
                    <div className={`h-3 ${baseClasses} w-2/3`}></div>
                  </div>
                  <div className="flex justify-between items-center mt-4">
                    <div className={`h-6 ${baseClasses} w-1/3`}></div>
                    <div className={`h-8 w-20 ${baseClasses}`}></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      
      case 'employees':
        return (
          <div className={`space-y-6 ${className}`}>
            {message && (
              <div className="text-center text-gray-500 dark:text-gray-400 mb-4">
                {message}
              </div>
            )}
            {/* Header Actions */}
            <div className="flex justify-between items-center">
              <div className={`h-8 ${baseClasses} w-1/4`}></div>
              <div className={`h-10 w-32 ${baseClasses}`}></div>
            </div>
            
            {/* Employee Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array.from({ length: rows || 6 }).map((_, index) => (
                <div key={index} className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border">
                  <div className="flex items-center space-x-4 mb-4">
                    <div className={`h-16 w-16 rounded-full ${baseClasses}`}></div>
                    <div className="flex-1">
                      <div className={`h-5 ${baseClasses} w-3/4 mb-2`}></div>
                      <div className={`h-3 ${baseClasses} w-1/2 mb-1`}></div>
                      <div className={`h-3 ${baseClasses} w-2/3`}></div>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <div className={`h-3 ${baseClasses} w-1/3`}></div>
                      <div className={`h-3 ${baseClasses} w-1/4`}></div>
                    </div>
                    <div className="flex justify-between">
                      <div className={`h-3 ${baseClasses} w-1/4`}></div>
                      <div className={`h-3 ${baseClasses} w-1/3`}></div>
                    </div>
                  </div>
                  <div className="flex space-x-2 mt-4">
                    <div className={`h-8 w-16 ${baseClasses}`}></div>
                    <div className={`h-8 w-16 ${baseClasses}`}></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      
      case 'reports':
        return (
          <div className={`space-y-6 ${className}`}>
            {message && (
              <div className="text-center text-gray-500 dark:text-gray-400 mb-4">
                {message}
              </div>
            )}
            {/* Report Tabs */}
            <div className="border-b border-gray-200 dark:border-gray-700">
              <div className="flex space-x-8">
                {Array.from({ length: 4 }).map((_, index) => (
                  <div key={index} className={`h-4 ${baseClasses} w-24 mb-4`}></div>
                ))}
              </div>
            </div>
            
            {/* Report Filters */}
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                <div className={`h-10 ${baseClasses}`}></div>
                <div className={`h-10 ${baseClasses}`}></div>
                <div className={`h-10 ${baseClasses}`}></div>
                <div className={`h-10 ${baseClasses}`}></div>
              </div>
              <div className="flex space-x-4">
                <div className={`h-10 w-24 ${baseClasses}`}></div>
                <div className={`h-10 w-32 ${baseClasses}`}></div>
              </div>
            </div>
            
            {/* Report Content */}
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm">
              <div className={`h-6 ${baseClasses} w-1/3 mb-6`}></div>
              <div className="space-y-4">
                {Array.from({ length: rows || 5 }).map((_, index) => (
                  <div key={index} className="flex justify-between items-center py-3 border-b border-gray-100 dark:border-gray-700">
                    <div className="flex-1 space-y-1">
                      <div className={`h-4 ${baseClasses} w-2/3`}></div>
                      <div className={`h-3 ${baseClasses} w-1/2`}></div>
                    </div>
                    <div className={`h-4 ${baseClasses} w-1/4`}></div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );
      
      default:
        return (
          <div className={`space-y-3 ${className}`}>
            {Array.from({ length: rows }).map((_, index) => (
              <div key={index} className={`h-4 ${baseClasses}`}></div>
            ))}
          </div>
        );
    }
  };

  return renderSkeleton();
};

export default SkeletonLoader;