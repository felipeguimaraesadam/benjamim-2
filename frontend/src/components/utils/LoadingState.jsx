import React from 'react';
import SpinnerIcon from './SpinnerIcon';
import SkeletonLoader from './SkeletonLoader';

const LoadingState = ({ 
  type = 'spinner', 
  size = 'medium',
  message = 'Carregando...',
  fullScreen = false,
  overlay = false,
  skeletonType = 'default',
  skeletonRows = 3,
  className = ''
}) => {
  const sizeClasses = {
    small: 'w-4 h-4',
    medium: 'w-8 h-8',
    large: 'w-12 h-12',
    xlarge: 'w-16 h-16'
  };

  const containerClasses = fullScreen 
    ? 'fixed inset-0 z-50 flex items-center justify-center bg-white dark:bg-gray-900'
    : overlay
    ? 'absolute inset-0 z-10 flex items-center justify-center bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm'
    : 'flex items-center justify-center p-8';

  const renderSpinner = () => (
    <div className={`${containerClasses} ${className}`}>
      <div className="text-center">
        <SpinnerIcon className={`${sizeClasses[size]} text-blue-500 mx-auto mb-4`} />
        {message && (
          <p className="text-gray-600 dark:text-gray-400 text-sm font-medium">
            {message}
          </p>
        )}
      </div>
    </div>
  );

  const renderPulse = () => (
    <div className={`${containerClasses} ${className}`}>
      <div className="text-center">
        <div className={`${sizeClasses[size]} bg-blue-500 rounded-full animate-pulse mx-auto mb-4`}></div>
        {message && (
          <p className="text-gray-600 dark:text-gray-400 text-sm font-medium animate-pulse">
            {message}
          </p>
        )}
      </div>
    </div>
  );

  const renderDots = () => (
    <div className={`${containerClasses} ${className}`}>
      <div className="text-center">
        <div className="flex space-x-2 justify-center mb-4">
          <div className="w-3 h-3 bg-blue-500 rounded-full animate-bounce"></div>
          <div className="w-3 h-3 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
          <div className="w-3 h-3 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
        </div>
        {message && (
          <p className="text-gray-600 dark:text-gray-400 text-sm font-medium">
            {message}
          </p>
        )}
      </div>
    </div>
  );

  const renderBars = () => (
    <div className={`${containerClasses} ${className}`}>
      <div className="text-center">
        <div className="flex space-x-1 justify-center mb-4">
          {Array.from({ length: 5 }).map((_, index) => (
            <div 
              key={index}
              className="w-2 bg-blue-500 rounded animate-pulse"
              style={{ 
                height: '24px',
                animationDelay: `${index * 0.1}s`,
                animationDuration: '1s'
              }}
            ></div>
          ))}
        </div>
        {message && (
          <p className="text-gray-600 dark:text-gray-400 text-sm font-medium">
            {message}
          </p>
        )}
      </div>
    </div>
  );

  const renderSkeleton = () => (
    <div className={className}>
      <SkeletonLoader 
        type={skeletonType} 
        rows={skeletonRows}
        animate={true}
      />
    </div>
  );

  const renderMinimal = () => (
    <div className={`flex items-center justify-center space-x-2 ${className}`}>
      <SpinnerIcon className="w-4 h-4 text-blue-500" />
      {message && (
        <span className="text-gray-600 dark:text-gray-400 text-sm">
          {message}
        </span>
      )}
    </div>
  );

  switch (type) {
    case 'spinner':
      return renderSpinner();
    case 'pulse':
      return renderPulse();
    case 'dots':
      return renderDots();
    case 'bars':
      return renderBars();
    case 'skeleton':
      return renderSkeleton();
    case 'minimal':
      return renderMinimal();
    default:
      return renderSpinner();
  }
};

export default LoadingState;