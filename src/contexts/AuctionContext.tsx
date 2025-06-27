import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { useAuth } from './AuthContext';
import { ProductRequirement, Bid, AuctionContextType } from '../types';
import { Database } from '../types/database';
import { EmailService } from '../lib/emailService';

const AuctionContext = createContext<AuctionContextType | undefined>(undefined);

export const AuctionProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [requirements, setRequirements] = useState<ProductRequirement[]>([]);
  const [bids, setBids] = useState<Bid[]>([]);
  const [loading, setLoading] = useState(true);
  const [connectionError, setConnectionError] = useState<string | null>(null);

  // Transform database row to ProductRequirement
  const transformRequirement = (row: Database['public']['Tables']['requirements']['Row']): ProductRequirement => ({
    id: row.id,
    productName: row.product_name,
    hsCode: row.hs_code,
    moq: row.moq,
    description: row.description,
    images: row.images || [],
    createdAt: new Date(row.created_at || new Date().toISOString()),
    createdBy: row.created_by || '',
    status: row.status,
    startTime: new Date(row.start_time),
    endTime: new Date(row.end_time)
  });

  // Transform database row to Bid
  const transformBid = (row: Database['public']['Tables']['bids']['Row']): Bid => ({
    id: row.id,
    requirementId: row.requirement_id,
    supplierId: row.supplier_id,
    supplierName: row.supplier_name,
    amount: Number(row.amount),
    timestamp: new Date(row.created_at || new Date().toISOString())
  });

  // Load requirements from Supabase with error handling
  const loadRequirements = async () => {
    try {
      if (!isSupabaseConfigured()) {
        throw new Error('Supabase is not properly configured');
      }

      const { data, error } = await supabase
        .from('requirements')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading requirements:', error);
        setConnectionError(`Database error: ${error.message}`);
        return;
      }

      if (data) {
        const transformedRequirements = data.map(transformRequirement);
        setRequirements(transformedRequirements);
        setConnectionError(null);
      }
    } catch (error) {
      console.error('Error loading requirements:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      setConnectionError(errorMessage);
      
      // Show user-friendly error notification
      if (typeof window !== 'undefined') {
        const notification = document.createElement('div');
        notification.style.cssText = `
          position: fixed;
          top: 20px;
          right: 20px;
          background: #dc2626;
          color: white;
          padding: 12px 20px;
          border-radius: 8px;
          box-shadow: 0 4px 12px rgba(0,0,0,0.15);
          z-index: 10000;
          font-family: system-ui, -apple-system, sans-serif;
          font-size: 14px;
          max-width: 300px;
        `;
        notification.innerHTML = `
          <div style="display: flex; align-items: center;">
            <span style="margin-right: 8px;">❌</span>
            <div>
              <div style="font-weight: 600;">Connection Error</div>
              <div style="opacity: 0.9; font-size: 12px;">Check your internet connection</div>
            </div>
          </div>
        `;
        document.body.appendChild(notification);
        setTimeout(() => notification.remove(), 5000);
      }
    }
  };

  // Load bids from Supabase with error handling
  const loadBids = async () => {
    try {
      if (!isSupabaseConfigured()) {
        throw new Error('Supabase is not properly configured');
      }

      const { data, error } = await supabase
        .from('bids')
        .select('*')
        .order('amount', { ascending: true });

      if (error) {
        console.error('Error loading bids:', error);
        return;
      }

      if (data) {
        const transformedBids = data.map(transformBid);
        setBids(transformedBids);
      }
    } catch (error) {
      console.error('Error loading bids:', error);
    }
  };

  // Initial data load with retry logic
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      setConnectionError(null);
      
      if (!user) {
        setLoading(false);
        return;
      }

      if (!isSupabaseConfigured()) {
        setConnectionError('Database connection not configured');
        setLoading(false);
        return;
      }

      try {
        await Promise.all([loadRequirements(), loadBids()]);
      } catch (error) {
        console.error('Failed to load initial data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [user]);

  // Set up real-time subscriptions with error handling
  useEffect(() => {
    if (!user || !isSupabaseConfigured()) return;

    let requirementsSubscription: any;
    let bidsSubscription: any;

    try {
      // Subscribe to requirements changes
      requirementsSubscription = supabase
        .channel('requirements-changes')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'requirements'
          },
          () => {
            loadRequirements();
          }
        )
        .subscribe();

      // Subscribe to bids changes
      bidsSubscription = supabase
        .channel('bids-changes')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'bids'
          },
          () => {
            loadBids();
          }
        )
        .subscribe();
    } catch (error) {
      console.error('Failed to set up real-time subscriptions:', error);
    }

    return () => {
      try {
        if (requirementsSubscription) {
          requirementsSubscription.unsubscribe();
        }
        if (bidsSubscription) {
          bidsSubscription.unsubscribe();
        }
      } catch (error) {
        console.error('Error unsubscribing from real-time channels:', error);
      }
    };
  }, [user]);

  // Update requirement statuses periodically
  useEffect(() => {
    const updateStatuses = () => {
      const now = new Date();
      setRequirements(prev => prev.map(req => {
        const status = getRequirementStatus(req);
        return { ...req, status };
      }));
    };

    // Update statuses immediately and then every minute
    updateStatuses();
    const interval = setInterval(updateStatuses, 60000);
    return () => clearInterval(interval);
  }, []);

  const addRequirement = async (requirement: Omit<ProductRequirement, 'id' | 'createdAt'>) => {
    if (!user) {
      console.error('User not authenticated');
      return;
    }

    if (!isSupabaseConfigured()) {
      throw new Error('Database connection not configured');
    }

    try {
      console.log('Adding requirement:', requirement);
      
      const { data, error } = await supabase
        .from('requirements')
        .insert({
          product_name: requirement.productName,
          hs_code: requirement.hsCode,
          moq: requirement.moq,
          description: requirement.description,
          images: requirement.images,
          created_by: user.id,
          start_time: requirement.startTime.toISOString(),
          end_time: requirement.endTime.toISOString(),
          status: requirement.status
        })
        .select()
        .single();

      if (error) {
        console.error('Error adding requirement:', error);
        throw error;
      }

      console.log('Requirement added successfully:', data);
      
      // Send email notification to all shippers
      if (data) {
        const newRequirement = transformRequirement(data);
        EmailService.notifyNewRequirement({
          id: newRequirement.id,
          productName: newRequirement.productName,
          hsCode: newRequirement.hsCode,
          moq: newRequirement.moq,
          description: newRequirement.description,
          startTime: newRequirement.startTime,
          endTime: newRequirement.endTime
        });
      }
      
      // Reload requirements to get the latest data
      await loadRequirements();
    } catch (error) {
      console.error('Error adding requirement:', error);
      throw error;
    }
  };

  const deleteRequirement = async (requirementId: string) => {
    if (!user || !isSupabaseConfigured()) return;

    try {
      const { error } = await supabase
        .from('requirements')
        .delete()
        .eq('id', requirementId)
        .eq('created_by', user.id);

      if (error) {
        console.error('Error deleting requirement:', error);
        throw error;
      }

      // Reload requirements to get the latest data
      await loadRequirements();
    } catch (error) {
      console.error('Error deleting requirement:', error);
      throw error;
    }
  };

  const addBid = async (bid: Omit<Bid, 'id' | 'timestamp'>): Promise<boolean> => {
    if (!user) {
      console.error('User not authenticated');
      return false;
    }

    if (!isSupabaseConfigured()) {
      console.error('Database connection not configured');
      return false;
    }

    try {
      const requirement = requirements.find(req => req.id === bid.requirementId);
      if (!requirement) {
        console.error('Requirement not found');
        return false;
      }

      // Check if auction is open
      const status = getRequirementStatus(requirement);
      if (status !== 'open') {
        console.error('Auction is not open');
        return false;
      }

      const lowestBid = getLowestBid(bid.requirementId);
      
      // Calculate minimum bid reduction (1% of current lowest bid)
      if (lowestBid) {
        const minimumBid = lowestBid.amount * 0.99;
        if (bid.amount >= minimumBid) {
          console.error('Bid amount too high');
          return false;
        }
      }

      console.log('Adding bid:', bid);

      const { data, error } = await supabase
        .from('bids')
        .insert({
          requirement_id: bid.requirementId,
          supplier_id: user.id,
          supplier_name: bid.supplierName,
          amount: bid.amount
        })
        .select()
        .single();

      if (error) {
        console.error('Error adding bid:', error);
        return false;
      }

      console.log('Bid added successfully:', data);
      
      // Send email notification to all shippers and admin
      if (data) {
        const currentLowestBid = lowestBid ? lowestBid.amount : undefined;
        EmailService.notifyNewBid({
          requirementId: requirement.id,
          productName: requirement.productName,
          hsCode: requirement.hsCode,
          moq: requirement.moq,
          description: requirement.description,
          startTime: requirement.startTime,
          endTime: requirement.endTime,
          bidAmount: bid.amount,
          bidderName: bid.supplierName,
          currentLowestBid
        });
      }
      
      // Reload bids to get the latest data
      await loadBids();
      return true;
    } catch (error) {
      console.error('Error adding bid:', error);
      return false;
    }
  };

  const getRequirementBids = (requirementId: string): Bid[] => {
    return bids
      .filter(bid => bid.requirementId === requirementId)
      .sort((a, b) => a.amount - b.amount);
  };

  const getLowestBid = (requirementId: string): Bid | null => {
    const requirementBids = getRequirementBids(requirementId);
    return requirementBids.length > 0 ? requirementBids[0] : null;
  };

  const getRequirementStatus = (requirement: ProductRequirement): 'upcoming' | 'open' | 'closed' => {
    const now = new Date();
    if (now < requirement.startTime) return 'upcoming';
    if (now > requirement.endTime) return 'closed';
    return 'open';
  };

  const getTimeRemaining = (endTime: Date) => {
    const now = new Date();
    const difference = endTime.getTime() - now.getTime();
    
    if (difference <= 0) {
      return { days: 0, hours: 0, minutes: 0, seconds: 0, isExpired: true };
    }

    const days = Math.floor(difference / (1000 * 60 * 60 * 24));
    const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((difference % (1000 * 60)) / 1000);

    return { days, hours, minutes, seconds, isExpired: false };
  };

  const value: AuctionContextType = {
    requirements,
    bids,
    addRequirement,
    deleteRequirement,
    addBid,
    getRequirementBids,
    getLowestBid,
    getRequirementStatus,
    getTimeRemaining
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-amber-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-to-r from-orange-500 to-amber-500 rounded-full animate-pulse mx-auto mb-4"></div>
          <p className="text-gray-600">Loading auction data...</p>
          {connectionError && (
            <p className="text-red-600 text-sm mt-2">Connection issue: {connectionError}</p>
          )}
        </div>
      </div>
    );
  }

  if (connectionError && requirements.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-amber-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-red-600 text-2xl">❌</span>
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Connection Error</h2>
          <p className="text-gray-600 mb-4">{connectionError}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
          >
            Retry Connection
          </button>
        </div>
      </div>
    );
  }

  return (
    <AuctionContext.Provider value={value}>
      {children}
    </AuctionContext.Provider>
  );
};

export const useAuction = (): AuctionContextType => {
  const context = useContext(AuctionContext);
  if (!context) {
    throw new Error('useAuction must be used within an AuctionProvider');
  }
  return context;
};