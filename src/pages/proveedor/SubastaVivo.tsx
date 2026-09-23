import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { EmptyState } from "@/components/shared/EmptyState";
import { Trophy, Gavel, TrendingDown } from "lucide-react";
import { useSubasta } from "@/lib/api/subasta";

import { formatMoney } from "@/lib/moneda";
import { useApiData } from "@/hooks/useApiData";
import { fetchInvitaciones } from "@/lib/api/invitaciones";
function formatCountdown(deadlineMs: number) {
  const remaining = Math.max(0, deadlineMs - Date.now());
  const min = Math.floor(remaining / 60000);
  const sec = Math.floor((remaining % 60000) / 1000);
  return `${String(min).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
}

export function SubastaVivo() {
  const { requerimientoId } = useParams();
  const { state: auction, pujar } = useSubasta(requerimientoId);
  const { data: invitaciones } = useApiData(fetchInvitaciones);
  const moneda = (invitaciones ?? []).find((i) => i.requerimientoId === requerimientoId)?.moneda ?? "USD";
  const [, forceTick] = useState(0);
  const [mejora, setMejora] = useState("");

  useEffect(() => {
    if (auction.status !== "activa") return;
    const id = setInterval(() => forceTick((n) => n + 1), 1000);
    return () => clearInterval(id);
  }, [auction.status]);

  const { miPuja, miPosicion: miPos, totalParticipantes } = auction;

  if (!requerimientoId || auction.status === "inactiva" || !miPuja) {
    return (
      <div className="p-6">
        <EmptyState icon={Gavel} title="No hay subastas activas" description="Cuando un comprador inicie una ronda de negociación en la que participes, aparecerá aquí." />
      </div>
    );
  }

  function enviarMejora() {
    const monto = Number(mejora);
    if (!miPuja || !monto || monto >= miPuja.monto) {
      toast.error("La mejora debe ser menor a tu oferta actual");
      return;
    }
    pujar(monto);
    setMejora("");
    toast.success("Oferta mejorada enviada");
  }

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-bold">Subasta en Vivo</h1>
        <p className="text-sm text-muted-foreground">{auction.requerimientoId} · Nunca verás montos ni identidades de otros competidores</p>
      </div>

      <Card className="overflow-hidden">
        <div className="gradient-hero p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-white/70">{auction.status === "activa" ? "Tiempo restante" : "Subasta cerrada"}</p>
              <p className="text-3xl font-bold">{auction.status === "activa" ? formatCountdown(auction.deadlineMs) : "00:00"}</p>
            </div>
            {auction.status === "activa" && (
              <span className="flex items-center gap-2 text-sm font-medium">
                <span className="relative flex h-3 w-3">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-success opacity-75" />
                  <span className="relative inline-flex h-3 w-3 rounded-full bg-success" />
                </span>
                EN VIVO
              </span>
            )}
          </div>
        </div>
        <div className="p-6 text-center">
          <p className="text-sm text-muted-foreground">Tu posición actual</p>
          <div className="mt-2 flex items-center justify-center gap-2">
            {miPos === 1 && <Trophy className="h-8 w-8 text-warning" />}
            <p className="text-5xl font-bold">{miPos}°</p>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">de {totalParticipantes} participantes</p>
        </div>
      </Card>

      <Card className="p-5">
        <p className="text-sm text-muted-foreground">Tu oferta actual</p>
        <p className="text-2xl font-bold">{formatMoney(miPuja.monto, moneda)}</p>
        {auction.status === "activa" && (
          <div className="mt-4 flex gap-2">
            <Input type="number" placeholder="Nueva oferta mejorada" value={mejora} onChange={(e) => setMejora(e.target.value)} />
            <Button onClick={enviarMejora} className="gap-2 shrink-0"><TrendingDown className="h-4 w-4" /> Mejorar oferta</Button>
          </div>
        )}
      </Card>
    </div>
  );
}
