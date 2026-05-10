import React, { useEffect, useState } from 'react';
import { 
  Users, 
  Search, 
  Phone, 
  History, 
  Plus, 
  MessageCircle,
  TrendingDown,
  Clock,
  MoreVertical,
  Activity,
  CreditCard,
  FileText,
  Edit2,
  Trash2,
  X,
  Save
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { firestoreService } from '../services/firestoreService';
import { Customer, Invoice } from '../types';
import { formatCurrency, cn, formatDate } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';

const Customers = () => {
  const { user } = useAuth();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [activeTab, setActiveTab] = useState<'invoices' | 'activity'>('invoices');
  const [isAddingMode, setIsAddingMode] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [formData, setFormData] = useState({ name: '', phone: '' });

  const resetForm = () => {
    setFormData({ name: '', phone: '' });
    setIsAddingMode(false);
    setEditingCustomer(null);
  };

  const handleEdit = (customer: Customer) => {
    setEditingCustomer(customer);
    setFormData({ name: customer.name, phone: customer.phone || '' });
    setIsAddingMode(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    try {
      if (editingCustomer) {
        await firestoreService.setDocument('customers', editingCustomer.id, {
          ...formData,
          updatedAt: Date.now()
        });
      } else {
        await firestoreService.addDocument('customers', {
          ...formData,
          userId: user.uid,
          totalDue: 0,
          createdAt: Date.now()
        });
      }
      resetForm();
    } catch (err) {
      console.error("Failed to save customer:", err);
    }
  };

  useEffect(() => {
    if (!user) return;
    const unsubCustomers = firestoreService.getCollectionListener<Customer>(
      'customers',
      [{ field: 'userId', operator: '==', value: user.uid }],
      setCustomers
    );
    const unsubInvoices = firestoreService.getCollectionListener<Invoice>(
      'invoices',
      [{ field: 'userId', operator: '==', value: user.uid }],
      setInvoices
    );
    return () => {
      unsubCustomers();
      unsubInvoices();
    };
  }, [user]);

  const filteredCustomers = customers.filter(c => 
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.phone?.includes(searchQuery)
  );

  const getCustomerInvoices = (customerId: string) => {
    return invoices.filter(inv => inv.customerId === customerId).sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
  };
  
  const handleWhatsApp = (customer: Customer) => {
      if (!customer.phone) {
          alert('No phone number attached to this customer.');
          return;
      }
      const message = `Hello ${customer.name}, just reaching out regarding your account.`;
      const encoded = encodeURIComponent(message);
      const url = `https://wa.me/${customer.phone.replace(/\\D/g, '')}?text=${encoded}`;
      window.open(url, '_blank');
  };

  return (
    <div className="space-y-8 pb-10">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight">Customers.</h1>
          <p className="text-slate-500 font-medium mt-1">Track and manage your business relationships.</p>
        </div>
        <button 
          onClick={() => setIsAddingMode(true)}
          className="bg-slate-900 text-white px-6 py-4 rounded-2xl font-black flex items-center justify-center gap-2 hover:bg-slate-800 transition-all shadow-xl shadow-slate-900/10"
        >
          <Plus size={20} /> Add Customer
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Customer List */}
        <div className="lg:col-span-4 xl:col-span-3 space-y-4 flex flex-col h-[calc(100vh-200px)] min-h-[500px]">
          <div className="relative shrink-0">
            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search customers..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3.5 bg-white border border-slate-200/60 rounded-2xl focus:outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 font-medium shadow-sm transition-all"
            />
          </div>

          <div className="bg-white rounded-[2rem] border border-slate-200/60 shadow-sm flex-1 overflow-hidden flex flex-col">
            <div className="px-6 py-4 border-b border-slate-100/50 bg-slate-50/50 flex justify-between items-center">
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">All Contacts</span>
              <span className="bg-slate-200 text-slate-600 px-2 py-0.5 rounded-md text-[10px] font-black">{filteredCustomers.length}</span>
            </div>
            <div className="flex-1 overflow-y-auto divide-y divide-slate-100/50">
              {filteredCustomers.map((customer) => (
                <button
                  key={customer.id}
                  onClick={() => setSelectedCustomer(customer)}
                  className={cn(
                    "w-full p-5 text-left transition-all hover:bg-slate-50 flex items-center gap-4 group",
                    selectedCustomer?.id === customer.id ? "bg-emerald-50/50 hover:bg-emerald-50/80" : ""
                  )}
                >
                  <div className={cn(
                    "w-12 h-12 rounded-[1.25rem] flex items-center justify-center text-lg font-black shrink-0 transition-colors shadow-sm",
                    selectedCustomer?.id === customer.id ? "bg-emerald-500 text-white shadow-emerald-500/30" : "bg-slate-100 text-slate-500 group-hover:bg-slate-200"
                  )}>
                    {customer.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={cn(
                        "font-bold truncate transition-colors", 
                        selectedCustomer?.id === customer.id ? "text-emerald-900" : "text-slate-800"
                    )}>{customer.name}</p>
                    <p className="text-xs font-semibold text-slate-400 truncate mt-0.5">{customer.phone || 'No Phone'}</p>
                  </div>
                  {(customer.totalDue > 0) && (
                     <div className="w-2 h-2 rounded-full bg-rose-500 shrink-0" />
                  )}
                </button>
              ))}
              {filteredCustomers.length === 0 && (
                <div className="p-12 border-4 border-transparent flex flex-col items-center text-center">
                    <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center text-slate-300 mb-3">
                        <Users size={32} />
                    </div>
                    <p className="font-bold text-slate-500">No customers found</p>
                    <p className="text-xs text-slate-400">Try a different search</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Customer Details & History */}
        <div className="lg:col-span-8 xl:col-span-9">
          <AnimatePresence mode="wait">
            {selectedCustomer ? (
              <motion.div
                key={selectedCustomer.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.2 }}
                className="space-y-6"
              >
                {/* Header Stats */}
                <div className="bg-slate-900 p-8 md:p-10 rounded-[2.5rem] shadow-2xl shadow-slate-900/20 flex flex-col md:flex-row gap-8 items-center lg:items-start relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-32 bg-emerald-500/10 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />
                  
                  <div className="flex items-center gap-6 z-10 w-full md:w-auto">
                    <div className="w-24 h-24 bg-white rounded-[2rem] flex items-center justify-center text-slate-900 text-4xl font-black shadow-xl">
                       {selectedCustomer.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h2 className="text-3xl font-black text-white tracking-tight">{selectedCustomer.name}</h2>
                      <div className="flex items-center gap-2 mt-2">
                        <span className="flex items-center gap-1.5 px-3 py-1 bg-white/10 rounded-full text-slate-300 text-sm font-medium border border-white/5">
                           <Phone size={14} /> {selectedCustomer.phone || 'No phone'}
                        </span>
                        <button 
                          onClick={() => handleEdit(selectedCustomer)}
                          className="flex items-center gap-1.5 px-3 py-1 bg-emerald-500/20 hover:bg-emerald-500/30 rounded-full text-emerald-400 text-xs font-black uppercase tracking-widest border border-emerald-500/20 transition-all"
                        >
                          <Edit2 size={12} /> Edit
                        </button>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex-1 md:border-l border-white/10 md:pl-10 space-y-2 z-10 w-full">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Outstanding</p>
                    <p className="text-4xl md:text-5xl font-black tracking-tighter text-white">
                      {selectedCustomer.totalDue > 0 ? (
                        <span className="text-rose-400">{formatCurrency(selectedCustomer.totalDue)}</span>
                      ) : (
                        <span className="text-emerald-400">{formatCurrency(0)}</span>
                      )}
                    </p>
                    {selectedCustomer.totalDue === 0 && (
                        <p className="text-xs font-bold text-emerald-500/80">All caught up!</p>
                    )}
                  </div>

                  <div className="flex gap-3 z-10 w-full md:w-auto shrink-0 justify-end md:self-start">
                    <button 
                      onClick={() => handleWhatsApp(selectedCustomer)}
                      className="p-4 bg-white/10 hover:bg-white/20 text-white rounded-2xl transition-all shadow-sm border border-white/5 hover:scale-105"
                      title="Send WhatsApp Message"
                    >
                      <MessageCircle size={22} className="fill-white/20" />
                    </button>
                    <button className="p-4 bg-white/5 hover:bg-white/10 text-slate-300 rounded-2xl transition-all border border-transparent">
                      <MoreVertical size={22} />
                    </button>
                  </div>
                </div>

                {/* Tabs */}
                <div className="flex gap-2">
                   <button 
                     onClick={() => setActiveTab('invoices')}
                     className={cn("px-6 py-3 rounded-2xl font-bold text-sm transition-all", activeTab === 'invoices' ? "bg-slate-900 text-white shadow-xl shadow-slate-900/10" : "bg-white text-slate-500 hover:bg-slate-50 border border-slate-200/60")}
                   >
                     <FileText size={16} className="inline mr-2 -mt-0.5" />
                     Invoices
                   </button>
                   <button 
                     onClick={() => setActiveTab('activity')}
                     className={cn("px-6 py-3 rounded-2xl font-bold text-sm transition-all", activeTab === 'activity' ? "bg-slate-900 text-white shadow-xl shadow-slate-900/10" : "bg-white text-slate-500 hover:bg-slate-50 border border-slate-200/60")}
                   >
                     <Activity size={16} className="inline mr-2 -mt-0.5" />
                     Activity Log
                   </button>
                </div>

                {/* Tab Content */}
                <div className="bg-white rounded-[2rem] border border-slate-200/60 shadow-sm overflow-hidden text-sm">
                  {activeTab === 'invoices' && (
                    <div className="overflow-x-auto min-h-[300px]">
                      <table className="w-full text-left">
                        <thead className="bg-slate-50/50">
                          <tr className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                            <th className="px-8 py-5">Invoice</th>
                            <th className="px-8 py-5">Date generated</th>
                            <th className="px-8 py-5 text-right">Amount</th>
                            <th className="px-8 py-5 text-center">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100/50">
                          {getCustomerInvoices(selectedCustomer.id).map((inv, idx) => (
                            <motion.tr 
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: idx * 0.05 }}
                              key={inv.id} 
                              className="hover:bg-slate-50/80 transition-colors group"
                            >
                              <td className="px-8 py-5 font-black text-slate-900 text-base">{inv.invoiceNumber}</td>
                              <td className="px-8 py-5 text-slate-500 font-semibold">{formatDate(inv.date)}</td>
                              <td className="px-8 py-5 font-black text-slate-900 text-right">{formatCurrency(inv.total)}</td>
                              <td className="px-8 py-5 text-center">
                                <span className={cn(
                                  "inline-block px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest border",
                                  inv.status === 'Paid' ? "bg-emerald-50 text-emerald-600 border-emerald-100" :
                                  inv.status === 'Partial' ? "bg-amber-50 text-amber-600 border-amber-100" :
                                  inv.status === 'Draft' ? "bg-slate-50 text-slate-500 border-slate-200" :
                                  "bg-rose-50 text-rose-600 border-rose-100"
                                )}>
                                  {inv.status}
                                </span>
                              </td>
                            </motion.tr>
                          ))}
                          {getCustomerInvoices(selectedCustomer.id).length === 0 && (
                            <tr>
                                <td colSpan={4} className="py-20 text-center text-slate-400 font-medium">
                                    No invoices generated yet.
                                </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  )}

                  {activeTab === 'activity' && (
                     <div className="p-8 min-h-[300px]">
                        <div className="relative border-l-2 border-slate-100 ml-4 space-y-8 pb-4">
                           {getCustomerInvoices(selectedCustomer.id).map((inv, idx) => (
                              <div key={inv.id} className="relative pl-8">
                                 <div className="absolute -left-[11px] top-1">
                                    <div className="w-5 h-5 bg-emerald-500 rounded-full border-4 border-white shadow-sm" />
                                 </div>
                                 <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100">
                                     <div className="flex justify-between items-start mb-2">
                                         <div>
                                            <span className="font-bold text-slate-800">Invoice Created</span>
                                            <p className="text-xs font-semibold text-slate-500 mt-0.5">{inv.invoiceNumber} • {formatCurrency(inv.total)}</p>
                                         </div>
                                         <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{formatDate(inv.date)}</span>
                                     </div>
                                 </div>
                              </div>
                           ))}
                           {getCustomerInvoices(selectedCustomer.id).length === 0 && (
                              <div className="pl-8 text-slate-400 italic">No activity recorded.</div>
                           )}
                        </div>
                     </div>
                  )}
                </div>
              </motion.div>
            ) : (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="h-[calc(100vh-200px)] min-h-[500px] bg-slate-50/50 border-2 border-dashed border-slate-200/80 rounded-[3rem] flex flex-col items-center justify-center text-slate-400 p-8 text-center"
              >
                <div className="w-24 h-24 bg-white shadow-xl shadow-slate-200/50 rounded-full flex items-center justify-center mb-6">
                   <Users size={40} className="text-emerald-500 opacity-80" />
                </div>
                <h3 className="text-2xl font-black text-slate-800 tracking-tight mb-2">Select a Customer</h3>
                <p className="max-w-xs font-medium text-slate-500">Pick a customer from the left to view their detailed transaction history and due balances.</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Modal for Add/Edit */}
      <AnimatePresence>
        {isAddingMode && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={resetForm}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl p-8 md:p-10"
            >
              <div className="flex justify-between items-center mb-8">
                <div>
                  <h2 className="text-2xl font-black text-slate-900 tracking-tight">{editingCustomer ? 'Edit Customer' : 'Add New Customer'}</h2>
                  <p className="text-slate-400 text-sm font-medium mt-1">Enter customer information</p>
                </div>
                <button 
                  onClick={resetForm}
                  className="p-3 bg-slate-50 text-slate-400 hover:text-slate-600 rounded-2xl transition-all"
                >
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1 mb-2">Customer Name</p>
                  <input 
                    type="text" 
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    placeholder="Full Name"
                    className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:bg-white focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 font-bold transition-all shadow-inner"
                  />
                </div>
                
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1 mb-2">Phone Number</p>
                  <input 
                    type="text" 
                    value={formData.phone}
                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                    placeholder="e.g. +91 9876543210"
                    className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:bg-white focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 font-bold transition-all shadow-inner"
                  />
                </div>

                <div className="pt-4">
                  <button 
                    type="submit"
                    className="w-full py-5 bg-emerald-500 hover:bg-emerald-400 text-slate-900 rounded-2xl font-black transition-all flex items-center justify-center gap-2 shadow-xl shadow-emerald-500/20 hover:shadow-emerald-500/40 hover:-translate-y-0.5 active:translate-y-0"
                  >
                    <Save size={20} />
                    {editingCustomer ? 'Update Profile' : 'Save Customer'}
                  </button>
                  <button 
                    type="button"
                    onClick={resetForm}
                    className="w-full py-4 mt-3 bg-white text-slate-400 rounded-2xl font-bold text-sm hover:text-slate-600 transition-all font-medium"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Customers;
