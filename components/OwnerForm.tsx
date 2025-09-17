import React, { useState, useEffect } from 'react';
import { OwnerData } from '../types';
import { INDIAN_STATES } from '../constants';
import { INDIAN_STATES_AND_DISTRICTS } from '../utils/locationData';

interface OwnerFormProps {
  initialData: OwnerData;
  onSubmit: (data: OwnerData) => void;
  onBack: () => void;
  isSubmitting: boolean;
  isUpdateMode?: boolean;
}

const Spinner: React.FC = () => (
    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
    </svg>
);

export const OwnerForm: React.FC<OwnerFormProps> = ({ initialData, onSubmit, onBack, isSubmitting, isUpdateMode }) => {
  const [formData, setFormData] = useState<OwnerData>(initialData);
  const [districts, setDistricts] = useState<string[]>([]);
  const [errors, setErrors] = useState<Partial<Record<keyof OwnerData, string>>>({});


  useEffect(() => {
    setFormData(initialData);
  }, [initialData]);

  useEffect(() => {
    if (formData.state && INDIAN_STATES_AND_DISTRICTS[formData.state]) {
        setDistricts(INDIAN_STATES_AND_DISTRICTS[formData.state]);
    } else {
        setDistricts([]);
    }
  }, [formData.state]);


  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    // Clear the error for the field being edited
    if (errors[name as keyof OwnerData]) {
        setErrors(prev => ({ ...prev, [name]: undefined }));
    }

    if (name === 'state') {
        setFormData({ ...formData, state: value, district: '' });
        return;
    }

    if (name === 'mobile' || name === 'aadhaar') {
        // Allow only numeric input for mobile and aadhaar
        const numericValue = value.replace(/\D/g, '');
        setFormData({ ...formData, [name]: numericValue });
        return;
    }

    setFormData({ ...formData, [name]: value });
  };
  
  const validateForm = (): boolean => {
      const newErrors: Partial<Record<keyof OwnerData, string>> = {};
      let isValid = true;
      
      // Generic required field check
      (Object.keys(formData) as Array<keyof OwnerData>).forEach(key => {
          if (formData[key].toString().trim() === '') {
              newErrors[key] = 'This field is required.';
              isValid = false;
          }
      });
      
      // Specific validation for mobile (overwrites "required" if applicable)
      if (formData.mobile.trim() !== '' && formData.mobile.length !== 10) {
          newErrors.mobile = 'Mobile number must be exactly 10 digits.';
          isValid = false;
      }
      
      // Specific validation for aadhaar (overwrites "required" if applicable)
      if (formData.aadhaar.trim() !== '' && formData.aadhaar.length !== 12) {
          newErrors.aadhaar = 'Aadhaar number must be exactly 12 digits.';
          isValid = false;
      }
      
      setErrors(newErrors);
      return isValid;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
        onSubmit(formData);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white p-8 rounded-xl shadow-sm space-y-8 border border-cream-200">
       <div className="flex justify-between items-start">
        <div>
            <h3 className="text-xl font-bold text-primary-900">{isUpdateMode ? 'Update Owner & Location Information' : 'Owner & Location Information'}</h3>
            <p className="text-sm text-primary-700">All fields are required for BPA integration.</p>
        </div>
       </div>
      
      <div>
        <h4 className="text-md font-bold text-primary-900 border-b pb-2 mb-4">Personal Details</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <InputField label="Owner Name" name="name" value={formData.name} onChange={handleChange} error={errors.name} />
            <InputField label="Mobile Number" name="mobile" type="tel" value={formData.mobile} onChange={handleChange} maxLength={10} error={errors.mobile} />
            <InputField label="Aadhaar Number" name="aadhaar" type="text" value={formData.aadhaar} onChange={handleChange} maxLength={12} error={errors.aadhaar} />
            <InputField label="Date of Birth" name="dob" type="date" value={formData.dob} onChange={handleChange} error={errors.dob} />
            <div>
              <label className="block text-sm font-medium text-primary-800">Gender</label>
              <select name="gender" value={formData.gender} onChange={handleChange} className={`mt-1 block w-full p-2 border ${errors.gender ? 'border-red-500' : 'border-gray-300'} rounded-md shadow-sm focus:ring-accent-500 focus:border-accent-500 bg-white text-gray-900`}>
                <option value="Female">Female</option>
                <option value="Male">Male</option>
              </select>
               {errors.gender && <p className="mt-1 text-xs text-red-600">{errors.gender}</p>}
            </div>
        </div>
      </div>
      
      <div>
        <h4 className="text-md font-bold text-primary-900 border-b pb-2 mb-4">Location Details</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <InputField label="Full Address" name="address" value={formData.address} onChange={handleChange} error={errors.address} />
            <InputField label="Village / Town" name="village" value={formData.village} onChange={handleChange} error={errors.village} />
            <div>
              <label htmlFor="state" className="block text-sm font-medium text-primary-800">State</label>
              <select
                id="state"
                name="state"
                value={formData.state}
                onChange={handleChange}
                className={`mt-1 block w-full p-2 border ${errors.state ? 'border-red-500' : 'border-gray-300'} rounded-md shadow-sm focus:ring-accent-500 focus:border-accent-500 bg-white text-gray-900`}
                required
              >
                <option value="" disabled>Select a state</option>
                {INDIAN_STATES.map(state => (
                  <option key={state} value={state}>{state}</option>
                ))}
              </select>
              {errors.state && <p className="mt-1 text-xs text-red-600">{errors.state}</p>}
            </div>
            <div>
              <label htmlFor="district" className="block text-sm font-medium text-primary-800">District</label>
              <select
                id="district"
                name="district"
                value={formData.district}
                onChange={handleChange}
                className={`mt-1 block w-full p-2 border ${errors.district ? 'border-red-500' : 'border-gray-300'} rounded-md shadow-sm focus:ring-accent-500 focus:border-accent-500 bg-white text-gray-900 disabled:bg-gray-100`}
                required
                disabled={!formData.state || districts.length === 0}
              >
                <option value="" disabled>Select a district</option>
                {districts.map(district => (
                  <option key={district} value={district}>{district}</option>
                ))}
              </select>
              {errors.district && <p className="mt-1 text-xs text-red-600">{errors.district}</p>}
            </div>
        </div>
      </div>


      <div className="flex justify-between mt-8 pt-6 border-t border-cream-200">
        <button type="button" onClick={onBack} className="px-6 py-2 border border-gray-300 rounded-md text-primary-700 font-semibold hover:bg-gray-50 disabled:opacity-50 transition-transform duration-150 active:scale-95" disabled={isSubmitting}>Back</button>
        <button 
            type="submit" 
            className="px-8 py-2 bg-accent-500 text-white font-semibold rounded-md hover:bg-accent-600 shadow-sm flex items-center justify-center w-56 disabled:bg-accent-400 disabled:cursor-not-allowed transition-transform duration-150 active:scale-95"
            disabled={isSubmitting}
        >
          {isSubmitting ? (
              <>
                <Spinner />
                Processing...
              </>
          ) : (
            isUpdateMode ? 'Save Changes' : 'Submit for AI Analysis'
          )}
        </button>
      </div>
    </form>
  );
};

interface InputFieldProps {
  label: string;
  name: keyof Omit<OwnerData, 'state' | 'district' | 'gender'>;
  type?: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  maxLength?: number;
  error?: string | null;
}

const InputField: React.FC<InputFieldProps> = ({ label, name, type = 'text', value, onChange, maxLength, error }) => (
  <div>
    <label htmlFor={name} className="block text-sm font-medium text-primary-800">{label}</label>
    <input
      type={type}
      id={name}
      name={name}
      value={value}
      onChange={onChange}
      maxLength={maxLength}
      className={`mt-1 block w-full p-2 border ${error ? 'border-red-500' : 'border-gray-300'} rounded-md shadow-sm focus:ring-accent-500 focus:border-accent-500 bg-white text-gray-900`}
      required
    />
    {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
  </div>
);