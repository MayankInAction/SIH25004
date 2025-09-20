
import React, { useCallback, useState, useRef } from 'react';
import { AnimalData, Species, PhotoFile, Confidence } from '../types';
import { Icon } from './icons';
import { toBase64 } from '../utils/fileUtils';
import { detectAnimalDetails } from '../services/geminiService';
import { CameraModal } from './CameraModal';
import { useLanguage } from '../contexts/LanguageContext';

interface AnimalFormProps {
  index: number;
  animalData: AnimalData;
  onUpdate: (index: number, data: AnimalData | ((prev: AnimalData) => AnimalData)) => void;
}

export const AnimalForm: React.FC<AnimalFormProps> = ({ index, animalData, onUpdate }) => {
  const [isDetecting, setIsDetecting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [ageError, setAgeError] = useState<string | null>(null);
  const { t } = useLanguage();
    
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;

    const validateAge = (val: string, unit: string) => {
        if (val.trim() === '') {
            setAgeError(null);
            return;
        }

        const age = Number(val);
        if (unit === 'Years') {
            if (age < 0 || age > 20) {
                setAgeError(t('animalForm.errors.ageYears'));
            } else {
                setAgeError(null);
            }
        } else { // Months
            if (age < 6 || age > 12) {
                setAgeError(t('animalForm.errors.ageMonths'));
            } else {
                setAgeError(null);
            }
        }
    };

    if (name === 'ageValue') {
        validateAge(value, animalData.ageUnit);
    } else if (name === 'ageUnit') {
        validateAge(animalData.ageValue, value);
    }

    onUpdate(index, (prevData) => ({ ...prevData, [name]: value }));
  };
  
  const addPhotosAndDetect = useCallback(async (files: File[]) => {
      const newPhotos = files.map((file: File) => ({
        id: `${file.name}-${Date.now()}`,
        file,
        previewUrl: URL.createObjectURL(file),
      }));

      const isFirstUpload = animalData.photos.length === 0 && files[0];
      
      onUpdate(index, (prevData) => ({
        ...prevData,
        photos: [...prevData.photos, ...newPhotos].slice(0, 5),
      }));

      if (isFirstUpload) {
        setIsDetecting(true);
        try {
          const firstFile = files[0];
          const base64Data = await toBase64(firstFile);
          const result = await detectAnimalDetails({
            mimeType: firstFile.type,
            data: base64Data,
          });

          if (result.error) {
            console.warn('Auto-detection failed:', result.error);
            alert(`${t('animalForm.errors.autoDetectFail')}: ${result.error}`);
          } else if (result.animals.length === 1) {
            const detectedAnimal = result.animals[0];
            onUpdate(index, (prevData) => ({
              ...prevData,
              species: detectedAnimal.species as Species,
              sex: detectedAnimal.sex as 'Male' | 'Female',
              sexConfidence: detectedAnimal.sexConfidence as Confidence,
            }));
          } else if (result.animals.length > 1) {
            alert(t('animalForm.errors.multipleAnimals'));
          } else { // 0 animals
            console.log("No animals were automatically detected in the image.");
          }
        } catch (error) {
          console.error("Auto-detection failed:", error);
          alert(t('animalForm.errors.unexpectedError'));
        } finally {
          setIsDetecting(false);
        }
      }
  }, [animalData.photos.length, index, onUpdate, t]);
  
  const handlePhotoUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const files = Array.from(e.target.files);
      addPhotosAndDetect(files);
    }
    // Reset the input value to allow re-uploading the same file
    e.target.value = '';
  }, [addPhotosAndDetect]);
  
  // FIX: Close camera modal after a photo is captured.
  const handleCapture = useCallback((file: File) => {
      addPhotosAndDetect([file]);
      setIsCameraOpen(false);
  }, [addPhotosAndDetect]);

  const removePhoto = (id: string) => {
    onUpdate(index, (prevData) => ({
        ...prevData,
        photos: prevData.photos.filter(photo => photo.id !== id)
    }));
  };

  return (
    <>
      <div className="bg-white p-6 rounded-xl shadow-sm border border-cream-200">
        <h3 className="text-xl font-bold mb-6 text-primary-900">{t('animalForm.title', { index: index + 1 })}</h3>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            {/* Photo Upload Section */}
            <div className="lg:col-span-5">
                <label className="block text-sm font-medium text-primary-800 mb-2">{t('animalForm.photosLabel')}</label>
                
                {animalData.photos.length === 0 ? (
                    <div className="bg-cream-50 p-4 rounded-lg border-2 border-dashed border-cream-200 aspect-video flex flex-col justify-center items-center text-center">
                        <Icon name="camera" className="mx-auto w-12 h-12 text-gray-400"/>
                        <p className="mt-2 text-sm text-gray-500">{t('animalForm.uploadPrompt')}</p>
                        <div className="flex items-center justify-center gap-4 mt-4">
                            <button type="button" onClick={() => fileInputRef.current?.click()} className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-md text-sm font-semibold text-primary-800 hover:bg-gray-100">
                                <Icon name="upload" className="w-5 h-5"/> {t('buttons.upload')}
                            </button>
                            <button type="button" onClick={() => setIsCameraOpen(true)} className="flex items-center gap-2 px-4 py-2 bg-primary-900 border border-transparent rounded-md text-sm font-semibold text-white hover:bg-primary-800">
                                 <Icon name="camera" className="w-5 h-5"/> {t('buttons.capture')}
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="grid grid-cols-3 gap-3">
                        {animalData.photos.map(photo => (
                            <div key={photo.id} className="relative group aspect-square">
                                <img src={photo.previewUrl} alt="Animal preview" className="w-full h-full object-cover rounded-md" />
                                <button onClick={() => removePhoto(photo.id)} className="absolute top-1 right-1 bg-red-600/80 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600 focus:opacity-100">
                                    <Icon name="trash" className="w-3 h-3" />
                                </button>
                            </div>
                        ))}
                        {animalData.photos.length < 5 && (
                            <button 
                                type="button" 
                                onClick={() => fileInputRef.current?.click()} 
                                className="aspect-square flex flex-col items-center justify-center bg-cream-50 rounded-md border-2 border-dashed border-cream-200 text-gray-500 hover:bg-cream-100 hover:border-accent-400 hover:text-accent-600 transition-colors"
                                aria-label={t('animalForm.addMorePhotos')}
                            >
                                <Icon name="upload" className="w-8 h-8"/>
                                <span className="text-xs mt-1 font-semibold">{t('animalForm.addMore')}</span>
                            </button>
                        )}
                    </div>
                )}
                
                <input ref={fileInputRef} id={`photo-upload-${index}`} type="file" multiple accept="image/*" onChange={handlePhotoUpload} className="hidden" />

                <div className="mt-3 text-xs text-gray-500 space-y-1">
                    <p><strong>{t('animalForm.photoTipsTitle')}:</strong> {t('animalForm.photoTips')}</p>
                </div>
            </div>

            {/* Details Section */}
            <div className="lg:col-span-7 space-y-5">
                <div className="relative">
                    <label className="block text-sm font-medium text-primary-800">{t('animalForm.species')}</label>
                    <select name="species" value={animalData.species} onChange={handleInputChange} disabled={isDetecting} className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-accent-500 focus:border-accent-500 bg-white text-gray-900 disabled:bg-gray-200">
                        <option value="" disabled>{t('animalForm.chooseSpecies')}</option>
                        <option value="Cattle">{t('species.cattle')}</option>
                        <option value="Buffalo">{t('species.buffalo')}</option>
                    </select>
                    {isDetecting && <div className="absolute top-8 right-2"><Spinner /></div>}
                </div>
                <div className="relative">
                    <label className="block text-sm font-medium text-primary-800">{t('animalForm.sex')}</label>
                    <select name="sex" value={animalData.sex} onChange={handleInputChange} disabled={isDetecting} className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-accent-500 focus:border-accent-500 bg-white text-gray-900 disabled:bg-gray-200">
                        <option value="" disabled>{t('animalForm.chooseSex')}</option>
                        <option value="Female">{t('sex.female')}</option>
                        <option value="Male">{t('sex.male')}</option>
                    </select>
                    {isDetecting && <div className="absolute top-8 right-2"><Spinner /></div>}
                    {animalData.sexConfidence && !isDetecting && (
                        <div className={`mt-1 text-xs flex items-center p-2 rounded-md ${
                            animalData.sexConfidence === 'Low' ? 'text-accent-yellow-800 bg-accent-yellow-50' : 'text-gray-600'
                        }`}>
                            <Icon name="ai-sparkles" className="w-4 h-4 mr-1.5 flex-shrink-0"/>
                            <span>{t('animalForm.autoDetect', { confidence: t(`confidence.${animalData.sexConfidence.toLowerCase()}`) })}</span>
                        </div>
                    )}
                </div>
                <div>
                    <label className="block text-sm font-medium text-primary-800">{t('animalForm.age')}</label>
                    <div className="mt-1 flex rounded-md shadow-sm">
                      <input 
                        type="number" 
                        name="ageValue" 
                        value={animalData.ageValue} 
                        onChange={handleInputChange}
                        min={animalData.ageUnit === 'Months' ? '6' : '0'}
                        max={animalData.ageUnit === 'Months' ? '12' : '20'}
                        className="block w-full p-2 border-r-0 border-gray-300 rounded-l-md focus:ring-accent-500 focus:border-accent-500 bg-white text-gray-900" 
                        placeholder={animalData.ageUnit === 'Months' ? 'e.g., 8' : 'e.g., 5'}
                      />
                      <select 
                        name="ageUnit" 
                        value={animalData.ageUnit} 
                        onChange={handleInputChange}
                        className="block p-2 border border-gray-300 rounded-r-md bg-cream-100 text-primary-800 focus:ring-accent-500 focus:border-accent-500 font-semibold"
                      >
                          <option value="Years">{t('animalForm.years')}</option>
                          <option value="Months">{t('animalForm.months')}</option>
                      </select>
                    </div>
                    {ageError && <p className="mt-1 text-xs text-red-600">{ageError}</p>}
                </div>
            </div>
        </div>
      </div>
      <CameraModal 
        isOpen={isCameraOpen}
        onClose={() => setIsCameraOpen(false)}
        onCapture={handleCapture}
      />
    </>
  );
};

const Spinner: React.FC = () => (
    <svg className="animate-spin h-5 w-5 text-accent-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
    </svg>
);
