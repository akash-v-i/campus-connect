import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useUserProfile } from "@/hooks/useUserProfile";
import { useTheme } from "@/contexts/ThemeContext";
import { User, Bell, Shield, Palette, Layout } from "lucide-react";

export default function Settings() {
    const { profile } = useUserProfile();
    const { theme, toggleTheme } = useTheme();

    return (
        <div className="container mx-auto px-4 py-8 max-w-4xl">
            <h1 className="text-4xl font-bold mb-8">Settings</h1>

            <div className="grid gap-6">
                {/* Profile Settings */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <User className="h-5 w-5" />
                            Profile Information
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="name">Full Name</Label>
                                <Input id="name" defaultValue={profile?.full_name || ""} placeholder="Your name" />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="email">Email Address</Label>
                                <Input id="email" defaultValue={profile?.email || ""} disabled />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label>Role</Label>
                            <Input value={profile?.role || "Student"} disabled className="bg-muted" />
                            <p className="text-xs text-muted-foreground">Your role is managed by the system administrator.</p>
                        </div>
                        <Button>Save Changes</Button>
                    </CardContent>
                </Card>

                {/* Appearance Settings */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Palette className="h-5 w-5" />
                            Appearance
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center justify-between">
                            <div className="space-y-0.5">
                                <Label>Cyber Theme</Label>
                                <p className="text-sm text-muted-foreground">Toggle between Classic and Cyber aesthetics.</p>
                            </div>
                            <Switch checked={theme === 'cyber'} onCheckedChange={toggleTheme} />
                        </div>
                    </CardContent>
                </Card>

                {/* Notification Settings */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Bell className="h-5 w-5" />
                            Notifications
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center justify-between">
                            <div className="space-y-0.5">
                                <Label>Email Notifications</Label>
                                <p className="text-sm text-muted-foreground">Receive updates about your library books and orders.</p>
                            </div>
                            <Switch defaultChecked />
                        </div>
                        <div className="flex items-center justify-between">
                            <div className="space-y-0.5">
                                <Label>Real-time Toasts</Label>
                                <p className="text-sm text-muted-foreground">Show popup notifications for immediate updates.</p>
                            </div>
                            <Switch defaultChecked />
                        </div>
                    </CardContent>
                </Card>

                {/* Security Settings */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Shield className="h-5 w-5" />
                            Security
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                        <p className="text-sm text-muted-foreground mb-4">Manage your account security and authentication.</p>
                        <Button variant="outline">Update Profile Security</Button>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
