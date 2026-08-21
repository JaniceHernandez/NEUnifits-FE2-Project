import React, { useMemo } from 'react';
import { 
  Search, 
  X, 
  List, 
  LayoutGrid, 
  Calendar, 
  Clock, 
  CheckCircle2, 
  ShoppingBag, 
  Printer, 
  BellRing,
  AlertCircle,
  FileText,
  UserCheck
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Order } from '../types';
import { cn } from '../lib/utils';

export const OrdersPage: React.FC = () => {
  const {
    user,
    orders,
    orderStatusFilter,
    setOrderStatusFilter,
    orderSearchQuery,
    setOrderSearchQuery,
    orderViewMode,
    setOrderViewMode,
    handleUpdateOrderStatus,
    setSelectedInvoiceOrder,
    setAssignPickupOrder,
    setConfirmModal
  } = useApp();

  const isAdmin = user?.role === 'admin' || user?.role === 'superadmin';

  // Status counts
  const orderCounts = useMemo(() => {
    const counts = {
      all: orders.length,
      pending: 0,
      approved: 0,
      ready: 0,
      completed: 0,
      cancelled: 0
    };
    orders.forEach(o => {
      if (counts[o.status] !== undefined) {
        counts[o.status]++;
      }
    });
    return counts;
  }, [orders]);

  // Filtered orders list
  const filteredOrders = useMemo(() => {
    return orders.filter(order => {
      const matchesStatus = orderStatusFilter === 'all' || order.status === orderStatusFilter;
      
      const q = orderSearchQuery.toLowerCase().trim();
      if (!q) return matchesStatus;

      const matchesId = order.id.toLowerCase().includes(q);
      const matchesStudent = (order.studentName || '').toLowerCase().includes(q) || 
                             (order.studentEmail || '').toLowerCase().includes(q);
      const matchesItems = order.items.some(i => i.productName.toLowerCase().includes(q) || i.size.toLowerCase().includes(q));
      const matchesStatusText = order.status.toLowerCase().includes(q);

      return matchesStatus && (matchesId || matchesStudent || matchesItems || matchesStatusText);
    });
  }, [orders, orderStatusFilter, orderSearchQuery]);

  const getStatusBadge = (status: Order['status']) => {
    switch (status) {
      case 'pending':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'approved':
        return 'bg-blue-50 text-brand-blue border-blue-200';
      case 'ready':
        return 'bg-indigo-50 text-indigo-700 border-indigo-200';
      case 'completed':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'cancelled':
        return 'bg-rose-50 text-rose-700 border-rose-200';
      default:
        return 'bg-slate-50 text-slate-700 border-slate-200';
    }
  };

  return (
    <div className="space-y-6 font-sans">
      {/* Top Header Card */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm overflow-hidden flex flex-col xl:flex-row justify-between items-start xl:items-center gap-6">
        <div>
          <span className="text-[10px] font-black uppercase tracking-widest text-brand-orange">
            {isAdmin ? 'Staff Order Management' : 'Student Order History'}
          </span>
          <h2 className="text-2xl font-black text-slate-900 font-display tracking-tight mt-0.5">
            {isAdmin ? 'All Student Orders & Pickups' : 'My Uniform Requests'}
          </h2>
          <p className="text-xs text-slate-500 font-medium mt-1">
            {isAdmin 
              ? 'Approve requests, assign pickup schedules, and mark orders ready for claiming.' 
              : 'Track the status and collection schedule of your uniform requests in real time.'}
          </p>
        </div>

        <div className="flex flex-col lg:flex-row items-stretch lg:items-center gap-3 w-full xl:w-auto">
          {/* Search Box */}
          <div className="relative flex-1 lg:w-72 min-w-[200px]">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={15} />
            <input 
              type="text"
              placeholder="Search by student, ID, items..."
              value={orderSearchQuery}
              onChange={(e) => setOrderSearchQuery(e.target.value)}
              className="w-full pl-10 pr-9 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-brand-blue/10 focus:border-brand-blue"
            />
            {orderSearchQuery && (
              <button
                onClick={() => setOrderSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X size={14} />
              </button>
            )}
          </div>

          {/* Table / Card View Mode Toggle */}
          <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 shrink-0 self-stretch lg:self-auto justify-center">
            <button
              onClick={() => setOrderViewMode('table')}
              className={cn(
                "px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer flex-1 lg:flex-none justify-center",
                orderViewMode === 'table' ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-900"
              )}
              title="Table View"
            >
              <List size={14} />
              <span>Table</span>
            </button>
            <button
              onClick={() => setOrderViewMode('cards')}
              className={cn(
                "px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer flex-1 lg:flex-none justify-center",
                orderViewMode === 'cards' ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-900"
              )}
              title="Card View"
            >
              <LayoutGrid size={14} />
              <span>Cards</span>
            </button>
          </div>
        </div>
      </div>

      {/* Status Filter Tabs Bar */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
        {(['all', 'pending', 'approved', 'ready', 'completed', 'cancelled'] as const).map((status) => {
          const isActive = orderStatusFilter === status;
          const count = orderCounts[status];

          return (
            <button
              key={status}
              onClick={() => setOrderStatusFilter(status)}
              className={cn(
                "px-4 py-2.5 rounded-2xl text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-2 shrink-0 border cursor-pointer",
                isActive
                  ? "bg-brand-blue text-white border-brand-blue shadow-md scale-[1.02]"
                  : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50 hover:border-slate-300"
              )}
            >
              <span>{status}</span>
              <span className={cn(
                "text-[10px] font-black px-2 py-0.5 rounded-full",
                isActive ? "bg-brand-orange text-brand-blue" : "bg-slate-100 text-slate-500"
              )}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Orders View */}
      {orderViewMode === 'table' ? (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100">
                  <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Order ID & Customer</th>
                  <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Items & Sizes</th>
                  <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Amount</th>
                  <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Status & Pickup</th>
                  <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-slate-50/50 transition-colors">
                    {/* Order ID & Student Info */}
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="text-xs font-black text-brand-blue">{order.id}</span>
                        <span className="text-xs font-bold text-slate-800 mt-0.5">{order.studentName}</span>
                        <span className="text-[10px] text-slate-400">{order.studentEmail}</span>
                        <span className="text-[9px] text-slate-400 mt-1">
                          {new Date(order.createdAt).toLocaleDateString("en-US", { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    </td>

                    {/* Items & Sizes */}
                    <td className="px-6 py-4">
                      <div className="space-y-1">
                        {order.items.map((item, idx) => (
                          <div key={idx} className="flex items-center gap-2">
                            <span className="text-xs font-bold text-slate-700">{item.productName}</span>
                            <span className="text-[9px] font-black text-brand-blue bg-blue-50 px-1.5 py-0.5 rounded uppercase">
                              {item.size}
                            </span>
                            <span className="text-[10px] text-slate-400 font-bold">×{item.quantity}</span>
                          </div>
                        ))}
                      </div>
                    </td>

                    {/* Total Amount */}
                    <td className="px-6 py-4">
                      <span className="text-sm font-black text-slate-900">₱{order.totalAmount.toLocaleString()}</span>
                    </td>

                    {/* Status & Pickup */}
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-1.5">
                        <span className={cn(
                          "text-[9px] font-black uppercase tracking-wider w-fit px-2.5 py-1 rounded-full border",
                          getStatusBadge(order.status)
                        )}>
                          {order.status}
                        </span>
                        {order.pickupDate ? (
                          <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-600">
                            <Calendar size={12} className="text-brand-blue" />
                            <span>Pickup: {new Date(order.pickupDate).toLocaleDateString()}</span>
                          </div>
                        ) : (
                          <span className="text-[10px] text-slate-400 font-medium italic">Schedule pending</span>
                        )}
                      </div>
                    </td>

                    {/* Actions */}
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {/* Print Receipt Button */}
                        <button
                          onClick={() => setSelectedInvoiceOrder(order)}
                          className="p-2 text-slate-400 hover:text-brand-blue hover:bg-blue-50 rounded-xl transition-colors cursor-pointer"
                          title="View Official Receipt"
                        >
                          <FileText size={16} />
                        </button>

                        {/* Admin Status Dropdown / Action */}
                        {isAdmin ? (
                          <div className="flex items-center gap-2">
                            {order.status === 'pending' && (
                              <button
                                onClick={() => setAssignPickupOrder(order)}
                                className="px-3 py-1.5 bg-brand-blue hover:bg-brand-blue-light text-white rounded-xl font-bold text-[10px] uppercase tracking-wider transition-all cursor-pointer shadow-xs"
                              >
                                Approve & Schedule
                              </button>
                            )}

                            <select
                              value={order.status}
                              onChange={(e) => {
                                const newStatus = e.target.value as Order['status'];
                                if (newStatus === order.status) return;

                                if (newStatus === 'approved') {
                                  setAssignPickupOrder(order);
                                } else {
                                  handleUpdateOrderStatus(order, newStatus, order.pickupDate || undefined);
                                }
                              }}
                              className="text-[10px] font-black uppercase tracking-wider px-2.5 py-1.5 bg-white border border-slate-200 rounded-xl outline-none hover:border-brand-blue cursor-pointer"
                            >
                              <option value="pending">Pending</option>
                              <option value="approved">Approved</option>
                              <option value="ready">Ready for Pickup</option>
                              <option value="completed">Completed / Claimed</option>
                              <option value="cancelled">Cancelled</option>
                            </select>
                          </div>
                        ) : (
                          /* Student Cancel Order */
                          order.status === 'pending' && (
                            <button
                              onClick={() => {
                                setConfirmModal({
                                  isOpen: true,
                                  title: "Cancel Order Request",
                                  message: `Are you sure you want to cancel uniform order #${order.id}?`,
                                  onConfirm: () => handleUpdateOrderStatus(order, 'cancelled')
                                });
                              }}
                              className="text-xs font-bold text-rose-600 hover:text-rose-700 hover:underline cursor-pointer"
                            >
                              Cancel Request
                            </button>
                          )
                        )}
                      </div>
                    </td>
                  </tr>
                ))}

                {filteredOrders.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-6 py-16 text-center">
                      <ShoppingBag size={40} className="mx-auto mb-3 text-slate-200" />
                      <p className="text-sm font-bold text-slate-500">No orders found in this view</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* Card View */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredOrders.map((order) => (
            <div 
              key={order.id}
              className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm hover:border-slate-300 transition-all flex flex-col justify-between gap-4"
            >
              <div className="space-y-3">
                <div className="flex justify-between items-start gap-2">
                  <div>
                    <span className="text-xs font-black text-brand-blue block">{order.id}</span>
                    <h4 className="text-sm font-bold text-slate-800">{order.studentName}</h4>
                    <span className="text-[10px] text-slate-400">{order.studentEmail}</span>
                  </div>
                  <span className={cn(
                    "text-[9px] font-black uppercase tracking-wider px-3 py-1 rounded-full border",
                    getStatusBadge(order.status)
                  )}>
                    {order.status}
                  </span>
                </div>

                {/* Items Box */}
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-2">
                  {order.items.map((item, idx) => (
                    <div key={idx} className="flex justify-between items-center text-xs">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="font-bold text-slate-700 truncate">{item.productName}</span>
                        <span className="text-[9px] font-black text-brand-blue bg-white border border-slate-200 px-1.5 py-0.5 rounded uppercase">
                          {item.size}
                        </span>
                      </div>
                      <span className="font-black text-slate-800 shrink-0">
                        ₱{item.price} × {item.quantity}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Financials & Pickup Schedule */}
                <div className="flex justify-between items-center pt-1 text-xs">
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold uppercase block">Pickup Date</span>
                    <span className="font-bold text-slate-800">
                      {order.pickupDate ? new Date(order.pickupDate).toLocaleDateString() : 'Pending'}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-slate-400 font-bold uppercase block">Total Due</span>
                    <span className="text-base font-black text-brand-blue">₱{order.totalAmount.toLocaleString()}</span>
                  </div>
                </div>
              </div>

              {/* Bottom Actions */}
              <div className="border-t border-slate-100 pt-4 flex items-center justify-between gap-2">
                <button
                  onClick={() => setSelectedInvoiceOrder(order)}
                  className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 rounded-xl text-xs font-bold text-slate-700 flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <FileText size={14} /> Receipt
                </button>

                {isAdmin ? (
                  <div className="flex items-center gap-2">
                    {order.status === 'pending' && (
                      <button
                        onClick={() => setAssignPickupOrder(order)}
                        className="px-3 py-2 bg-brand-blue hover:bg-brand-blue-light text-white rounded-xl font-bold text-xs transition-colors cursor-pointer"
                      >
                        Approve
                      </button>
                    )}
                    <select
                      value={order.status}
                      onChange={(e) => {
                        const newStatus = e.target.value as Order['status'];
                        if (newStatus === order.status) return;

                        if (newStatus === 'approved') {
                          setAssignPickupOrder(order);
                        } else {
                          handleUpdateOrderStatus(order, newStatus, order.pickupDate || undefined);
                        }
                      }}
                      className="text-[10px] font-black uppercase px-2 py-2 bg-white border border-slate-200 rounded-xl outline-none cursor-pointer"
                    >
                      <option value="pending">Pending</option>
                      <option value="approved">Approved</option>
                      <option value="ready">Ready</option>
                      <option value="completed">Completed</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                  </div>
                ) : (
                  order.status === 'pending' && (
                    <button
                      onClick={() => {
                        setConfirmModal({
                          isOpen: true,
                          title: "Cancel Order Request",
                          message: `Are you sure you want to cancel uniform order #${order.id}?`,
                          onConfirm: () => handleUpdateOrderStatus(order, 'cancelled')
                        });
                      }}
                      className="text-xs font-bold text-rose-600 hover:underline cursor-pointer"
                    >
                      Cancel Order
                    </button>
                  )
                )}
              </div>
            </div>
          ))}

          {filteredOrders.length === 0 && (
            <div className="col-span-full bg-white rounded-3xl p-16 text-center border border-slate-200">
              <ShoppingBag size={40} className="mx-auto mb-3 text-slate-200" />
              <p className="text-sm font-bold text-slate-500">No matching orders found</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
