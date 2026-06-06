import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Check, Trophy, Users, BarChart3, Shield } from 'lucide-react';

const plans = [
  { name: 'FREE', students: 50, coaches: 5, price: '₹0' },
  { name: 'PRO', students: 200, coaches: 20, price: '₹2,999/mo' },
  { name: 'PLUS', students: 'Unlimited', coaches: 'Unlimited', price: '₹7,999/mo' },
];

const features = [
  { icon: Users, title: 'Multi-Tenant', desc: 'Unlimited academies with complete data isolation' },
  { icon: Trophy, title: 'Performance Tracking', desc: 'Dynamic attributes, radar charts, progress history' },
  { icon: BarChart3, title: 'Revenue Analytics', desc: 'Fee management, receipts, accounts dashboard' },
  { icon: Shield, title: 'Enterprise Security', desc: 'JWT auth, RBAC, tenant-scoped queries at every layer' },
];

export function LandingPage() {
  return (
    <div className="min-h-screen">
      <header className="border-b px-6 py-4 flex items-center justify-between max-w-7xl mx-auto">
        <h1 className="text-2xl font-bold text-[var(--color-primary)]">SAMS</h1>
        <div className="flex gap-3">
          <Link to="/login"><Button variant="ghost">Login</Button></Link>
          <Link to="/login"><Button>Get Started</Button></Link>
        </div>
      </header>

      <section className="max-w-7xl mx-auto px-6 py-20 text-center">
        <h2 className="text-5xl font-bold tracking-tight mb-6">
          Sports Academy Management System
        </h2>
        <p className="text-xl text-[var(--color-muted-foreground)] max-w-2xl mx-auto mb-8">
          The all-in-one SaaS platform to manage students, coaches, fees, attendance, and performance — built for multi-academy scale.
        </p>
        <Link to="/login"><Button size="lg">Start Free Trial</Button></Link>
      </section>

      <section className="max-w-7xl mx-auto px-6 py-16 grid md:grid-cols-2 lg:grid-cols-4 gap-6">
        {features.map((f) => (
          <Card key={f.title}>
            <CardHeader>
              <f.icon className="h-8 w-8 text-[var(--color-primary)] mb-2" />
              <CardTitle className="text-lg">{f.title}</CardTitle>
              <CardDescription>{f.desc}</CardDescription>
            </CardHeader>
          </Card>
        ))}
      </section>

      <section className="max-w-7xl mx-auto px-6 py-16">
        <h3 className="text-3xl font-bold text-center mb-10">Subscription Plans</h3>
        <div className="grid md:grid-cols-3 gap-6">
          {plans.map((plan) => (
            <Card key={plan.name} className={plan.name === 'PRO' ? 'border-[var(--color-primary)] border-2' : ''}>
              <CardHeader>
                <CardTitle>{plan.name}</CardTitle>
                <CardDescription className="text-2xl font-bold text-foreground">{plan.price}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <p className="flex items-center gap-2 text-sm"><Check className="h-4 w-4 text-green-600" /> {plan.students} Students</p>
                <p className="flex items-center gap-2 text-sm"><Check className="h-4 w-4 text-green-600" /> {plan.coaches} Coaches</p>
                <p className="flex items-center gap-2 text-sm"><Check className="h-4 w-4 text-green-600" /> All Core Modules</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <footer className="border-t py-8 text-center text-sm text-[var(--color-muted-foreground)]">
        © 2026 SAMS — Sports Academy Management System
      </footer>
    </div>
  );
}
