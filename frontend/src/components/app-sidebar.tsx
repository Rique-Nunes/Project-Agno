import Link from 'next/link';
import {
  Bell,
  Home,
  LineChart,
  Package,
  Settings,
  Users,
} from 'lucide-react';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Logo } from '@/components/icons';

const navItems = [
  { href: '#', icon: Home, label: 'Dashboard' },
  { href: '#', icon: Bell, label: 'Alerts', badge: '6' },
  { href: '#', icon: Package, label: 'Hosts' },
  { href: '#', icon: Users, label: 'Clients' },
  { href: '#', icon: LineChart, label: 'Reports' },
];

export function AppSidebar() {
  return (
    <nav className="hidden md:flex w-64 flex-col border-r bg-sidebar text-sidebar-foreground">
      <div className="flex h-16 items-center border-b px-6">
        <Link href="#" className="flex items-center gap-2 font-semibold">
          <Logo className="h-6 w-6 text-sidebar-primary" />
          <span>ZabbixAI</span>
        </Link>
      </div>
      <div className="flex-1 overflow-auto py-4">
        <nav className="grid items-start px-4 text-sm font-medium">
          {navItems.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              className={`flex items-center gap-3 rounded-lg px-3 py-2 transition-all hover:bg-sidebar-accent hover:text-sidebar-accent-foreground ${
                item.label === 'Dashboard'
                  ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                  : ''
              }`}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
              {item.badge && (
                <span className="ml-auto flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-sidebar-primary text-xs">
                  {item.badge}
                </span>
              )}
            </Link>
          ))}
        </nav>
      </div>
      <div className="mt-auto p-4">
        <Card className="bg-sidebar-accent/50 border-sidebar-border">
          <CardHeader className="p-4">
            <CardTitle>Upgrade to Pro</CardTitle>
            <CardDescription>
              Unlock all features and get unlimited access to our support team.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <Button size="sm" className="w-full bg-sidebar-primary hover:bg-sidebar-primary/90 text-sidebar-primary-foreground">
              Upgrade
            </Button>
          </CardContent>
        </Card>
        <Link href="#" className="mt-4 flex items-center gap-3 rounded-lg px-3 py-2 transition-all hover:bg-sidebar-accent hover:text-sidebar-accent-foreground">
          <Settings className="h-4 w-4" />
          Settings
        </Link>
      </div>
    </nav>
  );
}
