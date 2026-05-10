import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  LayoutDashboard, 
  FileText, 
  Users, 
  Wallet, 
  Settings as SettingsIcon, 
  LogOut, 
  Menu, 
  X, 
  ChevronRight,
  ShieldCheck,
  Bell,
  Package
} from 'lucide-react';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';

interface LayoutProps {
  children: React.ReactNode;
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

const Layout: React.FC<LayoutProps> = ({ children, activeTab, setActiveTab }) => {
  const { user, logout, profile } = useAuth();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'invoices', label: 'Invoices', icon: FileText },
    { id: 'customers', label: 'Customers', icon: Users },
    { id: 'inventory', label: 'Products', icon: Package },
    { id: 'expenses', label: 'Expenses', icon: Wallet },
    { id: 'settings', label: 'Settings', icon: SettingsIcon },
  ];

  if (profile?.email === 'khairul20052007@gmail.com') { // Admin logic
    menuItems.push({ id: 'admin', label: 'Admin', icon: ShieldCheck });
  }

  // Filter out settings and admin for bottom nav to keep it clean (up to 5 items)
  const bottomNavItems = menuItems.filter(item => !['admin', 'settings'].includes(item.id)).slice(0, 4);

  return (
    <div className="min-h-[100dvh] bg-slate-50/50 flex">
      {/* Sidebar Desktop (and hidden on mobile unless toggled if we kept that, but we'll use bottom nav for mobile) */}
      <aside className={cn(
        "fixed inset-y-0 left-0 z-40 w-64 bg-white/80 backdrop-blur-xl border-r border-slate-200/60 transform transition-transform duration-300 lg:translate-x-0 lg:static hidden lg:block"
      )}>
        <div className="h-full flex flex-col">
          <div className="p-8 flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-tr from-emerald-500 to-teal-400 rounded-xl flex items-center justify-center text-white font-black text-xl shadow-lg shadow-emerald-500/20">
              BM
            </div>
            <span className="text-2xl font-black text-slate-800 tracking-tight">BillMint</span>
          </div>

          <nav className="flex-1 px-4 space-y-1.5 mt-4">
            {menuItems.map((item) => (
              <button
                key={item.id}
                onClick={() => {
                  setActiveTab(item.id);
                  setIsSidebarOpen(false);
                }}
                className={cn(
                  "w-full flex items-center space-x-3 px-4 py-3 rounded-2xl transition-all duration-300 group relative overflow-hidden",
                  activeTab === item.id 
                    ? "bg-slate-900 text-white font-medium shadow-md" 
                    : "text-slate-500 hover:bg-slate-100 hover:text-slate-900"
                )}
              >
                <item.icon size={20} className={cn(
                  "transition-colors relative z-10",
                  activeTab === item.id ? "text-emerald-400" : "text-slate-400 group-hover:text-slate-600"
                )} />
                <span className="relative z-10">{item.label}</span>
                {activeTab === item.id && (
                  <motion.div 
                    layoutId="activeTabIndicatorDesktop"
                    className="ml-auto relative z-10 text-slate-400"
                  >
                    <ChevronRight size={16} />
                  </motion.div>
                )}
              </button>
            ))}
          </nav>

          <div className="p-4">
            <div className="px-4 py-4 bg-slate-50 border border-slate-100 rounded-3xl mb-4 flex items-center justify-between group cursor-pointer hover:border-slate-200 transition-colors">
              <div className="flex items-center space-x-3 overflow-hidden">
                <div className="w-10 h-10 rounded-full bg-emerald-100 flex shadow-inner items-center justify-center text-emerald-700 font-bold text-sm shrink-0">
                  {user?.displayName?.charAt(0) || user?.email?.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-slate-900 truncate">{user?.displayName || 'User'}</p>
                  <p className="text-xs font-medium text-emerald-600 truncate">{profile?.isPremium ? 'Premium' : 'Free Plan'}</p>
                </div>
              </div>
              <button onClick={() => setActiveTab('settings')} className="text-slate-400 hover:text-slate-900 transition-colors shrink-0">
                <SettingsIcon size={18} />
              </button>
            </div>
            <button
              onClick={() => logout()}
              className="w-full flex items-center justify-center space-x-2 px-4 py-3 rounded-2xl text-slate-500 hover:bg-red-50 hover:text-red-600 transition-colors font-medium text-sm"
            >
              <LogOut size={18} />
              <span>Sign out</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 h-[100dvh] overflow-y-auto pb-24 lg:pb-0 scroll-smooth">
        
        {/* Mobile Header */}
        <header className="lg:hidden sticky top-0 z-30 bg-white/80 backdrop-blur-xl border-b border-slate-200/60 px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
             <div className="w-8 h-8 bg-gradient-to-tr from-emerald-500 to-teal-400 rounded-lg flex items-center justify-center text-white font-black text-sm shadow-md">
              BM
            </div>
            <span className="text-xl font-black text-slate-900 tracking-tight">BillMint</span>
          </div>
          <div className="flex items-center gap-3">
             <button className="w-10 h-10 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-600 relative">
               <Bell size={18} />
               <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-red-500 rounded-full ring-2 ring-white"></span>
             </button>
             <button onClick={() => setActiveTab('settings')} className="w-10 h-10 rounded-full bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-700 font-bold text-sm">
                {user?.displayName?.charAt(0) || user?.email?.charAt(0)}
             </button>
          </div>
        </header>

        <div className="max-w-6xl mx-auto p-4 lg:p-8 min-h-screen flex flex-col">
          <div className="flex-1">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 15, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -15, scale: 0.98 }}
                transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
              >
                {children}
              </motion.div>
            </AnimatePresence>
          </div>

          <footer className="mt-20 py-10 border-t border-slate-200/60 flex flex-col md:flex-row justify-between items-center gap-6 text-slate-400 text-xs font-bold">
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 bg-slate-200 rounded flex items-center justify-center text-slate-500 font-black text-[8px]">BM</div>
              <p>© 2026 BillMint. All rights reserved.</p>
            </div>
            <div className="flex items-center gap-8">
               <a href="#" className="hover:text-slate-900 transition-colors">Support</a>
               <a href="#" className="hover:text-slate-900 transition-colors">Privacy</a>
               <p className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 rounded-full text-[10px] uppercase tracking-widest text-slate-500">
                 Powered by <span className="text-slate-900 font-black">BillMint</span>
               </p>
            </div>
          </footer>
        </div>
      </main>

      {/* Mobile Bottom Navigation */}
      <nav className="lg:hidden fixed bottom-6 left-4 right-4 z-40 bg-slate-900 rounded-3xl shadow-2xl shadow-slate-900/20 flex items-center justify-around p-2">
        {bottomNavItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className="relative p-3 rounded-2xl flex flex-col items-center justify-center w-16"
          >
            {activeTab === item.id && (
              <motion.div 
                layoutId="mobileNavIndicator"
                className="absolute inset-0 bg-white/10 rounded-2xl"
                transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
              />
            )}
            <item.icon size={22} className={cn(
              "relative z-10 transition-colors mb-1",
              activeTab === item.id ? "text-emerald-400" : "text-slate-400"
            )} />
            <span className={cn(
              "text-[10px] font-medium relative z-10 transition-colors",
              activeTab === item.id ? "text-white" : "text-slate-400"
            )}>
              {item.label}
            </span>
          </button>
        ))}
      </nav>
    </div>
  );
};

export default Layout;

