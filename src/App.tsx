import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ClienteLayout } from "@/layouts/ClienteLayout";
import { ProveedorLayout } from "@/layouts/ProveedorLayout";
import { InternoLayout } from "@/layouts/InternoLayout";

import { LoginCliente } from "@/pages/cliente/LoginCliente";
import { OnboardingWizard } from "@/pages/cliente/OnboardingWizard";
import { Dashboard } from "@/pages/cliente/Dashboard";
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

import { LoginProveedor } from "@/pages/proveedor/LoginProveedor";
import { RegistroProveedor } from "@/pages/proveedor/RegistroProveedor";
import { HomologacionForm } from "@/pages/proveedor/HomologacionForm";
import { EstadoHomologacion } from "@/pages/proveedor/EstadoHomologacion";
import { InvitacionesProveedor } from "@/pages/proveedor/InvitacionesProveedor";
import { CargaOferta } from "@/pages/proveedor/CargaOferta";
import { SubastaVivo } from "@/pages/proveedor/SubastaVivo";
import { HistorialProveedor } from "@/pages/proveedor/HistorialProveedor";
import { PagosFactoring } from "@/pages/proveedor/PagosFactoring";

import { LoginInterno } from "@/pages/interno/LoginInterno";
import { DashboardConsultor } from "@/pages/interno/DashboardConsultor";
import { ColaHomologacion } from "@/pages/interno/ColaHomologacion";
import { AuditoriaAhorro } from "@/pages/interno/AuditoriaAhorro";
import { AdminClientes } from "@/pages/interno/AdminClientes";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/cliente/login" replace />} />

        {/* Portal Cliente */}
        <Route path="/cliente/login" element={<LoginCliente />} />
        <Route path="/cliente" element={<ClienteLayout />}>
          <Route path="onboarding" element={<OnboardingWizard />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="requerimientos" element={<Dashboard />} />
          <Route path="requerimientos/nuevo" element={<NuevoRequerimiento />} />
          <Route path="requerimientos/:id" element={<DetalleRequerimiento />} />
          <Route path="requerimientos/:id/shortlist" element={<ShortlistProveedores />} />
          <Route path="aprobaciones" element={<BandejaAprobaciones />} />
          <Route path="licitaciones" element={<LicitacionEnCurso />} />
          <Route path="licitaciones/:id" element={<LicitacionEnCurso />} />
          <Route path="licitaciones/:id/comparativo" element={<CuadroComparativo />} />
          <Route path="negociacion" element={<Negociacion />} />
          <Route path="adjudicacion" element={<Adjudicacion />} />
          <Route path="contratos" element={<Contratos />} />
          <Route path="seguimiento" element={<Seguimiento />} />
          <Route path="disputas" element={<Disputas />} />
          <Route path="analitica" element={<AnaliticaCFO />} />
          <Route path="directorio" element={<DirectorioProveedores />} />
          <Route path="notificaciones" element={<Dashboard />} />
          <Route path="configuracion" element={<Dashboard />} />
        </Route>

        {/* Portal Proveedor */}
        <Route path="/proveedor/login" element={<LoginProveedor />} />
        <Route path="/proveedor/registro" element={<RegistroProveedor />} />
        <Route path="/proveedor" element={<ProveedorLayout />}>
          <Route path="dashboard" element={<EstadoHomologacion />} />
          <Route path="homologacion" element={<HomologacionForm />} />
          <Route path="invitaciones" element={<InvitacionesProveedor />} />
          <Route path="ofertas" element={<CargaOferta />} />
          <Route path="subasta" element={<SubastaVivo />} />
          <Route path="historial" element={<HistorialProveedor />} />
          <Route path="pagos" element={<PagosFactoring />} />
          <Route path="perfil" element={<EstadoHomologacion />} />
        </Route>

        {/* Panel Interno */}
        <Route path="/interno/login" element={<LoginInterno />} />
        <Route path="/interno" element={<InternoLayout />}>
          <Route path="dashboard" element={<DashboardConsultor />} />
          <Route path="homologacion" element={<ColaHomologacion />} />
          <Route path="editor-rfp" element={<NuevoRequerimiento />} />
          <Route path="auditoria" element={<AuditoriaAhorro />} />
          <Route path="mediacion" element={<Disputas />} />
          <Route path="clientes" element={<AdminClientes />} />
          <Route path="benchmark" element={<AnaliticaCFO />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
