import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

export default function SignInPage() {
  const { theme } = useTheme();
  const navigate = useNavigate();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error('Please fill in all fields');
      return;
    }

    setIsLoading(true);
    try {
      await login(email, password);
      toast.success('Signed in successfully!');
      navigate('/dashboard');
    } catch (error: any) {
      toast.error(error.message || 'Failed to sign in');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md shadow-elegant border-primary/20">
        <CardHeader className="space-y-1 text-center">
          <CardTitle className={`text-3xl font-bold ${theme === 'cyber' ? 'gradient-cyber bg-clip-text text-transparent' : ''}`}>
            Welcome Back
          </CardTitle>
          <CardDescription>
            Enter your credentials to access CampusHub
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Password</Label>
              </div>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
          </CardContent>
          <CardFooter className="flex flex-col space-y-4">
            <Button
              type="submit"
              className="w-full"
              disabled={isLoading}
            >
              {isLoading ? 'Signing in...' : 'Sign In'}
            </Button>
            <div className="text-sm text-center text-muted-foreground">
              Don't have an account?{' '}
              <Link to="/sign-up" className="text-primary hover:underline font-medium">
                Create one now
              </Link>
            </div>
            {/* Admin Bypass for demo */}
            <div className="pt-4 border-t w-full">
              <p className="text-[10px] text-center text-muted-foreground uppercase tracking-widest mb-2">Internal Access</p>
              <div className="grid grid-cols-2 gap-2">
                <Button variant="outline" size="sm" type="button" onClick={() => { setEmail('admin@campus.edu'); setPassword('admin123'); }}>Admin</Button>
                <Button variant="outline" size="sm" type="button" onClick={() => { setEmail('faculty@campus.edu'); setPassword('faculty123'); }}>Faculty</Button>
              </div>
            </div>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
