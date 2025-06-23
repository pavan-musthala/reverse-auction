import React, { useState, useEffect } from 'react';
import { X, Package, Upload, Image as ImageIcon, Trash2, Clock, Calendar } from 'lucide-react';
import { useAuction } from '../../contexts/AuctionContext';
import { useAuth } from '../../contexts/AuthContext';

interface AddRequirementModalProps {
  onClose: () => void;
}

const FORM_STORAGE_KEY = 'addRequirementFormData';

const AddRequirementModal: React.FC<AddRequirementModalProps> = ({ onClose }) => {
  const { addRequirement } = useAuction();
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    productName: '',
    hsCode: '',
    moq: '',
    description: '',
    startTime: '',
    endTime: ''
  });
  const [images, setImages] = useState<string[]>([]);
  const [dragActive, setDragActive] = useState(false);

  // Load saved form data from localStorage on component mount
  useEffect(() => {
    const savedData = localStorage.getItem(FORM_STORAGE_KEY);
    if (savedData) {
      try {
        const parsed = JSON.parse(savedData);
        if (parsed.formData) {
          setFormData(parsed.formData);
        }
        if (parsed.images) {
          setImages(parsed.images);
        }
      } catch (error) {
        console.error('Error loading saved form data:', error);
      }
    }

    // Set default times if not loaded from storage
    if (!savedData || !JSON.parse(savedData).formData?.startTime) {
      const now = new Date();
      const startTime = new Date(now.getTime() + 60 * 60 * 1000); // 1 hour from now
      const endTime = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000); // 1 week from now
      
      setFormData(prev => ({
        ...prev,
        startTime: startTime.toISOString().slice(0, 16),
        endTime: endTime.toISOString().slice(0, 16)
      }));
    }
  }, []);

  // Save form data to localStorage whenever it changes
  useEffect(() => {
    const dataToSave = {
      formData,
      images,
      timestamp: Date.now()
    };
    localStorage.setItem(FORM_STORAGE_KEY, JSON.stringify(dataToSave));
  }, [formData, images]);

  // Clear saved data when component unmounts (form is closed)
  useEffect(() => {
    return () => {
      // Only clear if the form was successfully submitted
      // We'll handle this in the handleSubmit function
    };
  }, []);

  const handleFileUpload = (files: FileList | null) => {
    if (!files) return;

    Array.from(files).forEach(file => {
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (e) => {
          const result = e.target?.result as string;
          setImages(prev => [...prev, result]);
        };
        reader.readAsDataURL(file);
      }
    });
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    handleFileUpload(e.dataTransfer.files);
  };

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleFormDataChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const clearSavedData = () => {
    localStorage.removeItem(FORM_STORAGE_KEY);
  };

  const handleClose = () => {
    // Ask user if they want to save their progress
    const hasData = formData.productName || formData.hsCode || formData.moq || 
                   formData.description || images.length > 0;
    
    if (hasData) {
      const shouldSave = window.confirm(
        'You have unsaved changes. Do you want to save your progress for later?\n\n' +
        'Click "OK" to save and continue later, or "Cancel" to discard changes.'
      );
      
      if (!shouldSave) {
        clearSavedData();
      }
    } else {
      clearSavedData();
    }
    
    onClose();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const startTime = new Date(formData.startTime);
    const endTime = new Date(formData.endTime);
    
    if (endTime <= startTime) {
      alert('End time must be after start time');
      return;
    }

    if (startTime <= new Date()) {
      alert('Start time must be in the future');
      return;
    }
    
    addRequirement({
      productName: formData.productName,
      hsCode: formData.hsCode,
      moq: parseInt(formData.moq),
      description: formData.description,
      images: images,
      createdBy: user?.id || '',
      startTime,
      endTime,
      status: 'upcoming'
    });

    // Clear saved data after successful submission
    clearSavedData();
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center">
            <div className="w-10 h-10 bg-gradient-to-r from-orange-500 to-amber-500 rounded-xl flex items-center justify-center">
              <Package className="w-5 h-5 text-white" />
            </div>
            <div className="ml-3">
              <h2 className="text-xl font-semibold text-gray-900">Add Product Requirement</h2>
              <p className="text-sm text-gray-500 mt-1">Your progress is automatically saved</p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Product Name
              </label>
              <input
                type="text"
                value={formData.productName}
                onChange={(e) => handleFormDataChange('productName', e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors"
                placeholder="Enter product name"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                HS Code
              </label>
              <input
                type="text"
                value={formData.hsCode}
                onChange={(e) => handleFormDataChange('hsCode', e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors"
                placeholder="Enter HS code"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              MOQ (Minimum Order Quantity)
            </label>
            <input
              type="number"
              value={formData.moq}
              onChange={(e) => handleFormDataChange('moq', e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors"
              placeholder="Enter minimum order quantity"
              min="1"
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                <Calendar className="w-4 h-4 mr-2 text-orange-600" />
                Auction Start Time
              </label>
              <input
                type="datetime-local"
                value={formData.startTime}
                onChange={(e) => handleFormDataChange('startTime', e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                <Clock className="w-4 h-4 mr-2 text-orange-600" />
                Auction End Time
              </label>
              <input
                type="datetime-local"
                value={formData.endTime}
                onChange={(e) => handleFormDataChange('endTime', e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => handleFormDataChange('description', e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors resize-none"
              placeholder="Enter product description"
              rows={4}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Product Images
            </label>
            
            {/* File Upload Area */}
            <div
              className={`relative border-2 border-dashed rounded-xl p-6 text-center transition-colors ${
                dragActive 
                  ? 'border-orange-500 bg-orange-50' 
                  : 'border-gray-300 hover:border-gray-400'
              }`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
            >
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={(e) => handleFileUpload(e.target.files)}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
              <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 mb-2">
                <span className="font-medium text-orange-600">Click to upload</span> or drag and drop
              </p>
              <p className="text-sm text-gray-500">PNG, JPG, GIF up to 10MB each</p>
            </div>

            {/* Image Preview Grid */}
            {images.length > 0 && (
              <div className="mt-4 grid grid-cols-2 md:grid-cols-3 gap-4">
                {images.map((image, index) => (
                  <div key={index} className="relative group">
                    <img
                      src={image}
                      alt={`Product ${index + 1}`}
                      className="w-full h-24 object-cover rounded-lg border border-gray-200"
                    />
                    <button
                      type="button"
                      onClick={() => removeImage(index)}
                      className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex space-x-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={handleClose}
              className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 font-medium rounded-xl hover:bg-gray-50 focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-3 bg-gradient-to-r from-orange-500 to-amber-500 text-white font-semibold rounded-xl hover:from-orange-600 hover:to-amber-600 focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 transition-all"
            >
              Add Requirement
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddRequirementModal;