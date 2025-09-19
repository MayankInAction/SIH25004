

export type Species = 'Cattle' | 'Buffalo';
export type Gender = 'Male' | 'Female' | 'Other' | 'Prefer not to say';
export type Confidence = 'High' | 'Medium' | 'Low';
export type AgeUnit = 'Years' | 'Months';

export interface PhotoFile {
  id: string;
  file: File;
  previewUrl: string;
}

export interface AnimalData {
  id:string;
  species: Species | '';
  ageValue: string;
  ageUnit: AgeUnit;
  sex: 'Male' | 'Female' | '';
  photos: PhotoFile[];
}

export interface OwnerData {
  name: string;
  mobile: string;
  dob: string;
  gender: Gender | '';
  address: string;
  village: string;
  district: string;
  state: string;
  pincode: string;
  idType: IdType;
  idNumber: string;
  casteCategory: CasteCategory;
  bankAccount: string;
  ifscCode: string;
}

export type IdType = 'Aadhaar' | 'Voter ID' | 'Ration Card' | 'Passport' | '';
export type CasteCategory = 'General' | 'OBC' | 'SC' | 'ST' | '';

export interface BreedIdentificationResult {
  error: string | null;
  breedName: string;
  confidence: Confidence;
  milkYieldPotential: string;
  careNotes: string;
  reasoning: string;
}

export interface AnimalResult extends AnimalData {
  aiResult: BreedIdentificationResult;
}

export interface Registration {
  id: string;
  timestamp: string;
  owner: OwnerData;
  animals: AnimalResult[];
  isSample?: boolean;
}

export interface ChatMessage {
    role: 'user' | 'model';
    parts: { text: string }[];
}

export interface BreedInfo {
    name: string;
    species: Species;
    facts: string;
    sources?: { uri: string; title: string }[];
}