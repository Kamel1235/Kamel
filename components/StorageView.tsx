
import React, { useState } from 'react';
// FIX: Using type-only import for FirebaseApp.
import type { FirebaseApp } from 'firebase/app';
import type { StorageData, Equipment } from '../types';
import { performUpdates } from '../services/firebaseService';
import Modal from './Modal';
import { PlusIcon, MinusIcon, Trash2Icon, PackagePlusIcon } from './icons';

interface StorageViewProps {
    app: FirebaseApp;
    data: StorageData;
}

const StorageView: React.FC<StorageViewProps> = ({ app, data }) => {
    const [isAddModalOpen, setAddModalOpen] = useState(false);
    const [isWasteModalOpen, setWasteModalOpen] = useState(false);
    const [selectedItem, setSelectedItem] = useState<{id: string, name: string, qty: number} | null>(null);
    const [newEquipment, setNewEquipment] = useState({ id: '', name: '', qty: 1, notes: '' });
    const [wasteQuantity, setWasteQuantity] = useState(1);

    const handleQuantityChange = async (id: string, currentQty: number, delta: number) => {
        const newQty = currentQty + delta;
        if (newQty < 0) return;

        const updates: Record<string, any> = {};
        updates[`/storage/${id}/qty`] = newQty;

        const logMessage = `تغيير كمية "${data[id].name}" من ${currentQty} إلى ${newQty}.`;
        await performUpdates(app, updates, logMessage);
    };

    const handleAddEquipment = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newEquipment.id || !newEquipment.name) {
            alert("معرّف واسم المعدة مطلوبان.");
            return;
        }

        const updates: Record<string, any> = {};
        updates[`/storage/${newEquipment.id}`] = {
            name: newEquipment.name,
            qty: Number(newEquipment.qty),
            notes: newEquipment.notes,
        };
        const logMessage = `إضافة معدة جديدة: "${newEquipment.name}" بالمعرف ${newEquipment.id}.`;
        await performUpdates(app, updates, logMessage);

        setNewEquipment({ id: '', name: '', qty: 1, notes: '' });
        setAddModalOpen(false);
    };
    
    const openWasteModal = (id: string, name: string, qty: number) => {
        setSelectedItem({ id, name, qty });
        setWasteQuantity(1);
        setWasteModalOpen(true);
    }
    
    const handleMoveToWaste = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedItem || wasteQuantity <= 0 || wasteQuantity > selectedItem.qty) {
            alert("الكمية غير صالحة.");
            return;
        }

        const updates: Record<string, any> = {};
        const newStorageQty = selectedItem.qty - wasteQuantity;
        updates[`/storage/${selectedItem.id}/qty`] = newStorageQty;
        updates[`/waste/${selectedItem.id}`] = {
            name: selectedItem.name,
            qty: wasteQuantity,
            from: 'المخزن'
        };

        const logMessage = `نقل ${wasteQuantity} من "${selectedItem.name}" إلى التوالف.`;
        await performUpdates(app, updates, logMessage);
        setWasteModalOpen(false);
        setSelectedItem(null);
    };

    return (
        <div>
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold">المخزن</h2>
                <button onClick={() => setAddModalOpen(true)} className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 flex items-center gap-2">
                    <PackagePlusIcon /> إضافة معدة
                </button>
            </div>
            
            <div className="bg-white dark:bg-gray-800 shadow-md rounded-lg overflow-hidden">
                <table className="min-w-full leading-normal">
                    <thead>
                        <tr className="border-b-2 border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700 text-right text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                            <th className="px-5 py-3">المعرّف</th>
                            <th className="px-5 py-3">اسم المعدة</th>
                            <th className="px-5 py-3">الكمية</th>
                            <th className="px-5 py-3">ملاحظات</th>
                            <th className="px-5 py-3">إجراءات</th>
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
                                    <td className="px-5 py-4 text-sm">
                                        <div className="flex items-center gap-2">
                                            <button onClick={() => handleQuantityChange(id, item.qty, -1)} className="p-1 bg-red-500 text-white rounded-full"><MinusIcon /></button>
                                            <span className="font-bold text-lg w-8 text-center">{item.qty}</span>
                                            <button onClick={() => handleQuantityChange(id, item.qty, 1)} className="p-1 bg-green-500 text-white rounded-full"><PlusIcon /></button>
                                        </div>
                                    </td>
                                    <td className="px-5 py-4 text-sm"><p className="text-gray-900 dark:text-white whitespace-no-wrap">{item.notes || '-'}</p></td>
                                    <td className="px-5 py-4 text-sm">
                                      <button onClick={() => openWasteModal(id, item.name, item.qty)} className="text-red-600 hover:text-red-900" title="نقل إلى التوالف">
                                        <Trash2Icon />
                                      </button>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            <Modal isOpen={isAddModalOpen} onClose={() => setAddModalOpen(false)} title="إضافة معدة جديدة">
                <form onSubmit={handleAddEquipment} className="space-y-4">
                    <input type="text" placeholder="المعرّف (e.g., EQ001)" value={newEquipment.id} onChange={(e) => setNewEquipment({...newEquipment, id: e.target.value.toUpperCase()})} className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600" required />
                    <input type="text" placeholder="اسم المعدة" value={newEquipment.name} onChange={(e) => setNewEquipment({...newEquipment, name: e.target.value})} className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600" required />
                    <input type="number" placeholder="الكمية" min="1" value={newEquipment.qty} onChange={(e) => setNewEquipment({...newEquipment, qty: parseInt(e.target.value)})} className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600" required />
                    <textarea placeholder="ملاحظات" value={newEquipment.notes} onChange={(e) => setNewEquipment({...newEquipment, notes: e.target.value})} className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600"></textarea>
                    <button type="submit" className="w-full bg-blue-600 text-white p-2 rounded hover:bg-blue-700">إضافة</button>
                </form>
            </Modal>
            
            <Modal isOpen={isWasteModalOpen} onClose={() => setWasteModalOpen(false)} title={`نقل "${selectedItem?.name}" إلى التوالف`}>
                <form onSubmit={handleMoveToWaste} className="space-y-4">
                    <p>الكمية المتوفرة: {selectedItem?.qty}</p>
                    <input type="number" value={wasteQuantity} onChange={(e) => setWasteQuantity(Math.max(1, parseInt(e.target.value)))} min="1" max={selectedItem?.qty} className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600"/>
                    <button type="submit" className="w-full bg-red-600 text-white p-2 rounded hover:bg-red-700">تأكيد النقل</button>
                </form>
            </Modal>
        </div>
    );
};

export default StorageView;