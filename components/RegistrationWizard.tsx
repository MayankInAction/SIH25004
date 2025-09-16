import React, { useState, useCallback, useEffect } from 'react';
import { AnimalData, OwnerData, AnimalResult, Registration } from '../types';
import { AnimalForm } from './AnimalForm';
import { OwnerForm } from './OwnerForm';
import { ResultsPage } from './ResultsPage';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { toBase64 } from '../utils/fileUtils';
import { identifyBreed } from '../services/geminiService';
import { EMPTY_OWNER_DATA } from '../constants';
import { Icon } from './icons';

interface RegistrationWizardProps {
  onBackToDashboard: () => void;
  registrationToUpdate?: Registration | null;
  onViewReport: (registration: Registration) => void;
}

const getCircleClasses = (isCompleted: boolean, isCurrent: boolean) => {
  const baseClasses = 'relative flex h-8 w-8 items-center justify-center rounded-full transition-all duration-500 ease-in-out';
  if (isCompleted) {
    return `${baseClasses} bg-primary-800 border-primary-800`;
  }
  if (isCurrent) {
    return `${baseClasses} bg-white border-2 border-primary-800 scale-110 shadow-lg`;
  }
  return `${baseClasses} bg-white border-2 border-gray-300`;
};

const Stepper: React.FC<{ currentStep: number }> = ({ currentStep }) => {
  const steps = ["Animal Count", "Animal Details", "Owner Details", "Results"];
  const progressPercentage = currentStep >= steps.length - 1 
    ? 100 
    : (100 / (steps.length - 1)) * currentStep;

  return (
    <nav aria-label="Progress" className="relative">
      {/* Backing Line */}
      <div className="absolute top-4 left-0 h-0.5 w-full bg-gray-200" aria-hidden="true" />
      {/* Progress Line */}
      <div 
        className="absolute top-4 left-0 h-0.5 bg-primary-800 transition-all duration-500 ease-in-out" 
        style={{ width: `${progressPercentage}%` }}
        aria-hidden="true" 
      />
      <ol role="list" className="flex items-start justify-between">
        {steps.map((stepName, stepIdx) => {
          const isCompleted = currentStep > stepIdx;
          const isCurrent = currentStep === stepIdx;

          const getLabelClasses = () => {
            if (isCurrent) return 'text-primary-800 font-bold';
            if (isCompleted) return 'text-primary-800 font-semibold';
            return 'text-gray-500';
          };
          
          return (
            <li key={stepName} className="flex flex-col items-center text-center z-10 w-24">
              <div className={`${getCircleClasses(isCompleted, isCurrent)}`}>
                <Icon name="check" className={`h-5 w-5 text-white transform transition-all duration-300 ease-in-out ${isCompleted ? 'opacity-100 scale-100' : 'opacity-0 scale-50'}`} />
                <span className={`h-2.5 w-2.5 bg-primary-800 rounded-full absolute transition-opacity duration-300 ${isCurrent ? 'opacity-100 animate-pulse' : 'opacity-0'}`} aria-hidden="true" />
              </div>
              <p className={`mt-3 text-sm transition-colors duration-300 ${getLabelClasses()}`}>
                {stepName}
              </p>
            </li>
          );
        })}
      </ol>
    </nav>
  );
};


export const RegistrationWizard: React.FC<RegistrationWizardProps> = ({ onBackToDashboard, registrationToUpdate, onViewReport }) => {
  const isUpdateMode = !!registrationToUpdate;

  const createNewAnimal = (index: number): AnimalData => ({
    id: `animal-${Date.now()}-${index}`,
    species: 'Cattle',
    ageValue: '',
    ageUnit: 'Years',
    gender: 'Female',
    healthNotes: '',
    photos: [],
  });

  const [step, setStep] = useState(isUpdateMode ? 1 : 0);
  const [animals, setAnimals] = useState<AnimalData[]>(() =>
    isUpdateMode ? registrationToUpdate.animals : [createNewAnimal(0)]
  );
  const [owner, setOwner] = useState<OwnerData>(isUpdateMode ? registrationToUpdate.owner : EMPTY_OWNER_DATA);
  const [animalResults, setAnimalResults] = useState<AnimalResult[]>([]);
  const [registrations, setRegistrations] = useLocalStorage<Registration[]>('registrations', []);
  const [completedRegistration, setCompletedRegistration] = useState<Registration | null>(null);

  const [analysisPromise, setAnalysisPromise] = useState<Promise<AnimalResult[]> | null>(null);
  const [isOwnerFormSubmitting, setIsOwnerFormSubmitting] = useState(false);

  const handleAnimalCountSubmit = (newCount: number) => {
    const currentCount = animals.length;

    if (newCount < currentCount) {
        const animalsToBeRemoved = animals.slice(newCount);
        const hasData = animalsToBeRemoved.some(
            animal => animal.photos.length > 0 || animal.ageValue.trim() !== '' || animal.healthNotes.trim() !== ''
        );
        
        if (hasData) {
            const confirmation = window.confirm(
                `Reducing the animal count from ${currentCount} to ${newCount} will remove the data for the last ${currentCount - newCount} animal(s). Are you sure?`
            );
            if (!confirmation) {
                return; 
            }
        }
        setAnimals(prev => prev.slice(0, newCount));
    } 
    else if (newCount > currentCount) {
        const diff = newCount - currentCount;
        const newAnimalEntries = Array.from({ length: diff }, (_, i) => createNewAnimal(currentCount + i));
        setAnimals(prev => [...prev, ...newAnimalEntries]);
    }
    
    setStep(1);
  };

  const updateAnimal = useCallback((index: number, dataOrFn: AnimalData | ((prev: AnimalData) => AnimalData)) => {
    setAnimals(prevAnimals => {
      const newAnimals = [...prevAnimals];
      const currentAnimal = newAnimals[index];
      newAnimals[index] = typeof dataOrFn === 'function' ? dataOrFn(currentAnimal) : dataOrFn;
      return newAnimals;
    });
  }, []);

  const handleAnimalDetailsSubmit = () => {
    for (const animal of animals) {
        if (animal.photos.length === 0) {
            alert(`Please upload at least one photo for each animal.`);
            return;
        }
        if (animal.ageValue.trim() === '') {
            alert(`Please enter the age for each animal.`);
            return;
        }
    }

    const runAnalysis = async (): Promise<AnimalResult[]> => {
      return Promise.all(
        animals.map(async (animal) => {
          const validPhotos = animal.photos.filter(p => p.file);
          if (validPhotos.length === 0) {
              return (animal as AnimalResult).aiResult ? (animal as AnimalResult) : { ...animal, aiResult: { error: 'Photo file not available for re-analysis.', breedName: 'Unknown', confidence: 'Low', milkYieldPotential: '', careNotes: '', reasoning: '' } };
          }

          const imagePayload = await Promise.all(
            validPhotos.map(async (p) => ({
              mimeType: p.file.type,
              data: await toBase64(p.file),
            }))
          );
          const aiResult = await identifyBreed(imagePayload, animal.species);
          return { ...animal, aiResult };
        })
      );
    };
    
    setAnalysisPromise(runAnalysis());
    setStep(2);
  };
  
  const handleOwnerDetailsSubmit = async (ownerData: OwnerData) => {
    if (!analysisPromise) {
      console.error("Analysis promise not found. This should not happen.");
      alert("A critical error occurred. Please start over.");
      return;
    }
    
    setIsOwnerFormSubmitting(true);
    setOwner(ownerData);

    try {
      const results = await analysisPromise;
      setAnimalResults(results);

      if (isUpdateMode && registrationToUpdate) {
        const updatedRegistration: Registration = {
          ...registrationToUpdate,
          owner: ownerData,
          animals: results,
        };
        const updatedRegistrations = registrations.map(reg =>
          reg.id === registrationToUpdate.id ? updatedRegistration : reg
        );
        setRegistrations(updatedRegistrations);
        setCompletedRegistration(updatedRegistration);
      } else {
        const newRegistration: Registration = {
            id: `reg-${Date.now()}`,
            timestamp: new Date().toISOString(),
            owner: ownerData,
            animals: results
        };
        setRegistrations([...registrations, newRegistration]);
        setCompletedRegistration(newRegistration);
      }
      
      setStep(3);
    } catch (error) {
       console.error("Background AI analysis or save failed:", error);
       alert("The AI analysis or saving process failed. Please check your connection and try again.");
    } finally {
        setIsOwnerFormSubmitting(false);
    }
  };


  const renderStep = () => {
    switch (step) {
      case 0:
        return isUpdateMode ? null : <AnimalCountStep onSubmit={handleAnimalCountSubmit} onBack={onBackToDashboard} initialCount={animals.length} />;
      case 1:
        return <AnimalDetailsStep animals={animals} onUpdate={updateAnimal} onSubmit={handleAnimalDetailsSubmit} onBack={() => isUpdateMode ? onBackToDashboard() : setStep(0)} />;
      case 2:
        return <OwnerDetailsStep 
                    initialData={owner} 
                    onSubmit={handleOwnerDetailsSubmit} 
                    onBack={() => setStep(1)}
                    isSubmitting={isOwnerFormSubmitting}
                    isUpdateMode={isUpdateMode}
                />;
      case 3:
        return <ResultsPage 
                  results={animalResults} 
                  owner={owner} 
                  onFinish={onBackToDashboard}
                  registration={completedRegistration}
                  onViewReport={onViewReport}
                />;
      default:
        return null;
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {step < 3 && (
        <div className="bg-white p-8 pt-10 pb-16 rounded-xl border border-cream-200 shadow-sm">
          <Stepper currentStep={step} />
        </div>
      )}
      <div>{renderStep()}</div>
    </div>
  );
};

const AnimalCountStep: React.FC<{ onSubmit: (count: number) => void, onBack: () => void, initialCount: number }> = ({ onSubmit, onBack, initialCount }) => {
  const [count, setCount] = useState(initialCount);
  
  useEffect(() => {
    setCount(initialCount);
  }, [initialCount]);

  const adjustCount = (amount: number) => {
    setCount(prev => {
        const newCount = prev + amount;
        if (newCount >= 1 && newCount <= 50) {
            return newCount;
        }
        return prev;
    });
  };

  return (
    <div className="bg-white p-8 rounded-xl shadow-sm text-center border border-cream-200">
      <h2 className="text-2xl font-bold mb-2 text-primary-900">New Registration Batch</h2>
      <p className="text-primary-700 mb-6">How many animals are you registering for this owner?</p>
      
      <div className="flex items-center justify-center space-x-4 my-8">
        <button 
          onClick={() => adjustCount(-1)} 
          disabled={count <= 1}
          className="w-16 h-16 bg-cream-100 text-primary-700 rounded-full text-4xl font-light flex items-center justify-center hover:bg-cream-200 disabled:bg-cream-100 disabled:text-gray-400 disabled:cursor-not-allowed transition-transform duration-150 active:scale-95"
          aria-label="Decrease animal count"
        >
          -
        </button>
        <span className="text-7xl font-bold text-primary-900 w-28 text-center tabular-nums">{count}</span>
        <button 
          onClick={() => adjustCount(1)}
          disabled={count >= 50}
          className="w-16 h-16 bg-cream-100 text-primary-700 rounded-full text-4xl font-light flex items-center justify-center hover:bg-cream-200 disabled:bg-cream-100 disabled:text-gray-400 disabled:cursor-not-allowed transition-transform duration-150 active:scale-95"
          aria-label="Increase animal count"
        >
          +
        </button>
      </div>

      <p className="text-sm text-gray-500 mb-8 -mt-4">For performance, you can register up to 50 animals in a single batch.</p>
      <div className="flex justify-center space-x-4">
        <button onClick={onBack} className="px-6 py-2 border border-gray-300 rounded-md text-primary-700 font-semibold hover:bg-gray-50 transition-transform duration-150 active:scale-95">Back</button>
        <button onClick={() => onSubmit(count)} className="px-8 py-2 bg-accent-500 text-white font-semibold rounded-md hover:bg-accent-600 shadow-sm transition-transform duration-150 active:scale-95">Next</button>
      </div>
    </div>
  );
};

const AnimalDetailsStep: React.FC<{ animals: AnimalData[], onUpdate: (index: number, data: AnimalData | ((prev: AnimalData) => AnimalData)) => void, onSubmit: () => void, onBack: () => void }> = ({ animals, onUpdate, onSubmit, onBack }) => (
  <div className="space-y-6">
    {animals.map((animal, index) => (
      <AnimalForm key={animal.id} index={index} animalData={animal} onUpdate={onUpdate} />
    ))}
    <div className="flex justify-between mt-8">
      <button onClick={onBack} className="px-6 py-2 border border-gray-300 rounded-md text-primary-700 font-semibold hover:bg-gray-50 transition-transform duration-150 active:scale-95">Back</button>
      <button onClick={onSubmit} className="px-8 py-2 bg-accent-500 text-white font-semibold rounded-md hover:bg-accent-600 shadow-sm transition-transform duration-150 active:scale-95">Next: Owner Details</button>
    </div>
  </div>
);

const OwnerDetailsStep: React.FC<{ initialData: OwnerData, onSubmit: (data: OwnerData) => void, onBack: () => void, isSubmitting: boolean, isUpdateMode?: boolean }> = ({ initialData, onSubmit, onBack, isSubmitting, isUpdateMode }) => (
  <div>
    <OwnerForm initialData={initialData} onSubmit={onSubmit} onBack={onBack} isSubmitting={isSubmitting} isUpdateMode={isUpdateMode} />
  </div>
);