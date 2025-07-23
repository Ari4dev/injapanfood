import React from 'react';
import { cn } from '@/lib/utils';

// Skeleton loading component
export const Skeleton = ({ 
  className, 
  ...props 
}: React.HTMLAttributes<HTMLDivElement>) => {
  return (
    <div
      className={cn("animate-pulse rounded-md bg-gray-200", className)}
      {...props}
    />
  );
};

// Product card skeleton
export const ProductCardSkeleton = () => {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 h-full flex flex-col w-full">
      <div className="relative overflow-hidden rounded-t-xl mb-3 sm:mb-4">
        <Skeleton className="w-full aspect-square" />
        <div className="absolute top-2 sm:top-3 right-2 sm:right-3">
          <Skeleton className="h-6 w-20" />
        </div>
      </div>

      <div className="px-3 sm:px-4 flex-1 flex flex-col">
        <Skeleton className="h-4 w-full mb-2" />
        <Skeleton className="h-4 w-3/4 mb-2" />
        <Skeleton className="h-3 w-full mb-2" />
        <Skeleton className="h-3 w-2/3 mb-3" />
        
        <div className="space-y-2 sm:space-y-3">
          <Skeleton className="h-6 w-20" />
          <div className="flex items-center justify-between">
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-4 w-12" />
          </div>
        </div>
      </div>
      
      <div className="p-3 sm:p-4 pt-0">
        <Skeleton className="w-full h-10" />
      </div>
    </div>
  );
};

// Category card skeleton
export const CategoryCardSkeleton = () => {
  return (
    <div className="bg-white p-4 sm:p-6 rounded-xl text-center border border-gray-100 shadow-sm">
      <Skeleton className="w-12 h-12 rounded-full mx-auto mb-2 sm:mb-3" />
      <Skeleton className="h-4 w-3/4 mx-auto" />
    </div>
  );
};

// Spinner component
export const Spinner = ({ 
  size = "md", 
  className 
}: { 
  size?: "sm" | "md" | "lg"; 
  className?: string;
}) => {
  const sizeClasses = {
    sm: "w-4 h-4",
    md: "w-8 h-8", 
    lg: "w-12 h-12"
  };

  return (
    <div className={cn("flex items-center justify-center", className)}>
      <div className={cn(
        "animate-spin rounded-full border-2 border-primary border-t-transparent",
        sizeClasses[size]
      )} />
    </div>
  );
};

// Full page loading component
export const PageLoader = ({ message = "Loading..." }: { message?: string }) => {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="w-16 h-16 rounded-full overflow-hidden mx-auto mb-4">
          <img 
            src="/logo.png" 
            alt="Injapan Food Logo" 
            className="w-full h-full object-contain bg-white p-2 animate-pulse"
          />
        </div>
        <Spinner size="lg" className="mb-4" />
        <p className="text-gray-600 text-lg">{message}</p>
        <div className="mt-4">
          <div className="flex space-x-1 justify-center">
            <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
            <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
            <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Loading overlay for components
export const LoadingOverlay = ({ 
  isLoading, 
  children, 
  message = "Loading..." 
}: { 
  isLoading: boolean; 
  children: React.ReactNode; 
  message?: string;
}) => {
  if (!isLoading) return <>{children}</>;

  return (
    <div className="relative">
      <div className="opacity-50 pointer-events-none">
        {children}
      </div>
      <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center">
        <div className="text-center">
          <Spinner size="lg" className="mb-2" />
          <p className="text-gray-600">{message}</p>
        </div>
      </div>
    </div>
  );
};

// Button loading state
export const ButtonSpinner = () => {
  return (
    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
  );
};

// Table loading skeleton
export const TableSkeleton = ({ rows = 5, columns = 4 }: { rows?: number; columns?: number }) => {
  return (
    <div className="space-y-3">
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div key={rowIndex} className="flex space-x-4">
          {Array.from({ length: columns }).map((_, colIndex) => (
            <Skeleton key={colIndex} className="h-4 flex-1" />
          ))}
        </div>
      ))}
    </div>
  );
};

// Error state component
export const ErrorState = ({ 
  title = "Something went wrong", 
  message = "Please try again later",
  onRetry 
}: { 
  title?: string; 
  message?: string; 
  onRetry?: () => void;
}) => {
  return (
    <div className="text-center py-12">
      <div className="text-6xl mb-4">⚠️</div>
      <h3 className="text-xl font-medium text-gray-900 mb-2">{title}</h3>
      <p className="text-gray-600 mb-6">{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="bg-primary text-white px-6 py-3 rounded-lg hover:bg-primary/90 transition-colors"
        >
          Try Again
        </button>
      )}
    </div>
  );
};