import React, { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

const API_BASE = (import.meta.env.VITE_API_URL || "https://api.vidriobras.com").replace(/\/$/, "");

export default function LoginResetPassword() {
  const navigate = useNavigate();
  const location = useLocation();

  const [correo, setCorreo] = useState("");
  const [nuevaContrasena, setNuevaContrasena] = useState("");
  const [confirmarContrasena, setConfirmarContrasena] = useState("");
  const [mensaje, setMensaje] = useState("");
  const [loading, setLoading] = useState(false);

  const tokenData = useMemo(() => {
    const hashParams = new URLSearchParams(window.location.hash.substring(1));
    const searchParams = new URLSearchParams(location.search);
    const accessToken = hashParams.get("access_token") || searchParams.get("access_token") || "";
    const type = hashParams.get("type") || searchParams.get("type") || "";
    return { accessToken, type };
  }, [location.search]);

  const isRecoveryMode = Boolean(tokenData.accessToken && tokenData.type.toLowerCase() === "recovery");

  useEffect(() => {
    if (isRecoveryMode) {
      // Limpia hash para no dejar el token visible en URL.
      window.history.replaceState(null, "", "/login/reset-password");
    }
  }, [isRecoveryMode]);

  const enviarCorreoRecuperacion = async (e) => {
    e.preventDefault();
    setMensaje("");

    const correoLimpio = (correo || "").trim().toLowerCase();
    if (!correoLimpio) {
      setMensaje("Ingresa tu correo.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/clientes/password-reset/request`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ correo: correoLimpio }),
      });
      const json = await res.json().catch(() => ({}));
      setMensaje(json.message || (res.ok ? "Te enviamos un correo de recuperación." : "No se pudo enviar el correo."));
    } catch {
      setMensaje("Error de conexión al enviar correo de recuperación.");
    } finally {
      setLoading(false);
    }
  };

  const confirmarNuevaContrasena = async (e) => {
    e.preventDefault();
    setMensaje("");

    if (!nuevaContrasena) {
      setMensaje("Ingresa la nueva contraseña.");
      return;
    }
    if (nuevaContrasena.length < 6) {
      setMensaje("La contraseña debe tener al menos 6 caracteres.");
      return;
    }
    if (nuevaContrasena !== confirmarContrasena) {
      setMensaje("Las contraseñas no coinciden.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/clientes/password-reset/confirm`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          access_token: tokenData.accessToken,
          nueva_contrasena: nuevaContrasena,
        }),
      });

      const json = await res.json().catch(() => ({}));
      if (res.ok && json.success) {
        setMensaje(json.message || "Contraseña restablecida correctamente.");
        setTimeout(() => navigate("/login", { replace: true }), 1500);
      } else {
        setMensaje(json.message || "No se pudo restablecer la contraseña.");
      }
    } catch {
      setMensaje("Error de conexión al restablecer la contraseña.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: "100vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "92px 16px 24px",
      background: "rgba(128,194,220,0.08)",
      fontFamily: "'Open Sans', sans-serif",
    }}>
      <div style={{
        width: "100%",
        maxWidth: 460,
        borderRadius: 20,
        padding: 28,
        border: "1px solid rgba(128,194,220,0.28)",
        background: "linear-gradient(160deg, rgba(128,194,220,0.22) 0%, rgba(80,160,200,0.18) 40%, rgba(40,120,170,0.25) 100%)",
        backdropFilter: "blur(26px) saturate(180%)",
        WebkitBackdropFilter: "blur(26px) saturate(180%)",
        boxShadow: "0 8px 32px rgba(0,0,0,0.16), inset 0 0 40px rgba(128,194,220,0.08)",
      }}>
        <div style={{ width: 36, height: 3, borderRadius: 3, background: "#80C2DC", marginBottom: 10 }} />
        <p style={{ margin: 0, fontSize: 11, letterSpacing: ".16em", textTransform: "uppercase", color: "rgba(128,194,220,0.85)", fontWeight: 700 }}>
          Seguridad de Cuenta
        </p>
        <h1 style={{ margin: "6px 0 20px", fontFamily: "'Oswald', sans-serif", fontWeight: 700, fontSize: 34, color: "#fff", lineHeight: 1.04 }}>
          {isRecoveryMode ? "Nueva contraseña" : "¿Olvidaste tu contraseña?"}
        </h1>

        {!isRecoveryMode ? (
          <form onSubmit={enviarCorreoRecuperacion} style={{ display: "grid", gap: 12 }}>
            <input
              type="email"
              value={correo}
              onChange={(e) => setCorreo(e.target.value)}
              placeholder="Correo electrónico"
              style={{
                width: "100%",
                borderRadius: 12,
                border: "1px solid rgba(128,194,220,0.5)",
                background: "rgba(0, 10, 28, 0.65)",
                color: "#fff",
                fontSize: 14,
                padding: "12px 14px",
                outline: "none",
              }}
            />
            <button
              type="submit"
              disabled={loading}
              style={{
                width: "100%",
                border: "none",
                borderRadius: 12,
                padding: "12px 0",
                cursor: loading ? "not-allowed" : "pointer",
                fontFamily: "'Oswald', sans-serif",
                fontSize: 14,
                fontWeight: 700,
                letterSpacing: ".1em",
                textTransform: "uppercase",
                background: "linear-gradient(135deg, #ffe033, #ffd600)",
                color: "#1a0a0a",
                opacity: loading ? 0.55 : 1,
              }}
            >
              {loading ? "Enviando..." : "Enviar correo de recuperación"}
            </button>
          </form>
        ) : (
          <form onSubmit={confirmarNuevaContrasena} style={{ display: "grid", gap: 12 }}>
            <input
              type="password"
              value={nuevaContrasena}
              onChange={(e) => setNuevaContrasena(e.target.value)}
              placeholder="Nueva contraseña"
              style={{
                width: "100%",
                borderRadius: 12,
                border: "1px solid rgba(128,194,220,0.5)",
                background: "rgba(0, 10, 28, 0.65)",
                color: "#fff",
                fontSize: 14,
                padding: "12px 14px",
                outline: "none",
              }}
            />
            <input
              type="password"
              value={confirmarContrasena}
              onChange={(e) => setConfirmarContrasena(e.target.value)}
              placeholder="Confirmar nueva contraseña"
              style={{
                width: "100%",
                borderRadius: 12,
                border: "1px solid rgba(128,194,220,0.5)",
                background: "rgba(0, 10, 28, 0.65)",
                color: "#fff",
                fontSize: 14,
                padding: "12px 14px",
                outline: "none",
              }}
            />
            <button
              type="submit"
              disabled={loading}
              style={{
                width: "100%",
                border: "none",
                borderRadius: 12,
                padding: "12px 0",
                cursor: loading ? "not-allowed" : "pointer",
                fontFamily: "'Oswald', sans-serif",
                fontSize: 14,
                fontWeight: 700,
                letterSpacing: ".1em",
                textTransform: "uppercase",
                background: "linear-gradient(135deg, #ffe033, #ffd600)",
                color: "#1a0a0a",
                opacity: loading ? 0.55 : 1,
              }}
            >
              {loading ? "Guardando..." : "Guardar nueva contraseña"}
            </button>
          </form>
        )}

        <button
          type="button"
          onClick={() => navigate("/login")}
          style={{
            marginTop: 14,
            width: "100%",
            borderRadius: 12,
            border: "1px solid rgba(255,255,255,0.55)",
            background: "rgba(255,255,255,0.12)",
            color: "#fff",
            fontFamily: "'Oswald', sans-serif",
            fontSize: 13,
            letterSpacing: ".08em",
            textTransform: "uppercase",
            padding: "10px 0",
            cursor: "pointer",
          }}
        >
          Volver a Iniciar Sesión
        </button>

        {!!mensaje && (
          <div style={{
            marginTop: 14,
            borderRadius: 10,
            padding: "10px 12px",
            border: "1px solid rgba(128,194,220,0.45)",
            background: "linear-gradient(135deg, rgba(0,20,50,0.92), rgba(0,35,70,0.96))",
            color: "rgba(200,235,255,0.95)",
            fontSize: 13,
            lineHeight: 1.35,
          }}>
            {mensaje}
          </div>
        )}
      </div>
    </div>
  );
}
