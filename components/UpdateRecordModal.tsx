import React, { useState, useRef, useEffect } from 'react';
import { Icon } from './icons';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { Registration } from '../types';
import { CameraModal } from './CameraModal';


interface UpdateRecordModalProps {
  isOpen: boolean;
  onClose: () => void;
  onEditRegistration: (registration: Registration) => void;
}

export const UpdateRecordModal: React.FC<UpdateRecordModalProps> = ({ isOpen, onClose, onEditRegistration }) => {
  const [searchType, setSearchType] = useState<'aadhaar' | 'regId'>('aadhaar');
  const [searchValue, setSearchValue] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [registrations] = useLocalStorage<Registration[]>('registrations', []);
  const modalRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setError(null);
      setSearchValue('');
      setSearchType('aadhaar');
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  const handleSearch = (type: 'aadhaar' | 'regId', value: string) => {
    let foundRegistration: Registration | undefined;
    setError(null);
    
    if (type === 'aadhaar') {
        if (value.length !== 12 || !/^\d+$/.test(value)) {
            setError('Please enter a valid 12-digit Aadhaar number.');
            return;
        }
        foundRegistration = registrations.find(reg => reg.owner.idType === 'Aadhaar' && reg.owner.idNumber === value);
    } else { // type === 'regId'
        if (value.trim() === '') {
            setError('Please enter a Registration ID.');
            return;
        }
        foundRegistration = registrations.find(reg => reg.id === value);
    }

    setIsLoading(true);

    setTimeout(() => {
      setIsLoading(false);
      if (foundRegistration) {
        onEditRegistration(foundRegistration);
        onClose();
      } else {
        setError(`No registration found for this ${type === 'aadhaar' ? 'Aadhaar Number' : 'Registration ID'}. Please verify the value or create a new registration.`);
      }
    }, 500);
  };
  
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
        handleSearch(searchType, searchValue);
    }
  };
  
  const handleCodeDetected = (code: string) => {
      setIsCameraOpen(false);
      setError(null);
      
      const urlPrefix = 'https://verify.pashuvision.gov.in/CERT/';
      let parsedRegId: string | null = null;
      
      if (code.startsWith(urlPrefix)) {
          const regId = code.substring(urlPrefix.length);
          if (regId) {
              parsedRegId = regId;
          }
      } else {
          // Attempt to parse as JSON as a fallback
          try {
              const qrData = JSON.parse(code);
              if (qrData.regId) {
                  parsedRegId = qrData.regId;
              }
          } catch (e) {
              // Not a URL we recognize or valid JSON with regId
          }
      }

      if (parsedRegId) {
          // Update UI state for clarity, then auto-search
          setSearchType('regId');
          setSearchValue(parsedRegId);
          handleSearch('regId', parsedRegId);
      } else {
          setError("QR code is invalid or does not contain a Registration ID.");
      }
  };


  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
        <div
          ref={modalRef}
          tabIndex={-1}
          className="bg-cream-50 rounded-2xl shadow-2xl w-full max-w-md flex flex-col relative"
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
            <p className="text-primary-700 text-sm">
              Choose a search method below, or scan the QR code from the report to autofill the ID.
            </p>
            <div>
                <fieldset>
                    <legend className="block text-sm font-medium text-primary-800 mb-2">Search by</legend>
                    <div className="flex gap-4 mb-3">
                        <label className="flex items-center cursor-pointer">
                        <input type="radio" name="searchType" value="aadhaar" checked={searchType === 'aadhaar'} onChange={() => setSearchType('aadhaar')} className="h-4 w-4 text-accent-600 focus:ring-accent-500 border-gray-300"/>
                        <span className="ml-2 text-sm text-primary-800">Aadhaar Number</span>
                        </label>
                        <label className="flex items-center cursor-pointer">
                        <input type="radio" name="searchType" value="regId" checked={searchType === 'regId'} onChange={() => setSearchType('regId')} className="h-4 w-4 text-accent-600 focus:ring-accent-500 border-gray-300"/>
                        <span className="ml-2 text-sm text-primary-800">Registration ID</span>
                        </label>
                    </div>
                </fieldset>
              <input
                ref={inputRef}
                id="search-value"
                type="text"
                placeholder={searchType === 'aadhaar' ? 'Enter 12-digit number' : 'Enter Registration ID'}
                value={searchValue}
                onChange={e => {
                    const val = e.target.value;
                    setSearchValue(searchType === 'aadhaar' ? val.replace(/\D/g, '') : val);
                }}
                onKeyPress={handleKeyPress}
                maxLength={searchType === 'aadhaar' ? 12 : 50}
                className="mt-1 w-full p-2 border border-gray-300 rounded-md bg-white text-gray-900 focus:ring-accent-yellow-500 focus:border-accent-yellow-500"
              />
            </div>
            <button
              onClick={() => handleSearch(searchType, searchValue)}
              disabled={isLoading}
              className="w-full px-6 py-2 bg-accent-500 text-white font-semibold rounded-md hover:bg-accent-600 shadow-sm flex items-center justify-center disabled:bg-accent-400 disabled:cursor-not-allowed transition-transform duration-150 active:scale-95"
            >
                {`Search by ${searchType === 'aadhaar' ? 'Aadhaar' : 'Registration ID'}`}
            </button>
            
            <div className="flex items-center text-center">
                <div className="flex-grow border-t border-cream-200"></div>
                <span className="flex-shrink mx-4 text-gray-500 text-xs font-semibold">OR</span>
                <div className="flex-grow border-t border-cream-200"></div>
            </div>

            <button
              onClick={() => setIsCameraOpen(true)}
              disabled={isLoading}
              className="w-full px-6 py-3 bg-primary-800 text-white font-semibold rounded-md hover:bg-primary-700 shadow-sm flex items-center justify-center gap-3 disabled:bg-gray-400 disabled:cursor-not-allowed transition-transform duration-150 active:scale-95"
            >
                <Icon name="qrcode" className="w-6 h-6" />
                Scan QR Code from Report
            </button>


            {error && (
              <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-3 rounded-r-lg text-sm mt-4">
                {error}
              </div>
            )}
          </div>
          
          {isLoading && (
            <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex flex-col items-center justify-center rounded-2xl">
              <svg className="animate-spin h-8 w-8 text-accent-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <p className="mt-3 font-semibold text-primary-800">Searching...</p>
            </div>
          )}

        </div>
      </div>
      <CameraModal 
        isOpen={isCameraOpen}
        onClose={() => setIsCameraOpen(false)}
        onCodeDetected={handleCodeDetected}
      />
    </>
  );
};