import { Link } from "react-router-dom";
import { LegalLayout, LegalSection } from "@/components/legal/LegalLayout";
import { usePageMeta } from "@/hooks/usePageMeta";

export function AvisoPrivacidad() {
  usePageMeta({ title: "Aviso de privacidad", description: "Cómo Procurex recopila, usa y protege los datos personales." });
  return (
    <LegalLayout title="Aviso de Privacidad" vigencia="15 de agosto de 2026">
      <p className="text-muted-foreground">
        En Procurex tratamos datos personales y empresariales de usuarios de los tres portales de la
        plataforma — Cliente, Proveedor y Panel Interno — para operar el Servicio descrito en nuestros{" "}
        <Link to="/terminos" className="text-primary hover:underline">Términos y Condiciones</Link>.
        Este aviso explica qué datos recopilamos, para qué los usamos, con quién los compartimos y
        cuáles son tus derechos, en línea con la Ley 1581 de 2012 y el Decreto 1377 de 2013 de
        Colombia sobre protección de datos personales (Habeas Data).
      </p>

      <LegalSection id="responsable" title="1. Responsable del tratamiento">
        <p>
          Procurex es el responsable del tratamiento de los datos personales recopilados a través de
          la plataforma. Puedes contactarnos para cualquier solicitud relacionada con este aviso en{" "}
          <a href="mailto:hola@procureos.com" className="text-primary hover:underline">hola@procureos.com</a>.
        </p>
      </LegalSection>

      <LegalSection id="datos" title="2. Datos que recopilamos">
        <p>Según el portal que uses, recopilamos:</p>
        <ul className="list-disc space-y-1.5 pl-5">
          <li><strong className="text-foreground">Datos de cuenta:</strong> nombre, correo electrónico, cargo y contraseña (almacenada de forma cifrada por nuestro proveedor de autenticación).</li>
          <li><strong className="text-foreground">Portal Cliente:</strong> razón social, datos de la empresa, requerimientos de compra, historial de licitaciones, negociaciones y aprobaciones.</li>
          <li><strong className="text-foreground">Portal Proveedor:</strong> razón social, NIT/RUT, ubicación, categorías, documentos de homologación (estados financieros, certificaciones, referencias comerciales) y el resultado de su verificación.</li>
          <li><strong className="text-foreground">Panel Interno:</strong> datos de identificación del personal de Procurex y su actividad de revisión, auditada en nuestra bitácora interna.</li>
          <li><strong className="text-foreground">Datos técnicos:</strong> dirección IP, tipo de dispositivo y registros de actividad, para seguridad y prevención de fraude.</li>
        </ul>
      </LegalSection>

      <LegalSection id="finalidad" title="3. Para qué usamos tus datos">
        <ul className="list-disc space-y-1.5 pl-5">
          <li>Crear y administrar tu cuenta y verificar tu identidad.</li>
          <li>Evaluar y homologar Proveedores, incluyendo la verificación de documentos y el cruce contra listas de sanciones.</li>
          <li>Gestionar requerimientos, licitaciones, negociaciones, adjudicaciones y contratos entre Clientes y Proveedores.</li>
          <li>Enviar notificaciones operativas (estado de tu homologación, invitaciones, resultados de procesos).</li>
          <li>Prevenir fraude, cumplir obligaciones legales y responder a requerimientos de autoridades competentes.</li>
          <li>Analizar y mejorar el Servicio.</li>
        </ul>
      </LegalSection>

      <LegalSection id="verificacion-automatizada" title="4. Verificación automatizada">
        <p>
          Como parte del proceso de homologación de Proveedores, usamos herramientas de reconocimiento
          óptico de caracteres (OCR) para leer documentos cargados y un servicio de cruce contra listas
          públicas de sanciones (incluida la lista OFAC/SDN) para identificar posibles coincidencias.
          Los resultados con alertas se envían a revisión manual por nuestro equipo de Compliance antes
          de tomar cualquier decisión — ningún Proveedor es rechazado únicamente por un proceso
          automatizado sin revisión humana.
        </p>
      </LegalSection>

      <LegalSection id="base-legal" title="5. Base legal">
        <p>
          Tratamos tus datos con base en tu consentimiento, otorgado al crear tu cuenta y aceptar
          estos avisos; en la ejecución del acuerdo de servicio entre Procurex y tu empresa; y en el
          cumplimiento de obligaciones legales aplicables al sector de compras corporativas y
          prevención de lavado de activos.
        </p>
      </LegalSection>

      <LegalSection id="compartir" title="6. Con quién compartimos tus datos">
        <ul className="list-disc space-y-1.5 pl-5">
          <li>La empresa Cliente que invita a un Proveedor a un proceso puede ver su perfil de homologación, score y documentos relevantes para evaluar su idoneidad.</li>
          <li>Nuestro equipo interno de Compliance accede a los datos necesarios para resolver casos de revisión manual.</li>
          <li>Proveedores de infraestructura tecnológica (por ejemplo, nuestro proveedor de base de datos y autenticación) que procesan datos en nuestro nombre bajo acuerdos de confidencialidad.</li>
          <li>Autoridades públicas, cuando exista una obligación legal o una orden válida que lo requiera.</li>
        </ul>
        <p>No vendemos tus datos personales a terceros.</p>
      </LegalSection>

      <LegalSection id="transferencias" title="7. Transferencia internacional de datos">
        <p>
          Parte de nuestra infraestructura tecnológica puede alojar datos fuera de Colombia. En esos
          casos, exigimos a nuestros proveedores medidas de seguridad y confidencialidad equivalentes
          a las requeridas por la ley colombiana de protección de datos.
        </p>
      </LegalSection>

      <LegalSection id="conservacion" title="8. Tiempo de conservación">
        <p>
          Conservamos tus datos mientras tu cuenta permanezca activa y durante el tiempo adicional
          necesario para cumplir obligaciones legales, contables o de auditoría, o para resolver
          disputas relacionadas con procesos ya adjudicados. Puedes solicitar la eliminación de tus
          datos conforme a la sección 9, sujeto a dichas obligaciones de conservación.
        </p>
      </LegalSection>

      <LegalSection id="derechos" title="9. Tus derechos (Habeas Data)">
        <p>Como titular de tus datos personales, tienes derecho a:</p>
        <ul className="list-disc space-y-1.5 pl-5">
          <li>Conocer, actualizar y rectificar tus datos.</li>
          <li>Solicitar prueba de la autorización otorgada.</li>
          <li>Ser informado sobre el uso que se le ha dado a tus datos.</li>
          <li>Revocar tu autorización y/o solicitar la supresión de tus datos, cuando no exista un deber legal o contractual que impida hacerlo.</li>
          <li>Acceder de forma gratuita a tus datos personales.</li>
        </ul>
        <p>
          Puedes ejercer estos derechos escribiendo a{" "}
          <a href="mailto:hola@procureos.com" className="text-primary hover:underline">hola@procureos.com</a>{" "}
          desde el correo asociado a tu cuenta. Responderemos dentro de los plazos establecidos por la
          ley aplicable.
        </p>
      </LegalSection>

      <LegalSection id="seguridad" title="10. Seguridad de la información">
        <p>
          Aplicamos medidas técnicas y organizativas razonables para proteger tus datos, incluyendo
          cifrado en tránsito, control de acceso basado en roles por portal, autenticación de dos
          factores opcional y bitácoras de auditoría sobre acciones sensibles (como la aprobación o
          rechazo de una homologación).
        </p>
      </LegalSection>

      <LegalSection id="cookies" title="11. Cookies y tecnologías similares">
        <p>
          Usamos cookies y almacenamiento local estrictamente necesarios para mantener tu sesión
          iniciada y recordar tus preferencias de interfaz. No usamos cookies de publicidad de
          terceros.
        </p>
      </LegalSection>

      <LegalSection id="cambios" title="12. Cambios a este aviso">
        <p>
          Podemos actualizar este Aviso de Privacidad para reflejar cambios en nuestras prácticas o en
          la normativa aplicable. Publicaremos la versión vigente en esta página con su fecha de
          actualización.
        </p>
      </LegalSection>

      <LegalSection id="contacto" title="13. Contacto">
        <p>
          Si tienes preguntas sobre este aviso o el tratamiento de tus datos, escríbenos a{" "}
          <a href="mailto:hola@procureos.com" className="text-primary hover:underline">hola@procureos.com</a>.
        </p>
      </LegalSection>
    </LegalLayout>
  );
}
