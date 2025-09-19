
import { Registration } from '../types';
import { INDIAN_STATES_AND_DISTRICTS } from './locationData';
import { CATTLE_BREEDS, BUFFALO_BREEDS } from '../constants';

const firstNames = ["Rajesh", "Sunita", "Amit", "Priya", "Sanjay", "Meena", "Arun", "Geeta", "Vijay", "Anita", "Deepak", "Pooja", "Manoj", "Kavita", "Anil", "Suman", "Ramesh", "Rekha", "Suresh", "Usha"];
const lastNames = ["Kumar", "Devi", "Singh", "Sharma", "Gupta", "Yadav", "Patel", "Verma", "Jain", "Mehta", "Chauhan", "Mishra", "Pandey", "Tiwari", "Reddy"];
const villages = ["Ramgarh", "Devpur", "Krishnanagar", "Sitapur", "Gopalganj", "Madhupur", "Shantipur", "Alipur", "Fatehpur", "Jayanagar"];
const states = Object.keys(INDIAN_STATES_AND_DISTRICTS);

const getRandomElement = <T,>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];
const getRandomInt = (min: number, max: number): number => Math.floor(Math.random() * (max - min + 1)) + min;
const getRandomDate = (start: Date, end: Date): Date => new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));

const errorMessages = [
    'Image is too blurry for accurate analysis. Please upload a clearer photo.',
    'Multiple animals detected in the image. Please use a photo of a single animal.',
    'Animal is partially obstructed from view. A clear side profile is recommended.',
    'Could not confirm species. The animal does not appear to be Cattle or Buffalo.',
];

export const getSampleRegistrations = (): Registration[] => {
    const registrations: Registration[] = [];
    const totalRegistrations = getRandomInt(30, 50);
    const startDate = new Date('2025-09-15T00:00:00Z');
    const endDate = new Date('2025-09-18T23:59:59Z');

    for (let i = 0; i < totalRegistrations; i++) {
        const ownerFirstName = getRandomElement(firstNames);
        const ownerLastName = getRandomElement(lastNames);
        const ownerState = getRandomElement(states);
        const ownerDistrict = getRandomElement(INDIAN_STATES_AND_DISTRICTS[ownerState]);
        const registrationTimestamp = getRandomDate(startDate, endDate);

        const owner = {
            name: `${ownerFirstName} ${ownerLastName}`,
            mobile: `9${getRandomInt(100000000, 999999999)}`,
            dob: `${getRandomInt(1960, 1995)}-${String(getRandomInt(1, 12)).padStart(2, '0')}-${String(getRandomInt(1, 28)).padStart(2, '0')}`,
            gender: Math.random() > 0.4 ? 'Male' as 'Male' : 'Female' as 'Female',
            address: `${getRandomInt(1, 100)} Main Road`,
            village: getRandomElement(villages),
            district: ownerDistrict,
            state: ownerState,
            pincode: `${getRandomInt(100000, 999999)}`,
            idType: 'Aadhaar' as 'Aadhaar',
            idNumber: `${getRandomInt(1000, 9999)}${getRandomInt(1000, 9999)}${getRandomInt(1000, 9999)}`,
            casteCategory: getRandomElement(['General', 'OBC', 'SC', 'ST']) as 'General' | 'OBC' | 'SC' | 'ST',
            bankAccount: "",
            ifscCode: "",
        };

        const animals = [];
        const numAnimals = getRandomInt(1, 2);
        for (let j = 0; j < numAnimals; j++) {
            const species = Math.random() > 0.5 ? 'Cattle' : 'Buffalo';
            
            let breedName: string;
            const priorityBreeds = ["Gir", "Sahiwal"];

            if (species === 'Cattle' && Math.random() < 0.5) { // 50% chance to pick a priority breed
                breedName = getRandomElement(priorityBreeds);
            } else {
                breedName = species === 'Cattle' ? getRandomElement(CATTLE_BREEDS) : getRandomElement(BUFFALO_BREEDS);
            }

            const hasError = Math.random() < 0.05; // 5% chance of an error

            const animal = {
                id: `animal-${i}-${j}-${Date.now()}`,
                species: species as 'Cattle' | 'Buffalo',
                ageValue: `${getRandomInt(1, 10)}`,
                ageUnit: 'Years' as 'Years',
                sex: Math.random() > 0.3 ? 'Female' as 'Female' : 'Male' as 'Male',
                photos: [],
                aiResult: hasError ? {
                    error: getRandomElement(errorMessages),
                    breedName: 'Unknown',
                    confidence: 'Low' as 'Low',
                    milkYieldPotential: 'N/A',
                    careNotes: 'N/A',
                    reasoning: 'Could not identify key features due to analysis failure.',
                } : {
                    error: null,
                    breedName: breedName,
                    confidence: getRandomElement(['High', 'Medium']) as 'High' | 'Medium',
                    milkYieldPotential: 'Varies by individual animal; typically good for this breed.',
                    careNotes: 'Requires standard diet, clean water, and shelter. Consult a vet for specific needs.',
                    reasoning: 'Body conformation, coloration, and head shape are consistent with the identified breed.',
                },
            };
            animals.push(animal);
        }

        const registration: Registration = {
            id: `reg-${registrationTimestamp.getTime()}`,
            timestamp: registrationTimestamp.toISOString(),
            isSample: true,
            owner,
            animals,
        };
        registrations.push(registration);
    }
    
    return registrations;
};
