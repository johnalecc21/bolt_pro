import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface SearchInputProps {
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
  /** Wrapper div classes — defaults to the "sits next to a filter <select>" layout. */
  className?: string;
}

export function SearchInput({ placeholder, value, onChange, className }: SearchInputProps) {
  return (
    <div className={cn("relative min-w-[240px] flex-1", className)}>
      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      <Input placeholder={placeholder} className="pl-9" value={value} onChange={(e) => onChange(e.target.value)} />
    </div>
  );
}
