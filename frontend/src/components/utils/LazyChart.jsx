import React, { Suspense, lazy } from 'react';
import SkeletonLoader from './SkeletonLoader';

// Lazy load recharts components
const ResponsiveContainer = lazy(() => 
  import('recharts').then(module => ({ default: module.ResponsiveContainer }))
);

const PieChart = lazy(() => 
  import('recharts').then(module => ({ default: module.PieChart }))
);

const BarChart = lazy(() => 
  import('recharts').then(module => ({ default: module.BarChart }))
);

const LineChart = lazy(() => 
  import('recharts').then(module => ({ default: module.LineChart }))
);

const AreaChart = lazy(() => 
  import('recharts').then(module => ({ default: module.AreaChart }))
);

// Lazy load other recharts components
const Pie = lazy(() => 
  import('recharts').then(module => ({ default: module.Pie }))
);

const Bar = lazy(() => 
  import('recharts').then(module => ({ default: module.Bar }))
);

const Line = lazy(() => 
  import('recharts').then(module => ({ default: module.Line }))
);

const Area = lazy(() => 
  import('recharts').then(module => ({ default: module.Area }))
);

const XAxis = lazy(() => 
  import('recharts').then(module => ({ default: module.XAxis }))
);

const YAxis = lazy(() => 
  import('recharts').then(module => ({ default: module.YAxis }))
);

const CartesianGrid = lazy(() => 
  import('recharts').then(module => ({ default: module.CartesianGrid }))
);

const Tooltip = lazy(() => 
  import('recharts').then(module => ({ default: module.Tooltip }))
);

const Legend = lazy(() => 
  import('recharts').then(module => ({ default: module.Legend }))
);

const Cell = lazy(() => 
  import('recharts').then(module => ({ default: module.Cell }))
);

const LabelList = lazy(() => 
  import('recharts').then(module => ({ default: module.LabelList }))
);

// Chart loading fallback component
const ChartLoadingFallback = ({ height = 300, message = "Carregando gráfico..." }) => (
  <div className="w-full flex items-center justify-center bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700" style={{ height }}>
    <div className="text-center">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-2"></div>
      <p className="text-sm text-gray-600 dark:text-gray-400">{message}</p>
    </div>
  </div>
);

// Error boundary for charts
class ChartErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Chart Error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="w-full flex items-center justify-center bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800 p-4" style={{ height: this.props.height || 300 }}>
          <div className="text-center">
            <p className="text-sm text-red-600 dark:text-red-400 mb-2">Erro ao carregar gráfico</p>
            <button 
              onClick={() => this.setState({ hasError: false })}
              className="text-xs text-red-500 hover:text-red-700 underline"
            >
              Tentar novamente
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// Wrapper component for lazy charts
const LazyChart = ({ children, height = 300, loadingMessage, className = "" }) => {
  return (
    <div className={`w-full ${className}`}>
      <ChartErrorBoundary height={height}>
        <Suspense fallback={<ChartLoadingFallback height={height} message={loadingMessage} />}>
          {children}
        </Suspense>
      </ChartErrorBoundary>
    </div>
  );
};

// Export all components
export {
  LazyChart,
  ResponsiveContainer,
  PieChart,
  BarChart,
  LineChart,
  AreaChart,
  Pie,
  Bar,
  Line,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  Cell,
  LabelList,
  ChartLoadingFallback,
  ChartErrorBoundary
};

export default LazyChart;