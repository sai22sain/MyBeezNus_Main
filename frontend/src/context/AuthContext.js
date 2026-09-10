import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../firebase';
import { getSubscription } from '../utils/subscription';

const AuthContext = createContext();
export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [subscription, setSubscription] = useState({ plan: 'free' });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        setUser(firebaseUser);
        const [profileDoc, sub] = await Promise.all([
          getDoc(doc(db, 'users', firebaseUser.uid, 'profile', 'business')),
          getSubscription(firebaseUser.uid)
        ]);
        setProfile(profileDoc.exists() ? profileDoc.data() : null);
        setSubscription(sub);
      } else {
        setUser(null);
        setProfile(null);
        setSubscription({ plan: 'free' });
      }
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const logout = () => signOut(auth);

  const refreshSubscription = async () => {
    if (user) {
      const sub = await getSubscription(user.uid);
      setSubscription(sub);
    }
  };

  return (
    <AuthContext.Provider value={{ user, profile, setProfile, subscription, refreshSubscription, logout, loading }}>
      {!loading && children}
    </AuthContext.Provider>
  );
}
