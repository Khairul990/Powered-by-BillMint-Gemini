import React, { createContext, useContext, useEffect, useState } from 'react';
import { useAuth } from './AuthContext';
import { db } from '../lib/firebase';
import { doc, onSnapshot } from 'firebase/firestore';
import { BusinessSettings } from '../types';

interface SubscriptionContextType {
  isPremium: boolean;
  canCreateInvoice: boolean;
  invoiceCount: number;
  settings: BusinessSettings | null;
  loading: boolean;
}

const SubscriptionContext = createContext<SubscriptionContextType | undefined>(undefined);

export const SubscriptionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, profile } = useAuth();
  const [settings, setSettings] = useState<BusinessSettings | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setSettings(null);
      setLoading(false);
      return;
    }

    const unsubscribe = onSnapshot(doc(db, 'settings', user.uid), (doc) => {
      if (doc.exists()) {
        setSettings(doc.data() as BusinessSettings);
      } else {
        setSettings({
          userId: user.uid,
          businessName: 'My Business',
          logoUrl: null,
          brandColor: '#10b981',
          invoiceStyle: 'Modern',
        });
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  const isPremium = profile?.isPremium || false;
  const invoiceCount = profile?.invoiceCount || 0;
  const canCreateInvoice = isPremium || invoiceCount < 5;

  return (
    <SubscriptionContext.Provider value={{ isPremium, canCreateInvoice, invoiceCount, settings, loading }}>
      {children}
    </SubscriptionContext.Provider>
  );
};

export const useSubscription = () => {
  const context = useContext(SubscriptionContext);
  if (!context) throw new Error('useSubscription must be used within SubscriptionProvider');
  return context;
};
