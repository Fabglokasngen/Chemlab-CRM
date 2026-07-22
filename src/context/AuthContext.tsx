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
  isDemoMode: boolean;
  loginWithGoogle: () => Promise<void>;
  loginWithEmail: (email: string, pass: string) => Promise<void>;
  registerWithEmail: (email: string, pass: string, name: string, role: UserRole) => Promise<void>;
  switchDemoUser: (role: UserRole, customName?: string, customEmail?: string) => void;
  logout: () => Promise<void>;
  updateRole: (newRole: UserRole) => Promise<void>;
}

export const ALLOWED_DOMAIN = '@labindonesia.co.id';

export const DEMO_USERS: Record<UserRole, UserProfile> = {
  'Administrator': {
    uid: 'demo-admin-01',
    displayName: 'Fabian Lawson',
    email: 'fabian@labindonesia.co.id',
    role: 'Administrator',
    department: 'Executive Management',
    phoneNumber: '0812-8888-9999',
    photoURL: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200',
    lastLoginAt: new Date().toISOString()
  },
  'Manager Sales': {
    uid: 'demo-mgr-02',
    displayName: 'Budi Santoso',
    email: 'budi.santoso@labindonesia.co.id',
    role: 'Manager Sales',
    department: 'Sales & Business Development',
    phoneNumber: '0812-3456-7890',
    photoURL: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=200',
    lastLoginAt: new Date().toISOString()
  },
  'Sales Executive': {
    uid: 'demo-sales-03',
    displayName: 'Siti Rahma',
    email: 'siti.rahma@labindonesia.co.id',
    role: 'Sales Executive',
    department: 'Sales & Field Account Exec',
    phoneNumber: '0813-9988-7766',
    photoURL: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=200',
    lastLoginAt: new Date().toISOString()
  },
  'Laboratorium Tech': {
    uid: 'demo-lab-04',
    displayName: 'Dr. Aris Setiawan',
    email: 'aris.tech@labindonesia.co.id',
    role: 'Laboratorium Tech',
    department: 'Quality Assurance & Lab Analysis',
    phoneNumber: '0811-2233-4455',
    photoURL: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&q=80&w=200',
    lastLoginAt: new Date().toISOString()
  }
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(() => {
    // Check local storage for persistent demo state if disconnected
    const savedDemo = localStorage.getItem('chemlab_demo_user');
    if (savedDemo) {
      try {
        return JSON.parse(savedDemo);
      } catch (e) {
        return DEMO_USERS['Administrator'];
      }
    }
    return DEMO_USERS['Administrator'];
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isDemoMode, setIsDemoMode] = useState<boolean>(() => {
    return localStorage.getItem('chemlab_auth_mode') !== 'firebase';
  });

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setFirebaseUser(user);
      if (user) {
        setIsDemoMode(false);
        localStorage.setItem('chemlab_auth_mode', 'firebase');
        // Fetch or create Firestore user profile
        let profile = await getUserProfileDoc(user.uid);
        if (!profile) {
          profile = {
            uid: user.uid,
            displayName: user.displayName || user.email?.split('@')[0] || 'Pengguna ChemLab',
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
      } else if (!isDemoMode) {
        // Fallback to active demo user
        const activeDemoRole = (userProfile?.role || 'Administrator') as UserRole;
        setUserProfile(DEMO_USERS[activeDemoRole] || DEMO_USERS['Administrator']);
      }
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [isDemoMode]);

  const loginWithGoogle = async () => {
    setIsLoading(true);
    try {
      await signInWithPopup(auth, googleProvider);
      setIsDemoMode(false);
      localStorage.setItem('chemlab_auth_mode', 'firebase');
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
      setIsDemoMode(false);
      localStorage.setItem('chemlab_auth_mode', 'firebase');
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
        setIsDemoMode(false);
        localStorage.setItem('chemlab_auth_mode', 'firebase');
      }
    } catch (error) {
      console.error('Registration Failed:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const switchDemoUser = (role: UserRole, customName?: string, customEmail?: string) => {
    setIsDemoMode(true);
    localStorage.setItem('chemlab_auth_mode', 'demo');
    const base = DEMO_USERS[role] || DEMO_USERS['Administrator'];
    const updated: UserProfile = {
      ...base,
      displayName: customName || base.displayName,
      email: customEmail || base.email,
      lastLoginAt: new Date().toISOString()
    };
    setUserProfile(updated);
    localStorage.setItem('chemlab_demo_user', JSON.stringify(updated));
  };

  const logout = async () => {
    setIsLoading(true);
    try {
      if (firebaseUser) {
        await signOut(auth);
      }
      setIsDemoMode(true);
      localStorage.setItem('chemlab_auth_mode', 'demo');
      setUserProfile(DEMO_USERS['Administrator']);
      localStorage.setItem('chemlab_demo_user', JSON.stringify(DEMO_USERS['Administrator']));
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
    if (!isDemoMode && firebaseUser) {
      await saveUserProfileDoc(updated);
    } else {
      localStorage.setItem('chemlab_demo_user', JSON.stringify(updated));
    }
  };

  return (
    <AuthContext.Provider
      value={{
        firebaseUser,
        userProfile,
        isLoading,
        isDemoMode,
        loginWithGoogle,
        loginWithEmail,
        registerWithEmail,
        switchDemoUser,
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
