import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, 
  AlertCircle, 
  Edit3, 
  Check, 
  Calendar, 
  CheckCircle2, 
  Bell, 
  Info, 
  XCircle, 
  Plus, 
  Minus, 
  Trash2, 
  Printer, 
  FileText,
  Clock,
  Sparkles
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Product, Inventory, Order, AppNotification } from '../types';
import { cn } from '../lib/utils';

export function SuccessOverlay({ message, onClose }: { message: string; onClose: () => void }) {
  useEffect(() => {
    const timer = setTimeout(onClose, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <motion.div
      initial={{ opacity: 0, y: -20, x: 20 }}
      animate={{ opacity: 1, y: 0, x: 0 }}
      exit={{ opacity: 0, y: -20, x: 20 }}
      className="fixed top-8 right-8 z-[500] bg-white rounded-2xl p-4 shadow-2xl border border-slate-200 flex items-center gap-4 min-w-[320px] max-w-md"
    >
      <div className="w-11 h-11 bg-emerald-50 rounded-xl flex items-center justify-center shrink-0 border border-emerald-100">
        <Check size={22} className="text-emerald-600" strokeWidth={3} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-black uppercase tracking-wider text-emerald-600 mb-0.5">Success</p>
        <p className="text-sm font-bold text-slate-800 leading-tight break-words">{message}</p>
      </div>
      <button 
        onClick={onClose}
        className="p-2 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-600 transition-colors"
      >
        <X size={16} />
      </button>
    </motion.div>
  );
}

export function ConfirmationModal() {
  const { confirmModal, setConfirmModal } = useApp();
  if (!confirmModal || !confirmModal.isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[300] flex items-center justify-center bg-slate-900/40 backdrop-blur-[2px] p-4"
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 20 }}
          className="bg-white rounded-2xl p-8 max-w-sm w-full shadow-2xl border border-slate-200"
        >
          <div className="w-16 h-16 bg-amber-50 rounded-2xl flex items-center justify-center text-amber-500 mb-6 mx-auto">
            <AlertCircle size={32} />
          </div>
          <h3 className="text-xl font-bold text-slate-800 text-center mb-2">{confirmModal.title}</h3>
          <p className="text-slate-500 text-center text-sm mb-8 leading-relaxed">{confirmModal.message}</p>
          
          <div className="flex gap-3">
            <button
              onClick={() => setConfirmModal(null)}
              className="flex-1 py-3 rounded-xl font-bold text-sm text-slate-600 bg-slate-100 hover:bg-slate-200 transition-all cursor-pointer"
            >
              Cancel
            </button>
            <button
              onClick={() => {
                confirmModal.onConfirm();
                setConfirmModal(null);
              }}
              className="flex-1 py-3 rounded-xl font-bold text-sm text-white bg-brand-blue hover:bg-brand-blue-light transition-all cursor-pointer"
            >
              Confirm
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

export function PromptModal() {
  const { promptModal, setPromptModal } = useApp();
  const [value, setValue] = useState('');

  useEffect(() => {
    if (promptModal) setValue(promptModal.defaultValue || '');
  }, [promptModal]);

  if (!promptModal || !promptModal.isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[300] flex items-center justify-center bg-slate-900/40 backdrop-blur-[2px] p-4"
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 20 }}
          className="bg-white rounded-2xl p-8 max-w-sm w-full shadow-2xl border border-slate-200"
        >
          <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600 mb-6 mx-auto">
            <Edit3 size={32} />
          </div>
          <h3 className="text-xl font-bold text-slate-800 text-center mb-2">{promptModal.title}</h3>
          <p className="text-slate-500 text-center text-sm mb-6 whitespace-pre-line leading-relaxed">{promptModal.message}</p>
          
          <input
            type="text"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 transition-all mb-8 text-sm"
            placeholder="Enter value..."
            autoFocus
          />

          <div className="flex gap-3">
            <button
              onClick={() => setPromptModal(null)}
              className="flex-1 py-3 rounded-xl font-bold text-sm text-slate-600 bg-slate-100 hover:bg-slate-200 transition-all cursor-pointer"
            >
              Cancel
            </button>
            <button
              onClick={() => {
                promptModal.onConfirm(value);
                setPromptModal(null);
              }}
              className="flex-1 py-3 rounded-xl font-bold text-sm text-white bg-brand-blue hover:bg-brand-blue-light transition-all cursor-pointer"
            >
              Save
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

export function NotificationDetailModal() {
  const { selectedNotification, setSelectedNotification, handleMarkNotificationAsRead } = useApp();
  if (!selectedNotification) return null;

  const formattedDate = () => {
    if (!selectedNotification.createdAt) return "";
    try {
      const date = new Date(selectedNotification.createdAt);
      return date.toLocaleDateString("en-US", {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return selectedNotification.createdAt;
    }
  };

  const getIconClassAndElem = () => {
    const titleLower = selectedNotification.title?.toLowerCase() || '';
    if (titleLower.includes('approved')) {
      return { bg: "bg-emerald-50", text: "text-emerald-500", icon: <CheckCircle2 size={32} /> };
    } else if (titleLower.includes('ready')) {
      return { bg: "bg-blue-50", text: "text-blue-500", icon: <Bell size={32} /> };
    } else if (titleLower.includes('completed')) {
      return { bg: "bg-teal-50", text: "text-teal-500", icon: <Check size={32} /> };
    } else if (titleLower.includes('cancelled')) {
      return { bg: "bg-rose-50", text: "text-rose-500", icon: <XCircle size={32} /> };
    }
    return { bg: "bg-slate-50", text: "text-slate-600", icon: <Info size={32} /> };
  };

  const styling = getIconClassAndElem();

  const handleClose = () => {
    if (selectedNotification.id) {
      handleMarkNotificationAsRead(selectedNotification.id);
    }
    setSelectedNotification(null);
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[500] flex items-center justify-center bg-slate-900/40 backdrop-blur-[2px] p-4"
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 20 }}
          className="bg-white rounded-2xl p-8 max-w-md w-full shadow-2xl border border-slate-200 relative overflow-hidden"
        >
          <button 
            onClick={handleClose}
            className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer"
          >
            <X size={16} />
          </button>

          <div className="flex flex-col items-center text-center">
            <div className={`w-16 h-16 ${styling.bg} ${styling.text} rounded-full flex items-center justify-center mb-6 shadow-sm`}>
              {styling.icon}
            </div>

            <span className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1">
              Uniform Center Update
            </span>

            <h3 className="text-xl font-extrabold text-slate-800 leading-snug mb-4">
              {selectedNotification.title}
            </h3>

            <div className="bg-slate-50 rounded-xl p-5 border border-slate-100 w-full mb-6 text-left">
              <p className="text-slate-600 text-sm leading-relaxed font-medium">
                {selectedNotification.message}
              </p>
            </div>

            {formattedDate() && (
              <div className="flex items-center gap-2 text-slate-400 text-xs mb-8 bg-slate-100/50 py-1.5 px-3 rounded-full">
                <Calendar size={13} className="text-slate-400" />
                <span className="font-semibold">{formattedDate()}</span>
              </div>
            )}

            <button
              onClick={handleClose}
              className="w-full py-3.5 rounded-xl font-bold text-sm text-white bg-brand-blue hover:bg-brand-blue-light transition-all cursor-pointer shadow-md"
            >
              Acknowledge Notification
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

export function EditProductModal() {
  const { editingProduct, setEditingProduct, handleUpdateProduct } = useApp();
  const [formData, setFormData] = useState<Product | null>(null);
  const [newSize, setNewSize] = useState('');
  const [newQty, setNewQty] = useState(0);
  const [newPrice, setNewPrice] = useState(0);

  useEffect(() => {
    if (editingProduct) {
      setFormData({ ...editingProduct.product });
    } else {
      setFormData(null);
    }
  }, [editingProduct]);

  if (!editingProduct || !formData) return null;

  const handleAddSize = () => {
    if (!newSize.trim()) return;
    setFormData(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        sizes: { ...prev.sizes, [newSize.trim()]: newQty },
        prices: { ...prev.prices, [newSize.trim()]: newPrice }
      };
    });
    setNewSize('');
    setNewQty(0);
    setNewPrice(0);
  };

  const handleRemoveSize = (size: string) => {
    setFormData(prev => {
      if (!prev) return prev;
      const newSizes = { ...prev.sizes };
      const newPrices = { ...prev.prices };
      delete newSizes[size];
      delete newPrices[size];
      return { ...prev, sizes: newSizes, prices: newPrices };
    });
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl border border-slate-200"
      >
        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-brand-blue text-white rounded-xl shadow-sm">
              <Plus size={18} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900">Manage Product Record</h3>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{editingProduct.category} Uniform Section</p>
            </div>
          </div>
          <button onClick={() => setEditingProduct(null)} className="p-2 hover:bg-slate-200 rounded-xl transition-colors text-slate-400">
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Product Title</label>
              <input 
                type="text"
                value={formData.name}
                onChange={(e) => setFormData(prev => prev ? ({ ...prev, name: e.target.value }) : null)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:ring-1 focus:ring-brand-blue"
                placeholder="e.g. Female Blouse"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Item Classification</label>
              <select 
                value={formData.category}
                onChange={(e) => setFormData(prev => prev ? ({ ...prev, category: e.target.value as keyof Inventory }) : null)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none cursor-pointer"
              >
                <option value="college">College Department</option>
                <option value="highschool">High School Department</option>
                <option value="accessories">General Accessories</option>
              </select>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Image URL</label>
            <div className="flex gap-2">
              <input 
                type="text"
                value={formData.imageUrl || ''}
                onChange={(e) => setFormData(prev => prev ? ({ ...prev, imageUrl: e.target.value }) : null)}
                className="flex-1 px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:ring-1 focus:ring-brand-blue"
                placeholder="https://..."
              />
              {formData.imageUrl && (
                <div className="w-10 h-10 rounded-xl border border-slate-200 overflow-hidden shrink-0 bg-slate-50 p-1">
                  <img src={formData.imageUrl} alt="Preview" className="w-full h-full object-contain" referrerPolicy="no-referrer" />
                </div>
              )}
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100">
            <div className="flex items-center justify-between mb-4">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Variants & Stock</label>
            </div>
            
            <div className="bg-slate-50 rounded-xl p-4 border border-slate-100 mb-6">
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                <div className="space-y-1">
                  <span className="text-[9px] font-bold text-slate-400 uppercase px-1">Size / Label</span>
                  <input 
                    type="text" 
                    placeholder="e.g. M, L, XL" 
                    value={newSize}
                    onChange={(e) => setNewSize(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-bold focus:outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <span className="text-[9px] font-bold text-slate-400 uppercase px-1">Initial Qty</span>
                  <input 
                    type="number" 
                    placeholder="0" 
                    value={newQty}
                    onChange={(e) => setNewQty(parseInt(e.target.value) || 0)}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-bold focus:outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <span className="text-[9px] font-bold text-slate-400 uppercase px-1">Price (₱)</span>
                  <input 
                    type="number" 
                    placeholder="0.00" 
                    value={newPrice}
                    onChange={(e) => setNewPrice(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-bold focus:outline-none"
                  />
                </div>
                <div className="flex items-end">
                  <button 
                    onClick={handleAddSize}
                    className="w-full h-[36px] bg-brand-blue text-white rounded-lg text-xs font-bold hover:bg-brand-blue-light transition-all flex items-center justify-center gap-2 shadow-sm cursor-pointer"
                  >
                    <Plus size={14} /> Add Size
                  </button>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              {Object.entries(formData.sizes).map(([size, qty]) => (
                <div key={size} className="flex items-center gap-4 bg-white p-3 rounded-xl border border-slate-200 transition-all hover:border-slate-300">
                  <div className="flex flex-col min-w-[60px] border-r border-slate-100 pr-3">
                    <span className="text-[8px] font-black text-slate-400 uppercase">Size</span>
                    <span className="text-xs font-black text-slate-800">{size}</span>
                  </div>
                  
                  <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="flex items-center gap-3">
                      <span className="text-[9px] font-black text-slate-400 uppercase w-12 text-right">Stock:</span>
                      <div className="flex items-center bg-slate-100 rounded-lg border border-slate-200 overflow-hidden">
                        <button 
                          onClick={() => setFormData(prev => prev ? ({ ...prev, sizes: { ...prev.sizes, [size]: Math.max(0, (qty as number) - 1) } }) : null)}
                          className="px-2.5 py-1 hover:bg-slate-200 text-slate-500 transition-colors"
                        >
                          <Minus size={12} />
                        </button>
                        <input 
                          type="number"
                          value={qty}
                          onChange={(e) => {
                            const val = parseInt(e.target.value) || 0;
                            setFormData(prev => prev ? ({ ...prev, sizes: { ...prev.sizes, [size]: val } }) : null);
                          }}
                          className="w-12 text-center text-xs font-black text-slate-800 bg-transparent focus:outline-none"
                        />
                        <button 
                          onClick={() => setFormData(prev => prev ? ({ ...prev, sizes: { ...prev.sizes, [size]: (qty as number) + 1 } }) : null)}
                          className="px-2.5 py-1 hover:bg-slate-200 text-slate-500 transition-colors"
                        >
                          <Plus size={12} />
                        </button>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="text-[9px] font-black text-slate-400 uppercase w-12 text-right">Price:</span>
                      <div className="flex items-center gap-1.5 bg-slate-50 px-3 py-1 rounded-lg border border-slate-100">
                        <span className="text-slate-400 font-bold text-xs">₱</span>
                        <input 
                          type="number"
                          value={formData.prices[size]}
                          onChange={(e) => {
                            const val = parseFloat(e.target.value) || 0;
                            setFormData(prev => prev ? ({ ...prev, prices: { ...prev.prices, [size]: val } }) : null);
                          }}
                          className="w-20 font-bold text-xs text-slate-800 bg-transparent focus:outline-none"
                        />
                      </div>
                    </div>
                  </div>

                  <button 
                    onClick={() => handleRemoveSize(size)}
                    className="p-2 text-slate-300 hover:text-rose-600 transition-colors hover:bg-rose-50 rounded-lg cursor-pointer"
                    title="Remove Size"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              ))}
              {Object.keys(formData.sizes).length === 0 && (
                <div className="text-center py-6 border-2 border-dashed border-slate-100 rounded-xl">
                  <p className="text-xs font-bold text-slate-400">No size variants added yet</p>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="p-5 border-t border-slate-100 flex justify-end gap-3 bg-slate-50">
          <button 
            onClick={() => setEditingProduct(null)}
            className="px-5 py-2.5 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-200 transition-all cursor-pointer"
          >
            Cancel
          </button>
          <button 
            onClick={() => {
              if (formData && editingProduct) {
                handleUpdateProduct(editingProduct.category, editingProduct.name, formData);
              }
            }}
            className="px-6 py-2.5 bg-brand-blue text-white rounded-xl text-xs font-bold hover:bg-brand-blue-light transition-all shadow-md cursor-pointer"
          >
            Save Uniform Record
          </button>
        </div>
      </motion.div>
    </div>
  );
}

export function AssignPickupModal() {
  const { assignPickupOrder, setAssignPickupOrder, handleUpdateOrderStatus } = useApp();
  const [date, setDate] = useState('');

  useEffect(() => {
    if (assignPickupOrder) {
      // Default to 3 days from today
      const defaultDate = new Date(Date.now() + 86400000 * 3).toISOString().split('T')[0];
      setDate(assignPickupOrder.pickupDate || defaultDate);
    }
  }, [assignPickupOrder]);

  if (!assignPickupOrder) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!date) return;
    handleUpdateOrderStatus(assignPickupOrder, 'approved', date);
    setAssignPickupOrder(null);
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[300] flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-2xl border border-slate-200 p-6"
      >
        <div className="flex items-center gap-4 mb-6">
          <div className="w-12 h-12 bg-blue-50 text-brand-blue rounded-2xl flex items-center justify-center">
            <Calendar size={24} />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900">Schedule Pickup</h3>
            <p className="text-xs text-slate-500">Order #{assignPickupOrder.id}</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Pickup Date</label>
            <input 
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-blue"
              required
            />
          </div>

          <div className="bg-slate-50 p-4 rounded-xl text-xs text-slate-600 space-y-1">
            <p className="font-bold text-slate-800">Student: {assignPickupOrder.studentName}</p>
            <p className="text-slate-500">{assignPickupOrder.studentEmail}</p>
            <p className="font-medium text-slate-500 mt-2">Setting this date will automatically send an in-app notification to the student informing them when to claim their items.</p>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={() => setAssignPickupOrder(null)}
              className="flex-1 py-3 rounded-xl font-bold text-sm text-slate-600 bg-slate-100 hover:bg-slate-200 transition-all cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 py-3 rounded-xl font-bold text-sm text-white bg-brand-blue hover:bg-brand-blue-light transition-all cursor-pointer shadow-md"
            >
              Approve & Notify
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

export function InvoiceModal() {
  const { selectedInvoiceOrder, setSelectedInvoiceOrder } = useApp();
  if (!selectedInvoiceOrder) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[400] flex items-center justify-center p-4 overflow-y-auto">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl border border-slate-200 my-8 print:m-0 print:border-none print:shadow-none"
      >
        {/* Header toolbar */}
        <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50 print:hidden">
          <div className="flex items-center gap-2 text-slate-700 font-bold text-sm">
            <FileText size={18} className="text-brand-blue" />
            <span>Order Invoice & Receipt</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-4 py-2 bg-brand-blue text-white rounded-xl text-xs font-bold flex items-center gap-2 hover:bg-brand-blue-light transition-all cursor-pointer shadow-sm"
            >
              <Printer size={15} /> Print Receipt
            </button>
            <button
              onClick={() => setSelectedInvoiceOrder(null)}
              className="p-2 hover:bg-slate-200 rounded-xl text-slate-400 transition-colors cursor-pointer"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Printable Area */}
        <div className="p-8 sm:p-10 font-sans space-y-8 print:p-0">
          <div className="flex justify-between items-start border-b border-slate-200 pb-8">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="font-extrabold text-2xl tracking-tight text-brand-blue font-display">
                  NEU<span className="text-brand-orange">NIFITS</span>
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium">New Era University • Uniform Distribution Center</p>
              <p className="text-xs text-slate-400 mt-0.5">#9 Central Avenue, New Era, Quezon City</p>
            </div>
            <div className="text-right">
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Official Receipt</span>
              <p className="text-lg font-black text-slate-900">{selectedInvoiceOrder.id}</p>
              <p className="text-xs text-slate-500">{new Date(selectedInvoiceOrder.createdAt).toLocaleDateString("en-US", { year: 'numeric', month: 'long', day: 'numeric' })}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6 bg-slate-50 p-5 rounded-2xl border border-slate-100">
            <div>
              <span className="text-[9px] font-black uppercase tracking-widest text-slate-400 block mb-1">Customer Information</span>
              <p className="text-sm font-bold text-slate-900">{selectedInvoiceOrder.studentName}</p>
              <p className="text-xs text-slate-500 font-medium">{selectedInvoiceOrder.studentEmail}</p>
            </div>
            <div>
              <span className="text-[9px] font-black uppercase tracking-widest text-slate-400 block mb-1">Status & Pickup</span>
              <p className="text-xs font-bold text-brand-blue uppercase">{selectedInvoiceOrder.status}</p>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                {selectedInvoiceOrder.pickupDate 
                  ? `Scheduled: ${new Date(selectedInvoiceOrder.pickupDate).toLocaleDateString("en-US", { year: 'numeric', month: 'short', day: 'numeric' })}`
                  : 'Pickup schedule pending'}
              </p>
            </div>
          </div>

          <div>
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="pb-3 text-[10px] font-black text-slate-400 uppercase tracking-wider">Item & Category</th>
                  <th className="pb-3 text-[10px] font-black text-slate-400 uppercase tracking-wider">Size</th>
                  <th className="pb-3 text-[10px] font-black text-slate-400 uppercase tracking-wider text-center">Qty</th>
                  <th className="pb-3 text-[10px] font-black text-slate-400 uppercase tracking-wider text-right">Unit Price</th>
                  <th className="pb-3 text-[10px] font-black text-slate-400 uppercase tracking-wider text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {selectedInvoiceOrder.items.map((item, idx) => (
                  <tr key={idx}>
                    <td className="py-3.5">
                      <p className="text-xs font-bold text-slate-800">{item.productName}</p>
                      <p className="text-[10px] text-slate-400 uppercase font-medium">{item.category}</p>
                    </td>
                    <td className="py-3.5 text-xs font-bold text-brand-blue">{item.size}</td>
                    <td className="py-3.5 text-xs font-bold text-slate-700 text-center">{item.quantity}</td>
                    <td className="py-3.5 text-xs font-bold text-slate-600 text-right">₱{item.price.toLocaleString()}</td>
                    <td className="py-3.5 text-xs font-black text-slate-900 text-right">₱{(item.price * item.quantity).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="border-t border-slate-200 pt-4 flex justify-between items-center">
            <span className="text-xs font-black uppercase tracking-widest text-slate-400">Total Due / Paid</span>
            <span className="text-2xl font-black text-slate-900">₱{selectedInvoiceOrder.totalAmount.toLocaleString()}</span>
          </div>

          <div className="bg-slate-50 p-4 rounded-xl text-center text-xs text-slate-400 font-medium border border-slate-100">
            Please present this receipt along with your valid NEU Student ID during your designated pickup window.
          </div>
        </div>
      </motion.div>
    </div>
  );
}
