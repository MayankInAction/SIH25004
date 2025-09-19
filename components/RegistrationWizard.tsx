

import React, { useState, useCallback, useEffect } from 'react';
import { AnimalData, OwnerData, AnimalResult, Registration, Species } from '../types';
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

const Stepper: React.FC<{ currentStep: number }> = ({ currentStep }) => {
  const steps = ["Animal Count", "Animal Details", "Owner Details", "Results"];
  const progressPercentage = currentStep >= steps.length - 1 
    ? 100 
    : (100 / (steps.length - 1)) * currentStep;

  return (
    <nav aria-label="Progress" className="relative">
      {/* Backing Line */}
      <div className="absolute top-5 left-0 h-1 w-full bg-cream-200 rounded-full" aria-hidden="true" />
      {/* Progress Line */}
      <div 
        className="absolute top-5 left-0 h-1 bg-accent-500 transition-all duration-500 ease-in-out rounded-full" 
        style={{ width: `${progressPercentage}%` }}
        aria-hidden="true" 
      />
      <ol role="list" className="flex items-start justify-between">
        {steps.map((stepName, stepIdx) => {
          const isCompleted = currentStep > stepIdx;
          const isCurrent = currentStep === stepIdx;

          return (
            <li key={stepName} className="flex flex-col items-center text-center z-10 w-24">
              <div className={`
                relative flex h-10 w-10 items-center justify-center rounded-full font-bold text-lg
                transition-all duration-500 ease-in-out
                ${isCompleted ? 'bg-accent-500 border-2 border-accent-500' : ''}
                ${isCurrent ? 'bg-white border-2 border-accent-500 scale-110 shadow-lg' : ''}
                ${!isCompleted && !isCurrent ? 'bg-white border-2 border-gray-300' : ''}
              `}>
                {/* Checkmark for completed steps */}
                <Icon name="check" className={`
                  h-6 w-6 text-white transform transition-all duration-300 ease-in-out
                  ${isCompleted ? 'opacity-100 scale-100' : 'opacity-0 scale-50'}
                `} />
                
                {/* Step Number for current and future steps */}
                <span className={`
                  absolute transition-opacity duration-300
                  ${isCompleted ? 'opacity-0' : 'opacity-100'}
                  ${isCurrent ? 'text-accent-600' : 'text-gray-400'}
                `}>
                  {stepIdx + 1}
                </span>
              </div>
              <p className={`
                mt-3 text-sm transition-colors duration-300
                ${isCurrent ? 'text-accent-600 font-bold' : ''}
                ${isCompleted ? 'text-primary-800 font-semibold' : ''}
                ${!isCompleted && !isCurrent ? 'text-gray-500' : ''}
              `}>
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
    species: '',
    ageValue: '',
    ageUnit: 'Years',
    sex: '',
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
            animal => animal.photos.length > 0 || animal.ageValue.trim() !== ''
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
    for (const [index, animal] of animals.entries()) {
        if (animal.photos.length === 0) {
            alert(`Please upload at least one photo for animal #${index + 1}.`);
            return;
        }
        if (!animal.species) {
            alert(`Please select a species for animal #${index + 1}.`);
            return;
        }
        if (!animal.sex) {
            alert(`Please select a sex for animal #${index + 1}.`);
            return;
        }
        if (animal.ageValue.trim() === '') {
            alert(`Please enter the age for animal #${index + 1}.`);
            return;
        }
        const age = parseFloat(animal.ageValue);
        if (isNaN(age)) {
            alert(`Invalid age for Animal #${index + 1}. Age must be a number.`);
            return;
        }

        if (animal.ageUnit === 'Years') {
            if (age < 0 || age > 20) {
                alert(`Invalid age for Animal #${index + 1}. Age must be between 0 and 20 years.`);
                return;
            }
        } else { // 'Months'
            if (age < 6 || age > 12) {
                alert(`Invalid age for Animal #${index + 1}. Age must be between 6 and 12 months for young animals.`);
                return;
            }
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
          // FIX: Cast `animal.species` to `Species` as it has been validated in the loop above.
          const aiResult = await identifyBreed(imagePayload, animal.species as Species);
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
  // Allow string for temporary empty input state
  const [count, setCount] = useState<number | ''>(initialCount);
  
  useEffect(() => {
    setCount(initialCount);
  }, [initialCount]);

  const adjustCount = (amount: number) => {
    setCount(prev => {
        const currentVal = Number(prev) || 1; // Default to 1 if empty
        const newCount = currentVal + amount;
        if (newCount >= 1 && newCount <= 50) {
            return newCount;
        }
        return prev;
    });
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value;
      
      if (value === '') {
          setCount('');
          return;
      }

      // Only allow digits
      if (/^\d*$/.test(value)) {
          let num = parseInt(value, 10);
          if (!isNaN(num)) {
              if (num > 50) num = 50; // Clamp at upper bound
              if (num < 1) { 
                // Don't set 0, allow user to clear the field which is handled above
              } else {
                setCount(num);
              }
          }
      }
  };

  const handleBlur = () => {
      let value = Number(count);
      if (isNaN(value) || value < 1) {
          setCount(1); // Set to min on blur if invalid or below min
      }
  };

  const handleSubmit = () => {
    const finalCount = Number(count);
    if (finalCount >= 1 && finalCount <= 50) {
        onSubmit(finalCount);
    } else {
        // Fallback for invalid state, though onBlur should prevent this
        onSubmit(1);
    }
  };

  return (
    <div className="bg-white p-8 rounded-xl shadow-sm text-center border border-cream-200">
      <h2 className="text-2xl font-bold mb-2 text-primary-900">New Registration Batch</h2>
      <p className="text-primary-700 mb-6">How many animals are you registering for this owner?</p>
      
      <div className="flex items-center justify-center space-x-4 my-8">
        <button 
          onClick={() => adjustCount(-1)} 
          disabled={Number(count) <= 1}
          className="w-16 h-16 bg-cream-100 text-primary-700 rounded-full text-4xl font-light flex items-center justify-center hover:bg-cream-200 disabled:bg-cream-100 disabled:text-gray-400 disabled:cursor-not-allowed transition-transform duration-150 active:scale-95"
          aria-label="Decrease animal count"
        >
          -
        </button>

        <input
          type="text"
          inputMode="numeric"
          pattern="\d*"
          value={count}
          onChange={handleInputChange}
          onBlur={handleBlur}
          className="text-7xl font-bold text-primary-900 w-28 text-center bg-transparent border-none focus:ring-0 p-0 tabular-nums appearance-none"
          aria-label="Number of animals"
        />

        <button 
          onClick={() => adjustCount(1)}
          disabled={Number(count) >= 50}
          className="w-16 h-16 bg-cream-100 text-primary-700 rounded-full text-4xl font-light flex items-center justify-center hover:bg-cream-200 disabled:bg-cream-100 disabled:text-gray-400 disabled:cursor-not-allowed transition-transform duration-150 active:scale-95"
          aria-label="Increase animal count"
        >
          +
        </button>
      </div>

      <p className="text-sm text-gray-500 mb-8 -mt-4">For performance, you can register up to 50 animals in a single batch.</p>
      <div className="flex justify-center space-x-4">
        <button onClick={onBack} className="px-6 py-2 border border-gray-300 rounded-md text-primary-700 font-semibold hover:bg-gray-50 transition-transform duration-150 active:scale-95">Back</button>
        <button onClick={handleSubmit} className="px-8 py-2 bg-accent-500 text-white font-semibold rounded-md hover:bg-accent-600 shadow-sm transition-transform duration-150 active:scale-95">Next</button>
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