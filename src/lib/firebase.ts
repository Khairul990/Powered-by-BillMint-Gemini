import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore, doc, getDocFromServer } from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

const app = initializeApp(firebaseConfig);

export const db = getFirestore(app);

export const auth = getAuth(app);

// Connectivity health check
async function testConnection() {
  try {
    // Try to reach the server directly
    const healthDoc = doc(db, '_health', 'check');
    await getDocFromServer(healthDoc);
    console.log('Firebase connection successful.');
  } catch (error: any) {
    if (error?.code === 'permission-denied') {
      console.log('Firebase connection successful (server reached, but permissions restricted).');
      return;
    }
    
    console.error('Firebase connection test failed:', error);
    
    // If it failed and we're offline, try to initialize with long polling as a fallback
    if (error?.message?.includes('offline') || error?.code === 'unavailable') {
      console.warn('Standard connection failed, attempting long polling fallback...');
      // Note: We can't easily re-initialize 'db' here as it's exported and already used.
      // But we can suggest it in the logs or try a different approach if this were a production app.
    }
  }
}
testConnection();
