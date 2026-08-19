import type { RefObject } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Paperclip, Download, Loader2, Upload } from "lucide-react";
import type { DocumentoRequerimiento } from "@/lib/api/requerimientos";

interface DocumentosPanelProps {
  documentos: DocumentoRequerimiento[];
  descargando: string | null;
  subiendo: boolean;
  fileInputRef: RefObject<HTMLInputElement | null>;
  onDescargar: (doc: DocumentoRequerimiento) => void;
  onAbrirSelectorArchivo: () => void;
  onFileSelected: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export function DocumentosPanel({ documentos, descargando, subiendo, fileInputRef, onDescargar, onAbrirSelectorArchivo, onFileSelected }: DocumentosPanelProps) {
  return (
    <Card className="p-5">
      <h3 className="mb-3 font-semibold text-sm">Documentos</h3>
      <div className="space-y-2">
        {documentos.length === 0 && (
          <p className="text-sm text-muted-foreground">Sin documentos adjuntos.</p>
        )}
        {documentos.map((doc) => (
          <button
            key={doc.id}
            onClick={() => onDescargar(doc)}
            disabled={doc.estado !== "subido" || descargando === doc.id}
            className="flex w-full items-center gap-2 rounded-lg border border-border p-2 text-left text-sm hover:bg-muted/30 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Paperclip className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="flex-1 truncate">{doc.nombre}</span>
            {doc.estado !== "subido" ? (
              <span className="text-xs text-muted-foreground">Subiendo...</span>
            ) : descargando === doc.id ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />
            ) : (
              <Download className="h-3.5 w-3.5 text-muted-foreground" />
            )}
          </button>
        ))}
      </div>
      <input ref={fileInputRef} type="file" className="hidden" onChange={onFileSelected} />
      <Button variant="outline" size="sm" className="mt-3 w-full gap-1.5" onClick={onAbrirSelectorArchivo} disabled={subiendo}>
        {subiendo ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Upload className="h-3.5 w-3.5" />}
        {subiendo ? "Subiendo..." : "Adjuntar documento"}
      </Button>
    </Card>
  );
}
