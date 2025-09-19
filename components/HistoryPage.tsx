import React, { useState, useEffect, useMemo } from 'react';
import { Registration, AnimalResult, Confidence } from '../types';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { Icon } from './icons';
import { INDIAN_STATES, ALL_BREEDS } from '../constants';
import { INDIAN_STATES_AND_DISTRICTS } from '../utils/locationData';

// FIX: Added initialSearchTerm to props to accept a search term from other components.
interface HistoryPageProps {
  selectedRegistration: Registration | null;
  onBack: () => void;
  onEdit: (registration: Registration) => void;
  initialSearchTerm: string;
}

export const HistoryPage: React.FC<HistoryPageProps> = ({ selectedRegistration, onBack, onEdit, initialSearchTerm }) => {
  const [registrations] = useLocalStorage<Registration[]>('registrations', []);
  const [activeRegistration, setActiveRegistration] = useState<Registration | null>(selectedRegistration);
  const [isMounted, setIsMounted] = useState(false);
  // FIX: Initialize searchTerm state with the passed-in prop.
  const [searchTerm, setSearchTerm] = useState(initialSearchTerm);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({ state: '', district: '', species: '', breed: '' });
  const [districts, setDistricts] = useState<string[]>([]);

  useEffect(() => {
    if (filters.state && INDIAN_STATES_AND_DISTRICTS[filters.state]) {
        setDistricts(INDIAN_STATES_AND_DISTRICTS[filters.state]);
    } else {
        setDistricts([]);
    }
  }, [filters.state]);

  const handleFilterChange = (e: React.ChangeEvent<HTMLSelectElement | HTMLInputElement>) => {
    const { name, value } = e.target;
    setFilters(prev => {
        const newFilters = { ...prev, [name]: value };
        if (name === 'state') {
            newFilters.district = '';
        }
        return newFilters;
    });
  };

  const clearFilters = () => {
    setFilters({ state: '', district: '', species: '', breed: '' });
    setSearchTerm('');
  };

  const filteredRegistrations = useMemo(() => 
    registrations
      .filter(reg => {
        const lowerSearchTerm = searchTerm.toLowerCase();

        // Search term filter (owner name, idNumber)
        const searchTermMatch = !lowerSearchTerm || 
          reg.owner.name.toLowerCase().includes(lowerSearchTerm) ||
          reg.owner.idNumber.includes(searchTerm);
        
        // State filter
        const stateMatch = !filters.state || reg.owner.state === filters.state;

        // District filter
        const districtMatch = !filters.district || reg.owner.district === filters.district;

        // Species filter
        const speciesMatch = !filters.species || reg.animals.some(animal => animal.species === filters.species);

        // Breed filter
        const breedMatch = !filters.breed || reg.animals.some(animal => !animal.aiResult.error && animal.aiResult.breedName === filters.breed);

        return searchTermMatch && stateMatch && districtMatch && speciesMatch && breedMatch;
      })
      .sort((a,b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()),
    [registrations, searchTerm, filters]
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
        <button onClick={onBack} className="px-4 py-2 border border-gray-300 rounded-md text-primary-700 font-semibold hover:bg-gray-50 text-sm transition-transform duration-150 active:scale-95">Back to Dashboard</button>
      </div>

      <div className="bg-white p-4 rounded-xl shadow-sm border border-cream-200 mb-6">
          <div className="flex gap-4 items-center">
              <div className="flex-grow relative">
                  <Icon name="search" className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400"/>
                  <input
                      type="text"
                      placeholder="Search by Owner Name or ID Number..."
                      value={searchTerm}
                      onChange={e => setSearchTerm(e.target.value)}
                      className="w-full p-3 pl-12 border border-gray-300 rounded-full bg-cream-50 text-gray-900 focus:ring-accent-500 focus:border-accent-500"
                  />
              </div>
              <button onClick={() => setShowFilters(!showFilters)} className="px-4 py-3 border border-gray-300 rounded-full text-primary-700 font-semibold hover:bg-gray-50 text-sm flex items-center gap-2">
                  <Icon name="filter" className="w-5 h-5" />
                  Filters
              </button>
          </div>

          {showFilters && (
            <div className="mt-4 pt-4 border-t border-cream-200">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label htmlFor="state-filter" className="block text-sm font-medium text-primary-800">State</label>
                  <select id="state-filter" name="state" value={filters.state} onChange={handleFilterChange} className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-accent-500 focus:border-accent-500 bg-white text-gray-900">
                    <option value="">All States</option>
                    {INDIAN_STATES.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label htmlFor="district-filter" className="block text-sm font-medium text-primary-800">District</label>
                  <select
                    id="district-filter"
                    name="district"
                    value={filters.district}
                    onChange={handleFilterChange}
                    disabled={!filters.state || districts.length === 0}
                    className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-accent-500 focus:border-accent-500 bg-white text-gray-900 disabled:bg-gray-100"
                  >
                    <option value="">All Districts</option>
                    {districts.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
                <div>
                  <label htmlFor="species-filter" className="block text-sm font-medium text-primary-800">Species</label>
                  <select id="species-filter" name="species" value={filters.species} onChange={handleFilterChange} className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-accent-500 focus:border-accent-500 bg-white text-gray-900">
                    <option value="">All Species</option>
                    <option value="Cattle">Cattle</option>
                    <option value="Buffalo">Buffalo</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="breed-filter" className="block text-sm font-medium text-primary-800">Breed</label>
                  <select id="breed-filter" name="breed" value={filters.breed} onChange={handleFilterChange} className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-accent-500 focus:border-accent-500 bg-white text-gray-900">
                    <option value="">All Breeds</option>
                    {ALL_BREEDS.map(b => <option key={b.name} value={b.name}>{b.name}</option>)}
                  </select>
                </div>
              </div>
              <div className="mt-4 flex justify-end">
                <button onClick={clearFilters} className="text-sm font-semibold text-accent-600 hover:underline">Clear All Filters & Search</button>
              </div>
            </div>
          )}
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
                    {reg.animals[0]?.photos?.[0]?.previewUrl ? (
                        <img src={reg.animals[0].photos[0].previewUrl} alt="Animal" className="w-full h-full object-cover"/>
                    ) : (
                        <Icon name="cow" className="w-8 h-8 text-gray-400" />
                    )}
                </div>
                <div>
                  <p className="font-bold text-lg text-primary-900">{reg.owner.name}</p>
                  <p className="text-sm text-primary-700">
                    {new Date(reg.timestamp).toLocaleString()} • {reg.animals.length} animal{reg.animals.length > 1 ? 's' : ''}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <button
                    onClick={() => onEdit(reg)}
                    className="px-4 py-2 border border-gray-300 rounded-md text-primary-700 font-semibold hover:bg-gray-50 text-sm transition-transform duration-150 active:scale-95"
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
          <p className="mt-2 text-gray-500">{searchTerm || filters.state || filters.district || filters.species || filters.breed ? 'Try different search or filter criteria.' : 'Complete a new registration to see it listed here.'}</p>
        </div>
      )}
    </div>
  );
};

const getValidityInfo = (animal: AnimalResult, issueDate: Date) => {
    const age = parseInt(animal.ageValue, 10);
    if (isNaN(age)) {
        const fallbackDate = new Date(issueDate);
        fallbackDate.setFullYear(fallbackDate.getFullYear() + 1);
        return {
            validUntil: fallbackDate,
            validityReason: "Standard 1-Year Validity",
            isSenior: false
        };
    }

    const ageInMonths = animal.ageUnit === 'Years' ? age * 12 : age;

    let validUntil: Date;
    let validityReason: string;
    let isSenior = false;

    if (ageInMonths <= 6) {
        // Calf
        const dob = new Date(issueDate);
        dob.setMonth(dob.getMonth() - ageInMonths);
        validUntil = new Date(dob);
        validUntil.setFullYear(validUntil.getFullYear() + 1);
        validityReason = "Calf — Valid until 1st Birthday";
    } else if (ageInMonths > 6 && ageInMonths <= 36) {
        // Young Animal
        validUntil = new Date(issueDate);
        validUntil.setFullYear(validUntil.getFullYear() + 1);
        validityReason = "Young Animal — 1-Year Validity";
    } else if (ageInMonths > 36 && ageInMonths <= 96) {
        // Mature Adult
        validUntil = new Date(issueDate);
        validUntil.setFullYear(validUntil.getFullYear() + 2);
        validityReason = "Mature Adult — 2-Year Validity";
    } else { // ageInMonths > 96
        // Senior Animal
        validUntil = new Date(issueDate);
        validUntil.setFullYear(validUntil.getFullYear() + 1);
        validityReason = "Senior Animal — 1-Year Validity";
        isSenior = true;
    }

    return { validUntil, validityReason, isSenior };
};

const RegistrationDetail: React.FC<{ registration: Registration; onBack: () => void; onEdit: () => void; }> = ({ registration, onBack, onEdit }) => {
  const [maskData, setMaskData] = useState(true);
  
  const issueDate = new Date(registration.timestamp);
  const year = issueDate.getFullYear();
  const regNum = registration.id.split('-')[1].slice(-4);
  const stateCode = registration.owner.state.substring(0, 2).toUpperCase();
  const districtCode = registration.owner.district.substring(0, 4).toUpperCase();
  
  const certificateId = `INAPH-CERT-${year}-${regNum}`;
  const referenceNumber = `BPA/${stateCode}/${districtCode}/${year}/${regNum}`;
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=https://verify.pashuvision.gov.in/CERT/${certificateId}&qzone=1`;

  const mask = (value: string, visibleChars = 4) => {
      if (value.length <= visibleChars) return value;
      return 'X'.repeat(value.length - visibleChars) + value.slice(-visibleChars);
  }
  
  const animalValidityData = useMemo(() => {
    return registration.animals.map(animal => getValidityInfo(animal, issueDate));
  }, [registration.animals, issueDate]);

  const overallValidity = useMemo(() => {
      if (animalValidityData.length === 0) {
          const fallbackDate = new Date(issueDate);
          fallbackDate.setFullYear(fallbackDate.getFullYear() + 1);
          return {
              validUntil: fallbackDate,
              validityReason: "Standard 1-Year Validity"
          };
      }
      return animalValidityData.reduce((earliest, current) =>
          current.validUntil < earliest.validUntil ? current : earliest
      );
  }, [animalValidityData, issueDate]);

  return (
    <div className="bg-cream-100 print:bg-white -m-4 sm:-m-6 lg:-m-8 p-4 sm:p-6 lg:p-8 font-serif">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-6 print:hidden">
            <button 
                onClick={onBack} 
                className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-md text-primary-700 font-semibold hover:bg-gray-50 text-sm transition-transform duration-150 active:scale-95"
            >
                <Icon name="chevron-left" className="w-4 h-4" />
                Back to List
            </button>
            <div className="flex items-center space-x-2">
                <button onClick={() => window.print()} className="p-2 text-gray-500 hover:bg-gray-100 rounded-full transition-transform duration-150 active:scale-90" title="Print Report"><Icon name="print" /></button>
                <button onClick={onEdit} className="p-2 text-gray-500 hover:bg-gray-100 rounded-full transition-transform duration-150 active:scale-90" title="Update Report"><Icon name="pencil-square" /></button>
            </div>
        </div>

        <div id="certificate" className="bg-white p-2 shadow-lg rounded-xl border border-cream-200 print:shadow-none print:border-none print:rounded-none">
            <div className="border-4 border-primary-800 p-1">
                <div className="border border-primary-700 p-6 rounded-lg relative overflow-hidden">
                    <div className="absolute inset-0 flex items-center justify-center z-0">
                        <p className="text-gray-200/50 text-7xl md:text-8xl lg:text-9xl font-extrabold tracking-widest -rotate-[30deg] select-none pointer-events-none">
                            GOVERNMENT OF INDIA
                        </p>
                    </div>
                    <div className="relative z-10">
                        <header className="flex justify-between items-start text-center border-b-2 border-primary-800 pb-4 mb-4">
                           <div className="w-24 flex-shrink-0 flex justify-center items-center h-24">
                                <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/c/c5/Logo_of_the_Department_of_Animal_Husbandry_and_Dairying.svg/240px-Logo_of_the_Department_of_Animal_Husbandry_and_Dairying.svg.png" alt="Ministry Logo" className="h-20 w-auto" />
                           </div>
                           <div className="flex-grow">
                               <h1 className="font-bold text-lg text-primary-900">भारत सरकार / Government of India</h1>
                               <p className="font-semibold text-base text-primary-800 mt-1">पशुपालन और डेयरी विभाग</p>
                               <p className="text-sm text-primary-700">Department of Animal Husbandry and Dairying</p>
                               <p className="text-xs text-primary-600">Ministry of Fisheries, Animal Husbandry & Dairying</p>
                           </div>
                           <div className="w-24 h-24 flex-shrink-0 flex flex-col items-center justify-center text-xs">
                               <div className="bg-white p-1 border rounded-md">
                                  <img src={qrCodeUrl} alt="QR Code for Verification" />
                               </div>
                               <p className="font-mono mt-1 text-[8px] tracking-tighter">Scan to Verify</p>
                           </div>
                        </header>
                        
                        <main>
                            <div className="text-right -mt-2 mb-2">
                                <p className="text-xs"><strong>Report Reference Number:</strong> <span className="font-mono">{referenceNumber}</span></p>
                            </div>
                            <h2 className="text-center text-2xl font-bold tracking-wider text-primary-900 uppercase">Animal Breed Identification Certificate</h2>
                            <p className="text-center font-mono font-semibold text-primary-800 mt-1">CERTIFICATE NO: {certificateId}</p>

                            <div className="flex justify-between items-baseline mt-4 text-sm">
                                <p><strong>Issue Date:</strong> {issueDate.toLocaleDateString('en-GB')}</p>
                                <p><strong>Valid Until:</strong> {overallValidity.validUntil.toLocaleDateString('en-GB')} ({overallValidity.validityReason})</p>
                            </div>

                            <div className="mt-6">
                                <h3 className="font-bold text-lg text-primary-900 border-b border-primary-300 pb-1 mb-3">Owner Information</h3>
                                <div className="grid grid-cols-2 gap-x-8 gap-y-2 text-base">
                                    <p><strong className="w-28 inline-block font-semibold text-primary-800">Name:</strong> {registration.owner.name}</p>
                                    <p><strong className="w-28 inline-block font-semibold text-primary-800">Location:</strong> {`${registration.owner.village}, ${registration.owner.district}`}</p>
                                    <p><strong className="w-28 inline-block font-semibold text-primary-800">Mobile:</strong> {maskData ? mask(registration.owner.mobile) : registration.owner.mobile}</p>
                                    <p><strong className="w-28 inline-block font-semibold text-primary-800">State:</strong> {registration.owner.state}</p>
                                    <p><strong className="w-28 inline-block font-semibold text-primary-800">{registration.owner.idType}:</strong> {maskData ? mask(registration.owner.idNumber) : registration.owner.idNumber}</p>
                                </div>
                                 <label className="flex items-center text-sm text-gray-600 pt-3 print:hidden">
                                    <input type="checkbox" checked={!maskData} onChange={() => setMaskData(!maskData)} className="mr-2 h-4 w-4 rounded text-accent-600 focus:ring-accent-500 border-gray-300" />
                                    Show sensitive data
                                </label>
                            </div>

                            <div className="mt-6">
                                <h3 className="font-bold text-lg text-primary-900 border-b border-primary-300 pb-1 mb-3">Registered Animal Details</h3>
                                <div className="space-y-6">
                                    {registration.animals.map((animal, index) => <AnimalCertificateRecord key={animal.id} animal={animal} index={index} isSenior={animalValidityData[index].isSenior} />)}
                                </div>
                            </div>
                        </main>

                        <footer className="mt-8 pt-4 border-t space-y-4">
                            <div className="flex justify-between items-end">
                                <div className="text-center">
                                    <div className="w-28 h-28 border-2 border-dashed border-primary-600 rounded-full flex items-center justify-center">
                                        <p className="text-xs text-primary-700">Official Seal Area</p>
                                    </div>
                                </div>

                                <div className="text-center text-sm w-1/3">
                                    <p className="font-['Caveat',_cursive] text-2xl text-primary-900 -mb-2">Dr. Priya Sharma</p>
                                    <p className="border-b border-primary-800 pb-1 font-semibold text-primary-800">Dr. Priya Sharma</p>
                                    <p className="font-semibold text-primary-800">Authorized Officer</p>
                                    <p className="text-xs text-primary-700">Designation: Veterinary Officer</p>
                                    <p className="text-xs text-primary-700">Registration ID: INAPH-VET-2023-MH-8891</p>
                                    <p className="text-xs text-primary-700">Contact: 91XXXXXX12 | vet.pune@nic.in</p>
                                </div>
                            </div>
                            <p className="text-xs text-gray-600 px-4 text-center">
                                This is a computer-generated document. Digitally authenticated — no physical signature required. For support: <span className="font-semibold">helpdesk@pashuvision.gov.in</span> | Helpline: <span className="font-semibold">1800-XXX-XXXX</span>
                            </p>
                        </footer>
                    </div>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};


const ConfidenceBadge: React.FC<{ level: Confidence }> = ({ level }) => {
  const styles = {
    High: 'bg-green-100 text-green-800 border-green-300',
    Medium: 'bg-yellow-100 text-yellow-800 border-yellow-300',
    Low: 'bg-red-100 text-red-800 border-red-300',
  };
  return <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${styles[level]}`}>{level} Confidence</span>;
};

const AnimalCertificateRecord: React.FC<{animal: AnimalResult, index: number, isSenior: boolean}> = ({ animal, index, isSenior }) => {
  const hasError = !!animal.aiResult.error;
  return (
    <div className={`p-4 rounded-lg border ${hasError ? 'bg-red-50/50 border-red-200' : 'bg-cream-50/50 border-cream-200'} break-inside-avoid print:shadow-none`}>
        <div className="flex justify-between items-center pb-2 mb-3 border-b border-dashed border-primary-300">
            <h4 className="text-lg font-bold text-primary-900">{hasError ? `Animal Record #${index+1}` : animal.aiResult.breedName}</h4>
            {!hasError && <ConfidenceBadge level={animal.aiResult.confidence} />}
        </div>
        {isSenior && !hasError && (
            <div className="mb-3 p-2 text-center bg-accent-yellow-100 border border-accent-yellow-200 rounded-md">
                <p className="font-bold text-xs text-accent-yellow-800 tracking-wider">SENIOR ANIMAL — ANNUAL HEALTH CHECK REQUIRED</p>
            </div>
        )}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-1">
                {animal.photos?.[0]?.previewUrl ? (
                    <img src={animal.photos[0].previewUrl} alt={`Animal ${index+1}`} className="w-full h-40 object-cover rounded-md border p-1 bg-white"/>
                ) : (
                    <div className="w-full h-40 flex items-center justify-center bg-cream-100 rounded-md border p-1">
                        <Icon name="cow" className="w-16 h-16 text-gray-400" />
                    </div>
                )}
                <div className="text-sm mt-2 space-y-1 text-center bg-white p-2 rounded-md border">
                    <p><strong>Species:</strong> {animal.species}</p>
                    <p><strong>Sex:</strong> {animal.sex}</p>
                    <p><strong>Age:</strong> {`${animal.ageValue} ${animal.ageUnit}`}</p>
                </div>
            </div>
            <div className="md:col-span-2">
                {hasError ? (
                    <div className="flex items-center justify-center h-full bg-red-100/50 p-4 rounded-md text-red-700">
                      <p><strong>Analysis Failed:</strong> {animal.aiResult.error}</p>
                    </div>
                ) : (
                    <div className="space-y-3 text-sm">
                        <div>
                            <h5 className="font-semibold text-primary-800 uppercase text-xs tracking-wider">AI Reasoning</h5>
                            <p className="text-primary-900 text-base">{animal.aiResult.reasoning}</p>
                        </div>
                         <div>
                            <h5 className="font-semibold text-primary-800 uppercase text-xs tracking-wider">Milk Yield Potential</h5>
                            <p className="text-primary-900 text-base">{animal.aiResult.milkYieldPotential}</p>
                        </div>
                         <div>
                            <h5 className="font-semibold text-primary-800 uppercase text-xs tracking-wider">General Care Notes</h5>
                            <p className="text-primary-900 text-base">{animal.aiResult.careNotes}</p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    </div>
  )
};