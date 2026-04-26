import { useParams, Link } from "wouter";
import { useState } from "react";
import { useGetGarage, useCreateBooking, useListCars, getListBookingsQueryKey } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Calendar as CalendarIcon, MapPin, Phone, Star, ChevronRight, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { he } from "date-fns/locale";
import { cn } from "@/lib/utils";

export default function GarageDetail() {
  const params = useParams<{ id: string }>();
  const id = parseInt(params.id || "0");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: garage, isLoading: loadingGarage } = useGetGarage(id, { query: { enabled: !!id } });
  const { data: cars } = useListCars();
  const createBooking = useCreateBooking();

  const [date, setDate] = useState<Date>();
  const [selectedCarId, setSelectedCarId] = useState("");
  const [notes, setNotes] = useState("");

  if (loadingGarage) return <div className="text-center py-12 text-muted-foreground">טוען נתונים...</div>;
  if (!garage) return <div className="text-center py-12">מוסך לא נמצא</div>;

  const handleBooking = () => {
    if (!date || !selectedCarId) {
      toast({ title: "שגיאה", description: "אנא בחר רכב ותאריך", variant: "destructive" });
      return;
    }

    createBooking.mutate(
      {
        data: {
          garageId: id,
          carId: parseInt(selectedCarId),
          scheduledDate: date.toISOString(),
          notes: notes
        }
      },
      {
        onSuccess: () => {
          toast({ title: "התור הוזמן בהצלחה!" });
          queryClient.invalidateQueries({ queryKey: getListBookingsQueryKey() });
          setDate(undefined);
          setSelectedCarId("");
          setNotes("");
        },
        onError: () => {
          toast({ title: "שגיאה", description: "לא הצלחנו להזמין תור", variant: "destructive" });
        }
      }
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-2 space-x-reverse">
        <Link href="/garages">
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <ChevronRight className="h-4 w-4" />
          </Button>
        </Link>
        <h1 className="text-3xl font-bold tracking-tight">{garage.name}</h1>
        {garage.rating && (
          <Badge variant="secondary" className="flex items-center gap-1 text-base h-8">
            <Star className="h-4 w-4 fill-primary text-primary" />
            {garage.rating.toFixed(1)}
          </Badge>
        )}
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>פרטי מוסך</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center text-muted-foreground">
                <MapPin className="h-5 w-5 mr-3 ml-2 text-primary" />
                {garage.address}, {garage.city}
              </div>
              <div className="flex items-center text-muted-foreground">
                <Phone className="h-5 w-5 mr-3 ml-2 text-primary" />
                <span dir="ltr">{garage.phone}</span>
              </div>
              {garage.description && (
                <div className="mt-4 pt-4 border-t text-sm">
                  {garage.description}
                </div>
              )}
              {garage.specializations && garage.specializations.length > 0 && (
                <div className="mt-4 pt-4 border-t">
                  <h4 className="font-medium mb-2 text-sm text-muted-foreground">התמחויות</h4>
                  <div className="flex flex-wrap gap-2">
                    {garage.specializations.map(spec => (
                      <Badge key={spec} variant="outline">{spec}</Badge>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div>
          <Card>
            <CardHeader>
              <CardTitle>הזמן תור</CardTitle>
              <CardDescription>בחר רכב ותאריך לטיפול</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>רכב</Label>
                <Select value={selectedCarId} onValueChange={setSelectedCarId}>
                  <SelectTrigger>
                    <SelectValue placeholder="בחר רכב..." />
                  </SelectTrigger>
                  <SelectContent>
                    {cars?.map((car) => (
                      <SelectItem key={car.id} value={car.id.toString()}>
                        {car.make} {car.model} ({car.licensePlate})
                      </SelectItem>
                    ))}
                    {cars?.length === 0 && (
                      <SelectItem value="none" disabled>אין רכבים בחשבון</SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2 flex flex-col">
                <Label>תאריך</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant={"outline"}
                      className={cn(
                        "w-full justify-start text-right font-normal",
                        !date && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4 ml-2" />
                      {date ? format(date, "PPP", { locale: he }) : <span>בחר תאריך...</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={date}
                      onSelect={setDate}
                      initialFocus
                      disabled={(date) => date < new Date()}
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="space-y-2">
                <Label>הערות (אופציונלי)</Label>
                <Textarea 
                  placeholder="מה הבעיה? או איזה טיפול נדרש?"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </div>

              <Button 
                className="w-full mt-4" 
                onClick={handleBooking}
                disabled={createBooking.isPending || !selectedCarId || !date}
              >
                {createBooking.isPending ? "מזמין..." : "קבע תור"}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
