import { useEffect, useRef } from 'react';

interface PerformanceMetrics {
  componentName: string;
  renderTime: number;
  mountTime: number;
}

export const usePerformanceMonitor = (componentName: string) => {
  const mountTimeRef = useRef<number>(Date.now());
  const renderTimeRef = useRef<number>(Date.now());

  useEffect(() => {
    const mountTime = Date.now() - mountTimeRef.current;
    
    // Log performance metrics in development
    if (process.env.NODE_ENV === 'development') {
      console.log(`[Performance] ${componentName} mounted in ${mountTime}ms`);
    }
    
    return () => {
      const totalTime = Date.now() - mountTimeRef.current;
      if (process.env.NODE_ENV === 'development') {
        console.log(`[Performance] ${componentName} total lifecycle: ${totalTime}ms`);
      }
    };
  }, [componentName]);

  useEffect(() => {
    renderTimeRef.current = Date.now();
  });

  const measureOperation = <T>(operation: () => T, operationName: string): T => {
    const start = performance.now();
    const result = operation();
    const end = performance.now();
    
    if (process.env.NODE_ENV === 'development') {
      console.log(`[Performance] ${componentName}.${operationName}: ${(end - start).toFixed(2)}ms`);
    }
    
    return result;
  };

  return { measureOperation };
};