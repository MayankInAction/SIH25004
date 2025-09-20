
import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Species, PhotoFile, BreedIdentificationResult } from '../types';
import { Icon } from './icons';
import { toBase64 } from '../utils/fileUtils';
import { identifyBreed } from '../services/geminiService';
import { CameraModal } from './CameraModal';
import { ANALYSIS_MESSAGES } from '../constants';
import { useLanguage } from '../contexts/LanguageContext';

type Step = 'input' | 'loading' | 'result';

const LoadingState: React.FC = () => {
    const [messageIndex, setMessageIndex] = useState(0);
    const { t } = useLanguage();

    useEffect(() => {
        const interval = setInterval(() => {
            setMessageIndex(prevIndex => (prevIndex + 1) % ANALYSIS_MESSAGES.length);
        }, 2500);
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="text-center max-w-lg mx-auto">
            <div className="relative inline-flex items-center justify-center mb-6">
                <div className="absolute w-24 h-24 bg-secondary-200 rounded-full animate-ping"></div>
                <div className="relative bg-secondary-600 text-white p-5 rounded-full">
                    <Icon name="ai-sparkles" className="w-12 h-12" />
                </div>
            </div>
            <h2 className="text-3xl font-bold text-primary-800 mb-2">{t('generic.analysisInProgress')}</h2>
            <p className="text-primary-700 mb-6">{t('generic.analysisSub')}</p>
            <div className="w-full bg-cream-100 p-4 rounded-md text-center transition-all duration-500">
                <p className="text-primary-800 font-medium">{ANALYSIS_MESSAGES[messageIndex]}</p>
            </div>
        </div>
    );
};

const ConfidenceIndicator: React.FC<{ score: number }> = ({ score }) => {
  const { t } = useLanguage();
  const getColor = () => {
    if (score >= 85) return 'bg-green-100 text-green-800 border-green-200';
    if (score >= 75) return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    return 'bg-red-100 text-red-800 border-red-200';
  };

  return (
    <div className={`px-2.5 py-1 rounded-full text-sm font-medium border flex items-center gap-1.5 ${getColor()}`}>
      <span>{score}% {t('results.confidence')}</span>
    </div>
  );
};


const ResultState: React.FC<{
    result: BreedIdentificationResult;
    photo: PhotoFile;
    onReset: () => void;
}> = ({ result, photo, onReset }) => {
    const { error, breedName, confidence, reasoning, milkYieldPotential, careNotes, topCandidates } = result;
    const { t } = useLanguage();

    return (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-cream-200">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div>
                    <div className="mb-4 overflow-hidden rounded-lg aspect-video bg-cream-100 flex items-center justify-center">
                        <img src={photo.previewUrl} alt="Analyzed animal" className="w-full h-full object-cover" />
                    </div>
                     <div className="mt-4">
                        <button
                            onClick={onReset}
                            className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-primary-800 text-white font-semibold rounded-lg shadow-md hover:bg-primary-700 transition-transform duration-150 active:scale-95"
                        >
                            <Icon name="refresh" className="w-5 h-5" />
                            {t('quickId.identifyAnother')}
                        </button>
                    </div>
                </div>

                <div>
                    {error ? (
                        <div className="bg-red-50 border-l-4 border-red-400 p-4 rounded-r-lg h-full flex flex-col justify-center">
                            <h3 className="text-lg font-bold text-red-800">{t('results.analysisFailed')}</h3>
                            <p className="text-red-700 mt-1">{error}</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <div className="flex items-center space-x-3">
                                <h3 className="text-2xl font-bold text-primary-800">{breedName}</h3>
                                <ConfidenceIndicator score={confidence} />
                            </div>
                            <div>
                                <h4 className="font-semibold text-primary-800">{t('results.aiReasoning')}</h4>
                                <p className="text-primary-900">{reasoning}</p>
                            </div>
                            <div>
                                <h4 className="font-semibold text-primary-800">{t('results.milkYield')}</h4>
                                <p className="text-primary-900">{milkYieldPotential}</p>
                            </div>
                            <div>
                                <h4 className="font-semibold text-primary-800">{t('results.careNotes')}</h4>
                                <p className="text-primary-900">{careNotes}</p>
                            </div>

                            {confidence < 75 && topCandidates && topCandidates.length > 0 && (
                                <div className="pt-4 mt-4 border-t border-cream-200">
                                    <h4 className="font-bold text-primary-800 mb-2">{t('results.lowConfidence')}</h4>
                                    <ul className="space-y-2">
                                        {topCandidates.map(candidate => (
                                            <li key={candidate.breedName} className="p-3 bg-cream-50 border border-cream-200 rounded-md flex justify-between items-center">
                                                <span className="font-semibold text-primary-800">{candidate.breedName}</span>
                                                <span className="text-sm font-medium text-primary-700">{candidate.confidencePercentage}%</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};


const InputState: React.FC<{
    onIdentify: (photo: PhotoFile, species: Species) => void;
}> = ({ onIdentify }) => {
    const [photo, setPhoto] = useState<PhotoFile | null>(null);
    const [species, setSpecies] = useState<Species | ''>('');
    const [error, setError] = useState<string | null>(null);
    const [isCameraOpen, setIsCameraOpen] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const { t } = useLanguage();

    const handlePhotoChange = (files: File[]) => {
        if (files.length > 0) {
            const file = files[0];
            setPhoto({
                id: `${file.name}-${Date.now()}`,
                file,
                previewUrl: URL.createObjectURL(file),
            });
        }
    };

    const handleCapture = useCallback((file: File) => {
        handlePhotoChange([file]);
        setIsCameraOpen(false);
    }, []);

    const handleRemovePhoto = () => {
        if (photo) {
            URL.revokeObjectURL(photo.previewUrl);
            setPhoto(null);
        }
    };
    
    const handleIdentifyClick = () => {
        if (!photo) {
            setError(t('quickId.errors.noPhoto'));
            return;
        }
        if (!species) {
            setError(t('quickId.errors.noSpecies'));
            return;
        }
        setError(null);
        onIdentify(photo, species);
    };

    return (
        <div className="max-w-lg mx-auto bg-white p-8 rounded-xl shadow-sm border border-cream-200">
            <div className="text-center mb-6">
                <h2 className="text-2xl font-bold text-primary-900">{t('quickId.title')}</h2>
                <p className="text-primary-700 mt-1">{t('quickId.subtitle')}</p>
            </div>
            
            <div className="space-y-6">
                <div>
                    <label className="block text-sm font-medium text-primary-800 mb-2">{t('quickId.step1')}</label>
                    {photo ? (
                        <div className="relative group">
                            <img src={photo.previewUrl} alt="Animal preview" className="w-full h-auto object-cover rounded-lg"/>
                            <button onClick={handleRemovePhoto} className="absolute top-2 right-2 bg-red-600/80 text-white rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600 focus:opacity-100">
                                <Icon name="trash" className="w-4 h-4" />
                            </button>
                        </div>
                    ) : (
                        <div className="bg-cream-50 p-4 rounded-lg border-2 border-dashed border-cream-200 aspect-video flex flex-col justify-center items-center text-center">
                            <Icon name="camera" className="mx-auto w-12 h-12 text-gray-400"/>
                            <div className="flex items-center justify-center gap-4 mt-4">
                                <button type="button" onClick={() => fileInputRef.current?.click()} className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-md text-sm font-semibold text-primary-800 hover:bg-gray-100">
                                    <Icon name="upload" className="w-5 h-5"/> {t('buttons.upload')}
                                </button>
                                <button type="button" onClick={() => setIsCameraOpen(true)} className="flex items-center gap-2 px-4 py-2 bg-primary-900 border border-transparent rounded-md text-sm font-semibold text-white hover:bg-primary-800">
                                    <Icon name="camera" className="w-5 h-5"/> {t('buttons.capture')}
                                </button>
                            </div>
                        </div>
                    )}
                     <input ref={fileInputRef} type="file" accept="image/*" onChange={(e) => e.target.files && handlePhotoChange(Array.from(e.target.files))} className="hidden" />
                </div>
                <div>
                    <label htmlFor="species-select" className="block text-sm font-medium text-primary-800">{t('quickId.step2')}</label>
                    <select id="species-select" name="species" value={species} onChange={e => setSpecies(e.target.value as Species)} className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-accent-500 focus:border-accent-500 bg-white text-gray-900">
                        <option value="" disabled>{t('animalForm.chooseSpecies')}</option>
                        <option value="Cattle">{t('species.cattle')}</option>
                        <option value="Buffalo">{t('species.buffalo')}</option>
                    </select>
                </div>
                 {error && <p className="text-sm text-red-600 text-center">{error}</p>}
                <button
                    onClick={handleIdentifyClick}
                    className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-accent-500 text-white font-semibold rounded-lg shadow-md hover:bg-accent-600 transition-transform duration-150 active:scale-95"
                >
                    <Icon name="ai-sparkles" className="w-5 h-5" />
                    {t('quickId.identifyButton')}
                </button>
            </div>
            <CameraModal isOpen={isCameraOpen} onClose={() => setIsCameraOpen(false)} onCapture={handleCapture} />
        </div>
    );
};


export const QuickIdTool: React.FC<{ onBackToDashboard: () => void }> = ({ onBackToDashboard }) => {
    const [step, setStep] = useState<Step>('input');
    const [photo, setPhoto] = useState<PhotoFile | null>(null);
    const [result, setResult] = useState<BreedIdentificationResult | null>(null);
    const { t } = useLanguage();
    
    const handleIdentify = async (photoFile: PhotoFile, species: Species) => {
        setStep('loading');
        setPhoto(photoFile);
        try {
            const base64Data = await toBase64(photoFile.file);
            const imagePayload = [{
                mimeType: photoFile.file.type,
                data: base64Data
            }];
            const aiResult = await identifyBreed(imagePayload, species);
            setResult(aiResult);

        } catch (err) {
            console.error("Identification failed:", err);
            setResult({
                error: "An unexpected error occurred during analysis. Please try again.",
                breedName: "Unknown",
                confidence: 0,
                milkYieldPotential: "N/A",
                careNotes: "N/A",
                reasoning: "N/A",
            });
        }
        setStep('result');
    };

    const handleReset = () => {
        setStep('input');
        if (photo) {
            URL.revokeObjectURL(photo.previewUrl);
        }
        setPhoto(null);
        setResult(null);
    };

    const renderContent = () => {
        switch (step) {
            case 'loading':
                return <LoadingState />;
            case 'result':
                return result && photo ? (
                    <ResultState
                        result={result}
                        photo={photo}
                        onReset={handleReset}
                    />
                ) : <InputState onIdentify={handleIdentify} />;
            case 'input':
            default:
                return <InputState onIdentify={handleIdentify} />;
        }
    };
    
    return (
        <div>
            <div className="flex justify-end mb-4">
                 <button onClick={onBackToDashboard} className="px-4 py-2 border border-gray-300 rounded-md text-primary-700 font-semibold hover:bg-gray-50 text-sm transition-transform duration-150 active:scale-95">{t('buttons.backToDash')}</button>
            </div>
            {renderContent()}
        </div>
    );
};
