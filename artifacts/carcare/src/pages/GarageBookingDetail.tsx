import { useParams, Link } from "wouter";
import { useState } from "react";
import { useGetBooking, useCreateServiceRecord, useUploadReceipt, getGetBookingQueryKey } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Calendar as CalendarIcon, MapPin, Car, CheckCircle2, ChevronRight, Upload, Clock, CreditCard } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { he } from "date-fns/locale";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";

export default function GarageBookingDetail() {
  const params = useParams<{ id: string }>();
  const id = parseInt(params.id || "0");
  
  const { data: booking, isLoading } = useGetBooking(id, { query: { enabled: !!id } });
  
  const createRecord = useCreateServiceRecord();
  const uploadReceipt = useUploadReceipt();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [cost, setCost] = useState("");
  const [mileage, setMileage] = useState("");
  const [receiptUrl, setReceiptUrl] = useState("");

  if (isLoading) return <div className="text-center py-12 text-muted-foreground">טוען פרטי תור...</div>;
  if (!booking) return <div className="text-center py-12">תור לא נמצא</div>;

  const handleAddRecord = () => {
    if (!title || !cost) {
      toast({ title: "שגיאה", description: "יש להזין לפחות כותרת ועלות", variant: "destructive" });
      return;
    }

    createRecord.mutate(
      {
        data: {
          carId: booking.carId,
          bookingId: booking.id,
          garageId: booking.garageId,
          title,
          description,
          cost: parseInt(cost),
          mileageAtService: mileage ? parseInt(mileage) : undefined,
          serviceDate: new Date().toISOString(),
        }
      },
      {
        onSuccess: () => {
          toast({ title: "היסטוריית טיפול נוספה בהצלחה" });
          setTitle("");
          setDescription("");
          setCost("");
          setMileage("");
          setReceiptUrl("");
          queryClient.invalidateQueries({ queryKey: getGetBookingQueryKey(id) });
        },
        onError: () => {
          toast({ title: "שגיאה", description: "לא הצלחנו להוסיף את היסטוריית הטיפול", variant: "destructive" });
        }
      }
    );
  };

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
      <div className="flex items-center space-x-2 space-x-reverse">
        <Link href="/garage-dashboard">
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <ChevronRight className="h-4 w-4" />
          </Button>
        </Link>
        <h1 className="text-3xl font-bold tracking-tight">פרטי תור</h1>
        {getStatusBadge(booking.status)}
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>פרטי טיפול ורכב</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start gap-3">
                <CalendarIcon className="h-5 w-5 text-primary mt-0.5 shrink-0" />
                <div>
                  <span className="font-medium text-lg">{format(new Date(booking.scheduledDate), "EEEE, d בMMMM yyyy", { locale: he })}</span>
                  <div className="text-muted-foreground flex items-center">
                    <Clock className="h-3 w-3 ml-1" /> {format(new Date(booking.scheduledDate), "HH:mm")}
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-3 pt-3 border-t">
                <Car className="h-5 w-5 text-muted-foreground shrink-0" />
                <span className="font-medium" dir="ltr">{booking.carInfo}</span>
              </div>
              
              {booking.notes && (
                <div className="pt-3 border-t">
                  <h4 className="font-medium mb-1 text-sm text-muted-foreground">הערות לקוח:</h4>
                  <p className="bg-muted p-3 rounded-md text-sm">{booking.notes}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div>
          <Card className={booking.status !== 'completed' ? 'opacity-50 pointer-events-none' : ''}>
            <CardHeader>
              <CardTitle>הוסף היסטוריית טיפול</CardTitle>
              <CardDescription>
                {booking.status !== 'completed' 
                  ? 'יש לסמן את התור כ"הושלם" כדי להוסיף היסטוריה' 
                  : 'תעד את הטיפול שבוצע לטובת היסטוריית הרכב'}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>כותרת הטיפול</Label>
                <Input 
                  placeholder="לדוגמה: טיפול 10,000, החלפת בלמים..." 
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </div>

              <div className="space-y-2 flex flex-col">
                <Label>פירוט העבודה שבוצעה</Label>
                <Textarea 
                  placeholder="פירוט חלפים, עבודה וכו'..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>עלות (₪)</Label>
                  <Input 
                    type="number"
                    placeholder="0" 
                    value={cost}
                    onChange={(e) => setCost(e.target.value)}
                    dir="ltr"
                  />
                </div>
                <div className="space-y-2">
                  <Label>ק״מ נוכחי</Label>
                  <Input 
                    type="number"
                    placeholder="אופציונלי" 
                    value={mileage}
                    onChange={(e) => setMileage(e.target.value)}
                    dir="ltr"
                  />
                </div>
              </div>

              <Button 
                className="w-full mt-4" 
                onClick={handleAddRecord}
                disabled={createRecord.isPending}
              >
                <CheckCircle2 className="mr-2 h-4 w-4" />
                {createRecord.isPending ? "שומר..." : "שמור טיפול"}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
