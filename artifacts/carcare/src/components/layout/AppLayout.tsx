import { Link, useLocation } from "wouter";
import { useLogout, useGetSession } from "@workspace/api-client-react";
import { LogOut, Home, Car, Wrench, Calendar, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const { data: session } = useGetSession();
  const logout = useLogout();

  const storedUser = (() => {
    try { return JSON.parse(localStorage.getItem("carcare_user") || "null"); } catch { return null; }
  })();
  const isGarageOwner = (session?.user?.role ?? storedUser?.role) === "garage_owner";

  const userLinks = [
    { href: "/dashboard", label: "ראשי", icon: Home },
    { href: "/cars", label: "הרכבים שלי", icon: Car },
    { href: "/garages", label: "מוסכים", icon: Wrench },
    { href: "/bookings", label: "תורים", icon: Calendar },
  ];

  const garageLinks = [
    { href: "/garage-dashboard", label: "ראשי", icon: Home },
  ];

  const links = isGarageOwner ? garageLinks : userLinks;

  const handleLogout = () => {
    logout.mutate(undefined, {
      onSuccess: () => {
        localStorage.removeItem("carcare_user");
        window.location.href = "/";
      }
    });
  };

  const NavLinks = () => (
    <>
      {links.map((link) => {
        const Icon = link.icon;
        const isActive = location === link.href;
        return (
          <Link key={link.href} href={link.href}>
            <a className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${isActive ? "bg-primary/10 text-primary font-medium" : "text-muted-foreground hover:bg-muted hover:text-foreground"}`}>
              <Icon className="h-5 w-5" />
              {link.label}
            </a>
          </Link>
        );
      })}
    </>
  );

  return (
    <div className="min-h-screen bg-background flex flex-col md:flex-row">
      {/* Mobile header */}
      <div className="md:hidden flex items-center justify-between p-4 border-b bg-card">
        <span className="font-bold text-xl text-primary">CarCare IL</span>
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon">
              <Menu className="h-6 w-6" />
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-64 pt-10 flex flex-col gap-4">
            <NavLinks />
            <div className="mt-auto">
              <Button variant="ghost" className="w-full justify-start gap-3" onClick={handleLogout}>
                <LogOut className="h-5 w-5" />
                התנתק
              </Button>
            </div>
          </SheetContent>
        </Sheet>
      </div>

      {/* Desktop sidebar */}
      <aside className="hidden md:flex flex-col w-64 border-l bg-card p-4">
        <div className="mb-8 px-3">
          <span className="font-bold text-2xl text-primary">CarCare IL</span>
        </div>
        <nav className="flex flex-col gap-2 flex-1">
          <NavLinks />
        </nav>
        <div className="mt-auto pt-4 border-t">
          <Button variant="ghost" className="w-full justify-start gap-3" onClick={handleLogout}>
            <LogOut className="h-5 w-5" />
            התנתק
          </Button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 p-4 md:p-8 overflow-y-auto">
        <div className="max-w-5xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
