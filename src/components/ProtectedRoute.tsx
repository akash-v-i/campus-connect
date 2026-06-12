import { Navigate, useLocation } from 'react-router-dom';
import { useUserProfile, UserRole } from '@/hooks/useUserProfile';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: UserRole[];
}

export const ProtectedRoute = ({ children, allowedRoles }: ProtectedRouteProps) => {
  const { profile, isLoading, isSignedIn } = useUserProfile();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="h-12 w-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          <div className="text-muted-foreground animate-pulse">Establishing Secure Connection...</div>
        </div>
      </div>
    );
  }

  if (!isSignedIn) {
    return <Navigate to="/sign-in" state={{ from: location }} replace />;
  }

  if (allowedRoles && profile && !allowedRoles.includes(profile.role)) {
    // Redirect to their default dashboard if they don't have access
    const dashboardMap: Record<UserRole, string> = {
      'Student': '/dashboard',
      'Professor': '/faculty',
      'Librarian': '/librarian',
      'Canteen Staff': '/canteen-incharge',
      'Admin': '/dashboard'
    };
    return <Navigate to={dashboardMap[profile.role]} replace />;
  }

  return <>{children}</>;
};
