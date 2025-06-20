import React, { useState } from 'react';
import { X, TrendingDown, Clock, User, AlertCircle, Image as ImageIcon, ChevronLeft, ChevronRight } from 'lucide-react';
import { useAuction } from '../../contexts/AuctionContext';
import { useAuth } from '../../contexts/AuthContext';
import CountdownTimer from '../common/CountdownTimer';

interface BiddingModalProps {
  requirementId: string;
  onClose: () => void;
}

const BiddingModal: React.FC<BiddingModalProps> = ({ requirementId, onClose }) => {
  const { requirements, getRequirementBids, getLowestBid, addBid, getRequirementStatus } = useAuction();
  const { user } = useAuth();
  const [bidAmount, setBidAmount] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const requirement = requirements.find(r => r.id === requirementId);
  const bids = getRequirementBids(requirementId);
  const lowestBid = getLowestBid(requirementId);
  const status = requirement ? getRequirementStatus(requirement) : 'closed';

  if (!requirement || !user) return null;

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (status !== 'open') {
      setError('Auction is not currently open for bidding');
      return;
    }

    const amount = parseFloat(bidAmount);
    
    if (isNaN(amount) || amount <= 0) {
      setError('Please enter a valid bid amount');
      return;
    }

    // Calculate minimum bid (1% reduction from current lowest)
    if (lowestBid) {
      const minimumBid = lowestBid.amount * 0.99;
      if (amount >= minimumBid) {
        setError(`Your bid must be at least 1% lower than the current lowest bid. Maximum allowed: $${minimumBid.toFixed(2)}`);
        return;
      }
    }

    const bidSuccess = addBid({
      requirementId,
      supplierId: user.id,
      supplierName: user.name,
      amount
    });

    if (bidSuccess) {
      setSuccess(true);
      setBidAmount('');
      setTimeout(() => setSuccess(false), 3000);
    } else {
      setError('Failed to place bid. Please ensure your bid meets the requirements.');
    }
  };

  // Anonymous bid display - only show count and lowest amount
  const anonymousBids = bids.map((bid, index) => ({
    id: bid.id,
    amount: bid.amount,
    timestamp: bid.timestamp,
    isLowest: index === 0,
    rank: index + 1
  }));

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">{requirement.productName}</h2>
            <p className="text-gray-600 mt-1">HS Code: {requirement.hsCode} | MOQ: {requirement.moq.toLocaleString()}</p>
            {status === 'open' && (
              <div className="mt-2">
                <CountdownTimer endTime={requirement.endTime} className="text-sm" />
              </div>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-6 h-6 text-gray-500" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Product Details */}
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

              <h3 className="text-lg font-semibold text-gray-900 mb-4">Product Details</h3>
              <div className="bg-gray-50 p-4 rounded-xl space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Product Name:</span>
                  <span className="font-medium">{requirement.productName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">HS Code:</span>
                  <span className="font-medium">{requirement.hsCode}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">MOQ:</span>
                  <span className="font-medium">{requirement.moq.toLocaleString()}</span>
                </div>
                {requirement.images && requirement.images.length > 0 && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Images:</span>
                    <span className="font-medium">{requirement.images.length}</span>
                  </div>
                )}
                <div className="pt-2 border-t border-gray-200">
                  <span className="text-gray-600 block mb-2">Description:</span>
                  <p className="text-gray-900">{requirement.description}</p>
                </div>
              </div>

              {/* Place Bid Form */}
              {status === 'open' && (
                <div className="mt-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Place Your Bid</h3>
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Bid Amount (USD)
                      </label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">$</span>
                        <input
                          type="number"
                          step="0.01"
                          value={bidAmount}
                          onChange={(e) => setBidAmount(e.target.value)}
                          className="w-full pl-8 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors"
                          placeholder="Enter your bid amount"
                          required
                        />
                      </div>
                      {lowestBid && (
                        <p className="text-sm text-gray-600 mt-2">
                          Your bid must be at least 1% lower than ${lowestBid.amount.toLocaleString()} (max: ${(lowestBid.amount * 0.99).toFixed(2)})
                        </p>
                      )}
                    </div>

                    {error && (
                      <div className="flex items-center p-4 bg-red-50 border border-red-200 rounded-xl">
                        <AlertCircle className="w-5 h-5 text-red-500 mr-2" />
                        <p className="text-sm text-red-600">{error}</p>
                      </div>
                    )}

                    {success && (
                      <div className="p-4 bg-green-50 border border-green-200 rounded-xl">
                        <p className="text-sm text-green-600">Bid placed successfully!</p>
                      </div>
                    )}

                    <button
                      type="submit"
                      className="w-full bg-gradient-to-r from-orange-500 to-amber-500 text-white py-3 px-4 rounded-xl font-semibold hover:from-orange-600 hover:to-amber-600 focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 transition-all"
                    >
                      <TrendingDown className="w-5 h-5 mr-2 inline" />
                      Place Bid
                    </button>
                  </form>
                </div>
              )}

              {status === 'upcoming' && (
                <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-xl">
                  <p className="text-sm text-blue-600 font-medium">Auction hasn't started yet</p>
                  <p className="text-sm text-blue-600 mt-1">
                    Starts: {new Date(requirement.startTime).toLocaleString()}
                  </p>
                </div>
              )}

              {status === 'closed' && (
                <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-xl">
                  <p className="text-sm text-red-600 font-medium">Auction has ended</p>
                </div>
              )}
            </div>

            {/* Anonymous Bids Display */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Current Bids ({bids.length})</h3>
                {lowestBid && (
                  <div className="text-sm text-gray-600">
                    Lowest: <span className="font-semibold text-green-600">${lowestBid.amount.toLocaleString()}</span>
                  </div>
                )}
              </div>

              <div className="space-y-3 max-h-96 overflow-y-auto">
                {anonymousBids.length === 0 ? (
                  <div className="text-center py-8 bg-gray-50 rounded-xl">
                    <TrendingDown className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <h4 className="text-lg font-medium text-gray-900 mb-2">No bids yet</h4>
                    <p className="text-gray-600">Be the first to place a bid!</p>
                  </div>
                ) : (
                  anonymousBids.map((bid) => (
                    <div
                      key={bid.id}
                      className={`p-4 rounded-xl border-2 transition-all ${
                        bid.isLowest
                          ? 'border-green-200 bg-green-50'
                          : 'border-gray-200 bg-white'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                            bid.isLowest ? 'bg-green-200' : 'bg-gray-200'
                          }`}>
                            <User className={`w-5 h-5 ${bid.isLowest ? 'text-green-700' : 'text-gray-600'}`} />
                          </div>
                          <div className="ml-3">
                            <div className="font-semibold text-gray-900 flex items-center">
                              Supplier #{bid.rank}
                              {bid.isLowest && (
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
                        <div className={`text-xl font-bold ${
                          bid.isLowest ? 'text-green-600' : 'text-gray-900'
                        }`}>
                          ${bid.amount.toLocaleString()}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BiddingModal;