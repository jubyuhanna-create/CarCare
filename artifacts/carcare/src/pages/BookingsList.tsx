import { useListBookings } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar as CalendarIcon, MapPin, Car, Clock } from "lucide-react";
import { format } from "date-fns";
import { he } from "date-fns/locale";

export default function BookingsList() {
  const { data: bookings, isLoading } = useListBookings({ query: { queryKey: ["/api/bookings", { role: "user" }] } });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending": return <Badge variant="outline" className="bg-amber-50 text-amber-600 border-amber-200">ממתין</Badge>;
      case "confirmed": return <Badge variant="outline" className="bg-blue-50 text-blue-600 border-blue-200">אושר</Badge>;
      case "completed": return <Badge variant="outline" className="bg-green-50 text-green-600 border-green-200">הושלם</Badge>;
      case "rejected": return <Badge variant="outline" className="bg-red-50 text-red-600 border-red-200">נדחה</Badge>;
      case "cancelled": return <Badge variant="outline" className="bg-gray-50 text-gray-600 border-gray-200">בוטל</Badge>;
      default: return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">התורים שלי</h1>
      </div>

      {isLoading ? (
        <div className="text-center py-12 text-muted-foreground">טוען תורים...</div>
      ) : bookings?.length === 0 ? (
        <Card className="text-center py-12 border-dashed">
          <CardContent className="flex flex-col items-center space-y-4">
            <div className="p-4 bg-muted rounded-full">
              <CalendarIcon className="h-8 w-8 text-muted-foreground" />
            </div>
            <div className="space-y-2">
              <h3 className="text-xl font-semibold">אין לך תורים קרובים</h3>
              <p className="text-muted-foreground">ניתן לקבוע תור דרך עמוד המוסכים או עמוד הרכב</p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {bookings?.map((booking) => (
            <Card key={booking.id} className={booking.status === 'completed' || booking.status === 'cancelled' || booking.status === 'rejected' ? 'opacity-60' : ''}>
              <CardContent className="p-6">
                <div className="flex flex-col md:flex-row gap-4 md:items-center justify-between">
                  <div className="space-y-3 flex-1">
                    <div className="flex items-center gap-3">
                      <div className="bg-primary/10 p-3 rounded-full">
                        <CalendarIcon className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-lg">{format(new Date(booking.scheduledDate), "EEEE, d בMMMM yyyy", { locale: he })}</h3>
                        <div className="flex items-center text-sm text-muted-foreground mt-1">
                          <Clock className="h-3 w-3 ml-1" /> {format(new Date(booking.scheduledDate), "HH:mm")}
                        </div>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3 border-t">
                      <div className="flex items-start gap-2 text-sm">
                        <MapPin className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                        <div>
                          <span className="font-medium">{booking.garageName || 'מוסך'}</span>
                        </div>
                      </div>
                      <div className="flex items-start gap-2 text-sm">
                        <Car className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                        <div>
                          <span className="font-medium" dir="ltr">{booking.carInfo || 'רכב'}</span>
                        </div>
                      </div>
                    </div>
                    
                    {booking.notes && (
                      <div className="text-sm bg-muted/50 p-3 rounded-md mt-2">
                        <span className="font-medium">הערות: </span>{booking.notes}
                      </div>
                    )}
                  </div>
                  
                  <div className="flex flex-col items-end justify-between self-stretch pt-4 md:pt-0 border-t md:border-t-0 md:border-r pr-0 md:pr-6 mt-4 md:mt-0">
                    <div className="mb-auto font-medium text-sm text-muted-foreground text-left w-full md:text-right">
                      סטטוס
                    </div>
                    {getStatusBadge(booking.status)}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
