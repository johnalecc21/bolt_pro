import { Link } from "react-router-dom";
import { LegalLayout, LegalSection } from "@/components/legal/LegalLayout";
import { usePageMeta } from "@/hooks/usePageMeta";

export function TerminosCondiciones() {
  usePageMeta({ title: "Términos y condiciones", description: "Términos y condiciones de uso de la plataforma Procurex." });
  return (
    <LegalLayout title="Términos y Condiciones" vigencia="15 de agosto de 2026">
      <p className="text-muted-foreground">
        Estos Términos y Condiciones ("Términos") regulan el acceso y uso de la plataforma Procurex
        (el "Servicio"), operada para conectar equipos de compras corporativas ("Clientes") con
        proveedores homologados ("Proveedores"), con apoyo del equipo de consultoría y compliance de
        Procurex ("Panel Interno"). Al crear una cuenta o utilizar cualquiera de los tres portales de
        Procurex aceptas estos Términos. Si actúas en nombre de una empresa, declaras tener la
        autoridad para vincularla a este acuerdo.
      </p>

      <LegalSection id="descripcion" title="1. Descripción del servicio">
        <p>
          Procurex es una plataforma de Procurement-as-a-Service que permite a las empresas Clientes
          crear requerimientos de compra, homologar y evaluar Proveedores, gestionar licitaciones y
          negociaciones, adjudicar contratos y hacer seguimiento a su cumplimiento. Procurex actúa
          como intermediario tecnológico y de compliance; no es parte de los contratos de suministro
          que se celebren entre un Cliente y un Proveedor a través de la plataforma.
        </p>
      </LegalSection>

      <LegalSection id="cuentas" title="2. Registro y cuentas">
        <p>
          Para usar Procurex debes crear una cuenta con información veraz, completa y actualizada.
          Eres responsable de mantener la confidencialidad de tus credenciales y de toda actividad
          que ocurra bajo tu cuenta. Debes notificarnos de inmediato ante cualquier uso no autorizado.
        </p>
        <p>
          Las cuentas de Cliente son creadas por el equipo de Procurex a solicitud de la empresa
          contratante. Las cuentas de Proveedor pueden crearse por autoservicio y quedan sujetas al
          proceso de homologación descrito en la sección 4. Las cuentas del Panel Interno son de uso
          exclusivo del personal de Procurex.
        </p>
      </LegalSection>

      <LegalSection id="uso-aceptable" title="3. Uso aceptable">
        <p>Al usar el Servicio te comprometes a no:</p>
        <ul className="list-disc space-y-1.5 pl-5">
          <li>Proporcionar información falsa, inexacta o documentos adulterados en tu perfil, homologación u ofertas.</li>
          <li>Intentar eludir, manipular o comprometer los mecanismos de verificación (OCR, cruce contra listas de sanciones, matriz de aprobación).</li>
          <li>Usar la plataforma para actividades fraudulentas, lavado de activos, financiación del terrorismo o cualquier fin ilícito.</li>
          <li>Acceder a cuentas, datos o documentos de otros usuarios sin autorización.</li>
          <li>Realizar ingeniería inversa, extraer datos de forma masiva (scraping) o interferir con la operación normal del Servicio.</li>
        </ul>
      </LegalSection>

      <LegalSection id="homologacion" title="4. Homologación y verificación de Proveedores">
        <p>
          Todo Proveedor debe completar un proceso de homologación que incluye la carga de documentos
          legales, financieros, certificaciones y referencias comerciales. Procurex utiliza
          reconocimiento óptico de caracteres (OCR) y cruce automatizado contra listas públicas de
          sanciones (incluida la lista OFAC/SDN) como parte de la evaluación inicial. Los casos que
          no se resuelven de forma automática pasan a revisión manual por el equipo de Compliance.
        </p>
        <p>
          La homologación no constituye una garantía absoluta de la idoneidad, solvencia o buena fe
          de un Proveedor. Los Clientes son responsables de realizar su propia diligencia adicional
          antes de adjudicar procesos de alto valor o riesgo.
        </p>
      </LegalSection>

      <LegalSection id="licitaciones" title="5. Licitaciones, ofertas y adjudicación">
        <p>
          Los Clientes publican requerimientos y gestionan el proceso de licitación, negociación y
          adjudicación a través de la plataforma. Las ofertas presentadas por los Proveedores son
          vinculantes en los términos que cada Cliente defina en su requerimiento. Procurex facilita
          las herramientas para este proceso, pero el contrato de suministro resultante se celebra
          directamente entre el Cliente y el Proveedor adjudicado; Procurex no es parte ni garante de
          dicho contrato, salvo que exista un acuerdo específico por escrito que indique lo contrario.
        </p>
      </LegalSection>

      <LegalSection id="planes" title="6. Planes, pagos y facturación">
        <p>
          El acceso al Servicio por parte de los Clientes está sujeto a un plan de suscripción
          (Starter, Growth o Enterprise) con las condiciones de precio y alcance vigentes al momento
          de la contratación. Los pagos se facturan según el ciclo acordado y no son reembolsables,
          salvo lo dispuesto expresamente en el contrato comercial correspondiente o por ley aplicable.
          El acceso de los Proveedores a la red de homologación no tiene costo de suscripción.
        </p>
      </LegalSection>

      <LegalSection id="propiedad" title="7. Propiedad intelectual">
        <p>
          El software, el diseño, las marcas y el contenido de Procurex son propiedad de Procurex o
          de sus licenciantes y están protegidos por la legislación de propiedad intelectual aplicable.
          Estos Términos no te otorgan ningún derecho sobre ellos más allá de una licencia limitada,
          no exclusiva e intransferible para usar el Servicio conforme a su finalidad. Conservas la
          propiedad de los documentos y datos que cargues; nos concedes una licencia limitada para
          procesarlos con el único fin de prestar el Servicio.
        </p>
      </LegalSection>

      <LegalSection id="confidencialidad" title="8. Confidencialidad">
        <p>
          La información comercial, financiera y de negociación que se intercambie a través de la
          plataforma (incluyendo montos, condiciones de oferta y documentos de homologación) es
          confidencial. Cada usuario se compromete a usarla únicamente para los fines del proceso de
          compras correspondiente y a no divulgarla a terceros sin autorización, salvo obligación
          legal.
        </p>
      </LegalSection>

      <LegalSection id="responsabilidad" title="9. Limitación de responsabilidad">
        <p>
          El Servicio se presta "tal cual" y "según disponibilidad". En la máxima medida permitida por
          la ley, Procurex no será responsable por decisiones comerciales tomadas por Clientes o
          Proveedores con base en la información disponible en la plataforma, ni por daños indirectos,
          incidentales o lucro cesante derivados del uso del Servicio. Nada en esta sección limita la
          responsabilidad por dolo, culpa grave o los casos en que la ley no permita su limitación.
        </p>
      </LegalSection>

      <LegalSection id="suspension" title="10. Suspensión y terminación">
        <p>
          Podemos suspender o cancelar tu cuenta si incumples estos Términos, si detectamos actividad
          fraudulenta o de alto riesgo, o por requerimiento de una autoridad competente. Puedes
          solicitar la cancelación de tu cuenta en cualquier momento escribiendo a{" "}
          <a href="mailto:hola@procureos.com" className="text-primary hover:underline">hola@procureos.com</a>.
          Algunas obligaciones (como confidencialidad y las derivadas de contratos ya adjudicados)
          sobreviven a la terminación de la cuenta.
        </p>
      </LegalSection>

      <LegalSection id="modificaciones" title="11. Modificaciones a estos Términos">
        <p>
          Podemos actualizar estos Términos para reflejar cambios en el Servicio o en la normativa
          aplicable. Publicaremos la versión vigente en esta misma página con su fecha de
          actualización. El uso continuado del Servicio después de una actualización implica la
          aceptación de los nuevos Términos.
        </p>
      </LegalSection>

      <LegalSection id="ley" title="12. Ley aplicable y jurisdicción">
        <p>
          Estos Términos se rigen por las leyes de la República de Colombia. Cualquier controversia
          derivada de su interpretación o cumplimiento se someterá a los jueces competentes de
          Colombia, sin perjuicio de los mecanismos de resolución alternativa de conflictos que las
          partes puedan acordar por escrito.
        </p>
      </LegalSection>

      <LegalSection id="contacto" title="13. Contacto">
        <p>
          Para preguntas sobre estos Términos, escríbenos a{" "}
          <a href="mailto:hola@procureos.com" className="text-primary hover:underline">hola@procureos.com</a>.
          Consulta también nuestro{" "}
          <Link to="/privacidad" className="text-primary hover:underline">Aviso de Privacidad</Link>.
        </p>
      </LegalSection>
    </LegalLayout>
  );
}
