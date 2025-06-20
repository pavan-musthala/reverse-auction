import React, { useState } from 'react';
import { Plus, Package, Eye, Image as ImageIcon, Clock, Calendar } from 'lucide-react';
import { useAuction } from '../../contexts/AuctionContext';
import AddRequirementModal from './AddRequirementModal';
import RequirementDetailModal from './RequirementDetailModal';
import CountdownTimer from '../common/CountdownTimer';

const AdminDashboard: React.FC = () => {
  const { requirements, getRequirementBids, getLowestBid, getRequirementStatus } = useAuction();
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedRequirement, setSelectedRequirement] = useState<string | null>(null);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'upcoming':
        return 'bg-blue-100 text-blue-700';
      case 'open':
        return 'bg-green-100 text-green-700';
      case 'closed':
        return 'bg-red-100 text-red-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="text-gray-600 mt-1">Manage product requirements and monitor bids for Befach International</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-orange-500 to-amber-500 text-white font-semibold rounded-xl hover:from-orange-600 hover:to-amber-600 focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 transition-all shadow-lg"
        >
          <Plus className="w-5 h-5 mr-2" />
          Add Requirement
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {requirements.map((requirement) => {
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

              <div className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center min-w-0 flex-1">
                    <div className="w-10 h-10 bg-gradient-to-r from-orange-100 to-amber-100 rounded-xl flex items-center justify-center flex-shrink-0">
                      <Package className="w-5 h-5 text-orange-600" />
                    </div>
                    <div className="ml-3 min-w-0 flex-1">
                      <h3 className="text-base font-semibold text-gray-900 truncate">
                        {requirement.productName}
                      </h3>
                      <p className="text-xs text-gray-500">HS: {requirement.hsCode}</p>
                    </div>
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium flex-shrink-0 ml-2 ${getStatusColor(status)}`}>
                    {status}
                  </span>
                </div>

                {/* Compact Timer Section */}
                <div className="mb-3 p-2 bg-gray-50 rounded-lg">
                  {status === 'upcoming' && (
                    <div className="text-xs text-gray-600">
                      <div className="flex items-center mb-1">
                        <Calendar className="w-3 h-3 mr-1" />
                        Starts: {new Date(requirement.startTime).toLocaleDateString()}
                      </div>
                    </div>
                  )}
                  {status === 'open' && (
                    <div>
                      <p className="text-xs font-medium text-green-700 mb-1">Live Auction</p>
                      <CountdownTimer endTime={requirement.endTime} className="text-xs" />
                    </div>
                  )}
                  {status === 'closed' && (
                    <div className="text-xs text-red-600 font-medium">
                      Auction Ended
                    </div>
                  )}
                </div>

                <div className="space-y-2 mb-3">
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-600">MOQ:</span>
                    <span className="font-medium">{requirement.moq.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-600">Total Bids:</span>
                    <span className="font-medium">{bids.length}</span>
                  </div>
                  {lowestBid && (
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-600">Lowest Bid:</span>
                      <span className="font-semibold text-green-600">
                        ${lowestBid.amount.toLocaleString()}
                      </span>
                    </div>
                  )}
                </div>

                <p className="text-gray-600 text-xs mb-3 line-clamp-2">
                  {requirement.description}
                </p>

                <button
                  onClick={() => setSelectedRequirement(requirement.id)}
                  className="w-full inline-flex items-center justify-center px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-lg transition-colors text-sm"
                >
                  <Eye className="w-4 h-4 mr-1" />
                  View Details
                </button>
              </div>
            </div>
          );
        })}

        {requirements.length === 0 && (
          <div className="col-span-full text-center py-12">
            <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No requirements yet</h3>
            <p className="text-gray-600 mb-4">Start by adding your first product requirement to begin the reverse auction process</p>
            <button
              onClick={() => setShowAddModal(true)}
              className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-orange-500 to-amber-500 text-white font-semibold rounded-xl hover:from-orange-600 hover:to-amber-600 focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 transition-all"
            >
              <Plus className="w-5 h-5 mr-2" />
              Add First Requirement
            </button>
          </div>
        )}
      </div>

      {showAddModal && (
        <AddRequirementModal
          onClose={() => setShowAddModal(false)}
        />
      )}

      {selectedRequirement && (
        <RequirementDetailModal
          requirementId={selectedRequirement}
          onClose={() => setSelectedRequirement(null)}
        />
      )}
    </div>
  );
};

export default AdminDashboard;