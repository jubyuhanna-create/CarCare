import { useGetGarageDashboardSummary, useListBookings, useUpdateBooking, getListBookingsQueryKey, getGetGarageDashboardSummaryQueryKey } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar as CalendarIcon, CheckCircle2, Clock, XCircle, ChevronLeft } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { he } from "date-fns/locale";
import { Link } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";

export default function GarageDashboard() {
  const { data: summary, isLoading: loadingSummary } = useGetGarageDashboardSummary();
  const { data: bookings, isLoading: loadingBookings } = useListBookings({ query: { queryKey: ["/api/bookings", { role: "garage" }] } });
  
  const updateBooking = useUpdateBooking();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  if (loadingSummary || loadingBookings) {
    return <div className="p-8 text-center text-muted-foreground">טוען נתונים...</div>;
  }

  const handleUpdateStatus = (id: number, status: "confirmed" | "rejected" | "completed" | "cancelled") => {
    updateBooking.mutate(
      { id, data: { status } },
      {
        onSuccess: () => {
          toast({ title: "סטטוס עודכן בהצלחה" });
          queryClient.invalidateQueries({ queryKey: getListBookingsQueryKey() });
          queryClient.invalidateQueries({ queryKey: getGetGarageDashboardSummaryQueryKey() });
        },
        onError: () => {
          toast({ title: "שגיאה", description: "לא הצלחנו לעדכן את הסטטוס", variant: "destructive" });
        }
      }
    );
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending": return <Badge variant="outline" className="bg-amber-50 text-amber-600 border-amber-200">ממתין לאישור</Badge>;
      case "confirmed": return <Badge variant="outline" className="bg-blue-50 text-blue-600 border-blue-200">מאושר</Badge>;
      case "completed": return <Badge variant="outline" className="bg-green-50 text-green-600 border-green-200">הושלם</Badge>;
      case "rejected": return <Badge variant="outline" className="bg-red-50 text-red-600 border-red-200">נדחה</Badge>;
      case "cancelled": return <Badge variant="outline" className="bg-gray-50 text-gray-600 border-gray-200">בוטל</Badge>;
      default: return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">ניהול מוסך</h1>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">תורים להיום</CardTitle>
            <CalendarIcon className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{summary?.todayBookings || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">ממתינים לאישור</CardTitle>
            <Clock className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-500">{summary?.pendingBookings || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">תורים מאושרים</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-500">{summary?.confirmedBookings || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">סה״כ תורים</CardTitle>
            <CalendarIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary?.totalBookings || 0}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>כל התורים</CardTitle>
          <CardDescription>ניהול התורים למוסך שלך</CardDescription>
        </CardHeader>
        <CardContent>
          {bookings?.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground border rounded-lg border-dashed">
              <CalendarIcon className="h-8 w-8 mx-auto mb-3 opacity-50" />
              <p>אין תורים כרגע</p>
            </div>
          ) : (
            <div className="space-y-4">
              {bookings?.map((booking) => (
                <div key={booking.id} className={`flex flex-col md:flex-row md:items-center justify-between p-4 border rounded-lg ${booking.status === 'completed' || booking.status === 'rejected' || booking.status === 'cancelled' ? 'bg-muted/30 opacity-70' : 'bg-card'}`}>
                  <div className="space-y-2 mb-4 md:mb-0">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-lg">{format(new Date(booking.scheduledDate), "d בMMM yyyy, HH:mm", { locale: he })}</span>
                      {getStatusBadge(booking.status)}
                    </div>
                    <div className="text-sm text-muted-foreground flex items-center gap-2">
                      <span className="font-medium text-foreground">{booking.carInfo}</span>
                    </div>
                    {booking.notes && (
                      <p className="text-sm mt-2 text-muted-foreground bg-muted p-2 rounded">
                        <span className="font-medium">הערות: </span>{booking.notes}
                      </p>
                    )}
                  </div>
                  
                  <div className="flex flex-wrap items-center gap-2">
                    {booking.status === 'pending' && (
                      <>
                        <Button 
                          size="sm" 
                          className="bg-blue-600 hover:bg-blue-700"
                          onClick={() => handleUpdateStatus(booking.id, "confirmed")}
                          disabled={updateBooking.isPending}
                        >
                          <CheckCircle2 className="mr-1 h-4 w-4" /> אשר תור
                        </Button>
                        <Button 
                          size="sm" 
                          variant="destructive"
                          onClick={() => handleUpdateStatus(booking.id, "rejected")}
                          disabled={updateBooking.isPending}
                        >
                          <XCircle className="mr-1 h-4 w-4" /> דחה תור
                        </Button>
                      </>
                    )}
                    
                    {booking.status === 'confirmed' && (
                      <Button 
                        size="sm" 
                        variant="default"
                        className="bg-green-600 hover:bg-green-700"
                        onClick={() => handleUpdateStatus(booking.id, "completed")}
                        disabled={updateBooking.isPending}
                      >
                        <CheckCircle2 className="mr-1 h-4 w-4" /> סמן כהושלם
                      </Button>
                    )}

                    <Link href={`/garage-dashboard/bookings/${booking.id}`}>
                      <Button size="sm" variant="outline">
                        לפרטים <ChevronLeft className="mr-1 h-4 w-4" />
                      </Button>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
