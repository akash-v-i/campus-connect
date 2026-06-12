import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useTheme } from '@/contexts/ThemeContext';
import { useChatbot } from '@/contexts/ChatbotContext';
import { useAuth } from '@/contexts/AuthContext';
import { useState } from 'react';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import {
  BookOpen,
  UtensilsCrossed,
  GraduationCap,
  Building2,
  Settings,
  Sparkles,
  Moon,
  Sun,
  Menu,
  X,
  MessageCircle,
  ShieldCheck,
  User,
  LogOut
} from 'lucide-react';

export const Navigation = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  const { openChatbot } = useChatbot();
  const { user, logout, isSignedIn } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/sign-in');
  };

  // Detect dashboard type
  const isLibrarian = location.pathname.startsWith('/librarian');
  const isCanteenIncharge = location.pathname.startsWith('/canteen-incharge');
  const isFaculty = location.pathname.startsWith('/faculty');
  // Faculty nav items
  const facultyNavItems = [
    { tab: 'resources', label: 'Resources' },
    { tab: 'tests', label: 'Tests' },
    { tab: 'groups', label: 'Groups' },
    { tab: 'forums', label: 'Forums' },
    { tab: 'performance', label: 'Performance' },
  ];

  // Student nav items
  const studentNavItems = [
    { path: '/dashboard', label: 'Dashboard', icon: GraduationCap },
    { path: '/library', label: 'Library', icon: BookOpen },
    { path: '/canteen', label: 'Canteen', icon: UtensilsCrossed },
    { path: '/academic', label: 'Academic', icon: GraduationCap },
    { path: '/campus', label: 'Campus', icon: Building2 },
  ];

  // Librarian nav items (tab param for active state)
  const librarianNavItems = [
    { tab: 'requests', label: 'Requests' },
    { tab: 'inventory', label: 'Inventory' },
    { tab: 'loans', label: 'Loans & Returns' },
    { tab: 'fines', label: 'Fines & Dues' },
  ];

  // Canteen In-charge nav items
  const canteenNavItems = [
    { tab: 'menu', label: 'Menu & Inventory' },
    { tab: 'orders', label: 'Pre-Orders' },
    { tab: 'transactions', label: 'Transactions' },
  ];

  // Get current tab from URL
  const getCurrentTab = () => {
    const params = new URLSearchParams(location.search);
    if (isLibrarian) return params.get('tab') || 'requests';
    if (isCanteenIncharge) return params.get('tab') || 'menu';
    if (isFaculty) return params.get('tab') || 'resources';
    return params.get('tab') || '';
  };

  const isActive = (path: string) => location.pathname === path || location.pathname.startsWith(path + '/');

  return (
    <nav className="glass-effect sticky top-0 z-50 border-b border-border/50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-3 font-bold text-xl">
            <Sparkles className="h-6 w-6 text-primary" />
            <span className={theme === 'cyber' ? 'gradient-cyber bg-clip-text text-transparent' : ''}>
              Campus Connect
            </span>
          </Link>

          {/* Desktop Nav Items */}
          <div className="hidden lg:flex items-center justify-center flex-1">
            <div className="flex items-center gap-2">
              {(user?.role === 'Student' || user?.role === 'Admin') && !isLibrarian && !isCanteenIncharge && !isFaculty && studentNavItems.map((item) => {
                const Icon = item.icon;
                return (
                  <Link key={item.path} to={item.path}>
                    <Button
                      variant={isActive(item.path) ? 'default' : 'ghost'}
                      className="gap-2 px-4 py-2 h-10"
                    >
                      <Icon className="h-4 w-4" />
                      {item.label}
                    </Button>
                  </Link>
                );
              })}
              {isLibrarian && (
                <>
                  {librarianNavItems.map((item) => (
                    <Link key={item.tab} to={`/librarian?tab=${item.tab}`}>
                      <Button
                        variant={getCurrentTab() === item.tab ? 'default' : 'ghost'}
                        className="gap-2 px-4 py-2 h-10"
                      >
                        {item.label}
                      </Button>
                    </Link>
                  ))}
                </>
              )}
              {isCanteenIncharge && (
                <>
                  {canteenNavItems.map((item) => (
                    <Link key={item.tab} to={`/canteen-incharge?tab=${item.tab}`}>
                      <Button
                        variant={getCurrentTab() === item.tab ? 'default' : 'ghost'}
                        className="gap-2 px-4 py-2 h-10"
                      >
                        {item.label}
                      </Button>
                    </Link>
                  ))}
                </>
              )}
              {isFaculty && (
                <>
                  {facultyNavItems.map((item) => (
                    <Link key={item.tab} to={`/faculty?tab=${item.tab}`}>
                      <Button
                        variant={getCurrentTab() === item.tab ? 'default' : 'ghost'}
                        className="gap-2 px-4 py-2 h-10"
                      >
                        {item.label}
                      </Button>
                    </Link>
                  ))}
                </>
              )}
            </div>
          </div>

          {/* Right Side Actions */}
          <div className="flex items-center gap-3">
            {/* Chat Assistant Button */}
            {isSignedIn && (
              <Button
                variant="ghost"
                size="icon"
                onClick={openChatbot}
                className="transition-smooth h-10 w-10"
                title="Open AI Assistant"
              >
                <MessageCircle className="h-5 w-5" />
              </Button>
            )}

            {/* Theme Toggle */}
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleTheme}
              className="transition-smooth h-10 w-10"
            >
              {theme === 'classic' ? (
                <Moon className="h-5 w-5" />
              ) : (
                <Sun className="h-5 w-5" />
              )}
            </Button>

            {/* Dashboard Dropdown - Filtered by Role */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="gap-2 px-4 py-2 h-10">
                  <GraduationCap className="h-4 w-4" />
                  <span className="hidden sm:inline">
                    {user?.role === 'Admin' ? 'Management' : 'Dashboard'}
                  </span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {/* Always show Student Dashboard for students or admins */}
                {(user?.role === 'Student' || user?.role === 'Admin') && (
                  <DropdownMenuItem asChild>
                    <Link to="/dashboard">
                      <span className="flex items-center gap-2">
                        <GraduationCap className="h-4 w-4" /> Student Portal
                      </span>
                    </Link>
                  </DropdownMenuItem>
                )}

                {/* Librarian options */}
                {(user?.role === 'Librarian' || user?.role === 'Admin') && (
                  <DropdownMenuItem asChild>
                    <Link to="/librarian">
                      <span className="flex items-center gap-2">
                        <BookOpen className="h-4 w-4" /> Librarian Workspace
                      </span>
                    </Link>
                  </DropdownMenuItem>
                )}

                {/* Canteen options */}
                {(user?.role === 'Canteen Staff' || user?.role === 'Admin') && (
                  <DropdownMenuItem asChild>
                    <Link to="/canteen-incharge">
                      <span className="flex items-center gap-2">
                        <UtensilsCrossed className="h-4 w-4" /> Canteen Manager
                      </span>
                    </Link>
                  </DropdownMenuItem>
                )}

                {/* Faculty options */}
                {(user?.role === 'Professor' || user?.role === 'Admin') && (
                  <DropdownMenuItem asChild>
                    <Link to="/faculty">
                      <span className="flex items-center gap-2">
                        <GraduationCap className="h-4 w-4" /> Faculty Portal
                      </span>
                    </Link>
                  </DropdownMenuItem>
                )}

                <div className="h-px bg-border/50 my-1" />
                <DropdownMenuItem asChild>
                  <Link to="/verify">
                    <span className="flex items-center gap-2 text-primary">
                      <ShieldCheck className="h-4 w-4" /> System Status
                    </span>
                  </Link>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* User Actions */}
            {isSignedIn && (
              <div className="flex items-center gap-2">
                <Link to="/settings" className="hidden sm:block">
                  <Button variant="ghost" size="icon" className="h-10 w-10">
                    <Settings className="h-5 w-5" />
                  </Button>
                </Link>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="relative h-10 w-10 rounded-full p-0">
                      {user?.avatar_url ? (
                        <img src={user.avatar_url} alt={user.full_name} className="h-10 w-10 rounded-full object-cover border border-primary/20" />
                      ) : (
                        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center border border-primary/20">
                          <User className="h-5 w-5 text-primary" />
                        </div>
                      )}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuLabel>
                      <div className="flex flex-col space-y-1">
                        <p className="text-sm font-medium leading-none">{user?.full_name}</p>
                        <p className="text-xs leading-none text-muted-foreground">{user?.email}</p>
                        <p className="text-[10px] font-bold text-primary mt-1 uppercase">{user?.role}</p>
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link to="/settings" className="flex items-center gap-2 cursor-pointer">
                        <User className="h-4 w-4" /> Profile Details
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link to="/settings" className="flex items-center gap-2 cursor-pointer">
                        <Settings className="h-4 w-4" /> App Settings
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      className="flex items-center gap-2 text-destructive cursor-pointer"
                      onClick={handleLogout}
                    >
                      <LogOut className="h-4 w-4" /> Log out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            )}

            {/* Mobile Menu Button */}
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden h-10 w-10"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              {isMobileMenuOpen ? (
                <X className="h-5 w-5" />
              ) : (
                <Menu className="h-5 w-5" />
              )}
            </Button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="lg:hidden border-t border-border/50 bg-background/95 backdrop-blur-md">
            <div className="py-4 space-y-2">
              {!isLibrarian && !isCanteenIncharge && !isFaculty && studentNavItems.map((item) => {
                const Icon = item.icon;
                return (
                  <Link key={item.path} to={item.path} onClick={() => setIsMobileMenuOpen(false)}>
                    <Button
                      variant={isActive(item.path) ? 'default' : 'ghost'}
                      className="w-full justify-start gap-3 h-12"
                    >
                      <Icon className="h-5 w-5" />
                      {item.label}
                    </Button>
                  </Link>
                );
              })}
              {isLibrarian && (
                <>
                  {librarianNavItems.map((item) => (
                    <Link key={item.tab} to={`/librarian?tab=${item.tab}`} onClick={() => setIsMobileMenuOpen(false)}>
                      <Button
                        variant={getCurrentTab() === item.tab ? 'default' : 'ghost'}
                        className="w-full justify-start gap-3 h-12"
                      >
                        {item.label}
                      </Button>
                    </Link>
                  ))}
                </>
              )}
              {isCanteenIncharge && (
                <>
                  {canteenNavItems.map((item) => (
                    <Link key={item.tab} to={`/canteen-incharge?tab=${item.tab}`} onClick={() => setIsMobileMenuOpen(false)}>
                      <Button
                        variant={getCurrentTab() === item.tab ? 'default' : 'ghost'}
                        className="w-full justify-start gap-3 h-12"
                      >
                        {item.label}
                      </Button>
                    </Link>
                  ))}
                </>
              )}
              {isFaculty && (
                <>
                  {facultyNavItems.map((item) => (
                    <Link key={item.tab} to={`/faculty?tab=${item.tab}`} onClick={() => setIsMobileMenuOpen(false)}>
                      <Button
                        variant={getCurrentTab() === item.tab ? 'default' : 'ghost'}
                        className="w-full justify-start gap-3 h-12"
                      >
                        {item.label}
                      </Button>
                    </Link>
                  ))}
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};
