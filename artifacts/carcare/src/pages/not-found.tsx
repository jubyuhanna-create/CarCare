import { Card, CardContent } from "@/components/ui/card";
import { AlertCircle } from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-muted/30 p-4">
      <Card className="w-full max-w-md mx-auto text-center border-dashed">
        <CardContent className="pt-6 pb-8 flex flex-col items-center">
          <div className="p-4 bg-destructive/10 rounded-full mb-4">
            <AlertCircle className="h-8 w-8 text-destructive" />
          </div>
          <h1 className="text-2xl font-bold text-foreground mb-2">404 - העמוד לא נמצא</h1>
          <p className="text-muted-foreground mb-6">
            נראה שהלכת לאיבוד. העמוד שחיפשת לא קיים.
          </p>
          <Link href="/">
            <Button>חזרה לעמוד הראשי</Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
