import { useState, useEffect } from 'react';
import { Layout } from './components/Layout';
import { POSTerminal } from './routes/pos';
import { CustomersPage } from './routes/customers';
import { ProductsPage } from './routes/products';
import { InventoryPage } from './routes/inventory';
import { InstallmentsPage } from './routes/installments';
import { DashboardPage } from './routes/dashboard';
import { LoginPage } from './routes/login';
import { SecurityDashboardPage } from './routes/security';
import { SettingsPage } from './routes/settings';
import { AuditPage } from './routes/audit';
import { LedgerPage } from './routes/ledger';
import { BackupPage } from './routes/backup';
import { ProfilePage } from './routes/profile';
import { RetailWorkflow } from './routes/workflows/RetailWorkflow';
import { WholesaleWorkflow } from './routes/workflows/WholesaleWorkflow';
import { LipaMdogoWorkflow } from './routes/workflows/LipaMdogoWorkflow';
import { KyamaaWorkflow } from './routes/workflows/KyamaaWorkflow';
import { ShiftsManagement } from './routes/ShiftsManagement';
import { CashDrawerManagement } from './routes/CashDrawerManagement';
import { StockManagement } from './routes/StockManagement';
import { ReportingDashboard } from './routes/ReportingDashboard';
import { RBACDashboard } from './routes/RBACDashboard';
import { AuthProvider, useAuth } from './context/AuthContext';
import { initNetworkListeners, syncNow } from './lib/sync';
import { unlockUserByUsername } from './lib/auth';

function AppContent() {
  const [currentPage, setCurrentPage] = useState('pos');
  const { user, isLoading, isAuthenticated, error } = useAuth();

  useEffect(() => {
    initNetworkListeners();

    // Initial sync on app load
    syncNow().then((result) => {
      console.log('Initial sync:', result.message);
    });

    // Development utilities - Expose unlock function for testing
    (window as any).dev = {
      unlockUser: async (username: string) => {
        const result = await unlockUserByUsername(username);
        if (result.success) {
          console.log(`✓ Account "${username}" unlocked. Try logging in again.`);
        } else {
          console.error(`✗ Failed to unlock: ${result.error}`);
        }
        return result;
      },
    };
  }, []);

  // Show error state
  if (error) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-center text-white max-w-md">
          <div className="text-red-500 text-6xl mb-4">⚠</div>
          <h1 className="text-2xl font-bold mb-2">Initialization Error</h1>
          <p className="text-slate-400 mb-6">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-2 bg-emerald-600 hover:bg-emerald-700 rounded-lg font-medium transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  // Show loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-white">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-400 mx-auto"></div>
          <p className="mt-4 text-slate-400">Loading...</p>
        </div>
      </div>
    );
  }

  // Show login page if not authenticated
  if (!isAuthenticated) {
    return <LoginPage />;
  }

  const renderPage = () => {
    switch (currentPage) {
      case 'pos':
        return <POSTerminal />;
      case 'retail':
        return <RetailWorkflow />;
      case 'wholesale':
        return <WholesaleWorkflow />;
      case 'lipa-mdogo-workflow':
        return <LipaMdogoWorkflow />;
      case 'kyamaa':
        return <KyamaaWorkflow />;
      case 'customers':
        return <CustomersPage />;
      case 'products':
        return <ProductsPage />;
      case 'inventory':
        return <InventoryPage />;
      case 'installments':
        return <InstallmentsPage />;
      case 'shifts':
        return <ShiftsManagement />;
      case 'cash-drawer':
        return <CashDrawerManagement />;
      case 'stock':
        return <StockManagement />;
      case 'dashboard':
        return <DashboardPage />;
      case 'reporting':
        return <ReportingDashboard />;
      case 'security':
        return <SecurityDashboardPage />;
      case 'rbac':
        return <RBACDashboard />;
      case 'settings':
        return <SettingsPage />;
      case 'profile':
        return <ProfilePage />;
      case 'audit':
        return <AuditPage />;
      case 'ledger':
        return <LedgerPage />;
      case 'backup':
        return <BackupPage />;
      default:
        return <POSTerminal />;
    }
  };

  return (
    <Layout currentPage={currentPage} onNavigate={setCurrentPage} user={user}>
      {renderPage()}
    </Layout>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
