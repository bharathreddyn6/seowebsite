import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Sidebar from "@/components/layout/sidebar";
import Header from "@/components/layout/header";
import Footer from "@/components/layout/footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { useTheme } from "@/hooks/use-theme";
import { Settings as SettingsIcon, User, Bell, Database } from "lucide-react";
import { useLocation } from "wouter";

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

const profileSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Please enter a valid email"),
  userId: z.string().min(1, "User ID is required"),
});

type ProfileFormData = z.infer<typeof profileSchema>;

type CurrentUser = { id?: string; name?: string; email?: string } | null;

export default function Settings() {
  const { theme, setTheme } = useTheme();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [notifications, setNotifications] = useState({
    email: true,
    push: false,
    sms: false,
    weekly: true,
  });

  const form = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: "John Smith",
      email: "john@example.com",
      userId: "",
    },
  });

  const [currentUser, setCurrentUser] = useState<CurrentUser>(null);

  function decodeJwtPayload(token: string): any | null {
    try {
      const base64Url = token.split(".")[1];
      if (!base64Url) return null;
      const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
      const padded = base64.padEnd(Math.ceil(base64.length / 4) * 4, "=");
      const json = atob(padded);
      return JSON.parse(json);
    } catch {
      return null;
    }
  }

  // Load user details from localStorage or JWT and prefill form
  useEffect(() => {
    try {
      const rawUser = localStorage.getItem("auth_user");
      let user: any = rawUser ? JSON.parse(rawUser) : null;
      if (!user) {
        const token = localStorage.getItem("auth_token");
        const payload = token ? decodeJwtPayload(token) : null;
        if (payload) {
          user = { id: payload.sub, email: payload.email };
        }
      }
      if (user) {
        setCurrentUser(user);
        const curr = form.getValues();
        form.reset({
          ...curr,
          name: user.name ?? curr.name,
          email: user.email ?? curr.email,
          userId: user.id ?? curr.userId,
        });
      }
    } catch {
      // ignore any parse errors
    }
  }, [form]);

  const onSubmit = async (data: ProfileFormData) => {
    try {
      const token = localStorage.getItem("auth_token");
      if (!token) {
        toast({
          title: "Error",
          description: "You are not authenticated.",
          variant: "destructive",
        });
        return;
      }

      const response = await fetch("/api/auth/me", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ name: data.name }),
      });

      if (!response.ok) {
        throw new Error("Failed to update profile");
      }

      const updatedUser = await response.json();

      // Update user in localStorage
      const rawUser = localStorage.getItem("auth_user");
      if (rawUser) {
        const user = JSON.parse(rawUser);
        user.name = updatedUser.name;
        localStorage.setItem("auth_user", JSON.stringify(user));
      }

      // Also update the state
      setCurrentUser(prev => prev ? { ...prev, name: updatedUser.name } : null);

      toast({
        title: "Settings Updated",
        description: "Your profile settings have been saved successfully.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: (error as Error).message || "An unknown error occurred.",
        variant: "destructive",
      });
    }
  };

  const handleExportData = () => {
    toast({
      title: "Export Started",
      description:
        "Your data export will be ready shortly. You'll receive an email when it's complete.",
    });
  };

  const handleLogout = () => {
    try {
      localStorage.removeItem("auth_token");
      localStorage.removeItem("auth_user");
    } catch {}
    setCurrentUser(null);
    toast({
      title: "Logged out",
      description: "You have been signed out.",
    });
    setLocation("/login");
  };

  return (
    <div className="flex h-screen bg-background">
      <Sidebar />

      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />

        <main className="flex-1 overflow-auto p-6">
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="max-w-4xl mx-auto space-y-8"
          >
            {/* Page Header */}
            <motion.div variants={itemVariants} className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
                <SettingsIcon className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-foreground">Settings</h1>
                <p className="text-muted-foreground">Manage your account preferences and configuration</p>
              </div>
            </motion.div>

            {/* Profile Settings */}
            <motion.div variants={itemVariants}>
              <Card data-testid="card-profile-settings">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <User className="h-5 w-5" />
                    <span>Profile Settings</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {currentUser && (
                    <div className="mb-6 text-sm text-muted-foreground">
                      Signed in as: <span className="font-medium">{currentUser.name || "(no name)"}</span> ({currentUser.email || "unknown"})
                      {currentUser.id && (
                        <div className="mt-1">User ID: <span className="font-mono text-xs">{currentUser.id}</span></div>
                      )}
                    </div>
                  )}
                  <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <FormField
                          control={form.control}
                          name="name"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Full Name</FormLabel>
                              <FormControl>
                                <Input {...field} data-testid="input-name" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="email"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Email Address</FormLabel>
                              <FormControl>
                                <Input type="email" {...field} data-testid="input-email" readOnly />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="userId"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>User ID</FormLabel>
                              <FormControl>
                                <Input {...field} data-testid="input-user-id" readOnly />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                                              </div>
                      <Button type="submit" data-testid="button-save-profile">
                        Save Changes
                      </Button>
                    </form>
                  </Form>
                </CardContent>
              </Card>
            </motion.div>

            {/* Appearance Settings */}
            <motion.div variants={itemVariants}>
              <Card data-testid="card-appearance-settings">
                <CardHeader>
                  <CardTitle>Appearance</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="theme-mode" className="text-sm font-medium">
                        Theme Mode
                      </Label>
                      <p className="text-sm text-muted-foreground">Choose your preferred theme appearance</p>
                    </div>
                    <Select value={theme} onValueChange={(value: "light" | "dark") => setTheme(value)}>
                      <SelectTrigger className="w-[140px]" data-testid="select-theme">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="light">Dark</SelectItem>
                        <SelectItem value="dark">Light</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Notification Settings */}
            <motion.div variants={itemVariants}>
              <Card data-testid="card-notification-settings">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Bell className="h-5 w-5" />
                    <span>Notifications</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <Label htmlFor="email-notifications" className="text-sm font-medium">
                          Email Notifications
                        </Label>
                        <p className="text-sm text-muted-foreground">Receive email updates about your rankings</p>
                      </div>
                      <Switch
                        id="email-notifications"
                        checked={notifications.email}
                        onCheckedChange={(checked) => setNotifications((prev) => ({ ...prev, email: checked }))}
                        data-testid="switch-email-notifications"
                      />
                    </div>
                    <Separator />
                    <div className="flex items-center justify-between">
                      <div>
                        <Label htmlFor="push-notifications" className="text-sm font-medium">
                          Push Notifications
                        </Label>
                        <p className="text-sm text-muted-foreground">Get notified about important changes</p>
                      </div>
                      <Switch
                        id="push-notifications"
                        checked={notifications.push}
                        onCheckedChange={(checked) => setNotifications((prev) => ({ ...prev, push: checked }))}
                        data-testid="switch-push-notifications"
                      />
                    </div>
                    <Separator />
                    <div className="flex items-center justify-between">
                      <div>
                        <Label htmlFor="weekly-reports" className="text-sm font-medium">
                          Weekly Reports
                        </Label>
                        <p className="text-sm text-muted-foreground">Receive weekly summary reports</p>
                      </div>
                      <Switch
                        id="weekly-reports"
                        checked={notifications.weekly}
                        onCheckedChange={(checked) => setNotifications((prev) => ({ ...prev, weekly: checked }))}
                        data-testid="switch-weekly-reports"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Data & Privacy */}
            <motion.div variants={itemVariants}>
              <Card data-testid="card-data-privacy">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Database className="h-5 w-5" />
                    <span>Data & Privacy</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-sm font-medium">Export Data</Label>
                      <p className="text-sm text-muted-foreground">Download a copy of all your data</p>
                    </div>
                    <Button variant="outline" onClick={handleExportData} data-testid="button-export-data">
                      Export
                    </Button>
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-sm font-medium">Logout</Label>
                      <p className="text-sm text-muted-foreground">Sign out of your account</p>
                    </div>
                    <Button onClick={handleLogout} data-testid="button-logout" disabled={!currentUser}>
                      Logout
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </motion.div>
        </main>

        <Footer />
      </div>
    </div>
  );
}
