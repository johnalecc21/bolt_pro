import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { RequireRole } from "@/components/auth/RequireRole";
import { ClienteLayout } from "@/layouts/ClienteLayout";
import { ProveedorLayout } from "@/layouts/ProveedorLayout";
import { InternoLayout } from "@/layouts/InternoLayout";

import { Landing } from "@/pages/Landing";

import { LoginCliente } from "@/pages/cliente/LoginCliente";
import { OnboardingWizard } from "@/pages/cliente/OnboardingWizard";
import { Dashboard } from "@/pages/cliente/Dashboard";
import { Requerimientos } from "@/pages/cliente/Requerimientos";
import { NuevoRequerimiento } from "@/pages/cliente/NuevoRequerimiento";
import { DetalleRequerimiento } from "@/pages/cliente/DetalleRequerimiento";
import { ShortlistProveedores } from "@/pages/cliente/ShortlistProveedores";
import { BandejaAprobaciones } from "@/pages/cliente/BandejaAprobaciones";
import { LicitacionEnCurso } from "@/pages/cliente/LicitacionEnCurso";
import { CuadroComparativo } from "@/pages/cliente/CuadroComparativo";
import { Negociacion } from "@/pages/cliente/Negociacion";
import { Adjudicacion } from "@/pages/cliente/Adjudicacion";
import { Contratos } from "@/pages/cliente/Contratos";
import { Seguimiento } from "@/pages/cliente/Seguimiento";
import { Disputas } from "@/pages/cliente/Disputas";
import { AnaliticaCFO } from "@/pages/cliente/AnaliticaCFO";
import { DirectorioProveedores } from "@/pages/cliente/DirectorioProveedores";
import { GestionUsuarios } from "@/pages/cliente/GestionUsuarios";
import { ConfiguracionMatrizAprobacion } from "@/pages/cliente/ConfiguracionMatrizAprobacion";
import { CentroNotificaciones } from "@/pages/cliente/CentroNotificaciones";
import { ConfiguracionCuenta } from "@/pages/cliente/ConfiguracionCuenta";

import { LoginProveedor } from "@/pages/proveedor/LoginProveedor";
import { RegistroProveedor } from "@/pages/proveedor/RegistroProveedor";
import { HomologacionForm } from "@/pages/proveedor/HomologacionForm";
import { EstadoHomologacion } from "@/pages/proveedor/EstadoHomologacion";
import { InvitacionesProveedor } from "@/pages/proveedor/InvitacionesProveedor";
import { CargaOferta } from "@/pages/proveedor/CargaOferta";
import { SubastaVivo } from "@/pages/proveedor/SubastaVivo";
import { HistorialProveedor } from "@/pages/proveedor/HistorialProveedor";
import { MisContratos } from "@/pages/proveedor/MisContratos";
import { PagosFactoring } from "@/pages/proveedor/PagosFactoring";
import { PerfilEmpresa } from "@/pages/proveedor/PerfilEmpresa";

import { LoginInterno } from "@/pages/interno/LoginInterno";
import { DashboardConsultor } from "@/pages/interno/DashboardConsultor";
import { ColaHomologacion } from "@/pages/interno/ColaHomologacion";
import { AsistenteRFP } from "@/pages/interno/AsistenteRFP";
import { AuditoriaAhorro } from "@/pages/interno/AuditoriaAhorro";
import { MediacionDisputas } from "@/pages/interno/MediacionDisputas";
import { AdminClientes } from "@/pages/interno/AdminClientes";
import { BenchmarkMercado } from "@/pages/interno/BenchmarkMercado";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Landing />} />

        {/* Portal Cliente */}
        <Route path="/cliente/login" element={<LoginCliente />} />
        <Route
          path="/cliente"
          element={
            <ProtectedRoute portal="cliente">
              <ClienteLayout />
            </ProtectedRoute>
          }
        >
          <Route path="onboarding" element={<RequireRole allow={["admin_cliente"]}><OnboardingWizard /></RequireRole>} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="requerimientos" element={<Requerimientos />} />
          <Route path="requerimientos/nuevo" element={<RequireRole allow={["comprador", "admin_cliente"]}><NuevoRequerimiento /></RequireRole>} />
          <Route path="requerimientos/:id" element={<DetalleRequerimiento />} />
          <Route path="requerimientos/:id/shortlist" element={<RequireRole allow={["comprador", "admin_cliente"]}><ShortlistProveedores /></RequireRole>} />
          <Route path="aprobaciones" element={<RequireRole allow={["aprobador_cfo", "admin_cliente"]}><BandejaAprobaciones /></RequireRole>} />
          <Route path="licitaciones" element={<RequireRole allow={["comprador", "admin_cliente"]} readonly={["aprobador_cfo"]}><LicitacionEnCurso /></RequireRole>} />
          <Route path="licitaciones/:id" element={<RequireRole allow={["comprador", "admin_cliente"]} readonly={["aprobador_cfo"]}><LicitacionEnCurso /></RequireRole>} />
          <Route path="licitaciones/:id/comparativo" element={<RequireRole allow={["comprador", "admin_cliente"]} readonly={["aprobador_cfo"]}><CuadroComparativo /></RequireRole>} />
          <Route path="negociacion" element={<RequireRole allow={["comprador", "admin_cliente"]}><Negociacion /></RequireRole>} />
          <Route path="negociacion/:id" element={<RequireRole allow={["comprador", "admin_cliente"]}><Negociacion /></RequireRole>} />
          <Route path="adjudicacion" element={<RequireRole allow={["comprador", "admin_cliente", "aprobador_cfo"]}><Adjudicacion /></RequireRole>} />
          <Route path="adjudicacion/:id" element={<RequireRole allow={["comprador", "admin_cliente", "aprobador_cfo"]}><Adjudicacion /></RequireRole>} />
          <Route path="contratos" element={<Contratos />} />
          <Route path="seguimiento" element={<RequireRole allow={["comprador", "admin_cliente"]}><Seguimiento /></RequireRole>} />
          <Route path="disputas" element={<RequireRole allow={["comprador", "admin_cliente"]}><Disputas /></RequireRole>} />
          <Route path="analitica" element={<RequireRole allow={["aprobador_cfo", "admin_cliente"]}><AnaliticaCFO /></RequireRole>} />
          <Route path="directorio" element={<RequireRole allow={["comprador", "admin_cliente"]}><DirectorioProveedores /></RequireRole>} />
          <Route path="usuarios" element={<RequireRole allow={["admin_cliente"]}><GestionUsuarios /></RequireRole>} />
          <Route path="matriz-aprobacion" element={<RequireRole allow={["admin_cliente"]}><ConfiguracionMatrizAprobacion /></RequireRole>} />
          <Route path="notificaciones" element={<CentroNotificaciones />} />
          <Route path="configuracion" element={<ConfiguracionCuenta />} />
        </Route>

        {/* Portal Proveedor */}
        <Route path="/proveedor/login" element={<LoginProveedor />} />
        <Route path="/proveedor/registro" element={<RegistroProveedor />} />
        <Route
          path="/proveedor"
          element={
            <ProtectedRoute portal="proveedor">
              <ProveedorLayout />
            </ProtectedRoute>
          }
        >
          <Route path="dashboard" element={<EstadoHomologacion />} />
          <Route path="homologacion" element={<HomologacionForm />} />
          <Route path="invitaciones" element={<InvitacionesProveedor />} />
          <Route path="ofertas" element={<CargaOferta />} />
          <Route path="ofertas/:requerimientoId" element={<CargaOferta />} />
          <Route path="subasta" element={<SubastaVivo />} />
          <Route path="subasta/:requerimientoId" element={<SubastaVivo />} />
          <Route path="historial" element={<HistorialProveedor />} />
          <Route path="contratos" element={<MisContratos />} />
          <Route path="pagos" element={<PagosFactoring />} />
          <Route path="perfil" element={<PerfilEmpresa />} />
        </Route>

        {/* Panel Interno */}
        <Route path="/interno/login" element={<LoginInterno />} />
        <Route
          path="/interno"
          element={
            <ProtectedRoute portal="interno">
              <InternoLayout />
            </ProtectedRoute>
          }
        >
          <Route path="dashboard" element={<DashboardConsultor />} />
          <Route path="homologacion" element={<RequireRole allow={["compliance_ops"]}><ColaHomologacion /></RequireRole>} />
          <Route path="editor-rfp" element={<AsistenteRFP />} />
          <Route path="auditoria" element={<AuditoriaAhorro />} />
          <Route path="mediacion" element={<MediacionDisputas />} />
          <Route path="clientes" element={<RequireRole allow={["compliance_ops"]}><AdminClientes /></RequireRole>} />
          <Route path="benchmark" element={<BenchmarkMercado />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
