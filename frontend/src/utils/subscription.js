import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../firebase';

export const FREE_LIMITS = { bills: 30, customers: 50 };

export const getSubscription = async (uid) => {
  const snap = await getDoc(doc(db, 'users', uid, 'profile', 'subscription'));
  if (!snap.exists()) return { plan: 'free' };
  const data = snap.data();
  // Check if subscription expired
  if (data.expiresAt && new Date(data.expiresAt) < new Date()) {
    return { plan: 'free' };
  }
  return data;
};

export const saveSubscription = async (uid, subscriptionData) => {
  await setDoc(doc(db, 'users', uid, 'profile', 'subscription'), subscriptionData);
};

export const isPro = (subscription) => subscription?.plan === 'pro';
