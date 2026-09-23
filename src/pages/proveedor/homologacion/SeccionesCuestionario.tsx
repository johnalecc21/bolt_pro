import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Plus, Trash2, Building2, Scale, Wallet, Users, Briefcase, ShieldCheck, FileText, PenLine,
  type LucideIcon,
} from "lucide-react";
import type { HomologacionCuestionario, ReferenciaComercial } from "@/lib/api/homologacion";
import { CampoTexto, CampoTextarea, CampoSiNo, CampoOpciones } from "./CamposCuestionario";

type SetField = <K extends keyof HomologacionCuestionario>(key: K, value: HomologacionCuestionario[K]) => void;

export interface SeccionMeta {
  titulo: string;
  subtitulo: string;
  icon: LucideIcon;
}

/** Section metadata, matching the docx "Cuestionario de Homologación de Proveedores". */
export const SECCIONES: SeccionMeta[] = [
  { titulo: "Información general", subtitulo: "Identifica a tu empresa y lo que ofreces.", icon: Building2 },
  { titulo: "Información legal", subtitulo: "Constitución, representación y verificaciones de riesgo.", icon: Scale },
  { titulo: "Información financiera", subtitulo: "Cifras y respaldo financiero de los últimos años.", icon: Wallet },
  { titulo: "Referencias comerciales", subtitulo: "Mínimo 3 clientes que respalden tu experiencia.", icon: Users },
  { titulo: "Experiencia y capacidad", subtitulo: "Trayectoria, cobertura y capacidad operativa.", icon: Briefcase },
  { titulo: "Seguridad y compliance", subtitulo: "Políticas, certificaciones y cumplimiento.", icon: ShieldCheck },
  { titulo: "Documentos", subtitulo: "Sube los soportes requeridos en PDF, PNG o JPG.", icon: FileText },
  { titulo: "Declaración y firma", subtitulo: "Confirma que la información es veraz y envía.", icon: PenLine },
];

/** The document-upload section (index 6) is rendered by HomologacionForm itself, not here. */
export const SECCION_DOCUMENTOS = 6;

/** Required cuestionario keys per section — used to mark a step complete in the stepper. */
const REQUERIDOS_POR_SECCION: (keyof HomologacionCuestionario)[][] = [
  ["razonSocial", "nitRut", "representanteLegal", "tipoProveedor", "bienServicioOfrecido"],
  ["fechaConstitucion", "numeroMatricula", "esPep", "sancionado", "litigios", "listaRestrictiva"],
  ["tieneEstadosFinancierosAuditados", "ingresosAnioMenos1"],
  [], // referencias — validated separately (needs 3 complete)
  ["aniosExperienciaMercado", "numeroEmpleados", "coberturaGeografica"],
  ["politicaSst", "polizasVigentes", "certificacionesCalidad", "politicaAnticorrupcion", "politicaProteccionDatos", "incidentesGraves"],
  [], // documentos — validated against uploaded files
  ["declaracionAceptada", "firmanteNombre"],
];

function referenciasCompletas(c: HomologacionCuestionario): number {
  return (c.referencias ?? []).filter((r) => r.empresa?.trim() && r.contacto?.trim() && r.telefono?.trim()).length;
}

/** True when every required field of a section is answered. `docsCompletos` covers the Documentos step. */
export function seccionCompleta(index: number, c: HomologacionCuestionario, docsCompletos: boolean): boolean {
  if (index === SECCION_DOCUMENTOS) return docsCompletos;
  if (index === 3) return referenciasCompletas(c) >= 3;
  return REQUERIDOS_POR_SECCION[index].every((k) => {
    const v = c[k];
    return v !== undefined && v !== null && v !== "";
  });
}

function num(v: string): number | undefined {
  if (v === "") return undefined;
  const n = Number(v);
  return Number.isFinite(n) ? n : undefined;
}

export function SeccionCuestionario({
  seccion,
  c,
  setField,
}: {
  seccion: number;
  c: HomologacionCuestionario;
  setField: SetField;
}) {
  if (seccion === 0) {
    return (
      <div className="grid grid-cols-2 gap-4">
        <CampoTexto label="Razón social" value={c.razonSocial} onChange={(v) => setField("razonSocial", v)} required />
        <CampoTexto label="Nombre comercial" value={c.nombreComercial} onChange={(v) => setField("nombreComercial", v)} />
        <CampoTexto label="NIT / RUT / Tax ID" value={c.nitRut} onChange={(v) => setField("nitRut", v)} placeholder="900.456.789-1" required />
        <CampoTexto label="País de constitución" value={c.paisConstitucion} onChange={(v) => setField("paisConstitucion", v)} />
        <CampoTexto label="Dirección" value={c.direccion} onChange={(v) => setField("direccion", v)} />
        <CampoTexto label="Ciudad / País" value={c.ciudadPais} onChange={(v) => setField("ciudadPais", v)} />
        <CampoTexto label="Teléfono" value={c.telefono} onChange={(v) => setField("telefono", v)} />
        <CampoTexto label="Correo de contacto" type="email" value={c.correoContacto} onChange={(v) => setField("correoContacto", v)} />
        <CampoTexto label="Sitio web" type="url" value={c.sitioWeb} onChange={(v) => setField("sitioWeb", v)} placeholder="https://" />
        <CampoTexto label="Representante legal" value={c.representanteLegal} onChange={(v) => setField("representanteLegal", v)} required />
        <CampoTexto label="Cargo del representante" value={c.cargoRepresentante} onChange={(v) => setField("cargoRepresentante", v)} />
        <CampoOpciones
          label="Tipo de proveedor"
          value={c.tipoProveedor}
          onChange={(v) => setField("tipoProveedor", v)}
          required
          options={[
            { value: "bienes", label: "Bienes" },
            { value: "servicios", label: "Servicios" },
            { value: "ambos", label: "Ambos" },
          ]}
        />
        <CampoTextarea
          label="Bien o servicio ofrecido"
          value={c.bienServicioOfrecido}
          onChange={(v) => setField("bienServicioOfrecido", v)}
          placeholder="Describe brevemente lo que ofreces"
          required
        />
      </div>
    );
  }

  if (seccion === 1) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <CampoTexto label="Fecha de constitución" type="date" value={c.fechaConstitucion} onChange={(v) => setField("fechaConstitucion", v)} required />
          <CampoTexto label="N° de matrícula / Cámara de Comercio" value={c.numeroMatricula} onChange={(v) => setField("numeroMatricula", v)} required />
          <CampoTexto label="Vigencia de la matrícula" type="date" value={c.vigenciaMatricula} onChange={(v) => setField("vigenciaMatricula", v)} />
        </div>
        <div>
          <p className="mb-2 text-sm font-medium">Verificaciones de riesgo</p>
          <div className="rounded-lg border border-border px-4">
            <CampoSiNo label="¿El representante legal cuenta con poderes vigentes?" value={c.tienePoderes} onChange={(v) => setField("tienePoderes", v)} />
            <CampoSiNo label="¿Es o tiene socios que sean Persona Expuesta Políticamente (PEP)?" value={c.esPep} onChange={(v) => setField("esPep", v)} required peligroSi />
            <CampoSiNo label="¿Ha sido sancionada la empresa en los últimos 5 años?" value={c.sancionado} onChange={(v) => setField("sancionado", v)} required peligroSi />
            {c.sancionado && (
              <CampoTextarea label="Detalle de la sanción" value={c.sancionadoDetalle} onChange={(v) => setField("sancionadoDetalle", v)} />
            )}
            <CampoSiNo label="¿Existen litigios o procesos judiciales en curso?" value={c.litigios} onChange={(v) => setField("litigios", v)} required peligroSi />
            {c.litigios && (
              <CampoTextarea label="Detalle de los litigios" value={c.litigiosDetalle} onChange={(v) => setField("litigiosDetalle", v)} />
            )}
            <CampoSiNo
              label="¿La empresa o sus socios aparecen en listas restrictivas (OFAC, ONU, Clinton List)?"
              value={c.listaRestrictiva}
              onChange={(v) => setField("listaRestrictiva", v)}
              required
              peligroSi
            />
          </div>
        </div>
      </div>
    );
  }

  if (seccion === 2) {
    return (
      <div className="grid grid-cols-2 gap-4">
        <CampoTexto label="Ingresos operacionales año -1" type="number" value={c.ingresosAnioMenos1} onChange={(v) => setField("ingresosAnioMenos1", num(v))} required />
        <CampoTexto label="Ingresos operacionales año -2" type="number" value={c.ingresosAnioMenos2} onChange={(v) => setField("ingresosAnioMenos2", num(v))} />
        <CampoTexto label="Patrimonio" type="number" value={c.patrimonio} onChange={(v) => setField("patrimonio", num(v))} />
        <CampoTexto label="Nivel de endeudamiento (0 a 1, ej. 0.45)" type="number" value={c.endeudamiento} onChange={(v) => setField("endeudamiento", num(v))} placeholder="0.45" />
        <CampoTexto label="Entidad bancaria principal" value={c.entidadBancaria} onChange={(v) => setField("entidadBancaria", v)} />
        <CampoTexto label="N° de cuenta bancaria" value={c.cuentaBancaria} onChange={(v) => setField("cuentaBancaria", v)} />
        <CampoSiNo label="¿Cuenta con estados financieros auditados?" value={c.tieneEstadosFinancierosAuditados} onChange={(v) => setField("tieneEstadosFinancierosAuditados", v)} required />
        {c.tieneEstadosFinancierosAuditados && (
          <CampoTexto label="Firma auditora" value={c.firmaAuditora} onChange={(v) => setField("firmaAuditora", v)} full />
        )}
      </div>
    );
  }

  if (seccion === 3) {
    return <ReferenciasComerciales referencias={c.referencias ?? []} onChange={(refs) => setField("referencias", refs)} />;
  }

  if (seccion === 4) {
    return (
      <div className="grid grid-cols-2 gap-4">
        <CampoTexto label="Años de experiencia en el mercado" type="number" value={c.aniosExperienciaMercado} onChange={(v) => setField("aniosExperienciaMercado", num(v))} required />
        <CampoTexto label="Años de experiencia en el bien/servicio ofrecido" type="number" value={c.aniosExperienciaBienServicio} onChange={(v) => setField("aniosExperienciaBienServicio", num(v))} />
        <CampoTexto label="N° de empleados" type="number" value={c.numeroEmpleados} onChange={(v) => setField("numeroEmpleados", num(v))} required />
        <CampoTexto label="Cobertura geográfica" value={c.coberturaGeografica} onChange={(v) => setField("coberturaGeografica", v)} placeholder="Nacional, LATAM..." required />
        <CampoTextarea label="Capacidad instalada" value={c.capacidadInstalada} onChange={(v) => setField("capacidadInstalada", v)} />
        <CampoTextarea label="Proyectos similares realizados" value={c.proyectosSimilares} onChange={(v) => setField("proyectosSimilares", v)} />
        <CampoSiNo label="¿Subcontrata parte de sus operaciones?" value={c.subcontrata} onChange={(v) => setField("subcontrata", v)} />
        {c.subcontrata && (
          <CampoTextarea label="¿Qué subcontrata y a quién?" value={c.subcontrataDetalle} onChange={(v) => setField("subcontrataDetalle", v)} />
        )}
      </div>
    );
  }

  if (seccion === 5) {
    return (
      <div className="rounded-lg border border-border px-4">
        <CampoSiNo label="¿Cuenta con política de Seguridad y Salud en el Trabajo (SST)?" value={c.politicaSst} onChange={(v) => setField("politicaSst", v)} required />
        <CampoSiNo label="¿Tiene pólizas de responsabilidad civil / cumplimiento vigentes?" value={c.polizasVigentes} onChange={(v) => setField("polizasVigentes", v)} required />
        {c.polizasVigentes && (
          <CampoTexto label="Vigencia / detalle de las pólizas" value={c.polizasVigenciaDetalle} onChange={(v) => setField("polizasVigenciaDetalle", v)} full />
        )}
        <CampoSiNo label="¿Cuenta con certificaciones de calidad (ISO u otras)?" value={c.certificacionesCalidad} onChange={(v) => setField("certificacionesCalidad", v)} required />
        {c.certificacionesCalidad && (
          <CampoTexto label="¿Cuáles certificaciones?" value={c.certificacionesCalidadCuales} onChange={(v) => setField("certificacionesCalidadCuales", v)} placeholder="ISO 9001, ISO 14001..." full />
        )}
        <CampoSiNo label="¿Tiene política anticorrupción / antisoborno?" value={c.politicaAnticorrupcion} onChange={(v) => setField("politicaAnticorrupcion", v)} required />
        <CampoSiNo label="¿Tiene política de protección de datos personales?" value={c.politicaProteccionDatos} onChange={(v) => setField("politicaProteccionDatos", v)} required />
        <CampoSiNo label="¿Ha tenido incidentes graves (ambientales, laborales, legales) en los últimos 3 años?" value={c.incidentesGraves} onChange={(v) => setField("incidentesGraves", v)} required peligroSi />
        {c.incidentesGraves && (
          <CampoTextarea label="Detalle de los incidentes" value={c.incidentesDetalle} onChange={(v) => setField("incidentesDetalle", v)} />
        )}
      </div>
    );
  }

  if (seccion === 7) {
    return (
      <div className="space-y-4">
        <div className="rounded-lg border border-border bg-muted/30 p-4 text-sm text-muted-foreground">
          Declaro que la información suministrada en este cuestionario es veraz, completa y verificable, y autorizo a
          Procurex y a sus clientes a validarla ante las fuentes que consideren pertinentes, incluyendo listas
          restrictivas y centrales de riesgo, conforme a la política de tratamiento de datos personales.
        </div>
        <CampoSiNo label="Acepto la declaración anterior" value={c.declaracionAceptada} onChange={(v) => setField("declaracionAceptada", v)} required />
        <div className="grid grid-cols-2 gap-4">
          <CampoTexto label="Nombre del firmante" value={c.firmanteNombre} onChange={(v) => setField("firmanteNombre", v)} required />
          <CampoTexto label="Cargo del firmante" value={c.firmanteCargo} onChange={(v) => setField("firmanteCargo", v)} />
          <CampoTexto label="Fecha" type="date" value={c.firmaFecha} onChange={(v) => setField("firmaFecha", v)} />
        </div>
      </div>
    );
  }

  return null;
}

function ReferenciasComerciales({
  referencias,
  onChange,
}: {
  referencias: ReferenciaComercial[];
  onChange: (refs: ReferenciaComercial[]) => void;
}) {
  const lista = referencias.length ? referencias : [{}, {}, {}];

  function actualizar(index: number, campo: keyof ReferenciaComercial, valor: string) {
    onChange(lista.map((r, i) => (i === index ? { ...r, [campo]: valor } : r)));
  }
  function agregar() {
    onChange([...lista, {}]);
  }
  function eliminar(index: number) {
    onChange(lista.filter((_, i) => i !== index));
  }

  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">
        Registra al menos <strong>3 referencias comerciales</strong> con empresa, contacto y teléfono.
      </p>
      {lista.map((r, i) => (
        <div key={i} className="grid grid-cols-2 gap-3 rounded-lg border border-border p-3">
          <div className="col-span-2 flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">Referencia {i + 1}</span>
            {lista.length > 3 && (
              <Button size="sm" variant="ghost" onClick={() => eliminar(i)}>
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            )}
          </div>
          <div className="space-y-1.5"><Label>Empresa</Label><Input value={r.empresa ?? ""} onChange={(e) => actualizar(i, "empresa", e.target.value)} /></div>
          <div className="space-y-1.5"><Label>Contacto</Label><Input value={r.contacto ?? ""} onChange={(e) => actualizar(i, "contacto", e.target.value)} /></div>
          <div className="space-y-1.5"><Label>Teléfono</Label><Input value={r.telefono ?? ""} onChange={(e) => actualizar(i, "telefono", e.target.value)} /></div>
          <div className="space-y-1.5"><Label>Tiempo de relación</Label><Input value={r.tiempoRelacion ?? ""} onChange={(e) => actualizar(i, "tiempoRelacion", e.target.value)} placeholder="2 años" /></div>
        </div>
      ))}
      <Button size="sm" variant="outline" className="gap-2" onClick={agregar}>
        <Plus className="h-4 w-4" /> Agregar referencia
      </Button>
    </div>
  );
}
