
import React, { useState } from 'react';
import type { LogEntry } from '../types';

interface ChangeLogProps {
    logs: LogEntry[];
}

const ChangeLog: React.FC<ChangeLogProps> = ({ logs }) => {
    const [isOpen, setIsOpen] = useState(true);

    const formatTime = (isoString: string) => {
        return new Date(isoString).toLocaleString('ar-EG', {
            year: 'numeric', month: 'short', day: 'numeric',
            hour: '2-digit', minute: '2-digit', second: '2-digit'
        });
    }

    return (
        <footer className={`bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 transition-all duration-300 ${isOpen ? 'h-48' : 'h-12'} flex flex-col`}>
            <div 
                className="flex justify-between items-center p-3 cursor-pointer select-none"
                onClick={() => setIsOpen(!isOpen)}
            >
                <h2 className="text-lg font-bold text-gray-900 dark:text-white">سجل التغيرات</h2>
                <button className="text-gray-600 dark:text-gray-300">{isOpen ? 'إخفاء' : 'إظهار'}</button>
            </div>
            {isOpen && (
                 <div className="overflow-y-auto px-4 pb-2 flex-grow">
                     <ul className="space-y-2">
                        {logs.length === 0 ? (
                            <li className="text-gray-500">لا توجد سجلات لعرضها.</li>
                        ) : (
                            logs.map((log, index) => (
                                <li key={index} className="flex items-start text-sm p-2 rounded-md bg-gray-50 dark:bg-gray-700">
                                    <span className="text-gray-500 dark:text-gray-400 ms-2 font-mono text-xs w-40 flex-shrink-0">
                                        {formatTime(log.time)}
                                    </span>
                                    <span className="text-blue-600 dark:text-blue-400 font-semibold w-20 flex-shrink-0">{log.user}</span>
                                    <p className="text-gray-700 dark:text-gray-300">{log.action}</p>
                                </li>
                            ))
                        )}
                    </ul>
                </div>
            )}
        </footer>
    );
};

export default ChangeLog;
