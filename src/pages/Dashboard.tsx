import React, { useEffect, useState } from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  Users, 
  FileText, 
  ArrowUpRight, 
  ArrowDownRight,
  Clock,
  AlertCircle,
  Activity,
  Target,
  RefreshCw,
  Trash2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '../context/AuthContext';
import { firestoreService } from '../services/firestoreService';
import { Invoice, Expense, Customer } from '../types';
import { formatCurrency, cn } from '../lib/utils';
import { formatDistanceToNow } from 'date-fns';

const StatCard = ({ title, value, icon: Icon, trend, trendValue, color, isLoading }: any) => (

  <div className="bg-white p-6 rounded-[2rem] border border-slate-100/50 shadow-sm shadow-slate-200/50 hover:shadow-xl hover:shadow-slate-200/50 hover:-translate-y-1 transition-all duration-300 relative overflow-hidden group">
    <div className="absolute top-0 right-0 p-8 opacity-[0.03] group-hover:opacity-[0.05] group-hover:scale-110 transition-all duration-500 pointer-events-none">
      <Icon size={120} />
    </div>
    
    <div className="flex justify-between items-start mb-6 relative z-10">
      <div className={cn("p-4 rounded-2xl shadow-inner", color)}>
        <Icon size={24} className="text-white relative z-10" />
      </div>
      {!isLoading && trend && (
        <div className={cn(
          "flex items-center text-[11px] font-bold px-2.5 py-1.5 rounded-full backdrop-blur-sm",
          trend === 'up' ? "bg-emerald-500/10 text-emerald-600" : "bg-rose-500/10 text-rose-600"
        )}>
          {trend === 'up' ? <ArrowUpRight size={14} className="mr-1" /> : <ArrowDownRight size={14} className="mr-1" />}
          {trendValue}
        </div>
      )}
    </div>
    <div className="relative z-10">
      <p className="text-sm font-semibold text-slate-500 mb-2 truncate">{title}</p>
      {isLoading ? (
        <div className="h-8 w-32 bg-slate-100 rounded-lg animate-pulse" />
      ) : (
        <h3 className="text-3xl font-black text-slate-900 tracking-tight">{value}</h3>
      )}
    </div>
  </div>
);

const SkeletonRow = () => (
  <tr className="animate-pulse">
    <td className="px-6 py-4"><div className="h-4 w-24 bg-slate-100 rounded mb-2" /><div className="h-3 w-16 bg-slate-100 rounded" /></td>
    <td className="px-6 py-4"><div className="h-4 w-32 bg-slate-100 rounded" /></td>
    <td className="px-6 py-4"><div className="h-4 w-20 bg-slate-100 rounded" /></td>
    <td className="px-6 py-4"><div className="h-6 w-16 bg-slate-100 rounded-lg" /></td>
  </tr>
);

const Dashboard = () => {
  const { user } = useAuth();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeframe, setTimeframe] = useState<'today' | 'week' | 'month'>('month');
  const [showResetModal, setShowResetModal] = useState(false);
  const [isResetting, setIsResetting] = useState(false);

  useEffect(() => {
    if (!user) return;

    const unsubInvoices = firestoreService.getCollectionListener<Invoice>(
      'invoices',
      [{ field: 'userId', operator: '==', value: user.uid }],
      (data) => {
        setInvoices(data.sort((a,b) => (b.createdAt || 0) - (a.createdAt || 0)));
      }
    );

    const unsubExpenses = firestoreService.getCollectionListener<Expense>(
      'expenses',
      [{ field: 'userId', operator: '==', value: user.uid }],
      setExpenses
    );

    const unsubCustomers = firestoreService.getCollectionListener<Customer>(
      'customers',
      [{ field: 'userId', operator: '==', value: user.uid }],
      setCustomers
    );

    const timer = setTimeout(() => setLoading(false), 800); // slight delay for smooth transition

    return () => {
      unsubInvoices();
      unsubExpenses();
      unsubCustomers();
      clearTimeout(timer);
    };
  }, [user]);

  // Calculations based on timeframe
  const now = new Date();
  const todayStart = new Date(now).setHours(0,0,0,0);
  
  const weekStart = new Date(now);
  weekStart.setDate(now.getDate() - now.getDay());
  weekStart.setHours(0,0,0,0);
  
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).getTime();

  let filterTime = todayStart;
  if (timeframe === 'week') filterTime = weekStart.getTime();
  if (timeframe === 'month') filterTime = monthStart;

  const relevantInvoices = invoices.filter(inv => inv.createdAt >= filterTime && inv.status !== 'Draft');
  const relevantExpenses = expenses.filter(exp => exp.date >= filterTime);

  const revenue = relevantInvoices.reduce((acc, inv) => acc + inv.total, 0);
  const collected = relevantInvoices.reduce((acc, inv) => acc + (inv.paidAmount || 0), 0);
  const periodExpenses = relevantExpenses.reduce((acc, exp) => acc + exp.amount, 0);

  const totalSales = invoices.filter(inv => inv.status !== 'Draft').reduce((acc, inv) => acc + inv.total, 0);
  const totalDue = invoices.reduce((acc, inv) => acc + (inv.dueAmount || 0), 0);
  const totalExpenses = expenses.reduce((acc, exp) => acc + exp.amount, 0);
  const netProfit = totalSales - totalExpenses;

  const stats = [
    { title: `${timeframe === 'today' ? 'Today\'s' : timeframe === 'week' ? 'This Week\'s' : 'This Month\'s'} Revenue`, value: formatCurrency(revenue), icon: TrendingUp, color: 'bg-gradient-to-tr from-emerald-500 to-teal-400', trend: 'up', trendValue: `${formatCurrency(collected)} collected`, isLoading: loading },
    { title: 'Total Outstanding due', value: formatCurrency(totalDue), icon: Clock, color: 'bg-gradient-to-tr from-amber-500 to-orange-400', trend: totalDue > 0 ? 'down' : null, trendValue: 'Action needed', isLoading: loading },
    { title: 'Net Profit (All Time)', value: formatCurrency(netProfit), icon: Target, color: 'bg-gradient-to-tr from-indigo-500 to-purple-400', trend: 'up', trendValue: `${formatCurrency(totalExpenses)} total exp`, isLoading: loading },
    { title: 'Total Customers', value: customers.length.toString(), icon: Users, color: 'bg-gradient-to-tr from-blue-500 to-cyan-400', isLoading: loading },
  ];

  const dueInvoices = invoices.filter(inv => inv.dueAmount > 0 && inv.status !== 'Draft').slice(0, 4);
  const recentInvoices = invoices.slice(0, 5);

  const handleResetData = async () => {
    if (!user) return;
    setIsResetting(true);
    try {
      await firestoreService.resetUserData(user.uid);
      setShowResetModal(false);
    } catch (error) {
       console.error("Error resetting data", error);
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <div className="space-y-8 pb-10">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight">Dashboard.</h1>
          <p className="text-slate-500 font-medium mt-1">Here's the latest pulse of your business.</p>
        </div>
        <div className="flex gap-3">
          <div className="flex bg-slate-100/50 backdrop-blur-md p-1 rounded-2xl w-fit">
            {['today', 'week', 'month'].map((t) => (
              <button
                key={t}
                onClick={() => setTimeframe(t as 'today' | 'week' | 'month')}
                className={cn(
                  "px-5 py-2 rounded-xl text-sm font-bold capitalize transition-all duration-300 relative",
                  timeframe === t ? "text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"
                )}
              >
                {timeframe === t && (
                  <motion.div layoutId="timeframe" className="absolute inset-0 bg-white rounded-xl -z-10" />
                )}
                {t}
              </button>
            ))}
          </div>
          <button 
            onClick={() => setShowResetModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-2xl font-bold transition-all text-sm shrink-0"
          >
            <RefreshCw size={16} /> Reset
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
        {stats.map((stat, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          >
            <StatCard {...stat} />
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        
        {/* Urgent Actions / Due Alerts */}
        <div className="xl:col-span-1 space-y-6 flex flex-col">
          <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm p-6 flex-1 flex flex-col">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-rose-50 flex items-center justify-center text-rose-500">
                <AlertCircle size={20} />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-lg tracking-tight">Due Reminders</h3>
                <p className="text-[11px] font-medium text-slate-500 uppercase tracking-widest">{dueInvoices.length} Invoices pending</p>
              </div>
            </div>
            
            <div className="space-y-3 flex-1">
              {loading ? (
                Array(3).fill(0).map((_, i) => (
                  <div key={i} className="flex items-center justify-between p-4 border border-slate-100 rounded-2xl animate-pulse">
                     <div className="flex items-center gap-3">
                       <div className="w-10 h-10 rounded-full bg-slate-100" />
                       <div><div className="h-4 w-24 bg-slate-100 rounded mb-2" /><div className="h-3 w-16 bg-slate-100 rounded" /></div>
                     </div>
                     <div className="h-6 w-16 bg-slate-100 rounded-lg" />
                  </div>
                ))
              ) : dueInvoices.length > 0 ? (
                dueInvoices.map(inv => (
                  <div key={inv.id} className="flex items-center justify-between p-4 border border-slate-100 rounded-2xl hover:border-slate-200 transition-colors group cursor-pointer">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-600 font-bold text-sm shrink-0 border border-slate-100 group-hover:bg-amber-50 group-hover:text-amber-600 group-hover:border-amber-100 transition-colors">
                        {inv.customerName.charAt(0)}
                      </div>
                      <div className="overflow-hidden">
                        <p className="text-sm font-bold text-slate-900 truncate">{inv.customerName}</p>
                        <p className="text-xs text-slate-500 truncate">Due: {formatCurrency(inv.dueAmount)}</p>
                      </div>
                    </div>
                    <button className="px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-700 rounded-lg text-xs font-bold transition-colors whitespace-nowrap">
                      Remind
                    </button>
                  </div>
                ))
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-center p-6 border-2 border-dashed border-slate-100 rounded-[1.5rem]">
                   <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center text-emerald-500 mb-4">
                     <Target size={24} />
                   </div>
                   <p className="font-bold text-slate-700">All caught up!</p>
                   <p className="text-sm text-slate-400 mt-1">No overdue invoices right now.</p>
                </div>
              )}
            </div>
            {dueInvoices.length > 0 && (
               <button className="w-full mt-4 py-3 bg-slate-50 hover:bg-slate-100 text-slate-600 font-semibold rounded-xl text-sm transition-colors">
                 View All Due Invoices
               </button>
            )}
          </div>
        </div>

        {/* Recent Invoices */}
        <div className="xl:col-span-2 bg-white rounded-[2rem] border border-slate-100 shadow-sm flex flex-col overflow-hidden">
          <div className="px-8 py-6 border-b border-slate-50/80 flex justify-between items-center bg-white/50 backdrop-blur-md">
            <div>
              <h3 className="font-bold text-slate-900 text-lg tracking-tight">Recent Activity</h3>
              <p className="text-xs font-medium text-slate-500 mt-0.5">Latest generated invoices</p>
            </div>
            <button className="text-sm font-bold text-emerald-600 hover:text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-4 py-2 rounded-xl transition-colors">View All</button>
          </div>
          <div className="flex-1 overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="text-[10px] font-black text-slate-400 uppercase tracking-widest bg-slate-50/50">
                  <th className="px-8 py-4 rounded-tl-2xl">Invoice & Date</th>
                  <th className="px-8 py-4">Client</th>
                  <th className="px-8 py-4">Amount</th>
                  <th className="px-8 py-4 rounded-tr-2xl">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50/80 text-sm">
                {loading ? (
                  <>
                    <SkeletonRow />
                    <SkeletonRow />
                    <SkeletonRow />
                    <SkeletonRow />
                  </>
                ) : recentInvoices.length > 0 ? (
                  recentInvoices.map((inv) => (
                    <tr key={inv.id} className="hover:bg-slate-50/80 transition-colors group cursor-pointer">
                      <td className="px-8 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 border border-slate-100 group-hover:bg-white group-hover:shadow-sm transition-all group-hover:text-emerald-500">
                             <FileText size={18} />
                          </div>
                          <div>
                            <p className="font-bold text-slate-900">{inv.invoiceNumber}</p>
                            <p className="text-xs text-slate-500 font-medium">{inv.createdAt && !isNaN(inv.createdAt) ? formatDistanceToNow(inv.createdAt, { addSuffix: true }) : 'Recently'}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-8 py-4">
                        <p className="font-semibold text-slate-700">{inv.customerName}</p>
                      </td>
                      <td className="px-8 py-4">
                        <p className="font-black text-slate-800 tracking-tight">{formatCurrency(inv.total)}</p>
                      </td>
                      <td className="px-8 py-4">
                        <span className={cn(
                          "inline-flex items-center px-2.5 py-1.5 rounded-lg text-xs font-black uppercase tracking-wider",
                          inv.status === 'Paid' ? "bg-emerald-50 text-emerald-600 ring-1 ring-inset ring-emerald-500/20" :
                          inv.status === 'Partial' ? "bg-amber-50 text-amber-600 ring-1 ring-inset ring-amber-500/20" :
                          inv.status === 'Draft' ? "bg-slate-100 text-slate-500 ring-1 ring-inset ring-slate-500/20" :
                          "bg-rose-50 text-rose-600 ring-1 ring-inset ring-rose-500/20"
                        )}>
                          {inv.status}
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="px-8 py-16 text-center">
                       <div className="inline-flex flex-col items-center">
                         <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center text-slate-300 mb-4">
                            <Activity size={32} />
                         </div>
                         <p className="text-slate-500 font-semibold mb-1">No activity yet</p>
                         <p className="text-sm text-slate-400">Create your first invoice to see your data.</p>
                       </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {showResetModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-[2rem] shadow-xl w-full max-w-md p-8 relative overflow-hidden"
            >
              <div className="w-16 h-16 bg-rose-50 text-rose-500 rounded-full flex items-center justify-center mb-6">
                <AlertCircle size={32} />
              </div>
              <h2 className="text-2xl font-black text-slate-900 mb-2">Reset Account Data?</h2>
              <p className="text-slate-500 font-medium mb-8">
                This will permanently delete all your invoices, expenses, customers, and app settings. This action cannot be undone. Are you absolutely certain?
              </p>
              
              <div className="flex items-center gap-3">
                <button 
                  onClick={() => setShowResetModal(false)}
                  disabled={isResetting}
                  className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-3.5 rounded-xl transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleResetData}
                  disabled={isResetting}
                  className="flex-1 bg-rose-600 hover:bg-rose-700 text-white font-bold py-3.5 rounded-xl transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isResetting ? (
                    <RefreshCw size={18} className="animate-spin" />
                  ) : (
                    <>
                      <Trash2 size={18} /> Yes, Delete All
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Dashboard;
