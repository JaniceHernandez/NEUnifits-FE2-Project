import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, 
  ShoppingCart, 
  Trash2, 
  Plus, 
  Minus, 
  ArrowRight, 
  CheckCircle2, 
  ShoppingBag,
  ShieldCheck
} from 'lucide-react';
import { useApp } from '../context/AppContext';

export const CartDrawer: React.FC = () => {
  const { 
    cart, 
    isCartOpen, 
    setIsCartOpen, 
    removeFromCart, 
    updateCartQuantity, 
    clearCart,
    handleStudentCheckout 
  } = useApp();

  const [isSubmitting, setIsSubmitting] = useState(false);

  const totalAmount = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const totalItemCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  const onCheckout = async () => {
    if (cart.length === 0 || isSubmitting) return;
    setIsSubmitting(true);
    try {
      await handleStudentCheckout();
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isCartOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[250] overflow-hidden">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => setIsCartOpen(false)}
          className="absolute inset-0 bg-slate-900/50 backdrop-blur-xs transition-opacity"
        />

        <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="w-screen max-w-md bg-white shadow-2xl flex flex-col"
          >
            {/* Drawer Header */}
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-brand-blue text-brand-orange rounded-xl flex items-center justify-center font-black shadow-md">
                  <ShoppingCart size={20} />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-800">Your Cart</h3>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{totalItemCount} items selected</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {cart.length > 0 && (
                  <button
                    onClick={clearCart}
                    className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors text-xs font-bold"
                    title="Clear Cart"
                  >
                    <Trash2 size={16} />
                  </button>
                )}
                <button
                  onClick={() => setIsCartOpen(false)}
                  className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded-xl transition-colors"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* Cart Items List */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {cart.length > 0 ? (
                cart.map((item, index) => (
                  <div
                    key={`${item.productName}_${item.size}_${index}`}
                    className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs hover:border-slate-300 transition-all flex flex-col gap-3"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-bold text-slate-900 truncate">{item.productName}</h4>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-[9px] font-black uppercase tracking-wider px-2 py-0.5 bg-slate-100 text-slate-600 rounded">
                            {item.category}
                          </span>
                          <span className="text-[10px] font-black text-brand-blue bg-blue-50 px-2 py-0.5 rounded uppercase">
                            Size: {item.size}
                          </span>
                        </div>
                      </div>

                      <button
                        onClick={() => removeFromCart(index)}
                        className="text-slate-300 hover:text-rose-500 p-1 transition-colors"
                        title="Remove"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                      <div className="flex items-center bg-slate-100 rounded-lg border border-slate-200 overflow-hidden">
                        <button
                          onClick={() => updateCartQuantity(index, -1)}
                          className="px-2.5 py-1 text-slate-600 hover:bg-slate-200 transition-colors"
                        >
                          <Minus size={12} />
                        </button>
                        <span className="w-8 text-center text-xs font-black text-slate-800">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => updateCartQuantity(index, 1)}
                          className="px-2.5 py-1 text-slate-600 hover:bg-slate-200 transition-colors"
                        >
                          <Plus size={12} />
                        </button>
                      </div>

                      <div className="text-right">
                        <span className="text-xs text-slate-400 mr-1">₱{item.price.toLocaleString()} × {item.quantity} =</span>
                        <span className="text-sm font-black text-slate-900">₱{(item.price * item.quantity).toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-center p-8 text-slate-400">
                  <div className="w-16 h-16 bg-slate-100 rounded-3xl flex items-center justify-center text-slate-300 mb-4">
                    <ShoppingBag size={32} />
                  </div>
                  <h4 className="text-base font-bold text-slate-700">Your cart is currently empty</h4>
                  <p className="text-xs text-slate-400 max-w-xs mt-1">Browse the uniform collection and select your sizes to add items to your cart.</p>
                </div>
              )}
            </div>

            {/* Drawer Footer / Submit */}
            {cart.length > 0 && (
              <div className="p-6 border-t border-slate-100 bg-slate-50 space-y-4">
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center text-xs text-slate-500">
                    <span>Subtotal</span>
                    <span>₱{totalAmount.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center text-xs text-slate-500">
                    <span>Processing Fee</span>
                    <span className="text-emerald-600 font-bold">FREE (School Direct)</span>
                  </div>
                  <div className="flex justify-between items-center text-base font-black text-slate-900 pt-2 border-t border-slate-200">
                    <span>Total Amount</span>
                    <span className="text-xl text-brand-blue">₱{totalAmount.toLocaleString()}</span>
                  </div>
                </div>

                <button
                  onClick={onCheckout}
                  disabled={isSubmitting}
                  className="w-full py-4 bg-brand-blue hover:bg-brand-blue-light text-white rounded-2xl font-black text-sm uppercase tracking-wider flex items-center justify-center gap-2 shadow-xl shadow-brand-blue/20 transition-all cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <span>Submitting Order...</span>
                  ) : (
                    <>
                      <span>Submit Uniform Order</span>
                      <ArrowRight size={18} />
                    </>
                  )}
                </button>

                <p className="text-[10px] text-center text-slate-400 font-medium">
                  Payment and size verification will be settled upon pickup at the NEU Uniform Center.
                </p>
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </AnimatePresence>
  );
};
