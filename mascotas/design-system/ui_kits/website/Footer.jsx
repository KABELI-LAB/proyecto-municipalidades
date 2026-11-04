const { Icon: FI } = window.HualaDesignSystem_c0b80f;
function Footer() {
  return (
    <footer style={{ background: 'var(--blue-900)', color: '#D9E4F5', fontSize: 16 }}>
      <div style={{ ...wrap, padding: '56px 32px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px,1fr))', gap: 40 }}>
        <img src={A + '/logo/logo-vertical-white.png'} alt="Hualañé, Somos tod@s" style={{ height: 150 }} />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}><b style={{ color: '#fff', fontSize: 17 }}>Visítanos</b><span>Libertad 1, Hualañé<br />Región del Maule</span><span>Lunes a viernes<br />8:30 a 14:00</span></div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}><b style={{ color: '#fff', fontSize: 17 }}>Contáctanos</b><a href="#" style={{ color: '#fff', display: 'flex', gap: 8, alignItems: 'center' }}><FI name="phone" size={18} />75 2 481 100</a><a href="#" style={{ color: '#fff', display: 'flex', gap: 8, alignItems: 'center' }}><FI name="message-circle" size={18} />WhatsApp municipal</a><a href="#" style={{ color: '#fff', display: 'flex', gap: 8, alignItems: 'center' }}><FI name="siren" size={18} />Emergencias 1450</a></div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}><b style={{ color: '#fff', fontSize: 17 }}>Municipalidad</b>{['Transparencia activa', 'Concejo municipal', 'Cuenta pública 2025', 'Accesibilidad'].map((l) => <a key={l} href="#" style={{ color: '#fff' }}>{l}</a>)}</div>
      </div>
      <div style={{ borderTop: '1px solid rgba(255,255,255,.12)' }}><div style={{ ...wrap, padding: '18px 32px', fontSize: 14, display: 'flex', justifyContent: 'space-between' }}><span>© 2026 Ilustre Municipalidad de Hualañé</span><span>Hualañé somos tod@s</span></div></div>
    </footer>
  );
}
Object.assign(window, { Footer });
