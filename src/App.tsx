import React, { useState } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useApp } from './context/AppContext';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { CartDrawer } from './components/CartDrawer';
import { 
  ConfirmationModal, 
  PromptModal, 
  NotificationDetailModal, 
  EditProductModal, 
  AssignPickupModal, 
  InvoiceModal 
} from './components/Modals';

// Separate Page Components
import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';
import { InventoryPage } from './pages/InventoryPage';
import { OrdersPage } from './pages/OrdersPage';
import { SettingsPage } from './pages/SettingsPage';

export const App: React.FC = () => {
  const { 
    user, 
    authLoading, 
    toastMessage, 
    isToastError, 
    successModal, 
    setSuccessModal,
    confirmModal, 
    setConfirmModal,
    promptModal, 
    setPromptModal,
    selectedNotification, 
    setSelectedNotification,
    editingProduct, 
    setEditingProduct, 
    handleSaveProduct,
    assignPickupOrder, 
    setAssignPickupOrder, 
    handleUpdateOrderStatus,
    selectedInvoiceOrder, 
    setSelectedInvoiceOrder
  } = useApp();

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();

  // Track SPA route changes with Contentsquare
  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      const win = window as unknown as { _csq?: unknown[] };
      win._csq = win._csq || [];
      win._csq.push(['trackPageview', location.pathname]);
    }
  }, [location.pathname]);

  // Loading spinner during initial auth check
  if (authLoading) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center text-white space-y-4 font-sans">
        <div className="w-12 h-12 border-4 border-brand-orange border-t-transparent rounded-full animate-spin" />
        <div className="text-center">
          <p className="text-sm font-bold tracking-wider text-slate-200 uppercase">NEUnifits System</p>
          <p className="text-xs text-slate-400">Authenticating secure session...</p>
        </div>
      </div>
    );
  }

  // Not signed in -> Show Login Page
  if (!user) {
    return <LoginPage />;
  }

  const isAdmin = user.role === 'admin' || user.role === 'superadmin';

  return (
    <div className="min-h-screen bg-slate-50 flex font-sans antialiased text-slate-900 selection:bg-brand-orange selection:text-brand-blue">
      {/* Persistent Left Sidebar */}
      <Sidebar 
        isMobileOpen={isMobileMenuOpen} 
        onCloseMobile={() => setIsMobileMenuOpen(false)} 
      />

      {/* Main Application Container */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen overflow-x-hidden">
        {/* Top Header */}
        <Header onToggleMobileMenu={() => setIsMobileMenuOpen(true)} />

        {/* Dynamic Route Pages */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          <Routes>
            <Route 
              path="/" 
              element={<Navigate to={isAdmin ? "/dashboard" : "/inventory"} replace />} 
            />
            <Route 
              path="/dashboard" 
              element={isAdmin ? <DashboardPage /> : <Navigate to="/inventory" replace />} 
            />
            <Route path="/inventory" element={<InventoryPage />} />
            <Route path="/orders" element={<OrdersPage />} />
            <Route 
              path="/settings" 
              element={isAdmin ? <SettingsPage /> : <Navigate to="/inventory" replace />} 
            />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>

        {/* Application Footer */}
        <footer className="py-6 px-4 sm:px-8 border-t border-slate-200 text-center text-xs text-slate-400 bg-white">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
            <span>&copy; {new Date().getFullYear()} New Era University • Uniform Services System</span>
            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Version 2.4.0 (Modular SPA)</span>
          </div>
        </footer>
      </div>

      {/* Slide-out Cart for Students */}
      <CartDrawer />

      {/* Global Modals */}
      <ConfirmationModal />
      <PromptModal />
      <NotificationDetailModal />
      <EditProductModal />
      <AssignPickupModal />
      <InvoiceModal />

      {/* Floating Global Toast */}
      {toastMessage && (
        <div 
          className={`fixed bottom-6 right-6 z-[300] px-5 py-3 rounded-2xl shadow-2xl text-xs font-black uppercase tracking-wider text-white transition-all transform animate-bounce ${
            isToastError ? 'bg-rose-600' : 'bg-slate-900 border border-slate-700'
          }`}
        >
          {toastMessage}
        </div>
      )}
    </div>
  );
};

export default App;
