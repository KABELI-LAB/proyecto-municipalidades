import React from 'react';
import { Badge } from './Badge.jsx';
const MAP = {
  operativo: ['green', 'Operativo'], intermitente: ['yellow', 'Intermitente'], suspendido: ['red', 'Suspendido'], finalizado: ['neutral', 'Finalizado'],
  recibida: ['blue', 'Recibida'], 'en-revision': ['yellow', 'En revisión'], aprobada: ['green', 'Aprobada'], rechazada: ['red', 'Rechazada'],
  abierta: ['green', 'Postulación abierta'], cerrada: ['neutral', 'Cerrada'], proxima: ['blue', 'Próximamente'],
};
export function StatusBadge({ status, label, size = 'md' }) {
  const [tone, text] = MAP[status] || ['neutral', status];
  return <Badge tone={tone} dot size={size}>{label || text}</Badge>;
}