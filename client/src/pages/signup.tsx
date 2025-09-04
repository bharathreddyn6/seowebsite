import { useState } from "react";
import { useLocation } from "wouter";
import { Helmet } from "react-helmet-async";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";

export default function SignupPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ email: "", password: "", name: "" });

  const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      // TODO: replace with real API call to /api/auth/signup
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({ message: "Signup failed" }));
        throw new Error(data.message || "Signup failed");
      }
      toast({ title: "Account created", description: "You can now log in." });
      setLocation("/login");
    } catch (err: any) {
      toast({ title: "Signup failed", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen grid grid-cols-1 lg:grid-cols-2">
      <Helmet>
        <title>Sign Up | SEO Dashboard</title>
      </Helmet>

      <div className="relative hidden lg:flex flex-col gap-6 p-10 text-white overflow-hidden bg-gradient-to-br from-indigo-700 via-purple-700 to-pink-600">
        <div className="absolute inset-0 opacity-30 [background:radial-gradient(80%_50%_at_30%_20%,rgba(255,255,255,.4),rgba(255,255,255,0)),radial-gradient(60%_40%_at_80%_0%,rgba(255,255,255,.3),rgba(255,255,255,0))]" />
        <div className="relative z-10">
          <h1 className="text-3xl font-bold tracking-tight">SEO Dashboard</h1>
          <p className="mt-2 text-white/80">Set up your account to start tracking rankings and performance.</p>
        </div>
        <div className="relative z-10 mt-auto">
          <div className="space-y-4">
            <div className="backdrop-blur-md/30 rounded-xl border border-white/20 p-4 bg-white/10">
              <p className="text-sm leading-relaxed">Join marketers and developers using a unified dashboard.</p>
            </div>
            <div className="backdrop-blur-md/30 rounded-xl border border-white/20 p-4 bg-white/10">
              <p className="text-sm leading-relaxed">No clutter, only the metrics that matter.</p>
            </div>
          </div>
          <p className="mt-8 text-xs text-white/70">© {new Date().getFullYear()} SEO Dashboard</p>
        </div>
      </div>

      <div className="flex items-center justify-center p-6">
        <Card className="w-full max-w-md shadow-lg">
          <CardHeader>
            <CardTitle className="text-2xl">Create your account</CardTitle>
            <CardDescription>It takes less than a minute</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={onSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input id="name" name="name" value={form.name} onChange={onChange} required placeholder="Jane Doe" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" name="email" type="email" value={form.email} onChange={onChange} required placeholder="you@example.com" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input id="password" name="password" type="password" value={form.password} onChange={onChange} required placeholder="••••••••" />
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Creating..." : "Create account"}
              </Button>
              <div className="text-sm text-muted-foreground text-center">
                Already have an account? <a href="/login" className="underline">Log in</a>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}