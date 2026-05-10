import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Search, 
  Filter, 
  MoreVertical, 
  MessageCircle, 
  Printer, 
  FileDown,
  ChevronRight,
  AlertCircle,
  X,
  FileText,
  Copy,
  Edit
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useSubscription } from '../context/SubscriptionContext';
import { firestoreService } from '../services/firestoreService';
import { Invoice, Customer, InvoiceItem } from '../types';
import { formatCurrency, cn, generateInvoiceNumber } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import InvoiceForm from '../components/InvoiceForm';
import InvoiceView from '../components/InvoiceView';

const Invoices = () => {
  const { user } = useAuth();
  const { canCreateInvoice, isPremium, invoiceCount } = useSubscription();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [selectedInvoiceItems, setSelectedInvoiceItems] = useState<InvoiceItem[]>([]);
  const [isViewing, setIsViewing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterMode, setFilterMode] = useState<'All' | 'Draft' | 'Due' | 'Paid'>('All');
  const [duplicateData, setDuplicateData] = useState<{ invoice: Invoice, items: InvoiceItem[] } | null>(null);
  const [editData, setEditData] = useState<{ invoice: Invoice, items: InvoiceItem[] } | null>(null);
  
  const { settings } = useSubscription();

  useEffect(() => {
    if (!user) return;
    return firestoreService.getCollectionListener<Invoice>(
      'invoices',
      [{ field: 'userId', operator: '==', value: user.uid }],
      (data) => setInvoices(data.sort((a,b) => (b.createdAt || 0) - (a.createdAt || 0)))
    );
  }, [user]);

  const handleViewInvoice = async (invoice: Invoice) => {
    setSelectedInvoice(invoice);
    const unsub = firestoreService.getCollectionListener<InvoiceItem>(
      `invoices/${invoice.id}/items`,
      [],
      (items) => {
        setSelectedInvoiceItems(items);
        setIsViewing(true);
      }
    );
  };

  const handleDuplicate = async (e: React.MouseEvent, invoice: Invoice) => {
    e.stopPropagation();
    // Fetch items
    const items = await firestoreService.listDocuments<InvoiceItem>(`invoices/${invoice.id}/items`);
    setDuplicateData({ invoice, items });
    setEditData(null);
    setShowForm(true);
  };

  const handleEdit = async (e: React.MouseEvent, invoice: Invoice) => {
    e.stopPropagation();
    const items = await firestoreService.listDocuments<InvoiceItem>(`invoices/${invoice.id}/items`);
    setEditData({ invoice, items });
    setDuplicateData(null);
    setShowForm(true);
  };

  const filteredInvoices = invoices.filter(inv => {
    const matchesSearch = inv.invoiceNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          inv.customerName.toLowerCase().includes(searchQuery.toLowerCase());
    if (!matchesSearch) return false;
    
    if (filterMode === 'All') return true;
    if (filterMode === 'Draft' && inv.status === 'Draft') return true;
    if (filterMode === 'Paid' && inv.status === 'Paid') return true;
    if (filterMode === 'Due' && (inv.status === 'Due' || inv.status === 'Partial')) return true;
    
    return false;
  });

  const sendWhatsAppReminder = (e: React.MouseEvent, invoice: Invoice) => {
    e.stopPropagation();
    const message = `Hello ${invoice.customerName}, this is a reminder regarding your outstanding balance of ${formatCurrency(invoice.dueAmount)} for Invoice ${invoice.invoiceNumber}.

Generated via BillMint.

Please complete the payment. Thank you!`;
    const encodedMessage = encodeURIComponent(message);
    let whatsappUrl = `https://wa.me/?text=${encodedMessage}`;
    if (invoice.customerPhone) {
        whatsappUrl = `https://wa.me/${invoice.customerPhone.replace(/\\D/g,'')}?text=${encodedMessage}`;
    }
    window.open(whatsappUrl, '_blank');
  };

  return (
    <div className="space-y-8 pb-10">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight">Invoices.</h1>
          <p className="text-slate-500 font-medium mt-1">Manage your billing and track payments.</p>
        </div>
        <button 
          onClick={() => { setDuplicateData(null); setShowForm(true); }}
          disabled={!canCreateInvoice && !isPremium}
          className={cn(
            "flex items-center justify-center gap-2 px-6 py-3.5 bg-slate-900 text-white rounded-2xl font-bold hover:shadow-xl hover:shadow-slate-900/20 hover:-translate-y-0.5 transition-all",
            !canCreateInvoice && !isPremium && "bg-slate-300 cursor-not-allowed hover:shadow-none translate-y-0"
          )}
        >
          <Plus size={20} /> Create Invoice
        </button>
      </div>

      {!canCreateInvoice && !isPremium && (
        <div className="p-4 bg-amber-50 border border-amber-100 rounded-2xl flex items-center gap-3 text-amber-800">
          <AlertCircle size={20} />
          <p className="text-sm font-medium">You've reached your free limit of 5 invoices. <button className="font-bold underline">Upgrade to Premium</button> for unlimited access.</p>
        </div>
      )}

      {/* Filters & Search */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
          <input 
            type="text" 
            placeholder="Search by invoice # or customer..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-3.5 bg-white border border-slate-200/60 rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all font-medium text-slate-800 shadow-sm"
          />
        </div>
        <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0 scrollbar-hide shrink-0">
          {['All', 'Due', 'Paid', 'Draft'].map(mode => (
             <button 
               key={mode}
               onClick={() => setFilterMode(mode as any)}
               className={cn(
                 "px-5 py-3.5 rounded-2xl font-bold text-sm transition-all whitespace-nowrap",
                 filterMode === mode ? "bg-emerald-500 text-white shadow-md shadow-emerald-500/20" : "bg-white text-slate-600 border border-slate-200/60 hover:bg-slate-50"
               )}
             >
               {mode}
             </button>
          ))}
        </div>
      </div>

      {/* Invoice List */}
      <div className="bg-white rounded-[2rem] border border-slate-100/50 shadow-sm shadow-slate-200/50 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="text-[10px] font-black text-slate-400 uppercase tracking-widest bg-slate-50/50">
                <th className="px-8 py-5">Status</th>
                <th className="px-8 py-5">Invoice</th>
                <th className="px-8 py-5">Customer</th>
                <th className="px-8 py-5">Amount</th>
                <th className="px-8 py-5">Due</th>
                <th className="px-8 py-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50/80 text-sm">
              <AnimatePresence>
                {filteredInvoices.map((inv) => (
                  <motion.tr 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    key={inv.id} 
                    onClick={() => handleViewInvoice(inv)}
                    className="hover:bg-slate-50/80 transition-colors group cursor-pointer"
                  >
                    <td className="px-8 py-4">
                      <span className={cn(
                        "inline-flex items-center px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest",
                        inv.status === 'Paid' ? "bg-emerald-50 text-emerald-600 ring-1 ring-inset ring-emerald-500/20" :
                        inv.status === 'Partial' ? "bg-amber-50 text-amber-600 ring-1 ring-inset ring-amber-500/20" :
                        inv.status === 'Draft' ? "bg-slate-100 text-slate-500 ring-1 ring-inset ring-slate-500/20" :
                        "bg-rose-50 text-rose-600 ring-1 ring-inset ring-rose-500/20"
                      )}>
                        {inv.status}
                      </span>
                    </td>
                    <td className="px-8 py-4 font-black text-slate-900">{inv.invoiceNumber}</td>
                    <td className="px-8 py-4 font-semibold text-slate-700">{inv.customerName}</td>
                    <td className="px-8 py-4 font-black text-slate-900">{formatCurrency(inv.total)}</td>
                    <td className="px-8 py-4">
                      <span className={inv.dueAmount > 0 ? "text-rose-500 font-bold" : "text-slate-400 font-medium"}>
                        {inv.dueAmount > 0 ? formatCurrency(inv.dueAmount) : 'Settled'}
                      </span>
                    </td>
                    <td className="px-8 py-4 text-right">
                      <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        {inv.dueAmount > 0 && inv.status !== 'Draft' && (
                          <button 
                            onClick={(e) => sendWhatsAppReminder(e, inv)}
                            className="p-2.5 text-emerald-600 hover:bg-emerald-50 rounded-xl transition-colors"
                            title="Send WhatsApp Reminder"
                          >
                            <MessageCircle size={18} />
                          </button>
                        )}
                        <button 
                          onClick={(e) => handleEdit(e, inv)}
                          className="p-2.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 rounded-xl transition-colors"
                          title="Edit Invoice"
                        >
                          <Edit size={18} />
                        </button>
                        <button 
                          onClick={(e) => handleDuplicate(e, inv)}
                          className="p-2.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 rounded-xl transition-colors"
                          title="Duplicate Invoice"
                        >
                          <Copy size={18} />
                        </button>
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </AnimatePresence>
              {filteredInvoices.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-8 py-24 text-center">
                    <div className="flex flex-col items-center gap-3">
                       <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center text-slate-300">
                         <FileText size={40} />
                       </div>
                       <p className="text-slate-500 font-bold text-lg mt-2">No invoices found</p>
                       <p className="text-slate-400 font-medium">Try adjusting your search or filters.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Invoice Detail View */}
      <AnimatePresence>
        {isViewing && selectedInvoice && (
          <InvoiceView 
            invoice={selectedInvoice} 
            items={selectedInvoiceItems}
            settings={settings ? { ...settings, isPremium } : null}
            onClose={() => {
              setIsViewing(false);
              setTimeout(() => {
                setSelectedInvoice(null);
                setSelectedInvoiceItems([]);
              }, 300);
            }}
          />
        )}
      </AnimatePresence>

      {/* Form Modal */}
      <AnimatePresence>
        {showForm && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 sm:p-6 lg:p-8">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => { setShowForm(false); setDuplicateData(null); setEditData(null); }}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: "spring", bounce: 0, duration: 0.4 }}
              className="relative w-full max-w-5xl bg-slate-50 rounded-[2rem] shadow-2xl overflow-hidden h-[95vh] flex flex-col"
            >
              <div className="p-6 border-b border-slate-200/60 flex justify-between items-center bg-white sticky top-0 z-10">
                <h2 className="text-2xl font-black text-slate-900 tracking-tight">
                  {editData ? 'Edit Invoice' : duplicateData ? 'Duplicate Invoice' : 'Create New Invoice'}
                </h2>
                <button onClick={() => { setShowForm(false); setDuplicateData(null); setEditData(null); }} className="p-2.5 bg-slate-50 text-slate-500 hover:bg-slate-100 hover:text-slate-900 rounded-full transition-colors">
                  <X size={20} />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto scroll-smooth">
                <InvoiceForm 
                  onSuccess={() => { setShowForm(false); setDuplicateData(null); setEditData(null); }} 
                  initialData={editData || duplicateData}
                  mode={editData ? 'edit' : duplicateData ? 'duplicate' : 'create'}
                />
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Invoices;
