import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Link } from 'react-router-dom';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import {
  BookOpen,
  UtensilsCrossed,
  GraduationCap,
  Building2,
  Sparkles,
  ArrowRight,
  Award,
  Users,
  TrendingUp
} from 'lucide-react';

import { useQuery } from '@tanstack/react-query';
import { supabase, TABLES } from '@/lib/supabase';

export default function Home() {
  const { theme } = useTheme();
  const { isSignedIn, user } = useAuth();

  const getDashboardLink = () => {
    if (!user) return '/sign-in';
    const roleMap: any = {
      'Student': '/dashboard',
      'Professor': '/faculty',
      'Librarian': '/librarian',
      'Canteen Staff': '/canteen-incharge',
      'Admin': '/dashboard'
    };
    return roleMap[user.role] || '/dashboard';
  };

  // Fetch stats
  const { data: statsData } = useQuery({
    queryKey: ['campus-stats'],
    queryFn: async () => {
      const [students, books, orders] = await Promise.all([
        supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'Student'),
        supabase.from(TABLES.ISSUED_BOOKS).select('*', { count: 'exact', head: true }),
        supabase.from(TABLES.ORDERS).select('*', { count: 'exact', head: true }),
      ]);

      return {
        students: students.count || 0,
        books: books.count || 0,
        orders: orders.count || 0,
      };
    },
  });

  const features = [
    {
      icon: BookOpen,
      title: 'Smart Library',
      description: 'Browse, issue, and return books with QR codes. Track fines and reading history.',
      color: 'text-blue-500'
    },
    {
      icon: UtensilsCrossed,
      title: 'Digital Canteen',
      description: 'Pre-order meals, skip queues, and manage your food wallet seamlessly.',
      color: 'text-orange-500'
    },
    {
      icon: GraduationCap,
      title: 'Academic Hub',
      description: 'Access study materials, collaborate on projects, and share resources.',
      color: 'text-purple-500'
    },
    {
      icon: Building2,
      title: 'Campus Services',
      description: 'Hostel management, fee payments, events, and campus navigation.',
      color: 'text-green-500'
    },
  ];

  const stats = [
    { icon: Users, value: statsData ? `${statsData.students}+` : '10K+', label: 'Active Students' },
    { icon: BookOpen, value: statsData ? `${statsData.books}+` : '50K+', label: 'Books Issued' },
    { icon: UtensilsCrossed, value: statsData ? `${statsData.orders}+` : '5K+', label: 'Meals Served' },
    { icon: TrendingUp, value: '24/7', label: 'Availability' },
  ];

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className={`relative overflow-hidden ${theme === 'cyber' ? 'bg-gradient-to-br from-background via-background to-primary/10' : 'bg-gradient-to-br from-primary/5 to-background'}`}>
        <div className="container mx-auto px-4 py-20 lg:py-32">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-6">
              <Sparkles className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium">Your Complete Campus Companion</span>
            </div>

            <h1 className="text-5xl lg:text-7xl font-bold mb-6">
              Campus Life,
              <span className={theme === 'cyber' ? 'gradient-cyber bg-clip-text text-transparent' : 'text-primary'}>
                {' '}Simplified
              </span>
            </h1>

            <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              One unified platform for library, canteen, academics, and campus services.
              Built by students, for students.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              {isSignedIn ? (
                <Link to={getDashboardLink()}>
                  <Button size="lg" className="gap-2 text-lg">
                    Go to Dashboard
                    <Sparkles className="h-5 w-5" />
                  </Button>
                </Link>
              ) : (
                <>
                  <Link to="/sign-in">
                    <Button size="lg" className="gap-2 text-lg">
                      Sign In
                    </Button>
                  </Link>
                  <Link to="/sign-up">
                    <Button size="lg" variant="outline" className="text-lg">
                      Sign Up
                    </Button>
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Decorative Elements */}
        <div className={`absolute top-20 right-10 w-72 h-72 ${theme === 'cyber' ? 'bg-primary/20' : 'bg-primary/10'} rounded-full blur-3xl animate-pulse`}></div>
        <div className={`absolute bottom-20 left-10 w-96 h-96 ${theme === 'cyber' ? 'bg-secondary/20' : 'bg-primary/5'} rounded-full blur-3xl animate-pulse delay-1000`}></div>
      </section>

      {/* Features */}
      <section className="container mx-auto px-4 py-20">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold mb-4">Everything You Need</h2>
          <p className="text-xl text-muted-foreground">All essential campus services in one place</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, idx) => {
            const Icon = feature.icon;
            return (
              <Card key={idx} className="p-6 card-hover">
                <Icon className={`h-12 w-12 mb-4 ${feature.color}`} />
                <h3 className="font-bold text-xl mb-2">{feature.title}</h3>
                <p className="text-muted-foreground">{feature.description}</p>
              </Card>
            );
          })}
        </div>
      </section>

      {/* Stats */}
      <section className={`${theme === 'cyber' ? 'gradient-cyber-subtle' : 'bg-muted/50'} py-20`}>
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, idx) => {
              const Icon = stat.icon;
              return (
                <div key={idx} className="text-center">
                  <Icon className="h-10 w-10 mx-auto mb-3 text-primary" />
                  <p className="text-4xl font-bold mb-1">{stat.value}</p>
                  <p className="text-muted-foreground">{stat.label}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="container mx-auto px-4 py-20">
        <Card className={`p-12 text-center ${theme === 'cyber' ? 'gradient-cyber' : 'bg-primary'} text-white`}>
          <h2 className="text-4xl font-bold mb-4">Ready to Get Started?</h2>
          <p className="text-xl mb-8 opacity-90">
            Join thousands of students already using CampusHub
          </p>
          <Link to={getDashboardLink()}>
            <Button size="lg" variant="secondary" className="gap-2">
              Launch Dashboard
              <ArrowRight className="h-5 w-5" />
            </Button>
          </Link>
        </Card>
      </section>
    </div>
  );
}
