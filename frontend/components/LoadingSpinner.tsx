// components/LoadingSpinner.tsx
import React from "react";

interface LoadingSpinnerProps {
  fullScreen?: boolean;
  size?: 'sm' | 'md' | 'lg';
  color?: 'primary' | 'secondary' | 'accent';
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ 
  fullScreen = false, 
  size = 'md',
  color = 'primary'
}) => {
  const sizeClasses = {
    sm: 'h-8 w-8 border-2',
    md: 'h-12 w-12 border-t-2 border-b-2',
    lg: 'h-16 w-16 border-t-4 border-b-4'
  };

  const colorClasses = {
    primary: 'border-blue-500',
    secondary: 'border-gray-500',
    accent: 'border-purple-500'
  };

  return (
    <div 
      className={`flex items-center justify-center ${fullScreen ? 'min-h-screen' : 'min-h-[200px]'}`}
      aria-live="polite"
      aria-busy="true"
    >
      <div 
        className={`animate-spin rounded-full ${sizeClasses[size]} ${colorClasses[color]}`}
        role="status"
      >
        <span className="sr-only">Carregando...</span>
      </div>
    </div>
  );
};

export default LoadingSpinner;