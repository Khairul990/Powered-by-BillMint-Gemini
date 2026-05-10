import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Trash2, 
  UserPlus, 
  ChevronDown, 
  Search,
  Check,
  Save,
  CheckCircle2,
  Copy,
  Settings
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useSubscription } from '../context/SubscriptionContext';
import { firestoreService } from '../services/firestoreService';
import { Customer, InvoiceItem, Invoice, OperationType, InvoiceTemplateType, Product, InvoiceColumn, DEFAULT_INVOICE_COLUMNS } from '../types';
import { formatCurrency, generateInvoiceNumber, cn } from '../lib/utils';
import { ColumnBuilderModal } from './ColumnBuilderModal';
import { 
  collection, 
  doc, 
  runTransaction, 
  serverTimestamp, 
  addDoc 
} from 'firebase/firestore';
import { db } from '../lib/firebase';

interface InvoiceFormProps {
  onSuccess: () => void;
  initialData?: { invoice: Invoice, items: InvoiceItem[] } | null;
  mode?: 'create' | 'duplicate' | 'edit';
}

const InvoiceForm = ({ onSuccess, initialData, mode = 'create' }: InvoiceFormProps) => {
  const { user, profile } = useAuth();
  const { invoiceCount } = useSubscription();
  
  const [customerSearch, setCustomerSearch] = useState('');
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [isNewCustomer, setIsNewCustomer] = useState(false);
  const [newCustomerName, setNewCustomerName] = useState('');
  const [newCustomerPhone, setNewCustomerPhone] = useState('');

  const [items, setItems] = useState<InvoiceItem[]>([
    { id: Math.random().toString(36).substr(2, 9), name: '', designNo: '', workType: '', size: '', quantity: 1, price: 0, total: 0 }
  ]);
  const [products, setProducts] = useState<Product[]>([]);
  const [activeItemSearch, setActiveItemSearch] = useState<string | null>(null);
  const [productSearch, setProductSearch] = useState('');
  const [discount, setDiscount] = useState(0);
  const [paidAmount, setPaidAmount] = useState(0);
  const [dueDate, setDueDate] = useState<number>(Date.now() + 7 * 24 * 60 * 60 * 1000); // Default 7 days
  const [notes, setNotes] = useState('');
  const [templateType, setTemplateType] = useState<InvoiceTemplateType>('Small Bill');
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitMode, setSubmitMode] = useState<'Finalize' | 'Draft'>('Finalize');
  
  const { settings, isPremium } = useSubscription();
  const [showColumnBuilder, setShowColumnBuilder] = useState(false);
  const invoiceColumns = settings?.invoiceColumns || DEFAULT_INVOICE_COLUMNS;
  const visibleColumns = [...invoiceColumns].filter(c => c.visible).sort((a,b) => a.order - b.order);

  const handleSaveColumns = async (newColumns: InvoiceColumn[]) => {
    if (!user) return;
    try {
      await firestoreService.setDocument('settings', user.uid, {
        invoiceColumns: newColumns,
        updatedAt: Date.now()
      });
      setShowColumnBuilder(false);
    } catch(err) {
      console.error(err);
      alert("Failed to save layout.");
    }
  };

  useEffect(() => {
    if (!user) return;
    return firestoreService.getCollectionListener<Customer>(
      'customers',
      [{ field: 'userId', operator: '==', value: user.uid }],
      setCustomers
    );
  }, [user]);

  useEffect(() => {
    if (!user) return;
    return firestoreService.getCollectionListener<Product>(
      'products',
      [{ field: 'userId', operator: '==', value: user.uid }],
      setProducts
    );
  }, [user]);

  // Pre-fill if duplicating
  useEffect(() => {
    if (initialData && customers.length > 0) {
       const inv = initialData.invoice;
       const existingCust = customers.find(c => c.id === inv.customerId);
       if (existingCust) {
           setSelectedCustomer(existingCust);
       } else {
           setIsNewCustomer(true);
           setNewCustomerName(inv.customerName);
           setNewCustomerPhone(inv.customerPhone || '');
       }
       
       if (initialData.items && initialData.items.length > 0) {
           // For edit mode, keep IDs so we can update them in-place.
           setItems(mode === 'edit' ? initialData.items : initialData.items.map(it => ({ ...it, id: Math.random().toString(36).substr(2, 9) }))); // regenerate IDs just in case
       }
       setDiscount(inv.discount);
       setNotes(inv.notes || '');
       setTemplateType(inv.templateType || 'Small Bill');
       if (inv.dueDate) setDueDate(inv.dueDate);
       if (mode === 'edit') {
           setPaidAmount(inv.paidAmount);
           setSubmitMode(inv.status === 'Draft' ? 'Draft' : 'Finalize');
       }
    }
  }, [initialData, customers, mode]);

  const filteredCustomers = customers.filter(c => 
    c.name.toLowerCase().includes(customerSearch.toLowerCase())
  );

  const addItem = () => {
    let nextDesignNo = '';
    
    if (items.length > 0) {
      const lastItem = items[items.length - 1];
      const lastDesignNo = String(lastItem.designNo || '');
      
      if (lastDesignNo) {
         const match = lastDesignNo.match(/^(.*?)(\d+)$/);
         if (match) {
           const prefix = match[1];
           const num = parseInt(match[2], 10);
           nextDesignNo = `${prefix}${num + 1}`;
         } else if (!isNaN(Number(lastDesignNo))) {
           nextDesignNo = String(Number(lastDesignNo) + 1);
         } else {
           nextDesignNo = lastDesignNo; 
         }
      }
    }

    setItems([...items, { 
      id: Math.random().toString(36).substr(2, 9), 
      serialNumber: items.length + 1,
      name: '', 
      designNo: nextDesignNo, 
      workType: '', 
      size: '', 
      quantity: 1, 
      price: 0, 
      total: 0,
      workCharges: []
    }]);
  };

  const duplicateItem = (item: InvoiceItem) => {
    let nextDesignNo = item.designNo || '';
    if (nextDesignNo) {
      const match = nextDesignNo.match(/^(.*?)(\d+)$/);
      if (match) {
        nextDesignNo = `${match[1]}${parseInt(match[2], 10) + 1}`;
      } else if (!isNaN(Number(nextDesignNo))) {
        nextDesignNo = String(Number(nextDesignNo) + 1);
      }
    }
    setItems([...items, { ...item, id: Math.random().toString(36).substr(2, 9), serialNumber: items.length + 1, designNo: nextDesignNo }]);
  };

  const removeItem = (id: string) => {
    if (items.length > 1) {
      setItems(items.filter(item => item.id !== id));
    }
  };

  const updateItem = (id: string, field: keyof InvoiceItem, value: any) => {
    if (field === 'name') {
      setActiveItemSearch(id);
      setProductSearch(value);
    }
    setItems(items.map(item => {
      if (item.id === id) {
        const updated = { ...item, [field]: value };
        if (field === 'quantity' || field === 'price' || field === 'workCharges') {
          // If workCharges exist and aren't empty, price is the sum of workCharges rates
          if (updated.workCharges && updated.workCharges.length > 0) {
            updated.price = updated.workCharges.reduce((acc, wc) => acc + (wc.rate || 0), 0);
          }
          updated.total = updated.quantity * updated.price;
        }
        return updated;
      }
      return item;
    }));
  };

  const addWorkCharge = (itemId: string) => {
    setItems(items.map(item => {
      if (item.id === itemId) {
        const currentCharges = item.workCharges || [];
        const newCharges = [...currentCharges, { id: Math.random().toString(36).substr(2, 9), name: '', rate: 0 }];
        const newPrice = newCharges.reduce((acc, wc) => acc + (wc.rate || 0), 0);
        return { ...item, workCharges: newCharges, price: newPrice, total: newPrice * item.quantity };
      }
      return item;
    }));
  };

  const updateWorkCharge = (itemId: string, chargeId: string, field: 'name' | 'rate', value: any) => {
    setItems(items.map(item => {
      if (item.id === itemId && item.workCharges) {
        const newCharges = item.workCharges.map(wc => wc.id === chargeId ? { ...wc, [field]: value } : wc);
        const newPrice = newCharges.reduce((acc, wc) => acc + (wc.rate || 0), 0);
        return { ...item, workCharges: newCharges, price: newPrice, total: newPrice * item.quantity };
      }
      return item;
    }));
  };

  const removeWorkCharge = (itemId: string, chargeId: string) => {
    setItems(items.map(item => {
      if (item.id === itemId && item.workCharges) {
        const newCharges = item.workCharges.filter(wc => wc.id !== chargeId);
        const newPrice = newCharges.reduce((acc, wc) => acc + (wc.rate || 0), 0);
        return { ...item, workCharges: newCharges, price: newPrice, total: newPrice * item.quantity };
      }
      return item;
    }));
  };

  const selectProduct = (itemId: string, product: Product) => {
    setItems(items.map(item => {
      if (item.id === itemId) {
        return {
          ...item,
          name: product.name,
          price: product.price,
          total: item.quantity * product.price
        };
      }
      return item;
    }));
    setActiveItemSearch(null);
  };

  const saveProduct = async (name: string, price: number) => {
    if (!user || !name || price <= 0) return;
    try {
      await firestoreService.addDocument('products', {
        userId: user.uid,
        name,
        price,
        createdAt: Date.now()
      });
    } catch (err) {
      console.error("Failed to save product:", err);
    }
  };

  const subtotal = items.reduce((acc, item) => acc + item.total, 0);
  const grandTotal = Math.max(0, subtotal - discount);
  let dueAmount = Math.max(0, grandTotal - paidAmount);
  
  let status: 'Paid' | 'Partial' | 'Due' | 'Draft' = 'Due';
  if (submitMode === 'Draft') {
     status = 'Draft';
     dueAmount = grandTotal; // Draft means nothing paid usually, but let's keep logic simple
  } else {
     if (paidAmount >= grandTotal) status = 'Paid';
     else if (paidAmount > 0) status = 'Partial';
  }

  const handleSubmit = async (e: React.FormEvent, submitFinalMode: 'Finalize' | 'Draft') => {
    e.preventDefault();
    if (!user || isSubmitting) return;
    
    if (!selectedCustomer && !newCustomerName) {
      alert("Please select or add a customer");
      return;
    }
    
    setSubmitMode(submitFinalMode);
    setIsSubmitting(true);
    
    const isEdit = mode === 'edit';
    
    try {
      await runTransaction(db, async (transaction) => {
        let finalCustomerId = selectedCustomer?.id;
        let finalCustomerName = selectedCustomer?.name;
        let finalCustomerPhone = selectedCustomer?.phone || '';

        // Calculate adjustment for customer totalDue if editing finalized invoice
        let customerDueAdjustment = submitFinalMode === 'Draft' ? 0 : dueAmount;
        if (isEdit && initialData && initialData.invoice.status !== 'Draft') {
           customerDueAdjustment = dueAmount - initialData.invoice.dueAmount;
        } else if (isEdit && initialData && initialData.invoice.status === 'Draft' && submitFinalMode !== 'Draft') {
           // drafts didn't contribute to totalDue, so just add dueAmount
           customerDueAdjustment = dueAmount;
        }

        // 1. Handle New Customer
        if (isNewCustomer || !selectedCustomer) {
          const customerRef = doc(collection(db, 'customers'));
          transaction.set(customerRef, {
            id: customerRef.id,
            userId: user.uid,
            name: newCustomerName,
            phone: newCustomerPhone,
            totalDue: submitFinalMode === 'Draft' ? 0 : dueAmount,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          });
          finalCustomerId = customerRef.id;
          finalCustomerName = newCustomerName;
          finalCustomerPhone = newCustomerPhone;
        } else if (customerDueAdjustment !== 0) {
          // Update existing customer due
          const customerRef = doc(db, 'customers', selectedCustomer.id);
          transaction.update(customerRef, {
            totalDue: (selectedCustomer.totalDue || 0) + customerDueAdjustment,
            updatedAt: serverTimestamp()
          });
        }

        // 2. Create/Update Invoice
        const invoiceRef = isEdit && initialData ? doc(db, 'invoices', initialData.invoice.id) : doc(collection(db, 'invoices'));
        const invoiceNumber = isEdit && initialData ? initialData.invoice.invoiceNumber : generateInvoiceNumber(invoiceCount);
        const invoiceStatus = submitFinalMode === 'Draft' ? 'Draft' : status;
        
        const invoiceData: any = {
          id: invoiceRef.id,
          userId: user.uid,
          customerId: finalCustomerId,
          customerName: finalCustomerName,
          customerPhone: finalCustomerPhone,
          invoiceNumber,
          date: isEdit && initialData ? initialData.invoice.date : Date.now(),
          dueDate: dueDate,
          templateType: templateType,
          notes: notes,
          subtotal,
          discount,
          total: grandTotal,
          paidAmount: submitFinalMode === 'Draft' ? 0 : paidAmount,
          dueAmount: submitFinalMode === 'Draft' ? grandTotal : dueAmount,
          status: invoiceStatus,
          payments: isEdit && initialData ? initialData.invoice.payments : [],
          updatedAt: serverTimestamp(),
        };

        if (!isEdit) {
           invoiceData.createdAt = serverTimestamp();
        }

        transaction.set(invoiceRef, invoiceData, { merge: true });

        // 3. Add Invoice Items
        if (isEdit && initialData?.items) {
           const currentItemIds = items.map(i => i.id);
           initialData.items.forEach(oldItem => {
              if (!currentItemIds.includes(oldItem.id)) {
                 transaction.delete(doc(db, `invoices/${invoiceRef.id}/items`, oldItem.id));
              }
           });
        }

        items.forEach((item) => {
          const itemRef = doc(db, `invoices/${invoiceRef.id}/items`, item.id);
          transaction.set(itemRef, {
            ...item,
            createdAt: item.createdAt || serverTimestamp(),
            updatedAt: serverTimestamp()
          }, { merge: true });
        });

        // 4. Update User Invoice Count (only for CREATE / DUPLICATE)
        if (!isEdit) {
          const userRef = doc(db, 'users', user.uid);
          transaction.update(userRef, {
            invoiceCount: (profile?.invoiceCount || 0) + 1
          });
        }
      });

      onSuccess();
    } catch (error) {
      console.error("Failed to save invoice:", error);
      alert("Error saving invoice. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form className="space-y-10">
      {/* Customer Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="space-y-4">
          <label className="flex items-center gap-2 text-sm font-black text-slate-800 uppercase tracking-widest bg-slate-100/50 p-2 rounded-xl">
            <span className="flex items-center justify-center w-6 h-6 rounded-md bg-white text-slate-500 shadow-sm">1</span> 
            Customer Details
          </label>
          <div className="space-y-4 px-2">
            <div className="flex bg-slate-100/80 p-1 rounded-xl shadow-inner line-clamp-none ring-1 ring-slate-200/50">
              <button 
                type="button"
                onClick={() => setIsNewCustomer(false)}
                className={cn("flex-1 py-2.5 text-sm font-bold rounded-lg transition-all", !isNewCustomer ? "bg-white shadow-sm ring-1 ring-slate-200 text-slate-800" : "text-slate-500 hover:text-slate-700")}
              >Search Existing</button>
              <button 
                type="button"
                onClick={() => setIsNewCustomer(true)}
                className={cn("flex-1 py-2.5 text-sm font-bold rounded-lg transition-all", isNewCustomer ? "bg-white shadow-sm ring-1 ring-slate-200 text-slate-800" : "text-slate-500 hover:text-slate-700")}
              >Add New</button>
            </div>

            {!isNewCustomer ? (
              <div className="relative group">
                <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-emerald-500 transition-colors" />
                <input 
                  type="text" 
                  placeholder="Find customer by name..."
                  value={customerSearch}
                  onChange={(e) => setCustomerSearch(e.target.value)}
                  className="w-full pl-12 pr-4 py-3.5 bg-white border border-slate-200/80 rounded-2xl focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none font-medium transition-all shadow-sm"
                />
                {customerSearch && filteredCustomers.length > 0 && !selectedCustomer && (
                  <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-slate-100 shadow-2xl shadow-slate-200/50 rounded-2xl z-20 max-h-56 overflow-y-auto overflow-x-hidden p-2">
                    {filteredCustomers.map(c => (
                      <button 
                        key={c.id} 
                        type="button"
                        onClick={() => {
                          setSelectedCustomer(c);
                          setCustomerSearch(''); // clear search on select
                        }}
                        className="w-full text-left px-4 py-3 hover:bg-emerald-50/80 rounded-xl flex justify-between items-center transition-colors mb-1 last:mb-0"
                      >
                        <div>
                          <p className="font-bold text-slate-800">{c.name}</p>
                          <p className="text-xs font-semibold text-slate-400 mt-0.5">{c.phone || 'No phone'}</p>
                        </div>
                        <Check size={18} className="text-emerald-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </button>
                    ))}
                  </div>
                )}
                {selectedCustomer && (
                  <div className="mt-3 p-4 bg-emerald-50/80 border border-emerald-500/20 rounded-2xl flex justify-between items-center shadow-sm">
                    <div>
                      <p className="text-sm font-black text-emerald-900">{selectedCustomer.name}</p>
                      <p className="text-xs font-bold text-emerald-600/80 mt-1">{selectedCustomer.phone}</p>
                    </div>
                    <button type="button" onClick={() => setSelectedCustomer(null)} className="px-3 py-1.5 text-xs font-bold bg-white text-emerald-600 rounded-lg shadow-sm border border-emerald-100 hover:bg-emerald-50 transition-colors">Change</button>
                  </div>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                <input 
                  type="text" 
                  placeholder="Customer Name" 
                  value={newCustomerName}
                  onChange={(e) => setNewCustomerName(e.target.value)}
                  className="w-full px-4 py-3.5 bg-white border border-slate-200/80 rounded-2xl outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 font-medium shadow-sm transition-all"
                />
                <input 
                  type="text" 
                  placeholder="Phone Number (Optional)" 
                  value={newCustomerPhone}
                  onChange={(e) => setNewCustomerPhone(e.target.value)}
                  className="w-full px-4 py-3.5 bg-white border border-slate-200/80 rounded-2xl outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 font-medium shadow-sm transition-all"
                />
              </div>
            )}
          </div>
        </div>

        <div className="space-y-4">
          <label className="flex items-center gap-2 text-sm font-black text-slate-800 uppercase tracking-widest bg-slate-100/50 p-2 rounded-xl">
            <span className="flex items-center justify-center w-6 h-6 rounded-md bg-white text-slate-500 shadow-sm">2</span> 
            Invoice Info
          </label>
          <div className="grid grid-cols-2 gap-4 px-2">
            <div>
              <p className="text-[10px] text-slate-400 mb-1.5 font-black uppercase tracking-widest pl-1">Invoice No</p>
              <div className="px-4 py-3.5 bg-slate-50 border border-slate-200/50 rounded-2xl font-black text-slate-800 shadow-sm inset-shadow-sm">
                {mode === 'edit' && initialData ? initialData.invoice.invoiceNumber : generateInvoiceNumber(invoiceCount)}
              </div>
            </div>
            <div>
              <p className="text-[10px] text-slate-400 mb-1.5 font-black uppercase tracking-widest pl-1">Creation Date</p>
              <div className="px-4 py-3.5 bg-slate-50 border border-slate-200/50 rounded-2xl font-black text-slate-800 shadow-sm inset-shadow-sm">
                {new Date(mode === 'edit' && initialData ? initialData.invoice.date : Date.now()).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
              </div>
            </div>
            <div className="col-span-2">
              <p className="text-[10px] text-slate-400 mb-1.5 font-black uppercase tracking-widest pl-1">Invoice Template</p>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setTemplateType('Small Bill')}
                  className={cn(
                    "flex flex-col items-center gap-2 p-3 rounded-2xl border-2 transition-all",
                    templateType === 'Small Bill' 
                      ? "bg-emerald-50 border-emerald-500 shadow-lg shadow-emerald-500/10" 
                      : "bg-white border-slate-100 hover:border-slate-200"
                  )}
                >
                  <div className="w-10 h-14 bg-slate-100 rounded border-2 border-slate-200 flex flex-col gap-1 p-1">
                    <div className="w-full h-1 bg-slate-300 rounded-full" />
                    <div className="w-2/3 h-1 bg-slate-200 rounded-full" />
                    <div className="mt-auto w-full h-4 bg-emerald-100 rounded-sm" />
                  </div>
                  <span className={cn("text-xs font-black uppercase tracking-tighter", templateType === 'Small Bill' ? "text-emerald-700" : "text-slate-500")}>Small Bill</span>
                </button>

                <button
                  type="button"
                  onClick={() => setTemplateType('Large Professional')}
                  className={cn(
                    "flex flex-col items-center gap-2 p-3 rounded-2xl border-2 transition-all",
                    templateType === 'Large Professional' 
                      ? "bg-emerald-50 border-emerald-500 shadow-lg shadow-emerald-500/10" 
                      : "bg-white border-slate-100 hover:border-slate-200"
                  )}
                >
                  <div className="w-10 h-14 bg-slate-100 rounded border-2 border-slate-200 flex flex-col gap-1 p-1">
                    <div className="w-full h-1 bg-slate-300 rounded-full" />
                    <div className="w-full h-0.5 bg-slate-200 rounded-full" />
                    <div className="w-full h-0.5 bg-slate-200 rounded-full" />
                    <div className="w-full h-0.5 bg-slate-200 rounded-full" />
                    <div className="w-full h-0.5 bg-slate-200 rounded-full" />
                    <div className="mt-auto w-full h-1 bg-emerald-100 rounded-sm" />
                  </div>
                  <span className={cn("text-xs font-black uppercase tracking-tighter", templateType === 'Large Professional' ? "text-emerald-700" : "text-slate-500")}>Large Bill</span>
                </button>
              </div>
            </div>
            <div className="col-span-2">
              <p className="text-[10px] text-slate-400 mb-1.5 font-black uppercase tracking-widest pl-1">Due Date</p>
              <input 
                type="date"
                value={dueDate && !isNaN(new Date(dueDate).getTime()) ? new Date(dueDate).toISOString().split('T')[0] : ''}
                onChange={(e) => setDueDate(e.target.value ? new Date(e.target.value).getTime() : 0)}
                className="w-full px-4 py-3.5 bg-white border border-slate-200/80 rounded-2xl outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 font-bold text-slate-700 shadow-sm transition-all"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Items Section */}
      <div className="space-y-4 pt-6 border-t border-slate-100">
        <div className="flex justify-between items-center bg-slate-100/50 p-2 rounded-xl">
          <label className="flex items-center gap-2 text-sm font-black text-slate-800 uppercase tracking-widest">
             <span className="flex items-center justify-center w-6 h-6 rounded-md bg-white text-slate-500 shadow-sm">3</span> 
             Product / Service Items
          </label>
          <div className="flex gap-2">
            <button 
              type="button" 
              onClick={() => setShowColumnBuilder(true)}
              className="text-xs font-black text-slate-600 bg-white ring-1 ring-slate-200/50 flex items-center gap-1.5 hover:bg-slate-50 hover:ring-slate-300 px-3 py-1.5 rounded-lg transition-all shadow-sm"
            >
              <Settings size={16} /> Customize Columns
            </button>
            <button 
              type="button" 
              onClick={addItem}
              className="text-xs font-black text-emerald-600 bg-white ring-1 ring-emerald-200/50 flex items-center gap-1.5 hover:bg-emerald-50 hover:ring-emerald-300 px-3 py-1.5 rounded-lg transition-all shadow-sm"
            >
              <Plus size={16} /> Add Item
            </button>
          </div>
        </div>
        
        <div className="space-y-4 px-0 md:px-2">
          {items.map((item, index) => (
            <div key={item.id} className="bg-white rounded-3xl border border-slate-200/60 shadow-sm relative group transition-all hover:border-emerald-200 hover:shadow-xl hover:shadow-emerald-500/5 overflow-hidden">
              {/* Row Header - Mobile Friendly */}
              <div className="flex items-center justify-between px-6 py-3 bg-slate-50/50 border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <input
                    type="text"
                    value={item.serialNumber || index + 1}
                    onChange={(e) => updateItem(item.id, 'serialNumber', e.target.value)}
                    className="w-12 h-7 bg-slate-800 text-white rounded-lg text-center text-[10px] font-black z-10 shadow-md outline-none focus:ring-2 focus:ring-emerald-500"
                    title="Serial Number"
                  />
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Item Entry</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <button 
                    type="button" 
                    onClick={() => duplicateItem(item)}
                    className="p-2 text-slate-400 hover:text-emerald-500 hover:bg-emerald-50 rounded-xl transition-all"
                    title="Duplicate Item"
                  >
                    <Copy size={16} />
                  </button>
                  <button 
                    type="button" 
                    onClick={() => removeItem(item.id)}
                    className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all"
                    title="Remove Item"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>

              <div className="p-6">
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 items-end">
                  {visibleColumns.map(col => (
                    <div key={col.id} className={`space-y-1.5 ${(col.id === 'name' || col.id === 'description') ? 'col-span-2 md:col-span-2' : 'col-span-1 md:col-span-1'}`}>
                      <p className="text-[10px] font-black tracking-widest text-slate-400 pl-1 uppercase">{col.label}</p>
                      {col.id === 'total' ? (
                        <div className="bg-emerald-50 h-[46px] shadow-inner px-4 rounded-xl border border-emerald-100/50 flex justify-between items-center group-hover:bg-emerald-500 group-hover:border-emerald-400 transition-all">
                          <p className="font-black text-emerald-600 text-lg group-hover:text-white transition-colors">{formatCurrency(item.total)}</p>
                        </div>
                      ) : col.id === 'price' ? (
                        <input 
                          type="number" 
                          value={item[col.id] || ''}
                          onChange={(e) => updateItem(item.id, col.id as any, Number(e.target.value))}
                          disabled={item.workCharges && item.workCharges.length > 0}
                          className={cn(
                            "w-full px-4 py-3 bg-slate-50 border border-transparent rounded-xl outline-none focus:bg-white focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 transition-all font-bold text-sm",
                            item.workCharges && item.workCharges.length > 0 && "opacity-60 cursor-not-allowed"
                          )}
                        />
                      ) : col.type === 'quantity' || col.type === 'number' || col.type === 'currency' ? (
                        <input 
                          type="number" 
                          value={item[col.id] || ''}
                          onChange={(e) => updateItem(item.id, col.id as any, Number(e.target.value))}
                          className="w-full px-4 py-3 bg-slate-50 border border-transparent rounded-xl outline-none focus:bg-white focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 transition-all font-bold text-sm"
                        />
                      ) : col.type === 'date' ? (
                        <input 
                          type="date" 
                          value={item[col.id] || ''}
                          onChange={(e) => updateItem(item.id, col.id as any, e.target.value)}
                          className="w-full px-4 py-3 bg-slate-50 border border-transparent rounded-xl outline-none focus:bg-white focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 transition-all font-bold text-sm"
                        />
                      ) : (
                        <div className="relative">
                          <input 
                            type="text" 
                            value={item[col.id] || ''}
                            onChange={(e) => updateItem(item.id, col.id as any, e.target.value)}
                            onFocus={() => {
                              if (col.id === 'name' && item.name) {
                                setActiveItemSearch(item.id);
                                setProductSearch(item.name);
                              }
                            }}
                            placeholder={col.id === 'name' ? "Item name or service" : ""}
                            className="w-full px-4 py-3 bg-slate-50 border border-transparent rounded-xl outline-none focus:bg-white focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 transition-all font-bold text-sm"
                          />
                          {col.id === 'name' && activeItemSearch === item.id && productSearch && (
                            <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-slate-100 shadow-2xl rounded-2xl z-20 max-h-48 overflow-y-auto p-2">
                              {products
                                .filter(p => p.name.toLowerCase().includes(productSearch.toLowerCase()))
                                .map(p => (
                                  <button
                                    key={p.id}
                                    type="button"
                                    onClick={() => selectProduct(item.id, p)}
                                    className="w-full text-left px-4 py-2.5 hover:bg-emerald-50 rounded-lg flex justify-between items-center transition-colors mb-1 last:mb-0"
                                  >
                                    <span className="font-bold text-slate-800">{p.name}</span>
                                    <span className="text-xs font-black text-emerald-500">{formatCurrency(p.price)}</span>
                                  </button>
                                ))
                              }
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {/* Smart Rate Entry System */}
                <div className="mt-6 pt-4 border-t border-slate-100/60">
                   <div className="flex items-center justify-between mb-3">
                     <p className="text-xs font-bold text-slate-500 flex items-center gap-1.5">
                       <Plus size={14} className="text-emerald-500" /> Additional Work / Rates
                     </p>
                     <button
                       type="button"
                       onClick={() => addWorkCharge(item.id)}
                       className="text-[10px] font-black uppercase tracking-widest text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-lg hover:bg-emerald-100 transition-colors"
                     >
                       + Add Rate
                     </button>
                   </div>
                   
                   {item.workCharges && item.workCharges.length > 0 && (
                     <div className="bg-slate-50/50 rounded-xl p-3 space-y-2 border border-slate-100">
                       {item.workCharges.map(charge => (
                         <div key={charge.id} className="flex gap-2 items-center">
                           <input
                             type="text"
                             value={charge.name}
                             onChange={(e) => updateWorkCharge(item.id, charge.id, 'name', e.target.value)}
                             placeholder="e.g. Punching, Embroidery"
                             className="flex-1 px-3 py-2 text-sm font-medium bg-white border border-slate-200 shadow-sm rounded-lg outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10"
                           />
                           <input
                             type="number"
                             value={charge.rate || ''}
                             onChange={(e) => updateWorkCharge(item.id, charge.id, 'rate', Number(e.target.value))}
                             placeholder="Rate"
                             className="w-24 px-3 py-2 text-sm font-bold bg-white border border-slate-200 shadow-sm rounded-lg outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10"
                           />
                           <button
                             type="button"
                             onClick={() => removeWorkCharge(item.id, charge.id)}
                             className="p-2 text-slate-400 hover:text-rose-500 hover:bg-white rounded-lg transition-colors border border-transparent hover:border-rose-100 shadow-sm"
                           >
                             <Trash2 size={14} />
                           </button>
                         </div>
                       ))}
                       <div className="flex justify-end pt-2 px-2">
                         <p className="text-xs font-bold text-slate-500">
                           Combined Rate: <span className="text-emerald-600 tracking-tight text-sm ml-1">{formatCurrency(item.workCharges.reduce((sum, c) => sum + (c.rate || 0), 0))}</span>
                         </p>
                       </div>
                     </div>
                   )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Summary Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 pt-8 border-t border-slate-100">
        <div className="lg:col-span-7 space-y-6">
          <label className="flex items-center gap-2 text-sm font-black text-slate-800 uppercase tracking-widest bg-slate-100/50 p-2 rounded-xl">
             <span className="flex items-center justify-center w-6 h-6 rounded-md bg-white text-slate-500 shadow-sm">4</span> 
             Payment & Notes
          </label>
          <div className="grid grid-cols-2 gap-4 px-2">
            <div className="space-y-1.5">
              <p className="text-[10px] font-black tracking-widest text-slate-400 uppercase pl-1">Discount Amount</p>
              <div className="relative">
                 <span className="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-slate-400">$</span>
                 <input 
                   type="number" 
                   value={discount || ''}
                   onChange={(e) => setDiscount(Number(e.target.value))}
                   className="w-full pl-8 pr-4 py-3.5 bg-white border border-slate-200/80 rounded-2xl outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 font-bold transition-all shadow-sm"
                 />
              </div>
            </div>
            <div className="space-y-1.5">
              <p className="text-[10px] font-black tracking-widest text-slate-400 uppercase pl-1">Amount Paid Now</p>
              <div className="relative">
                 <span className="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-slate-400">$</span>
                 <input 
                   type="number" 
                   value={paidAmount || ''}
                   onChange={(e) => setPaidAmount(Number(e.target.value))}
                   className="w-full pl-8 pr-4 py-3.5 bg-white border border-slate-200/80 rounded-2xl outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 font-bold text-emerald-600 transition-all shadow-sm"
                 />
              </div>
            </div>
            <div className="col-span-2 space-y-1.5 mt-2">
               <p className="text-[10px] font-black tracking-widest text-slate-400 uppercase pl-1">Notes / Terms (Optional)</p>
               <textarea
                 value={notes}
                 onChange={e => setNotes(e.target.value)}
                 rows={3}
                 placeholder="Thank you for your business!"
                 className="w-full p-4 bg-white border border-slate-200/80 rounded-2xl outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 font-medium transition-all shadow-sm resize-none"
               />
            </div>
          </div>
        </div>

        <div className="lg:col-span-5 relative">
          <div className="bg-slate-900 rounded-[2rem] p-8 text-white space-y-5 shadow-2xl shadow-slate-900/20 sticky top-24">
            <div className="flex justify-between items-center text-slate-400 font-medium">
              <span>Subtotal</span>
              <span className="font-bold text-white">{formatCurrency(subtotal)}</span>
            </div>
            <div className="flex justify-between items-center text-slate-400 font-medium">
              <span>Discount</span>
              <span className="font-bold text-rose-400">-{formatCurrency(discount)}</span>
            </div>
            <div className="h-px bg-white/10 my-4" />
            <div className="flex justify-between items-end">
              <div>
                <p className="text-[10px] font-black text-emerald-400 uppercase tracking-widest mb-1.5">Grand Total</p>
                <p className="text-4xl md:text-5xl font-black tracking-tighter">{formatCurrency(grandTotal)}</p>
              </div>
            </div>
            
            <div className="pt-6 pb-2">
                <div className="w-full bg-slate-800 rounded-full h-3 mb-2 overflow-hidden flex">
                    <div 
                      className="bg-emerald-500 h-full transition-all duration-500 ease-out" 
                      style={{ width: grandTotal > 0 ? `${Math.min(100, (paidAmount / grandTotal) * 100)}%` : '0%' }}
                    />
                </div>
                <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest">
                   <span className="text-slate-400">Paid: <span className="text-white">{formatCurrency(paidAmount)}</span></span>
                   <span className="text-slate-400">Due: <span className="text-rose-400">{formatCurrency(dueAmount)}</span></span>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-4 border-t border-white/10">
              <button 
                type="button"
                onClick={(e) => handleSubmit(e, 'Draft')}
                disabled={isSubmitting}
                className="w-full py-4 bg-slate-800 hover:bg-slate-700 text-white rounded-2xl font-bold transition-all flex items-center justify-center gap-2 disabled:opacity-50 ring-1 ring-white/10 hover:ring-white/20"
              >
                 <Save size={18} />
                 Save Draft
              </button>
              <button 
                type="button"
                onClick={(e) => handleSubmit(e, 'Finalize')}
                disabled={isSubmitting}
                className="w-full py-4 bg-emerald-500 hover:bg-emerald-400 text-slate-900 rounded-2xl font-black transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/40 disabled:opacity-50 hover:-translate-y-0.5"
              >
                <CheckCircle2 size={18} />
                Finalize
              </button>
            </div>
          </div>
        </div>
      </div>

      {showColumnBuilder && (
        <ColumnBuilderModal 
          columns={invoiceColumns}
          onSave={handleSaveColumns}
          onClose={() => setShowColumnBuilder(false)}
          isPremium={isPremium}
        />
      )}
    </form>
  );
};

export default InvoiceForm;
