import React, { useState, useEffect } from 'react';
import { LogIn, User, Shield, UserPlus, AlertCircle, Info } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase, isSupabaseConfigured } from '../../lib/supabase';

const LoginForm: React.FC = () => {
  const { login, loading } = useAuth();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: '',
    role: 'supplier' as 'admin' | 'supplier'
  });
  const [error, setError] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [signUpLoading, setSignUpLoading] = useState(false);
  const [demoAccountsStatus, setDemoAccountsStatus] = useState<'loading' | 'success' | 'failed' | 'unknown'>('loading');
  const [showDemoInfo, setShowDemoInfo] = useState(false);

  // Initialize demo accounts on component mount
  useEffect(() => {
    const initializeDemoAccounts = async () => {
      if (!isSupabaseConfigured()) {
        setDemoAccountsStatus('failed');
        return;
      }

      try {
        const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/setup-demo-accounts`;
        
        const response = await fetch(apiUrl, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
            'Content-Type': 'application/json',
          },
        });

        if (response.ok) {
          const result = await response.json();
          console.log('Demo accounts initialization result:', result);
          setDemoAccountsStatus('success');
        } else {
          console.warn('Demo accounts initialization failed:', response.status);
          setDemoAccountsStatus('failed');
        }
      } catch (error) {
        console.warn('Demo accounts initialization error:', error);
        setDemoAccountsStatus('failed');
      }
    };

    // Add delay to avoid race conditions
    const timer = setTimeout(initializeDemoAccounts, 1000);
    return () => clearTimeout(timer);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!isSupabaseConfigured()) {
      setError('Database connection not configured. Please check your environment settings.');
      return;
    }
    
    const success = await login(formData.email, formData.password, formData.role);
    if (!success) {
      if (formData.email === 'admin@befach.com' || formData.email === 'supplier@befach.com') {
        setError('Demo accounts may not be set up properly. Please try creating a new account or contact support.');
        setShowDemoInfo(true);
      } else {
        setError('Invalid credentials. Please check your email and password.');
      }
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSignUpLoading(true);

    if (!isSupabaseConfigured()) {
      setError('Database connection not configured. Please check your environment settings.');
      setSignUpLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            name: formData.name,
            role: formData.role
          }
        }
      });

      if (error) {
        setError(error.message);
      } else if (data.user) {
        setError('');
        setIsSignUp(false);
        // Auto-login after successful signup
        await login(formData.email, formData.password, formData.role);
      }
    } catch (error) {
      setError('An error occurred during sign up');
    } finally {
      setSignUpLoading(false);
    }
  };

  const loadDemoCredentials = (role: 'admin' | 'supplier') => {
    if (role === 'admin') {
      setFormData({
        ...formData,
        email: 'admin@befach.com',
        password: 'admin123',
        role: 'admin'
      });
    } else {
      setFormData({
        ...formData,
        email: 'supplier@befach.com',
        password: 'supplier123',
        role: 'supplier'
      });
    }
    setShowDemoInfo(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-amber-50 flex items-center justify-center p-4 sm:p-6">
      <div className="bg-white rounded-2xl shadow-2xl p-6 sm:p-8 w-full max-w-md">
        <div className="text-center mb-6 sm:mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 mb-3 sm:mb-4">
            <img 
              src="/befach.jpg" 
              alt="Befach International Logo" 
              className="w-full h-full object-contain"
              onError={(e) => {
                console.warn('Logo image failed to load');
                e.currentTarget.style.display = 'none';
              }}
            />
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">Reverse Auction Tool</h1>
          <p className="text-orange-600 font-medium mb-3 sm:mb-4 text-sm sm:text-base">Reduce your product cost. Maximize profit</p>
          <p className="text-gray-600 text-sm sm:text-base">
            {isSignUp ? 'Create your account' : 'Sign in to your reverse auction platform'}
          </p>
        </div>

        {/* Connection Status */}
        {!isSupabaseConfigured() && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl">
            <div className="flex items-start">
              <AlertCircle className="w-4 h-4 text-red-600 mt-0.5 mr-2 flex-shrink-0" />
              <div className="text-sm text-red-700">
                <p className="font-medium mb-1">Connection Error</p>
                <p>Database connection not configured. Please check your environment settings.</p>
              </div>
            </div>
          </div>
        )}

        {/* Demo Account Status */}
        {isSupabaseConfigured() && demoAccountsStatus === 'failed' && !isSignUp && (
          <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-xl">
            <div className="flex items-start">
              <Info className="w-4 h-4 text-amber-600 mt-0.5 mr-2 flex-shrink-0" />
              <div className="text-sm text-amber-700">
                <p className="font-medium mb-1">Demo accounts unavailable</p>
                <p>Please create a new account to get started.</p>
              </div>
            </div>
          </div>
        )}

        {/* Demo Credentials Helper */}
        {isSupabaseConfigured() && !isSignUp && demoAccountsStatus === 'success' && (
          <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-xl">
            <div className="flex items-start">
              <Info className="w-4 h-4 text-blue-600 mt-0.5 mr-2 flex-shrink-0" />
              <div className="text-sm text-blue-700">
                <p className="font-medium mb-2">Try demo accounts:</p>
                <div className="space-y-1">
                  <button
                    type="button"
                    onClick={() => loadDemoCredentials('admin')}
                    className="block w-full text-left px-2 py-1 rounded bg-blue-100 hover:bg-blue-200 transition-colors"
                  >
                    <span className="font-medium">Admin:</span> admin@befach.com / admin123
                  </button>
                  <button
                    type="button"
                    onClick={() => loadDemoCredentials('supplier')}
                    className="block w-full text-left px-2 py-1 rounded bg-blue-100 hover:bg-blue-200 transition-colors"
                  >
                    <span className="font-medium">Shipper:</span> supplier@befach.com / supplier123
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        <form onSubmit={isSignUp ? handleSignUp : handleSubmit} className="space-y-4 sm:space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Role
            </label>
            <div className="flex space-x-2">
              <button
                type="button"
                onClick={() => setFormData({ ...formData, role: 'admin' })}
                className={`flex-1 flex items-center justify-center px-3 sm:px-4 py-2.5 sm:py-3 rounded-xl border-2 transition-all text-sm sm:text-base ${
                  formData.role === 'admin'
                    ? 'border-orange-500 bg-orange-50 text-orange-700'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <Shield className="w-4 h-4 sm:w-5 sm:h-5 mr-1 sm:mr-2" />
                Admin
              </button>
              <button
                type="button"
                onClick={() => setFormData({ ...formData, role: 'supplier' })}
                className={`flex-1 flex items-center justify-center px-3 sm:px-4 py-2.5 sm:py-3 rounded-xl border-2 transition-all text-sm sm:text-base ${
                  formData.role === 'supplier'
                    ? 'border-orange-500 bg-orange-50 text-orange-700'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <User className="w-4 h-4 sm:w-5 sm:h-5 mr-1 sm:mr-2" />
                Shipper
              </button>
            </div>
          </div>

          {isSignUp && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Full Name
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 sm:px-4 py-2.5 sm:py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors text-sm sm:text-base"
                placeholder="Enter your full name"
                required
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full px-3 sm:px-4 py-2.5 sm:py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors text-sm sm:text-base"
              placeholder="Enter your email"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Password
            </label>
            <input
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              className="w-full px-3 sm:px-4 py-2.5 sm:py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors text-sm sm:text-base"
              placeholder="Enter your password"
              required
              minLength={6}
            />
          </div>

          {error && (
            <div className="p-3 sm:p-4 bg-red-50 border border-red-200 rounded-xl">
              <div className="flex items-start">
                <AlertCircle className="w-4 h-4 text-red-600 mt-0.5 mr-2 flex-shrink-0" />
                <p className="text-sm text-red-600">{error}</p>
              </div>
            </div>
          )}

          {showDemoInfo && (
            <div className="p-3 sm:p-4 bg-yellow-50 border border-yellow-200 rounded-xl">
              <div className="flex items-start">
                <Info className="w-4 h-4 text-yellow-600 mt-0.5 mr-2 flex-shrink-0" />
                <div className="text-sm text-yellow-700">
                  <p className="font-medium mb-1">Demo Account Issue</p>
                  <p className="mb-2">The demo accounts may not be properly configured. You can:</p>
                  <ul className="list-disc list-inside space-y-1 text-xs">
                    <li>Create a new account using the "Sign up" option</li>
                    <li>Contact support if you need access to demo accounts</li>
                  </ul>
                </div>
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={loading || signUpLoading || !isSupabaseConfigured()}
            className="w-full bg-gradient-to-r from-orange-500 to-amber-500 text-white py-2.5 sm:py-3 px-4 rounded-xl font-semibold hover:from-orange-600 hover:to-amber-600 focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 transition-all disabled:opacity-50 text-sm sm:text-base"
          >
            {loading || signUpLoading ? (
              isSignUp ? 'Creating Account...' : 'Signing in...'
            ) : (
              <>
                {isSignUp ? (
                  <>
                    <UserPlus className="w-4 h-4 sm:w-5 sm:h-5 mr-2 inline" />
                    Create Account
                  </>
                ) : (
                  <>
                    <LogIn className="w-4 h-4 sm:w-5 sm:h-5 mr-2 inline" />
                    Sign In
                  </>
                )}
              </>
            )}
          </button>

          <div className="text-center">
            <button
              type="button"
              onClick={() => {
                setIsSignUp(!isSignUp);
                setError('');
                setShowDemoInfo(false);
              }}
              className="text-orange-600 hover:text-orange-700 font-medium transition-colors text-sm sm:text-base"
            >
              {isSignUp ? 'Already have an account? Sign in' : 'Need an account? Sign up'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default LoginForm;