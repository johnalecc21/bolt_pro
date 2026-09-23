import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useApiData } from "@/hooks/useApiData";
import { fetchProveedores } from "@/lib/api/proveedores";
import { createRequerimiento, describirExcluidos } from "@/lib/api/requerimientos";
import { useMonedaBase } from "@/hooks/useMonedaBase";
import type { Moneda } from "@/lib/moneda";
import { apiErrorMessage } from "@/lib/api/http";

export const CATEGORIAS_CATALOGO = ["Servicios Generales", "Materia Prima"];
export const TOTAL_STEPS = 6;

export function useNuevoRequerimiento() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [titulo, setTitulo] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [categoria, setCategoria] = useState("Tecnología");
  const [presupuesto, setPresupuesto] = useState("");
  const monedaBase = useMonedaBase();
  const [moneda, setMoneda] = useState<Moneda>(monedaBase);
  const [fechaLimite, setFechaLimite] = useState("");
  const [criterios, setCriterios] = useState({ precio: 50, tiempo: 25, calidad: 15, pago: 10 });
  const [requisitosTecnicos, setRequisitosTecnicos] = useState("");
  const [especificaciones, setEspecificaciones] = useState([
    { name: "Capacidad mínima", value: "100 TB" },
    { name: "SLA requerido", value: "99.9%" },
    { name: "Soporte", value: "24/7" },
  ]);
  const [proveedoresSeleccionados, setProveedoresSeleccionados] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const { data: proveedores, loading: loadingProveedores } = useApiData(() => fetchProveedores());

  function toggleProveedor(id: string) {
    setProveedoresSeleccionados((prev) => prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]);
  }

  function actualizarEspecificacion(index: number, campo: "name" | "value", valor: string) {
    setEspecificaciones((prev) => prev.map((spec, i) => (i === index ? { ...spec, [campo]: valor } : spec)));
  }

  function eliminarEspecificacion(index: number) {
    setEspecificaciones((prev) => prev.filter((_, i) => i !== index));
  }

  function agregarEspecificacion() {
    setEspecificaciones((prev) => [...prev, { name: "", value: "" }]);
  }

  const total = criterios.precio + criterios.tiempo + criterios.calidad + criterios.pago;
  const esCatalogo = CATEGORIAS_CATALOGO.includes(categoria);

  async function handleSubmit() {
    if (!titulo.trim() || !presupuesto || !fechaLimite) {
      toast.error("Completa título, presupuesto y fecha límite antes de enviar.");
      return;
    }
    setSubmitting(true);
    try {
      const descripcionCompleta = [
        descripcion.trim(),
        requisitosTecnicos.trim() ? `Requisitos técnicos:\n${requisitosTecnicos.trim()}` : "",
      ].filter(Boolean).join("\n\n");
      const { requerimiento, excluidos } = await createRequerimiento({
        titulo: titulo.trim(),
        descripcion: descripcionCompleta || undefined,
        categoria,
        montoEstimado: Number(presupuesto),
        moneda,
        fechaLimite,
        criteriosPeso: criterios,
        especificaciones: especificaciones.filter((e) => e.name.trim() || e.value.trim()),
        proveedorIds: proveedoresSeleccionados,
      });
      if (excluidos.length > 0) {
        toast.warning("Requerimiento enviado a aprobación", {
          description: `${excluidos.length} proveedor(es) no se preseleccionaron por no cumplir los requisitos de homologación: ${describirExcluidos(excluidos)}.`,
        });
      } else {
        toast.success("Requerimiento enviado a aprobación", { description: requerimiento.id });
      }
      navigate(`/cliente/requerimientos/${requerimiento.id}`);
    } catch (err) {
      toast.error(apiErrorMessage(err, "No se pudo crear el requerimiento."));
    } finally {
      setSubmitting(false);
    }
  }

  return {
    navigate,
    step, setStep,
    titulo, setTitulo,
    descripcion, setDescripcion,
    categoria, setCategoria,
    presupuesto, setPresupuesto,
    moneda, setMoneda,
    fechaLimite, setFechaLimite,
    criterios, setCriterios,
    requisitosTecnicos, setRequisitosTecnicos,
    especificaciones, actualizarEspecificacion, eliminarEspecificacion, agregarEspecificacion,
    proveedoresSeleccionados, toggleProveedor,
    submitting,
    proveedores, loadingProveedores,
    total, esCatalogo,
    handleSubmit,
  };
}
