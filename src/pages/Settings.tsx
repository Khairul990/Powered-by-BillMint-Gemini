import React, { useState, useRef } from 'react';
import { 
  Building2, 
  Palette, 
  Layout, 
  Upload, 
  Crown, 
  Check, 
  Lock,
  ArrowRight,
  ExternalLink,
  MapPin,
  Phone,
  Mail,
  Trash2
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useSubscription } from '../context/SubscriptionContext';
import { firestoreService } from '../services/firestoreService';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import { AppTheme } from '../types';

const Settings = () => {
  const { user, profile } = useAuth();
  const { isPremium, settings } = useSubscription();
  const [isSaving, setIsSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [businessName, setBusinessName] = useState(settings?.businessName || '');
  const [businessPhone, setBusinessPhone] = useState(settings?.businessPhone || '');
  const [businessEmail, setBusinessEmail] = useState(settings?.businessEmail || '');
  const [businessAddress, setBusinessAddress] = useState(settings?.businessAddress || '');
  const [brandColor, setBrandColor] = useState(settings?.brandColor || '#10b981');
  const [invoiceStyle, setInvoiceStyle] = useState<AppTheme | 'Modern' | 'Classic' | 'Minimum'>(settings?.invoiceStyle || 'Modern');
  const [logoUrl, setLogoUrl] = useState(settings?.logoUrl || '');

  const handleSave = async () => {
    if (!user) return;
    setIsSaving(true);
    try {
      await firestoreService.setDocument('settings', user.uid, {
        userId: user.uid,
        businessName,
        businessPhone,
        businessEmail,
        businessAddress,
        brandColor,
        invoiceStyle,
        logoUrl: isPremium ? logoUrl : null
      });
      alert('Settings saved successfully!');
    } catch (e) {
      console.error(e);
      alert('Failed to save settings.');
    } finally {
      setIsSaving(false);
    }
  };

  const simulateUpgrade = async () => {
    if (!user) return;
    try {
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, { isPremium: true });
      alert('Upgrade successful! You are now a Premium member.');
      window.location.reload();
    } catch (e) {
      alert('Upgrade failed.');
    }
  };
  
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (!isPremium) return;
      const file = e.target.files?.[0];
      if (!file) return;
      
      if (file.size > 500 * 1024) {
          alert('File is too big. Max size for logos is 500KB.');
          return;
      }
      
      const reader = new FileReader();
      reader.onloadend = () => {
         setLogoUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
  };
  
  const removeLogo = () => setLogoUrl('');

  return (
    <div className="space-y-8 pb-32">
      <div>
        <h1 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight mb-2">Business Settings.</h1>
        <p className="text-slate-500 font-medium max-w-2xl">Customize your brand identity, manage your business details, and configure your premium invoice preferences.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Main Settings */}
        <div className="lg:col-span-8 space-y-8">
          {/* Brand Identity & Contact Input */}
          <section className="bg-white p-8 md:p-12 rounded-[2.5rem] border border-slate-200/60 shadow-sm space-y-10 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-slate-50 rounded-full blur-3xl -mr-32 -mt-32 pointer-events-none" />
            
            <div className="flex justify-between items-start relative z-10">
                <div className="flex gap-4">
                  <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-[1.25rem] flex items-center justify-center shrink-0">
                    <Building2 size={24} />
                  </div>
                  <div>
                      <h3 className="text-xl font-black text-slate-900">Brand Identity</h3>
                      <p className="text-sm font-semibold text-slate-500">Your core business information.</p>
                  </div>
                </div>
            </div>

            <div className="space-y-6 relative z-10">
              <div className="space-y-2">
                <label className="text-xs font-black text-slate-400 uppercase tracking-widest pl-2">Business Name</label>
                <input 
                  type="text" 
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                  placeholder="e.g. Acme Corp"
                  className="w-full px-6 py-4 bg-slate-50/50 border border-slate-200/60 rounded-2xl focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all font-bold text-slate-800"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-xs font-black text-slate-400 uppercase tracking-widest pl-2">Phone Number</label>
                    <div className="relative">
                        <Phone size={18} className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input 
                          type="text" 
                          value={businessPhone}
                          onChange={(e) => setBusinessPhone(e.target.value)}
                          placeholder="+1 234 567 890"
                          className="w-full pl-12 pr-6 py-4 bg-slate-50/50 border border-slate-200/60 rounded-2xl focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all font-bold text-slate-800"
                        />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-black text-slate-400 uppercase tracking-widest pl-2">Email Address</label>
                    <div className="relative">
                        <Mail size={18} className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input 
                          type="email" 
                          value={businessEmail}
                          onChange={(e) => setBusinessEmail(e.target.value)}
                          placeholder="billing@acmecorp.com"
                          className="w-full pl-12 pr-6 py-4 bg-slate-50/50 border border-slate-200/60 rounded-2xl focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all font-bold text-slate-800"
                        />
                    </div>
                  </div>
              </div>
              
              <div className="space-y-2">
                <label className="text-xs font-black text-slate-400 uppercase tracking-widest pl-2">Business Address</label>
                <div className="relative">
                    <MapPin size={18} className="absolute left-5 top-5 text-slate-400" />
                    <textarea 
                      value={businessAddress}
                      onChange={(e) => setBusinessAddress(e.target.value)}
                      placeholder="123 Commerce St, Suite 100&#10;City, State, Zip"
                      rows={3}
                      className="w-full pl-12 pr-6 py-4 bg-slate-50/50 border border-slate-200/60 rounded-2xl focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all font-bold text-slate-800 resize-none"
                    />
                </div>
              </div>

              <div className="space-y-3 pt-6 border-t border-slate-100">
                <div className="flex items-center justify-between">
                    <label className="text-sm font-black text-slate-800 flex items-center gap-2">
                      Custom Business Logo
                      {!isPremium && <span className="px-2.5 py-1 bg-amber-100 text-amber-700 text-[10px] font-black uppercase tracking-widest rounded-full">Premium Feature</span>}
                    </label>
                    {isPremium && logoUrl && (
                        <button onClick={removeLogo} className="text-xs font-bold text-rose-500 hover:text-rose-600 flex items-center gap-1"><Trash2 size={14}/> Remove Logo</button>
                    )}
                </div>
                
                <div className="relative group">
                  {!isPremium && (
                    <div className="absolute inset-0 bg-slate-100/50 backdrop-blur-[2px] z-10 flex flex-col items-center justify-center rounded-[2rem] border border-slate-200/80">
                       <Lock size={24} className="text-slate-400 mb-2" />
                       <span className="text-sm font-black text-slate-500">Upgrade to unlock custom logo</span>
                    </div>
                  )}
                  <input 
                     type="file" 
                     ref={fileInputRef} 
                     onChange={handleFileUpload} 
                     accept="image/png, image/jpeg" 
                     className="hidden" 
                  />
                  <div 
                     onClick={() => isPremium && fileInputRef.current?.click()}
                     className={cn(
                        "flex flex-col sm:flex-row items-center gap-6 p-8 border-2 border-dashed rounded-[2rem] transition-all",
                        isPremium ? "border-slate-200 hover:border-emerald-500 hover:bg-emerald-50/30 cursor-pointer" : "border-slate-200/60"
                     )}
                  >
                    <div className="w-24 h-24 bg-white rounded-2xl shadow-sm flex items-center justify-center text-slate-300 border border-slate-100 overflow-hidden shrink-0">
                      {logoUrl ? <img src={logoUrl} className="w-full h-full object-contain p-2" /> : <Upload size={32} />}
                    </div>
                    <div className="flex-1 text-center sm:text-left">
                      <p className="text-base font-black text-slate-800 mb-1">Upload high-res SVG, PNG or JPG</p>
                      <p className="text-sm font-medium text-slate-500 mb-4">Max size 500KB. A square or horizontal ratio (e.g. 500x500) works best on PDF renders.</p>
                      <button 
                         className={cn("px-6 py-2.5 bg-white border border-slate-200/80 text-sm font-bold rounded-xl transition-colors shadow-sm", isPremium ? "text-slate-700 hover:bg-slate-50" : "text-slate-400 pointer-events-none")}
                         tabIndex={-1}
                      >
                        Browse Files
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Visual Style */}
          <section className="bg-white p-8 md:p-12 rounded-[2.5rem] border border-slate-200/60 shadow-sm space-y-10 relative overflow-hidden">
            <div className="flex gap-4 relative z-10">
               <div className="w-12 h-12 bg-fuchsia-50 text-fuchsia-600 rounded-[1.25rem] flex items-center justify-center shrink-0">
                  <Palette size={24} />
               </div>
               <div>
                  <h3 className="text-xl font-black text-slate-900">Visual Preferences</h3>
                  <p className="text-sm font-semibold text-slate-500">Configure how your invoices look to clients.</p>
               </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-10 relative z-10">
              <div className="space-y-4">
                <label className="text-xs font-black text-slate-400 uppercase tracking-widest pl-2">Brand Accent Color</label>
                <div className="flex flex-wrap gap-4">
                  {['#10b981', '#3b82f6', '#8b5cf6', '#ec4899', '#f43f5e', '#f59e0b', '#0f172a', '#64748b'].map(c => (
                    <button 
                      key={c}
                      onClick={() => setBrandColor(c)}
                      className={cn(
                        "w-12 h-12 rounded-[1rem] border-4 transition-all flex items-center justify-center",
                        brandColor === c ? "border-slate-200 scale-110 shadow-lg" : "border-transparent hover:scale-105"
                      )}
                      style={{ backgroundColor: c }}
                      title={c}
                    >
                        {brandColor === c && <Check size={18} className="text-white drop-shadow-md" />}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-4">
                <label className="text-xs font-black text-slate-400 uppercase tracking-widest pl-2 flex items-center gap-2">
                    Advanced Theme
                    {!isPremium && <span className="px-2 py-0.5 bg-amber-100 text-amber-700 text-[8px] font-black uppercase tracking-widest rounded-full">Premium</span>}
                </label>
                <div className="space-y-3">
                   {(['Modern', 'Modern Blue SaaS', 'Classic Business', 'Luxury Gold', 'Dark Premium'] as const).map((style) => (
                      <button
                         key={style}
                         disabled={!isPremium && style !== 'Modern'}
                         onClick={() => setInvoiceStyle(style)}
                         className={cn(
                             "w-full px-5 py-4 border rounded-[1.5rem] text-left transition-all flex items-center justify-between group",
                             invoiceStyle === style ? "bg-slate-900 border-slate-900 text-white" : "bg-slate-50 border-slate-200/60 hover:border-slate-300",
                             !isPremium && style !== 'Modern' && "opacity-50 cursor-not-allowed hidden md:flex"
                         )}
                      >
                          <span className="font-black tracking-tight">{style}</span>
                          {invoiceStyle === style && <Check size={18} className="text-emerald-400" />}
                          {!isPremium && style !== 'Modern' && <Lock size={16} className="text-slate-400 hidden group-hover:block" />}
                      </button>
                   ))}
                </div>
              </div>
            </div>
            
            <div className="p-6 bg-slate-50 rounded-[1.5rem] border border-slate-100 flex items-start gap-4">
               <div className="p-2 bg-slate-200 rounded-full shrink-0"><Check size={16} className="text-slate-500" /></div>
               <p className="text-sm font-medium text-slate-600 leading-relaxed">
                   When you save these settings, all <strong>newly generated</strong> PDFs and view links will reflect this branding. Previously exported PDFs will remain unchanged.
               </p>
            </div>
          </section>

          <div className="flex justify-end pt-4 pb-12">
            <button 
              onClick={handleSave}
              disabled={isSaving}
              className="px-12 py-5 bg-slate-900 text-white font-black text-lg tracking-tight rounded-[2rem] shadow-xl shadow-slate-900/20 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50 disabled:hover:scale-100"
            >
              {isSaving ? 'Saving Changes...' : 'Save All Preferences'}
            </button>
          </div>
        </div>

        {/* Subscription Info */}
        <div className="lg:col-span-4 space-y-6">
          <div className={cn(
            "p-8 md:p-10 rounded-[2.5rem] border shadow-xl relative overflow-hidden transition-all duration-500",
            isPremium ? "bg-slate-900 border-slate-800 text-white shadow-slate-900/20" : "bg-gradient-to-b from-emerald-500 to-emerald-600 border-emerald-400 text-white shadow-emerald-500/20"
          )}>
            {/* Background decors */}
            {isPremium ? (
              <div className="absolute -top-12 -right-12 w-48 h-48 bg-emerald-500/30 rounded-full blur-[3rem] pointer-events-none" />
            ) : (
               <div className="absolute -right-20 -bottom-20 w-64 h-64 bg-white/10 rounded-full blur-2xl pointer-events-none" />
            )}
            
            <div className="relative z-10">
              <div className={cn(
                "w-16 h-16 rounded-[1.5rem] flex items-center justify-center mb-6 shadow-sm",
                isPremium ? "bg-emerald-500 text-white" : "bg-white text-emerald-600"
              )}>
                <Crown size={32} />
              </div>
              
              <h3 className="text-3xl font-black mb-3 tracking-tight">
                 {isPremium ? 'Premium Active' : 'Upgrade to PRO'}
              </h3>
              
              {!isPremium ? (
                <>
                  <p className="text-emerald-50 font-medium text-sm mb-8 leading-relaxed">Stop looking like a startup. Give your clients the premium invoicing experience they expect.</p>
                  
                  <div className="space-y-4 mb-10 bg-black/10 p-6 rounded-[2rem] backdrop-blur-sm border border-white/10">
                    {[
                       'Unlimited Invoices / Month', 
                       'Custom Business Logo', 
                       'Send WhatsApp Reminders', 
                       'Advanced PDF Themes',
                       'Remove "BillMint" Watermark'
                    ].map(f => (
                      <div key={f} className="flex items-center gap-3 text-sm font-bold text-white">
                        <Check size={18} className="text-emerald-200 shrink-0" /> {f}
                      </div>
                    ))}
                  </div>
                  
                  <button 
                    onClick={simulateUpgrade}
                    className="w-full py-5 bg-white text-emerald-600 font-black tracking-tight rounded-[1.5rem] hover:bg-slate-50 flex items-center justify-center gap-2 shadow-xl hover:scale-[1.02] active:scale-95 transition-all text-lg"
                  >
                    Upgrade for ₹99/mo <ArrowRight size={20} />
                  </button>
                  <p className="text-center text-[10px] font-black uppercase tracking-widest text-emerald-200 mt-4">Cancel anytime. No hidden fees.</p>
                </>
              ) : (
                <>
                  <p className="text-slate-400 font-medium text-sm mb-8 leading-relaxed">
                     You have unrestricted access to all premium platform features. Your branding watermark is hidden.
                  </p>
                  
                  <div className="p-6 bg-white/5 rounded-[2rem] border border-white/10 space-y-2 backdrop-blur-sm">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Next Billing Cycle</p>
                    <p className="text-2xl font-black tracking-tight text-white mb-2">May 15, 2026</p>
                    <div className="w-full bg-white/10 h-2 rounded-full mt-4 overflow-hidden">
                       <div className="bg-emerald-500 w-2/3 h-full rounded-full" />
                    </div>
                    <p className="text-xs text-slate-500 font-bold mt-2 text-right">24 days remaining</p>
                  </div>
                  
                  <button className="w-full mt-8 py-4 border-2 border-white/10 rounded-[1.5rem] text-sm font-black text-slate-300 hover:bg-white/5 hover:text-white transition-colors flex items-center justify-center gap-3">
                     Manage Subscription <ExternalLink size={16} />
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
