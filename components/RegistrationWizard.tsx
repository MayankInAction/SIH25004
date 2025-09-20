import React, { useState, useCallback, useEffect } from 'react';
import { AnimalData, OwnerData, AnimalResult, Registration, Species } from '../types';
// FIX: Import AnimalForm to be used in the new AnimalDetailsStep component.
import { AnimalForm } from './AnimalForm';
// FIX: Import OwnerForm to be used in the new OwnerDetailsStep component.
import { OwnerForm } from './OwnerForm';
import { ResultsPage } from './ResultsPage';
import { toBase64 } from '../utils/fileUtils';
import { identifyBreed } from '../services/geminiService';
import { EMPTY_OWNER_DATA } from '../constants';
import { Icon } from './icons';
import { useLanguage } from '../contexts/LanguageContext';

interface RegistrationWizardProps {
  onBackToDashboard: () => void;
  registrationToUpdate?: Registration | null;
  onViewReport: (registration: Registration) => void;
  onComplete: (registration: Registration) => void;
}

const Stepper: React.FC<{ currentStep: number }> = ({ currentStep }) => {
  const { t } = useLanguage();
  const steps = [
      t('wizard.steps.count'), 
      t('wizard.steps.animal'), 
      t('wizard.steps.owner'), 
      t('wizard.steps.review'), 
      t('wizard.steps.results')
  ];
  const progressPercentage = currentStep >= steps.length - 1 
    ? 100 
    : (100 / (steps.length - 1)) * currentStep;

  return (
    <nav aria-label="Progress" className="relative">
      {/* Backing Line */}
      <div className="absolute top-4 md:top-5 left-0 h-1 w-full bg-cream-200 rounded-full" aria-hidden="true" />
      {/* Progress Line */}
      <div 
        className="absolute top-4 md:top-5 left-0 h-1 bg-accent-500 transition-all duration-500 ease-in-out rounded-full" 
        style={{ width: `${progressPercentage}%` }}
        aria-hidden="true" 
      />
      <ol role="list" className="flex items-start justify-between">
        {steps.map((stepName, stepIdx) => {
          const isCompleted = currentStep > stepIdx;
          const isCurrent = currentStep === stepIdx;

          return (
            <li key={stepName} className="flex flex-col items-center text-center z-10 w-16 md:w-24">
              <div className={`
                relative flex h-8 w-8 md:h-10 md:w-10 items-center justify-center rounded-full font-bold text-lg
                transition-all duration-500 ease-in-out
                ${isCompleted ? 'bg-accent-500 border-2 border-accent-500' : ''}
                ${isCurrent ? 'bg-white border-2 border-accent-500 scale-110 shadow-lg' : ''}
                ${!isCompleted && !isCurrent ? 'bg-white border-2 border-gray-300' : ''}
              `}>
                {/* Checkmark for completed steps */}
                <Icon name="check" className={`
                  h-5 w-5 md:h-6 md:w-6 text-white transform transition-all duration-300 ease-in-out
                  ${isCompleted ? 'opacity-100 scale-100' : 'opacity-0 scale-50'}
                `} />
                
                {/* Step Number for current and future steps */}
                <span className={`
                  absolute transition-opacity duration-300 text-base md:text-lg
                  ${isCompleted ? 'opacity-0' : 'opacity-100'}
                  ${isCurrent ? 'text-accent-600' : 'text-gray-400'}
                `}>
                  {stepIdx + 1}
                </span>
              </div>
              <p className={`
                mt-2 text-xs md:text-sm transition-colors duration-300 hidden md:block
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

// FIX: This component is created to resolve the "Cannot find name 'AnimalDetailsStep'" error.
interface AnimalDetailsStepProps {
  animals: AnimalData[];
  onUpdate: (index: number, dataOrFn: AnimalData | ((prev: AnimalData) => AnimalData)) => void;
  onSubmit: () => void;
  onBack: () => void;
}

const AnimalDetailsStep: React.FC<AnimalDetailsStepProps> = ({ animals, onUpdate, onSubmit, onBack }) => {
  const { t } = useLanguage();
  return (
    <div className="space-y-6">
      {animals.map((animal, index) => (
        <AnimalForm
          key={animal.id}
          index={index}
          animalData={animal}
          onUpdate={onUpdate}
        />
      ))}
      <div className="flex justify-between mt-8 pt-6 border-t border-cream-200">
        <button type="button" onClick={onBack} className="px-6 py-2 border border-gray-300 rounded-md text-primary-700 font-semibold hover:bg-gray-50 transition-transform duration-150 active:scale-95">
          {t('buttons.back')}
        </button>
        <button type="button" onClick={onSubmit} className="px-8 py-2 bg-accent-500 text-white font-semibold rounded-md hover:bg-accent-600 shadow-sm flex items-center justify-center w-56 transition-transform duration-150 active:scale-95">
          {t('buttons.nextOwner')}
        </button>
      </div>
    </div>
  );
};

// FIX: This component is created to resolve the "Cannot find name 'OwnerDetailsStep'" error.
interface OwnerDetailsStepProps {
  initialData: OwnerData;
  onSubmit: (data: OwnerData) => void;
  onBack: () => void;
  isSubmitting: boolean;
  isUpdateMode?: boolean;
}

const OwnerDetailsStep: React.FC<OwnerDetailsStepProps> = (props) => {
  return <OwnerForm {...props} />;
};


export const RegistrationWizard: React.FC<RegistrationWizardProps> = ({ onBackToDashboard, registrationToUpdate, onViewReport, onComplete }) => {
  const isUpdateMode = !!registrationToUpdate;
  const { t } = useLanguage();

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
  const [completedRegistration, setCompletedRegistration] = useState<Registration | null>(null);

  const [analysisPromise, setAnalysisPromise] = useState<Promise<AnimalResult[]> | null>(null);
  const [isOwnerFormSubmitting, setIsOwnerFormSubmitting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const handleAnimalCountSubmit = (newCount: number) => {
    const currentCount = animals.length;

    if (newCount < currentCount) {
        const animalsToBeRemoved = animals.slice(newCount);
        const hasData = animalsToBeRemoved.some(
            animal => animal.photos.length > 0 || animal.ageValue.trim() !== ''
        );
        
        if (hasData) {
            const confirmation = window.confirm(
                t('wizard.count.confirmRemove', { currentCount, newCount, diff: currentCount - newCount })
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
            alert(t('wizard.errors.noPhoto', { index: index + 1 }));
            return;
        }
        if (!animal.species) {
            alert(t('wizard.errors.noSpecies', { index: index + 1 }));
            return;
        }
        if (!animal.sex) {
            alert(t('wizard.errors.noSex', { index: index + 1 }));
            return;
        }
        if (animal.ageValue.trim() === '') {
            alert(t('wizard.errors.noAge', { index: index + 1 }));
            return;
        }
        const age = parseFloat(animal.ageValue);
        if (isNaN(age)) {
            alert(t('wizard.errors.invalidAge', { index: index + 1 }));
            return;
        }

        if (animal.ageUnit === 'Years') {
            if (age < 0 || age > 20) {
                alert(t('wizard.errors.ageRangeYears', { index: index + 1 }));
                return;
            }
        } else { // 'Months'
            if (age < 6 || age > 12) {
                alert(t('wizard.errors.ageRangeMonths', { index: index + 1 }));
                return;
            }
        }
    }

    const runAnalysis = async (): Promise<AnimalResult[]> => {
      return Promise.all(
        animals.map(async (animal) => {
          const validPhotos = animal.photos.filter(p => p.file);
          if (validPhotos.length === 0) {
              return (animal as AnimalResult).aiResult ? (animal as AnimalResult) : { ...animal, aiResult: { error: t('wizard.errors.noFile'), breedName: 'Unknown', confidence: 0, milkYieldPotential: '', careNotes: '', reasoning: '' } };
          }

          const imagePayload = await Promise.all(
            validPhotos.map(async (p) => ({
              mimeType: p.file.type,
              data: await toBase64(p.file),
            }))
          );
          const aiResult = await identifyBreed(imagePayload, animal.species as Species);
          return { ...animal, aiResult };
        })
      );
    };
    
    setAnalysisPromise(runAnalysis());
    setStep(2);
  };
  
    const saveRegistration = (finalAnimalResults: AnimalResult[], currentOwnerData?: OwnerData) => {
      setIsSaving(true);
      
      const ownerToSave = currentOwnerData || owner;

      let registrationToSave: Registration;
      
      if (isUpdateMode && registrationToUpdate) {
        registrationToSave = {
          ...registrationToUpdate,
          owner: ownerToSave,
          animals: finalAnimalResults,
        };
      } else {
        registrationToSave = {
            id: `reg-${Date.now()}`,
            timestamp: new Date().toISOString(),
            owner: ownerToSave,
            animals: finalAnimalResults
        };
      }
      
      onComplete(registrationToSave);
      
      setCompletedRegistration(registrationToSave);
      setAnimalResults(finalAnimalResults);
      setIsSaving(false);
      setStep(4);
  };


  const handleOwnerDetailsSubmit = async (ownerData: OwnerData) => {
    if (!analysisPromise) {
      console.error("Analysis promise not found. This should not happen.");
      alert(t('wizard.errors.critical'));
      return;
    }
    
    setIsOwnerFormSubmitting(true);
    setOwner(ownerData);

    try {
      const results = await analysisPromise;
      setAnimalResults(results);

      const needsResolution = results.some(
        r => !r.aiResult.error && r.aiResult.confidence < 75 && r.aiResult.topCandidates && r.aiResult.topCandidates.length > 0
      );

      if (needsResolution) {
        setStep(3);
      } else {
        saveRegistration(results, ownerData);
      }
      
    } catch (error) {
       console.error("Background AI analysis or save failed:", error);
       alert(t('wizard.errors.analysisFailed'));
    } finally {
        setIsOwnerFormSubmitting(false);
    }
  };

  const handleDoubtResolutionSubmit = (finalizedResults: AnimalResult[]) => {
      saveRegistration(finalizedResults);
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
        return <DoubtResolutionStep
                  results={animalResults}
                  onBack={() => setStep(2)}
                  onSubmit={handleDoubtResolutionSubmit}
                  isSaving={isSaving}
                />;
      case 4:
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
    <div className="max-w-6xl mx-auto space-y-6 md:space-y-8">
      {step < 4 && (
        <div className="bg-white p-4 pt-6 pb-8 md:p-8 md:pt-10 md:pb-16 rounded-xl border border-cream-200 shadow-sm">
          <Stepper currentStep={step} />
        </div>
      )}
      <div>{renderStep()}</div>
    </div>
  );
};

interface DoubtResolutionStepProps {
  results: AnimalResult[];
  onBack: () => void;
  onSubmit: (finalizedResults: AnimalResult[]) => void;
  isSaving: boolean;
}

const Spinner: React.FC = () => (
    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
    </svg>
);

const DoubtResolutionStep: React.FC<DoubtResolutionStepProps> = ({ results, onBack, onSubmit, isSaving }) => {
    const [selections, setSelections] = useState<Record<string, string>>({});
    const { t } = useLanguage();

    const animalsToReview = results.filter(r => 
        !r.aiResult.error && 
        r.aiResult.confidence < 75 && 
        r.aiResult.topCandidates && 
        r.aiResult.topCandidates.length > 0
    );

    const allResolved = animalsToReview.every(animal => !!selections[animal.id]);

    useEffect(() => {
        const initialSelections: Record<string, string> = {};
        animalsToReview.forEach(animal => {
            initialSelections[animal.id] = animal.aiResult.breedName;
        });
        setSelections(initialSelections);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [results]);

    const handleSelectBreed = (animalId: string, breedName: string) => {
        setSelections(prev => ({ ...prev, [animalId]: breedName }));
    };

    const handleSubmit = () => {
        if (!allResolved) return;
        
        const finalizedResults = results.map(originalResult => {
            if (selections[originalResult.id]) {
                const updatedAiResult = { 
                    ...originalResult.aiResult, 
                    breedName: selections[originalResult.id],
                    isUserVerified: true,
                    reasoning: `Originally low confidence (${originalResult.aiResult.confidence}%), user selected '${selections[originalResult.id]}'. Original AI reasoning: ${originalResult.aiResult.reasoning}`
                };
                return { ...originalResult, aiResult: updatedAiResult };
            }
            return originalResult;
        });

        onSubmit(finalizedResults);
    };

    if (animalsToReview.length === 0) {
       useEffect(() => {
            onSubmit(results);
       // eslint-disable-next-line react-hooks/exhaustive-deps
       }, []);
       return <div className="text-center p-8">{t('wizard.review.none')}</div>;
    }

    return (
        <div className="space-y-6">
            <div className="bg-white p-6 sm:p-8 rounded-xl shadow-sm text-center border border-accent-yellow-200">
                <Icon name="help-circle" className="w-12 h-12 mx-auto text-accent-yellow-500"/>
                <h2 className="text-xl sm:text-2xl font-bold mt-4 text-primary-900">{t('wizard.review.title')}</h2>
                <p className="text-primary-700 mt-2 max-w-2xl mx-auto">
                    {t('wizard.review.subtitle', { count: animalsToReview.length })}
                </p>
            </div>
            
            {animalsToReview.map((animal, index) => (
                <div key={animal.id} className="bg-white p-6 rounded-xl shadow-sm border border-cream-200">
                    <h3 className="text-xl font-bold mb-4 text-primary-900">{t('wizard.review.animalTitle', { index: results.findIndex(r => r.id === animal.id) + 1 })}</h3>
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
                        <div className="md:col-span-4">
                            <img 
                                src={animal.photos[0]?.previewUrl} 
                                alt={`Animal ${index+1}`} 
                                className="w-full h-auto object-cover rounded-lg border-2 border-cream-200"
                            />
                        </div>
                        <div className="md:col-span-8">
                            <p className="text-sm text-primary-700 mb-3">{t('wizard.review.instruction')}</p>
                            <div className="space-y-3">
                                {animal.aiResult.topCandidates?.map(candidate => (
                                    <button 
                                        key={candidate.breedName}
                                        onClick={() => handleSelectBreed(animal.id, candidate.breedName)}
                                        className={`w-full flex justify-between items-center text-left p-4 border-2 rounded-lg transition-all duration-200
                                            ${selections[animal.id] === candidate.breedName 
                                                ? 'border-accent-500 bg-accent-50 ring-2 ring-accent-200' 
                                                : 'border-cream-200 bg-white hover:border-accent-400'
                                            }`}
                                    >
                                        <div>
                                            <p className="font-bold text-lg text-primary-900">{candidate.breedName}</p>
                                            <p className="text-sm font-medium text-primary-700">{t('wizard.review.confidence', { confidence: candidate.confidencePercentage })}</p>
                                        </div>
                                        {selections[animal.id] === candidate.breedName && (
                                            <div className="w-8 h-8 flex items-center justify-center bg-accent-500 rounded-full text-white">
                                                <Icon name="check" className="w-5 h-5"/>
                                            </div>
                                        )}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            ))}

            <div className="flex justify-between mt-8">
                <button 
                    onClick={onBack} 
                    className="px-6 py-2 border border-gray-300 rounded-md text-primary-700 font-semibold hover:bg-gray-50 transition-transform duration-150 active:scale-95 disabled:opacity-50"
                    disabled={isSaving}
                >
                    {t('buttons.back')}
                </button>
                <button 
                    onClick={handleSubmit} 
                    disabled={!allResolved || isSaving}
                    className="px-8 py-2 bg-accent-500 text-white font-semibold rounded-md hover:bg-accent-600 shadow-sm flex items-center justify-center w-60 disabled:bg-accent-300 disabled:cursor-not-allowed transition-transform duration-150 active:scale-95"
                >
                    {isSaving ? <><Spinner />{t('buttons.saving')}</> : t('buttons.confirmFinish')}
                </button>
            </div>
        </div>
    );
};


const AnimalCountStep: React.FC<{ onSubmit: (count: number) => void, onBack: () => void, initialCount: number }> = ({ onSubmit, onBack, initialCount }) => {
  const [count, setCount] = useState<number | ''>(initialCount);
  const { t } = useLanguage();
  
  useEffect(() => {
    setCount(initialCount);
  }, [initialCount]);

  const adjustCount = (amount: number) => {
    setCount(prev => {
        const currentVal = Number(prev) || 1;
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

      if (/^\d*$/.test(value)) {
          let num = parseInt(value, 10);
          if (!isNaN(num)) {
              if (num > 50) num = 50;
              if (num < 1) { 
              } else {
                setCount(num);
              }
          }
      }
  };

  const handleBlur = () => {
      let value = Number(count);
      if (isNaN(value) || value < 1) {
          setCount(1);
      }
  };

  const handleSubmit = () => {
    const finalCount = Number(count);
    if (finalCount >= 1 && finalCount <= 50) {
        onSubmit(finalCount);
    } else {
        onSubmit(1);
    }
  };

  return (
    <div className="bg-white p-6 sm:p-8 rounded-xl shadow-sm text-center border border-cream-200">
      <h2 className="text-2xl font-bold mb-2 text-primary-900">{t('wizard.count.title')}</h2>
      <p className="text-primary-700 mb-6">{t('wizard.count.subtitle')}</p>
      
      <div className="flex items-center justify-center space-x-2 sm:space-x-4 my-8">
        <button 
          onClick={() => adjustCount(-1)} 
          disabled={Number(count) <= 1}
          className="w-12 h-12 sm:w-16 sm:h-16 bg-cream-100 text-primary-700 rounded-full text-3xl sm:text-4xl font-light flex items-center justify-center hover:bg-cream-200 disabled:bg-cream-100 disabled:text-gray-400 disabled:cursor-not-allowed transition-transform duration-150 active:scale-95"
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
          className="text-6xl sm:text-7xl font-bold text-primary-900 w-24 sm:w-28 text-center bg-transparent border-none focus:ring-0 p-0 tabular-nums appearance-none"
          aria-label="Number of animals"
        />

        <button 
          onClick={() => adjustCount(1)}
          disabled={Number(count) >= 50}
          className="w-12 h-12 sm:w-16 sm:h-16 bg-cream-100 text-primary-700 rounded-full text-3xl sm:text-4xl font-light flex items-center justify-center hover:bg-cream-200 disabled:bg-cream-100 disabled:text-gray-400 disabled:cursor-not-allowed transition-transform duration-150 active:scale-95"
          aria-label="Increase animal count"
        >
          +
        </button>
      </div>

      <div className="flex justify-between mt-8">
        <button 
          onClick={onBack} 
          className="px-6 py-2 border border-gray-300 rounded-md text-primary-700 font-semibold hover:bg-gray-50 transition-transform duration-150 active:scale-95"
        >
          {t('buttons.back')}
        </button>
        <button 
          onClick={handleSubmit} 
          disabled={!count || Number(count) < 1 || Number(count) > 50}
          className="px-8 py-2 bg-accent-500 text-white font-semibold rounded-md hover:bg-accent-600 shadow-sm disabled:bg-accent-300 disabled:cursor-not-allowed transition-transform duration-150 active:scale-95"
        >
          {t('buttons.next')}
        </button>
      </div>
       <p className="text-xs text-gray-500 mt-6 max-w-md mx-auto">{t('wizard.count.note')}</p>
    </div>
  );
};
