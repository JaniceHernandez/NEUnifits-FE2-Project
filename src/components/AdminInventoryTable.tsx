import React, { useState } from 'react';
import { 
  Boxes, 
  Search, 
  List, 
  LayoutGrid, 
  Shirt, 
  Eye, 
  EyeOff, 
  Edit3, 
  Trash2, 
  ChevronDown, 
  ChevronUp, 
  Plus 
} from 'lucide-react';
import { Inventory, Product } from '../types';
import { useApp } from '../context/AppContext';
import { cn } from '../lib/utils';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '../firebase';

interface AdminInventoryTableProps {
  inventory: Inventory;
  onEdit: (category: keyof Inventory, name: string, product: Product) => void;
  onDelete: (category: keyof Inventory, name: string) => void;
}

export const AdminInventoryTable: React.FC<AdminInventoryTableProps> = ({
  inventory,
  onEdit,
  onDelete
}) => {
  const { showToast } = useApp();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterGender, setFilterGender] = useState<'all' | 'male' | 'female'>('all');
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');
  const [expandedSizes, setExpandedSizes] = useState<string[]>([]);

  const toggleSizes = (productId: string) => {
    setExpandedSizes(prev => 
      prev.includes(productId) ? prev.filter(id => id !== productId) : [...prev, productId]
    );
  };

  const allProducts: Array<Product & { categoryKey: keyof Inventory }> = [];
  (Object.keys(inventory) as Array<keyof Inventory>).forEach(cat => {
    Object.entries(inventory[cat] || {}).forEach(([name, product]) => {
      const prod = product as Product;
      allProducts.push({
        ...prod,
        name,
        categoryKey: cat
      });
    });
  });

  const filteredProducts = allProducts.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          p.categoryKey.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCat = filterCategory === 'all' || p.categoryKey === filterCategory;
    
    let matchesGender = true;
    if (filterGender !== 'all') {
      const nameLower = p.name.toLowerCase();
      if (filterGender === 'male') {
        matchesGender = nameLower.includes('male') || nameLower.includes('men') || nameLower.includes('boy') || nameLower.includes('polo');
      } else if (filterGender === 'female') {
        matchesGender = nameLower.includes('female') || nameLower.includes('women') || nameLower.includes('girl') || nameLower.includes('blouse') || nameLower.includes('skirt');
      }
    }

    return matchesSearch && matchesCat && matchesGender;
  });

  const handleToggleVisibility = async (category: keyof Inventory, name: string, currentlyHidden: boolean) => {
    const productId = `${category}_${name.replace(/\s+/g, '_').toLowerCase()}`;
    try {
      await setDoc(doc(db, 'inventory', productId), { hidden: !currentlyHidden }, { merge: true });
      showToast(`Product "${name}" is now ${!currentlyHidden ? 'hidden' : 'visible'}`);
    } catch (err) {
      showToast("Error updating visibility", true);
    }
  };

  return (
    <div className="space-y-6">
      {/* Controls & Filter Bar */}
      <div className="bg-white p-4 sm:p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto flex-1">
          {/* Search Box */}
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input 
              type="text"
              placeholder="Search by product name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-brand-blue/10 focus:border-brand-blue"
            />
          </div>

          {/* Category Dropdown */}
          <select 
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none cursor-pointer"
          >
            <option value="all">All Departments</option>
            <option value="college">College</option>
            <option value="highschool">High School</option>
            <option value="accessories">Accessories</option>
          </select>

          {/* Gender Filter */}
          <select 
            value={filterGender}
            onChange={(e) => setFilterGender(e.target.value as any)}
            className="px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none cursor-pointer"
          >
            <option value="all">All Fits</option>
            <option value="male">Male Cut</option>
            <option value="female">Female Cut</option>
          </select>
        </div>

        {/* View Mode & Stats */}
        <div className="flex items-center gap-4 w-full lg:w-auto justify-between lg:justify-end">
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
            {filteredProducts.length} Items Listed
          </span>

          <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200">
            <button
              onClick={() => setViewMode('table')}
              className={cn(
                "px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer",
                viewMode === 'table' ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-900"
              )}
              title="Table View"
            >
              <List size={14} />
              <span>Table</span>
            </button>
            <button
              onClick={() => setViewMode('cards')}
              className={cn(
                "px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer",
                viewMode === 'cards' ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-900"
              )}
              title="Card View"
            >
              <LayoutGrid size={14} />
              <span>Cards</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      {viewMode === 'table' ? (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100">
                  <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Uniform Item</th>
                  <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Department</th>
                  <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Variants & Stock</th>
                  <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</th>
                  <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredProducts.map((product) => {
                  const productId = `${product.categoryKey}_${product.name}`;
                  const isExpanded = expandedSizes.includes(productId);
                  const sizes = Object.entries(product.sizes || {});
                  const totalUnits = sizes.reduce((acc, [_, q]) => acc + (q as number), 0);

                  return (
                    <React.Fragment key={productId}>
                      <tr className={cn("hover:bg-slate-50/50 transition-colors", product.hidden && "bg-slate-50/30 opacity-75")}>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-11 h-11 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-center shrink-0 p-1">
                              {product.imageUrl ? (
                                <img src={product.imageUrl} alt={product.name} className="w-full h-full object-contain" referrerPolicy="no-referrer" />
                              ) : (
                                <Shirt size={18} className="text-slate-300" />
                              )}
                            </div>
                            <div>
                              <h4 className="text-xs font-bold text-slate-900">{product.name}</h4>
                              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                                SKU: {product.name.slice(0, 3).toUpperCase()}-{product.categoryKey.slice(0, 1).toUpperCase()}
                              </span>
                            </div>
                          </div>
                        </td>

                        <td className="px-6 py-4">
                          <span className="px-2.5 py-1 bg-slate-100 text-slate-600 rounded-lg text-[9px] font-black uppercase tracking-wider">
                            {product.categoryKey}
                          </span>
                        </td>

                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div>
                              <span className="text-xs font-bold text-slate-800 block">{sizes.length} Sizes</span>
                              <button 
                                onClick={() => toggleSizes(productId)}
                                className="text-[10px] font-bold text-blue-600 hover:text-blue-700 underline flex items-center gap-1 mt-0.5 cursor-pointer"
                              >
                                {isExpanded ? 'Hide Details' : 'View Sizes & Prices'}
                              </button>
                            </div>
                            <div className="h-6 w-px bg-slate-200" />
                            <div>
                              <span className="text-xs font-black text-slate-900 block">{totalUnits} Units</span>
                              <span className="text-[9px] text-slate-400 uppercase font-medium">In Total</span>
                            </div>
                          </div>
                        </td>

                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <div className={cn("w-2 h-2 rounded-full", product.hidden ? "bg-amber-500" : "bg-emerald-500")} />
                            <span className={cn("text-[10px] font-black uppercase tracking-wider", product.hidden ? "text-amber-600" : "text-emerald-600")}>
                              {product.hidden ? 'Hidden' : 'Active'}
                            </span>
                          </div>
                        </td>

                        <td className="px-6 py-4 text-right">
                          <div className="flex justify-end gap-1">
                            <button 
                              onClick={() => handleToggleVisibility(product.categoryKey, product.name, !!product.hidden)}
                              className="p-2 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-900 transition-colors cursor-pointer"
                              title={product.hidden ? "Make Visible" : "Hide Product"}
                            >
                              {product.hidden ? <EyeOff size={16} /> : <Eye size={16} />}
                            </button>
                            <button 
                              onClick={() => onEdit(product.categoryKey, product.name, product)}
                              className="p-2 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-blue-600 transition-colors cursor-pointer"
                              title="Edit Product"
                            >
                              <Edit3 size={16} />
                            </button>
                            <button 
                              onClick={() => onDelete(product.categoryKey, product.name)}
                              className="p-2 hover:bg-rose-50 rounded-lg text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                              title="Delete Product"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>

                      {/* Expanded Size Variants Row */}
                      {isExpanded && (
                        <tr className="bg-slate-50/70">
                          <td colSpan={5} className="px-6 py-4">
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
                              {sizes.map(([size, qty]) => (
                                <div key={size} className="bg-white p-3 rounded-xl border border-slate-200 shadow-xs">
                                  <div className="flex items-center justify-between mb-1">
                                    <span className="text-[10px] font-black text-slate-400 uppercase">{size}</span>
                                    <span className="text-[10px] font-black text-slate-900">₱{product.prices[size]}</span>
                                  </div>
                                  <div className={cn(
                                    "text-[9px] font-bold px-2 py-0.5 rounded-md text-center",
                                    (qty as number) === 0 ? "bg-rose-50 text-rose-600" : (qty as number) < 10 ? "bg-amber-50 text-amber-600" : "bg-emerald-50 text-emerald-600"
                                  )}>
                                    {qty} in stock
                                  </div>
                                </div>
                              ))}
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}

                {filteredProducts.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-6 py-16 text-center">
                      <Boxes size={40} className="mx-auto mb-3 text-slate-200" />
                      <p className="text-sm font-bold text-slate-500">No matching uniform products found</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* Cards View */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProducts.map((product) => {
            const productId = `${product.categoryKey}_${product.name}`;
            const isExpanded = expandedSizes.includes(productId);
            const sizes = Object.entries(product.sizes || {});
            const totalUnits = sizes.reduce((acc, [_, q]) => acc + (q as number), 0);

            return (
              <div key={productId} className={cn(
                "bg-white rounded-2xl border border-slate-200 p-5 shadow-sm hover:border-slate-300 transition-all flex flex-col justify-between gap-4",
                product.hidden && "bg-slate-50/50 opacity-80"
              )}>
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-12 h-12 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-center shrink-0 p-1">
                        {product.imageUrl ? (
                          <img src={product.imageUrl} alt={product.name} className="w-full h-full object-contain" referrerPolicy="no-referrer" />
                        ) : (
                          <Shirt size={20} className="text-slate-300" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <h4 className="text-xs font-bold text-slate-900 truncate">{product.name}</h4>
                        <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest block truncate">
                          {product.categoryKey} • {sizes.length} sizes
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <div className={cn("w-2 h-2 rounded-full", product.hidden ? "bg-amber-500" : "bg-emerald-500")} />
                      <span className={cn("text-[9px] font-black uppercase tracking-wider", product.hidden ? "text-amber-600" : "text-emerald-600")}>
                        {product.hidden ? 'Hidden' : 'Active'}
                      </span>
                    </div>
                  </div>

                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 flex items-center justify-between text-xs">
                    <div>
                      <span className="text-[8px] text-slate-400 font-bold uppercase tracking-wider block">Total Stock</span>
                      <span className="font-extrabold text-slate-900">{totalUnits} Units</span>
                    </div>
                    <button
                      onClick={() => toggleSizes(productId)}
                      className="text-[9px] font-black text-blue-600 hover:text-blue-700 underline cursor-pointer"
                    >
                      {isExpanded ? 'Hide sizes' : 'Show sizes'}
                    </button>
                  </div>

                  {isExpanded && (
                    <div className="grid grid-cols-2 gap-2 bg-slate-50 p-3 rounded-xl border border-slate-150">
                      {sizes.map(([size, qty]) => (
                        <div key={size} className="bg-white p-2 rounded-lg border border-slate-200 flex flex-col justify-between">
                          <div className="flex items-center justify-between text-[9px]">
                            <span className="font-black text-slate-500">{size}</span>
                            <span className="font-bold text-slate-900">₱{product.prices[size]}</span>
                          </div>
                          <span className={cn(
                            "text-[8px] font-bold rounded mt-1 text-center py-0.5",
                            (qty as number) === 0 ? "bg-rose-50 text-rose-600" : (qty as number) < 10 ? "bg-amber-50 text-amber-600" : "bg-emerald-50 text-emerald-600"
                          )}>
                            {qty} units
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="border-t border-slate-100 pt-3 flex items-center justify-between">
                  <span className="text-[9px] text-slate-400 font-bold uppercase">Actions</span>
                  <div className="flex gap-1">
                    <button 
                      onClick={() => handleToggleVisibility(product.categoryKey, product.name, !!product.hidden)}
                      className="p-2 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-900 transition-colors cursor-pointer"
                      title={product.hidden ? "Make Visible" : "Hide"}
                    >
                      {product.hidden ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                    <button 
                      onClick={() => onEdit(product.categoryKey, product.name, product)}
                      className="p-2 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-blue-600 transition-colors cursor-pointer"
                      title="Edit"
                    >
                      <Edit3 size={14} />
                    </button>
                    <button 
                      onClick={() => onDelete(product.categoryKey, product.name)}
                      className="p-2 hover:bg-rose-50 rounded-lg text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                      title="Delete"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
