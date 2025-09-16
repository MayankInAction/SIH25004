import React, { useState, useRef, useEffect } from 'react';
import { Icon } from './icons';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { Registration } from '../types';

interface UpdateRecordModalProps {
  isOpen: boolean;
  onClose: () => void;
  onEditRegistration: (registration: Registration) => void;
}

export const UpdateRecordModal: React.FC<UpdateRecordModalProps> = ({ isOpen, onClose, onEditRegistration }) => {
  const [aadhaar, setAadhaar] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [registrations] = useLocalStorage<Registration[]>('registrations', []);
  const modalRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setError(null);
      setAadhaar('');
      // Focus input when modal opens
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  const handleSearch = () => {
    if (aadhaar.length !== 12 || !/^\d+$/.test(aadhaar)) {
      setError('Please enter a valid 12-digit Aadhaar number.');
      return;
    }

    setIsLoading(true);
    setError(null);

    // Simulate a brief search delay for better UX
    setTimeout(() => {
      const foundRegistration = registrations.find(reg => reg.owner.aadhaar === aadhaar);
      setIsLoading(false);

      if (foundRegistration) {
        onEditRegistration(foundRegistration);
        onClose(); // Close modal on success
      } else {
        setError(`No registration found for Aadhaar number ending in ${aadhaar.slice(-4)}. Please verify the number or create a new registration.`);
      }
    }, 500);
  };
  
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
        handleSearch();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div
        ref={modalRef}
        tabIndex={-1}
        className="bg-cream-50 rounded-2xl shadow-2xl w-full max-w-md flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        <div className="p-4 border-b border-cream-200 flex justify-between items-center">
          <h2 className="text-xl font-bold text-primary-900 flex items-center gap-2">
            <Icon name="pencil-square" className="w-6 h-6 text-accent-yellow-600" />
            Update Registration Record
          </h2>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-cream-200">
            <Icon name="close" className="w-6 h-6 text-gray-500" />
          </button>
        </div>
        <div className="p-6 space-y-4">
          <p className="text-primary-700">
            To find and update a record, please enter the owner's 12-digit Aadhaar number.
          </p>
          <div>
            <label htmlFor="aadhaar-search" className="block text-sm font-medium text-primary-800">
              Aadhaar Number
            </label>
            <input
              ref={inputRef}
              id="aadhaar-search"
              type="text"
              placeholder="Enter 12-digit number"
              value={aadhaar}
              onChange={e => setAadhaar(e.target.value.replace(/\D/g, ''))}
              onKeyPress={handleKeyPress}
              maxLength={12}
              className="mt-1 w-full p-2 border border-gray-300 rounded-md bg-white text-gray-900 focus:ring-accent-yellow-500 focus:border-accent-yellow-500"
            />
          </div>
          {error && (
            <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-3 rounded-r-lg text-sm">
              {error}
            </div>
          )}
        </div>
        <div className="p-4 bg-cream-100 rounded-b-2xl border-t border-cream-200 flex justify-end">
          <button
            onClick={handleSearch}
            disabled={isLoading}
            className="px-6 py-2 bg-accent-500 text-white font-semibold rounded-md hover:bg-accent-600 shadow-sm flex items-center justify-center w-48 disabled:bg-accent-400 disabled:cursor-not-allowed transition-transform duration-150 active:scale-95"
          >
            {isLoading ? (
              <>
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Searching...
              </>
            ) : (
              'Search & Edit'
            )}
          </button>
        </div>
      </div>
    </div>
  );
};