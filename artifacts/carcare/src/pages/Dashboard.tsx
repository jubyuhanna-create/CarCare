import { useGetDashboardSummary, useListCars, useListMaintenanceTasks } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Car, Wrench, Calendar, AlertTriangle, CheckCircle2, Clock } from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";

export default function Dashboard() {
  const { data: summary, isLoading: loadingSummary } = useGetDashboardSummary();
  const { data: cars, isLoading: loadingCars } = useListCars();
  
  // Just fetch tasks for the first car if it exists
  const firstCarId = cars?.[0]?.id;
  const { data: tasks, isLoading: loadingTasks } = useListMaintenanceTasks(
    { carId: firstCarId },
    { query: { enabled: !!firstCarId } }
  );

  if (loadingSummary || loadingCars) {
    return <div className="p-8 text-center text-muted-foreground">טוען נתונים...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">ראשי</h1>
        <Link href="/cars">
          <Button>
            <Car className="mr-2 h-4 w-4" />
            הוסף רכב
          </Button>
        </Link>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">הרכבים שלי</CardTitle>
            <Car className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary?.totalCars || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">טיפולים ממתינים</CardTitle>
            <Wrench className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{summary?.pendingMaintenance || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">תורים קרובים</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary?.upcomingBookings || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">טיפולים שבוצעו</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary?.recentServices || 0}</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>מצב הרכבים</CardTitle>
          </CardHeader>
          <CardContent>
            {cars?.length === 0 ? (
              <div className="text-center py-6 text-muted-foreground">
                <p>אין רכבים רשומים</p>
                <Link href="/cars">
                  <Button variant="link" className="mt-2">הוסף רכב עכשיו</Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {cars?.map((car) => (
                  <Link key={car.id} href={`/cars/${car.id}`}>
                    <div className="flex items-center p-4 border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer">
                      <div className="bg-primary/10 p-3 rounded-full ml-4">
                        <Car className="h-6 w-6 text-primary" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold">{car.make} {car.model}</h3>
                        <p className="text-sm text-muted-foreground">{car.licensePlate}</p>
                      </div>
                      <div className="text-left">
                        <div className="font-medium">{car.healthScore ? `${car.healthScore}/100` : 'אין נתונים'}</div>
                        <p className="text-xs text-muted-foreground">ציון בריאות</p>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>משימות קרובות (רכב ראשי)</CardTitle>
            <CardDescription>
              {firstCarId ? 'טיפולים שדורשים התייחסות' : 'הוסף רכב כדי לראות משימות'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loadingTasks ? (
              <p className="text-sm text-muted-foreground">טוען...</p>
            ) : tasks?.length === 0 ? (
              <p className="text-sm text-muted-foreground">אין משימות קרובות.</p>
            ) : (
              <div className="space-y-4">
                {tasks?.slice(0, 4).map((task) => (
                  <div key={task.id} className="flex items-start space-x-4 space-x-reverse border-b pb-4 last:border-0 last:pb-0">
                    {task.urgency === 'critical' ? (
                      <AlertTriangle className="h-5 w-5 text-destructive mt-0.5" />
                    ) : task.urgency === 'soon' ? (
                      <Clock className="h-5 w-5 text-amber-500 mt-0.5" />
                    ) : (
                      <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5" />
                    )}
                    <div className="flex-1 space-y-1">
                      <p className="font-medium leading-none">{task.title}</p>
                      <p className="text-sm text-muted-foreground">
                        {task.urgency === 'critical' ? 'דחוף' : task.urgency === 'soon' ? 'בקרוב' : 'שגרתי'}
                        {task.dueInKm ? ` • עוד ${task.dueInKm} ק״מ` : ''}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
