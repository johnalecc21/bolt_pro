import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

/** Text / number field wired to a cuestionario key. */
export function CampoTexto({
  label,
  value,
  onChange,
  type = "text",
  placeholder,
  required,
  full,
}: {
  label: string;
  value: string | number | undefined;
  onChange: (v: string) => void;
  type?: "text" | "number" | "email" | "date" | "url";
  placeholder?: string;
  required?: boolean;
  full?: boolean;
}) {
  return (
    <div className={cn("space-y-1.5", full && "col-span-2")}>
      <Label>
        {label} {required && <span className="text-destructive">*</span>}
      </Label>
      <Input
        type={type}
        value={value ?? ""}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}

export function CampoTextarea({
  label,
  value,
  onChange,
  placeholder,
  required,
}: {
  label: string;
  value: string | undefined;
  onChange: (v: string) => void;
  placeholder?: string;
  required?: boolean;
}) {
  return (
    <div className="col-span-2 space-y-1.5">
      <Label>
        {label} {required && <span className="text-destructive">*</span>}
      </Label>
      <Textarea value={value ?? ""} placeholder={placeholder} rows={3} onChange={(e) => onChange(e.target.value)} />
    </div>
  );
}

/** Yes/No segmented control for a boolean cuestionario key. `peligroSi` paints "Sí" red (for risk questions like PEP/sanciones). */
export function CampoSiNo({
  label,
  value,
  onChange,
  required,
  peligroSi,
}: {
  label: string;
  value: boolean | undefined;
  onChange: (v: boolean) => void;
  required?: boolean;
  peligroSi?: boolean;
}) {
  return (
    <div className="col-span-2 flex items-center justify-between gap-4 border-b border-border py-3 first:pt-0 last:border-0 last:pb-0">
      <span className="text-sm">
        {label} {required && <span className="text-destructive">*</span>}
      </span>
      <div className="flex shrink-0 gap-1 rounded-md border border-border p-0.5">
        <button
          type="button"
          onClick={() => onChange(true)}
          className={cn(
            "rounded px-3 py-1 text-xs font-medium transition-colors",
            value === true
              ? peligroSi
                ? "bg-destructive text-destructive-foreground"
                : "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          Sí
        </button>
        <button
          type="button"
          onClick={() => onChange(false)}
          className={cn(
            "rounded px-3 py-1 text-xs font-medium transition-colors",
            value === false ? "bg-foreground text-background" : "text-muted-foreground hover:text-foreground",
          )}
        >
          No
        </button>
      </div>
    </div>
  );
}

export function CampoOpciones<T extends string>({
  label,
  value,
  options,
  onChange,
  required,
}: {
  label: string;
  value: T | undefined;
  options: { value: T; label: string }[];
  onChange: (v: T) => void;
  required?: boolean;
}) {
  return (
    <div className="col-span-2 space-y-1.5">
      <Label>
        {label} {required && <span className="text-destructive">*</span>}
      </Label>
      <div className="flex flex-wrap gap-2">
        {options.map((o) => (
          <button
            key={o.value}
            type="button"
            onClick={() => onChange(o.value)}
            className={cn(
              "rounded-md border px-3 py-1.5 text-sm font-medium transition-colors",
              value === o.value
                ? "border-primary bg-primary text-primary-foreground"
                : "border-foreground/20 bg-card text-foreground hover:border-primary hover:text-primary",
            )}
          >
            {o.label}
          </button>
        ))}
      </div>
    </div>
  );
}
