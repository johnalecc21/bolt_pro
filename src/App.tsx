import { Suspense, lazy } from "react";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { RequireRole } from "@/components/auth/RequireRole";
import { Landing } from "@/pages/Landing";
import { CargandoProcurex } from "@/components/shared/CargandoProcurex";

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
const ProcesosCompra = lazy(() => import("@/pages/cliente/ProcesosCompra").then((m) => ({ default: m.ProcesosCompra })));
const FichaProceso = lazy(() => import("@/pages/cliente/FichaProceso").then((m) => ({ default: m.FichaProceso })));
const RedirigirProceso = lazy(() => import("@/pages/cliente/FichaProceso").then((m) => ({ default: m.RedirigirProceso })));
const CuadroComparativo = lazy(() => import("@/pages/cliente/CuadroComparativo").then((m) => ({ default: m.CuadroComparativo })));
const Negociacion = lazy(() => import("@/pages/cliente/Negociacion").then((m) => ({ default: m.Negociacion })));
const Adjudicacion = lazy(() => import("@/pages/cliente/Adjudicacion").then((m) => ({ default: m.Adjudicacion })));
const Contratos = lazy(() => import("@/pages/cliente/Contratos").then((m) => ({ default: m.Contratos })));
const IntegracionesErp = lazy(() => import("@/pages/cliente/IntegracionesErp").then((m) => ({ default: m.IntegracionesErp })));
const PlantillasDocumentos = lazy(() => import("@/pages/cliente/PlantillasDocumentos").then((m) => ({ default: m.PlantillasDocumentos })));
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
const ProcesosProveedor = lazy(() => import("@/pages/proveedor/ProcesosProveedor").then((m) => ({ default: m.ProcesosProveedor })));
const CargaOferta = lazy(() => import("@/pages/proveedor/CargaOferta").then((m) => ({ default: m.CargaOferta })));
const SubastaVivo = lazy(() => import("@/pages/proveedor/SubastaVivo").then((m) => ({ default: m.SubastaVivo })));
const MiContratoDetalle = lazy(() => import("@/pages/proveedor/MiContratoDetalle").then((m) => ({ default: m.MiContratoDetalle })));
const ContratoDetalle = lazy(() => import("@/pages/cliente/ContratoDetalle").then((m) => ({ default: m.ContratoDetalle })));
const MisContratos = lazy(() => import("@/pages/proveedor/MisContratos").then((m) => ({ default: m.MisContratos })));
const PagosProveedor = lazy(() => import("@/pages/proveedor/PagosProveedor").then((m) => ({ default: m.PagosProveedor })));
const PerfilEmpresa = lazy(() => import("@/pages/proveedor/PerfilEmpresa").then((m) => ({ default: m.PerfilEmpresa })));
const MiDesempeno = lazy(() => import("@/pages/proveedor/MiDesempeno").then((m) => ({ default: m.MiDesempeno })));
const RiesgoContinuo = lazy(() => import("@/pages/interno/RiesgoContinuo").then((m) => ({ default: m.RiesgoContinuo })));
const RedProveedores = lazy(() => import("@/pages/publico/RedProveedores").then((m) => ({ default: m.RedProveedores })));

const EmpresasClientes = lazy(() => import("@/pages/interno/EmpresasClientes").then((m) => ({ default: m.EmpresasClientes })));
const EmpresaDetalle = lazy(() => import("@/pages/interno/EmpresaDetalle").then((m) => ({ default: m.EmpresaDetalle })));
const ColaHomologacion = lazy(() => import("@/pages/interno/ColaHomologacion").then((m) => ({ default: m.ColaHomologacion })));

/** /cliente/seguimiento is now the Entregas view of Contratos (keeps ?contrato=). */
function RedirigirSeguimiento() {
  const { search } = useLocation();
  const params = new URLSearchParams(search);
  params.set("vista", "entregas");
  return <Navigate to={`/cliente/contratos?${params.toString()}`} replace />;
}

function RouteLoading() {
  return (
    <CargandoProcurex pagina />
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
          <Route path="/red" element={<RedProveedores />} />

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
            <Route path="procesos" element={<RequireRole allow={["comprador", "admin_cliente"]} readonly={["aprobador_cfo"]}><ProcesosCompra /></RequireRole>} />
            <Route path="procesos/:id" element={<RequireRole allow={["comprador", "admin_cliente"]} readonly={["aprobador_cfo"]}><FichaProceso /></RequireRole>}>
              <Route path="seguimiento" element={<LicitacionEnCurso />} />
              <Route path="comparativo" element={<CuadroComparativo />} />
              <Route path="negociacion" element={<RequireRole allow={["comprador", "admin_cliente"]}><Negociacion /></RequireRole>} />
              <Route path="adjudicacion" element={<RequireRole allow={["comprador", "admin_cliente", "aprobador_cfo"]}><Adjudicacion /></RequireRole>} />
            </Route>
            {/* Old addresses (bookmarks, earlier notifications) land on the process page. */}
            <Route path="licitaciones" element={<Navigate to="/cliente/procesos" replace />} />
            <Route path="licitaciones/:id" element={<RedirigirProceso etapa="seguimiento" />} />
            <Route path="licitaciones/:id/comparativo" element={<RedirigirProceso etapa="comparativo" />} />
            <Route path="negociacion" element={<Navigate to="/cliente/procesos?etapa=en_negociacion" replace />} />
            <Route path="negociacion/:id" element={<RedirigirProceso etapa="negociacion" />} />
            <Route path="adjudicacion" element={<Navigate to="/cliente/procesos?etapa=adjudicado" replace />} />
            <Route path="adjudicacion/:id" element={<RedirigirProceso etapa="adjudicacion" />} />
            <Route path="contratos" element={<Contratos />} />
            <Route path="contratos/:id" element={<ContratoDetalle />} />
            <Route path="seguimiento" element={<RedirigirSeguimiento />} />
            <Route path="pagos" element={<RequireRole allow={["comprador", "admin_cliente", "aprobador_cfo"]}><CuentasPorPagar /></RequireRole>} />
            <Route path="plantillas" element={<RequireRole allow={["admin_cliente"]}><PlantillasDocumentos /></RequireRole>} />
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
            <Route path="procesos" element={<ProcesosProveedor />} />
            {/* Old addresses of the screens merged into Procesos and Perfil. */}
            <Route path="oportunidades" element={<Navigate to="/proveedor/procesos" replace />} />
            <Route path="invitaciones" element={<Navigate to="/proveedor/procesos" replace />} />
            <Route path="ofertas" element={<Navigate to="/proveedor/procesos?vista=participando" replace />} />
            <Route path="historial" element={<Navigate to="/proveedor/procesos?vista=terminados" replace />} />
            <Route path="subasta" element={<Navigate to="/proveedor/procesos?vista=participando" replace />} />
            <Route path="vitrina" element={<Navigate to="/proveedor/perfil?vista=vitrina" replace />} />
            <Route path="ofertas/:requerimientoId" element={<CargaOferta />} />
            <Route path="subasta/:requerimientoId" element={<SubastaVivo />} />
            <Route path="desempeno" element={<MiDesempeno />} />
            <Route path="contratos" element={<MisContratos />} />
            <Route path="contratos/:id" element={<MiContratoDetalle />} />
            <Route path="pagos" element={<PagosProveedor />} />
            <Route path="perfil" element={<PerfilEmpresa />} />
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
            <Route path="dashboard" element={<Navigate to="/interno/empresas" replace />} />
            <Route path="empresas" element={<EmpresasClientes />} />
            <Route path="empresas/:id" element={<EmpresaDetalle />} />
            <Route path="homologacion" element={<RequireRole allow={["compliance_ops"]}><ColaHomologacion /></RequireRole>} />
            <Route path="riesgo" element={<RequireRole allow={["compliance_ops"]}><RiesgoContinuo /></RequireRole>} />
            <Route path="notificaciones" element={<CentroNotificaciones />} />
            <Route path="configuracion" element={<ConfiguracionCuenta portal="interno" />} />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}
