const { Icon: AI, SearchBar: ASB, ServiceTile: AST, StatusBadge: ASBdg, Timeline: ATL, ProgressBar: APB, EmergencyAlert: AEA, BeneficioCard: ABC, EventCard: AEC, ChatMessage: ACM, QuickReplies: AQR, ChatComposer: ACC, Switch: ASw, Button: AB, DocumentCard: ADC, Alert: AAl } = window.HualaDesignSystem_c0b80f;
const AS = '../../assets';
const scr = { padding: '62px 20px 110px', display: 'flex', flexDirection: 'column', gap: 20, fontFamily: 'var(--font-sans)', color: 'var(--color-text)' };
function AppHeader({ title, sub, back, onBack }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      {back && <button className="hds-btn hds-btn--ghost hds-iconbtn hds-iconbtn--round" aria-label="Volver" onClick={onBack} style={{ marginLeft: -12 }}><AI name="arrow-left" size={24} /></button>}
      <div style={{ flex: 1 }}>{sub && <div style={{ fontSize: 15, color: 'var(--color-text-secondary)' }}>{sub}</div>}<h1 style={{ margin: 0, font: '800 30px/1.1 var(--font-sans)', letterSpacing: '-.02em' }}>{title}</h1></div>
    </div>
  );
}
function HomeScreen({ go }) {
  return (
    <div style={scr}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <img src={AS + '/logo/digital-mark.svg'} alt="" style={{ width: 40, height: 40, borderRadius: 11 }} />
        <div style={{ flex: 1 }}><div style={{ fontSize: 15, color: 'var(--color-text-secondary)' }}>Hola,</div><div style={{ font: '800 24px/1.1 var(--font-sans)' }}>María Isabel</div></div>
        <button className="hds-btn hds-btn--tertiary hds-iconbtn hds-iconbtn--round" aria-label="Avisos" onClick={() => go('avisos')} style={{ position: 'relative' }}><AI name="bell" size={22} /><span style={{ position: 'absolute', top: 8, right: 10, width: 10, height: 10, borderRadius: 5, background: 'var(--color-error)', border: '2px solid var(--color-surface)' }} /></button>
      </div>
      <button onClick={() => go('avisos')} style={{ all: 'unset', cursor: 'pointer', display: 'flex', gap: 12, alignItems: 'center', background: 'var(--yellow-400)', color: 'var(--blue-950)', borderRadius: 16, padding: '12px 16px' }}>
        <AI name="siren" size={24} /><span style={{ flex: 1, fontSize: 16, lineHeight: 1.3 }}><b>Alerta amarilla</b> · Crecida del río Mataquito</span><AI name="chevron-right" size={20} />
      </button>
      <ASB placeholder="¿Qué necesitas hacer?" buttonLabel="Ir" />
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        <AST icon="file-text" label="Trámites" onClick={() => go('tramites')} />
        <AST icon="gift" label="Beneficios" tone="green" />
        <AST icon="credit-card" label="Pagar" tone="yellow" />
        <AST icon="message-circle" label="Asistente" onClick={() => go('asistente')} />
      </div>
      <div>
        <h2 style={{ margin: '4px 0 12px', fontSize: 21 }}>Mis solicitudes</h2>
        <button onClick={() => go('solicitud')} className="hds-card hds-card--interactive" style={{ all: 'unset', boxSizing: 'border-box', width: '100%', cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: 12, padding: 18, border: '1px solid var(--color-border)', borderRadius: 20, background: 'var(--color-surface)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}><b style={{ fontSize: 18 }}>Certificado de residencia</b><ASBdg status="en-revision" size="sm" /></div>
          <APB value={66} showValue={false} label="" />
          <div style={{ fontSize: 15, color: 'var(--color-text-secondary)' }}>Paso 2 de 3 · Respuesta el lunes 6 de octubre</div>
        </button>
      </div>
      <div><h2 style={{ margin: '4px 0 12px', fontSize: 21 }}>Cerca de ti</h2>
        <AEC day="09" month="Oct" category="En terreno" title="Operativo social en Quilpoco" place="Sede vecinal" time="10:00 a 14:00" registration="free" /></div>
    </div>
  );
}
function TramitesScreen({ go }) {
  const list = [['car', 'Permiso de circulación', 'En línea · 10 min'], ['house', 'Certificado de residencia', 'En línea · Gratis'], ['store', 'Patente comercial', 'En línea o presencial'], ['users', 'Registro Social de Hogares', 'Gratis · 15 días'], ['trash-2', 'Retiro de voluminosos', 'Gratis · Próxima ruta'], ['id-card', 'Licencia de conducir', 'Reserva tu hora']];
  return (
    <div style={scr}>
      <AppHeader title="Trámites" />
      <ASB placeholder="Busca un trámite" voice buttonLabel="Ir" />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>{list.map(([i, l, h]) => <AST key={l} layout="row" icon={i} label={l} hint={h} onClick={() => go('solicitud')} />)}</div>
    </div>
  );
}
function SolicitudScreen({ go }) {
  return (
    <div style={scr}>
      <AppHeader back onBack={() => go('inicio')} sub="Solicitud HUA-2026-04812" title="Certificado de residencia" />
      <AAl tone="info" title="Estamos revisando tus documentos">Te avisamos por WhatsApp el lunes 6 de octubre.</AAl>
      <div style={{ border: '1px solid var(--color-border)', borderRadius: 20, padding: 18 }}>
        <ATL steps={[{ title: 'Solicitud recibida', meta: '3 oct · 10:14', state: 'done' }, { title: 'Revisión de documentos', meta: 'Oficina de Partes', state: 'current' }, { title: 'Certificado listo', meta: 'Te llega en PDF', state: 'pending' }]} />
      </div>
      <div><h2 style={{ margin: '0 0 10px', fontSize: 19 }}>Lo que enviaste</h2><div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}><ADC title="Cédula de identidad" type="JPG" size="2,3 MB" /><ADC title="Boleta de luz CGE" type="PDF" size="310 KB" /></div></div>
      <AB variant="secondary" block iconLeft="headset">Hablar con un funcionario</AB>
    </div>
  );
}
function AvisosScreen({ go }) {
  return (
    <div style={scr}>
      <AppHeader title="Avisos" />
      <AEA level="amarilla" title="Crecida del río Mataquito" zone="Sectores ribereños de Hualañé" message="Evita acercarte a la ribera. Si vives junto al río, ten lista una mochila de emergencia." time="07:30" actionLabel="Qué hacer" />
      <ABC title="Subsidio de agua potable" audience="Hogares del 40% más vulnerable." deadline="30 de octubre" daysLeft={5} />
    </div>
  );
}
function AsistenteScreen() {
  const [msgs, setMsgs] = React.useState([{ from: 'assistant', t: 'Hola, María. ¿En qué te ayudo hoy?' }]);
  const send = (t) => { setMsgs((m) => [...m, { from: 'citizen', t }, { from: 'assistant', t: t.toLowerCase().includes('basura') ? 'El camión pasa por tu sector los martes y viernes desde las 8:00. Esta semana hay 1 día de retraso en La Huerta.' : 'Puedo ayudarte con eso. ¿Quieres que lo hagamos ahora o prefieres hablar con un funcionario?' }]); };
  return (
    <div style={{ ...scr, gap: 12, minHeight: '100%', boxSizing: 'border-box', background: 'var(--color-surface-sunken)' }}>
      <AppHeader title="Asistente" sub="Municipalidad de Hualañé" />
      {msgs.map((m, i) => <ACM key={i} from={m.from}>{m.t}</ACM>)}
      {msgs.length === 1 && <AQR options={['¿Cuándo pasa la basura?', 'Pagar permiso', 'Hora en el CESFAM']} onSelect={send} />}
      <div style={{ marginTop: 'auto' }}><ACC onSend={send} /></div>
    </div>
  );
}
function PerfilScreen({ theme, setTheme, big, setBig }) {
  return (
    <div style={scr}>
      <AppHeader title="Perfil" />
      <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}><span style={{ width: 60, height: 60, borderRadius: 30, background: 'var(--blue-100)', color: 'var(--blue-800)', display: 'grid', placeItems: 'center', font: '800 22px/1 var(--font-sans)' }}>MF</span><div><b style={{ fontSize: 19 }}>María Isabel Fuentes</b><div style={{ fontSize: 15, color: 'var(--color-text-secondary)' }}>Hualañé centro · ClaveÚnica</div></div></div>
      <div style={{ border: '1px solid var(--color-border)', borderRadius: 20, padding: '4px 18px' }}>
        <h2 style={{ margin: '14px 0 2px', fontSize: 17 }}>Ver mejor</h2>
        <ASw label="Texto más grande" checked={big} onChange={(e) => setBig(e.target.checked)} />
        <ASw label="Modo oscuro" checked={theme === 'dark'} onChange={(e) => setTheme(e.target.checked ? 'dark' : 'light')} />
        <ASw label="Alto contraste" checked={theme === 'high-contrast'} onChange={(e) => setTheme(e.target.checked ? 'high-contrast' : 'light')} />
        <ASw label="Avisos por WhatsApp" defaultChecked />
      </div>
    </div>
  );
}
Object.assign(window, { HomeScreen, TramitesScreen, SolicitudScreen, AvisosScreen, AsistenteScreen, PerfilScreen });
