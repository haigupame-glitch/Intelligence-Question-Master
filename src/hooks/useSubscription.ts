import { useState, useEffect } from 'react';
import { auth, db } from '../lib/firebase';
import { doc, getDoc, setDoc, onSnapshot } from 'firebase/firestore';
import { handleFirestoreError, OperationType } from '../lib/firebase';

export interface UserSubscription {
  plan: 'free' | 'premium';
  generationsCount: number;
  downloadsCount: number;
  subscriptionType?: 'monthly' | 'annual';
  role?: 'teacher' | 'student';
}

const DEFAULT_SUBSCRIPTION: UserSubscription = {
  plan: 'free',
  generationsCount: 0,
  downloadsCount: 0,
};

export const FREE_TIER_LIMITS = {
  generations: 3,
  downloads: 5,
};

export function useSubscription() {
  const [subscription, setSubscription] = useState<UserSubscription>(DEFAULT_SUBSCRIPTION);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let unsubscribeDoc: (() => void) | undefined;

    const unsubscribeAuth = auth.onAuthStateChanged((currentUser) => {
      if (!currentUser) {
        setSubscription(DEFAULT_SUBSCRIPTION);
        setLoading(false);
        if (unsubscribeDoc) unsubscribeDoc();
        return;
      }

      const docRef = doc(db, 'users', currentUser.uid);
      
      const initSubscription = async () => {
        try {
          const docSnap = await getDoc(docRef);
          if (!docSnap.exists()) {
            await setDoc(docRef, DEFAULT_SUBSCRIPTION, { merge: true });
            setSubscription(DEFAULT_SUBSCRIPTION);
          }
        } catch (err) {
          handleFirestoreError(err, OperationType.GET, `users/${currentUser.uid}`);
        }
      };
      
      initSubscription();

      unsubscribeDoc = onSnapshot(docRef, (docSnap) => {
        if (docSnap.exists()) {
          setSubscription(docSnap.data() as UserSubscription);
        }
        setLoading(false);
      }, (err) => {
        handleFirestoreError(err, OperationType.GET, `users/${currentUser.uid}`);
      });
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeDoc) unsubscribeDoc();
    };
  }, []);

  const setRole = async (role: 'teacher' | 'student') => {
    if (!auth.currentUser) return;
    try {
      const docRef = doc(db, 'users', auth.currentUser.uid);
      await setDoc(docRef, { role }, { merge: true });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `users/${auth.currentUser.uid}`);
    }
  };

  const upgradeToPremium = async (type: 'monthly' | 'annual') => {
    if (!auth.currentUser) return;
    try {
      const docRef = doc(db, 'users', auth.currentUser.uid);
      await setDoc(docRef, {
        plan: 'premium',
        subscriptionType: type,
        generationsCount: subscription.generationsCount,
        downloadsCount: subscription.downloadsCount,
      }, { merge: true });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `users/${auth.currentUser.uid}`);
    }
  };

  const incrementGeneration = async () => {
    if (!auth.currentUser) return;
    try {
      const docRef = doc(db, 'users', auth.currentUser.uid);
      await setDoc(docRef, {
        generationsCount: subscription.generationsCount + 1,
      }, { merge: true });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `users/${auth.currentUser.uid}`);
    }
  };

  const incrementDownload = async () => {
    if (!auth.currentUser) return;
    try {
      const docRef = doc(db, 'users', auth.currentUser.uid);
      await setDoc(docRef, {
        downloadsCount: subscription.downloadsCount + 1,
      }, { merge: true });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `users/${auth.currentUser.uid}`);
    }
  };

  const canGenerate = subscription.plan === 'premium' || subscription.generationsCount < FREE_TIER_LIMITS.generations;
  const canDownload = subscription.plan === 'premium' || subscription.downloadsCount < FREE_TIER_LIMITS.downloads;

  return {
    subscription,
    loading,
    setRole,
    upgradeToPremium,
    incrementGeneration,
    incrementDownload,
    canGenerate,
    canDownload,
    generationsLeft: Math.max(0, FREE_TIER_LIMITS.generations - subscription.generationsCount),
    downloadsLeft: Math.max(0, FREE_TIER_LIMITS.downloads - subscription.downloadsCount),
  };
}
