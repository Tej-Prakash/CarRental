
import AdminPageHeader from '@/components/admin/AdminPageHeader';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { DollarSign, Users, Car, GanttChartSquare } from 'lucide-react';

// Mock stats for dashboard
const stats = [
  { title: 'Total Revenue', value: '$12,500', icon: DollarSign, color: 'text-primary' },
  { title: 'Active Users', value: '150', icon: Users, color: 'text-accent' },
  { title: 'Cars Listed', value: '25', icon: Car, color: 'text-primary' },
  { title: 'Pending Bookings', value: '5', icon: GanttChartSquare, color: 'text-accent' },
];

export default function AdminDashboardPage() {
  return (
    <div>
      <AdminPageHeader title="Dashboard" description="Overview of your car rental business." />
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.title} className="shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.title}
              </CardTitle>
              <stat.icon className={`h-5 w-5 ${stat.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              {/* <p className="text-xs text-muted-foreground">+20.1% from last month</p> */}
            </CardContent>
          </Card>
        ))}
      </div>
      <div className="mt-6 grid gap-6 md:grid-cols-2">
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle>Recent Bookings</CardTitle>
            <CardDescription>A quick look at the latest bookings.</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">List of recent bookings will appear here.</p>
            {/* Placeholder for recent bookings list */}
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle>New Users</CardTitle>
             <CardDescription>Recently registered users.</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">List of new users will appear here.</p>
            {/* Placeholder for new users list */}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
