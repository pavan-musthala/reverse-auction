import React, { useState, useEffect } from 'react';
import { Package, TrendingDown, Image as ImageIcon, Clock, Calendar } from 'lucide-react';
import { useAuction } from '../../contexts/AuctionContext';
import BiddingModal from './BiddingModal';
import CountdownTimer from '../common/CountdownTimer';

const SUPPLIER_MODAL_STATE_KEY = 'supplierDashboardModalState';

interface SupplierModalState {
  selectedRequirement: string | null;
  timestamp: number;
}

const SupplierDashboard: React.FC = () => {
  const { requirements, getRequirementBids, getLowestBid, getRequirementStatus } = useAuction();
  const [selectedRequirement, setSelectedRequirement] = useState<string | null>(null);
  const [isStateLoaded, setIsStateLoaded] = useState(false);

  // Load modal state from localStorage on component mount
  useEffect(() => {
    const loadModalState = () => {
      try {
        const savedState = localStorage.getItem(SUPPLIER_MODAL_STATE_KEY);
        if (savedState) {
          const parsed: SupplierModalState = JSON.parse(savedState);
          
          // Check if saved state is not too old (1 hour)
          const isStateFresh = Date.now() - parsed.timestamp < 60 * 60 * 1000;
          
          if (isStateFresh && parsed.selectedRequirement) {
            // Verify the requirement still exists and is available
            const requirement = requirements.find(r => r.id === parsed.selectedRequirement);
            if (requirement) {
              const status = getRequirementStatus(requirement);
              if (status === 'open' || status === 'upcoming') {
                setSelectedRequirement(parsed.selectedRequirement);
                console.log('Restored supplier modal state from localStorage');
              }
            }
          } else {
            // Clear old state
            localStorage.removeItem(SUPPLIER_MODAL_STATE_KEY);
          }
        }
      } catch (error) {
        console.error('Error loading supplier modal state:', error);
        localStorage.removeItem(SUPPLIER_MODAL_STATE_KEY);
      } finally {
        setIsStateLoaded(true);
      }
    };

    // Only load state after requirements are loaded
    if (requirements.length > 0) {
      loadModalState();
    } else {
      setIsStateLoaded(true);
    }
  }, [requirements, getRequirementStatus]);

  // Save modal state to localStorage whenever it changes
  useEffect(() => {
    if (!isStateLoaded) return; // Don't save during initial load

    const saveModalState = () => {
      try {
        if (selectedRequirement) {
          const stateToSave: SupplierModalState = {
            selectedRequirement,
            timestamp: Date.now()
          };
          localStorage.setItem(SUPPLIER_MODAL_STATE_KEY, JSON.stringify(stateToSave));
          console.log('Supplier modal state saved to localStorage');
        } else {
          // Clear state if no modal is open
          localStorage.removeItem(SUPPLIER_MODAL_STATE_KEY);
        }
      } catch (error) {
        console.error('Error saving supplier modal state:', error);
      }
    };

    // Debounce the save operation
    const timeoutId = setTimeout(saveModalState, 100);
    return () => clearTimeout(timeoutId);
  }, [selectedRequirement, isStateLoaded]);

  // Handle visibility change to maintain modal state
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden && isStateLoaded) {
        // When tab becomes visible again, ensure modal state is preserved
        console.log('Tab became visible, supplier modal state preserved');
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [isStateLoaded]);

  // Handle page focus to restore modal state if needed
  useEffect(() => {
    const handleFocus = () => {
      if (isStateLoaded) {
        try {
          const savedState = localStorage.getItem(SUPPLIER_MODAL_STATE_KEY);
          if (savedState) {
            const parsed: SupplierModalState = JSON.parse(savedState);
            const isStateFresh = Date.now() - parsed.timestamp < 60 * 60 * 1000;
            
            if (isStateFresh && parsed.selectedRequirement !== selectedRequirement) {
              // Verify the requirement still exists and is available
              const requirement = requirements.find(r => r.id === parsed.selectedRequirement);
              if (requirement) {
                const status = getRequirementStatus(requirement);
                if (status === 'open' || status === 'upcoming') {
                  setSelectedRequirement(parsed.selectedRequirement);
                }
              }
            }
          }
        } catch (error) {
          console.error('Error restoring supplier modal state on focus:', error);
        }
      }
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [selectedRequirement, isStateLoaded, requirements, getRequirementStatus]);

  const handleShowBiddingModal = (requirementId: string) => {
    setSelectedRequirement(requirementId);
  };

  const handleCloseBiddingModal = () => {
    setSelectedRequirement(null);
    // Clear modal state from localStorage when explicitly closed
    localStorage.removeItem(SUPPLIER_MODAL_STATE_KEY);
  };

  const availableRequirements = requirements.filter(req => {
    const status = getRequirementStatus(req);
    return status === 'open' || status === 'upcoming';
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'upcoming':
        return 'bg-blue-100 text-blue-700';
      case 'open':
        return 'bg-green-100 text-green-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const formatDateTime = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    }).format(date);
  };

  const getTimeUntilStart = (startTime: Date) => {
    const now = new Date();
    const diffMs = startTime.getTime() - now.getTime();
    const diffMinutes = Math.ceil(diffMs / (1000 * 60));
    const diffHours = Math.ceil(diffMs / (1000 * 60 * 60));
    
    if (diffMinutes <= 0) return 'Starting now';
    if (diffMinutes < 60) return `${diffMinutes}min`;
    if (diffHours < 24) {
      const hours = Math.floor(diffMinutes / 60);
      const minutes = diffMinutes % 60;
      return minutes > 0 ? `${hours}h ${minutes}min` : `${hours}h`;
    }
    const days = Math.floor(diffHours / 24);
    const remainingHours = diffHours % 24;
    return remainingHours > 0 ? `${days}d ${remainingHours}h` : `${days}d`;
  };

  // Don't render until state is loaded to prevent flash
  if (!isStateLoaded) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <div className="flex items-center justify-center py-12">
          <div className="w-8 h-8 bg-gradient-to-r from-orange-500 to-amber-500 rounded-full animate-pulse"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
      <div className="mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Shipper Dashboard</h1>
        <p className="text-gray-600 mt-1 text-sm sm:text-base">Browse available requirements and place competitive bids with Befach International</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        {availableRequirements.map((requirement) => {
          const bids = getRequirementBids(requirement.id);
          const lowestBid = getLowestBid(requirement.id);
          const status = getRequirementStatus(requirement);
          
          return (
            <div
              key={requirement.id}
              className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-100"
            >
              {/* Product Image */}
              {requirement.images && requirement.images.length > 0 && (
                <div className="relative h-32 sm:h-40 bg-gray-100">
                  <img
                    src={requirement.images[0]}
                    alt={requirement.productName}
                    className="w-full h-full object-contain bg-white"
                  />
                  {requirement.images.length > 1 && (
                    <div className="absolute top-2 sm:top-3 right-2 sm:right-3 bg-black bg-opacity-70 text-white px-2 py-1 rounded-full text-xs flex items-center">
                      <ImageIcon className="w-3 h-3 mr-1" />
                      +{requirement.images.length - 1}
                    </div>
                  )}
                </div>
              )}

              <div className="p-4 sm:p-5">
                <div className="flex items-start justify-between mb-3 sm:mb-4">
                  <div className="flex items-start min-w-0 flex-1">
                    <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-r from-orange-100 to-amber-100 rounded-xl flex items-center justify-center flex-shrink-0">
                      <Package className="w-4 h-4 sm:w-5 sm:h-5 text-orange-600" />
                    </div>
                    <div className="ml-2 sm:ml-3 min-w-0 flex-1">
                      <h3 className="text-base sm:text-lg font-bold text-gray-900 leading-tight mb-1">
                        {requirement.productName}
                      </h3>
                      <p className="text-xs sm:text-sm text-gray-500">HS: {requirement.hsCode}</p>
                    </div>
                  </div>
                  <span className={`px-2 sm:px-3 py-1 rounded-full text-xs font-medium flex-shrink-0 ml-2 sm:ml-3 ${getStatusColor(status)}`}>
                    {status}
                  </span>
                </div>

                {/* Auction Timeline */}
                <div className="mb-3 sm:mb-4 p-2 sm:p-3 bg-gray-50 rounded-lg">
                  <div className="space-y-1 sm:space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center text-gray-600">
                        <Calendar className="w-3 h-3 mr-1" />
                        <span>Starts:</span>
                      </div>
                      <span className="font-medium text-gray-900 text-right">
                        {formatDateTime(requirement.startTime)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center text-gray-600">
                        <Clock className="w-3 h-3 mr-1" />
                        <span>Ends:</span>
                      </div>
                      <span className="font-medium text-gray-900 text-right">
                        {formatDateTime(requirement.endTime)}
                      </span>
                    </div>
                  </div>
                  
                  {/* Live Timer */}
                  {status === 'open' && (
                    <div className="mt-2 pt-2 border-t border-gray-200">
                      <p className="text-xs font-medium text-green-700 mb-1">Time Remaining:</p>
                      <CountdownTimer endTime={requirement.endTime} className="text-xs" />
                    </div>
                  )}
                  
                  {status === 'upcoming' && (
                    <div className="mt-2 pt-2 border-t border-gray-200">
                      <p className="text-xs font-medium text-blue-700">
                        Starts in: {getTimeUntilStart(requirement.startTime)}
                      </p>
                    </div>
                  )}
                </div>

                <div className="space-y-1 sm:space-y-2 mb-3 sm:mb-4">
                  <div className="flex justify-between text-xs sm:text-sm">
                    <span className="text-gray-600">MOQ:</span>
                    <span className="font-semibold">{requirement.moq.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-xs sm:text-sm">
                    <span className="text-gray-600">Total Bids:</span>
                    <span className="font-semibold">{bids.length}</span>
                  </div>
                  {lowestBid ? (
                    <div className="flex justify-between text-xs sm:text-sm">
                      <span className="text-gray-600">Current Lowest:</span>
                      <span className="font-bold text-orange-600">
                        ${lowestBid.amount.toLocaleString()}
                      </span>
                    </div>
                  ) : (
                    <div className="flex justify-between text-xs sm:text-sm">
                      <span className="text-gray-600">Current Lowest:</span>
                      <span className="text-gray-500 italic">No bids yet</span>
                    </div>
                  )}
                </div>

                <p className="text-gray-600 text-xs sm:text-sm mb-3 sm:mb-4 line-clamp-2 leading-relaxed">
                  {requirement.description}
                </p>

                <button
                  onClick={() => handleShowBiddingModal(requirement.id)}
                  disabled={status === 'upcoming'}
                  className={`w-full inline-flex items-center justify-center px-3 sm:px-4 py-2 sm:py-2.5 font-medium rounded-lg transition-all text-xs sm:text-sm ${
                    status === 'upcoming'
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      : 'bg-gradient-to-r from-orange-500 to-amber-500 text-white hover:from-orange-600 hover:to-amber-600 focus:ring-2 focus:ring-orange-500 focus:ring-offset-2'
                  }`}
                >
                  <TrendingDown className="w-3 h-3 sm:w-4 sm:h-4 mr-2" />
                  {status === 'upcoming' ? 'Not Started' : 'View & Bid'}
                </button>
              </div>
            </div>
          );
        })}

        {availableRequirements.length === 0 && (
          <div className="col-span-full text-center py-8 sm:py-12">
            <Package className="w-12 h-12 sm:w-16 sm:h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-2">No available requirements</h3>
            <p className="text-gray-600 text-sm sm:text-base px-4">Check back later for new bidding opportunities from Befach International</p>
          </div>
        )}
      </div>

      {selectedRequirement && (
        <BiddingModal
          requirementId={selectedRequirement}
          onClose={handleCloseBiddingModal}
        />
      )}
    </div>
  );
};

export default SupplierDashboard;