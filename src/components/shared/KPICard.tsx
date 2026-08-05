import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { ArrowUpRight, ArrowDownRight, type LucideIcon } from "lucide-react";

export function KPICard({
  label,
  value,
  icon: Icon,
  trend,
  trendUp = true,
  accent = "brand",
  subtitle,
}: {
  label: string;
  value: string;
  icon: LucideIcon;
  trend?: string;
  trendUp?: boolean;
  accent?: "brand" | "success" | "warning" | "info";
  subtitle?: string;
}) {
  const accentMap = {
    brand: "from-primary/20 to-primary/5 text-primary",
    success: "from-success/20 to-success/5 text-success",
    warning: "from-warning/20 to-warning/5 text-warning-foreground",
    info: "from-info/20 to-info/5 text-info",
  };
  return (
    <Card className="relative overflow-hidden p-5">
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p className="text-sm text-muted-foreground">{label}</p>
          <p className="text-2xl font-bold tracking-tight">{value}</p>
          {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
        </div>
        <div className={cn("flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br", accentMap[accent])}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
      {trend && (
        <div className="mt-3 flex items-center gap-1.5 text-xs">
          <span className={cn("inline-flex items-center gap-0.5 font-semibold", trendUp ? "text-success" : "text-destructive")}>
            {trendUp ? <ArrowUpRight className="h-3.5 w-3.5" /> : <ArrowDownRight className="h-3.5 w-3.5" />}
            {trend}
          </span>
          <span className="text-muted-foreground">vs. mes anterior</span>
        </div>
      )}
    </Card>
  );
}
