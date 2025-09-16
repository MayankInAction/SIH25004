import React, { useState, useCallback, useEffect } from 'react';
import { AnimalData, OwnerData, AnimalResult, Registration } from '../types';
import { AnimalForm } from './AnimalForm';
import { OwnerForm } from './OwnerForm';
import { ResultsPage } from './ResultsPage';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { toBase64 } from '../utils/fileUtils';
import { identifyBreed } from '../services/geminiService';
import { SAMPLE_OWNER_DATA } from '../constants';
import { Icon } from './icons';

interface RegistrationWizardProps {
  onBackToDashboard: () => void;
  registrationToUpdate?: Registration | null;
}

const getCircleClasses = (isCompleted: boolean, isCurrent: boolean) => {
  const baseClasses = 'relative flex h-8 w-8 items-center justify-center rounded-full transition-all duration-500 ease-in-out';
  if (isCompleted) {
    return `${baseClasses} bg-accent-500 border-accent-500`;
  }
  if (isCurrent) {
    return `${baseClasses} bg-white border-2 border-accent-500 scale-110 shadow-lg`;
  }
  return `${baseClasses} bg-white border-2 border-gray-300`;
};

const Stepper: React.FC<{ currentStep: number }> = ({ currentStep }) => {
  const steps = ["Animal Count", "Animal Details", "Owner Details", "Results"];
  return (
    <nav aria-label="Progress">
      <ol role="list" className="flex items-center justify-center">
        {steps.map((stepName, stepIdx) => {
          const isCompleted = currentStep > stepIdx;
          const isCurrent = currentStep === stepIdx;

          return (
            <li key={stepName} className={`relative ${stepIdx !== steps.length - 1 ? 'pr-8 sm:pr-20' : ''}`}>
              {/* Animated Connecting Line */}
              <div className="absolute inset-0 flex items-center" aria-hidden="true">
                <div className={`h-0.5 w-full transition-colors duration-500 ease-in-out ${isCompleted ? 'bg-accent-500' : 'bg-gray-200'}`} />
              </div>
              
              {/* Animated Step Circle */}
              <div className={getCircleClasses(isCompleted, isCurrent)}>
                <Icon name="check" className={`h-5 w-5 text-white transform transition-all duration-300 ease-in-out ${isCompleted ? 'opacity-100 scale-100' : 'opacity-0 scale-50'}`} />
                <span className={`h-2.5 w-2.5 bg-accent-500 rounded-full absolute transition-opacity duration-300 ${isCurrent ? 'opacity-100 animate-pulse' : 'opacity-0'}`} aria-hidden="true" />
              </div>

              {/* Animated Step Label for Current Step */}
              <div className={`absolute top-10 left-1/2 -translate-x-1/2 w-max transition-all duration-300 ease-in-out ${isCurrent ? 'opacity-100' : 'opacity-0 -translate-y-2'}`}>
                <span className="text-sm font-semibold text-accent-600">{stepName}</span>
              </div>
            </li>
          );
        })}
      </ol>
    </nav>
  );
};


export const RegistrationWizard: React.FC<RegistrationWizardProps> = ({ onBackToDashboard, registrationToUpdate }) => {
  const isUpdateMode = !!registrationToUpdate;

  const [step, setStep] = useState(isUpdateMode ? 1 : 0);
  const [animalCount, setAnimalCount] = useState(1);
  const [animals, setAnimals] = useState<AnimalData[]>([]);
  const [owner, setOwner] = useState<OwnerData>(SAMPLE_OWNER_DATA);
  const [animalResults, setAnimalResults] = useState<AnimalResult[]>([]);
  const [registrations, setRegistrations] = useLocalStorage<Registration[]>('registrations', []);

  const [analysisPromise, setAnalysisPromise] = useState<Promise<AnimalResult[]> | null>(null);
  const [isOwnerFormSubmitting, setIsOwnerFormSubmitting] = useState(false);

  useEffect(() => {
    if (registrationToUpdate) {
      setStep(1);
      setAnimalCount(registrationToUpdate.animals.length);
      setAnimals(registrationToUpdate.animals);
      setOwner(registrationToUpdate.owner);
    }
  }, [registrationToUpdate]);


  const handleAnimalCountSubmit = (count: number) => {
    setAnimalCount(count);
    setAnimals(
      Array.from({ length: count }, (_, i) => ({
        id: `animal-${Date.now()}-${i}`,
        species: 'Cow',
        age: '',
        gender: 'Female',
        healthNotes: '',
        photos: [],
      }))
    );
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
        if (animal.age.trim() === '') {
            alert(`Please enter the age for each animal.`);
            return;
        }
    }

    const runAnalysis = async (): Promise<AnimalResult[]> => {
      return Promise.all(
        animals.map(async (animal) => {
          // In update mode, a photo File object might not exist if not re-uploaded.
          // AI analysis requires the File object to convert to base64.
          // This logic assumes either photos are re-uploaded or the original File object is still in memory.
          // A more robust solution would store base64 in localStorage, but that's a larger change.
          const validPhotos = animal.photos.filter(p => p.file);
          if (validPhotos.length === 0) {
              // If no valid file, return existing AI result to avoid re-analysis error.
              // This is a safe fallback for updating non-photo info.
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
      } else {
        const newRegistration: Registration = {
            id: `reg-${Date.now()}`,
            timestamp: new Date().toISOString(),
            owner: ownerData,
            animals: results
        };
        setRegistrations([...registrations, newRegistration]);
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
        return isUpdateMode ? null : <AnimalCountStep onSubmit={handleAnimalCountSubmit} onBack={onBackToDashboard} />;
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
        return <ResultsPage results={animalResults} owner={owner} onFinish={onBackToDashboard} />;
      default:
        return null;
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      {step < 3 && (
        <div className="bg-white p-6 rounded-xl border border-cream-200 shadow-sm">
          <Stepper currentStep={step} />
        </div>
      )}
      <div>{renderStep()}</div>
    </div>
  );
};

const AnimalCountStep: React.FC<{ onSubmit: (count: number) => void, onBack: () => void }> = ({ onSubmit, onBack }) => {
  const [count, setCount] = useState(1);

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
      <p className="text-secondary-700 mb-6">How many animals are you registering for this owner?</p>
      
      <div className="flex items-center justify-center space-x-4 my-8">
        <button 
          onClick={() => adjustCount(-1)} 
          disabled={count <= 1}
          className="w-16 h-16 bg-cream-100 text-secondary-700 rounded-full text-4xl font-light flex items-center justify-center hover:bg-cream-200 disabled:bg-cream-100 disabled:text-gray-400 disabled:cursor-not-allowed transition-transform duration-150 active:scale-95"
          aria-label="Decrease animal count"
        >
          -
        </button>
        <span className="text-7xl font-bold text-primary-900 w-28 text-center tabular-nums">{count}</span>
        <button 
          onClick={() => adjustCount(1)}
          disabled={count >= 50}
          className="w-16 h-16 bg-cream-100 text-secondary-700 rounded-full text-4xl font-light flex items-center justify-center hover:bg-cream-200 disabled:bg-cream-100 disabled:text-gray-400 disabled:cursor-not-allowed transition-transform duration-150 active:scale-95"
          aria-label="Increase animal count"
        >
          +
        </button>
      </div>

      <p className="text-sm text-gray-500 mb-8 -mt-4">For performance, you can register up to 50 animals in a single batch.</p>
      <div className="flex justify-center space-x-4">
        <button onClick={onBack} className="px-6 py-2 border border-gray-300 rounded-md text-secondary-700 font-semibold hover:bg-gray-50 transition-transform duration-150 active:scale-95">Back</button>
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
      <button onClick={onBack} className="px-6 py-2 border border-gray-300 rounded-md text-secondary-700 font-semibold hover:bg-gray-50 transition-transform duration-150 active:scale-95">Back</button>
      <button onClick={onSubmit} className="px-8 py-2 bg-accent-500 text-white font-semibold rounded-md hover:bg-accent-600 shadow-sm transition-transform duration-150 active:scale-95">Next: Owner Details</button>
    </div>
  </div>
);

const OwnerDetailsStep: React.FC<{ initialData: OwnerData, onSubmit: (data: OwnerData) => void, onBack: () => void, isSubmitting: boolean, isUpdateMode?: boolean }> = ({ initialData, onSubmit, onBack, isSubmitting, isUpdateMode }) => (
  <div>
    <OwnerForm initialData={initialData} onSubmit={onSubmit} onBack={onBack} isSubmitting={isSubmitting} isUpdateMode={isUpdateMode} />
  </div>
);