import { useParams, Link } from "wouter";
import { useGetCar, useGetCarHealth, useListMaintenanceTasks, useListServiceRecords } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle, Car, CheckCircle2, ChevronRight, Clock, Info, ShieldAlert, History, CalendarDays } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";

export default function CarDetail() {
  const params = useParams<{ id: string }>();
  const id = parseInt(params.id || "0");

  const { data: car, isLoading: loadingCar } = useGetCar(id, { query: { enabled: !!id } });
  const { data: health, isLoading: loadingHealth } = useGetCarHealth(id, { query: { enabled: !!id } });
  const { data: tasks, isLoading: loadingTasks } = useListMaintenanceTasks({ carId: id }, { query: { enabled: !!id } });
  const { data: records, isLoading: loadingRecords } = useListServiceRecords({ carId: id }, { query: { enabled: !!id } });

  if (loadingCar || loadingHealth || loadingTasks) {
    return <div className="text-center py-12 text-muted-foreground">טוען נתונים...</div>;
  }

  if (!car) {
    return <div className="text-center py-12">רכב לא נמצא</div>;
  }

  const criticalTasks = tasks?.filter(t => t.urgency === "critical") || [];
  const soonTasks = tasks?.filter(t => t.urgency === "soon") || [];
  const routineTasks = tasks?.filter(t => t.urgency === "routine") || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-2 space-x-reverse">
        <Link href="/cars">
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <ChevronRight className="h-4 w-4" />
          </Button>
        </Link>
        <h1 className="text-3xl font-bold tracking-tight">{car.make} {car.model}</h1>
        <Badge variant="outline" className="text-base" dir="ltr">{car.licensePlate}</Badge>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="md:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle>מצב הרכב</CardTitle>
            <ShieldAlert className={`h-5 w-5 ${health?.score && health.score >= 80 ? 'text-green-500' : health?.score && health.score >= 60 ? 'text-amber-500' : 'text-destructive'}`} />
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-6">
              <div className={`text-5xl font-bold ${health?.score && health.score >= 80 ? 'text-green-500' : health?.score && health.score >= 60 ? 'text-amber-500' : 'text-destructive'}`}>
                {health?.score || 0}
                <span className="text-lg text-muted-foreground font-normal">/100</span>
              </div>
              <div className="space-y-1">
                <p className="font-medium text-lg">
                  {health?.status === 'excellent' ? 'מצוין' : 
                   health?.status === 'good' ? 'טוב' : 
                   health?.status === 'fair' ? 'סביר' : 
                   health?.status === 'poor' ? 'דורש התייחסות' : 'אין נתונים'}
                </p>
                <p className="text-sm text-muted-foreground">
                  {health?.criticalCount ? `${health.criticalCount} בעיות דחופות` : 'אין בעיות דחופות'}
                </p>
              </div>
            </div>
            
            <div className="mt-6 flex justify-between items-center text-sm border-t pt-4">
              <span className="text-muted-foreground">ק״מ נוכחי</span>
              <span className="font-medium">{car.currentMileage || 0} ק״מ</span>
            </div>
            <div className="flex justify-between items-center text-sm mt-2">
              <span className="text-muted-foreground">ק״מ שנתי מוערך</span>
              <span className="font-medium">{car.yearlyMileage || 0} ק״מ</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>פעולות מהירות</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <Link href="/garages">
              <Button className="w-full justify-start">
                <CalendarDays className="mr-2 h-4 w-4" />
                הזמן תור למוסך
              </Button>
            </Link>
            <Link href={`/service-records/${car.id}`}>
              <Button variant="outline" className="w-full justify-start">
                <History className="mr-2 h-4 w-4" />
                היסטוריית טיפולים
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="tasks" className="w-full">
        <TabsList className="w-full justify-start border-b rounded-none h-auto bg-transparent p-0">
          <TabsTrigger value="tasks" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent">
            משימות תחזוקה
          </TabsTrigger>
          <TabsTrigger value="history" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent">
            היסטוריית טיפולים
          </TabsTrigger>
          <TabsTrigger value="details" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent">
            פרטי רכב
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="tasks" className="pt-6">
          <div className="space-y-6">
            {criticalTasks.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-lg font-medium text-destructive flex items-center">
                  <AlertTriangle className="h-5 w-5 mr-2 ml-1" />
                  דחוף
                </h3>
                {criticalTasks.map(task => (
                  <TaskCard key={task.id} task={task} icon={AlertTriangle} iconColor="text-destructive" />
                ))}
              </div>
            )}
            
            {soonTasks.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-lg font-medium text-amber-500 flex items-center">
                  <Clock className="h-5 w-5 mr-2 ml-1" />
                  בקרוב
                </h3>
                {soonTasks.map(task => (
                  <TaskCard key={task.id} task={task} icon={Clock} iconColor="text-amber-500" />
                ))}
              </div>
            )}
            
            {routineTasks.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-lg font-medium text-green-500 flex items-center">
                  <CheckCircle2 className="h-5 w-5 mr-2 ml-1" />
                  שגרתי
                </h3>
                {routineTasks.map(task => (
                  <TaskCard key={task.id} task={task} icon={CheckCircle2} iconColor="text-green-500" />
                ))}
              </div>
            )}

            {tasks?.length === 0 && (
              <div className="text-center py-12 text-muted-foreground border rounded-lg">
                <CheckCircle2 className="h-8 w-8 mx-auto mb-3 text-green-500 opacity-50" />
                <p>אין משימות תחזוקה כרגע. סע בדרכים טובות!</p>
              </div>
            )}
          </div>
        </TabsContent>
        
        <TabsContent value="history" className="pt-6">
          {loadingRecords ? (
            <p>טוען...</p>
          ) : records?.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground border rounded-lg">
              <History className="h-8 w-8 mx-auto mb-3 opacity-50" />
              <p>אין היסטוריית טיפולים לרכב זה</p>
            </div>
          ) : (
            <div className="space-y-4">
              {records?.slice(0, 5).map(record => (
                <Card key={record.id}>
                  <CardHeader className="pb-2">
                    <div className="flex justify-between">
                      <CardTitle className="text-lg">{record.title}</CardTitle>
                      <span className="text-sm text-muted-foreground">{new Date(record.serviceDate).toLocaleDateString('he-IL')}</span>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm">{record.description || 'אין פירוט'}</p>
                    <div className="flex gap-4 mt-4 text-sm text-muted-foreground">
                      {record.garageName && <span>מוסך: {record.garageName}</span>}
                      {record.cost && <span>עלות: ₪{record.cost}</span>}
                      {record.mileageAtService && <span>ק״מ: {record.mileageAtService}</span>}
                    </div>
                  </CardContent>
                </Card>
              ))}
              {records && records.length > 5 && (
                <Link href={`/service-records/${car.id}`}>
                  <Button variant="outline" className="w-full">הצג את כל ההיסטוריה</Button>
                </Link>
              )}
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="details" className="pt-6">
          <Card>
            <CardContent className="pt-6">
              <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-6">
                <div className="sm:col-span-1">
                  <dt className="text-sm font-medium text-muted-foreground">יצרן</dt>
                  <dd className="mt-1 text-sm text-foreground">{car.make}</dd>
                </div>
                <div className="sm:col-span-1">
                  <dt className="text-sm font-medium text-muted-foreground">דגם</dt>
                  <dd className="mt-1 text-sm text-foreground">{car.model}</dd>
                </div>
                <div className="sm:col-span-1">
                  <dt className="text-sm font-medium text-muted-foreground">שנת ייצור</dt>
                  <dd className="mt-1 text-sm text-foreground">{car.year}</dd>
                </div>
                <div className="sm:col-span-1">
                  <dt className="text-sm font-medium text-muted-foreground">מספר רישוי</dt>
                  <dd className="mt-1 text-sm text-foreground" dir="ltr">{car.licensePlate}</dd>
                </div>
                <div className="sm:col-span-1">
                  <dt className="text-sm font-medium text-muted-foreground">צבע</dt>
                  <dd className="mt-1 text-sm text-foreground">{car.color || 'לא צוין'}</dd>
                </div>
                <div className="sm:col-span-1">
                  <dt className="text-sm font-medium text-muted-foreground">סוג מנוע</dt>
                  <dd className="mt-1 text-sm text-foreground">{car.engineType || 'לא צוין'}</dd>
                </div>
              </dl>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function TaskCard({ task, icon: Icon, iconColor }: { task: any, icon: any, iconColor: string }) {
  return (
    <Card>
      <CardContent className="p-4 flex items-start gap-4">
        <Icon className={`h-6 w-6 mt-1 ${iconColor}`} />
        <div className="flex-1">
          <h4 className="font-semibold">{task.title}</h4>
          <p className="text-sm text-muted-foreground mt-1">{task.description}</p>
          <div className="flex gap-4 mt-3 text-xs font-medium bg-muted w-max px-3 py-1 rounded-md">
            {task.dueInKm && <span>עוד {task.dueInKm} ק״מ</span>}
            {task.dueDate && <span>עד {new Date(task.dueDate).toLocaleDateString('he-IL')}</span>}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
