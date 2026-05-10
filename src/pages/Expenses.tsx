import React, { useEffect, useState } from 'react';
import { 
  Wallet, 
  Plus, 
  Calendar, 
  Tag, 
  ArrowUpRight, 
  TrendingDown,
  X,
  CreditCard,
  Building2,
  Lightbulb,
  User,
  Globe,
  MoreHorizontal
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { firestoreService } from '../services/firestoreService';
import { Expense, ExpenseCategory } from '../types';
import { formatCurrency, cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';

const CATEGORIES: { label: ExpenseCategory, icon: any, color: string }[] = [
  { label: 'Shop Rent', icon: Building2, color: 'bg-indigo-500' },
  { label: 'Electricity', icon: Lightbulb, color: 'bg-amber-500' },
  { label: 'Staff Salary', icon: User, color: 'bg-emerald-500' },
  { label: 'Internet', icon: Globe, color: 'bg-blue-500' },
  { label: 'Other Expense', icon: MoreHorizontal, color: 'bg-slate-500' },
];

const Expenses = () => {
  const { user } = useAuth();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [loading, setLoading] = useState(true);

  // Form state
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState<ExpenseCategory>('Other Expense');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

  useEffect(() => {
    if (!user) return;
    return firestoreService.getCollectionListener<Expense>(
      'expenses',
      [{ field: 'userId', operator: '==', value: user.uid }],
      setExpenses
    );
  }, [user]);

  const totalMonthly = expenses
    .filter(e => e.date && !isNaN(new Date(e.date).getTime()) && new Date(e.date).getMonth() === new Date().getMonth())
    .reduce((acc, e) => acc + e.amount, 0);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    
    await firestoreService.addDocument('expenses', {
      userId: user.uid,
      amount: Number(amount),
      category,
      description,
      date: date ? new Date(date).getTime() : Date.now(),
    });

    setShowAdd(false);
    setAmount('');
    setDescription('');
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Expenses</h1>
          <p className="text-slate-500">Track and categorize your business spending.</p>
        </div>
        <button 
          onClick={() => setShowAdd(true)}
          className="flex items-center justify-center gap-2 px-6 py-3 bg-rose-500 text-white rounded-2xl font-bold hover:shadow-lg hover:shadow-rose-100 transition-all"
        >
          <Plus size={20} /> Add Expense
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-2 space-y-6">
          <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-50 font-bold text-slate-800">Recent Transactions</div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="text-xs font-bold text-slate-400 uppercase tracking-widest bg-slate-50/50">
                  <tr>
                    <th className="px-6 py-4">Expense</th>
                    <th className="px-6 py-4 text-right">Amount</th>
                    <th className="px-6 py-4">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 text-sm">
                  {expenses.map((exp) => {
                    const catInfo = CATEGORIES.find(c => c.label === exp.category);
                    return (
                      <tr key={exp.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className={cn("p-2 rounded-xl text-white", catInfo?.color)}>
                              {catInfo && <catInfo.icon size={16} />}
                            </div>
                            <div>
                                <p className="font-bold text-slate-800">{exp.category}</p>
                                <p className="text-xs text-slate-400">{exp.description || 'No description'}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-right font-black text-rose-500">{formatCurrency(exp.amount)}</td>
                        <td className="px-6 py-4 text-slate-500 uppercase text-[11px] font-bold">
                           {exp.date && !isNaN(new Date(exp.date).getTime()) ? new Date(exp.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }) : 'No Date'}
                        </td>
                      </tr>
                    );
                  })}
                  {expenses.length === 0 && (
                    <tr>
                      <td colSpan={3} className="px-6 py-20 text-center text-slate-400 italic">No expenses recorded yet.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-slate-900 rounded-3xl p-8 text-white relative overflow-hidden">
             <div className="absolute -top-12 -right-12 w-32 h-32 bg-rose-500/20 rounded-full blur-3xl" />
             <div className="relative z-10">
                <div className="p-3 bg-rose-500 w-fit rounded-2xl mb-6 shadow-xl shadow-rose-900/50">
                    <TrendingDown size={24} />
                </div>
                <p className="text-slate-400 font-medium mb-1">Monthly Spending</p>
                <h3 className="text-4xl font-black mb-2">{formatCurrency(totalMonthly)}</h3>
                <p className="text-xs text-slate-400">Total spending for current month.</p>
             </div>
          </div>

          <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm">
            <h3 className="font-bold text-slate-800 mb-4">Categories</h3>
            <div className="space-y-4">
              {CATEGORIES.map(cat => {
                const total = expenses.filter(e => e.category === cat.label).reduce((acc, e) => acc + e.amount, 0);
                return (
                  <div key={cat.label} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={cn("w-2 h-2 rounded-full", cat.color)} />
                      <span className="text-sm font-medium text-slate-600">{cat.label}</span>
                    </div>
                    <span className="text-xs font-bold text-slate-900">{formatCurrency(total)}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Add Modal */}
      <AnimatePresence>
        {showAdd && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
               initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
               onClick={() => setShowAdd(false)} className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" 
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl p-8"
            >
              <h2 className="text-2xl font-bold text-slate-900 mb-6">Log Expense</h2>
              <form onSubmit={handleAdd} className="space-y-5">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-widest pl-1">Amount</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">₹</span>
                    <input 
                      type="number" required value={amount} onChange={(e) => setAmount(e.target.value)}
                      className="w-full pl-8 pr-4 py-3 bg-slate-50 border-transparent border-2 focus:border-emerald-500 focus:bg-white rounded-2xl outline-none transition-all font-bold text-lg"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-widest pl-1">Category</label>
                  <select 
                    value={category} onChange={(e) => setCategory(e.target.value as ExpenseCategory)}
                    className="w-full px-4 py-3 bg-slate-50 border-transparent border-2 focus:border-emerald-500 focus:bg-white rounded-2xl outline-none transition-all font-medium appearance-none"
                  >
                    {CATEGORIES.map(c => <option key={c.label} value={c.label}>{c.label}</option>)}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-widest pl-1">Date</label>
                  <input 
                    type="date" value={date} onChange={(e) => setDate(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-50 border-transparent border-2 focus:border-emerald-500 focus:bg-white rounded-2xl outline-none transition-all font-medium"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-widest pl-1">Description</label>
                  <textarea 
                    value={description} onChange={(e) => setDescription(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-50 border-transparent border-2 focus:border-emerald-500 focus:bg-white rounded-2xl outline-none transition-all font-medium resize-none h-24"
                    placeholder="Short note about this expense..."
                  />
                </div>

                <div className="flex gap-4 pt-4">
                  <button type="button" onClick={() => setShowAdd(false)} className="flex-1 py-4 font-bold text-slate-500 hover:bg-slate-50 rounded-2xl transition-all">Cancel</button>
                  <button type="submit" className="flex-1 py-4 bg-emerald-500 text-white font-bold rounded-2xl shadow-lg shadow-emerald-100 hover:bg-emerald-400 transition-all">Save Expense</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Expenses;
