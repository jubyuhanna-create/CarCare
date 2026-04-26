import { useState } from "react";
import { useLocation } from "wouter";
import { useLogin, useRegister, useGetSession } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Car } from "lucide-react";
import { RegisterBodyRole } from "@workspace/api-client-react/src/generated/api.schemas";

export default function Home() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const login = useLogin();
  const register = useRegister();
  
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [role, setRole] = useState<RegisterBodyRole>("user");

  const onAuthSuccess = (data: any) => {
    localStorage.setItem("carcare_user", JSON.stringify(data.user));
    toast({ title: "התחברת בהצלחה" });
    if (data.user.role === "garage_owner") {
      setLocation("/garage-dashboard");
    } else {
      setLocation("/dashboard");
    }
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    login.mutate(
      { data: { email, password } },
      {
        onSuccess: onAuthSuccess,
        onError: () => toast({ title: "שגיאה", description: "פרטים שגויים", variant: "destructive" }),
      }
    );
  };

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    register.mutate(
      { data: { email, password, name, role } },
      {
        onSuccess: onAuthSuccess,
        onError: () => toast({ title: "שגיאה", description: "ההרשמה נכשלה", variant: "destructive" }),
      }
    );
  };

  return (
    <div className="min-h-screen bg-muted/30 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center mb-8">
        <div className="inline-flex items-center justify-center p-4 bg-primary/10 rounded-full mb-4">
          <Car className="h-8 w-8 text-primary" />
        </div>
        <h2 className="text-3xl font-extrabold text-foreground">CarCare IL</h2>
        <p className="mt-2 text-sm text-muted-foreground">הרופא האישי של הרכב שלך</p>
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <Card>
          <Tabs defaultValue="login" className="w-full">
            <CardHeader className="pb-4">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="login">התחברות</TabsTrigger>
                <TabsTrigger value="register">הרשמה</TabsTrigger>
              </TabsList>
            </CardHeader>
            <CardContent>
              <TabsContent value="login">
                <form onSubmit={handleLogin} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="login-email">אימייל</Label>
                    <Input id="login-email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} dir="ltr" className="text-left" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="login-password">סיסמה</Label>
                    <Input id="login-password" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} dir="ltr" className="text-left" />
                  </div>
                  <Button type="submit" className="w-full" disabled={login.isPending}>
                    {login.isPending ? "מתחבר..." : "התחבר"}
                  </Button>
                </form>
              </TabsContent>
              
              <TabsContent value="register">
                <form onSubmit={handleRegister} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="reg-name">שם מלא</Label>
                    <Input id="reg-name" required value={name} onChange={(e) => setName(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="reg-email">אימייל</Label>
                    <Input id="reg-email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} dir="ltr" className="text-left" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="reg-password">סיסמה</Label>
                    <Input id="reg-password" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} dir="ltr" className="text-left" />
                  </div>
                  <div className="space-y-2">
                    <Label>סוג משתמש</Label>
                    <div className="flex gap-4">
                      <label className="flex items-center gap-2">
                        <input type="radio" name="role" value="user" checked={role === "user"} onChange={() => setRole("user")} />
                        נהג פרטי
                      </label>
                      <label className="flex items-center gap-2">
                        <input type="radio" name="role" value="garage_owner" checked={role === "garage_owner"} onChange={() => setRole("garage_owner")} />
                        בעל מוסך
                      </label>
                    </div>
                  </div>
                  <Button type="submit" className="w-full" disabled={register.isPending}>
                    {register.isPending ? "נרשם..." : "הירשם"}
                  </Button>
                </form>
              </TabsContent>
            </CardContent>
          </Tabs>
        </Card>
      </div>
    </div>
  );
}
