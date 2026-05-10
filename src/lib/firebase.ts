import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore, doc, getDocFromServer, initializeFirestore, persistentLocalCache, persistentMultipleTabManager } from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

const app = initializeApp(firebaseConfig);

// Initialize Firestore with long polling to bypass potential network restrictions (SSE/WebSockets)
export const db = initializeFirestore(app, {
  experimentalForceLongPolling: true,
}, firebaseConfig.firestoreDatabaseId);

export const auth = getAuth(app);

// Connectivity health check
async function testConnection() {
  try {
    // Try to reach the server directly
    await getDocFromServer(doc(db, '_health', 'check'));
    console.log('Firebase connection successful.');
  } catch (error: any) {
    if (error?.code === 'permission-denied') {
      console.log('Firebase connection successful (server reached, but permissions restricted).');
      return;
    }
    console.error('Firebase connection test failed:', error);
    if (error instanceof Error && (error.message.includes('offline') || error.code === 'unavailable')) {
      console.warn('Firebase is operating in offline mode. This might be due to configuration or network restrictions.');
    }
  }
}
testConnection();
