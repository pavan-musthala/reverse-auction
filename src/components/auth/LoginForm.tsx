import React, { useState, useEffect } from 'react';
import { LogIn, User, Shield, UserPlus } from 'lucide-react';
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
  const [isSignUp, setIsSignUp] = useState(false);
  const [signUpLoading, setSignUpLoading] = useState(false);

  // Initialize demo accounts on component mount
  useEffect(() => {
    const initializeDemoAccounts = async () => {
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
          console.log('Demo accounts initialized successfully');
        }
      } catch (error) {
        console.log('Demo accounts may already exist or there was an initialization error');
      }
    };

    initializeDemoAccounts();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    const success = await login(formData.email, formData.password, formData.role);
    if (!success) {
      setError('Invalid credentials. Please check your email and password.');
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-amber-50 flex items-center justify-center p-4 sm:p-6">
      <div className="bg-white rounded-2xl shadow-2xl p-6 sm:p-8 w-full max-w-md">
        <div className="text-center mb-6 sm:mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 mb-3 sm:mb-4">
            <img 
              src="/befach.jpg" 
              alt="Befach International Logo" 
              className="w-full h-full object-contain"
            />
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">Befach International</h1>
          <p className="text-orange-600 font-medium mb-3 sm:mb-4 text-sm sm:text-base">Making your imports very easy!</p>
          <p className="text-gray-600 text-sm sm:text-base">
            {isSignUp ? 'Create your account' : 'Sign in to your reverse auction platform'}
          </p>
        </div>

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
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={loading || signUpLoading}
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