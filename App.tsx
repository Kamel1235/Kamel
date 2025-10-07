
import React, { useState, useEffect, useCallback } from 'react';
// FIX: Separating type imports from value imports for Firebase to potentially resolve module resolution errors.
import { initializeApp } from 'firebase/app';
import type { FirebaseApp } from 'firebase/app';
import { getDatabase, ref, onValue } from 'firebase/database';
import { getFirebaseConfig, setFirebaseConfig, isFirebaseConfigured } from './config/firebaseConfig';
import type { FirebaseConfig, StorageData, BoxesData, WasteData, LogEntry } from './types';
import StorageView from './components/StorageView';
import BoxesView from './components/BoxesView';
import WasteView from './components/WasteView';
import ChangeLog from './components/ChangeLog';
import { BoxIcon, ArchiveIcon, Trash2Icon, WrenchIcon } from './components/icons';

const FirebaseConfigForm: React.FC<{ onConfigSubmit: (config: FirebaseConfig) => void }> = ({ onConfigSubmit }) => {
    const [config, setConfig] = useState<FirebaseConfig>({
        apiKey: '',
        authDomain: '',
        databaseURL: '',
        projectId: '',
        storageBucket: '',
        messagingSenderId: '',
        appId: ''
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onConfigSubmit(config);
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900">
            <div className="p-8 bg-white dark:bg-gray-800 rounded-lg shadow-lg max-w-md w-full">
                <h2 className="text-2xl font-bold text-center text-gray-800 dark:text-white mb-6">إعدادات Firebase</h2>
                <p className="text-center text-gray-600 dark:text-gray-300 mb-4">
                    يرجى إدخال بيانات اعتماد Firebase Realtime Database الخاصة بك. يمكنك العثور عليها في إعدادات مشروع Firebase.
                </p>
                <form onSubmit={handleSubmit} className="space-y-4">
                    {Object.keys(config).map((key) => (
                        <input
                            key={key}
                            type="text"
                            placeholder={key}
                            value={config[key as keyof FirebaseConfig]}
                            onChange={(e) => setConfig({ ...config, [key]: e.target.value })}
                            className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-right"
                            required
                        />
                    ))}
                    <button type="submit" className="w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 transition duration-300">
                        حفظ وبدء التطبيق
                    </button>
                </form>
            </div>
        </div>
    );
};


export default function App() {
    const [app, setApp] = useState<FirebaseApp | null>(null);
    const [configExists, setConfigExists] = useState(isFirebaseConfigured());
    const [activeView, setActiveView] = useState('storage');
    const [storageData, setStorageData] = useState<StorageData>({});
    const [boxesData, setBoxesData] = useState<BoxesData>({});
    const [wasteData, setWasteData] = useState<WasteData>({});
    const [logsData, setLogsData] = useState<LogEntry[]>([]);
    const [loading, setLoading] = useState(true);

    const initializeFirebase = useCallback((config: FirebaseConfig) => {
        try {
            const firebaseApp = initializeApp(config);
            setApp(firebaseApp);
            setConfigExists(true);
        } catch (error) {
            console.error("Firebase initialization failed:", error);
            alert("فشل تهيئة Firebase. يرجى التحقق من صحة بيانات الإعداد.");
            setFirebaseConfig(null); // Clear invalid config
            setConfigExists(false);
        }
    }, []);

    useEffect(() => {
        if (configExists) {
            const config = getFirebaseConfig();
            if (config) {
                initializeFirebase(config);
            }
        } else {
            setLoading(false);
        }
    }, [configExists, initializeFirebase]);

    useEffect(() => {
        if (!app) return;
        setLoading(true);
        const db = getDatabase(app);

        const listeners = [
            onValue(ref(db, 'storage'), (snapshot) => setStorageData(snapshot.val() || {})),
            onValue(ref(db, 'boxes'), (snapshot) => setBoxesData(snapshot.val() || {})),
            onValue(ref(db, 'waste'), (snapshot) => setWasteData(snapshot.val() || {})),
            onValue(ref(db, 'logs'), (snapshot) => {
                 const logs = snapshot.val() || [];
                 // Firebase returns an array-like object if keys are 0,1,2...
                 const logsArray = Array.isArray(logs) ? logs : Object.values(logs);
                 setLogsData(logsArray.sort((a,b) => new Date(b.time).getTime() - new Date(a.time).getTime()));
            })
        ];

        Promise.all(listeners).then(() => setLoading(false));

        return () => {
            // Detach listeners if needed, though onValue handles this for component unmount
        };
    }, [app]);
    
    const handleConfigSubmit = (config: FirebaseConfig) => {
        setFirebaseConfig(config);
        initializeFirebase(config);
    };

    if (!configExists) {
        return <FirebaseConfigForm onConfigSubmit={handleConfigSubmit} />;
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen text-2xl text-gray-500">
                جاري تحميل البيانات...
            </div>
        );
    }
    
    const renderView = () => {
        if (!app) return null;
        switch (activeView) {
            case 'storage':
                return <StorageView app={app} data={storageData} />;
            case 'boxes':
                return <BoxesView app={app} boxesData={boxesData} storageData={storageData} />;
            case 'waste':
                return <WasteView data={wasteData} />;
            default:
                return <StorageView app={app} data={storageData} />;
        }
    };

    const navItems = [
        { id: 'storage', label: 'المخزن', icon: <ArchiveIcon /> },
        { id: 'boxes', label: 'الصناديق', icon: <BoxIcon /> },
        { id: 'waste', label: 'التوالف', icon: <Trash2Icon /> },
    ];

    return (
        <div className="flex flex-col h-screen text-gray-800 dark:text-gray-200">
            <header className="bg-white dark:bg-gray-800 shadow-md p-4 flex justify-between items-center">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                    <WrenchIcon />
                    إدارة معدات المصنع
                </h1>
                <nav className="flex items-center gap-2 sm:gap-4">
                    {navItems.map(item => (
                        <button
                            key={item.id}
                            onClick={() => setActiveView(item.id)}
                            className={`px-3 py-2 rounded-md text-sm sm:text-base font-medium flex items-center gap-2 transition-colors duration-200 ${
                                activeView === item.id 
                                ? 'bg-blue-600 text-white' 
                                : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                            }`}
                        >
                            {item.icon}
                            <span className="hidden sm:inline">{item.label}</span>
                        </button>
                    ))}
                </nav>
            </header>

            <main className="flex-grow p-4 sm:p-6 overflow-y-auto bg-gray-100 dark:bg-gray-900">
                {renderView()}
            </main>

            <ChangeLog logs={logsData} />
        </div>
    );
}