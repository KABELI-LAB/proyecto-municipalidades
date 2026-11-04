const { ChatMessage, QuickReplies, ChatComposer, HandoffCard, TramiteCard, Icon, Button, FileUpload, Timeline, Alert } = window.HualaDesignSystem_c0b80f;
const AA = '../../assets';
function Confirm({ rows, onOk }) {
  return <div style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 18, padding: 16, display: 'flex', flexDirection: 'column', gap: 10, maxWidth: 340 }}>
    <b style={{ fontSize: 16 }}>Revisa antes de enviar</b>
    {rows.map(([k, v]) => <div key={k} style={{ display: 'flex', justifyContent: 'space-between', gap: 10, fontSize: 15 }}><span style={{ color: 'var(--color-text-secondary)' }}>{k}</span><span style={{ fontWeight: 600, textAlign: 'right' }}>{v}</span></div>)}
    <Button block onClick={onOk} iconLeft="check">Confirmar y enviar</Button>
  </div>;
}
const SCRIPT = {
  start: { a: 'Hola, soy el Asistente de la Municipalidad de Hualañé. Te ayudo con trámites, horarios y avisos. ¿Qué necesitas?', q: [{ label: 'Certificado de residencia', icon: 'file-text' }, { label: '¿Cuándo pasa la basura?', icon: 'trash-2' }, { label: 'Hablar con una persona', icon: 'headset' }] },
};
function Thread() {
  const [items, setItems] = React.useState([{ k: 'sys', from: 'system', t: 'Hoy' }, { from: 'assistant', name: 'Asistente Hualañé', t: SCRIPT.start.a, time: '10:02' }]);
  const [q, setQ] = React.useState(SCRIPT.start.q);
  const end = React.useRef(null);
  React.useEffect(() => { const el = end.current && end.current.parentElement; if (el) el.scrollTop = el.scrollHeight; }, [items]);
  const push = (...xs) => setItems((s) => [...s, ...xs]);
  const pick = (l) => {
    setQ(null);
    push({ from: 'citizen', t: l, time: '10:03', status: 'read' });
    if (l.includes('residencia')) setTimeout(() => { push({ from: 'assistant', t: 'Claro. Es gratis y demora 1 día hábil. Necesitas:', time: '10:03', att: <ul className="hds-list" style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 16, padding: 14, maxWidth: 320 }}><li><Icon name="check" size={18} />Foto de tu cédula</li><li><Icon name="check" size={18} />Boleta de luz o agua a tu nombre</li></ul> }, { from: 'assistant', t: '¿Me envías una foto de tu cédula? Puedes tomarla con el celular.' }); setQ([{ label: 'Enviar foto', icon: 'camera' }, { label: 'No tengo boleta', icon: 'circle-help' }]); }, 500);
    else if (l === 'Enviar foto') setTimeout(() => { push({ from: 'citizen', time: '10:05', status: 'read', t: null, att: <div className="hds-filechip" style={{ maxWidth: 260 }}><Icon name="image" size={20} />cedula-frente.jpg</div> }, { from: 'assistant', t: 'La recibí y se lee bien. Ahora la boleta. También puedo usar tu dirección del Registro Social de Hogares si prefieres.' }); setQ([{ label: 'Usar Registro Social', icon: 'house' }]); }, 500);
    else if (l === 'Usar Registro Social') setTimeout(() => { push({ from: 'assistant', t: null, att: <Confirm rows={[['Trámite', 'Certificado de residencia'], ['Nombre', 'María Fuentes R.'], ['Dirección', 'Pje. Los Aromos 245'], ['Costo', 'Gratis'], ['Respuesta', '1 día hábil']]} onOk={() => { push({ from: 'assistant', t: 'Listo. Tu número de solicitud es HUA-2026-04812. Te escribo aquí mismo cuando esté listo, el lunes 6 de octubre.', time: '10:07' }); setQ([{ label: 'Gracias', icon: 'heart' }, { label: 'Hablar con una persona', icon: 'headset' }]); }} /> }); }, 500);
    else if (l.includes('basura')) setTimeout(() => { push({ from: 'assistant', t: 'Para saberlo, compárteme tu ubicación o dime tu sector.', time: '10:03' }); setQ([{ label: 'Compartir ubicación', icon: 'map-pin' }, { label: 'La Huerta', icon: 'map' }]); }, 500);
    else if (l === 'Compartir ubicación' || l === 'La Huerta') setTimeout(() => { push({ from: 'assistant', t: 'En La Huerta el camión pasa martes y viernes desde las 8:00. Esta semana va con 1 día de retraso: pasará el sábado.' }); setQ([{ label: 'Avísame cuando pase', icon: 'bell' }]); }, 500);
    else if (l.includes('persona')) setTimeout(() => { push({ from: 'system', t: 'Te estamos derivando con un funcionario' }, { from: 'assistant', t: null, att: <HandoffCard name="Marcela Rojas" role="Oficina de Partes" eta="5 minutos" caseId="HUA-2026-04812" /> }); setTimeout(() => push({ from: 'staff', name: 'Marcela Rojas', t: 'Hola María, ya leí tu conversación. ¿En qué más te ayudo?', time: '10:09' }), 1400); }, 500);
    else setTimeout(() => { push({ from: 'assistant', t: 'Con gusto. Si necesitas algo más, escríbeme o háblame con el micrófono.' }); setQ(SCRIPT.start.q); }, 500);
  };
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0 }}>
      <div style={{ flex: 1, overflow: 'auto', padding: '16px 16px 8px', display: 'flex', flexDirection: 'column', gap: 12 }}>
        {items.map((m, i) => <ChatMessage key={i} from={m.from} name={m.name} time={m.time} status={m.status} attachment={m.att}>{m.t}</ChatMessage>)}
        {q && <QuickReplies options={q} onSelect={pick} />}
        <div ref={end} />
      </div>
      <div style={{ padding: 12, borderTop: '1px solid var(--color-border)', background: 'var(--color-surface)' }}><ChatComposer onSend={pick} /></div>
    </div>
  );
}
function AppA() {
  return (
    <div style={{ minHeight: '100vh', background: 'var(--neutral-100)', display: 'flex', gap: 40, justifyContent: 'center', alignItems: 'flex-start', padding: 32, flexWrap: 'wrap', fontFamily: 'var(--font-sans)' }}>
      <div style={{ width: 420, height: 820, borderRadius: 32, overflow: 'hidden', background: 'var(--neutral-50)', boxShadow: 'var(--shadow-large)', display: 'flex', flexDirection: 'column' }}>
        <div style={{ background: 'var(--blue-700)', color: '#fff', padding: '18px 16px', display: 'flex', gap: 12, alignItems: 'center' }}>
          <img src={AA + '/logo/digital-mark.svg'} alt="" style={{ width: 44, height: 44, borderRadius: 22, boxShadow: '0 0 0 2px rgba(255,255,255,.3)' }} />
          <div style={{ flex: 1 }}><div style={{ fontWeight: 800, fontSize: 18, display: 'flex', alignItems: 'center', gap: 6 }}>Municipalidad de Hualañé<Icon name="badge-check" size={18} style={{ color: 'var(--yellow-300)' }} /></div><div style={{ fontSize: 14, color: '#D9E4F5' }}>Asistente · responde al instante · funcionarios 8:30–14:00</div></div>
          <Icon name="phone" size={22} />
        </div>
        <div style={{ background: 'var(--yellow-100)', color: 'var(--yellow-900)', fontSize: 14, padding: '8px 16px', display: 'flex', gap: 8, alignItems: 'center' }}><Icon name="shield-check" size={16} />Canal oficial. Nunca te pediremos tu clave.</div>
        <div style={{ flex: 1, minHeight: 0 }}><Thread /></div>
      </div>
      <div style={{ maxWidth: 380, display: 'flex', flexDirection: 'column', gap: 16, paddingTop: 12 }}>
        <span className="hds-overline">Asistente Hualañé</span>
        <h1 style={{ margin: 0, font: '800 40px/1.08 var(--font-sans)', letterSpacing: '-.02em' }}>Habla como la Municipalidad, no como un robot.</h1>
        <ul className="hds-list" style={{ fontSize: 17, gap: 12 }}>
          <li><Icon name="check" size={20} />Se presenta como canal oficial y dice qué puede y no puede hacer.</li>
          <li><Icon name="check" size={20} />Respuestas de máximo 3 frases, con costo y demora siempre.</li>
          <li><Icon name="check" size={20} />Quick replies grandes para quien no quiere escribir. Voz siempre disponible.</li>
          <li><Icon name="check" size={20} />Confirmación explícita antes de enviar algo en tu nombre.</li>
          <li><Icon name="check" size={20} />Deriva a una persona con nombre y número de atención; no hay que repetir nada.</li>
        </ul>
        <p style={{ margin: 0, fontSize: 15, color: 'var(--color-text-secondary)' }}>Prueba: toca “Certificado de residencia” o “Hablar con una persona”.</p>
      </div>
    </div>
  );
}
ReactDOM.createRoot(document.getElementById('root')).render(<AppA />);
