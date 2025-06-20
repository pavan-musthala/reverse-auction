import React, { useState } from 'react';
import { Package, TrendingDown, Image as ImageIcon } from 'lucide-react';
import { useAuction } from '../../contexts/AuctionContext';
import BiddingModal from './BiddingModal';

const SupplierDashboard: React.FC = () => {
  const { requirements, getRequirementBids, getLowestBid } = useAuction();
  const [selectedRequirement, setSelectedRequirement] = useState<string | null>(null);

  const openRequirements = requirements.filter(req => req.status === 'open');

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Supplier Dashboard</h1>
        <p className="text-gray-600 mt-1">Browse open requirements and place competitive bids with Befach International</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {openRequirements.map((requirement) => {
          const bids = getRequirementBids(requirement.id);
          const lowestBid = getLowestBid(requirement.id);
          
          return (
            <div
              key={requirement.id}
              className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-100"
            >
              {/* Product Image */}
              {requirement.images && requirement.images.length > 0 && (
                <div className="relative h-48 bg-gray-100">
                  <img
                    src={requirement.images[0]}
                    alt={requirement.productName}
                    className="w-full h-full object-cover"
                  />
                  {requirement.images.length > 1 && (
                    <div className="absolute top-3 right-3 bg-black bg-opacity-70 text-white px-2 py-1 rounded-full text-xs flex items-center">
                      <ImageIcon className="w-3 h-3 mr-1" />
                      +{requirement.images.length - 1}
                    </div>
                  )}
                </div>
              )}

              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center">
                    <div className="w-12 h-12 bg-gradient-to-r from-orange-100 to-amber-100 rounded-xl flex items-center justify-center">
                      <Package className="w-6 h-6 text-orange-600" />
                    </div>
                    <div className="ml-3">
                      <h3 className="text-lg font-semibold text-gray-900 line-clamp-1">
                        {requirement.productName}
                      </h3>
                      <p className="text-sm text-gray-500">HS: {requirement.hsCode}</p>
                    </div>
                  </div>
                  <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                    Open
                  </span>
                </div>

                <div className="space-y-3 mb-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">MOQ:</span>
                    <span className="font-medium">{requirement.moq.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Total Bids:</span>
                    <span className="font-medium">{bids.length}</span>
                  </div>
                  {lowestBid ? (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Current Lowest:</span>
                      <span className="font-semibold text-orange-600">
                        ${lowestBid.amount.toLocaleString()}
                      </span>
                    </div>
                  ) : (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Current Lowest:</span>
                      <span className="text-gray-500 italic">No bids yet</span>
                    </div>
                  )}
                  {requirement.images && requirement.images.length > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Images:</span>
                      <span className="font-medium">{requirement.images.length}</span>
                    </div>
                  )}
                </div>

                <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                  {requirement.description}
                </p>

                <button
                  onClick={() => setSelectedRequirement(requirement.id)}
                  className="w-full inline-flex items-center justify-center px-4 py-2 bg-gradient-to-r from-orange-500 to-amber-500 text-white font-medium rounded-xl hover:from-orange-600 hover:to-amber-600 focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 transition-all"
                >
                  <TrendingDown className="w-4 h-4 mr-2" />
                  View & Place Bid
                </button>
              </div>
            </div>
          );
        })}

        {openRequirements.length === 0 && (
          <div className="col-span-full text-center py-12">
            <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No open requirements</h3>
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