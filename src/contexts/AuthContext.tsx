import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserRole } from '@/hooks/useUserProfile';
import { setAuthToken } from '@/lib/apiClient';
import { validateInviteCodeDetailed, getInviteCodeErrorMessage, markCodeUsed, isStaffRole, InviteRole } from '@/lib/invitationCodes';

export interface AuthUser {
    id: string;
    email: string;
    full_name: string;
    role: UserRole;
    avatar_url?: string;
    is_active?: boolean;
    status?: string;
}

interface StoredUser {
    id: string;
    email: string;
    password: string;
    full_name: string;
    role: UserRole;
    avatar_url?: string;
    is_active?: boolean;
    status?: string;
    created_at?: string;
}

interface AuthContextType {
    user: AuthUser | null;
    isLoading: boolean;
    login: (email: string, password: string) => Promise<void>;
    signUp: (email: string, password: string, full_name: string, role: UserRole, inviteCode?: string) => Promise<void>;
    logout: () => void;
    isAdmin: boolean;
    isSignedIn: boolean;
    blockUser: (userId: string) => void;
    unblockUser: (userId: string) => void;
    deleteUser: (userId: string) => void;
    getAllUsers: () => StoredUser[];
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const USERS_STORAGE_KEY = 'campus_connect_users';

function getUsers(): StoredUser[] {
    try {
        return JSON.parse(localStorage.getItem(USERS_STORAGE_KEY) || '[]');
    } catch {
        return [];
    }
}

function saveUsers(users: StoredUser[]) {
    localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
}

function toAuthUser(u: StoredUser): AuthUser {
    return {
        id: u.id,
        email: u.email,
        full_name: u.full_name,
        role: u.role,
        avatar_url: u.avatar_url,
        is_active: u.is_active !== false,
        status: u.status || 'ACTIVE',
    };
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<AuthUser | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const existingUsers = localStorage.getItem(USERS_STORAGE_KEY);
        if (!existingUsers) {
            const demoUsers: StoredUser[] = [
                { id: 'u_admin', email: 'admin@campus.edu', password: 'admin123', full_name: 'System Admin', role: 'Admin', is_active: true, status: 'ACTIVE' },
                { id: 'u_faculty', email: 'faculty@campus.edu', password: 'faculty123', full_name: 'Dr. Sarah Smith', role: 'Professor', is_active: true, status: 'ACTIVE' },
                { id: 'u_student', email: 'student@campus.edu', password: 'student123', full_name: 'Alex Johnson', role: 'Student', is_active: true, status: 'ACTIVE' },
                { id: 'u_librarian', email: 'librarian@campus.edu', password: 'librarian123', full_name: 'Emily Book', role: 'Librarian', is_active: true, status: 'ACTIVE' },
                { id: 'u_canteen', email: 'canteen@campus.edu', password: 'canteen123', full_name: 'Chef Mario', role: 'Canteen Staff', is_active: true, status: 'ACTIVE' },
            ];
            saveUsers(demoUsers);
        }

        const session = localStorage.getItem('campus_connect_session');
        if (session) {
            try {
                const parsed = JSON.parse(session);
                const stored = getUsers().find(u => u.id === parsed.id);
                if (stored && stored.is_active === false) {
                    localStorage.removeItem('campus_connect_session');
                    setAuthToken(null);
                } else {
                    setUser(parsed);
                    setAuthToken(parsed.id);
                }
            } catch {
                localStorage.removeItem('campus_connect_session');
                setAuthToken(null);
            }
        }
        setIsLoading(false);
    }, []);

    const login = async (email: string, password: string) => {
        setIsLoading(true);
        try {
            await new Promise(resolve => setTimeout(resolve, 800));

            const users = getUsers();
            const foundUser = users.find(u => u.email === email && u.password === password);

            if (!foundUser) {
                throw new Error('Invalid email or password');
            }

            if (foundUser.is_active === false || foundUser.status === 'BLOCKED') {
                throw new Error('Your account has been blocked. Please contact the administrator.');
            }

            const authUser = toAuthUser(foundUser);
            setUser(authUser);
            setAuthToken(authUser.id);
            localStorage.setItem('campus_connect_session', JSON.stringify(authUser));
        } finally {
            setIsLoading(false);
        }
    };

    const signUp = async (email: string, password: string, full_name: string, role: UserRole, inviteCode?: string) => {
        setIsLoading(true);
        try {
            await new Promise(resolve => setTimeout(resolve, 800));

            if (role === 'Admin') {
                throw new Error('Admin accounts cannot be created via signup');
            }

            if (isStaffRole(role)) {
                if (!inviteCode?.trim()) {
                    throw new Error('An invitation code is required for staff registration');
                }
                const validation = validateInviteCodeDetailed(inviteCode, role as InviteRole);
                if (!validation.valid) {
                    throw new Error(getInviteCodeErrorMessage(validation));
                }
            }

            const users = getUsers();
            if (users.find(u => u.email === email)) {
                throw new Error('User already exists');
            }

            const newUser: StoredUser = {
                id: `user_${Math.random().toString(36).substr(2, 9)}`,
                email,
                password,
                full_name,
                role,
                is_active: true,
                status: 'ACTIVE',
                created_at: new Date().toISOString(),
            };

            users.push(newUser);
            saveUsers(users);

            if (isStaffRole(role) && inviteCode) {
                markCodeUsed(inviteCode, newUser.id);
            }

            const authUser = toAuthUser(newUser);
            setUser(authUser);
            setAuthToken(authUser.id);
            localStorage.setItem('campus_connect_session', JSON.stringify(authUser));
        } finally {
            setIsLoading(false);
        }
    };

    const logout = () => {
        setUser(null);
        setAuthToken(null);
        localStorage.removeItem('campus_connect_session');
    };

    const blockUser = (userId: string) => {
        const users = getUsers();
        const idx = users.findIndex(u => u.id === userId);
        if (idx >= 0 && users[idx].role !== 'Admin') {
            users[idx].is_active = false;
            users[idx].status = 'BLOCKED';
            saveUsers(users);
        }
    };

    const unblockUser = (userId: string) => {
        const users = getUsers();
        const idx = users.findIndex(u => u.id === userId);
        if (idx >= 0) {
            users[idx].is_active = true;
            users[idx].status = 'ACTIVE';
            saveUsers(users);
        }
    };

    const deleteUser = (userId: string) => {
        const users = getUsers().filter(u => u.id !== userId && u.role !== 'Admin');
        saveUsers(users);

        const session = localStorage.getItem('campus_connect_session');
        if (session) {
            try {
                const parsed = JSON.parse(session);
                if (parsed.id === userId) {
                    logout();
                }
            } catch { /* ignore */ }
        }
    };

    const getAllUsers = () => getUsers();

    const isAdmin = user?.role === 'Admin';
    const isSignedIn = !!user;

    return (
        <AuthContext.Provider value={{
            user, isLoading, login, signUp, logout, isAdmin, isSignedIn,
            blockUser, unblockUser, deleteUser, getAllUsers,
        }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
