import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  User as FirebaseUser, 
  onAuthStateChanged, 
  signInWithPopup, 
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  updateProfile
} from 'firebase/auth';
import { auth, googleProvider, getUserProfileDoc, saveUserProfileDoc } from '../lib/firebase';
import { UserProfile, UserRole } from '../types';

interface AuthContextType {
  firebaseUser: FirebaseUser | null;
  userProfile: UserProfile | null;
  isLoading: boolean;
  loginWithGoogle: () => Promise<void>;
  loginWithEmail: (email: string, pass: string) => Promise<void>;
  registerWithEmail: (email: string, pass: string, name: string, role: UserRole) => Promise<void>;
  logout: () => Promise<void>;
  updateRole: (newRole: UserRole) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setFirebaseUser(user);
      if (user) {
        // Fetch or create Firestore user profile
        let profile = await getUserProfileDoc(user.uid);
        if (!profile) {
          profile = {
            uid: user.uid,
            displayName: user.displayName || user.email?.split('@')[0] || 'ChemLab User',
            email: user.email || '',
            photoURL: user.photoURL || undefined,
            role: 'Administrator', // Default assigned role
            department: 'ChemLab Operations',
            lastLoginAt: new Date().toISOString(),
            createdAt: new Date().toISOString()
          };
          await saveUserProfileDoc(profile);
        } else {
          // Update last login timestamp
          profile.lastLoginAt = new Date().toISOString();
          saveUserProfileDoc(profile).catch(() => {});
        }
        setUserProfile(profile);
      } else {
        setUserProfile(null);
      }
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const loginWithGoogle = async () => {
    setIsLoading(true);
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error) {
      console.error('Google Auth Failed:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const loginWithEmail = async (email: string, pass: string) => {
    setIsLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, pass);
    } catch (error) {
      console.error('Email Auth Failed:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const registerWithEmail = async (email: string, pass: string, name: string, role: UserRole) => {
    setIsLoading(true);
    try {
      const res = await createUserWithEmailAndPassword(auth, email, pass);
      if (res.user) {
        await updateProfile(res.user, { displayName: name });
        const newProfile: UserProfile = {
          uid: res.user.uid,
          displayName: name,
          email: email,
          role: role,
          department: role === 'Administrator' ? 'Management' : role.includes('Sales') ? 'Sales' : 'Lab Operations',
          lastLoginAt: new Date().toISOString(),
          createdAt: new Date().toISOString()
        };
        await saveUserProfileDoc(newProfile);
        setUserProfile(newProfile);
      }
    } catch (error) {
      console.error('Registration Failed:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    setIsLoading(true);
    try {
      if (firebaseUser) {
        await signOut(auth);
      }
      setUserProfile(null);
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const updateRole = async (newRole: UserRole) => {
    if (!userProfile) return;
    const updated: UserProfile = {
      ...userProfile,
      role: newRole
    };
    setUserProfile(updated);
    if (firebaseUser) {
      await saveUserProfileDoc(updated);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        firebaseUser,
        userProfile,
        isLoading,
        loginWithGoogle,
        loginWithEmail,
        registerWithEmail,
        logout,
        updateRole
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
