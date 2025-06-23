import React, { useState } from 'react';
import { LogIn, User, Shield, UserPlus, AlertCircle, CheckCircle } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';

const LoginForm: React.FC = () => {
  const { login, loading } = useAuth();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: '',
    role: 'supplier' as 'admin' | 'supplier'
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [signUpLoading, setSignUpLoading] = useState(false);
  const [isCreatingAccounts, setIsCreatingAccounts] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    
    const success = await login(formData.email, formData.password, formData.role);
    if (!success) {
      setError('Invalid credentials. Please check your email and password, or create an account if you don\'t have one.');
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setSignUpLoading(true);

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
        setSuccess('Account created successfully! You can now sign in.');
        setIsSignUp(false);
        // Clear form
        setFormData({
          email: '',
          password: '',
          name: '',
          role: 'supplier'
        });
      }
    } catch (error) {
      setError('An error occurred during sign up');
    } finally {
      setSignUpLoading(false);
    }
  };

  const createDefaultAccounts = async () => {
    setIsCreatingAccounts(true);
    setError('');
    setSuccess('');
    
    const accounts = [
      { email: 'admin@befach.com', password: 'Befach@123', name: 'Admin User', role: 'admin' },
      ...Array.from({ length: 10 }, (_, i) => ({
        email: `shipper${i + 1}@befach.com`,
        password: 'Befach@123',
        name: `Shipper ${i + 1}`,
        role: 'supplier'
      }))
    ];

    let successCount = 0;
    let errorCount = 0;

    for (const account of accounts) {
      try {
        const { error } = await supabase.auth.signUp({
          email: account.email,
          password: account.password,
          options: {
            data: {
              name: account.name,
              role: account.role
            }
          }
        });

        if (error) {
          console.error(`Failed to create ${account.email}:`, error.message);
          errorCount++;
        } else {
          successCount++;
        }
      } catch (error) {
        console.error(`Error creating ${account.email}:`, error);
        errorCount++;
      }
    }

    setIsCreatingAccounts(false);
    
    if (successCount > 0) {
      setSuccess(`Successfully created ${successCount} accounts. You can now sign in with the provided credentials.`);
    }
    
    if (errorCount > 0) {
      setError(`${errorCount} accounts failed to create (they may already exist).`);
    }
  };

  const fillDemoCredentials = (type: 'admin' | 'shipper') => {
    if (type === 'admin') {
      setFormData({
        email: 'admin@befach.com',
        password: 'Befach@123',
        name: 'Admin User',
        role: 'admin'
      });
    } else {
      setFormData({
        email: 'shipper1@befach.com',
        password: 'Befach@123',
        name: 'Shipper 1',
        role: 'supplier'
      });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-amber-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 mb-4">
            <img 
              src="/befach.jpg" 
              alt="Befach International Logo" 
              className="w-full h-full object-contain"
            />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Befach International</h1>
          <p className="text-orange-600 font-medium mb-4">Making your imports very easy!</p>
          <p className="text-gray-600">
            {isSignUp ? 'Create your account' : 'Sign in to your reverse auction platform'}
          </p>
        </div>

        {!isSignUp && (
          <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-xl">
            <h3 className="text-sm font-semibold text-blue-800 mb-2">Demo Credentials</h3>
            <div className="space-y-2">
              <button
                type="button"
                onClick={() => fillDemoCredentials('admin')}
                className="w-full text-left text-xs text-blue-700 hover:text-blue-900 transition-colors"
              >
                Admin: admin@befach.com / Befach@123
              </button>
              <button
                type="button"
                onClick={() => fillDemoCredentials('shipper')}
                className="w-full text-left text-xs text-blue-700 hover:text-blue-900 transition-colors"
              >
                Shipper: shipper1@befach.com / Befach@123
              </button>
            </div>
            <button
              type="button"
              onClick={createDefaultAccounts}
              disabled={isCreatingAccounts}
              className="w-full mt-3 bg-blue-600 text-white py-2 px-3 rounded-lg text-xs font-medium hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {isCreatingAccounts ? 'Creating Accounts...' : 'Create Demo Accounts'}
            </button>
          </div>
        )}

        <form onSubmit={isSignUp ? handleSignUp : handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Role
            </label>
            <div className="flex space-x-2">
              <button
                type="button"
                onClick={() => setFormData({ ...formData, role: 'admin' })}
                className={`flex-1 flex items-center justify-center px-4 py-3 rounded-xl border-2 transition-all ${
                  formData.role === 'admin'
                    ? 'border-orange-500 bg-orange-50 text-orange-700'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <Shield className="w-5 h-5 mr-2" />
                Admin
              </button>
              <button
                type="button"
                onClick={() => setFormData({ ...formData, role: 'supplier' })}
                className={`flex-1 flex items-center justify-center px-4 py-3 rounded-xl border-2 transition-all ${
                  formData.role === 'supplier'
                    ? 'border-orange-500 bg-orange-50 text-orange-700'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <User className="w-5 h-5 mr-2" />
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
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors"
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
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors"
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
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors"
              placeholder="Enter your password"
              required
              minLength={6}
            />
          </div>

          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-xl flex items-start">
              <AlertCircle className="w-5 h-5 text-red-500 mr-2 mt-0.5 flex-shrink-0" />
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          {success && (
            <div className="p-4 bg-green-50 border border-green-200 rounded-xl flex items-start">
              <CheckCircle className="w-5 h-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
              <p className="text-sm text-green-600">{success}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={loading || signUpLoading}
            className="w-full bg-gradient-to-r from-orange-500 to-amber-500 text-white py-3 px-4 rounded-xl font-semibold hover:from-orange-600 hover:to-amber-600 focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 transition-all disabled:opacity-50"
          >
            {loading || signUpLoading ? (
              isSignUp ? 'Creating Account...' : 'Signing in...'
            ) : (
              <>
                {isSignUp ? (
                  <>
                    <UserPlus className="w-5 h-5 mr-2 inline" />
                    Create Account
                  </>
                ) : (
                  <>
                    <LogIn className="w-5 h-5 mr-2 inline" />
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
                setSuccess('');
              }}
              className="text-orange-600 hover:text-orange-700 font-medium transition-colors"
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