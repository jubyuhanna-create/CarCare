import { useListCars, useCreateCar, getListCarsQueryKey, useLookupCarByPlate } from "@workspace/api-client-react";
import { useState } from "react";
import { Link } from "wouter";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Car, Plus, Search, ChevronLeft } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

export default function CarsList() {
  const { data: cars, isLoading } = useListCars();
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">הרכבים שלי</h1>
        <AddCarDialog />
      </div>

      {isLoading ? (
        <div className="text-center py-12 text-muted-foreground">טוען רכבים...</div>
      ) : cars?.length === 0 ? (
        <Card className="text-center py-12 border-dashed">
          <CardContent className="flex flex-col items-center space-y-4">
            <div className="p-4 bg-primary/10 rounded-full">
              <Car className="h-8 w-8 text-primary" />
            </div>
            <div className="space-y-2">
              <h3 className="text-xl font-semibold">אין לך רכבים עדיין</h3>
              <p className="text-muted-foreground">הוסף את הרכב הראשון שלך כדי להתחיל לעקוב אחרי טיפולים</p>
            </div>
            <AddCarDialog buttonVariant="default" />
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {cars?.map((car) => (
            <Link key={car.id} href={`/cars/${car.id}`}>
              <Card className="cursor-pointer hover:border-primary/50 transition-colors h-full flex flex-col">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-xl">{car.make} {car.model}</CardTitle>
                  <Car className="h-5 w-5 text-muted-foreground" />
                </CardHeader>
                <CardContent className="flex-1">
                  <div className="space-y-2 mt-4">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">מספר רישוי</span>
                      <span className="font-medium bg-muted px-2 py-0.5 rounded" dir="ltr">{car.licensePlate}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">שנה</span>
                      <span className="font-medium">{car.year}</span>
                    </div>
                    {car.healthScore !== null && (
                      <div className="flex justify-between text-sm items-center mt-4 pt-4 border-t">
                        <span className="text-muted-foreground">ציון בריאות</span>
                        <span className={`font-bold ${car.healthScore >= 80 ? 'text-green-500' : car.healthScore >= 60 ? 'text-amber-500' : 'text-destructive'}`}>
                          {car.healthScore}/100
                        </span>
                      </div>
                    )}
                  </div>
                </CardContent>
                <CardFooter className="pt-0 justify-end">
                  <span className="text-sm text-primary flex items-center">
                    לפרטים <ChevronLeft className="h-4 w-4 ml-1" />
                  </span>
                </CardFooter>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

function AddCarDialog({ buttonVariant = "outline" }: { buttonVariant?: "default" | "outline" }) {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(1);
  const [plate, setPlate] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // State for car data
  const [carData, setCarData] = useState({
    licensePlate: "",
    make: "",
    model: "",
    year: new Date().getFullYear(),
    color: "",
    engineType: "",
    yearlyMileage: 15000,
    currentMileage: 0
  });

  const [yearlyMileageTier, setYearlyMileageTier] = useState("15000");
  const [customMileage, setCustomMileage] = useState("");

  const lookupCar = useLookupCarByPlate();
  const createCar = useCreateCar();

  const handleLookup = () => {
    if (!plate || plate.length < 5) {
      toast({ title: "שגיאה", description: "אנא הזן מספר רישוי תקין", variant: "destructive" });
      return;
    }
    
    lookupCar.mutate(
      { plate },
      {
        onSuccess: (data) => {
          setCarData(prev => ({
            ...prev,
            licensePlate: data.licensePlate,
            make: data.make,
            model: data.model,
            year: data.year,
            color: data.color || "",
            engineType: data.engineType || ""
          }));
          setStep(2);
        },
        onError: () => {
          toast({ title: "שגיאה", description: "לא הצלחנו למצוא את הרכב. אנא הזן פרטים ידנית.", variant: "destructive" });
          setCarData(prev => ({ ...prev, licensePlate: plate }));
          setStep(2);
        }
      }
    );
  };

  const handleCreate = () => {
    const finalMileage = customMileage ? parseInt(customMileage) : parseInt(yearlyMileageTier);
    
    createCar.mutate(
      { data: { ...carData, yearlyMileage: finalMileage } },
      {
        onSuccess: () => {
          toast({ title: "הרכב נוסף בהצלחה!" });
          queryClient.invalidateQueries({ queryKey: getListCarsQueryKey() });
          setOpen(false);
          setStep(1);
          setPlate("");
          setCustomMileage("");
        },
        onError: () => {
          toast({ title: "שגיאה", description: "לא הצלחנו להוסיף את הרכב", variant: "destructive" });
        }
      }
    );
  };

  const resetState = (isOpen: boolean) => {
    setOpen(isOpen);
    if (!isOpen) {
      setTimeout(() => {
        setStep(1);
        setPlate("");
        setCarData({
          licensePlate: "", make: "", model: "", year: new Date().getFullYear(), color: "", engineType: "", yearlyMileage: 15000, currentMileage: 0
        });
      }, 300);
    }
  };

  return (
    <Dialog open={open} onOpenChange={resetState}>
      <DialogTrigger asChild>
        <Button variant={buttonVariant}>
          <Plus className="mr-2 h-4 w-4" />
          הוסף רכב
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>הוסף רכב חדש</DialogTitle>
          <DialogDescription>
            {step === 1 && "הזן מספר רישוי כדי לאתר את הרכב."}
            {step === 2 && "אשר את פרטי הרכב."}
            {step === 3 && "כמה אתה נוסע בשנה?"}
          </DialogDescription>
        </DialogHeader>

        {step === 1 && (
          <div className="grid gap-4 py-4">
            <div className="space-y-2 text-center">
              <Label htmlFor="plate" className="text-base">מספר לוחית רישוי</Label>
              <Input
                id="plate"
                placeholder="123-45-678"
                value={plate}
                onChange={(e) => setPlate(e.target.value)}
                className="text-center text-xl tracking-widest font-mono"
                dir="ltr"
              />
            </div>
            <Button onClick={handleLookup} disabled={lookupCar.isPending} className="w-full">
              {lookupCar.isPending ? "מחפש..." : (
                <>
                  <Search className="mr-2 h-4 w-4" /> חפש רכב
                </>
              )}
            </Button>
          </div>
        )}

        {step === 2 && (
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="make">יצרן</Label>
                <Input id="make" value={carData.make} onChange={e => setCarData({...carData, make: e.target.value})} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="model">דגם</Label>
                <Input id="model" value={carData.model} onChange={e => setCarData({...carData, model: e.target.value})} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="year">שנה</Label>
                <Input id="year" type="number" value={carData.year} onChange={e => setCarData({...carData, year: parseInt(e.target.value)})} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="licensePlate">לוחית רישוי</Label>
                <Input id="licensePlate" value={carData.licensePlate} onChange={e => setCarData({...carData, licensePlate: e.target.value})} dir="ltr" />
              </div>
            </div>
            <DialogFooter className="flex flex-row justify-between w-full sm:justify-between mt-4">
              <Button variant="outline" onClick={() => setStep(1)}>חזור</Button>
              <Button onClick={() => setStep(3)}>המשך</Button>
            </DialogFooter>
          </div>
        )}

        {step === 3 && (
          <div className="grid gap-4 py-4">
            <RadioGroup value={yearlyMileageTier} onValueChange={setYearlyMileageTier} className="grid grid-cols-2 gap-4">
              <div>
                <RadioGroupItem value="8000" id="m1" className="peer sr-only" />
                <Label htmlFor="m1" className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/5 cursor-pointer">
                  <span className="text-sm font-medium">פחות מ-10,000 ק״מ</span>
                </Label>
              </div>
              <div>
                <RadioGroupItem value="12500" id="m2" className="peer sr-only" />
                <Label htmlFor="m2" className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/5 cursor-pointer">
                  <span className="text-sm font-medium">10,000–15,000 ק״מ</span>
                </Label>
              </div>
              <div>
                <RadioGroupItem value="17500" id="m3" className="peer sr-only" />
                <Label htmlFor="m3" className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/5 cursor-pointer">
                  <span className="text-sm font-medium">15,000–20,000 ק״מ</span>
                </Label>
              </div>
              <div>
                <RadioGroupItem value="25000" id="m4" className="peer sr-only" />
                <Label htmlFor="m4" className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/5 cursor-pointer">
                  <span className="text-sm font-medium">יותר מ-20,000 ק״מ</span>
                </Label>
              </div>
            </RadioGroup>

            <div className="space-y-2 mt-4">
              <Label htmlFor="custom-mileage">הכנס מספר מדויק (אופציונלי)</Label>
              <Input
                id="custom-mileage"
                type="number"
                placeholder="לדוגמה: 14500"
                value={customMileage}
                onChange={(e) => {
                  setCustomMileage(e.target.value);
                  if (e.target.value) setYearlyMileageTier("");
                }}
              />
            </div>
            <DialogFooter className="flex flex-row justify-between w-full sm:justify-between mt-4">
              <Button variant="outline" onClick={() => setStep(2)}>חזור</Button>
              <Button onClick={handleCreate} disabled={createCar.isPending}>
                {createCar.isPending ? "שומר..." : "סיים"}
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
