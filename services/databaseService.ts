
import { Registration } from '../types';
import { getSampleRegistrations } from '../utils/dataGenerator';

const DB_KEY = 'registrations';
const LATENCY = 300; // ms

const ensureData = (): Registration[] => {
    const rawData = localStorage.getItem(DB_KEY);
    if (rawData) {
        try {
            return JSON.parse(rawData);
        } catch (e) {
            console.error("Failed to parse registrations from localStorage", e);
            localStorage.removeItem(DB_KEY);
        }
    }
    const sampleData = getSampleRegistrations();
    localStorage.setItem(DB_KEY, JSON.stringify(sampleData));
    return sampleData;
};

export const getAllRegistrations = async (): Promise<Registration[]> => {
    return new Promise(resolve => {
        setTimeout(() => {
            resolve(ensureData());
        }, LATENCY);
    });
};

export const saveRegistration = async (newRegistration: Registration): Promise<void> => {
    return new Promise(resolve => {
        setTimeout(() => {
            const registrations = ensureData();
            registrations.push(newRegistration);
            localStorage.setItem(DB_KEY, JSON.stringify(registrations));
            resolve();
        }, LATENCY);
    });
};

export const updateRegistration = async (updatedRegistration: Registration): Promise<void> => {
    return new Promise(resolve => {
        setTimeout(() => {
            const registrations = ensureData();
            const index = registrations.findIndex(r => r.id === updatedRegistration.id);
            if (index !== -1) {
                registrations[index] = updatedRegistration;
                localStorage.setItem(DB_KEY, JSON.stringify(registrations));
            }
            resolve();
        }, LATENCY);
    });
};
