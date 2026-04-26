import { useParams, Link } from "wouter";
import { useListServiceRecords, useGetCar } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileDown, ChevronRight, History, Calendar, PenTool, Receipt } from "lucide-react";
import { format } from "date-fns";
import { he } from "date-fns/locale";

export default function ServiceHistory() {
  const params = useParams<{ carId: string }>();
  const carId = parseInt(params.carId || "0");

  const { data: car, isLoading: loadingCar } = useGetCar(carId, { query: { enabled: !!carId } });
  const { data: records, isLoading: loadingRecords } = useListServiceRecords(
    { carId },
    { query: { enabled: !!carId } }
  );

  const handleExport = () => {
    window.print();
  };

  if (loadingCar || loadingRecords) {
    return <div className="text-center py-12 text-muted-foreground">טוען היסטוריית טיפולים...</div>;
  }

  if (!car) {
    return <div className="text-center py-12">רכב לא נמצא</div>;
  }

  return (
    <div className="space-y-6 print:space-y-4">
      <div className="flex items-center justify-between print:hidden">
        <div className="flex items-center space-x-2 space-x-reverse">
          <Link href={`/cars/${carId}`}>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <ChevronRight className="h-4 w-4" />
            </Button>
          </Link>
          <h1 className="text-3xl font-bold tracking-tight">היסטוריית טיפולים</h1>
        </div>
        <Button variant="outline" onClick={handleExport}>
          <FileDown className="mr-2 h-4 w-4" />
          ייצא PDF
        </Button>
      </div>

      <div className="hidden print:block text-center mb-8">
        <h1 className="text-2xl font-bold">היסטוריית טיפולים - {car.make} {car.model}</h1>
        <p className="text-muted-foreground" dir="ltr">לוחית רישוי: {car.licensePlate}</p>
      </div>

      {records?.length === 0 ? (
        <Card className="text-center py-12 border-dashed print:hidden">
          <CardContent className="flex flex-col items-center space-y-4">
            <div className="p-4 bg-muted rounded-full">
              <History className="h-8 w-8 text-muted-foreground" />
            </div>
            <div className="space-y-2">
              <h3 className="text-xl font-semibold">אין היסטוריית טיפולים</h3>
              <p className="text-muted-foreground">לא נמצאו טיפולים רשומים לרכב זה</p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-muted before:to-transparent print:before:hidden">
          {records?.map((record) => (
            <div key={record.id} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active print:block print:mb-6">
              <div className="flex items-center justify-center w-10 h-10 rounded-full border border-white bg-slate-200 group-[.is-active]:bg-primary group-[.is-active]:text-primary-foreground text-slate-500 shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 shadow-sm print:hidden">
                <PenTool className="h-4 w-4" />
              </div>
              <Card className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] print:w-full print:shadow-none print:border-b print:rounded-none">
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start">
                    <CardTitle className="text-xl">{record.title}</CardTitle>
                    <span className="text-sm font-medium text-muted-foreground flex items-center bg-muted px-2 py-1 rounded-md">
                      <Calendar className="mr-1.5 h-3.5 w-3.5" />
                      {format(new Date(record.serviceDate), "d בMMM yyyy", { locale: he })}
                    </span>
                  </div>
                </CardHeader>
                <CardContent>
                  {record.description && (
                    <p className="text-sm text-muted-foreground mb-4">{record.description}</p>
                  )}
                  
                  <div className="grid grid-cols-2 gap-y-2 text-sm pt-4 border-t">
                    {record.garageName && (
                      <div className="flex flex-col">
                        <span className="text-muted-foreground text-xs">מוסך</span>
                        <span className="font-medium">{record.garageName}</span>
                      </div>
                    )}
                    {record.mileageAtService && (
                      <div className="flex flex-col">
                        <span className="text-muted-foreground text-xs">מד אוץ בטיפול</span>
                        <span className="font-medium">{record.mileageAtService.toLocaleString()} ק״מ</span>
                      </div>
                    )}
                    {record.cost && (
                      <div className="flex flex-col">
                        <span className="text-muted-foreground text-xs">עלות</span>
                        <span className="font-medium">₪{record.cost.toLocaleString()}</span>
                      </div>
                    )}
                    {record.receiptUrl && (
                      <div className="flex flex-col justify-center print:hidden">
                        <Button variant="link" className="h-auto p-0 justify-start" asChild>
                          <a href={record.receiptUrl} target="_blank" rel="noreferrer">
                            <Receipt className="mr-1 h-3 w-3" />
                            צפה בקבלה
                          </a>
                        </Button>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
