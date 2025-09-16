import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Icon } from './icons';

interface CameraModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCapture: (file: File) => void;
}

export const CameraModal: React.FC<CameraModalProps> = ({ isOpen, onClose, onCapture }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);

  const startCamera = useCallback(async () => {
    if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
    }
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
          video: { facingMode: 'environment' } 
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
      }
    } catch (err) {
      console.error("Error accessing camera:", err);
      setError("Could not access the camera. Please ensure you have given permission and that no other application is using it.");
      if (err instanceof DOMException && err.name === 'NotAllowedError') {
          setError("Camera access was denied. Please allow camera access in your browser settings.");
      }
    }
  }, []);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      startCamera();
    } else {
      stopCamera();
    }
    return () => {
      stopCamera(); // Cleanup on unmount
    };
  }, [isOpen, startCamera, stopCamera]);

  const handleCapture = () => {
    if (videoRef.current) {
      const canvas = document.createElement('canvas');
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      const context = canvas.getContext('2d');
      if (context) {
        context.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
        canvas.toBlob((blob) => {
          if (blob) {
            const file = new File([blob], `capture-${Date.now()}.jpg`, { type: 'image/jpeg' });
            onCapture(file);
            onClose();
          }
        }, 'image/jpeg', 0.95);
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl flex flex-col overflow-hidden" onClick={e => e.stopPropagation()}>
        <div className="p-4 border-b border-cream-200 flex justify-between items-center bg-primary-900 text-white">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Icon name="camera" className="w-6 h-6" />
            Live Camera
          </h2>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-primary-800">
            <Icon name="close" className="w-6 h-6" />
          </button>
        </div>
        <div className="p-2 bg-black relative aspect-video">
          <video ref={videoRef} autoPlay playsInline className="w-full h-full object-contain" />
          {error && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/80">
              <p className="text-white text-center max-w-sm p-4">{error}</p>
            </div>
          )}
        </div>
        <div className="p-4 bg-cream-100 border-t border-cream-200 flex justify-center">
            <button 
                onClick={handleCapture}
                disabled={!!error}
                className="w-20 h-20 bg-white rounded-full border-4 border-primary-800 hover:bg-cream-200 transition-all active:scale-95 disabled:bg-gray-400 disabled:border-gray-500 flex items-center justify-center"
                aria-label="Capture photo"
            >
                <div className="w-16 h-16 bg-primary-800 rounded-full"></div>
            </button>
        </div>
      </div>
    </div>
  );
};
