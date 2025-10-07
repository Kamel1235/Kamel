
import React, { useState } from 'react';
// FIX: Using type-only import for FirebaseApp.
import type { FirebaseApp } from 'firebase/app';
import type { BoxesData, StorageData } from '../types';
import { performUpdates } from '../services/firebaseService';
import Modal from './Modal';
import { EditIcon, PlusIcon, Trash2Icon } from './icons';

interface BoxesViewProps {
    app: FirebaseApp;
    boxesData: BoxesData;
    storageData: StorageData;
}

const BoxesView: React.FC<BoxesViewProps> = ({ app, boxesData, storageData }) => {
    const [isCreateModalOpen, setCreateModalOpen] = useState(false);
    const [isDetailsModalOpen, setDetailsModalOpen] = useState(false);
    const [selectedBoxId, setSelectedBoxId] = useState<string | null>(null);
    const [newBox, setNewBox] = useState({ id: '', recipient: '', site: '' });
    
    const selectedBox = selectedBoxId ? boxesData[selectedBoxId] : null;

    const handleCreateBox = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newBox.id || !newBox.recipient || !newBox.site) {
            alert("جميع الحقول مطلوبة.");
            return;
        }

        const updates: Record<string, any> = {};
        updates[`/boxes/${newBox.id}`] = {
            recipient: newBox.recipient,
            site: newBox.site,
            items: {},
        };
        const logMessage = `إنشاء صندوق جديد: "${newBox.id}" للمستلم ${newBox.recipient}.`;
        await performUpdates(app, updates, logMessage);

        setNewBox({ id: '', recipient: '', site: '' });
        setCreateModalOpen(false);
    };
    
    const handleUpdateBoxDetails = async (recipient: string, site: string) => {
        if (!selectedBoxId) return;
        const updates: Record<string, any> = {};
        updates[`/boxes/${selectedBoxId}/recipient`] = recipient;
        updates[`/boxes/${selectedBoxId}/site`] = site;
        const logMessage = `تحديث بيانات الصندوق "${selectedBoxId}".`;
        await performUpdates(app, updates, logMessage);
    }
    
    const handleAddItemToBox = async (itemId: string, quantity: number) => {
        if (!selectedBoxId || !storageData[itemId] || quantity <= 0) return;
        
        const currentStorageQty = storageData[itemId].qty;
        if(quantity > currentStorageQty) {
            alert(`الكمية المطلوبة (${quantity}) أكبر من المتوفر في المخزن (${currentStorageQty}).`);
            return;
        }

        const updates: Record<string, any> = {};
        const currentBoxQty = selectedBox?.items?.[itemId] || 0;
        
        updates[`/storage/${itemId}/qty`] = currentStorageQty - quantity;
        updates[`/boxes/${selectedBoxId}/items/${itemId}`] = currentBoxQty + quantity;

        const logMessage = `إضافة ${quantity} من "${storageData[itemId].name}" إلى الصندوق "${selectedBoxId}".`;
        await performUpdates(app, updates, logMessage);
    };

    const handleRemoveItemFromBox = async (itemId: string, quantity: number) => {
        if (!selectedBoxId || !selectedBox?.items?.[itemId]) return;

        const currentBoxQty = selectedBox.items[itemId];
        if (quantity > currentBoxQty) {
             alert(`لا يمكن إزالة كمية أكبر من الموجود في الصندوق.`);
             return;
        }
        
        const updates: Record<string, any> = {};
        const newBoxQty = currentBoxQty - quantity;

        if (newBoxQty > 0) {
            updates[`/boxes/${selectedBoxId}/items/${itemId}`] = newBoxQty;
        } else {
            updates[`/boxes/${selectedBoxId}/items/${itemId}`] = null; // Remove item
        }
        
        updates[`/storage/${itemId}/qty`] = (storageData[itemId]?.qty || 0) + quantity;
        
        const logMessage = `إزالة ${quantity} من "${storageData[itemId].name}" من الصندوق "${selectedBoxId}".`;
        await performUpdates(app, updates, logMessage);
    };

    const openDetailsModal = (boxId: string) => {
        setSelectedBoxId(boxId);
        setDetailsModalOpen(true);
    };

    return (
        <div>
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold">الصناديق</h2>
                <button onClick={() => setCreateModalOpen(true)} className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700">
                    إنشاء صندوق جديد
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* FIX: Using Object.keys to iterate over data to ensure correct type inference for 'box'. */}
                {Object.keys(boxesData).map((id) => {
                    const box = boxesData[id];
                    return (
                        <div key={id} onClick={() => openDetailsModal(id)} className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow cursor-pointer hover:shadow-lg transition-shadow">
                            <h3 className="font-bold text-lg text-blue-600 dark:text-blue-400">{id}</h3>
                            <p className="text-gray-700 dark:text-gray-300">المستلم: {box.recipient}</p>
                            <p className="text-gray-600 dark:text-gray-400">الموقع: {box.site}</p>
                            <p className="text-gray-600 dark:text-gray-400 mt-2">عدد الأصناف: {box.items ? Object.keys(box.items).length : 0}</p>
                        </div>
                    );
                })}
            </div>
            
            <Modal isOpen={isCreateModalOpen} onClose={() => setCreateModalOpen(false)} title="إنشاء صندوق جديد">
                <form onSubmit={handleCreateBox} className="space-y-4">
                    <input type="text" placeholder="رقم الصندوق (e.g., BOX1)" value={newBox.id} onChange={(e) => setNewBox({...newBox, id: e.target.value.toUpperCase()})} className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600" required />
                    <input type="text" placeholder="اسم المستلم" value={newBox.recipient} onChange={(e) => setNewBox({...newBox, recipient: e.target.value})} className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600" required />
                    <input type="text" placeholder="اسم الموقع" value={newBox.site} onChange={(e) => setNewBox({...newBox, site: e.target.value})} className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600" required />
                    <button type="submit" className="w-full bg-blue-600 text-white p-2 rounded hover:bg-blue-700">إنشاء</button>
                </form>
            </Modal>

            {selectedBox && (
                <BoxDetailsModal 
                    isOpen={isDetailsModalOpen}
                    onClose={() => setDetailsModalOpen(false)}
                    boxId={selectedBoxId!}
                    box={selectedBox}
                    storageData={storageData}
                    onAddItem={handleAddItemToBox}
                    onRemoveItem={handleRemoveItemFromBox}
                    onUpdateDetails={handleUpdateBoxDetails}
                />
            )}
        </div>
    );
};

interface BoxDetailsModalProps {
    isOpen: boolean;
    onClose: () => void;
    boxId: string;
    box: BoxesData[string];
    storageData: StorageData;
    onAddItem: (itemId: string, quantity: number) => void;
    onRemoveItem: (itemId: string, quantity: number) => void;
    onUpdateDetails: (recipient: string, site: string) => void;
}

const BoxDetailsModal: React.FC<BoxDetailsModalProps> = ({ isOpen, onClose, boxId, box, storageData, onAddItem, onRemoveItem, onUpdateDetails }) => {
    const [itemToAdd, setItemToAdd] = useState('');
    const [quantity, setQuantity] = useState(1);
    const [isEditing, setIsEditing] = useState(false);
    const [editRecipient, setEditRecipient] = useState(box.recipient);
    const [editSite, setEditSite] = useState(box.site);

    const handleAddItem = (e: React.FormEvent) => {
        e.preventDefault();
        onAddItem(itemToAdd, quantity);
        setItemToAdd('');
        setQuantity(1);
    }
    
    const handleSaveDetails = () => {
        onUpdateDetails(editRecipient, editSite);
        setIsEditing(false);
    }

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={`تفاصيل الصندوق: ${boxId}`}>
            <div className="space-y-4">
                {isEditing ? (
                    <div className='space-y-2 p-2 border rounded-md dark:border-gray-600'>
                         <input type="text" value={editRecipient} onChange={e => setEditRecipient(e.target.value)} className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600" />
                         <input type="text" value={editSite} onChange={e => setEditSite(e.target.value)} className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600" />
                         <button onClick={handleSaveDetails} className="bg-green-600 text-white px-3 py-1 rounded-md text-sm">حفظ</button>
                         <button onClick={() => setIsEditing(false)} className="bg-gray-300 dark:bg-gray-600 text-black dark:text-white px-3 py-1 rounded-md text-sm me-2">إلغاء</button>
                    </div>
                ) : (
                    <div className='flex justify-between items-start p-2'>
                        <div>
                            <p><strong>المستلم:</strong> {box.recipient}</p>
                            <p><strong>الموقع:</strong> {box.site}</p>
                        </div>
                        <button onClick={() => setIsEditing(true)} className="text-blue-500 hover:text-blue-700 flex items-center gap-1 text-sm"><EditIcon /> تعديل</button>
                    </div>
                )}
                
                <div className="border-t pt-4">
                    <h4 className="font-bold mb-2">محتويات الصندوق</h4>
                    <ul className='space-y-2'>
                       {box.items && Object.keys(box.items).length > 0 ? Object.entries(box.items).map(([itemId, qty]) => (
                            <li key={itemId} className="flex justify-between items-center p-2 bg-gray-100 dark:bg-gray-700 rounded">
                                <span>{storageData[itemId]?.name || itemId} (الكمية: {qty})</span>
                                <button onClick={() => onRemoveItem(itemId, 1)} className="text-red-500 hover:text-red-700 p-1 rounded-full bg-red-100 dark:bg-red-900/50">
                                    <Trash2Icon />
                                </button>
                            </li>
                        )) : <p className="text-gray-500">الصندوق فارغ.</p>}
                    </ul>
                </div>
                
                <div className="border-t pt-4">
                     <h4 className="font-bold mb-2">إضافة معدات من المخزن</h4>
                     <form onSubmit={handleAddItem} className="flex gap-2 items-center">
                        <select value={itemToAdd} onChange={e => setItemToAdd(e.target.value)} className="flex-grow p-2 border rounded dark:bg-gray-700 dark:border-gray-600">
                            <option value="">اختر معدة...</option>
                            {/* FIX: Using Object.keys to iterate over data to ensure correct type inference for 'item'. */}
                            {Object.keys(storageData).map((id) => {
                                const item = storageData[id];
                                return (
                                    <option key={id} value={id} disabled={item.qty === 0}>
                                        {item.name} (متوفر: {item.qty})
                                    </option>
                                );
                            })}
                        </select>
                        <input type="number" value={quantity} onChange={e => setQuantity(parseInt(e.target.value))} min="1" className="w-20 p-2 border rounded dark:bg-gray-700 dark:border-gray-600" />
                        <button type="submit" className="bg-blue-600 text-white p-2 rounded hover:bg-blue-700"><PlusIcon/></button>
                     </form>
                </div>
            </div>
        </Modal>
    );
}

export default BoxesView;