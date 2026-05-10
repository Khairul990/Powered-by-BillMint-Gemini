import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore, doc, getDocFromServer, initializeFirestore } from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

const app = initializeApp(firebaseConfig);

// Initialize Firestore with long polling to bypass potential network restrictions
export const db = initializeFirestore(app, {
  experimentalForceLongPolling: true,
});

export const auth = getAuth(app);

// Connectivity health check
async function testConnection() {
  try {
    // Try to reach the server directly
    const healthDoc = doc(db, '_health', 'check');
    await getDocFromServer(healthDoc);
    console.log('Firebase connection successful.');
  } catch (error: any) {
    // Ignore offline errors in the logs to avoid confusing the user, 
    // as Firestore will automatically retry when connection is restored.
    if (error?.message?.includes('offline') || error?.code === 'unavailable') {
      return;
    }
    
    if (error?.code === 'permission-denied') {
      console.log('Firebase connection successful (server reached, but permissions restricted).');
      return;
    }
    
    console.error('Firebase connection test failed:', error);
  }
}
testConnection();
