
// FIX: Using a namespace import for firebase database functions to avoid potential module resolution issues.
import * as firebaseDB from 'firebase/database';
import type { FirebaseApp } from 'firebase/app';
import type { LogEntry } from '../types';

export const addLog = async (app: FirebaseApp, action: string) => {
    const db = firebaseDB.getDatabase(app);
    const logsRef = firebaseDB.ref(db, 'logs');
    const newLogRef = firebaseDB.push(logsRef);

    const newLog: Omit<LogEntry, 'time'> & { time: object } = {
        time: firebaseDB.serverTimestamp(),
        user: 'المسؤول', // Hardcoded user for simplicity
        action: action,
    };
    
    // ServerTimestamp needs to be converted to string on client-side for display
    const clientTime = new Date().toISOString();

    try {
        await firebaseDB.set(newLogRef, newLog);
    } catch (error) {
        console.error("Error adding log:", error);
    }
};

export const performUpdates = async (app: FirebaseApp, updates: Record<string, any>, logMessage: string) => {
    const db = firebaseDB.getDatabase(app);
    const dbRef = firebaseDB.ref(db);
    
    const logKey = firebaseDB.push(firebaseDB.child(dbRef, 'logs')).key;
    if (logKey) {
        updates[`/logs/${logKey}`] = {
            time: firebaseDB.serverTimestamp(),
            user: 'المسؤول',
            action: logMessage
        };
    }

    try {
        await firebaseDB.update(dbRef, updates);
    } catch (error) {
        console.error("Error performing updates:", error);
        throw error;
    }
};