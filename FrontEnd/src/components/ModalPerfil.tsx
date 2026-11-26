import React, { useState } from 'react';
import { type Usuario } from '../services/authService';

interface ModalPerfilProps {
  show: boolean;
  usuario: Usuario;
  onClose: () => void;
  onUpdatePerfil: (updates: Partial<Usuario>) => void;
}

export const ModalPerfil: React.FC<ModalPerfilProps> = ({
  show,
  usuario,
  onClose,
  onUpdatePerfil,
}) => {
  const [nombre, setNombre] = useState(usuario.nombre);
  const [documento, setDocumento] = useState(usuario.documento);
  const [empresa, setEmpresa] = useState(usuario.empresa);
  const [cargo, setCargo] = useState(usuario.cargo);
  const [tipoCuenta, setTipoCuenta] = useState(usuario.tipoCuenta);

  if (!show) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdatePerfil({
      nombre: nombre.trim(),
      documento: documento.trim(),
      empresa: empresa.trim(),
      cargo: cargo.trim(),
      tipoCuenta,
    });
    onClose();
  };

  return (
    <div className="modal show d-block" tabIndex={-1} style={{ backgroundColor: 'rgba(15, 23, 42, 0.65)', backdropFilter: 'blur(4px)', zIndex: 1060 }}>
      <div className="modal-dialog modal-dialog-centered">
        <div className="modal-content shadow-xl border-0 rounded-4 overflow-hidden">
          <div className="modal-header bg-dark text-white p-3 border-0" style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)' }}>
            <div className="d-flex align-items-center gap-2">
              <div
                className="rounded-circle d-flex align-items-center justify-content-center text-white fw-bold"
                style={{ width: 36, height: 36, backgroundColor: usuario.avatarColor || '#2563eb' }}
              >
                {usuario.nombre.charAt(0)}
              </div>
              <div>
                <h6 className="modal-title fw-bold mb-0 text-white">Mi Perfil de Contribuyente</h6>
                <small className="text-secondary" style={{ fontSize: '0.75rem' }}>{usuario.email}</small>
              </div>
            </div>
            <button type="button" className="btn-close btn-close-white" onClick={onClose} aria-label="Cerrar"></button>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="modal-body p-4 bg-white">
              <div className="mb-3">
                <label className="form-label small fw-semibold text-dark mb-1">Nombre Completo:</label>
                <input
                  type="text"
                  className="form-control form-control-pro form-control-sm"
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  required
                />
              </div>

              <div className="mb-3">
                <label className="form-label small fw-semibold text-dark mb-1">Documento de Identidad (CI / NIT):</label>
                <input
                  type="text"
                  className="form-control form-control-pro form-control-sm"
                  value={documento}
                  onChange={(e) => setDocumento(e.target.value)}
                  required
                />
              </div>

              <div className="row g-2 mb-3">
                <div className="col-6">
                  <label className="form-label small fw-semibold text-dark mb-1">Empresa / Empleador:</label>
                  <input
                    type="text"
                    className="form-control form-control-pro form-control-sm"
                    value={empresa}
                    onChange={(e) => setEmpresa(e.target.value)}
                  />
                </div>
                <div className="col-6">
                  <label className="form-label small fw-semibold text-dark mb-1">Cargo / Puesto:</label>
                  <input
                    type="text"
                    className="form-control form-control-pro form-control-sm"
                    value={cargo}
                    onChange={(e) => setCargo(e.target.value)}
                  />
                </div>
              </div>

              <div className="mb-2">
                <label className="form-label small fw-semibold text-dark mb-1">Tipo de Contribuyente:</label>
                <select
                  className="form-select form-control-pro form-select-sm"
                  value={tipoCuenta}
                  onChange={(e) => setTipoCuenta(e.target.value as 'Dependiente' | 'Independiente' | 'Auditor')}
                >
                  <option value="Dependiente">Dependiente (Retención en Planilla)</option>
                  <option value="Independiente">Independiente (Consultor / Servicios)</option>
                  <option value="Auditor">Auditor Tributario</option>
                </select>
              </div>
            </div>

            <div className="modal-footer bg-light p-3 border-top d-flex justify-content-between">
              <button type="button" className="btn btn-outline-secondary btn-sm rounded-3" onClick={onClose}>
                Cancelar
              </button>
              <button type="submit" className="btn btn-primary btn-sm fw-bold rounded-3 px-4 shadow-sm">
                Guardar Cambios
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
