
import { useState, useEffect, Dispatch, SetStateAction } from 'react';

function getValue<T,>(key: string, initialValue: T | (() => T)): T {
    const savedValue = localStorage.getItem(key);
    if (savedValue) {
        try {
            return JSON.parse(savedValue) as T;
        } catch (error) {
            console.error('Error parsing JSON from localStorage', error);
            localStorage.removeItem(key);
        }
    }

    if (initialValue instanceof Function) {
        return initialValue();
    }
    return initialValue;
}

// FIX: Use imported Dispatch and SetStateAction types.
export function useLocalStorage<T,>(key: string, initialValue: T | (() => T)): [T, Dispatch<SetStateAction<T>>] {
    const [value, setValue] = useState<T>(() => {
        return getValue(key, initialValue);
    });

    useEffect(() => {
        localStorage.setItem(key, JSON.stringify(value));
    }, [key, value]);

    return [value, setValue];
}
