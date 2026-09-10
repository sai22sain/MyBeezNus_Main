import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyAQlQSbZXEFahYz4pxk5HJJCEERmKwwyiY",
  authDomain: "mybeeznus.firebaseapp.com",
  projectId: "mybeeznus",
  storageBucket: "mybeeznus.firebasestorage.app",
  messagingSenderId: "396496774102",
  appId: "1:396496774102:web:01dcb46a7d4ef400c13a77"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
export const db = getFirestore(app);
