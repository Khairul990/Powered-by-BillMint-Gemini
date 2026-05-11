import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { SubscriptionProvider } from './context/SubscriptionContext';
import Layout from './components/Layout';
import { 
  Plus, 
  ArrowRight, 
  CheckCircle2, 
  Zap, 
  Shield, 
  BarChart3,
  CreditCard,
  X
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

// lazy path imports for pages
import Dashboard from './pages/Dashboard';
import Invoices from './pages/Invoices';
import Customers from './pages/Customers';
import Expenses from './pages/Expenses';
import Inventory from './pages/Inventory';
import Settings from './pages/Settings';
import AdminPanel from './pages/AdminPanel';

const LandingPage = () => {
  const { login } = useAuth();
  const [showLogin, setShowLogin] = useState(false);

  const handleGoogleSignIn = async () => {
    try {
      await login();
      setShowLogin(false);
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <nav className="max-w-7xl mx-auto px-6 py-6 flex justify-between items-center">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center text-white font-bold">B</div>
          <span className="text-xl font-bold tracking-tight">BillMint</span>
        </div>
        <button 
          onClick={() => setShowLogin(true)}
          className="px-5 py-2.5 bg-slate-900 text-white rounded-full font-medium hover:bg-slate-800 transition-colors"
        >
          Get Started
        </button>
      </nav>

      <main>
        <section className="max-w-5xl mx-auto px-6 pt-20 pb-32 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <span className="inline-block px-4 py-1.5 bg-emerald-50 text-emerald-600 rounded-full text-sm font-semibold mb-6">
              Simplifying Business Billing
            </span>
            <h1 className="text-5xl md:text-7xl font-bold text-slate-900 tracking-tight leading-[1.1] mb-8">
              Professional Billing <br />
              <span className="text-emerald-500">Managed by BillMint.</span>
            </h1>
            <p className="text-xl text-slate-600 max-w-2xl mx-auto mb-10">
              Create gorgeous invoices, track business expenses, and manage your clients with the most intuitive billing platform on the market.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <button 
                onClick={() => setShowLogin(true)}
                className="w-full sm:w-auto px-8 py-4 bg-emerald-500 text-white rounded-2xl font-bold text-lg hover:shadow-lg hover:shadow-emerald-200 transition-all flex items-center justify-center gap-2"
              >
                Start Invoicing Now <ArrowRight size={20} />
              </button>
              <button className="w-full sm:w-auto px-8 py-4 border border-slate-200 text-slate-700 rounded-2xl font-bold text-lg hover:bg-slate-50 transition-all">
                View Demo
              </button>
            </div>
          </motion.div>
        </section>

        {/* Features Preview */}
        <section className="bg-slate-50 py-24">
          <div className="max-w-7xl mx-auto px-6">
            <div className="grid md:grid-cols-3 gap-8">
              {[
                { icon: Zap, title: "Lightning Fast", desc: "Create and send professional invoices in under 60 seconds." },
                { icon: BarChart3, title: "Smart Tracking", desc: "Keep a pulse on your business with real-time revenue and expense analytics." },
                { icon: Shield, title: "Secure & Reliable", desc: "Your business data is safely stored and always accessible from any device." }
              ].map((f, i) => (
                <div key={i} className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm">
                  <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600 mb-6">
                    <f.icon size={24} />
                  </div>
                  <h3 className="text-xl font-bold text-slate-800 mb-3">{f.title}</h3>
                  <p className="text-slate-500 leading-relaxed">{f.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Pricing */}
        <section className="py-24 max-w-5xl mx-auto px-6 text-center">
            <h2 className="text-4xl font-bold text-slate-900 mb-16">Simple, Transparent Pricing</h2>
            <div className="grid md:grid-cols-2 gap-8 max-w-3xl mx-auto text-left">
                {/* Free */}
                <div className="p-8 rounded-3xl border border-slate-200">
                    <h3 className="text-lg font-bold text-slate-900 mb-2">Free Plan</h3>
                    <p className="text-3xl font-bold mb-6">₹0 <span className="text-lg font-normal text-slate-500">/ forever</span></p>
                    <ul className="space-y-4 mb-8">
                        <li className="flex items-center gap-2 text-slate-600"><CheckCircle2 size={18} className="text-emerald-500"/> 5 Invoices Free</li>
                        <li className="flex items-center gap-2 text-slate-600"><CheckCircle2 size={18} className="text-emerald-500"/> Basic Design</li>
                        <li className="flex items-center gap-2 text-slate-600"><CheckCircle2 size={18} className="text-emerald-500"/> Limited Access</li>
                    </ul>
                    <button onClick={() => setShowLogin(true)} className="w-full py-3 border border-slate-200 rounded-xl font-bold hover:bg-slate-50">Choose Free</button>
                </div>
                {/* Premium */}
                <div className="p-8 rounded-3xl bg-slate-900 text-white relative overflow-hidden">
                    <div className="absolute top-4 right-4 bg-emerald-500 text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">Popular</div>
                    <h3 className="text-lg font-bold mb-2">Premium Plan</h3>
                    <p className="text-3xl font-bold mb-6">₹99 <span className="text-lg font-normal text-slate-400">/ month</span></p>
                    <ul className="space-y-4 mb-8">
                        <li className="flex items-center gap-2 text-slate-300"><CheckCircle2 size={18} className="text-emerald-400"/> Unlimited Invoices</li>
                        <li className="flex items-center gap-2 text-slate-300"><CheckCircle2 size={18} className="text-emerald-400"/> Custom Logo Upload</li>
                        <li className="flex items-center gap-2 text-slate-300"><CheckCircle2 size={18} className="text-emerald-400"/> Expense Tracking</li>
                        <li className="flex items-center gap-2 text-slate-300"><CheckCircle2 size={18} className="text-emerald-400"/> WhatsApp Reminders</li>
                    </ul>
                    <button onClick={() => setShowLogin(true)} className="w-full py-3 bg-emerald-500 text-white rounded-xl font-bold hover:bg-emerald-400">Go Premium</button>
                </div>
            </div>
        </section>
      </main>

      {/* Google Sign-in Login Card Modal */}
      <AnimatePresence>
        {showLogin && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowLogin(false)}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative bg-white w-full max-w-md rounded-3xl shadow-2xl p-8 md:p-10 text-center flex flex-col items-center"
            >
              <button 
                onClick={() => setShowLogin(false)}
                className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 bg-slate-50 hover:bg-slate-100 rounded-full transition-colors"
              >
                <X size={20} />
              </button>

              <div className="w-16 h-16 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-500 mb-6">
                <div className="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center text-white font-bold text-xl">B</div>
              </div>
              
              <h2 className="text-2xl font-bold text-slate-900 mb-2">Sign in to BillMint</h2>
              <p className="text-slate-500 mb-8">Access your dashboard, manage invoices, and track your business growth.</p>
              
              <button 
                onClick={handleGoogleSignIn}
                className="w-full py-4 px-6 bg-white border-2 border-slate-200 hover:border-emerald-500 hover:bg-emerald-50 rounded-2xl font-bold text-slate-700 transition-all flex items-center justify-center gap-3 relative overflow-hidden group"
              >
                <svg viewBox="0 0 24 24" width="24" height="24" xmlns="http://www.w3.org/2000/svg" className="absolute left-6">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
                Continue with Google
              </button>
              
              <p className="text-xs text-slate-400 mt-8">
                By continuing, you agree to our <a href="#" className="underline">Terms of Service</a> and <a href="#" className="underline">Privacy Policy</a>.
              </p>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      
      <footer className="max-w-7xl mx-auto px-6 py-12 border-t border-slate-100 text-center">
        <div className="flex items-center justify-center space-x-2 mb-4">
          <div className="w-6 h-6 bg-emerald-500 rounded flex items-center justify-center text-white font-bold text-xs">B</div>
          <span className="text-lg font-bold tracking-tight">BillMint</span>
        </div>
        <p className="text-slate-400 text-sm">© 2026 BillMint. All rights reserved. The ultimate billing solution for modern businesses.</p>
        <p className="text-slate-300 text-[10px] mt-4 uppercase tracking-[0.2em]">Powered by BillMint Engine</p>
      </footer>
    </div>
  );
};

const AuthenticatedApp = () => {
    const [activeTab, setActiveTab] = useState('dashboard');
    
    const renderContent = () => {
        switch(activeTab) {
            case 'dashboard': return <Dashboard />;
            case 'invoices': return <Invoices />;
            case 'customers': return <Customers />;
            case 'inventory': return <Inventory />;
            case 'expenses': return <Expenses />;
            case 'settings': return <Settings />;
            case 'admin': return <AdminPanel />;
            default: return <Dashboard />;
        }
    };

    return (
        <Layout activeTab={activeTab} setActiveTab={setActiveTab}>
            {renderContent()}
        </Layout>
    );
};

const Root = () => {
  const { user, loading } = useAuth();

  if (loading) return (
    <div className="h-screen w-full flex items-center justify-center bg-white">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500"></div>
    </div>
  );

  return user ? <AuthenticatedApp /> : <LandingPage />;
};

export default function App() {
  return (
    <AuthProvider>
      <SubscriptionProvider>
        <Root />
      </SubscriptionProvider>
    </AuthProvider>
  );
}
