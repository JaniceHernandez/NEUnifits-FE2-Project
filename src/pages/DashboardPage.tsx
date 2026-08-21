import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Boxes, 
  CheckCircle2, 
  Tag, 
  TrendingUp, 
  Package, 
  ShoppingBag, 
  AlertTriangle,
  ArrowUpRight,
  ShieldCheck
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer, 
  CartesianGrid, 
  LabelList 
} from 'recharts';
import { useApp } from '../context/AppContext';
import { StatCard } from '../components/StatCard';
import { Inventory, Product } from '../types';

export const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, inventory, orders } = useApp();

  // Access control
  if (user && user.role === 'student') {
    navigate('/inventory', { replace: true });
    return null;
  }

  // Stock computations
  const totalProducts = useMemo(() => {
    return Object.keys(inventory.college || {}).length + 
           Object.keys(inventory.highschool || {}).length + 
           Object.keys(inventory.accessories || {}).length;
  }, [inventory]);

  const totalInStockItems = useMemo(() => {
    let count = 0;
    (['college', 'highschool', 'accessories'] as Array<keyof Inventory>).forEach(cat => {
      Object.values(inventory[cat] || {}).forEach((prodItem) => {
        const product = prodItem as Product;
        Object.values(product.sizes || {}).forEach(qty => {
          if ((qty as number) > 0) count++;
        });
      });
    });
    return count;
  }, [inventory]);

  const totalVariants = useMemo(() => {
    let count = 0;
    (['college', 'highschool', 'accessories'] as Array<keyof Inventory>).forEach(cat => {
      Object.values(inventory[cat] || {}).forEach((prodItem) => {
        const product = prodItem as Product;
        count += Object.keys(product.sizes || {}).length;
      });
    });
    return count;
  }, [inventory]);

  const lowStockCount = useMemo(() => {
    let count = 0;
    (['college', 'highschool', 'accessories'] as Array<keyof Inventory>).forEach(cat => {
      Object.values(inventory[cat] || {}).forEach((prodItem) => {
        const product = prodItem as Product;
        Object.values(product.sizes || {}).forEach(qty => {
          if ((qty as number) > 0 && (qty as number) < 10) count++;
        });
      });
    });
    return count;
  }, [inventory]);

  // Chart 1 Data: Most Purchased Products
  const productPurchaseData = useMemo(() => {
    const counts: { [name: string]: number } = {};
    orders.forEach(order => {
      if (order.status !== 'cancelled') {
        order.items.forEach(item => {
          counts[item.productName] = (counts[item.productName] || 0) + item.quantity;
        });
      }
    });
    return Object.entries(counts)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 8);
  }, [orders]);

  // Chart 2 Data: Current Stock Levels by Product
  const stockLevelData = useMemo(() => {
    const list: { name: string; value: number }[] = [];
    (['college', 'highschool', 'accessories'] as Array<keyof Inventory>).forEach(cat => {
      Object.entries(inventory[cat] || {}).forEach(([name, prodItem]) => {
        const product = prodItem as Product;
        const total = Object.values(product.sizes || {}).reduce((sum, q) => sum + (Number(q) || 0), 0);
        list.push({ name, value: total });
      });
    });
    return list.sort((a, b) => b.value - a.value).slice(0, 8);
  }, [inventory]);

  return (
    <div className="space-y-8 font-sans">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm">
        <div>
          <span className="text-[10px] font-black uppercase tracking-widest text-brand-orange">
            Administrative Control Center
          </span>
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 font-display tracking-tight mt-1">
            System & Inventory Dashboard
          </h2>
          <p className="text-xs text-slate-500 font-medium mt-1">
            Real-time analytics on student demand, stock distribution, and order volume.
          </p>
        </div>

        <button
          onClick={() => navigate('/inventory')}
          className="px-5 py-3 bg-brand-blue hover:bg-brand-blue-light text-white rounded-2xl font-bold text-xs uppercase tracking-wider flex items-center gap-2 shadow-md transition-all cursor-pointer shrink-0"
        >
          <span>Manage Inventory</span>
          <ArrowUpRight size={16} />
        </button>
      </div>

      {/* Metric Stat Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <StatCard 
          icon={<Boxes className="text-brand-blue" size={28} />} 
          value={totalProducts} 
          label="Catalog Uniforms" 
          description="Active product titles"
        />
        <StatCard 
          icon={<CheckCircle2 className="text-emerald-600" size={28} />} 
          value={totalInStockItems} 
          label="In Stock Variants" 
          description="Available for ordering"
        />
        <StatCard 
          icon={<Tag className="text-purple-600" size={28} />} 
          value={totalVariants} 
          label="Size SKU Combinations" 
          description="Total active variants"
        />
        <StatCard 
          icon={<TrendingUp className="text-amber-500" size={28} />} 
          value={lowStockCount} 
          label="Low Stock Warning" 
          description="< 10 units remaining"
        />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Most Purchased Products */}
        <div className="bg-white p-6 sm:p-8 rounded-3xl shadow-sm border border-slate-200">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h3 className="text-lg font-bold text-slate-900">Most Purchased Products</h3>
              <p className="text-xs text-slate-400">Student uniform demand by total units sold</p>
            </div>
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest bg-slate-100 px-3 py-1 rounded-full">
              Top 8 Sellers
            </span>
          </div>

          <div className="h-[320px] w-full flex items-center justify-center">
            {productPurchaseData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={productPurchaseData} layout="vertical" margin={{ left: 10, right: 35, top: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                  <XAxis type="number" hide />
                  <YAxis 
                    dataKey="name" 
                    type="category" 
                    width={130} 
                    tickFormatter={(val) => val.length > 18 ? val.slice(0, 16) + '...' : val}
                    tick={{ fontSize: 11, fontWeight: 700, fill: '#475569' }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip 
                    cursor={{ fill: '#f8fafc' }}
                    contentStyle={{ borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', padding: '12px' }}
                  />
                  <Bar dataKey="value" fill="#121358" radius={[0, 6, 6, 0]} barSize={20}>
                    <LabelList dataKey="value" position="right" style={{ fontSize: '11px', fontWeight: 'bold', fill: '#121358' }} offset={10} />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-center py-12">
                <ShoppingBag size={36} className="mx-auto mb-3 text-slate-300" />
                <p className="text-xs font-bold text-slate-400">No purchase records recorded yet</p>
              </div>
            )}
          </div>
        </div>

        {/* Current Stock Levels */}
        <div className="bg-white p-6 sm:p-8 rounded-3xl shadow-sm border border-slate-200">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h3 className="text-lg font-bold text-slate-900">Current Stock Levels</h3>
              <p className="text-xs text-slate-400">Highest quantity products in inventory</p>
            </div>
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest bg-slate-100 px-3 py-1 rounded-full">
              Live Stock
            </span>
          </div>

          <div className="h-[320px] w-full flex items-center justify-center">
            {stockLevelData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stockLevelData} layout="vertical" margin={{ left: 10, right: 35, top: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                  <XAxis type="number" hide />
                  <YAxis 
                    dataKey="name" 
                    type="category" 
                    width={130} 
                    tickFormatter={(val) => val.length > 18 ? val.slice(0, 16) + '...' : val}
                    tick={{ fontSize: 11, fontWeight: 700, fill: '#475569' }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip 
                    cursor={{ fill: '#f8fafc' }}
                    contentStyle={{ borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', padding: '12px' }}
                  />
                  <Bar dataKey="value" fill="#FF9D23" radius={[0, 6, 6, 0]} barSize={20}>
                    <LabelList dataKey="value" position="right" style={{ fontSize: '11px', fontWeight: 'bold', fill: '#FF9D23' }} offset={10} />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-center py-12">
                <Package size={36} className="mx-auto mb-3 text-slate-300" />
                <p className="text-xs font-bold text-slate-400">No inventory data available</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
