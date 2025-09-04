import { useState } from "react";
import { useLocation } from "wouter";
import { Helmet } from "react-helmet-async";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";

export default function LoginPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ email: "", password: "" });

  const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      // TODO: replace with real API call to /api/auth/login
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({ message: "Login failed" }));
        throw new Error(data.message || "Login failed");
      }
      toast({ title: "Logged in", description: "Welcome back!" });
      setLocation("/");
    } catch (err: any) {
      toast({ title: "Login failed", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen grid grid-cols-1 lg:grid-cols-2">
      <Helmet>
        <title>Login | SEO Dashboard</title>
      </Helmet>

      <div className="relative hidden lg:flex flex-col gap-6 p-10 text-white overflow-hidden bg-gradient-to-br from-indigo-700 via-purple-700 to-pink-600">
        <div className="absolute inset-0 opacity-30 [background:radial-gradient(80%_50%_at_30%_20%,rgba(255,255,255,.4),rgba(255,255,255,0)),radial-gradient(60%_40%_at_80%_0%,rgba(255,255,255,.3),rgba(255,255,255,0))]" />
        <div className="relative z-10">
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

      <div className="flex items-center justify-center p-6">
        <Card className="w-full max-w-md shadow-lg">
          <CardHeader>
            <CardTitle className="text-2xl">Welcome back</CardTitle>
            <CardDescription>Sign in to access your dashboard</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={onSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" name="email" type="email" value={form.email} onChange={onChange} required placeholder="you@example.com" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input id="password" name="password" type="password" value={form.password} onChange={onChange} required placeholder="••••••••" />
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Signing in..." : "Sign in"}
              </Button>
              <div className="text-sm text-muted-foreground text-center">
                Don&apos;t have an account? <a href="/signup" className="underline">Create one</a>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}