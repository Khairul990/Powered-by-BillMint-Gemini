import React, { useEffect, useState } from 'react';
import { 
  Users, 
  FileText, 
  CreditCard, 
  ShieldCheck, 
  TrendingUp,
  Search,
  CheckCircle,
  XCircle,
  Activity
} from 'lucide-react';
import { firestoreService } from '../services/firestoreService';
import { UserProfile, Invoice } from '../types';
import { formatCurrency, cn } from '../lib/utils';
import { motion } from 'motion/react';

const AdminPanel = () => {
  const [userList, setUserList] = useState<UserProfile[]>([]);
  const [allInvoices, setAllInvoices] = useState<Invoice[]>([]);
  const [search, setSearch] = useState('');

  useEffect(() => {
    // In a real app, this would be a specific admin-ony collection or restricted query
    // For this prototype, we'll listen to the collections
    const unsubUsers = firestoreService.getCollectionListener<UserProfile>('users', [], setUserList);
    const unsubInvoices = firestoreService.getCollectionListener<Invoice>('invoices', [], setAllInvoices);
    
    return () => {
      unsubUsers();
      unsubInvoices();
    };
  }, []);

  const totalRevenue = userList.filter(u => u.isPremium).length * 99;
  const premiumCount = userList.filter(u => u.isPremium).length;
  const filteredUsers = userList.filter(u => 
    u.email?.toLowerCase().includes(search.toLowerCase()) || 
    u.displayName?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 bg-slate-900 rounded-2xl flex items-center justify-center text-white">
          <ShieldCheck size={24} />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Admin Dashboard</h1>
          <p className="text-slate-500">Platform-wide oversight and revenue tracking.</p>
        </div>
      </div>

      {/* Hero Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-slate-900 p-8 rounded-3xl text-white relative overflow-hidden group">
          <div className="absolute -top-12 -right-12 w-32 h-32 bg-emerald-500/20 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-700" />
          <p className="text-slate-400 font-bold text-xs uppercase tracking-widest mb-2">Total Monthly Revenue</p>
          <h2 className="text-4xl font-black text-emerald-400 mb-1">{formatCurrency(totalRevenue)}</h2>
          <p className="text-xs text-slate-500">Based on {premiumCount} active premium subscriptions.</p>
        </div>
        <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm">
          <p className="text-slate-400 font-bold text-xs uppercase tracking-widest mb-2">Active Users</p>
          <h2 className="text-4xl font-black text-slate-900 mb-1">{userList.length}</h2>
          <div className="flex items-center gap-2 text-emerald-600 font-bold text-sm">
            <Activity size={16} /> Live monitoring active
          </div>
        </div>
        <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm">
           <p className="text-slate-400 font-bold text-xs uppercase tracking-widest mb-2">Platform Invoices</p>
           <h2 className="text-4xl font-black text-slate-900 mb-1">{allInvoices.length}</h2>
           <p className="text-xs text-slate-500">Total invoices generated system-wide.</p>
        </div>
      </div>

      {/* User Management */}
      <div className="space-y-4">
        <div className="flex justify-between items-end">
          <h3 className="text-xl font-bold text-slate-800">User Management</h3>
          <div className="relative w-64">
             <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
             <input 
                type="text" value={search} onChange={(e) => setSearch(e.target.value)}
                placeholder="Find users..."
                className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:ring-1 ring-emerald-500 outline-none"
             />
          </div>
        </div>

        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="text-[10px] font-black text-slate-400 uppercase tracking-widest bg-slate-50/50">
                  <th className="px-6 py-4">User Details</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-center">Invoices</th>
                  <th className="px-6 py-4 text-right">Joined</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 text-sm">
                {filteredUsers.map(user => (
                  <tr key={user.uid} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4">
                      <p className="font-bold text-slate-800">{user.displayName || 'Unknown'}</p>
                      <p className="text-xs text-slate-500">{user.email}</p>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        {user.isPremium ? (
                          <div className="flex items-center gap-1.5 px-2 py-1 bg-emerald-50 text-emerald-600 rounded-lg font-black text-[10px] uppercase">
                            <CheckCircle size={12} /> Premium
                          </div>
                        ) : (
                          <div className="flex items-center gap-1.5 px-2 py-1 bg-slate-100 text-slate-600 rounded-lg font-black text-[10px] uppercase">
                            <XCircle size={12} /> Free
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center font-bold text-slate-700">{user.invoiceCount}</td>
                    <td className="px-6 py-4 text-right text-slate-400 text-xs">
                      {user.createdAt && !isNaN(new Date(user.createdAt).getTime()) ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminPanel;
