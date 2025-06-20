import React, { useState } from 'react';
import { Package, TrendingDown, Image as ImageIcon, Clock, Calendar } from 'lucide-react';
import { useAuction } from '../../contexts/AuctionContext';
import BiddingModal from './BiddingModal';
import CountdownTimer from '../common/CountdownTimer';

const SupplierDashboard: React.FC = () => {
  const { requirements, getRequirementBids, getLowestBid, getRequirementStatus } = useAuction();
  const [selectedRequirement, setSelectedRequirement] = useState<string | null>(null);

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

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Shipper Dashboard</h1>
        <p className="text-gray-600 mt-1">Browse available requirements and place competitive bids with Befach International</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
                <div className="relative h-40 bg-gray-100">
                  <img
                    src={requirement.images[0]}
                    alt={requirement.productName}
                    className="w-full h-full object-contain bg-white"
                  />
                  {requirement.images.length > 1 && (
                    <div className="absolute top-3 right-3 bg-black bg-opacity-70 text-white px-2 py-1 rounded-full text-xs flex items-center">
                      <ImageIcon className="w-3 h-3 mr-1" />
                      +{requirement.images.length - 1}
                    </div>
                  )}
                </div>
              )}

              <div className="p-5">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-start min-w-0 flex-1">
                    <div className="w-10 h-10 bg-gradient-to-r from-orange-100 to-amber-100 rounded-xl flex items-center justify-center flex-shrink-0">
                      <Package className="w-5 h-5 text-orange-600" />
                    </div>
                    <div className="ml-3 min-w-0 flex-1">
                      <h3 className="text-lg font-bold text-gray-900 leading-tight mb-1">
                        {requirement.productName}
                      </h3>
                      <p className="text-sm text-gray-500">HS: {requirement.hsCode}</p>
                    </div>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium flex-shrink-0 ml-3 ${getStatusColor(status)}`}>
                    {status}
                  </span>
                </div>

                {/* Auction Timeline */}
                <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center text-gray-600">
                        <Calendar className="w-3 h-3 mr-1" />
                        <span>Starts:</span>
                      </div>
                      <span className="font-medium text-gray-900">
                        {formatDateTime(requirement.startTime)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center text-gray-600">
                        <Clock className="w-3 h-3 mr-1" />
                        <span>Ends:</span>
                      </div>
                      <span className="font-medium text-gray-900">
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

                <div className="space-y-2 mb-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">MOQ:</span>
                    <span className="font-semibold">{requirement.moq.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Total Bids:</span>
                    <span className="font-semibold">{bids.length}</span>
                  </div>
                  {lowestBid ? (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Current Lowest:</span>
                      <span className="font-bold text-orange-600">
                        ${lowestBid.amount.toLocaleString()}
                      </span>
                    </div>
                  ) : (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Current Lowest:</span>
                      <span className="text-gray-500 italic">No bids yet</span>
                    </div>
                  )}
                </div>

                <p className="text-gray-600 text-sm mb-4 line-clamp-2 leading-relaxed">
                  {requirement.description}
                </p>

                <button
                  onClick={() => setSelectedRequirement(requirement.id)}
                  disabled={status === 'upcoming'}
                  className={`w-full inline-flex items-center justify-center px-4 py-2.5 font-medium rounded-lg transition-all text-sm ${
                    status === 'upcoming'
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      : 'bg-gradient-to-r from-orange-500 to-amber-500 text-white hover:from-orange-600 hover:to-amber-600 focus:ring-2 focus:ring-orange-500 focus:ring-offset-2'
                  }`}
                >
                  <TrendingDown className="w-4 h-4 mr-2" />
                  {status === 'upcoming' ? 'Not Started' : 'View & Bid'}
                </button>
              </div>
            </div>
          );
        })}

        {availableRequirements.length === 0 && (
          <div className="col-span-full text-center py-12">
            <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No available requirements</h3>
            <p className="text-gray-600">Check back later for new bidding opportunities from Befach International</p>
          </div>
        )}
      </div>

      {selectedRequirement && (
        <BiddingModal
          requirementId={selectedRequirement}
          onClose={() => setSelectedRequirement(null)}
        />
      )}
    </div>
  );
};

export default SupplierDashboard;