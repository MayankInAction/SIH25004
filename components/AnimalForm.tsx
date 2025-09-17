import React, { useCallback, useState, useRef } from 'react';
import { AnimalData, Species, Gender } from '../types';
import { Icon } from './icons';
import { toBase64 } from '../utils/fileUtils';
import { detectAnimalDetails } from '../services/geminiService';
import { CameraModal } from './CameraModal';

interface AnimalFormProps {
  index: number;
  animalData: AnimalData;
  onUpdate: (index: number, data: AnimalData | ((prev: AnimalData) => AnimalData)) => void;
}

export const AnimalForm: React.FC<AnimalFormProps> = ({ index, animalData, onUpdate }) => {
  const [isDetecting, setIsDetecting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
    
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
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
            alert(`Auto-detection could not be completed: ${result.error}`);
          } else if (result.animals.length === 1) {
            const detectedAnimal = result.animals[0];
            onUpdate(index, (prevData) => ({
              ...prevData,
              species: detectedAnimal.species as Species,
              gender: detectedAnimal.gender as Gender,
            }));
          } else if (result.animals.length > 1) {
            alert('Multiple animals detected. For best results, please use a photo of a single animal to auto-fill details.');
          } else { // 0 animals
            console.log("No animals were automatically detected in the image.");
          }
        } catch (error) {
          console.error("Auto-detection failed:", error);
          alert("An unexpected error occurred during auto-detection.");
        } finally {
          setIsDetecting(false);
        }
      }
  }, [animalData.photos.length, index, onUpdate]);
  
  const handlePhotoUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const files = Array.from(e.target.files);
      addPhotosAndDetect(files);
    }
    // Reset the input value to allow re-uploading the same file
    e.target.value = '';
  }, [addPhotosAndDetect]);
  
  const handleCapture = useCallback((file: File) => {
      addPhotosAndDetect([file]);
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
        <h3 className="text-xl font-bold mb-4 text-primary-900">Animal #{index + 1}</h3>
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
            <div className="lg:col-span-3">
                <label className="block text-sm font-medium text-primary-800 mb-2">Photos (1-5 Required)</label>
                <div className="bg-cream-50 p-4 rounded-lg border-2 border-dashed border-cream-200 min-h-[200px] flex flex-col justify-center">
                    {animalData.photos.length > 0 ? (
                        <div className="grid grid-cols-3 sm:grid-cols-5 gap-2 mb-4">
                            {animalData.photos.map(photo => (
                                <div key={photo.id} className="relative group aspect-square">
                                    <img src={photo.previewUrl} alt="Animal preview" className="w-full h-full object-cover rounded-md" />
                                    <button onClick={() => removePhoto(photo.id)} className="absolute top-1 right-1 bg-red-600/80 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600 focus:opacity-100">
                                        <Icon name="trash" className="w-3 h-3" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    ) : (
                         <div className="text-center text-gray-500">
                            <Icon name="camera" className="mx-auto w-12 h-12 text-gray-400"/>
                            <p className="mt-2 text-sm">Upload or capture photos of the animal.</p>
                        </div>
                    )}

                    {animalData.photos.length < 5 && (
                         <div className="flex items-center justify-center gap-4 mt-4">
                            <button type="button" onClick={() => fileInputRef.current?.click()} className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-md text-sm font-semibold text-primary-800 hover:bg-gray-100">
                                <Icon name="upload" className="w-5 h-5"/>
                                Upload File
                            </button>
                            <button type="button" onClick={() => setIsCameraOpen(true)} className="flex items-center gap-2 px-4 py-2 bg-primary-900 border border-transparent rounded-md text-sm font-semibold text-white hover:bg-primary-800">
                                 <Icon name="camera" className="w-5 h-5"/>
                                Take Photo
                            </button>
                            <input ref={fileInputRef} id={`photo-upload-${index}`} type="file" multiple accept="image/*" onChange={handlePhotoUpload} className="hidden" />
                        </div>
                    )}
                </div>
                <div className="mt-2 text-xs text-gray-500 space-y-1">
                    <p><strong>Photo Tips:</strong> Clear side, front, and rear views in good lighting work best for AI analysis.</p>
                </div>
            </div>

            <div className="lg:col-span-2 space-y-4">
                <div className="relative">
                    <label className="block text-sm font-medium text-primary-800">Species</label>
                    <select name="species" value={animalData.species} onChange={handleInputChange} disabled={isDetecting} className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-accent-500 focus:border-accent-500 bg-white text-gray-900 disabled:bg-gray-200">
                        <option value="Cattle">Cattle</option>
                        <option value="Buffalo">Buffalo</option>
                    </select>
                    {isDetecting && <div className="absolute top-8 right-2"><Spinner /></div>}
                </div>
                <div className="relative">
                    <label className="block text-sm font-medium text-primary-800">Gender</label>
                    <select name="gender" value={animalData.gender} onChange={handleInputChange} disabled={isDetecting} className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-accent-500 focus:border-accent-500 bg-white text-gray-900 disabled:bg-gray-200">
                        <option value="Female">Female</option>
                        <option value="Male">Male</option>
                    </select>
                    {isDetecting && <div className="absolute top-8 right-2"><Spinner /></div>}
                </div>
                <div>
                    <label className="block text-sm font-medium text-primary-800">Approx. Age</label>
                    <div className="mt-1 flex rounded-md shadow-sm">
                      <input 
                        type="number" 
                        name="ageValue" 
                        value={animalData.ageValue} 
                        onChange={handleInputChange} 
                        className="block w-full p-2 border-r-0 border-gray-300 rounded-l-md focus:ring-accent-500 focus:border-accent-500 bg-white text-gray-900" 
                        placeholder="e.g., 5" 
                      />
                      <select 
                        name="ageUnit" 
                        value={animalData.ageUnit} 
                        onChange={handleInputChange}
                        className="block p-2 border border-gray-300 rounded-r-md bg-cream-100 text-primary-800 focus:ring-accent-500 focus:border-accent-500 font-semibold"
                      >
                          <option>Years</option>
                          <option>Months</option>
                      </select>
                    </div>
                </div>
                <div>
                    <label className="block text-sm font-medium text-primary-800">Health Notes (Optional)</label>
                    <textarea name="healthNotes" value={animalData.healthNotes} onChange={handleInputChange} rows={3} className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-accent-500 focus:border-accent-500 bg-white text-gray-900" placeholder="Any visible signs, vaccination status, etc."></textarea>
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
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 * 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
    </svg>
);