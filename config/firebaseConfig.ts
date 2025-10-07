
import type { FirebaseConfig } from '../types';

const CONFIG_KEY = 'firebaseConfig';

export function getFirebaseConfig(): FirebaseConfig | null {
    const configStr = localStorage.getItem(CONFIG_KEY);
    if (!configStr) return null;
    try {
        return JSON.parse(configStr);
    } catch (e) {
        return null;
    }
}

export function setFirebaseConfig(config: FirebaseConfig | null) {
    if (config) {
        localStorage.setItem(CONFIG_KEY, JSON.stringify(config));
    } else {
        localStorage.removeItem(CONFIG_KEY);
    }
}

export function isFirebaseConfigured(): boolean {
    return getFirebaseConfig() !== null;
}
