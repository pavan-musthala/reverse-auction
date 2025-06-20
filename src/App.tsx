import React from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { AuctionProvider } from './contexts/AuctionContext';
import LoginForm from './components/auth/LoginForm';
import Header from './components/common/Header';
import AdminDashboard from './components/admin/AdminDashboard';
import SupplierDashboard from './components/supplier/SupplierDashboard';

const AppContent: React.FC = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-amber-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-to-r from-orange-500 to-amber-500 rounded-full animate-pulse mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <LoginForm />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main>
        {user.role === 'admin' ? <AdminDashboard /> : <SupplierDashboard />}
      </main>
    </div>
  );
};

function App() {
  return (
    <AuthProvider>
      <AuctionProvider>
        <AppContent />
      </AuctionProvider>
    </AuthProvider>
  );
}

export default App;