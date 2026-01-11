"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';

interface User {
  id: string;
  email: string;
  name?: string;
  plan?: 'free' | 'developer' | 'team' | 'enterprise';
}

interface UserContextType {
  user: User | null;
  isLoading: boolean;
  isFirstTime: boolean;
  setUser: (user: User | null) => void;
  signOut: () => void;
  completeOnboarding: () => void;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [user, setUserState] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isFirstTime, setIsFirstTime] = useState(false);

  useEffect(() => {
    // Check for existing user session
    const token = localStorage.getItem('beastModeToken');
    const storedUser = localStorage.getItem('beastModeUser');
    
    if (token && storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        // Validate user data structure
        if (parsedUser && parsedUser.id && parsedUser.email) {
          setUserState(parsedUser);
        } else {
          // Invalid user data, clear it
          localStorage.removeItem('beastModeUser');
          localStorage.removeItem('beastModeToken');
        }
      } catch (e) {
        // Invalid stored user, clear it
        localStorage.removeItem('beastModeUser');
        localStorage.removeItem('beastModeToken');
      }
    }

    // Also check Supabase session as fallback
    // This ensures compatibility with both JWT and Supabase auth
    const checkSupabaseSession = async () => {
      try {
        const { createClient } = await import('@supabase/supabase-js');
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
        
        if (supabaseUrl && supabaseKey) {
          const supabase = createClient(supabaseUrl, supabaseKey);
          const { data: { session } } = await supabase.auth.getSession();
          
          if (session && session.user && !user) {
            // Supabase session exists but user context doesn't - sync it
            setUserState({
              id: session.user.id,
              email: session.user.email || '',
              name: session.user.user_metadata?.name,
              plan: session.user.user_metadata?.plan || 'free'
            });
          }
        }
      } catch (error) {
        // Supabase check failed, continue with localStorage user
        console.error('Supabase session check failed:', error);
      }
    };

    // Check if this is first time user
    const hasCompletedOnboarding = localStorage.getItem('beastModeOnboardingCompleted');
    const hasVisitedBefore = localStorage.getItem('beastModeHasVisited');
    
    if (!hasVisitedBefore) {
      setIsFirstTime(true);
      localStorage.setItem('beastModeHasVisited', 'true');
    } else if (!hasCompletedOnboarding) {
      setIsFirstTime(true);
    }

    // Check Supabase session if no localStorage user
    if (!token || !storedUser) {
      checkSupabaseSession();
    }

    setIsLoading(false);
  }, []);

  const setUser = (newUser: User | null) => {
    setUserState(newUser);
    if (newUser) {
      localStorage.setItem('beastModeUser', JSON.stringify(newUser));
    } else {
      localStorage.removeItem('beastModeUser');
      localStorage.removeItem('beastModeToken');
    }
  };

  const signOut = () => {
    setUserState(null);
    localStorage.removeItem('beastModeUser');
    localStorage.removeItem('beastModeToken');
  };

  const completeOnboarding = () => {
    setIsFirstTime(false);
    localStorage.setItem('beastModeOnboardingCompleted', 'true');
  };

  return (
    <UserContext.Provider
      value={{
        user,
        isLoading,
        isFirstTime,
        setUser,
        signOut,
        completeOnboarding
      }}
    >
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
}

