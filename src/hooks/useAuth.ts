import { useState } from 'react';
import { auth, db } from '../lib/firebase';
import { doc, setDoc } from 'firebase/firestore';
import { signInAnonymously, signOut } from 'firebase/auth';

export const useAuth = () => {
  const [user, setUser] = useState<any>(null);
  const [step, setStep] = useState<'phone' | 'otp' | 'authenticated'>('phone');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Clear data and enter as a fresh test profile
  const loginAsTestUser = async (phoneNumber: string) => {
    setLoading(true);
    setError(null);
    try {
      // 1. Wipe previous local storage states to clear stale app data
      localStorage.clear();
      
      // We use Anonymous Auth to get a valid Firebase token to pass Firestore Rules.
      // The user requested a specific uid format, but Firestore Rules mandate
      // `request.auth.uid == userId`, so we must use the valid auth uid.
      const cred = await signInAnonymously(auth);
      const testUid = cred.user.uid;
      
      // 2. Clear user-specific Firestore data if resetting a previous test run
      const userDocRef = doc(db, 'users', testUid);
      await setDoc(userDocRef, {
        uid: testUid,
        phoneNumber: phoneNumber,
        plan: 'free',
        generationsCount: 0,
        downloadsCount: 0,
        createdAt: new Date().toISOString()
      }, { merge: true });

      // 3. Establish the active session state
      setUser({
        uid: testUid,
        phoneNumber: phoneNumber, // simulate phone
        plan: 'free',
        usage: { generationsCount: 0, downloadsCount: 0 }
      });
      
      setStep('authenticated');
    } catch (err: any) {
      setError(err.message || 'Failed to initialize test session.');
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    localStorage.clear();
    await signOut(auth);
    setUser(null);
    setStep('phone');
  };

  return { user, step, setStep, loginAsTestUser, logout, loading, error };
};
