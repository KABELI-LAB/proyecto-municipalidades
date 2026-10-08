const { Breadcrumbs: BC, Tabs: Tb, Button: B, TextField, Select, Radio, Checkbox, FileUpload, Alert: Al, Timeline, StatusBadge, Icon: Ic, ProgressBar, Modal, PersonCard } = window.HualaDesignSystem_c0b80f;
function Fact({ icon, k, v }) {
  return <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}><span className="hds-tile-icon hds-tile-icon--blue" style={{ width: 44, height: 44 }}><Ic name={icon} size={22} /></span><div><div style={{ font: '700 13px/1.2 var(--font-sans)', letterSpacing: '.08em', textTransform: 'uppercase', color: 'var(--color-text-secondary)' }}>{k}</div><div style={{ fontWeight: 700, fontSize: 19, marginTop: 4 }}>{v}</div></div></div>;
}
function TramiteFlow({ id, go }) {
  const t = TRAMITES.find((x) => x.id === id) || TRAMITES[1];
  const [step, setStep] = React.useState(0);
  const [tab, setTab] = React.useState('req');
  const [confirm, setConfirm] = React.useState(false);
  const steps = ['Tus datos', 'Documentos', 'Revisa y envía'];
  if (step === 4) return (
    <main style={{ maxWidth: 760, margin: '0 auto', padding: '56px 32px 96px', display: 'flex', flexDirection: 'column', gap: 28 }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16, alignItems: 'flex-start' }}>
        <span style={{ width: 72, height: 72, borderRadius: '50%', background: 'var(--green-700)', color: '#fff', display: 'grid', placeItems: 'center' }}><Ic name="check" size={36} /></span>
        <h1 style={{ margin: 0, font: '700 44px/1.1 var(--font-sans)', letterSpacing: '-.02em' }}>Listo, recibimos tu solicitud</h1>
        <p style={{ margin: 0, fontSize: 20, lineHeight: 1.5, color: 'var(--color-text-secondary)' }}>Te avisaremos por WhatsApp y correo cuando tu {t.title.toLowerCase()} esté listo. No necesitas hacer nada más.</p>
        <div style={{ display: 'flex', gap: 24, padding: '16px 20px', background: 'var(--color-surface-sunken)', borderRadius: 16 }}><div><div style={{ fontSize: 14, color: 'var(--color-text-secondary)' }}>N° de solicitud</div><div style={{ font: '500 22px/1.3 var(--font-mono)' }}>HUA-2026-04812</div></div><div><div style={{ fontSize: 14, color: 'var(--color-text-secondary)' }}>Respuesta estimada</div><div style={{ fontWeight: 700, fontSize: 20 }}>Lunes 6 de octubre</div></div></div>
      </div>
      <div style={{ border: '1px solid var(--color-border)', borderRadius: 20, padding: 24 }}>
        <h2 style={{ margin: '0 0 20px', fontSize: 22 }}>¿Qué pasa ahora?</h2>
        <Timeline steps={[{ title: 'Solicitud recibida', meta: 'Hoy, 10:14', state: 'done' }, { title: 'Revisión de documentos', meta: 'Oficina de Partes · 1 día hábil', state: 'current' }, { title: 'Certificado listo', meta: 'Lo recibes por correo en PDF', state: 'pending' }]} />
      </div>
      <div style={{ display: 'flex', gap: 12 }}><B onClick={() => go('home')}>Volver al inicio</B><B variant="secondary" iconLeft="download">Descargar comprobante</B></div>
    </main>
  );
  if (step >= 1) return (
    <main style={{ maxWidth: 760, margin: '0 auto', padding: '32px 32px 96px' }}>
      <button className="hds-btn hds-btn--ghost" style={{ marginLeft: -16 }} onClick={() => setStep(step - 1)}><Ic name="arrow-left" size={20} />Volver</button>
      <div style={{ margin: '16px 0 28px', display: 'flex', flexDirection: 'column', gap: 14 }}>
        <span style={{ fontSize: 16, color: 'var(--color-text-secondary)', fontWeight: 600 }}>{t.title} · Paso {step} de 3</span>
        <h1 style={{ margin: 0, font: '700 36px/1.15 var(--font-sans)' }}>{steps[step - 1]}</h1>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 6 }}>{steps.map((s, i) => <div key={s} style={{ height: 6, borderRadius: 3, background: i < step ? 'var(--color-primary)' : 'var(--color-surface-muted)' }} />)}</div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
        {step === 1 && <>
          <Al tone="info" title="Ya tenemos parte de tus datos">Los trajimos de ClaveÚnica. Revisa que estén correctos.</Al>
          <TextField label="Nombre completo" defaultValue="María Isabel Fuentes Rojas" />
          <TextField label="RUT" defaultValue="12.345.678-9" disabled hint="Viene de ClaveÚnica. No se puede cambiar." />
          <Select label="¿En qué sector vives?" defaultValue="Hualañé centro" options={['Hualañé centro', 'La Huerta de Mataquito', 'Quilpoco', 'Los Coipos', 'Parronal']} />
          <TextField label="Dirección" defaultValue="Pasaje Los Aromos 245" />
          <fieldset style={{ border: 0, padding: 0, margin: 0 }}><legend className="hds-label" style={{ marginBottom: 4 }}>¿Cómo quieres que te avisemos?</legend>
            <Radio name="aviso" value="wa" label="WhatsApp" description="+56 9 8765 4321" defaultChecked /><Radio name="aviso" value="mail" label="Correo electrónico" /><Radio name="aviso" value="tel" label="Llamada telefónica" description="Si prefieres que te llamemos" /></fieldset>
        </>}
        {step === 2 && <>
          <p style={{ margin: 0, fontSize: 18, lineHeight: 1.55 }}>Sube una foto o PDF. Puede ser una foto con el celular, siempre que se lea bien.</p>
          <FileUpload label="Cédula de identidad (por ambos lados)" files={[{ name: 'cedula-frente.jpg', size: '1,2 MB' }, { name: 'cedula-reverso.jpg', size: '1,1 MB' }]} />
          <FileUpload label="Boleta de luz o agua a tu nombre" hint="De los últimos 3 meses. PDF, JPG o PNG, hasta 10 MB." />
          <Checkbox label="No tengo boleta a mi nombre" description="Te enviaremos una declaración jurada simple para firmar." />
        </>}
        {step === 3 && <>
          {[['Nombre', 'María Isabel Fuentes Rojas'], ['RUT', '12.345.678-9'], ['Dirección', 'Pasaje Los Aromos 245, Hualañé centro'], ['Aviso por', 'WhatsApp +56 9 8765 4321'], ['Documentos', '3 archivos']].map(([k, v]) => (
            <div key={k} style={{ display: 'flex', justifyContent: 'space-between', gap: 16, padding: '14px 0', borderBottom: '1px solid var(--color-border)', fontSize: 18 }}><span style={{ color: 'var(--color-text-secondary)' }}>{k}</span><span style={{ fontWeight: 600, textAlign: 'right' }}>{v}</span></div>))}
          <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}><Fact icon="wallet" k="Costo" v={t.cost} /><Fact icon="clock" k="Respuesta" v={t.duration} /></div>
        </>}
        <div style={{ display: 'flex', gap: 12, paddingTop: 8 }}>
          <B size="lg" iconRight={step === 3 ? 'send' : 'arrow-right'} onClick={() => (step === 3 ? setConfirm(true) : setStep(step + 1))}>{step === 3 ? 'Enviar solicitud' : 'Continuar'}</B>
          <B size="lg" variant="ghost">Guardar y seguir después</B>
        </div>
      </div>
      <Modal open={confirm} title="¿Enviar tu solicitud?" icon="send" onClose={() => setConfirm(false)} footer={<><B variant="ghost" onClick={() => setConfirm(false)}>Revisar otra vez</B><B onClick={() => { setConfirm(false); setStep(4); }}>Sí, enviar</B></>}>Revisaremos tus documentos en {t.duration}. Si falta algo, te escribimos por WhatsApp.</Modal>
    </main>
  );
  return (
    <main style={{ ...wrap, padding: '32px 32px 96px' }}>
      <BC items={[{ label: 'Inicio' }, { label: 'Trámites' }, { label: t.title }]} />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px,1fr))', gap: 48, marginTop: 24 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}><span className="hds-overline">{t.cat}</span><StatusBadge status={t.status} size="sm" /></div>
          <h1 style={{ margin: 0, font: '700 44px/1.1 var(--font-sans)', letterSpacing: '-.02em' }}>{t.title}</h1>
          <p style={{ margin: 0, fontSize: 21, lineHeight: 1.55, color: 'var(--color-text-secondary)' }}>{t.description}</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(160px,1fr))', gap: 20, padding: 24, background: 'var(--color-surface-sunken)', borderRadius: 20 }}><Fact icon="wallet" k="Costo" v={t.cost} /><Fact icon="clock" k="Demora" v={t.duration} /><Fact icon="laptop" k="Modalidad" v={t.modality} /></div>
          <Tb items={[{ id: 'req', label: 'Qué necesitas' }, { id: 'pasos', label: 'Paso a paso' }, { id: 'despues', label: 'Qué pasa después' }]} value={tab} onChange={setTab} />
          {tab === 'req' && <ul className="hds-list" style={{ fontSize: 19, gap: 14 }}>{t.requirements.map((r) => <li key={r}><Ic name="circle-check" size={22} />{r}</li>)}</ul>}
          {tab === 'pasos' && <Timeline steps={[{ title: 'Entra con tu ClaveÚnica', state: 'pending' }, { title: 'Revisa tus datos', state: 'pending' }, { title: 'Sube tus documentos', state: 'pending' }, { title: 'Envía y recibe tu número de seguimiento', state: 'pending' }]} />}
          {tab === 'despues' && <p style={{ margin: 0, fontSize: 19, lineHeight: 1.55 }}>Revisamos tu solicitud en {t.duration}. Te avisamos por WhatsApp o correo. Si falta un documento, te lo pedimos sin que tengas que empezar de nuevo.</p>}
        </div>
        <aside style={{ display: 'flex', flexDirection: 'column', gap: 16, position: 'sticky', top: 24, alignSelf: 'start' }}>
          <div style={{ border: '2px solid var(--color-primary)', borderRadius: 20, padding: 24, display: 'flex', flexDirection: 'column', gap: 14 }}>
            <h2 style={{ margin: 0, fontSize: 22 }}>Hazlo en línea</h2>
            <p style={{ margin: 0, fontSize: 17, color: 'var(--color-text-secondary)' }}>Te toma unos {t.id === 'circulacion' ? '10' : '5'} minutos. Ten a mano tus documentos.</p>
            <B size="lg" block iconRight="arrow-right" disabled={t.status === 'suspendido'} onClick={() => setStep(1)}>Iniciar con ClaveÚnica</B>
            <B variant="secondary" block iconLeft="message-circle">Hacerlo por WhatsApp</B>
          </div>
          <PersonCard name="Oficina de Partes" role="Atención presencial" phone="75 2 481 100" hours="Lunes a viernes, 8:30 a 14:00" />
        </aside>
      </div>
    </main>
  );
}
Object.assign(window, { TramiteFlow });
