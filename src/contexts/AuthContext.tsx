import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, AuthContextType } from '../types';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Mock users for demo
const mockUsers: User[] = [
  { id: '1', email: 'admin@befach.com', name: 'Befach Admin', role: 'admin' },
  { id: '2', email: 'shipper1@befach.com', name: 'Global Logistics', role: 'supplier' },
  { id: '3', email: 'shipper2@befach.com', name: 'Ocean Express', role: 'supplier' },
  { id: '4', email: 'shipper3@befach.com', name: 'Swift Cargo', role: 'supplier' },
  { id: '5', email: 'shipper4@befach.com', name: 'Prime Shipping', role: 'supplier' },
  { id: '6', email: 'shipper5@befach.com', name: 'Elite Transport', role: 'supplier' },
  { id: '7', email: 'shipper6@befach.com', name: 'Rapid Freight', role: 'supplier' },
  { id: '8', email: 'shipper7@befach.com', name: 'Secure Logistics', role: 'supplier' },
  { id: '9', email: 'shipper8@befach.com', name: 'Dynamic Cargo', role: 'supplier' },
  { id: '10', email: 'shipper9@befach.com', name: 'Universal Shipping', role: 'supplier' },
  { id: '11', email: 'shipper10@befach.com', name: 'Apex Logistics', role: 'supplier' }
];

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for stored user on app load
    const storedUser = localStorage.getItem('befachUser');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
    setLoading(false);
  }, []);

  const login = async (email: string, password: string, role: 'admin' | 'supplier'): Promise<boolean> => {
    setLoading(true);
    
    // Mock authentication - in production, this would be an API call
    const foundUser = mockUsers.find(u => u.email === email && u.role === role);
    
    if (foundUser && password === 'Befach@123') {
      setUser(foundUser);
      localStorage.setItem('befachUser', JSON.stringify(foundUser));
      setLoading(false);
      return true;
    }
    
    setLoading(false);
    return false;
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('befachUser');
  };

  const value: AuthContextType = {
    user,
    login,
    logout,
    loading
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};