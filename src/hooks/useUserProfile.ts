import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/lib/apiClient';

export type UserRole = 'Student' | 'Professor' | 'Librarian' | 'Canteen Staff' | 'Admin';

export interface UserProfile {
    id: string;
    email: string | null;
    full_name: string | null;
    avatar_url: string | null;
    role: UserRole;
    reward_points: number;
    wallet_balance?: number;
    created_at: string;
    updated_at: string;
}

function mapRoleToFrontend(role: string): UserRole {
  switch (role) {
    case 'STUDENT': return 'Student';
    case 'PROFESSOR': return 'Professor';
    case 'LIBRARIAN': return 'Librarian';
    case 'CANTEEN_STAFF': return 'Canteen Staff';
    case 'ADMIN': return 'Admin';
    default: return 'Student';
  }
}

function profileFromAuth(user: { id: string; email: string; full_name: string; role: UserRole; avatar_url?: string }): UserProfile {
  return {
    id: user.id,
    email: user.email,
    full_name: user.full_name,
    avatar_url: user.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200',
    role: user.role,
    reward_points: 0,
    wallet_balance: 0,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
}

export const useUserProfile = () => {
    const { user, isLoading: isAuthLoading } = useAuth();
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    useEffect(() => {
        const syncProfile = async () => {
            if (isAuthLoading) return;

            if (!user) {
                setProfile(null);
                setIsLoading(false);
                return;
            }

            try {
                setIsLoading(true);

                const response: any = await api.get('/profiles/me');

                const userProfile: UserProfile = {
                    id: response.id,
                    email: response.email,
                    full_name: response.fullName,
                    avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200',
                    role: mapRoleToFrontend(response.role),
                    reward_points: response.rewardPoints || 0,
                    wallet_balance: response.walletBalance || 0,
                    created_at: response.createdAt || new Date().toISOString(),
                    updated_at: response.updatedAt || new Date().toISOString(),
                };

                setProfile(userProfile);
                setError(null);
            } catch (err) {
                console.warn('Backend profile unavailable, using local auth profile:', err);
                setProfile(profileFromAuth(user));
                setError(null);
            } finally {
                setIsLoading(false);
            }
        };

        syncProfile();
    }, [user, isAuthLoading]);

    return { profile, isLoading: isAuthLoading || isLoading, error, isSignedIn: !!user };
};
