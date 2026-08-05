import { Bell, Search, ChevronRight } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";

export function AppHeader({ breadcrumbs = [], portal = "cliente" }: { breadcrumbs?: string[]; portal?: "cliente" | "proveedor" | "interno" }) {
  const routeBase = `/${portal}`;
  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-border bg-background/80 px-6 backdrop-blur-md">
      <div className="flex items-center gap-2 text-sm">
        <Link to={`${routeBase}/dashboard`} className="text-muted-foreground hover:text-foreground">Inicio</Link>
        {breadcrumbs.map((crumb, i) => (
          <span key={i} className="flex items-center gap-2">
            <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/50" />
            <span className={i === breadcrumbs.length - 1 ? "font-medium text-foreground" : "text-muted-foreground"}>{crumb}</span>
          </span>
        ))}
      </div>
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" className="text-muted-foreground">
          <Search className="h-4 w-4" />
        </Button>
        <Link to={`${routeBase}/notificaciones`}>
          <Button variant="ghost" size="icon" className="relative text-muted-foreground">
            <Bell className="h-4 w-4" />
            <Badge className="absolute -right-0.5 -top-0.5 h-4 min-w-4 justify-center bg-destructive px-1 text-[10px]">3</Badge>
          </Button>
        </Link>
        <Avatar className="h-9 w-9 border-2 border-primary/20">
          <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">
            {portal === "cliente" ? "CM" : portal === "proveedor" ? "CS" : "AC"}
          </AvatarFallback>
        </Avatar>
      </div>
    </header>
  );
}
