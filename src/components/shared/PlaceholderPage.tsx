import { Construction } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface PlaceholderPageProps {
  title: string;
  description?: string;
}

export function PlaceholderPage({ title, description }: PlaceholderPageProps) {
  return (
    <div className="p-6">
      <Card className="mx-auto max-w-xl">
        <CardHeader className="items-center text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
            <Construction className="h-6 w-6 text-muted-foreground" />
          </div>
          <CardTitle className="mt-2">{title}</CardTitle>
        </CardHeader>
        <CardContent className="text-center text-sm text-muted-foreground">
          {description ?? "Esta página aún no está disponible en este repositorio. Falta el commit correspondiente en GitHub."}
        </CardContent>
      </Card>
    </div>
  );
}
