import { useState, useEffect } from "react";
import { supabase, TABLES } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, CheckCircle2, XCircle, AlertTriangle, RefreshCw, ShieldCheck, Database, LayoutDashboard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";

interface ModuleStatus {
    name: string;
    status: 'loading' | 'healthy' | 'error' | 'warning';
    message: string;
    details?: any;
}

const Verification = () => {
    const { user, isLoading: isAuthLoading } = useAuth();
    const [supabaseStatus, setSupabaseStatus] = useState<ModuleStatus>({
        name: "Supabase Connectivity",
        status: 'loading',
        message: "Checking connection..."
    });

    const [authStatus, setAuthStatus] = useState<ModuleStatus>({
        name: "Authentication (Custom MongoDB)",
        status: 'loading',
        message: "Checking auth state..."
    });

    const [tableStatuses, setTableStatuses] = useState<Record<string, ModuleStatus>>({});
    const [isVerifying, setIsVerifying] = useState(false);

    const checkSupabase = async () => {
        try {
            const { data, error } = await supabase.from(TABLES.PROFILES).select('id').limit(1);
            if (error) throw error;
            setSupabaseStatus({
                name: "Supabase Connectivity",
                status: 'healthy',
                message: "Successfully connected to Supabase database.",
                details: { url: import.meta.env.VITE_SUPABASE_URL || 'Default URL' }
            });
            return true;
        } catch (error: any) {
            setSupabaseStatus({
                name: "Supabase Connectivity",
                status: 'error',
                message: error.message || "Failed to connect to Supabase.",
                details: error
            });
            return false;
        }
    };

    const checkAuth = () => {
        if (isAuthLoading) return;

        if (user) {
            setAuthStatus({
                name: "Authentication (Custom MongoDB)",
                status: 'healthy',
                message: `Authenticated as ${user.full_name}`,
                details: {
                    id: user.id,
                    email: user.email,
                    role: user.role
                }
            });
        } else {
            setAuthStatus({
                name: "Authentication (Custom MongoDB)",
                status: 'warning',
                message: "No user is currently signed in.",
            });
        }
    };

    const checkTable = async (tableName: string, displayName: string): Promise<ModuleStatus> => {
        try {
            // Use a timeout to avoid hanging
            const timeoutPromise = new Promise((_, reject) =>
                setTimeout(() => reject(new Error(`Timeout fetching ${tableName}`)), 5000)
            );

            const fetchPromise = supabase.from(tableName).select('*', { count: 'exact' }).limit(1);

            const { count, error } = await Promise.race([fetchPromise, timeoutPromise]) as any;

            if (error) {
                // Check if error is specifically about policy/permissions (RLS)
                if (error.code === '42501') {
                    return {
                        name: displayName,
                        status: 'warning',
                        message: "Table exists but access is restricted by RLS policies.",
                        details: error
                    };
                }
                throw error;
            }

            return {
                name: displayName,
                status: 'healthy',
                message: `Functional. Found ${count || 0} records.`,
                details: { count }
            };
        } catch (error: any) {
            return {
                name: displayName,
                status: 'error',
                message: error.message || `Failed to access table ${tableName}`,
                details: error
            };
        }
    };

    const runFullVerification = async () => {
        setIsVerifying(true);
        toast.info("Starting system-wide verification...");

        // 1. Check Core connectivity first
        const isDbUp = await checkSupabase();
        checkAuth();

        if (!isDbUp) {
            toast.error("Database is unreachable. Skipping table checks.");
            setIsVerifying(false);
            return;
        }

        // 2. Define modules to check
        const modulesToCheck = [
            { id: TABLES.BOOKS, name: "Library Books" },
            { id: TABLES.ISSUED_BOOKS, name: "Library Transactions" },
            { id: TABLES.FINES, name: "Library Fines" },
            { id: TABLES.MENU_ITEMS, name: "Canteen Menu" },
            { id: TABLES.ORDERS, name: "Canteen Orders" },
            { id: TABLES.FACILITIES, name: "Campus Facilities" },
            { id: TABLES.FACILITY_BOOKINGS, name: "Facility Bookings" },
            { id: TABLES.CAMPUS_EVENTS, name: "Campus Events" },
            { id: TABLES.PROFILES, name: "User Profiles" },
            { id: TABLES.STUDY_MATERIALS, name: "Study Materials" },
            { id: TABLES.ASSIGNMENTS, name: "Academic Assignments" },
            { id: TABLES.NOTIFICATIONS, name: "Real-time Notifications" },
            { id: TABLES.ANNOUNCEMENTS, name: "Campus Announcements" },
            { id: TABLES.FORUMS, name: "Community Forums" }
        ];

        const results: Record<string, ModuleStatus> = {};

        // Check tables sequentially to avoid overloading or batch them
        for (const mod of modulesToCheck) {
            setTableStatuses(prev => ({
                ...prev,
                [mod.id]: { name: mod.name, status: 'loading', message: "Verifying..." }
            }));
            const status = await checkTable(mod.id, mod.name);
            results[mod.id] = status;
            setTableStatuses(prev => ({ ...prev, [mod.id]: status }));
        }

        setIsVerifying(false);
        toast.success("Verification complete!");
    };

    useEffect(() => {
        if (!isAuthLoading) {
            runFullVerification();
        }
    }, [isAuthLoading]);

    const StatusIcon = ({ status }: { status: ModuleStatus['status'] }) => {
        switch (status) {
            case 'loading': return <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />;
            case 'healthy': return <CheckCircle2 className="h-5 w-5 text-green-500" />;
            case 'warning': return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
            case 'error': return <XCircle className="h-5 w-5 text-red-500" />;
        }
    };

    const StatusBadge = ({ status }: { status: ModuleStatus['status'] }) => {
        switch (status) {
            case 'loading': return <Badge variant="outline">Checking</Badge>;
            case 'healthy': return <Badge className="bg-green-500">Healthy</Badge>;
            case 'warning': return <Badge variant="outline" className="text-yellow-500 border-yellow-500">Restricted</Badge>;
            case 'error': return <Badge variant="destructive">Error</Badge>;
        }
    };

    return (
        <div className="container mx-auto py-8 px-4 h-full flex flex-col gap-6 animate-in fade-in duration-500">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
                        <ShieldCheck className="h-8 w-8 text-primary" />
                        System Verification Dashboard
                    </h1>
                    <p className="text-muted-foreground mt-1">
                        Real-time health check and module verification for Campus Connect.
                    </p>
                </div>
                <Button
                    onClick={runFullVerification}
                    disabled={isVerifying}
                    className="flex items-center gap-2"
                >
                    {isVerifying ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                    Run Full Diagnostic
                </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* Core Connectivity Card */}
                <Card className="shadow-lg border-2 border-primary/10">
                    <CardHeader className="pb-2">
                        <CardTitle className="flex items-center gap-2 text-lg">
                            <Database className="h-5 w-5" />
                            Core Database
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex justify-between items-center p-3 rounded-lg bg-muted/50">
                            <span className="font-medium">{supabaseStatus.name}</span>
                            <StatusIcon status={supabaseStatus.status} />
                        </div>
                        <p className="text-sm text-muted-foreground px-1 italic">
                            {supabaseStatus.message}
                        </p>
                        {supabaseStatus.details && (
                            <div className="p-2 bg-black/5 dark:bg-white/5 rounded text-[10px] font-mono break-all line-clamp-2">
                                URL: {supabaseStatus.details.url}
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Auth Services Card */}
                <Card className="shadow-lg border-2 border-primary/10">
                    <CardHeader className="pb-2">
                        <CardTitle className="flex items-center gap-2 text-lg">
                            <ShieldCheck className="h-5 w-5" />
                            Identity & Access
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex justify-between items-center p-3 rounded-lg bg-muted/50">
                            <span className="font-medium">{authStatus.name}</span>
                            <StatusIcon status={authStatus.status} />
                        </div>
                        <p className="text-sm text-muted-foreground px-1 italic">
                            {authStatus.message}
                        </p>
                        {authStatus.details && (
                            <div className="flex flex-wrap gap-2 text-[10px]">
                                <Badge variant="secondary">ID: {authStatus.details.id.substring(0, 12)}...</Badge>
                                <Badge variant="outline">{authStatus.details.role}</Badge>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* System Summary Card */}
                <Card className="shadow-lg border-2 border-primary/10 bg-primary/5">
                    <CardHeader className="pb-2">
                        <CardTitle className="flex items-center gap-2 text-lg">
                            <LayoutDashboard className="h-5 w-5" />
                            Module Overview
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                            <div className="flex justify-between items-center text-sm">
                                <span>Total Modules Checked:</span>
                                <span className="font-bold">{Object.keys(tableStatuses).length}</span>
                            </div>
                            <div className="flex justify-between items-center text-sm">
                                <span>Healthy:</span>
                                <span className="text-green-500 font-bold">
                                    {Object.values(tableStatuses).filter(s => s.status === 'healthy').length}
                                </span>
                            </div>
                            <div className="flex justify-between items-center text-sm">
                                <span>Errors / Warnings:</span>
                                <span className="text-red-500 font-bold">
                                    {Object.values(tableStatuses).filter(s => s.status === 'error' || s.status === 'warning').length}
                                </span>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <Separator className="my-2" />

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="shadow-sm overflow-hidden flex flex-col">
                    <CardHeader>
                        <CardTitle>Detailed Module Diagnostics</CardTitle>
                        <CardDescription>Direct verification of each Supabase table and its associated module functionality.</CardDescription>
                    </CardHeader>
                    <CardContent className="p-0">
                        <ScrollArea className="h-[400px]">
                            <div className="divide-y">
                                {Object.entries(tableStatuses).map(([id, status]) => (
                                    <div key={id} className="p-4 flex items-center justify-between hover:bg-muted/30 transition-colors">
                                        <div className="flex flex-col gap-1">
                                            <div className="flex items-center gap-2">
                                                <span className="font-semibold">{status.name}</span>
                                                <StatusBadge status={status.status} />
                                            </div>
                                            <span className="text-xs text-muted-foreground font-mono">{id}</span>
                                        </div>
                                        <div className="flex items-center gap-4 text-right">
                                            <p className="text-sm hidden sm:block italic text-muted-foreground mr-2">
                                                {status.message}
                                            </p>
                                            <StatusIcon status={status.status} />
                                        </div>
                                    </div>
                                ))}
                                {Object.keys(tableStatuses).length === 0 && !isVerifying && (
                                    <div className="p-8 text-center text-muted-foreground">
                                        No data to display. Click "Run Full Diagnostic" to start.
                                    </div>
                                )}
                                {isVerifying && Object.keys(tableStatuses).length === 0 && (
                                    <div className="p-8 flex flex-col items-center gap-3 text-muted-foreground">
                                        <Loader2 className="h-8 w-8 animate-spin" />
                                        <span>Analyzing system components...</span>
                                    </div>
                                )}
                            </div>
                        </ScrollArea>
                    </CardContent>
                </Card>

                <Card className="shadow-sm">
                    <CardHeader>
                        <CardTitle>Troubleshooting & Log Output</CardTitle>
                        <CardDescription>Technical details and error stacks for debugging.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="bg-secondary/30 rounded-lg p-4 font-mono text-xs overflow-auto h-[400px]">
                            <h4 className="border-b border-border/50 pb-2 mb-2 font-bold text-primary">REPORTS LOG</h4>
                            {Object.values(tableStatuses)
                                .filter(s => s.status === 'error' || s.status === 'warning' || s.status === 'healthy')
                                .map((s, i) => (
                                    <div key={i} className="mb-4">
                                        <p className={`font-bold ${s.status === 'error' ? 'text-red-500' : s.status === 'warning' ? 'text-yellow-600' : 'text-green-600'}`}>
                                            [{s.status.toUpperCase()}] {s.name}
                                        </p>
                                        <p className="opacity-70 ml-2">Message: {s.message}</p>
                                        {s.details && (
                                            <pre className="mt-1 ml-4 text-[10px] bg-black/10 dark:bg-white/5 p-2 rounded whitespace-pre-wrap">
                                                {JSON.stringify(s.details, null, 2)}
                                            </pre>
                                        )}
                                    </div>
                                ))}
                            {Object.keys(tableStatuses).length === 0 && (
                                <p className="text-muted-foreground italic">Ready for diagnostics...</p>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};

export default Verification;
