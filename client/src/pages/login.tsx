import { useState } from "react";
import { useLocation } from "wouter";
import { Helmet } from "react-helmet-async";
import { GoogleLogin, CredentialResponse } from "@react-oauth/google";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Eye, EyeOff, ArrowLeft, Mail, Lock } from "lucide-react";

export default function LoginPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [form, setForm] = useState({ email: "", password: "" });

  const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleGoogleSuccess = async (credentialResponse: CredentialResponse) => {
    setLoading(true);
    try {
      const res = await fetch("/api/auth/google", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: credentialResponse.credential }),
        credentials: "include",
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Google login failed");
      }

      if (data.token) {
        localStorage.setItem("auth_token", data.token);
      }
      if (data.user) {
        try {
          localStorage.setItem("auth_user", JSON.stringify(data.user));
        } catch {}
      }

      toast({
        title: "Welcome!",
        description: "You have been logged in successfully with Google.",
      });

      setLocation("/");
    } catch (err: any) {
      toast({
        title: "Google login failed",
        description: err.message || "An error occurred during Google login",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.email || !form.password) {
      toast({ 
        title: "Validation Error", 
        description: "Please fill in all fields", 
        variant: "destructive" 
      });
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
        credentials: "include",
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Login failed");
      }

      // Store token if provided
      if (data.token) {
        localStorage.setItem("auth_token", data.token);
      }
      // Store user object for header display
      if (data.user) {
        try {
          localStorage.setItem("auth_user", JSON.stringify(data.user));
        } catch {}
      }

      toast({ 
        title: "Welcome back!", 
        description: "You have been logged in successfully.",
      });
      
      // Redirect to dashboard
      setLocation("/");
    } catch (err: any) {
      toast({ 
        title: "Login failed", 
        description: err.message || "An error occurred during login", 
        variant: "destructive" 
      });
    } finally {
      setLoading(false);
    }
  };

  const goBack = () => {
    setLocation("/");
  };

  const goToSignup = () => {
    setLocation("/signup");
  };

  return (
    <div className="min-h-screen grid grid-cols-1 lg:grid-cols-2">
      <Helmet>
        <title>Login | SEO Dashboard</title>
        <meta name="description" content="Sign in to your SEO Dashboard account to access your analytics and rankings." />
      </Helmet>

      {/* Left Panel - Branding */}
      <div className="relative hidden lg:flex flex-col gap-6 p-10 text-white overflow-hidden bg-gradient-to-br from-indigo-700 via-purple-700 to-pink-600">
        <div className="absolute inset-0 opacity-30 [background:radial-gradient(80%_50%_at_30%_20%,rgba(255,255,255,.4),rgba(255,255,255,0)),radial-gradient(60%_40%_at_80%_0%,rgba(255,255,255,.3),rgba(255,255,255,0))]" />
        
        <div className="relative z-10">
          <button
            onClick={goBack}
            className="mb-6 flex items-center space-x-2 text-white/80 hover:text-white transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            <span className="text-sm">Back to Dashboard</span>
          </button>
          <h1 className="text-3xl font-bold tracking-tight">SEO Dashboard</h1>
          <p className="mt-2 text-white/80">Track SEO, brand and performance metrics in one place.</p>
        </div>

        <div className="relative z-10 mt-auto">
          <div className="space-y-4">
            <div className="backdrop-blur-md/30 rounded-xl border border-white/20 p-4 bg-white/10">
              <p className="text-sm leading-relaxed">Gain insights on rankings, keyword trends and competitor analysis with beautiful visualizations.</p>
            </div>
            <div className="backdrop-blur-md/30 rounded-xl border border-white/20 p-4 bg-white/10">
              <p className="text-sm leading-relaxed">Simple, fast and privacy-friendly. Your data stays yours.</p>
            </div>
          </div>
          <p className="mt-8 text-xs text-white/70">© {new Date().getFullYear()} SEO Dashboard</p>
        </div>
      </div>

      {/* Right Panel - Login Form */}
      <div className="flex items-center justify-center p-6 lg:p-8">
        <div className="w-full max-w-md space-y-6">
          {/* Mobile Back Button */}
          <div className="lg:hidden">
            <button
              onClick={goBack}
              className="flex items-center space-x-2 text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              <span className="text-sm">Back to Dashboard</span>
            </button>
          </div>

          <Card className="shadow-lg border-border/50">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl font-bold">Welcome back</CardTitle>
              <CardDescription>Sign in to access your dashboard</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={onSubmit} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-sm font-medium">
                    Email address
                  </Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      value={form.email}
                      onChange={onChange}
                      required
                      placeholder="you@example.com"
                      className="pl-10"
                      autoComplete="email"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password" className="text-sm font-medium">
                    Password
                  </Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="password"
                      name="password"
                      type={showPassword ? "text" : "password"}
                      value={form.password}
                      onChange={onChange}
                      required
                      placeholder="••••••••"
                      className="pl-10 pr-10"
                      autoComplete="current-password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <Button 
                  type="submit" 
                  className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700" 
                  disabled={loading}
                >
                  {loading ? "Signing in..." : "Sign in"}
                </Button>

                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-background px-2 text-muted-foreground">
                      Or continue with
                    </span>
                  </div>
                </div>

                <GoogleLogin
                  onSuccess={handleGoogleSuccess}
                  onError={() => {
                    toast({
                      title: "Google login failed",
                      description: "An error occurred during Google login",
                      variant: "destructive",
                    });
                  }}
                  useOneTap
                />

                <div className="text-center space-y-4">
                  <button 
                    type="button"
                    className="text-sm text-muted-foreground hover:text-primary transition-colors"
                  >
                    Forgot your password?
                  </button>
                  
                  <div className="text-sm text-muted-foreground">
                    Don&apos;t have an account?{" "}
                    <button
                      type="button"
                      onClick={goToSignup}
                      className="text-primary hover:underline font-medium"
                    >
                      Create one
                    </button>
                  </div>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}