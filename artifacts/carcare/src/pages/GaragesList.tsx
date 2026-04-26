import { useState } from "react";
import { Link } from "wouter";
import { useListGarages } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MapPin, Star, Wrench, Search, ChevronLeft } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function GaragesList() {
  const [cityFilter, setCityFilter] = useState("");
  const { data: garages, isLoading } = useListGarages({ city: cityFilter || undefined });

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <h1 className="text-3xl font-bold tracking-tight">מוסכים</h1>
        <div className="relative max-w-sm w-full">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="חיפוש לפי עיר..." 
            className="pr-10"
            value={cityFilter}
            onChange={(e) => setCityFilter(e.target.value)}
          />
        </div>
      </div>

      {isLoading ? (
        <div className="text-center py-12 text-muted-foreground">טוען מוסכים...</div>
      ) : garages?.length === 0 ? (
        <Card className="text-center py-12 border-dashed">
          <CardContent className="flex flex-col items-center space-y-4">
            <div className="p-4 bg-muted rounded-full">
              <Wrench className="h-8 w-8 text-muted-foreground" />
            </div>
            <div className="space-y-2">
              <h3 className="text-xl font-semibold">לא נמצאו מוסכים</h3>
              <p className="text-muted-foreground">נסה לחפש בעיר אחרת</p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {garages?.map((garage) => (
            <Link key={garage.id} href={`/garages/${garage.id}`}>
              <Card className="cursor-pointer hover:border-primary/50 transition-colors h-full flex flex-col">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <CardTitle className="text-xl leading-tight">{garage.name}</CardTitle>
                    {garage.rating && (
                      <Badge variant="secondary" className="flex items-center gap-1 font-bold">
                        <Star className="h-3 w-3 fill-primary text-primary" />
                        {garage.rating.toFixed(1)}
                      </Badge>
                    )}
                  </div>
                  <CardDescription className="flex items-center mt-2">
                    <MapPin className="h-4 w-4 ml-1 flex-shrink-0" />
                    {garage.address}, {garage.city}
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex-1">
                  {garage.specializations && garage.specializations.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {garage.specializations.slice(0, 3).map(spec => (
                        <Badge key={spec} variant="outline">{spec}</Badge>
                      ))}
                      {garage.specializations.length > 3 && (
                        <Badge variant="outline">+{garage.specializations.length - 3}</Badge>
                      )}
                    </div>
                  )}
                </CardContent>
                <div className="p-6 pt-0 mt-auto text-sm text-primary flex items-center justify-end font-medium">
                  הזמן תור <ChevronLeft className="h-4 w-4 ml-1" />
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
