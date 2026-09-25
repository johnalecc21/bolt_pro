import { Suspense, lazy } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { RequireRole } from "@/components/auth/RequireRole";
import { Landing } from "@/pages/Landing";

// Everything except the landing is split out so the first visit only downloads
// what the public home page needs.
const ClienteLayout = lazy(() => import("@/layouts/ClienteLayout").then((m) => ({ default: m.ClienteLayout })));
const ProveedorLayout = lazy(() => import("@/layouts/ProveedorLayout").then((m) => ({ default: m.ProveedorLayout })));
const InternoLayout = lazy(() => import("@/layouts/InternoLayout").then((m) => ({ default: m.InternoLayout })));
const SetPassword = lazy(() => import("@/pages/SetPassword").then((m) => ({ default: m.SetPassword })));
const TerminosCondiciones = lazy(() => import("@/pages/legal/TerminosCondiciones").then((m) => ({ default: m.TerminosCondiciones })));
const AvisoPrivacidad = lazy(() => import("@/pages/legal/AvisoPrivacidad").then((m) => ({ default: m.AvisoPrivacidad })));
const LoginCliente = lazy(() => import("@/pages/cliente/LoginCliente").then((m) => ({ default: m.LoginCliente })));
const LoginProveedor = lazy(() => import("@/pages/proveedor/LoginProveedor").then((m) => ({ default: m.LoginProveedor })));
const LoginInterno = lazy(() => import("@/pages/interno/LoginInterno").then((m) => ({ default: m.LoginInterno })));
const RegistroProveedor = lazy(() => import("@/pages/proveedor/RegistroProveedor").then((m) => ({ default: m.RegistroProveedor })));
const VitrinaProveedor = lazy(() => import("@/pages/publico/VitrinaProveedor").then((m) => ({ default: m.VitrinaProveedor })));
const OnboardingWizard = lazy(() => import("@/pages/cliente/OnboardingWizard").then((m) => ({ default: m.OnboardingWizard })));
const Dashboard = lazy(() => import("@/pages/cliente/Dashboard").then((m) => ({ default: m.Dashboard })));
const Requerimientos = lazy(() => import("@/pages/cliente/Requerimientos").then((m) => ({ default: m.Requerimientos })));
const NuevoRequerimiento = lazy(() => import("@/pages/cliente/NuevoRequerimiento").then((m) => ({ default: m.NuevoRequerimiento })));
const DetalleRequerimiento = lazy(() => import("@/pages/cliente/DetalleRequerimiento").then((m) => ({ default: m.DetalleRequerimiento })));
const ShortlistProveedores = lazy(() => import("@/pages/cliente/ShortlistProveedores").then((m) => ({ default: m.ShortlistProveedores })));
const BandejaAprobaciones = lazy(() => import("@/pages/cliente/BandejaAprobaciones").then((m) => ({ default: m.BandejaAprobaciones })));
const LicitacionEnCurso = lazy(() => import("@/pages/cliente/LicitacionEnCurso").then((m) => ({ default: m.LicitacionEnCurso })));
const Licitaciones = lazy(() => import("@/pages/cliente/Licitaciones").then((m) => ({ default: m.Licitaciones })));
const CuadroComparativo = lazy(() => import("@/pages/cliente/CuadroComparativo").then((m) => ({ default: m.CuadroComparativo })));
const Negociacion = lazy(() => import("@/pages/cliente/Negociacion").then((m) => ({ default: m.Negociacion })));
const Adjudicacion = lazy(() => import("@/pages/cliente/Adjudicacion").then((m) => ({ default: m.Adjudicacion })));
const Contratos = lazy(() => import("@/pages/cliente/Contratos").then((m) => ({ default: m.Contratos })));
const Seguimiento = lazy(() => import("@/pages/cliente/Seguimiento").then((m) => ({ default: m.Seguimiento })));
const Disputas = lazy(() => import("@/pages/cliente/Disputas").then((m) => ({ default: m.Disputas })));
const IntegracionesErp = lazy(() => import("@/pages/cliente/IntegracionesErp").then((m) => ({ default: m.IntegracionesErp })));
const CuentasPorPagar = lazy(() => import("@/pages/cliente/CuentasPorPagar").then((m) => ({ default: m.CuentasPorPagar })));
const AnaliticaCFO = lazy(() => import("@/pages/cliente/AnaliticaCFO").then((m) => ({ default: m.AnaliticaCFO })));
const DirectorioProveedores = lazy(() => import("@/pages/cliente/DirectorioProveedores").then((m) => ({ default: m.DirectorioProveedores })));
const EstructuraPresupuestos = lazy(() => import("@/pages/cliente/EstructuraPresupuestos").then((m) => ({ default: m.EstructuraPresupuestos })));
const DetalleProveedor = lazy(() => import("@/pages/cliente/DetalleProveedor").then((m) => ({ default: m.DetalleProveedor })));
const GestionUsuarios = lazy(() => import("@/pages/cliente/GestionUsuarios").then((m) => ({ default: m.GestionUsuarios })));
const ConfiguracionMatrizAprobacion = lazy(() => import("@/pages/cliente/ConfiguracionMatrizAprobacion").then((m) => ({ default: m.ConfiguracionMatrizAprobacion })));
const CentroNotificaciones = lazy(() => import("@/pages/cliente/CentroNotificaciones").then((m) => ({ default: m.CentroNotificaciones })));
const ConfiguracionCuenta = lazy(() => import("@/pages/cliente/ConfiguracionCuenta").then((m) => ({ default: m.ConfiguracionCuenta })));

const OnboardingProveedor = lazy(() => import("@/pages/proveedor/OnboardingProveedor").then((m) => ({ default: m.OnboardingProveedor })));
const HomologacionForm = lazy(() => import("@/pages/proveedor/HomologacionForm").then((m) => ({ default: m.HomologacionForm })));
const DashboardProveedor = lazy(() => import("@/pages/proveedor/DashboardProveedor").then((m) => ({ default: m.DashboardProveedor })));
const InvitacionesProveedor = lazy(() => import("@/pages/proveedor/InvitacionesProveedor").then((m) => ({ default: m.InvitacionesProveedor })));
const CargaOferta = lazy(() => import("@/pages/proveedor/CargaOferta").then((m) => ({ default: m.CargaOferta })));
const SubastaVivo = lazy(() => import("@/pages/proveedor/SubastaVivo").then((m) => ({ default: m.SubastaVivo })));
const HistorialProveedor = lazy(() => import("@/pages/proveedor/HistorialProveedor").then((m) => ({ default: m.HistorialProveedor })));
const MiContratoDetalle = lazy(() => import("@/pages/proveedor/MiContratoDetalle").then((m) => ({ default: m.MiContratoDetalle })));
const ContratoDetalle = lazy(() => import("@/pages/cliente/ContratoDetalle").then((m) => ({ default: m.ContratoDetalle })));
const MisContratos = lazy(() => import("@/pages/proveedor/MisContratos").then((m) => ({ default: m.MisContratos })));
const PagosFactoring = lazy(() => import("@/pages/proveedor/PagosFactoring").then((m) => ({ default: m.PagosFactoring })));
const PerfilEmpresa = lazy(() => import("@/pages/proveedor/PerfilEmpresa").then((m) => ({ default: m.PerfilEmpresa })));
const MiDesempeno = lazy(() => import("@/pages/proveedor/MiDesempeno").then((m) => ({ default: m.MiDesempeno })));
const MiVitrina = lazy(() => import("@/pages/proveedor/MiVitrina").then((m) => ({ default: m.MiVitrina })));

const DashboardConsultor = lazy(() => import("@/pages/interno/DashboardConsultor").then((m) => ({ default: m.DashboardConsultor })));
const ColaHomologacion = lazy(() => import("@/pages/interno/ColaHomologacion").then((m) => ({ default: m.ColaHomologacion })));
const MediacionDisputas = lazy(() => import("@/pages/interno/MediacionDisputas").then((m) => ({ default: m.MediacionDisputas })));
const AdminClientes = lazy(() => import("@/pages/interno/AdminClientes").then((m) => ({ default: m.AdminClientes })));
const BenchmarkMercado = lazy(() => import("@/pages/interno/BenchmarkMercado").then((m) => ({ default: m.BenchmarkMercado })));

function RouteLoading() {
  return (
    <div className="flex h-full min-h-[60vh] items-center justify-center">
      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Suspense fallback={<RouteLoading />}>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/set-password" element={<SetPassword />} />
          <Route path="/terminos" element={<TerminosCondiciones />} />
          <Route path="/privacidad" element={<AvisoPrivacidad />} />
          <Route path="/vitrina/:id" element={<VitrinaProveedor />} />

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
            <Route path="aprobaciones" element={<RequireRole allow={["comprador", "aprobador_cfo", "admin_cliente"]}><BandejaAprobaciones /></RequireRole>} />
            <Route path="licitaciones" element={<RequireRole allow={["comprador", "admin_cliente"]} readonly={["aprobador_cfo"]}><Licitaciones /></RequireRole>} />
            <Route path="licitaciones/:id" element={<RequireRole allow={["comprador", "admin_cliente"]} readonly={["aprobador_cfo"]}><LicitacionEnCurso /></RequireRole>} />
            <Route path="licitaciones/:id/comparativo" element={<RequireRole allow={["comprador", "admin_cliente"]} readonly={["aprobador_cfo"]}><CuadroComparativo /></RequireRole>} />
            <Route path="negociacion" element={<RequireRole allow={["comprador", "admin_cliente"]}><Negociacion /></RequireRole>} />
            <Route path="negociacion/:id" element={<RequireRole allow={["comprador", "admin_cliente"]}><Negociacion /></RequireRole>} />
            <Route path="adjudicacion" element={<RequireRole allow={["comprador", "admin_cliente", "aprobador_cfo"]}><Adjudicacion /></RequireRole>} />
            <Route path="adjudicacion/:id" element={<RequireRole allow={["comprador", "admin_cliente", "aprobador_cfo"]}><Adjudicacion /></RequireRole>} />
            <Route path="contratos" element={<Contratos />} />
            <Route path="contratos/:id" element={<ContratoDetalle />} />
            <Route path="seguimiento" element={<RequireRole allow={["comprador", "admin_cliente"]}><Seguimiento /></RequireRole>} />
            <Route path="disputas" element={<RequireRole allow={["comprador", "admin_cliente"]}><Disputas /></RequireRole>} />
            <Route path="pagos" element={<RequireRole allow={["comprador", "admin_cliente", "aprobador_cfo"]}><CuentasPorPagar /></RequireRole>} />
            <Route path="integraciones" element={<RequireRole allow={["admin_cliente", "aprobador_cfo"]}><IntegracionesErp /></RequireRole>} />
            <Route path="analitica" element={<RequireRole allow={["aprobador_cfo", "admin_cliente"]}><AnaliticaCFO /></RequireRole>} />
            <Route path="directorio" element={<RequireRole allow={["comprador", "admin_cliente"]}><DirectorioProveedores /></RequireRole>} />
            <Route path="estructura" element={<RequireRole allow={["admin_cliente", "aprobador_cfo"]}><EstructuraPresupuestos /></RequireRole>} />
            <Route path="directorio/:id" element={<RequireRole allow={["comprador", "admin_cliente"]}><DetalleProveedor /></RequireRole>} />
            <Route path="usuarios" element={<RequireRole allow={["admin_cliente"]}><GestionUsuarios /></RequireRole>} />
            <Route path="matriz-aprobacion" element={<RequireRole allow={["admin_cliente"]}><ConfiguracionMatrizAprobacion /></RequireRole>} />
            <Route path="notificaciones" element={<CentroNotificaciones />} />
            <Route path="configuracion" element={<ConfiguracionCuenta portal="cliente" />} />
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
            <Route path="dashboard" element={<DashboardProveedor />} />
            <Route path="onboarding" element={<OnboardingProveedor />} />
            <Route path="homologacion" element={<HomologacionForm />} />
            <Route path="invitaciones" element={<InvitacionesProveedor />} />
            <Route path="ofertas" element={<CargaOferta />} />
            <Route path="ofertas/:requerimientoId" element={<CargaOferta />} />
            <Route path="subasta" element={<SubastaVivo />} />
            <Route path="subasta/:requerimientoId" element={<SubastaVivo />} />
            <Route path="historial" element={<HistorialProveedor />} />
            <Route path="desempeno" element={<MiDesempeno />} />
            <Route path="contratos" element={<MisContratos />} />
            <Route path="contratos/:id" element={<MiContratoDetalle />} />
            <Route path="pagos" element={<PagosFactoring />} />
            <Route path="perfil" element={<PerfilEmpresa />} />
            <Route path="vitrina" element={<MiVitrina />} />
            <Route path="notificaciones" element={<CentroNotificaciones />} />
            <Route path="configuracion" element={<ConfiguracionCuenta portal="proveedor" />} />
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
            <Route path="mediacion" element={<MediacionDisputas />} />
            <Route path="clientes" element={<RequireRole allow={["compliance_ops"]}><AdminClientes /></RequireRole>} />
            <Route path="benchmark" element={<BenchmarkMercado />} />
            <Route path="notificaciones" element={<CentroNotificaciones />} />
            <Route path="configuracion" element={<ConfiguracionCuenta portal="interno" />} />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}
