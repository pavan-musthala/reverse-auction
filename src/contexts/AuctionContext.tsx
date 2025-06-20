import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { ProductRequirement, Bid, AuctionContextType } from '../types';

const AuctionContext = createContext<AuctionContextType | undefined>(undefined);

export const AuctionProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [requirements, setRequirements] = useState<ProductRequirement[]>([]);
  const [bids, setBids] = useState<Bid[]>([]);

  useEffect(() => {
    // Load data from localStorage on mount
    const storedRequirements = localStorage.getItem('befachRequirements');
    const storedBids = localStorage.getItem('befachBids');
    
    if (storedRequirements) {
      const parsed = JSON.parse(storedRequirements);
      // Convert date strings back to Date objects
      const requirementsWithDates = parsed.map((req: any) => ({
        ...req,
        createdAt: new Date(req.createdAt),
        startTime: new Date(req.startTime),
        endTime: new Date(req.endTime)
      }));
      setRequirements(requirementsWithDates);
    }
    if (storedBids) {
      const parsed = JSON.parse(storedBids);
      // Convert date strings back to Date objects
      const bidsWithDates = parsed.map((bid: any) => ({
        ...bid,
        timestamp: new Date(bid.timestamp)
      }));
      setBids(bidsWithDates);
    }
  }, []);

  useEffect(() => {
    // Save requirements to localStorage whenever they change
    localStorage.setItem('befachRequirements', JSON.stringify(requirements));
  }, [requirements]);

  useEffect(() => {
    // Save bids to localStorage whenever they change
    localStorage.setItem('befachBids', JSON.stringify(bids));
  }, [bids]);

  useEffect(() => {
    // Update requirement statuses based on current time
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

  const addRequirement = (requirement: Omit<ProductRequirement, 'id' | 'createdAt'>) => {
    const newRequirement: ProductRequirement = {
      ...requirement,
      id: Date.now().toString(),
      createdAt: new Date(),
      status: getRequirementStatus({
        ...requirement,
        id: '',
        createdAt: new Date()
      } as ProductRequirement)
    };
    setRequirements(prev => [...prev, newRequirement]);
  };

  const deleteRequirement = (requirementId: string) => {
    setRequirements(prev => prev.filter(req => req.id !== requirementId));
    // Also remove all bids for this requirement
    setBids(prev => prev.filter(bid => bid.requirementId !== requirementId));
  };

  const addBid = (bid: Omit<Bid, 'id' | 'timestamp'>): boolean => {
    const requirement = requirements.find(req => req.id === bid.requirementId);
    if (!requirement) return false;

    // Check if auction is open
    const status = getRequirementStatus(requirement);
    if (status !== 'open') return false;

    const lowestBid = getLowestBid(bid.requirementId);
    
    // Calculate minimum bid reduction (1% of current lowest bid)
    let minimumBid = 0;
    if (lowestBid) {
      minimumBid = lowestBid.amount * 0.99; // Must be at least 1% lower
      if (bid.amount >= minimumBid) {
        return false;
      }
    }

    const newBid: Bid = {
      ...bid,
      id: Date.now().toString(),
      timestamp: new Date()
    };

    setBids(prev => [...prev, newBid]);
    return true;
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