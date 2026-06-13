import React, { useEffect, useState, useCallback, useMemo } from "react";
import { COLORS, FONTS } from "../../colors";

const Personal = () => {
  const [personalList, setPersonalList] = useState([]);
  const [tipoPersonalList, setTipoPersonalList] = useState([]);
  const [mostrarNuevoPersonal, setMostrarNuevoPersonal] = useState(false);
  const [nuevoPersonal, setNuevoPersonal] = useState({
    nombre: "",
    codigo: "",
    tipo_personal_id: "",
    cv: "",
    fecha_nacimiento: "",
    correo: "",
  });
  const [cvFile, setCvFile] = useState(null);
  const [subiendoCv, setSubiendoCv] = useState(false);
  const [allBonos, setAllBonos] = useState([]);
  const [nuevoBono, setNuevoBono] = useState("");
  const [bonoAEliminar, setBonoAEliminar] = useState("");
  const [selectedBonoId, setSelectedBonoId] = useState("");
  const [selectedPersonalIds, setSelectedPersonalIds] = useState([]);
  const [guardandoAsignacion, setGuardandoAsignacion] = useState(false);
  const [selectedPersonal, setSelectedPersonal] = useState(null);
  const [personalBonos, setPersonalBonos] = useState([]);
  const [montoPagoBono, setMontoPagoBono] = useState("");
  const [montoPagoMensual, setMontoPagoMensual] = useState("");
  const [toast, setToast] = useState(null);
  const [erroresPersonal, setErroresPersonal] = useState({});
  const [erroresMontoBono, setErroresMontoBono] = useState("");
  const [erroresMontoMensual, setErroresMontoMensual] = useState("");
  const [enviandoCorreo, setEnviandoCorreo] = useState(false);
  const [windowWidth, setWindowWidth] = useState(
    typeof window !== "undefined" ? window.innerWidth : 1024
  );

  const [mostrarModalPagoIndividual, setMostrarModalPagoIndividual] = useState(false);
  const [mostrarModalPagoTodos, setMostrarModalPagoTodos] = useState(false);
  const [montoPagoModal, setMontoPagoModal] = useState("");
  const [loadingPagoIndividual, setLoadingPagoIndividual] = useState(false);
  const [loadingPagoTodos, setLoadingPagoTodos] = useState(false);

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // ─── Validaciones ────────────────────────────────────────────────────────────

  const validarPersonal = (personal) => {
    const errores = {};
    if (!personal.nombre.trim()) {
      errores.nombre = "El nombre es requerido";
    } else if (personal.nombre.trim().length < 3) {
      errores.nombre = "El nombre debe tener al menos 3 caracteres";
    }
    if (!personal.codigo.trim()) {
      errores.codigo = "El código es requerido";
    } else if (!/^[a-zA-Z0-9_-]+$/.test(personal.codigo)) {
      errores.codigo =
        "El código solo puede contener letras, números, guiones y guiones bajos";
    }
    if (!personal.tipo_personal_id) {
      errores.tipo_personal_id = "Debe seleccionar un tipo de personal";
    }
    if (personal.correo && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(personal.correo)) {
      errores.correo = "Ingresa un correo electrónico válido";
    }
    if (personal.fecha_nacimiento) {
      const fecha = new Date(personal.fecha_nacimiento);
      const hoy = new Date();
      hoy.setHours(0, 0, 0, 0);
      if (fecha < hoy) {
        errores.fecha_nacimiento = "La fecha no puede ser en el pasado";
      }
    }
    return errores;
  };

  const validarMonto = (monto, tipo = "bono") => {
    if (!monto || monto.trim() === "") return `El monto del ${tipo} es requerido`;
    const num = parseFloat(monto);
    if (isNaN(num)) return `El monto debe ser un número válido`;
    if (num <= 0) return `El monto debe ser mayor a 0`;
    if (num > 999999) return `El monto no puede exceder 999,999`;
    return "";
  };

  const validarMontoPagoModal = () => {
    const error = validarMonto(montoPagoModal, "pago");
    if (error) {
      showToast(error, "error");
      return false;
    }
    return true;
  };

  const limpiarMonto = (valor) => {
    const limpio = valor.replace(/[^0-9.]/g, "");
    const partes = limpio.split(".");
    if (partes.length > 2) return partes[0] + "." + partes.slice(1).join("");
    return limpio;
  };

  // ─── Toast ───────────────────────────────────────────────────────────────────

  const showToast = useCallback((mensaje, tipo = "success") => {
    setToast({ mensaje, tipo });
    setTimeout(() => setToast(null), 3500);
  }, []);

  // ─── Fetches ─────────────────────────────────────────────────────────────────

  const fetchPersonal = async () => {
    try {
      const res = await fetch("/api/personal");
      const data = await res.json();
      setPersonalList(data.success ? data.data : []);
    } catch {
      showToast("Error al cargar personal", "error");
    }
  };

  const fetchAllBonos = async () => {
    try {
      const res = await fetch("/api/bonos");
      const data = await res.json();
      setAllBonos(data.success ? data.data : []);
    } catch {
      showToast("Error al cargar bonos", "error");
    }
  };

  const fetchTipoPersonal = async () => {
    try {
      const res = await fetch("/api/tipo_personal");
      const data = await res.json();
      if (Array.isArray(data)) {
        setTipoPersonalList(data);
      } else {
        setTipoPersonalList(data.success ? data.data : []);
      }
    } catch {
      showToast("Error al cargar tipos de personal", "error");
    }
  };

  const fetchPersonalBonos = async (personalId) => {
    try {
      const res = await fetch(`/api/personal/${personalId}/bonos`);
      const data = await res.json();
      setPersonalBonos(data.success ? data.data : []);
    } catch {
      showToast("Error al cargar bonos", "error");
    }
  };

  const uploadCvFile = async (file) => {
    if (!file) return null;
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/personal/upload-cv", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (data.success && data.data?.url) return data.data.url;
      showToast(data.message || "Error al subir el CV", "error");
      return null;
    } catch {
      showToast("Error al subir el CV", "error");
      return null;
    }
  };

  useEffect(() => {
    fetchPersonal();
    fetchTipoPersonal();
    fetchAllBonos();
  }, []);

  // ─── Handlers ────────────────────────────────────────────────────────────────

  const abrirModalPagoIndividual = () => {
    if (!selectedPersonal) {
      showToast("Selecciona un personal primero", "error");
      return;
    }
    setMontoPagoModal("");
    setMostrarModalPagoIndividual(true);
  };

  const abrirModalPagoTodos = () => {
    setMontoPagoModal("");
    setMostrarModalPagoTodos(true);
  };

  const confirmarPagoIndividual = async () => {
    if (!validarMontoPagoModal()) return;
    if (!selectedPersonal) return;

    setLoadingPagoIndividual(true);
    try {
      const monto = parseFloat(montoPagoModal);
      const res = await fetch(`/api/personal/${selectedPersonal.id_personal}/pago`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          monto,
          fecha: new Date().toISOString().split("T")[0],
        }),
      });
      const data = await res.json();

      if (!data.success) {
        showToast(data.message || "Error al registrar pago individual", "error");
        return;
      }

      const mailRes = await fetch("/mail/send-payment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to: selectedPersonal.correo,
          nombre: selectedPersonal.nombre,
          monto,
          tipo: "mensual",
        }),
      });
      const mailData = await mailRes.json();

      if (!mailData.ok) {
        showToast(mailData.error || "Pago registrado, pero no se pudo enviar el correo", "error");
        return;
      }

      showToast("Pago individual registrado y correo enviado");
      setMostrarModalPagoIndividual(false);
      setMontoPagoModal("");
      await fetchPersonal();
    } catch {
      showToast("Error al pagar individual", "error");
    } finally {
      setLoadingPagoIndividual(false);
    }
  };

  const confirmarPagoTodos = async () => {
    if (!validarMontoPagoModal()) return;

    setLoadingPagoTodos(true);
    try {
      const monto = parseFloat(montoPagoModal);
      const res = await fetch("/api/personal/pago-todos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          monto,
          fecha: new Date().toISOString().split("T")[0],
        }),
      });
      const data = await res.json();

      if (!data.success) {
        showToast(data.message || "Error al registrar pago a todos", "error");
        return;
      }

      const mailRes = await fetch("/mail/send-payment-all", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          monto,
          tipo: "mensual",
        }),
      });
      const mailData = await mailRes.json();

      if (!mailData.ok) {
        showToast(mailData.error || "Pago registrado, pero no se pudo enviar el correo a todos", "error");
        return;
      }

      showToast(`Pago a todos registrado. Correos enviados: ${mailData.sent}`);
      setMostrarModalPagoTodos(false);
      setMontoPagoModal("");
      await fetchPersonal();
    } catch {
      showToast("Error al pagar a todos", "error");
    } finally {
      setLoadingPagoTodos(false);
    }
  };

  const handleCrearPersonal = async () => {
    const errores = validarPersonal(nuevoPersonal);
    setErroresPersonal(errores);
    if (Object.keys(errores).length > 0) {
      showToast("Completa correctamente todos los campos requeridos", "error");
      return;
    }

    try {
      let cvUrl = nuevoPersonal.cv;

      if (cvFile) {
        if (cvFile.type !== "application/pdf") {
          showToast("El CV debe ser un archivo PDF", "error");
          return;
        }
        if (cvFile.size > 5 * 1024 * 1024) {
          showToast("El archivo PDF no debe exceder 5MB", "error");
          return;
        }
        setSubiendoCv(true);
        cvUrl = await uploadCvFile(cvFile);
        setSubiendoCv(false);
        if (!cvUrl) return;
      }

      const res = await fetch("/api/personal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...nuevoPersonal, cv: cvUrl }),
      });
      const data = await res.json();
      if (data.success) {
        showToast("Personal creado correctamente");
        setNuevoPersonal({
          nombre: "",
          codigo: "",
          tipo_personal_id: "",
          cv: "",
          fecha_nacimiento: "",
          correo: "",
        });
        setCvFile(null);
        setMostrarNuevoPersonal(false);
        setErroresPersonal({});
        await fetchPersonal();
      } else {
        showToast(data.message || "Error al crear personal", "error");
      }
    } catch {
      showToast("Error al crear personal", "error");
    }
  };

  const handleSelectPersonal = (personal) => {
    setSelectedPersonal(personal);
    fetchPersonalBonos(personal.id_personal);
    setMontoPagoBono("");
    setMontoPagoMensual("");
    setErroresMontoBono("");
    setErroresMontoMensual("");
  };

  const handleTogglePersonalCheck = (personalId) => {
    if (!selectedBonoId) return;
    setSelectedPersonalIds((prev) =>
      prev.includes(personalId)
        ? prev.filter((id) => id !== personalId)
        : [...prev, personalId]
    );
  };

  const handleGuardarAsignacionBono = async () => {
    if (!selectedBonoId) { showToast("Selecciona un bono", "error"); return; }
    if (selectedPersonalIds.length === 0) {
      showToast("Selecciona al menos un personal", "error");
      return;
    }
    setGuardandoAsignacion(true);
    try {
      const resultados = await Promise.all(
        selectedPersonalIds.map(async (personalId) => {
          const res = await fetch(`/api/personal/${personalId}/bonos`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ bono_id: selectedBonoId }),
          });
          const data = await res.json();
          return { ok: Boolean(data.success), personalId };
        })
      );
      const exitos = resultados.filter((r) => r.ok).length;
      const fallidos = resultados.length - exitos;
      if (exitos > 0 && fallidos === 0) {
        showToast(`Bono asignado a ${exitos} personal`);
      } else if (exitos > 0) {
        showToast(`Asignados: ${exitos}, con error: ${fallidos}`, "error");
      } else {
        showToast("No se pudo asignar el bono", "error");
      }
      setSelectedPersonalIds([]);
      if (selectedPersonal?.id_personal) fetchPersonalBonos(selectedPersonal.id_personal);
    } catch {
      showToast("Error al guardar asignacion", "error");
    } finally {
      setGuardandoAsignacion(false);
    }
  };

  const handleCrearBono = async () => {
    const descripcion = nuevoBono.trim();
    if (!descripcion) { showToast("Ingresa el nombre del bono", "error"); return; }
    try {
      const res = await fetch("/api/bonos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ descripcion }),
      });
      const data = await res.json();
      if (data.success) {
        showToast("Bono creado");
        setNuevoBono("");
        await fetchAllBonos();
      } else {
        showToast(data.message || "Error al crear bono", "error");
      }
    } catch {
      showToast("Error al crear bono", "error");
    }
  };

  const handleEliminarBono = async () => {
    if (!bonoAEliminar) { showToast("Selecciona un bono para eliminar", "error"); return; }
    try {
      const res = await fetch(`/api/bonos/${bonoAEliminar}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) {
        showToast("Bono eliminado");
        if (selectedBonoId === bonoAEliminar) setSelectedBonoId("");
        setBonoAEliminar("");
        await fetchAllBonos();
      } else {
        showToast(data.message || "Error al eliminar bono", "error");
      }
    } catch {
      showToast("Error al eliminar bono", "error");
    }
  };

  const handleEliminarPersonal = async () => {
    if (!selectedPersonal) return;
    const confirmEliminar = window.confirm(
      `¿Estás seguro de que deseas eliminar a ${selectedPersonal.nombre}? Esta acción no se puede deshacer.`
    );
    if (!confirmEliminar) return;
    try {
      const res = await fetch(`/api/personal/${selectedPersonal.id_personal}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (data.success) {
        showToast(`${selectedPersonal.nombre} eliminado correctamente`);
        setSelectedPersonal(null);
        setErroresPersonal({});
        await fetchPersonal();
      } else {
        showToast(data.message || "Error al eliminar personal", "error");
      }
    } catch {
      showToast("Error al eliminar personal", "error");
    }
  };

  // ─── Envío de correo ─────────────────────────────────────────────────────────

  /**
   * Envía una notificación de pago por correo usando el endpoint /mail/send-payment.
   * tipo: "mensual" | "bono"
   */
  const enviarNotificacionPago = async (monto, tipo = "mensual") => {
    if (!selectedPersonal?.correo) return; // sin correo, silencioso

    try {
      const res = await fetch("/mail/send-payment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to: selectedPersonal.correo,
          nombre: selectedPersonal.nombre,
          monto: parseFloat(monto),
          tipo,
        }),
      });
      const data = await res.json();
      if (!data.ok) {
        console.warn("No se pudo enviar el correo:", data.error);
      }
    } catch (e) {
      console.warn("Error al enviar notificación por correo:", e);
    }
  };

  /**
   * Botón "Enviar correo" manual: envía un correo genérico al personal seleccionado.
   */
  const handleEnviarCorreo = async () => {
    if (!selectedPersonal) {
      showToast("Selecciona un personal primero", "error");
      return;
    }
    if (!selectedPersonal.correo) {
      showToast("Este personal no tiene correo registrado", "error");
      return;
    }

    setEnviandoCorreo(true);
    try {
      const res = await fetch("/mail/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to: selectedPersonal.correo,
          subject: "Notificación de pago de sueldo",
          html: `
            <!DOCTYPE html>
            <html lang="es">
            <body style="margin:0;padding:0;background:#f4f6f9;font-family:Arial,sans-serif;">
              <table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 0;">
                <tr><td align="center">
                  <table width="520" cellpadding="0" cellspacing="0"
                    style="background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 4px 20px rgba(0,0,0,0.08);">
                    <tr>
                      <td style="background:#4f46e5;padding:28px 36px;text-align:center;">
                        <div style="font-size:32px;">💼</div>
                        <h1 style="margin:8px 0 0;color:#fff;font-size:20px;font-weight:700;">¡Sueldo pagado!</h1>
                      </td>
                    </tr>
                    <tr>
                      <td style="padding:32px 36px;">
                        <p style="margin:0 0 14px;color:#374151;font-size:15px;">
                          Hola, <strong>${selectedPersonal.nombre}</strong> 👋
                        </p>
                        <p style="margin:0 0 24px;color:#6b7280;font-size:14px;line-height:1.6;">
                          Te informamos que tu <strong>remuneración ha sido pagada</strong> correctamente.
                          Si tienes alguna duda, comunícate con el área de administración.
                        </p>
                        <p style="margin:0;color:#9ca3af;font-size:12px;">
                          Este mensaje es generado automáticamente, por favor no respondas a este correo.
                        </p>
                      </td>
                    </tr>
                    <tr>
                      <td style="background:#f9fafb;border-top:1px solid #e5e7eb;padding:16px 36px;text-align:center;">
                        <p style="margin:0;color:#9ca3af;font-size:11px;">© ${new Date().getFullYear()} Sistema de Gestión de Personal</p>
                      </td>
                    </tr>
                  </table>
                </td></tr>
              </table>
            </body>
            </html>
          `,
          text: `Hola ${selectedPersonal.nombre}, tu sueldo ha sido pagado correctamente. Fecha: ${new Date().toLocaleDateString("es-ES")}.`,
        }),
      });
      const data = await res.json();
      if (data.ok) {
        showToast(`Correo enviado a ${selectedPersonal.correo}`);
      } else {
        showToast(data.error || "Error al enviar el correo", "error");
      }
    } catch {
      showToast("Error al enviar el correo", "error");
    } finally {
      setEnviandoCorreo(false);
    }
  };

  // ─── Pago de bono ─────────────────────────────────────────────────────────────

  const handlePagarBono = async () => {
    const error = validarMonto(montoPagoBono, "bono");
    setErroresMontoBono(error);
    if (error) { showToast(error, "error"); return; }
    if (!selectedPersonal) { showToast("Selecciona un personal", "error"); return; }

    try {
      const res = await fetch(`/api/personal/${selectedPersonal.id_personal}/pago-bono`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          monto: parseFloat(montoPagoBono),
          fecha: new Date().toISOString().split("T")[0],
        }),
      });
      const data = await res.json();
      if (data.success) {
        showToast("Bono pagado y registrado correctamente");
        setMontoPagoBono("");
        setErroresMontoBono("");
        await enviarNotificacionPago(montoPagoBono, "bono");
      } else {
        showToast(data.message || "Error al pagar bono", "error");
      }
    } catch {
      showToast("Error al pagar bono", "error");
    }
  };

  // ─── Pago mensual ─────────────────────────────────────────────────────────────

  const handlePagarMensual = async () => {
    const error = validarMonto(montoPagoMensual, "pago mensual");
    setErroresMontoMensual(error);
    if (error) { showToast(error, "error"); return; }
    if (!selectedPersonal) { showToast("Selecciona un personal", "error"); return; }

    try {
      const res = await fetch(`/api/personal/${selectedPersonal.id_personal}/pago`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          monto: parseFloat(montoPagoMensual),
          fecha: new Date().toISOString().split("T")[0],
        }),
      });
      const data = await res.json();
      if (data.success) {
        showToast("Pago mensual registrado correctamente");
        setMontoPagoMensual("");
        setErroresMontoMensual("");
        await enviarNotificacionPago(montoPagoMensual, "mensual");
      } else {
        showToast(data.message || "Error al registrar pago mensual", "error");
      }
    } catch {
      showToast("Error al registrar pago mensual", "error");
    }
  };

  // ─── Próximo pago ─────────────────────────────────────────────────────────────

  const nextPayText = (() => {
    const today = new Date();
    const day = today.getDate();
    const nextPayDay =
      day < 15 ? 15 : new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
    const nextPayMonth = day < 15 ? today.getMonth() : today.getMonth() + 1;
    const nextPayDate = new Date(today.getFullYear(), nextPayMonth, nextPayDay);
    return nextPayDate.toLocaleDateString("es-ES");
  })();

  // ─── Tipos de personal ────────────────────────────────────────────────────────

  const tiposPersonalDisponibles = useMemo(() => {
    const mapa = new Map();
    (tipoPersonalList || []).forEach((t) => {
      const id = t?.id_tipo;
      const descripcion = (t?.descripcion || "").trim();
      if (id && descripcion) mapa.set(id, { id_tipo: id, descripcion });
    });
    (personalList || []).forEach((p) => {
      const id = p?.tipo_personal?.id_tipo;
      const descripcion = (p?.tipo_personal?.descripcion || "").trim();
      if (id && descripcion && !mapa.has(id)) mapa.set(id, { id_tipo: id, descripcion });
    });
    return Array.from(mapa.values()).sort((a, b) =>
      a.descripcion.localeCompare(b.descripcion, "es")
    );
  }, [tipoPersonalList, personalList]);

  // ─── Estilos de campo ─────────────────────────────────────────────────────────

  const fieldStyle = (hasError) => ({
    width: "100%",
    padding: 10,
    borderRadius: 8,
    border: `1px solid ${hasError ? COLORS.error : COLORS.border}`,
    fontFamily: FONTS.body,
    color: COLORS.text,
    boxShadow: hasError ? `0 0 0 2px ${COLORS.error}22` : "none",
    boxSizing: "border-box",
  });

  const errorMsg = (msg) =>
    msg ? (
      <div style={{ fontSize: "0.75rem", color: COLORS.error, marginTop: 4, fontFamily: FONTS.body }}>
        {msg}
      </div>
    ) : null;

  const modalOverlayStyle = {
    position: "fixed",
    top: 0,
    left: 0,
    width: "100%",
    height: "100%",
    background: "rgba(0,0,0,0.35)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1000,
  };

  const modalContentStyle = {
    width: windowWidth < 640 ? "92%" : 440,
    background: COLORS.white,
    borderRadius: 16,
    padding: 24,
    boxShadow: "0 16px 36px rgba(0,0,0,0.22)",
  };

  // ─── Render ───────────────────────────────────────────────────────────────────

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: windowWidth < 768 ? "1fr" : "1fr 1.2fr",
        gap: 20,
      }}
    >
      {/* Toast */}
      {toast && (
        <div
          style={{
            position: "fixed",
            top: 20,
            right: 20,
            padding: "10px 14px",
            borderRadius: 12,
            color: COLORS.white,
            background:
              toast.tipo === "success"
                ? COLORS.success
                : toast.tipo === "info"
                ? "#3b82f6"
                : COLORS.error,
            boxShadow: "0 10px 30px rgba(0,0,0,0.12)",
            fontWeight: 700,
            zIndex: 50,
            fontFamily: FONTS.heading,
          }}
        >
          {toast.mensaje}
        </div>
      )}

      {mostrarModalPagoIndividual && (
        <div style={modalOverlayStyle}>
          <div style={modalContentStyle}>
            <h3 style={{ margin: 0, marginBottom: 14, fontFamily: FONTS.heading, color: COLORS.text }}>
              Pagar a {selectedPersonal?.nombre || "personal"}
            </h3>
            <input
              type="text"
              placeholder="Monto a pagar"
              value={montoPagoModal}
              onChange={(e) => setMontoPagoModal(limpiarMonto(e.target.value))}
              style={{
                width: "100%",
                padding: 12,
                borderRadius: 10,
                border: `1px solid ${COLORS.border}`,
                fontFamily: FONTS.body,
                color: COLORS.text,
                marginBottom: 12,
              }}
            />
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              <button
                onClick={confirmarPagoIndividual}
                disabled={loadingPagoIndividual}
                style={{
                  flex: 1,
                  background: loadingPagoIndividual ? COLORS.textLight : COLORS.success,
                  color: COLORS.white,
                  border: "none",
                  borderRadius: 10,
                  padding: "12px 16px",
                  fontWeight: 700,
                  fontFamily: FONTS.heading,
                  cursor: loadingPagoIndividual ? "not-allowed" : "pointer",
                }}
              >
                {loadingPagoIndividual ? "Procesando..." : "Confirmar pago individual"}
              </button>
              <button
                onClick={() => setMostrarModalPagoIndividual(false)}
                style={{
                  flex: 1,
                  background: COLORS.textLight,
                  color: COLORS.white,
                  border: "none",
                  borderRadius: 10,
                  padding: "12px 16px",
                  fontWeight: 700,
                  fontFamily: FONTS.heading,
                  cursor: "pointer",
                }}
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {mostrarModalPagoTodos && (
        <div style={modalOverlayStyle}>
          <div style={modalContentStyle}>
            <h3 style={{ margin: 0, marginBottom: 14, fontFamily: FONTS.heading, color: COLORS.text }}>
              Pagar a todo el personal
            </h3>
            <input
              type="text"
              placeholder="Monto total a pagar"
              value={montoPagoModal}
              onChange={(e) => setMontoPagoModal(limpiarMonto(e.target.value))}
              style={{
                width: "100%",
                padding: 12,
                borderRadius: 10,
                border: `1px solid ${COLORS.border}`,
                fontFamily: FONTS.body,
                color: COLORS.text,
                marginBottom: 12,
              }}
            />
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              <button
                onClick={confirmarPagoTodos}
                disabled={loadingPagoTodos}
                style={{
                  flex: 1,
                  background: loadingPagoTodos ? COLORS.textLight : COLORS.success,
                  color: COLORS.white,
                  border: "none",
                  borderRadius: 10,
                  padding: "12px 16px",
                  fontWeight: 700,
                  fontFamily: FONTS.heading,
                  cursor: loadingPagoTodos ? "not-allowed" : "pointer",
                }}
              >
                {loadingPagoTodos ? "Procesando..." : "Confirmar pago a todos"}
              </button>
              <button
                onClick={() => setMostrarModalPagoTodos(false)}
                style={{
                  flex: 1,
                  background: COLORS.textLight,
                  color: COLORS.white,
                  border: "none",
                  borderRadius: 10,
                  padding: "12px 16px",
                  fontWeight: 700,
                  fontFamily: FONTS.heading,
                  cursor: "pointer",
                }}
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Tabla de personal ─────────────────────────────────────────────── */}
      <div>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: 10,
            marginBottom: 12,
            flexWrap: "wrap",
          }}
        >
          <h3
            style={{
              fontSize: "1.4rem",
              fontWeight: 800,
              margin: 0,
              fontFamily: FONTS.heading,
              color: COLORS.text,
            }}
          >
            Personal de la Empresa
          </h3>
          <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
            <button
              onClick={() => setMostrarNuevoPersonal((v) => !v)}
              style={{
                background: COLORS.primary,
                color: COLORS.white,
                border: "none",
                borderRadius: 8,
                padding: "8px 14px",
                fontWeight: 700,
                fontFamily: FONTS.heading,
                cursor: "pointer",
              }}
            >
              {mostrarNuevoPersonal ? "Cancelar" : "Nuevo personal"}
            </button>
            <button
              onClick={abrirModalPagoIndividual}
              style={{
                background: COLORS.secondary,
                color: COLORS.white,
                border: "none",
                borderRadius: 8,
                padding: "8px 14px",
                fontWeight: 700,
                fontFamily: FONTS.heading,
                cursor: "pointer",
              }}
            >
              Pagar elegido
            </button>
            <button
              onClick={abrirModalPagoTodos}
              style={{
                background: COLORS.secondary,
                color: COLORS.white,
                border: "none",
                borderRadius: 8,
                padding: "8px 14px",
                fontWeight: 700,
                fontFamily: FONTS.heading,
                cursor: "pointer",
              }}
            >
              Pagar a todos
            </button>
            <button
              onClick={handleEnviarCorreo}
              disabled={enviandoCorreo}
              title={
                !selectedPersonal
                  ? "Selecciona un personal primero"
                  : !selectedPersonal.correo
                  ? "El personal seleccionado no tiene correo"
                  : `Enviar notificación a ${selectedPersonal.correo}`
              }
              style={{
                background:
                  enviandoCorreo || !selectedPersonal?.correo
                    ? COLORS.textLight
                    : COLORS.secondary,
                color: COLORS.white,
                border: "none",
                borderRadius: 8,
                padding: "8px 14px",
                fontWeight: 700,
                fontFamily: FONTS.heading,
                cursor:
                  enviandoCorreo || !selectedPersonal?.correo
                    ? "not-allowed"
                    : "pointer",
                opacity: !selectedPersonal?.correo ? 0.6 : 1,
              }}
            >
              {enviandoCorreo ? "Enviando..." : "✉️ Enviar correo"}
            </button>
          </div>
        </div>

        {/* ── Formulario nuevo personal ────────────────────────────────────── */}
        {mostrarNuevoPersonal && (
          <div
            style={{
              marginBottom: 12,
              padding: 12,
              border: `1px solid ${COLORS.border}`,
              borderRadius: 10,
              background: COLORS.white,
              boxShadow: "0 6px 18px rgba(0,0,0,0.06)",
            }}
          >
            <div
              style={{
                display: "grid",
                gridTemplateColumns:
                  windowWidth < 640 ? "1fr" : "repeat(2, minmax(0, 1fr))",
                gap: 12,
              }}
            >
              {/* Nombre */}
              <div>
                <input
                  type="text"
                  placeholder="Nombre (mín. 3 caracteres)"
                  value={nuevoPersonal.nombre}
                  onChange={(e) => {
                    setNuevoPersonal((prev) => ({ ...prev, nombre: e.target.value }));
                    if (e.target.value.trim())
                      setErroresPersonal((prev) => { const n = { ...prev }; delete n.nombre; return n; });
                  }}
                  style={fieldStyle(erroresPersonal.nombre)}
                />
                {errorMsg(erroresPersonal.nombre)}
              </div>

              {/* Código */}
              <div>
                <input
                  type="text"
                  placeholder="Código (letras, números, -, _)"
                  value={nuevoPersonal.codigo}
                  onChange={(e) => {
                    setNuevoPersonal((prev) => ({ ...prev, codigo: e.target.value }));
                    if (e.target.value.trim())
                      setErroresPersonal((prev) => { const n = { ...prev }; delete n.codigo; return n; });
                  }}
                  style={fieldStyle(erroresPersonal.codigo)}
                />
                {errorMsg(erroresPersonal.codigo)}
              </div>

              {/* Tipo personal */}
              <div>
                <select
                  value={nuevoPersonal.tipo_personal_id}
                  onChange={(e) => {
                    setNuevoPersonal((prev) => ({ ...prev, tipo_personal_id: e.target.value }));
                    if (e.target.value)
                      setErroresPersonal((prev) => { const n = { ...prev }; delete n.tipo_personal_id; return n; });
                  }}
                  style={fieldStyle(erroresPersonal.tipo_personal_id)}
                >
                  <option value="">-- Tipo de personal --</option>
                  {tiposPersonalDisponibles.map((t) => (
                    <option key={t.id_tipo} value={t.id_tipo}>
                      {t.descripcion}
                    </option>
                  ))}
                </select>
                {errorMsg(erroresPersonal.tipo_personal_id)}
              </div>

              {/* Correo electrónico */}
              <div>
                <input
                  type="email"
                  placeholder="Correo electrónico"
                  value={nuevoPersonal.correo}
                  onChange={(e) => {
                    setNuevoPersonal((prev) => ({ ...prev, correo: e.target.value }));
                    if (e.target.value.trim())
                      setErroresPersonal((prev) => { const n = { ...prev }; delete n.correo; return n; });
                  }}
                  style={fieldStyle(erroresPersonal.correo)}
                />
                {errorMsg(erroresPersonal.correo)}
              </div>

              {/* CV */}
              <div>
                <input
                  type="file"
                  accept=".pdf"
                  onChange={(e) => setCvFile(e.target.files?.[0] || null)}
                  style={fieldStyle(false)}
                />
                <div
                  style={{
                    fontSize: "0.75rem",
                    color: COLORS.textLight,
                    marginTop: 4,
                    fontFamily: FONTS.body,
                  }}
                >
                  Máx 5MB, formato PDF
                </div>
              </div>

              {/* Fecha nacimiento */}
              <div>
                <input
                  type="date"
                  value={nuevoPersonal.fecha_nacimiento}
                  min={new Date().toISOString().split("T")[0]}
                  onChange={(e) => {
                    setNuevoPersonal((prev) => ({ ...prev, fecha_nacimiento: e.target.value }));
                    if (e.target.value)
                      setErroresPersonal((prev) => { const n = { ...prev }; delete n.fecha_nacimiento; return n; });
                  }}
                  style={fieldStyle(erroresPersonal.fecha_nacimiento)}
                />
                {errorMsg(erroresPersonal.fecha_nacimiento)}
              </div>
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 14, gap: 10 }}>
              <button
                onClick={() => { setMostrarNuevoPersonal(false); setErroresPersonal({}); }}
                style={{
                  background: COLORS.textLight,
                  color: COLORS.white,
                  border: "none",
                  borderRadius: 8,
                  padding: "10px 16px",
                  fontWeight: 700,
                  fontFamily: FONTS.heading,
                  cursor: "pointer",
                }}
              >
                Cancelar
              </button>
              <button
                onClick={handleCrearPersonal}
                disabled={subiendoCv}
                style={{
                  background: subiendoCv ? COLORS.textLight : COLORS.success,
                  color: COLORS.white,
                  border: "none",
                  borderRadius: 8,
                  padding: "10px 16px",
                  fontWeight: 700,
                  fontFamily: FONTS.heading,
                  cursor: subiendoCv ? "not-allowed" : "pointer",
                }}
              >
                {subiendoCv ? "Subiendo CV..." : "Guardar personal"}
              </button>
            </div>
          </div>
        )}
        {/* ... resto del render sin cambios ... */}
      </div>
      {/* ... resto de tu componente ... */}
    </div>
  );
};

export default Personal;