import React, { useState, useEffect, useMemo } from 'react';
import { Registration, AnimalResult } from '../types';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { Icon } from './icons';

interface HistoryPageProps {
  selectedRegistration: Registration | null;
  onBack: () => void;
  onEdit: (registration: Registration) => void;
}

export const HistoryPage: React.FC<HistoryPageProps> = ({ selectedRegistration, onBack, onEdit }) => {
  const [registrations] = useLocalStorage<Registration[]>('registrations', []);
  const [activeRegistration, setActiveRegistration] = useState<Registration | null>(selectedRegistration);
  const [isMounted, setIsMounted] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const filteredRegistrations = useMemo(() => 
    registrations
      .filter(reg => {
        const lowerSearchTerm = searchTerm.toLowerCase();
        if (!lowerSearchTerm) return true;
        return (
          reg.owner.name.toLowerCase().includes(lowerSearchTerm) ||
          reg.owner.aadhaar.includes(searchTerm)
        );
      })
      .sort((a,b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()),
    [registrations, searchTerm]
  );
  
  useEffect(() => {
    const timer = setTimeout(() => setIsMounted(true), 100);
    return () => clearTimeout(timer);
  }, []);

  const handleSelectRegistration = (reg: Registration) => {
    setActiveRegistration(reg);
  };

  const handleBackToList = () => {
    if (selectedRegistration) {
        onBack();
    } else {
        setActiveRegistration(null);
    }
  };

  if (activeRegistration) {
    return <RegistrationDetail registration={activeRegistration} onBack={handleBackToList} onEdit={() => onEdit(activeRegistration)} />;
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-primary-900">Registration History</h1>
        <button onClick={onBack} className="px-4 py-2 border border-gray-300 rounded-md text-secondary-700 font-semibold hover:bg-gray-50 text-sm transition-transform duration-150 active:scale-95">Back to Dashboard</button>
      </div>

      <div className="mb-6 relative">
          <Icon name="search" className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400"/>
          <input
              type="text"
              placeholder="Search by Owner Name or Aadhaar Number..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full p-3 pl-12 border border-gray-300 rounded-full bg-white text-gray-900 focus:ring-accent-500 focus:border-accent-500 shadow-sm"
          />
      </div>
      
      {filteredRegistrations.length > 0 ? (
        <div className="space-y-4">
          {filteredRegistrations.map((reg, index) => (
            <div 
              key={reg.id} 
              className={`bg-white p-4 rounded-xl shadow-sm border border-cream-200 flex items-center justify-between transition-all duration-300 ease-out transform ${isMounted ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`}
              style={{ transitionDelay: `${index * 50}ms` }}
            >
              <div className="flex items-center">
                <div className="w-12 h-12 rounded-lg bg-cream-100 flex items-center justify-center mr-4 overflow-hidden">
                    <img src={reg.animals[0].photos[0]?.previewUrl} alt="Animal" className="w-full h-full object-cover"/>
                </div>
                <div>
                  <p className="font-bold text-lg text-primary-900">{reg.owner.name}</p>
                  <p className="text-sm text-secondary-700">
                    {new Date(reg.timestamp).toLocaleString()} • {reg.animals.length} animal{reg.animals.length > 1 ? 's' : ''}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <button
                    onClick={() => onEdit(reg)}
                    className="px-4 py-2 border border-gray-300 rounded-md text-secondary-700 font-semibold hover:bg-gray-50 text-sm transition-transform duration-150 active:scale-95"
                >
                    Update
                </button>
                <button
                    onClick={() => handleSelectRegistration(reg)}
                    className="px-4 py-2 bg-accent-500 text-white rounded-md hover:bg-accent-600 text-sm font-semibold transition-transform duration-150 active:scale-95"
                >
                    View Report
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-16 bg-white rounded-xl shadow-sm border border-cream-200">
          <Icon name="search" className="w-16 h-16 mx-auto text-gray-400" />
          <h2 className="mt-4 text-xl font-semibold text-gray-700">No Matching Registrations</h2>
          <p className="mt-2 text-gray-500">{searchTerm ? 'Try a different search term.' : 'Complete a new registration to see it listed here.'}</p>
        </div>
      )}
    </div>
  );
};

const ReportHeader: React.FC<{regId: string}> = ({regId}) => (
    <div className="flex items-center justify-between border-b-2 border-primary-900 pb-4 mb-6">
        <div className="flex items-center">
            <span className="text-5xl mr-3">🐮</span>
            <div>
                <h1 className="text-2xl font-bold text-primary-900">Animal Breed Verification Report</h1>
                <p className="text-sm text-secondary-700">Generated by पशुVision AI</p>
            </div>
        </div>
        <div className="text-right">
            <p className="font-mono text-xs text-gray-500">REG-ID: {regId}</p>
            <p className="font-mono text-xs text-gray-500">DATE: {new Date().toLocaleDateString()}</p>
        </div>
    </div>
);

const RegistrationDetail: React.FC<{ registration: Registration; onBack: () => void; onEdit: () => void; }> = ({ registration, onBack, onEdit }) => {
  const [maskData, setMaskData] = useState(true);

  const mask = (value: string, visibleChars = 4) => {
      if (value.length <= visibleChars) return value;
      return '*'.repeat(value.length - visibleChars) + value.slice(-visibleChars);
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex justify-end items-center space-x-2 mb-6 print:hidden">
          <button onClick={() => window.print()} className="p-2 text-gray-500 hover:bg-gray-100 rounded-full transition-transform duration-150 active:scale-90" title="Print Report"><Icon name="print" /></button>
          <button onClick={onEdit} className="p-2 text-gray-500 hover:bg-gray-100 rounded-full transition-transform duration-150 active:scale-90" title="Update Report"><Icon name="pencil-square" /></button>
          <button onClick={onBack} className="px-4 py-2 border border-gray-300 rounded-md text-secondary-700 font-semibold hover:bg-gray-50 text-sm transition-transform duration-150 active:scale-95">Back</button>
      </div>

      <div className="bg-white p-8 rounded-xl shadow-lg print:shadow-none border border-cream-200">
        <ReportHeader regId={registration.id} />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
            <div className="space-y-2 text-sm">
                <h3 className="font-bold text-lg text-primary-900 border-b pb-1 mb-2">Owner Information</h3>
                 <p><strong className="w-28 inline-block font-semibold text-secondary-800">Name:</strong> {registration.owner.name}</p>
                 <p><strong className="w-28 inline-block font-semibold text-secondary-800">Mobile:</strong> {maskData ? mask(registration.owner.mobile) : registration.owner.mobile}</p>
                 <p><strong className="w-28 inline-block font-semibold text-secondary-800">Aadhaar:</strong> {maskData ? mask(registration.owner.aadhaar) : registration.owner.aadhaar}</p>
                 <p><strong className="w-28 inline-block font-semibold text-secondary-800">Location:</strong> {`${registration.owner.village}, ${registration.owner.district}, ${registration.owner.state}`}</p>
                 <label className="flex items-center text-sm text-gray-600 pt-2 print:hidden">
                    <input type="checkbox" checked={maskData} onChange={() => setMaskData(!maskData)} className="mr-2 h-4 w-4 rounded text-accent-600 focus:ring-accent-500 border-gray-300" />
                    Mask sensitive data
                 </label>
            </div>
             <div className="flex justify-center items-center flex-col bg-cream-50 p-4 rounded-lg">
                <img 
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=${encodeURIComponent(JSON.stringify({regId: registration.id, owner: registration.owner.name}))}`} 
                    alt="Registration QR Code"
                    className="border p-1 rounded-md bg-white"
                />
                <p className="text-xs text-gray-500 mt-2">Scan for a quick summary.</p>
            </div>
        </div>
        
        <div className="mt-8">
            <h3 className="font-bold text-lg text-primary-900 mb-4 border-b pb-1">Registered Animal Details</h3>
            <div className="space-y-6">
                {registration.animals.map((animal, index) => <AnimalDetailCard key={animal.id} animal={animal} index={index}/>)}
            </div>
        </div>
      </div>
    </div>
  );
};

const AnimalDetailCard: React.FC<{animal: AnimalResult, index: number}> = ({animal, index}) => {
    return (
        <div className="border rounded-lg p-4 bg-cream-50/80">
            <h4 className="font-bold text-md text-primary-900 mb-3">Animal #{index+1} - AI Analysis</h4>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-1 bg-gray-200 rounded-md flex items-center justify-center p-2 aspect-video lg:aspect-square">
                     <img src={animal.photos[0].previewUrl} alt="Animal" className="rounded-md max-w-full max-h-full object-contain" />
                </div>
                 <div className="lg:col-span-2 space-y-2 text-sm">
                    {animal.aiResult.error ? (
                        <div className="text-red-700 font-semibold flex items-center gap-2"><Icon name="close" className="w-5 h-5"/> Error: {animal.aiResult.error}</div>
                    ) : (
                        <>
                            <p><strong className="w-36 inline-block font-semibold text-secondary-800">Identified Breed:</strong> <span className="font-bold text-lg text-primary-900">{animal.aiResult.breedName}</span></p>
                            <p><strong className="w-36 inline-block font-semibold text-secondary-800">Confidence Level:</strong> {animal.aiResult.confidence}</p>
                            <p><strong className="w-36 inline-block font-semibold text-secondary-800">Species / Gender:</strong> {animal.species} / {animal.gender}</p>
                            <p><strong className="w-36 inline-block font-semibold text-secondary-800">Approx. Age:</strong> {animal.age} years</p>
                            <div className="pt-2">
                                <strong className="w-full block font-semibold text-secondary-800">Milk Yield Potential:</strong> 
                                <p className="pl-2 border-l-2 ml-1 border-cream-200">{animal.aiResult.milkYieldPotential}</p>
                            </div>
                            <div className="pt-1">
                                <strong className="w-full block font-semibold text-secondary-800">General Care Notes:</strong>
                                <p className="pl-2 border-l-2 ml-1 border-cream-200">{animal.aiResult.careNotes}</p>
                            </div>
                        </>
                    )}
                 </div>
            </div>
        </div>
    );
};
