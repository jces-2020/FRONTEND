import React, { useEffect, useState } from 'react';
import { COLORS, FONTS } from '../../colors';
import BrandCard from '../UI/BrandCard';
import BrandCtaButton from '../UI/BrandCtaButton';
import StripedTable, { StripedTableHead, StripedTh, StripedTableRow, StripedTd } from '../UI/StripedTable';
import { injectNeumorphicStyles } from '../UI/NeumorphicFormCard';

const labelStyle = {
  display: 'block',
  fontSize: 13,
  fontWeight: 700,
  color: COLORS.text,
  marginBottom: 6,
  fontFamily: FONTS.heading,
};

const nmFieldStyle = (hasError) => ({
  padding: '10px 16px',
  fontFamily: FONTS.body,
  color: COLORS.text,
  boxShadow: hasError ? `0 0 0 2px ${COLORS.error}55` : undefined,
  boxSizing: 'border-box',
});

const Proyecto = ({ onToast }) => {
  injectNeumorphicStyles();

  const [tiposServicio, setTiposServicio] = useState([]);
  const [nombreServicio, setNombreServicio] = useState('');
  const [descripcionServicio, setDescripcionServicio] = useState('');
  const [tipoServicioId, setTipoServicioId] = useState('');
  const [imagenServicio, setImagenServicio] = useState(null);
  const [previewServicio, setPreviewServicio] = useState('');
  const [categoriasServicio, setCategoriasServicio] = useState([]);
  const [nuevoTipoServicio, setNuevoTipoServicio] = useState('');
  const [nuevoPrecioEstimado, setNuevoPrecioEstimado] = useState('');
  const [editandoTipoId, setEditandoTipoId] = useState(null);
  const [editPrecioEstimado, setEditPrecioEstimado] = useState('');

  useEffect(() => {
    fetchTiposServicio();
  }, []);

  const fetchTiposServicio = async () => {
    try {
      const res = await fetch('/api/tipo_servicio');
      if (!res.ok) throw new Error('No se pudo cargar tipos de servicio');
      const data = await res.json();
      setTiposServicio(Array.isArray(data) ? data : []);
    } catch (e) {
      onToast?.('Error al cargar tipos de servicio', 'error');
    }
  };



  const handleAgregarTipoServicio = async () => {
    if (!nuevoTipoServicio.trim()) {
      onToast?.('Ingresa una descripción', 'error');
      return;
    }
    try {
      const res = await fetch('/api/tipo_servicio', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          descripcion: nuevoTipoServicio,
          precio_estimado: nuevoPrecioEstimado ? Number(nuevoPrecioEstimado) : 0
        })
      });
      if (!res.ok) throw new Error('No se pudo agregar tipo de servicio');
      setNuevoTipoServicio('');
      setNuevoPrecioEstimado('');
      fetchTiposServicio();
      onToast?.('Tipo de servicio agregado correctamente');
    } catch (e) {
      onToast?.('Error al agregar tipo de servicio', 'error');
    }
  };

  const handleIniciarEdicion = (t) => {
    setEditandoTipoId(t.id_tipo);
    setEditPrecioEstimado(t.precio_estimado != null ? String(t.precio_estimado) : '');
  };

  const handleGuardarEdicion = async (id) => {
    try {
      const res = await fetch(`/api/tipo_servicio/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ precio_estimado: editPrecioEstimado ? Number(editPrecioEstimado) : 0 })
      });
      if (!res.ok) throw new Error('No se pudo actualizar tipo de servicio');
      setEditandoTipoId(null);
      fetchTiposServicio();
      onToast?.('Tipo de servicio actualizado correctamente');
    } catch (e) {
      onToast?.('Error al actualizar tipo de servicio', 'error');
    }
  };

  const handleEliminarTipoServicio = async (id) => {
    if (!window.confirm('¿Eliminar este tipo de servicio?')) return;
    try {
      const res = await fetch(`/api/tipo_servicio/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('No se pudo eliminar tipo de servicio');
      fetchTiposServicio();
      onToast?.('Tipo de servicio eliminado correctamente');
    } catch (e) {
      onToast?.('Error al eliminar tipo de servicio', 'error');
    }
  };

  const handleGuardarProyecto = async () => {
    if (!nombreServicio.trim()) {
      onToast?.('El nombre es obligatorio', 'error');
      return;
    }

    let imgUrl = null;
    if (imagenServicio) {
      const maxBytes = 10 * 1024 * 1024;
      if (imagenServicio.size > maxBytes) {
        onToast?.('La imagen supera 10MB. Reduce el peso antes de subirla.', 'error');
        return;
      }

      const formData = new FormData();
      formData.append('file', imagenServicio);
      formData.append('tipo', tipoServicioId || 'otro');
      try {
        const resImg = await fetch('/api/servicio/upload-image', {
          method: 'POST',
          body: formData,
        });
        const dataImg = await resImg.json();
        if (resImg.ok && dataImg.url) {
          imgUrl = dataImg.url;
        } else {
          onToast?.(dataImg?.error || 'Error subiendo imagen', 'error');
          return;
        }
      } catch (e) {
        onToast?.('Error subiendo imagen', 'error');
        return;
      }
    }

    try {
      const body = {
        nombre: nombreServicio,
        descripcion: descripcionServicio,
        tipo_servicio_id: tipoServicioId,
        ING: imgUrl || undefined,
      };
      const res = await fetch('/api/servicio', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const payload = await res.json();
      if (!res.ok) {
        throw new Error(payload?.error || payload?.mensaje || 'Error guardando servicio');
      }
      onToast?.('Proyecto/servicio registrado correctamente');
      setNombreServicio('');
      setDescripcionServicio('');
      setTipoServicioId('');
      setImagenServicio(null);
      setPreviewServicio('');
    } catch (e) {
      onToast?.(`Error al guardar servicio: ${e.message}`, 'error');
    }
  };

  return (
    <div style={{ maxWidth: 880, margin: '0 auto', fontFamily: FONTS.body, display: 'flex', flexDirection: 'column', gap: 20 }}>
      <BrandCard title="Registrar nuevo proyecto/servicio">
        <div style={{ padding: '18px 20px 20px' }}>
          <div style={{ display: 'grid', gap: 16 }}>
            <div>
              <label style={labelStyle}>Nombre</label>
              <input
                className="nm-input"
                value={nombreServicio}
                onChange={e => setNombreServicio(e.target.value)}
                style={{ width: '100%', marginTop: 4, ...nmFieldStyle(false) }}
                placeholder="Nombre del proyecto"
              />
            </div>

            <div>
              <label style={labelStyle}>Descripción</label>
              <textarea
                className="nm-input"
                value={descripcionServicio}
                onChange={e => setDescripcionServicio(e.target.value)}
                style={{ width: '100%', marginTop: 4, minHeight: 80, resize: 'vertical', ...nmFieldStyle(false) }}
                placeholder="Descripción del proyecto"
                rows={3}
              />
            </div>

            <div>
              <label style={labelStyle}>Tipo de servicio</label>
              <select
                className="nm-input"
                value={tipoServicioId}
                onChange={e => setTipoServicioId(e.target.value)}
                style={{ width: '100%', marginTop: 4, ...nmFieldStyle(false) }}
              >
                <option value="">-- Selecciona tipo --</option>
                {tiposServicio.map(t => (
                  <option key={t.id_tipo} value={t.id_tipo}>{t.nombre || t.descripcion || t.id_tipo}</option>
                ))}
              </select>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <img
                src={previewServicio || 'https://via.placeholder.com/120'}
                alt="Vista previa"
                style={{ width: 120, height: 120, objectFit: 'cover', borderRadius: 12, border: `2px solid ${COLORS.border}`, background: COLORS.white }}
              />
              <div style={{ flex: 1 }}>
                <label style={{ ...labelStyle, marginBottom: 8 }}>Subir imagen (opcional)</label>
                <input
                  type="file"
                  className="nm-input"
                  accept="image/*"
                  onChange={e => {
                    const file = e.target.files[0];
                    setImagenServicio(file);
                    setPreviewServicio(file ? URL.createObjectURL(file) : '');
                  }}
                  style={nmFieldStyle(false)}
                />
              </div>
            </div>
          </div>

          <div style={{ marginTop: 20 }}>
            <BrandCtaButton variant="primary" onClick={handleGuardarProyecto} fullWidth>
              Guardar proyecto
            </BrandCtaButton>
          </div>
        </div>
      </BrandCard>

      <BrandCard title="Gestión de Tipos de Servicio">
        <div style={{ padding: '18px 20px 20px' }}>
          <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap' }}>
            <input
              className="nm-input"
              value={nuevoTipoServicio}
              onChange={e => setNuevoTipoServicio(e.target.value)}
              placeholder="Nuevo tipo de servicio (máx. 50 caracteres)"
              maxLength={50}
              style={{ flex: 1, minWidth: 200, ...nmFieldStyle(false) }}
            />
            <input
              className="nm-input"
              value={nuevoPrecioEstimado}
              onChange={e => setNuevoPrecioEstimado(e.target.value.replace(/[^0-9.]/g, ''))}
              placeholder="Precio estimado (S/)"
              inputMode="decimal"
              style={{ width: 160, ...nmFieldStyle(false) }}
            />
            <BrandCtaButton size="sm" variant="secondary" onClick={handleAgregarTipoServicio}>
              Agregar tipo de servicio
            </BrandCtaButton>
          </div>

          <StripedTable minWidth={0}>
            <StripedTableHead>
              <StripedTh>Tipo de Servicio</StripedTh>
              <StripedTh>Precio Estimado (S/)</StripedTh>
              <StripedTh align="center">Acción</StripedTh>
            </StripedTableHead>
            <tbody>
              {tiposServicio.length === 0 ? (
                <tr>
                  <StripedTd align="center" colSpan={3} style={{ padding: 18, color: COLORS.textLight }}>
                    Sin tipos de servicio registrados
                  </StripedTd>
                </tr>
              ) : (
                tiposServicio.map((t, idx) => (
                  <StripedTableRow key={t.id_tipo} index={idx}>
                    <StripedTd>{t.descripcion || t.nombre || t.id_tipo}</StripedTd>
                    <StripedTd>
                      {editandoTipoId === t.id_tipo ? (
                        <input
                          className="nm-input"
                          value={editPrecioEstimado}
                          onChange={e => setEditPrecioEstimado(e.target.value.replace(/[^0-9.]/g, ''))}
                          style={{ width: 120, ...nmFieldStyle(false) }}
                          autoFocus
                        />
                      ) : (
                        t.precio_estimado != null ? Number(t.precio_estimado).toFixed(2) : '-'
                      )}
                    </StripedTd>
                    <StripedTd align="center">
                      {editandoTipoId === t.id_tipo ? (
                        <div style={{ display: 'inline-flex', gap: 8 }}>
                          <BrandCtaButton size="sm" variant="primary" onClick={() => handleGuardarEdicion(t.id_tipo)}>
                            Guardar
                          </BrandCtaButton>
                          <BrandCtaButton size="sm" variant="secondary" onClick={() => setEditandoTipoId(null)}>
                            Cancelar
                          </BrandCtaButton>
                        </div>
                      ) : (
                        <div style={{ display: 'inline-flex', gap: 8 }}>
                          <BrandCtaButton size="sm" variant="secondary" onClick={() => handleIniciarEdicion(t)}>
                            Editar
                          </BrandCtaButton>
                          <BrandCtaButton size="sm" variant="primary" onClick={() => handleEliminarTipoServicio(t.id_tipo)}>
                            Eliminar
                          </BrandCtaButton>
                        </div>
                      )}
                    </StripedTd>
                  </StripedTableRow>
                ))
              )}
            </tbody>
          </StripedTable>
        </div>
      </BrandCard>
    </div>
  );
};

export default Proyecto;
