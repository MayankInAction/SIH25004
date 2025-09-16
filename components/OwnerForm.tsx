import React, { useState, useEffect } from 'react';
import { OwnerData } from '../types';
import { SAMPLE_OWNER_DATA } from '../constants';

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

  useEffect(() => {
    setFormData(initialData);
  }, [initialData]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };
  
  const handleFillSampleData = () => {
    setFormData(SAMPLE_OWNER_DATA);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    for (const key in formData) {
        if (formData[key as keyof OwnerData].trim() === '') {
            alert(`Please fill in the '${key}' field.`);
            return;
        }
    }
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white p-8 rounded-xl shadow-sm space-y-8 border border-cream-200">
       <div className="flex justify-between items-start">
        <div>
            <h3 className="text-xl font-bold text-primary-900">{isUpdateMode ? 'Update Owner & Location Information' : 'Owner & Location Information'}</h3>
            <p className="text-sm text-secondary-700">All fields are required for BPA integration.</p>
        </div>
        <button type="button" onClick={handleFillSampleData} className="text-sm bg-secondary-100 text-secondary-800 font-semibold px-3 py-1 rounded-md hover:bg-secondary-200 transition-transform duration-150 active:scale-95" disabled={isSubmitting}>
            Fill with Sample Data
        </button>
       </div>
      
      <div>
        <h4 className="text-md font-bold text-primary-900 border-b pb-2 mb-4">Personal Details</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <InputField label="Owner Name" name="name" value={formData.name} onChange={handleChange} />
            <InputField label="Mobile Number" name="mobile" type="tel" value={formData.mobile} onChange={handleChange} />
            <InputField label="Aadhaar Number" name="aadhaar" type="text" value={formData.aadhaar} onChange={handleChange} maxLength={12} />
            <InputField label="Date of Birth" name="dob" type="date" value={formData.dob} onChange={handleChange} />
            <div>
              <label className="block text-sm font-medium text-secondary-800">Gender</label>
              <select name="gender" value={formData.gender} onChange={handleChange} className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-accent-500 focus:border-accent-500 bg-white text-gray-900">
                <option value="Female">Female</option>
                <option value="Male">Male</option>
              </select>
            </div>
        </div>
      </div>
      
      <div>
        <h4 className="text-md font-bold text-primary-900 border-b pb-2 mb-4">Location Details</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <InputField label="Full Address" name="address" value={formData.address} onChange={handleChange} />
            <InputField label="Village / Town" name="village" value={formData.village} onChange={handleChange} />
            <InputField label="District" name="district" value={formData.district} onChange={handleChange} />
            <InputField label="State" name="state" value={formData.state} onChange={handleChange} />
        </div>
      </div>


      <div className="flex justify-between mt-8 pt-6 border-t border-cream-200">
        <button type="button" onClick={onBack} className="px-6 py-2 border border-gray-300 rounded-md text-secondary-700 font-semibold hover:bg-gray-50 disabled:opacity-50 transition-transform duration-150 active:scale-95" disabled={isSubmitting}>Back</button>
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
  name: keyof OwnerData;
  type?: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  maxLength?: number;
}

const InputField: React.FC<InputFieldProps> = ({ label, name, type = 'text', value, onChange, maxLength }) => (
  <div>
    <label htmlFor={name} className="block text-sm font-medium text-secondary-800">{label}</label>
    <input
      type={type}
      id={name}
      name={name}
      value={value}
      onChange={onChange}
      maxLength={maxLength}
      className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-accent-500 focus:border-accent-500 bg-white text-gray-900"
      required
    />
  </div>
);