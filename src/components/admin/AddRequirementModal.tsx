import React, { useState, useEffect, useCallback } from 'react';
import { X, Package, Upload, Image as ImageIcon, Trash2, Clock, Calendar, Save } from 'lucide-react';
import { useAuction } from '../../contexts/AuctionContext';
import { useAuth } from '../../contexts/AuthContext';

interface AddRequirementModalProps {
  onClose: () => void;
}

const FORM_STORAGE_KEY = 'addRequirementFormData';

interface FormData {
  productName: string;
  hsCode: string;
  moq: string;
  description: string;
  startTime: string;
  endTime: string;
}

interface SavedFormData {
  formData: FormData;
  images: string[];
  timestamp: number;
}

const AddRequirementModal: React.FC<AddRequirementModalProps> = ({ onClose }) => {
  const { addRequirement } = useAuction();
  const { user } = useAuth();
  const [formData, setFormData] = useState<FormData>({
    productName: '',
    hsCode: '',
    moq: '',
    description: '',
    startTime: '',
    endTime: ''
  });
  const [images, setImages] = useState<string[]>([]);
  const [dragActive, setDragActive] = useState(false);
  const [isDataLoaded, setIsDataLoaded] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Function to get default times
  const getDefaultTimes = useCallback(() => {
    const now = new Date();
    const startTime = new Date(now.getTime() + 60 * 60 * 1000); // 1 hour from now
    const endTime = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000); // 1 week from now
    
    return {
      startTime: startTime.toISOString().slice(0, 16),
      endTime: endTime.toISOString().slice(0, 16)
    };
  }, []);

  // Load saved form data from localStorage on component mount
  useEffect(() => {
    const loadSavedData = () => {
      try {
        const savedData = localStorage.getItem(FORM_STORAGE_KEY);
        if (savedData) {
          const parsed: SavedFormData = JSON.parse(savedData);
          
          // Check if saved data is not too old (24 hours)
          const isDataFresh = Date.now() - parsed.timestamp < 24 * 60 * 60 * 1000;
          
          if (isDataFresh && parsed.formData) {
            setFormData(parsed.formData);
            if (parsed.images) {
              setImages(parsed.images);
            }
            setLastSaved(new Date(parsed.timestamp));
            console.log('Loaded saved form data from localStorage');
          } else {
            // Clear old data
            localStorage.removeItem(FORM_STORAGE_KEY);
            const defaultTimes = getDefaultTimes();
            setFormData(prev => ({
              ...prev,
              startTime: defaultTimes.startTime,
              endTime: defaultTimes.endTime
            }));
          }
        } else {
          // Set default times for new form
          const defaultTimes = getDefaultTimes();
          setFormData(prev => ({
            ...prev,
            startTime: defaultTimes.startTime,
            endTime: defaultTimes.endTime
          }));
        }
      } catch (error) {
        console.error('Error loading saved form data:', error);
        localStorage.removeItem(FORM_STORAGE_KEY);
        const defaultTimes = getDefaultTimes();
        setFormData(prev => ({
          ...prev,
          startTime: defaultTimes.startTime,
          endTime: defaultTimes.endTime
        }));
      } finally {
        setIsDataLoaded(true);
      }
    };

    loadSavedData();
  }, [getDefaultTimes]);

  // Save form data to localStorage whenever it changes (debounced)
  useEffect(() => {
    if (!isDataLoaded) return; // Don't save during initial load

    const saveData = () => {
      try {
        const dataToSave: SavedFormData = {
          formData,
          images,
          timestamp: Date.now()
        };
        localStorage.setItem(FORM_STORAGE_KEY, JSON.stringify(dataToSave));
        setLastSaved(new Date());
        console.log('Form data auto-saved to localStorage');
      } catch (error) {
        console.error('Error saving form data:', error);
      }
    };

    // Debounce the save operation
    const timeoutId = setTimeout(saveData, 1000);
    return () => clearTimeout(timeoutId);
  }, [formData, images, isDataLoaded]);

  // Handle visibility change to save data when tab becomes hidden
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden && isDataLoaded) {
        try {
          const dataToSave: SavedFormData = {
            formData,
            images,
            timestamp: Date.now()
          };
          localStorage.setItem(FORM_STORAGE_KEY, JSON.stringify(dataToSave));
          setLastSaved(new Date());
          console.log('Form data saved due to tab visibility change');
        } catch (error) {
          console.error('Error saving form data on visibility change:', error);
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [formData, images, isDataLoaded]);

  // Handle beforeunload to save data when page is about to be closed/refreshed
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isDataLoaded && hasFormData()) {
        try {
          const dataToSave: SavedFormData = {
            formData,
            images,
            timestamp: Date.now()
          };
          localStorage.setItem(FORM_STORAGE_KEY, JSON.stringify(dataToSave));
          console.log('Form data saved due to page unload');
          
          // Show browser confirmation dialog
          e.preventDefault();
          e.returnValue = 'You have unsaved changes. Are you sure you want to leave?';
          return e.returnValue;
        } catch (error) {
          console.error('Error saving form data on page unload:', error);
        }
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [formData, images, isDataLoaded]);

  // Prevent modal from closing when clicking outside if there's unsaved data
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && hasFormData() && !isSubmitting) {
        e.preventDefault();
        handleClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [formData, images, isSubmitting]);

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

  const handleFormDataChange = (field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const clearSavedData = () => {
    try {
      localStorage.removeItem(FORM_STORAGE_KEY);
      console.log('Saved form data cleared');
    } catch (error) {
      console.error('Error clearing saved data:', error);
    }
  };

  const manualSave = () => {
    try {
      const dataToSave: SavedFormData = {
        formData,
        images,
        timestamp: Date.now()
      };
      localStorage.setItem(FORM_STORAGE_KEY, JSON.stringify(dataToSave));
      setLastSaved(new Date());
      console.log('Manual save completed');
    } catch (error) {
      console.error('Error during manual save:', error);
    }
  };

  const hasFormData = () => {
    return formData.productName.trim() || 
           formData.hsCode.trim() || 
           formData.moq.trim() || 
           formData.description.trim() || 
           images.length > 0;
  };

  const handleClose = () => {
    if (isSubmitting) {
      return; // Prevent closing during submission
    }

    if (hasFormData()) {
      const shouldSave = window.confirm(
        'You have unsaved changes. Do you want to save your progress for later?\n\n' +
        'Click "OK" to save and continue later, or "Cancel" to discard changes.'
      );
      
      if (!shouldSave) {
        clearSavedData();
      } else {
        manualSave();
      }
    } else {
      clearSavedData();
    }
    
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isSubmitting) return;
    
    setIsSubmitting(true);
    
    try {
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
      
      await addRequirement({
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
    } catch (error) {
      console.error('Error submitting form:', error);
      alert('Error submitting form. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle backdrop click
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget && !isSubmitting) {
      handleClose();
    }
  };

  // Don't render until data is loaded
  if (!isDataLoaded) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-2xl shadow-2xl p-8">
          <div className="text-center">
            <div className="w-8 h-8 bg-gradient-to-r from-orange-500 to-amber-500 rounded-full animate-pulse mx-auto mb-4"></div>
            <p className="text-gray-600">Loading form...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
      onClick={handleBackdropClick}
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden">
        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-200">
          <div className="flex items-center min-w-0 flex-1">
            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-r from-orange-500 to-amber-500 rounded-xl flex items-center justify-center flex-shrink-0">
              <Package className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
            </div>
            <h2 className="ml-2 sm:ml-3 text-lg sm:text-xl font-semibold text-gray-900 truncate">Add Product Requirement</h2>
          </div>
          <div className="flex items-center space-x-2 flex-shrink-0">
            <button
              onClick={manualSave}
              className="p-1.5 sm:p-2 hover:bg-gray-100 rounded-lg transition-colors"
              title="Save progress"
              disabled={isSubmitting}
            >
              <Save className="w-3 h-3 sm:w-4 sm:h-4 text-gray-500" />
            </button>
            <button
              onClick={handleClose}
              className="p-1.5 sm:p-2 hover:bg-gray-100 rounded-lg transition-colors"
              disabled={isSubmitting}
            >
              <X className="w-4 h-4 sm:w-5 sm:h-5 text-gray-500" />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4 sm:space-y-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Product Name
              </label>
              <input
                type="text"
                value={formData.productName}
                onChange={(e) => handleFormDataChange('productName', e.target.value)}
                className="w-full px-3 sm:px-4 py-2.5 sm:py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors text-sm sm:text-base"
                placeholder="Enter product name"
                required
                disabled={isSubmitting}
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
                className="w-full px-3 sm:px-4 py-2.5 sm:py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors text-sm sm:text-base"
                placeholder="Enter HS code"
                required
                disabled={isSubmitting}
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
              className="w-full px-3 sm:px-4 py-2.5 sm:py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors text-sm sm:text-base"
              placeholder="Enter minimum order quantity"
              min="1"
              required
              disabled={isSubmitting}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                <Calendar className="w-4 h-4 mr-2 text-orange-600" />
                Auction Start Time
              </label>
              <input
                type="datetime-local"
                value={formData.startTime}
                onChange={(e) => handleFormDataChange('startTime', e.target.value)}
                className="w-full px-3 sm:px-4 py-2.5 sm:py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors text-sm sm:text-base"
                required
                disabled={isSubmitting}
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
                className="w-full px-3 sm:px-4 py-2.5 sm:py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors text-sm sm:text-base"
                required
                disabled={isSubmitting}
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
              className="w-full px-3 sm:px-4 py-2.5 sm:py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors resize-none text-sm sm:text-base"
              placeholder="Enter product description"
              rows={4}
              required
              disabled={isSubmitting}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Product Images
            </label>
            
            {/* File Upload Area */}
            <div
              className={`relative border-2 border-dashed rounded-xl p-4 sm:p-6 text-center transition-colors ${
                dragActive 
                  ? 'border-orange-500 bg-orange-50' 
                  : 'border-gray-300 hover:border-gray-400'
              } ${isSubmitting ? 'opacity-50 pointer-events-none' : ''}`}
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
                disabled={isSubmitting}
              />
              <Upload className="w-8 h-8 sm:w-12 sm:h-12 text-gray-400 mx-auto mb-3 sm:mb-4" />
              <p className="text-gray-600 mb-2 text-sm sm:text-base">
                <span className="font-medium text-orange-600">Click to upload</span> or drag and drop
              </p>
              <p className="text-xs sm:text-sm text-gray-500">PNG, JPG, GIF up to 10MB each</p>
            </div>

            {/* Image Preview Grid */}
            {images.length > 0 && (
              <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
                {images.map((image, index) => (
                  <div key={index} className="relative group">
                    <img
                      src={image}
                      alt={`Product ${index + 1}`}
                      className="w-full h-20 sm:h-24 object-cover rounded-lg border border-gray-200"
                    />
                    <button
                      type="button"
                      onClick={() => removeImage(index)}
                      className="absolute top-1 sm:top-2 right-1 sm:right-2 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                      disabled={isSubmitting}
                    >
                      <Trash2 className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={handleClose}
              className="flex-1 px-4 py-2.5 sm:py-3 border border-gray-300 text-gray-700 font-medium rounded-xl hover:bg-gray-50 focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors disabled:opacity-50 text-sm sm:text-base"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2.5 sm:py-3 bg-gradient-to-r from-orange-500 to-amber-500 text-white font-semibold rounded-xl hover:from-orange-600 hover:to-amber-600 focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 transition-all disabled:opacity-50 text-sm sm:text-base"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Adding...' : 'Add Requirement'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddRequirementModal;