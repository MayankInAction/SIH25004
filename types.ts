
export type Species = 'Cattle' | 'Buffalo';
export type Gender = 'Male' | 'Female';
export type Confidence = 'High' | 'Medium' | 'Low';
export type AgeUnit = 'Years' | 'Months';

export interface PhotoFile {
  id: string;
  file: File;
  previewUrl: string;
}

export interface AnimalData {
  id:string;
  species: Species;
  ageValue: string;
  ageUnit: AgeUnit;
  gender: Gender;
  healthNotes: string;
  photos: PhotoFile[];
}

export interface OwnerData {
  name: string;
  mobile: string;
  aadhaar: string;
  dob: string;
  gender: Gender;
  address: string;
  village: string;
  district: string;
  state: string;
}

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

export interface Announcement {
    id: string;
    title: string;
    content: string;
    link: string;
    tags: string[];
}
