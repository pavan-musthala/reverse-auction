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
      setRequirements(JSON.parse(storedRequirements));
    }
    if (storedBids) {
      setBids(JSON.parse(storedBids));
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

  const addRequirement = (requirement: Omit<ProductRequirement, 'id' | 'createdAt'>) => {
    const newRequirement: ProductRequirement = {
      ...requirement,
      id: Date.now().toString(),
      createdAt: new Date(),
      status: 'open'
    };
    setRequirements(prev => [...prev, newRequirement]);
  };

  const addBid = (bid: Omit<Bid, 'id' | 'timestamp'>): boolean => {
    const lowestBid = getLowestBid(bid.requirementId);
    
    // Validate that new bid is lower than current lowest
    if (lowestBid && bid.amount >= lowestBid.amount) {
      return false;
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

  const value: AuctionContextType = {
    requirements,
    bids,
    addRequirement,
    addBid,
    getRequirementBids,
    getLowestBid
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