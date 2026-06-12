import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { UserRole } from '@/hooks/useUserProfile';
import { InviteRole } from '@/lib/invitationCodes';

const STAFF_ROLES: InviteRole[] = ['Professor', 'Librarian', 'Canteen Staff'];

export default function SignUpPage() {
  const { theme } = useTheme();
  const navigate = useNavigate();
  const { signUp } = useAuth();
  const [hasInviteCode, setHasInviteCode] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    full_name: '',
    role: 'Professor' as InviteRole,
    inviteCode: '',
  });
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.email || !formData.password || !formData.full_name) {
      toast.error('Please fill in all fields');
      return;
    }

    if (hasInviteCode) {
      if (!formData.inviteCode.trim()) {
        toast.error('Please enter your invitation code');
        return;
      }
    }

    setIsLoading(true);
    try {
      const role: UserRole = hasInviteCode ? formData.role : 'Student';
      await signUp(
        formData.email,
        formData.password,
        formData.full_name,
        role,
        hasInviteCode ? formData.inviteCode : undefined
      );
      toast.success('Account created successfully!');

      if (role === 'Professor') navigate('/faculty');
      else if (role === 'Librarian') navigate('/librarian');
      else if (role === 'Canteen Staff') navigate('/canteen-incharge');
      else navigate('/dashboard');
    } catch (error: any) {
      toast.error(error.message || 'Failed to create account');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md shadow-elegant border-primary/20">
        <CardHeader className="space-y-1 text-center">
          <CardTitle className={`text-3xl font-bold ${theme === 'cyber' ? 'gradient-cyber bg-clip-text text-transparent' : ''}`}>
            Join CampusHub
          </CardTitle>
          <CardDescription>
            Create your account to access campus services
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="full_name">Full Name</Label>
              <Input
                id="full_name"
                placeholder="John Doe"
                value={formData.full_name}
                onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="name@university.edu"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                required
              />
            </div>

            <div className="flex items-center justify-between rounded-lg border p-3">
              <div className="space-y-0.5">
                <Label htmlFor="invite-toggle">I have an invitation code</Label>
                <p className="text-xs text-muted-foreground">
                  For faculty, librarian, or canteen staff
                </p>
              </div>
              <Switch
                id="invite-toggle"
                checked={hasInviteCode}
                onCheckedChange={setHasInviteCode}
              />
            </div>

            {hasInviteCode && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="role">Role</Label>
                  <Select
                    value={formData.role}
                    onValueChange={(val) => setFormData({ ...formData, role: val as InviteRole })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select your role" />
                    </SelectTrigger>
                    <SelectContent>
                      {STAFF_ROLES.map((role) => (
                        <SelectItem key={role} value={role}>
                          {role === 'Professor' ? 'Professor (Faculty)' : role === 'Canteen Staff' ? 'Canteen In-charge' : role}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="inviteCode">Invitation Code</Label>
                  <Input
                    id="inviteCode"
                    placeholder="e.g. PROF-2024"
                    value={formData.inviteCode}
                    onChange={(e) => setFormData({ ...formData, inviteCode: e.target.value })}
                    required
                  />
                  <p className="text-xs text-muted-foreground">
                    Only administrator-issued codes are accepted (e.g. PROF-A1B2). Contact your admin to obtain one.
                  </p>
                </div>
              </>
            )}

            {!hasInviteCode && (
              <div className="rounded-lg bg-muted/50 p-3 text-sm text-muted-foreground">
                Signing up as a <span className="font-medium text-foreground">Student</span>. No invitation code needed.
              </div>
            )}
          </CardContent>
          <CardFooter className="flex flex-col space-y-4">
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? 'Creating Account...' : 'Sign Up'}
            </Button>
            <div className="text-sm text-center text-muted-foreground">
              Already have an account?{' '}
              <Link to="/sign-in" className="text-primary hover:underline font-medium">
                Sign In
              </Link>
            </div>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
