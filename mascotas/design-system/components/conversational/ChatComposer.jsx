import React from 'react';
import { Icon } from '../core/Icon.jsx';
export function ChatComposer({ placeholder = 'Escribe tu consulta…', onSend, onAttach, onLocation, onVoice, listening }) {
  const [t, setT] = React.useState('');
  const send = () => { if (t.trim()) { onSend && onSend(t.trim()); setT(''); } };
  return (
    <div className="hds-composer">
      <button type="button" className="hds-btn hds-btn--ghost hds-iconbtn hds-iconbtn--round" aria-label="Adjuntar documento" onClick={onAttach}><Icon name="paperclip" size={22} /></button>
      <button type="button" className="hds-btn hds-btn--ghost hds-iconbtn hds-iconbtn--round" aria-label="Compartir ubicación" onClick={onLocation}><Icon name="map-pin" size={22} /></button>
      <textarea rows={1} value={t} placeholder={listening ? 'Te escucho…' : placeholder} aria-label="Mensaje" onChange={(e) => setT(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } }} />
      {t ? <button type="button" className="hds-btn hds-btn--primary hds-iconbtn hds-iconbtn--round" aria-label="Enviar" onClick={send}><Icon name="send" size={20} /></button>
        : <button type="button" className={'hds-btn hds-iconbtn hds-iconbtn--round ' + (listening ? 'hds-btn--danger' : 'hds-btn--primary')} aria-label={listening ? 'Detener' : 'Hablar'} onClick={onVoice}><Icon name={listening ? 'square' : 'mic'} size={20} /></button>}
    </div>
  );
}