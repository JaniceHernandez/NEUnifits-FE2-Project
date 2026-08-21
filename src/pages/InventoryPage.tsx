import React, { useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  GraduationCap, 
  School, 
  Watch, 
  ShoppingCart, 
  Boxes, 
  Settings2, 
  ChevronRight, 
  FileSpreadsheet, 
  Download, 
  RotateCcw, 
  Plus, 
  Shirt,
  Sparkles,
  SlidersHorizontal
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { useApp } from '../context/AppContext';
import { ProductCard } from '../components/ProductCard';
import { AdminInventoryTable } from '../components/AdminInventoryTable';
import { Inventory, Product } from '../types';
import { cn } from '../lib/utils';

export const InventoryPage: React.FC = () => {
  const {
    user,
    inventory,
    activeCategory,
    setActiveCategory,
    studentGenderFilter,
    setStudentGenderFilter,
    globalSelectedSize,
    setGlobalSelectedSize,
    isInventoryControlsOpen,
    setIsInventoryControlsOpen,
    csvMode,
    setCsvMode,
    handleExcelUpload,
    setEditingProduct,
    handleDeleteProduct,
    showToast,
    cart,
    setIsCartOpen
  } = useApp();

  const isAdmin = user?.role === 'admin' || user?.role === 'superadmin';

  // Filtered products for students based on activeCategory and gender filter
  const studentFilteredProducts = useMemo(() => {
    const rawProducts = inventory[activeCategory] || {};
    const filtered: { [name: string]: Product } = {};

    Object.entries(rawProducts).forEach(([name, prodItem]) => {
      const product = prodItem as Product;
      // Hide if marked hidden and not admin
      if (product.hidden && !isAdmin) return;

      if (studentGenderFilter === 'all') {
        filtered[name] = product;
        return;
      }

      const nameLower = name.toLowerCase();
      if (studentGenderFilter === 'male') {
        if (nameLower.includes('male') || nameLower.includes('men') || nameLower.includes('boy') || nameLower.includes('polo')) {
          filtered[name] = product;
        }
      } else if (studentGenderFilter === 'female') {
        if (nameLower.includes('female') || nameLower.includes('women') || nameLower.includes('girl') || nameLower.includes('blouse') || nameLower.includes('skirt')) {
          filtered[name] = product;
        }
      }
    });

    return filtered;
  }, [inventory, activeCategory, studentGenderFilter, isAdmin]);

  // Export inventory to XLSX
  const handleExportExcel = () => {
    const exportData: any[] = [];
    (Object.keys(inventory) as Array<keyof Inventory>).forEach(cat => {
      Object.values(inventory[cat] || {}).forEach((p: Product) => {
        Object.keys(p.sizes || {}).forEach(size => {
          exportData.push({
            category: cat.charAt(0).toUpperCase() + cat.slice(1),
            product_name: p.name,
            size: size,
            stock_quantity: p.sizes[size],
            price: p.prices[size],
            status: p.hidden ? 'hidden' : 'active',
            image: p.imageUrl || ''
          });
        });
      });
    });

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Inventory");
    XLSX.writeFile(wb, `NEUnifits_Inventory_${new Date().toISOString().split('T')[0]}.xlsx`);
    showToast("Inventory exported to Excel");
  };

  return (
    <div className="space-y-8 font-sans">
      {/* Student Welcome Banner */}
      {!isAdmin && (
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-brand-blue via-brand-blue-light to-brand-blue border border-brand-orange/30 rounded-3xl p-6 sm:p-8 text-white relative overflow-hidden shadow-xl shadow-brand-blue/15"
        >
          <div className="relative z-10 max-w-xl">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-brand-orange/15 border border-brand-orange/30 text-brand-orange rounded-full text-[9px] font-black uppercase tracking-widest mb-3">
              ✨ NEW ERA UNIVERSITY • OFFICIAL UNIFORM STORE
            </span>
            <h2 className="text-2xl sm:text-3xl font-black mb-2 text-white tracking-tight font-display">
              Welcome, <span className="text-brand-orange">{user?.displayName || 'Student'}</span>
            </h2>
            <p className="text-slate-200 text-xs sm:text-sm max-w-md font-medium leading-relaxed">
              Explore real-time stock of official campus uniforms and accessories. Choose your size, build your cart, and place orders directly.
            </p>
          </div>
          <div className="absolute top-0 right-0 w-80 h-80 bg-brand-orange/10 rounded-full -mr-20 -mt-20 blur-3xl pointer-events-none" />
          <GraduationCap className="absolute right-8 top-1/2 -translate-y-1/2 w-36 h-36 text-white/[0.04] pointer-events-none" />
        </motion.div>
      )}

      {/* Admin Top Management Bar */}
      {isAdmin && (
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4"
        >
          <div className="flex items-center gap-4">
            <div className="bg-brand-blue w-12 h-12 rounded-2xl flex items-center justify-center text-brand-orange shadow-md">
              <Boxes size={24} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900 leading-tight">Inventory & Catalog Management</h3>
              <p className="text-xs text-slate-500 font-medium">Manage sizes, stock, CSV/Excel import/export, and pricing</p>
            </div>
          </div>

          <div className="flex items-center gap-3 w-full lg:w-auto">
            {/* Inventory Controls Dropdown */}
            <div className="relative flex-1 lg:flex-none">
              <button 
                onClick={() => setIsInventoryControlsOpen(!isInventoryControlsOpen)}
                className={cn(
                  "w-full lg:w-auto px-5 py-3 rounded-2xl border transition-all font-bold text-xs flex items-center justify-center gap-2 shadow-sm cursor-pointer",
                  isInventoryControlsOpen 
                    ? "bg-brand-blue text-white border-brand-blue" 
                    : "bg-white text-slate-700 border-slate-200 hover:border-slate-400 hover:bg-slate-50"
                )}
              >
                <Settings2 size={16} />
                <span>CSV / Excel Controls</span>
                <ChevronRight size={14} className={cn("transition-transform", isInventoryControlsOpen && "rotate-90")} />
              </button>

              <AnimatePresence>
                {isInventoryControlsOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    className="absolute right-0 top-full mt-2 w-80 bg-white rounded-2xl shadow-2xl border border-slate-200 p-4 z-[100] space-y-4"
                  >
                    <div>
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">
                        1. Select Import Mode
                      </span>
                      <div className="flex bg-slate-100 rounded-xl p-1 border border-slate-200">
                        <button
                          onClick={() => setCsvMode('append')}
                          className={cn(
                            "flex-1 py-2 rounded-lg text-[10px] font-extrabold uppercase tracking-wider transition-all cursor-pointer",
                            csvMode === 'append' ? "bg-white text-brand-blue shadow-sm border border-slate-200" : "text-slate-500 hover:text-slate-800"
                          )}
                        >
                          Append Mode
                        </button>
                        <button
                          onClick={() => setCsvMode('overwrite')}
                          className={cn(
                            "flex-1 py-2 rounded-lg text-[10px] font-extrabold uppercase tracking-wider transition-all cursor-pointer",
                            csvMode === 'overwrite' ? "bg-rose-600 text-white shadow-sm" : "text-slate-500 hover:text-slate-800"
                          )}
                        >
                          Overwrite Mode
                        </button>
                      </div>
                      <p className="text-[10px] text-slate-400 mt-1">
                        {csvMode === 'append' ? 'Adds or updates products without deleting existing records.' : '⚠️ Erases existing catalog and replaces it entirely with the uploaded file.'}
                      </p>
                    </div>

                    <div>
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">
                        2. File Actions
                      </span>
                      <div className="space-y-2">
                        <label className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 cursor-pointer hover:bg-slate-100 transition-all shadow-xs">
                          <FileSpreadsheet size={16} className="text-emerald-600" />
                          <span>Upload Excel / CSV File</span>
                          <input type="file" className="hidden" accept=".xlsx, .xls, .csv" onChange={handleExcelUpload} />
                        </label>

                        <button 
                          onClick={handleExportExcel}
                          className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-50 transition-all shadow-xs cursor-pointer"
                        >
                          <Download size={16} className="text-brand-blue" />
                          <span>Download Current Catalog</span>
                        </button>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Add Product Button */}
            <button 
              onClick={() => setEditingProduct({ 
                category: 'college', 
                name: 'New Product', 
                product: { name: '', category: 'college', sizes: {}, prices: {}, imageUrl: '', hidden: false } 
              })}
              className="px-6 py-3 bg-brand-blue hover:bg-brand-blue-light text-white rounded-2xl font-bold text-xs uppercase tracking-wider transition-all shadow-md flex items-center gap-2 cursor-pointer shrink-0"
            >
              <Plus size={16} />
              <span>Add Uniform</span>
            </button>
          </div>
        </motion.div>
      )}

      {/* Student Category & Fit Navigation */}
      {!isAdmin ? (
        <div className="space-y-6">
          {/* Department Tabs */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="flex flex-wrap gap-2 sm:gap-3 w-full sm:w-auto">
              {(['college', 'highschool', 'accessories'] as const).map((cat) => (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={cn(
                    "px-5 py-3 rounded-2xl text-xs font-black uppercase tracking-wider transition-all border flex items-center gap-2.5 cursor-pointer flex-1 sm:flex-none justify-center",
                    activeCategory === cat
                      ? "bg-brand-blue text-white border-brand-blue shadow-md scale-[1.02]"
                      : "bg-white text-slate-600 border-slate-200 hover:border-brand-orange/40 hover:bg-slate-50"
                  )}
                >
                  <div className={cn(
                    "w-6 h-6 rounded-lg flex items-center justify-center shrink-0",
                    activeCategory === cat ? "bg-brand-orange text-brand-blue" : "bg-slate-100 text-slate-500"
                  )}>
                    {cat === 'college' ? <GraduationCap size={14} /> : cat === 'highschool' ? <School size={14} /> : <Watch size={14} />}
                  </div>
                  <span>{cat === 'highschool' ? 'High School' : cat === 'college' ? 'College' : 'Accessories'}</span>
                </button>
              ))}
            </div>

            {/* Cart Trigger Button for Student */}
            <button 
              onClick={() => setIsCartOpen(true)}
              className="bg-white border border-slate-200 text-brand-blue px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-wider flex items-center gap-3 hover:bg-slate-50 hover:border-brand-orange/40 transition-all shadow-sm group cursor-pointer w-full sm:w-auto justify-center"
            >
              <div className="relative">
                <ShoppingCart size={18} className="text-slate-600 group-hover:text-brand-orange transition-colors" />
                {cart.length > 0 && (
                  <span className="absolute -top-2.5 -right-2.5 w-4.5 h-4.5 bg-brand-orange text-brand-blue text-[9px] flex items-center justify-center rounded-full font-black shadow-xs ring-2 ring-white">
                    {cart.reduce((s, i) => s + i.quantity, 0)}
                  </span>
                )}
              </div>
              <span>View Cart ({cart.reduce((s, i) => s + i.quantity, 0)})</span>
            </button>
          </div>

          {/* Gender Cut / Fit Filter */}
          <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="flex items-center gap-3">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                <SlidersHorizontal size={14} /> Cut / Fit Filter:
              </span>
              <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200">
                {(['all', 'male', 'female'] as const).map((gender) => (
                  <button
                    key={gender}
                    onClick={() => setStudentGenderFilter(gender)}
                    className={cn(
                      "px-4 py-1.5 rounded-lg text-xs font-extrabold uppercase tracking-wider transition-all cursor-pointer",
                      studentGenderFilter === gender
                        ? "bg-white text-slate-900 shadow-sm border border-slate-100"
                        : "text-slate-500 hover:text-slate-900"
                    )}
                  >
                    {gender === 'all' ? 'All Fits' : gender === 'male' ? 'Male Fit' : 'Female Fit'}
                  </button>
                ))}
              </div>
            </div>

            <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
              {Object.keys(studentFilteredProducts).length} items found
            </div>
          </div>

          {/* Student Products Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {Object.entries(studentFilteredProducts).map(([name, product]) => (
              <ProductCard
                key={name}
                name={name}
                info={product}
                category={activeCategory}
                isAdmin={false}
                selectedSize={globalSelectedSize?.productName === name ? globalSelectedSize.size : null}
                onSelectSize={(size) => setGlobalSelectedSize({ productName: name, size })}
              />
            ))}
          </div>

          {Object.keys(studentFilteredProducts).length === 0 && (
            <div className="bg-white rounded-3xl p-16 text-center border border-slate-200 shadow-sm">
              <Shirt size={48} className="mx-auto mb-3 text-slate-300" />
              <h4 className="text-base font-bold text-slate-700">No uniforms matching criteria</h4>
              <p className="text-xs text-slate-400 mt-1">Try selecting another department or fit filter above.</p>
            </div>
          )}
        </div>
      ) : (
        /* Admin Inventory Table View */
        <AdminInventoryTable 
          inventory={inventory}
          onEdit={(cat, name, prod) => setEditingProduct({ category: cat, name, product: prod })}
          onDelete={handleDeleteProduct}
        />
      )}
    </div>
  );
};
