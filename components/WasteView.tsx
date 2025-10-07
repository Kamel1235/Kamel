
import React from 'react';
import type { WasteData } from '../types';

interface WasteViewProps {
    data: WasteData;
}

const WasteView: React.FC<WasteViewProps> = ({ data }) => {
    return (
        <div>
            <h2 className="text-2xl font-bold mb-4">التوالف</h2>
            <div className="bg-white dark:bg-gray-800 shadow-md rounded-lg overflow-hidden">
                <table className="min-w-full leading-normal">
                    <thead>
                        <tr className="border-b-2 border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700 text-right text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                            <th className="px-5 py-3">المعرّف</th>
                            <th className="px-5 py-3">اسم المعدة</th>
                            <th className="px-5 py-3">الكمية التالفة</th>
                            <th className="px-5 py-3">المصدر</th>
                        </tr>
                    </thead>
                    <tbody>
                        {/* FIX: Using Object.keys to iterate over data to ensure correct type inference for 'item'. */}
                        {Object.keys(data).map((id) => {
                            const item = data[id];
                            return (
                                <tr key={id} className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50">
                                    <td className="px-5 py-4 text-sm"><p className="text-gray-900 dark:text-white whitespace-no-wrap">{id}</p></td>
                                    <td className="px-5 py-4 text-sm"><p className="text-gray-900 dark:text-white whitespace-no-wrap">{item.name}</p></td>
                                    <td className="px-5 py-4 text-sm"><p className="text-gray-900 dark:text-white whitespace-no-wrap">{item.qty}</p></td>
                                    <td className="px-5 py-4 text-sm"><p className="text-gray-900 dark:text-white whitespace-no-wrap">{item.from}</p></td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default WasteView;