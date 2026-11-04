const { SearchBar, ServiceTile, TramiteCard, EventCard, NewsCard, ServiceStatus, Alert, Button, Cauce, Icon, Badge } = window.HualaDesignSystem_c0b80f;
function SectionHead({ over, title, action, onAction }) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 16, marginBottom: 24, flexWrap: 'wrap' }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>{over && <span className="hds-overline">{over}</span>}<h2 style={{ margin: 0, font: '700 34px/1.15 var(--font-sans)', letterSpacing: '-.015em' }}>{title}</h2></div>
      {action && <Button variant="ghost" iconRight="arrow-right" onClick={onAction}>{action}</Button>}
    </div>
  );
}
const wrap = { maxWidth: 1280, margin: '0 auto', padding: '0 32px' };
function Home({ go }) {
  const pop = ['Permiso de circulación', 'Certificado de residencia', 'Hora en el CESFAM', 'Patente comercial'];
  return (
    <main>
      <section style={{ position: 'relative', overflow: 'hidden', background: 'var(--color-surface)' }}>
        <div style={{ ...wrap, display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(380px,1fr))', gap: 48, padding: '64px 32px 96px', alignItems: 'center' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 28, position: 'relative', zIndex: 1 }}>
            <h1 style={{ margin: 0, font: '800 clamp(56px,6vw,80px)/1 var(--font-sans)', letterSpacing: '-.03em', color: 'var(--blue-700)' }}>Hola.<br /><span style={{ color: 'var(--color-text)', fontSize: 'clamp(36px,4vw,56px)', lineHeight: 1.05, letterSpacing: '-.025em' }}>¿Cómo podemos ayudarte?</span></h1>
            <SearchBar size="lg" placeholder="Busca un trámite o servicio" onSubmit={() => go('portal')} />
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>
              <span style={{ fontSize: 16, color: 'var(--color-text-secondary)', marginRight: 4 }}>Lo más buscado:</span>
              {pop.map((p) => <button key={p} className="hds-chip" style={{ minHeight: 40, fontSize: 15 }} onClick={() => go('tramite', p === 'Permiso de circulación' ? 'circulacion' : p === 'Patente comercial' ? 'patente' : 'residencia')}>{p}</button>)}
            </div>
          </div>
          <div style={{ position: 'relative', height: 'clamp(320px,34vw,440px)' }}>
            <div style={{ position: 'absolute', inset: 0, borderRadius: 28, background: 'url(' + A + '/photos/municipalidad-fachada.jpg) center/cover', clipPath: 'polygon(0 8%, 100% 0, 100% 100%, 0 100%)' }} />
            <div style={{ position: 'absolute', left: 20, bottom: 20, background: 'var(--color-surface)', borderRadius: 16, padding: '12px 16px', display: 'flex', gap: 12, alignItems: 'center', boxShadow: 'var(--shadow-medium)' }}>
              <span className="hds-tile-icon hds-tile-icon--green" style={{ width: 40, height: 40 }}><Icon name="clock" size={20} /></span>
              <div><div style={{ fontWeight: 700, fontSize: 16 }}>Abierto hoy hasta las 14:00</div><div style={{ fontSize: 14, color: 'var(--color-text-secondary)' }}>Libertad 1, Hualañé</div></div>
            </div>
          </div>
        </div>
        <div style={{ position: 'absolute', left: 0, right: 0, bottom: -10, height: 120, opacity: 1 }}><Cauce colors={['var(--blue-100)', 'var(--green-100)', 'var(--yellow-100)']} thickness={16} gap={56} /></div>
      </section>

      <section style={{ ...wrap, padding: '56px 32px 24px' }}>
        <SectionHead title="¿Qué necesitas hacer?" />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(156px,1fr))', gap: 12 }}>
          <ServiceTile icon="file-text" label="Trámites" hint="Certificados y permisos" onClick={() => go('portal')} />
          <ServiceTile icon="gift" label="Beneficios" tone="green" hint="Subsidios y ayudas" />
          <ServiceTile icon="credit-card" label="Pagos" tone="yellow" hint="Patentes, permisos, multas" />
          <ServiceTile icon="heart-pulse" label="Salud" tone="red" hint="CESFAM y postas rurales" />
          <ServiceTile icon="shield-check" label="Seguridad" hint="Denuncias y patrullaje" />
          <ServiceTile icon="calendar-days" label="Eventos" tone="green" hint="Actividades del mes" />
          <ServiceTile icon="landmark" label="Municipalidad" hint="Concejo y transparencia" />
        </div>
      </section>

      <section style={{ ...wrap, padding: '56px 32px' }}>
        <SectionHead over="Servicios frecuentes" title="Resuélvelo en línea" action="Ver todos los trámites" onAction={() => go('portal')} />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px,1fr))', gap: 20 }}>
          {TRAMITES.slice(0, 3).map((t) => <TramiteCard key={t.id} {...t} category={t.cat} compact onAction={() => go('tramite', t.id)} />)}
        </div>
      </section>

      <section style={{ background: 'var(--color-surface-sunken)', padding: '56px 0' }}>
        <div style={{ ...wrap, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(380px,1fr))', gap: 40 }}>
          <div>
            <SectionHead over="Alertas" title="Estado de los servicios" />
            <div style={{ background: 'var(--color-surface)', borderRadius: 20, border: '1px solid var(--color-border)', padding: '4px 20px' }}>
              <ServiceStatus name="Recolección de basura" status="intermitente" detail="La Huerta de Mataquito con 1 día de retraso" updated="09:12" />
              <ServiceStatus name="Agua potable rural (APR)" status="operativo" updated="08:40" />
              <ServiceStatus name="Ruta J-60 Hualañé–Licantén" status="suspendido" detail="Corte parcial por obras hasta las 18:00" updated="07:55" />
              <div style={{ borderBottom: 0 }}><ServiceStatus name="Atención presencial" status="operativo" detail="Lunes a viernes, 8:30 a 14:00" /></div>
            </div>
          </div>
          <div>
            <SectionHead over="Actividades" title="Esta semana en Hualañé" action="Calendario" />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <EventCard day="09" month="Oct" category="Comunidad" title="Operativo social en Quilpoco" place="Sede vecinal de Quilpoco" time="10:00 a 14:00" registration="free" />
              <EventCard day="12" month="Oct" category="Deporte" title="Corrida familiar por la ribera del Mataquito" place="Costanera de Hualañé" time="09:30" registration="open" />
            </div>
          </div>
        </div>
      </section>

      <section style={{ ...wrap, padding: '56px 32px' }}>
        <SectionHead over="Noticias" title="Lo que está pasando" action="Todas las noticias" />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px,1fr))', gap: 20 }}>
          <NewsCard image={A + '/photos/feria-terreno.jpg'} category="Comunidad" title="Municipalidad en terreno: más de 120 atenciones en Quilpoco" date="02 OCT 2026" />
          <NewsCard image={A + '/photos/municipalidad-palmeras.jpg'} category="Municipalidad" title="Nuevo horario de atención de la Oficina de Partes" date="28 SEP 2026" />
          <NewsCard image={A + '/photos/municipalidad-fachada.jpg'} category="Trámites" title="Ya puedes pedir tu certificado de residencia por WhatsApp" date="21 SEP 2026" />
        </div>
      </section>

      <section style={{ background: 'var(--blue-800)', color: '#fff', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', inset: 0, opacity: .9 }}><Cauce colors={['var(--blue-600)', 'var(--blue-700)', 'var(--green-700)']} thickness={40} gap={80} /></div>
        <div style={{ ...wrap, position: 'relative', padding: '64px 32px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px,1fr))', gap: 48, alignItems: 'center' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <span className="hds-overline" style={{ color: 'var(--yellow-300)' }}>Territorio</span>
            <h2 style={{ margin: 0, font: '800 44px/1.08 var(--font-sans)', letterSpacing: '-.02em' }}>La Municipalidad va a tu sector</h2>
            <p style={{ margin: 0, fontSize: 19, lineHeight: 1.55, color: '#D9E4F5' }}>Si vives lejos del centro, atendemos trámites, salud y ayudas sociales en terreno. Revisa cuándo pasamos cerca de ti.</p>
            <div><Button variant="accent" iconRight="arrow-right">Ver calendario en terreno</Button></div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,minmax(0,1fr))', gap: 12 }}>
            {[['Quilpoco', 'Jueves 9 de octubre'], ['La Huerta de Mataquito', 'Martes 14 de octubre'], ['Los Coipos', 'Jueves 16 de octubre'], ['Parronal', 'Martes 21 de octubre']].map(([s, d]) => (
              <div key={s} style={{ background: 'rgba(255,255,255,.08)', border: '1px solid rgba(255,255,255,.18)', borderRadius: 16, padding: 18, display: 'flex', gap: 12, alignItems: 'center' }}>
                <Icon name="map-pin" size={22} style={{ color: 'var(--yellow-300)' }} /><div><div style={{ fontWeight: 700, fontSize: 18 }}>{s}</div><div style={{ fontSize: 15, color: '#B4C9EA' }}>{d}</div></div>
              </div>))}
          </div>
        </div>
      </section>
    </main>
  );
}
Object.assign(window, { Home, SectionHead, wrap });
