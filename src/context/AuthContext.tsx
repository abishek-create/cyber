import React, { createContext, useContext, useEffect, useState } from 'react';
import { auth, googleAuthProvider } from '../lib/firebase.ts';
import { signInWithPopup, signOut as fbSignOut, onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';

export interface UserProfile {
  id?: number;
  uid: string;
  email: string;
  fullName: string;
  phone?: string;
  role: 'user' | 'admin' | 'officer';
}

interface AuthContextType {
  user: UserProfile | null;
  firebaseUser: FirebaseUser | null;
  loading: boolean;
  token: string | null;
  signInWithGoogle: () => Promise<void>;
  signInAsDemo: (role?: 'user' | 'admin') => Promise<void>;
  signOut: () => Promise<void>;
  getToken: () => Promise<string | null>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  firebaseUser: null,
  loading: true,
  token: null,
  signInWithGoogle: async () => {},
  signInAsDemo: async () => {},
  signOut: async () => {},
  getToken: async () => null,
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Synchronize authenticated user with backend PostgreSQL
  const syncWithBackend = async (fbUser: FirebaseUser, idToken: string) => {
    try {
      const res = await fetch('/api/auth/sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({
          fullName: fbUser.displayName || fbUser.email?.split('@')[0],
          phone: fbUser.phoneNumber || '',
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
      } else {
        setUser({
          uid: fbUser.uid,
          email: fbUser.email || '',
          fullName: fbUser.displayName || 'Security User',
          role: 'user',
        });
      }
    } catch (err) {
      console.warn('Backend user sync failed, using client session:', err);
      setUser({
        uid: fbUser.uid,
        email: fbUser.email || '',
        fullName: fbUser.displayName || 'Security User',
        role: 'user',
      });
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currUser) => {
      setFirebaseUser(currUser);
      if (currUser) {
        try {
          const idToken = await currUser.getIdToken();
          setToken(idToken);
          await syncWithBackend(currUser, idToken);
        } catch (err) {
          console.error('Error fetching token on auth state change:', err);
        }
      } else {
        setUser(null);
        setToken(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signInWithGoogle = async () => {
    setLoading(true);
    try {
      const result = await signInWithPopup(auth, googleAuthProvider);
      const idToken = await result.user.getIdToken();
      setToken(idToken);
      await syncWithBackend(result.user, idToken);
    } catch (error: any) {
      console.error('Google Sign-In failed:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Quick demonstration sign-in allowing test users and examiners to test both normal user and admin roles
  const signInAsDemo = async (role: 'user' | 'admin' = 'user') => {
    setLoading(true);
    try {
      const mockUid = role === 'admin' ? 'demo-admin-uid-101' : 'demo-user-uid-202';
      const mockProfile: UserProfile = {
        uid: mockUid,
        email: role === 'admin' ? 'officer.cybercell@cybershield.org' : 'citizen.aarav@example.com',
        fullName: role === 'admin' ? 'Duty Officer Inspector V. Sharma' : 'Aarav Mehta (Citizen)',
        phone: '+919811223344',
        role: role,
      };
      setUser(mockProfile);
      setToken('demo-bearer-token');
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    try {
      if (firebaseUser) {
        await fbSignOut(auth);
      }
      setUser(null);
      setFirebaseUser(null);
      setToken(null);
    } catch (err) {
      console.error('Error signing out:', err);
    }
  };

  const getToken = async () => {
    if (firebaseUser) {
      return await firebaseUser.getIdToken();
    }
    return token;
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        firebaseUser,
        loading,
        token,
        signInWithGoogle,
        signInAsDemo,
        signOut,
        getToken,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
