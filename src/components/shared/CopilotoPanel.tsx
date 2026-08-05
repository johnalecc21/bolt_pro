import { useState, type ReactNode } from "react";
import { toast } from "sonner";
import { Sheet, SheetTrigger, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Send, UserRoundCog } from "lucide-react";
import { sleep } from "@/lib/mock/simulate";
import { cn } from "@/lib/utils";

type CopilotoContext = "nuevo-requerimiento" | "detalle-requerimiento" | "comparativo";

interface ChatMessage {
  role: "ai" | "user";
  text: string;
  insertable?: boolean;
}

const suggestionsByContext: Record<CopilotoContext, ChatMessage[]> = {
  "nuevo-requerimiento": [
    { role: "ai", text: "Basado en categorías similares, sugiero estos criterios de evaluación: Precio 45%, Plazo de entrega 25%, Calidad/Referencias 20%, Condiciones de pago 10%.", insertable: true },
    { role: "ai", text: "¿Quieres que redacte una descripción técnica inicial para \"Servicios de migración a la nube\"? Puedo sugerir SLA de 99.9% y soporte 24/7 como estándar de mercado.", insertable: true },
  ],
  "detalle-requerimiento": [
    { role: "ai", text: "Este proceso lleva 5 de 8 ofertas recibidas y vence en 3 días. Si necesitas más participación, puedo redactar un recordatorio para los proveedores pendientes.", insertable: false },
  ],
  comparativo: [
    { role: "ai", text: "NovaTech Consulting muestra el mejor balance precio-calidad. Su oferta está 2% por debajo del benchmark de mercado para esta categoría.", insertable: false },
  ],
};

export function CopilotoPanel({ context, trigger, onInsert }: {
  context: CopilotoContext;
  trigger?: ReactNode;
  onInsert?: (text: string) => void;
}) {
  const [messages, setMessages] = useState<ChatMessage[]>(suggestionsByContext[context]);
  const [input, setInput] = useState("");
  const [thinking, setThinking] = useState(false);

  async function handleSend() {
    if (!input.trim()) return;
    const userText = input.trim();
    setMessages((prev) => [...prev, { role: "user", text: userText }]);
    setInput("");
    setThinking(true);
    await sleep(800);
    setThinking(false);
    setMessages((prev) => [...prev, {
      role: "ai",
      text: "Es una buena pregunta. Con la información disponible en este proceso, te sugiero revisarlo con tu consultor para una respuesta más precisa — puedo escalarlo si quieres.",
    }]);
  }

  function handleEscalar() {
    toast.success("Escalado a tu consultor", { description: "Ana Consultora recibió tu solicitud y te contactará pronto." });
  }

  return (
    <Sheet>
      <SheetTrigger asChild>
        {trigger ?? (
          <Button size="icon" className="fixed bottom-6 right-6 z-40 h-12 w-12 rounded-full gradient-brand text-white shadow-lg">
            <Sparkles className="h-5 w-5" />
          </Button>
        )}
      </SheetTrigger>
      <SheetContent className="flex w-full flex-col sm:max-w-md">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2"><Sparkles className="h-4 w-4 text-primary" /> Copiloto IA</SheetTitle>
          <SheetDescription>Sugerencias generadas por IA. Siempre puedes editarlas antes de usarlas.</SheetDescription>
        </SheetHeader>
        <div className="flex-1 space-y-3 overflow-y-auto px-4">
          {messages.map((m, i) => (
            <div key={i} className={cn("flex", m.role === "user" ? "justify-end" : "justify-start")}>
              <div className={cn(
                "max-w-[85%] rounded-xl px-3 py-2 text-sm",
                m.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted"
              )}>
                {m.role === "ai" && <Badge variant="secondary" className="mb-1.5 text-[10px]">Generado por IA</Badge>}
                <p>{m.text}</p>
                {m.role === "ai" && m.insertable && onInsert && (
                  <Button size="sm" variant="outline" className="mt-2 h-7 text-xs" onClick={() => { onInsert(m.text); toast.success("Insertado en el formulario"); }}>
                    Insertar en el formulario
                  </Button>
                )}
              </div>
            </div>
          ))}
          {thinking && <p className="text-xs text-muted-foreground">Copiloto está escribiendo...</p>}
        </div>
        <SheetFooter className="gap-2 border-t pt-4">
          <div className="flex w-full gap-2">
            <input
              className="flex-1 rounded-md border border-input bg-background px-3 py-2 text-sm"
              placeholder="Escribe tu pregunta..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSend()}
            />
            <Button size="icon" onClick={handleSend} disabled={!input.trim()}><Send className="h-4 w-4" /></Button>
          </div>
          <Button variant="ghost" size="sm" className="w-full text-muted-foreground" onClick={handleEscalar}>
            <UserRoundCog className="mr-2 h-3.5 w-3.5" /> Escalar a consultor humano
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
