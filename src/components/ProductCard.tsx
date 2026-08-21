import React, { useState } from 'react';
import { motion } from 'motion/react';
import { 
  Shirt, 
  ShoppingCart, 
  Edit3, 
  Trash2, 
  Eye, 
  EyeOff, 
  Check, 
  Sparkles,
  Layers
} from 'lucide-react';
import { Product, Inventory, CartItem } from '../types';
import { cn } from '../lib/utils';
import { useApp } from '../context/AppContext';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '../firebase';

interface ProductCardProps {
  name: string;
  info: Product;
  category: keyof Inventory;
  isAdmin: boolean;
  selectedSize: string | null;
  onSelectSize: (size: string) => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  name,
  info,
  category,
  isAdmin,
  selectedSize,
  onSelectSize
}) => {
  const { 
    addToCart, 
    showToast, 
    handleDeleteProduct, 
    handleUpdateImage,
    setEditingProduct 
  } = useApp();

  const [isExpanded, setIsExpanded] = useState(false);

  const hasStock = Object.values(info.sizes).some(qty => (qty as number) > 0);
  const isTooLong = name.length > 28;
  const displayName = isTooLong && !isExpanded ? name.slice(0, 25) + '...' : name;

  const handleAddToCartClick = () => {
    if (!selectedSize) {
      showToast("Please select a size first", true);
      return;
    }
    const price = info.prices[selectedSize] || 0;
    addToCart({
      productName: name,
      category,
      size: selectedSize,
      price,
      quantity: 1
    });
  };

  const handleToggleVisibility = async () => {
    const productId = `${category}_${name.replace(/\s+/g, '_').toLowerCase()}`;
    try {
      await setDoc(doc(db, 'inventory', productId), {
        hidden: !info.hidden
      }, { merge: true });
      showToast(`Product "${name}" is now ${!info.hidden ? 'hidden from student view' : 'visible to students'}`);
    } catch (error) {
      showToast("Error updating visibility", true);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "bg-white rounded-3xl overflow-hidden shadow-sm border transition-all hover:shadow-xl hover:border-slate-300 relative flex flex-col h-full group",
        info.hidden ? "bg-slate-50/70 border-dashed border-slate-300" : "border-slate-200"
      )}
    >
      {info.hidden && (
        <div className="bg-amber-500 text-white text-[9px] font-black uppercase tracking-widest text-center py-1 z-20">
          Hidden from Students
        </div>
      )}

      {/* Image Showcase */}
      <div className="h-56 bg-slate-50 relative overflow-hidden flex items-center justify-center p-6 shrink-0 transition-colors group-hover:bg-slate-100/70">
        {info.imageUrl ? (
          <img 
            src={info.imageUrl} 
            alt={name} 
            className="max-w-full max-h-full object-contain transition-transform duration-500 group-hover:scale-105"
            referrerPolicy="no-referrer" 
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center text-slate-300 border-2 border-dashed border-slate-200 rounded-2xl p-4 text-center">
            <Shirt size={32} className="mb-2 opacity-50" />
            <span className="text-[10px] font-bold uppercase tracking-wider">No Image Preview</span>
          </div>
        )}

        <div className={cn(
          "absolute top-4 right-4 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-wider shadow-sm border",
          hasStock ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-rose-50 text-rose-700 border-rose-200"
        )}>
          {hasStock ? 'In Stock' : 'Sold Out'}
        </div>

        <div className="absolute top-4 left-4 px-2.5 py-1 bg-white/90 backdrop-blur-xs rounded-full text-[9px] font-black uppercase tracking-widest text-slate-500 border border-slate-200">
          {category}
        </div>
      </div>

      {/* Product Content */}
      <div className="p-6 flex flex-col flex-1 justify-between">
        <div>
          <div className="flex justify-between items-start mb-3">
            <div className="flex-1 pr-2">
              <h4 className="text-base font-bold text-slate-900 leading-tight">{displayName}</h4>
              {isTooLong && (
                <button 
                  onClick={() => setIsExpanded(!isExpanded)}
                  className="text-[10px] font-bold text-brand-orange hover:underline uppercase tracking-wider mt-0.5 cursor-pointer"
                >
                  {isExpanded ? 'Collapse' : 'Expand'}
                </button>
              )}
            </div>

            {/* Admin Quick Actions */}
            {isAdmin && (
              <div className="flex items-center gap-1 shrink-0">
                <button 
                  onClick={handleToggleVisibility}
                  className={cn(
                    "p-1.5 rounded-lg transition-colors cursor-pointer",
                    info.hidden ? "text-amber-500 hover:bg-amber-50" : "text-slate-400 hover:text-slate-700 hover:bg-slate-100"
                  )}
                  title={info.hidden ? "Make Visible" : "Hide Product"}
                >
                  {info.hidden ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
                <button 
                  onClick={() => handleUpdateImage(category, name)}
                  className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                  title="Update Image URL"
                >
                  <Edit3 size={16} />
                </button>
                <button 
                  onClick={() => handleDeleteProduct(category, name)}
                  className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                  title="Delete Product"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            )}
          </div>

          {/* Size Selector Grid */}
          <div className="space-y-2 mt-4">
            <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-slate-400">
              <span>Select Size</span>
              {selectedSize && (
                <span className="text-brand-blue font-bold">Selected: {selectedSize} (₱{info.prices[selectedSize]})</span>
              )}
            </div>

            <div className="grid grid-cols-3 gap-2">
              {Object.entries(info.sizes).map(([size, qty]) => {
                const isSelected = selectedSize === size;
                const isOutOfStock = (qty as number) === 0;

                return (
                  <button
                    key={size}
                    disabled={isOutOfStock}
                    onClick={() => onSelectSize(size)}
                    className={cn(
                      "py-2.5 px-2 rounded-xl text-xs font-bold transition-all border text-center relative cursor-pointer",
                      isOutOfStock
                        ? "bg-slate-50 text-slate-300 border-slate-150 cursor-not-allowed line-through"
                        : isSelected
                          ? "bg-brand-blue text-white border-brand-blue shadow-md scale-[1.02]"
                          : "bg-white text-slate-700 border-slate-200 hover:border-brand-orange/50 hover:bg-slate-50"
                    )}
                  >
                    <div className="font-extrabold uppercase">{size}</div>
                    <div className={cn(
                      "text-[9px] font-medium mt-0.5",
                      isSelected ? "text-brand-orange" : "text-slate-400"
                    )}>
                      ₱{info.prices[size]}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Action Button */}
        {!isAdmin ? (
          <button 
            disabled={!hasStock}
            onClick={handleAddToCartClick}
            className={cn(
              "w-full mt-6 py-3.5 rounded-2xl font-black text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm",
              hasStock 
                ? "bg-brand-blue text-white hover:bg-brand-blue-light hover:shadow-md" 
                : "bg-slate-100 text-slate-400 cursor-not-allowed"
            )}
          >
            <ShoppingCart size={16} /> {hasStock ? 'Add to Cart' : 'Out of Stock'}
          </button>
        ) : (
          <button
            onClick={() => setEditingProduct({ category, name, product: info })}
            className="w-full mt-6 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-2xl font-bold text-xs uppercase tracking-wider transition-colors flex items-center justify-center gap-2 cursor-pointer"
          >
            <Layers size={14} /> Edit Variants & Stock
          </button>
        )}
      </div>
    </motion.div>
  );
};
