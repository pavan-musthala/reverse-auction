import React, { useState } from 'react';
import { X, TrendingDown, Clock, User, Image as ImageIcon, ChevronLeft, ChevronRight } from 'lucide-react';
import { useAuction } from '../../contexts/AuctionContext';

interface RequirementDetailModalProps {
  requirementId: string;
  onClose: () => void;
}

const RequirementDetailModal: React.FC<RequirementDetailModalProps> = ({ 
  requirementId, 
  onClose 
}) => {
  const { requirements, getRequirementBids } = useAuction();
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  
  const requirement = requirements.find(r => r.id === requirementId);
  const bids = getRequirementBids(requirementId);

  if (!requirement) return null;

  const nextImage = () => {
    if (requirement.images && requirement.images.length > 1) {
      setCurrentImageIndex((prev) => (prev + 1) % requirement.images.length);
    }
  };

  const prevImage = () => {
    if (requirement.images && requirement.images.length > 1) {
      setCurrentImageIndex((prev) => (prev - 1 + requirement.images.length) % requirement.images.length);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">{requirement.productName}</h2>
            <p className="text-gray-600 mt-1">HS Code: {requirement.hsCode} | MOQ: {requirement.moq.toLocaleString()}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-6 h-6 text-gray-500" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Product Details and Images */}
            <div>
              {/* Product Images */}
              {requirement.images && requirement.images.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    <ImageIcon className="w-5 h-5 mr-2 text-orange-600" />
                    Product Images ({requirement.images.length})
                  </h3>
                  <div className="relative">
                    <div className="aspect-video bg-gray-100 rounded-xl overflow-hidden">
                      <img
                        src={requirement.images[currentImageIndex]}
                        alt={`${requirement.productName} - Image ${currentImageIndex + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    
                    {requirement.images.length > 1 && (
                      <>
                        <button
                          onClick={prevImage}
                          className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white p-2 rounded-full hover:bg-opacity-70 transition-all"
                        >
                          <ChevronLeft className="w-5 h-5" />
                        </button>
                        <button
                          onClick={nextImage}
                          className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white p-2 rounded-full hover:bg-opacity-70 transition-all"
                        >
                          <ChevronRight className="w-5 h-5" />
                        </button>
                        
                        {/* Image indicators */}
                        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2">
                          {requirement.images.map((_, index) => (
                            <button
                              key={index}
                              onClick={() => setCurrentImageIndex(index)}
                              className={`w-2 h-2 rounded-full transition-all ${
                                index === currentImageIndex ? 'bg-white' : 'bg-white bg-opacity-50'
                              }`}
                            />
                          ))}
                        </div>
                      </>
                    )}
                  </div>
                  
                  {/* Thumbnail strip */}
                  {requirement.images.length > 1 && (
                    <div className="flex space-x-2 mt-4 overflow-x-auto pb-2">
                      {requirement.images.map((image, index) => (
                        <button
                          key={index}
                          onClick={() => setCurrentImageIndex(index)}
                          className={`flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-all ${
                            index === currentImageIndex ? 'border-orange-500' : 'border-gray-200'
                          }`}
                        >
                          <img
                            src={image}
                            alt={`Thumbnail ${index + 1}`}
                            className="w-full h-full object-cover"
                          />
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Product Description */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Product Description</h3>
                <p className="text-gray-600 bg-gray-50 p-4 rounded-xl leading-relaxed">{requirement.description}</p>
              </div>
            </div>

            {/* Bids Section */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                  <TrendingDown className="w-5 h-5 mr-2 text-orange-600" />
                  Bids ({bids.length})
                </h3>
                {bids.length > 0 && (
                  <div className="text-sm text-gray-600">
                    Lowest: <span className="font-semibold text-green-600">${bids[0].amount.toLocaleString()}</span>
                  </div>
                )}
              </div>

              {bids.length === 0 ? (
                <div className="text-center py-12 bg-gray-50 rounded-xl">
                  <TrendingDown className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h4 className="text-lg font-medium text-gray-900 mb-2">No bids yet</h4>
                  <p className="text-gray-600">Suppliers haven't started bidding on this requirement</p>
                </div>
              ) : (
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {bids.map((bid, index) => (
                    <div
                      key={bid.id}
                      className={`p-4 rounded-xl border-2 transition-all ${
                        index === 0
                          ? 'border-green-200 bg-green-50'
                          : 'border-gray-200 bg-white'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                            index === 0 ? 'bg-green-200' : 'bg-gray-200'
                          }`}>
                            <User className={`w-5 h-5 ${index === 0 ? 'text-green-700' : 'text-gray-600'}`} />
                          </div>
                          <div className="ml-3">
                            <div className="font-semibold text-gray-900 flex items-center">
                              {bid.supplierName}
                              {index === 0 && (
                                <span className="ml-2 px-2 py-1 bg-green-200 text-green-800 text-xs font-medium rounded-full">
                                  Lowest
                                </span>
                              )}
                            </div>
                            <div className="flex items-center text-sm text-gray-600">
                              <Clock className="w-4 h-4 mr-1" />
                              {new Date(bid.timestamp).toLocaleString()}
                            </div>
                          </div>
                        </div>
                        <div className={`text-2xl font-bold ${
                          index === 0 ? 'text-green-600' : 'text-gray-900'
                        }`}>
                          ${bid.amount.toLocaleString()}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RequirementDetailModal;