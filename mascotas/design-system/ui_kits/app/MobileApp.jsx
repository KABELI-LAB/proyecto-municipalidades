const { BottomNav: ABN } = window.HualaDesignSystem_c0b80f;
function Phone({ initial = 'inicio', fixedTheme, label }) {
  const [tab, setTab] = React.useState(initial);
  const [theme, setTheme] = React.useState(fixedTheme || 'light');
  const [big, setBig] = React.useState(false);
  const go = (t) => setTab(t);
  const navTab = ['inicio', 'tramites', 'asistente', 'avisos', 'perfil'].includes(tab) ? tab : tab === 'solicitud' ? 'inicio' : 'inicio';
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14, alignItems: 'center' }}>
      <IOSDevice dark={theme === 'dark'}>
        <div data-theme={theme} style={{ position: 'relative', height: '100%', background: 'var(--color-surface)', zoom: big ? 1.15 : 1 }}>
          <div style={{ height: '100%', overflow: 'auto' }}>
            {tab === 'inicio' && <HomeScreen go={go} />}
            {tab === 'tramites' && <TramitesScreen go={go} />}
            {tab === 'solicitud' && <SolicitudScreen go={go} />}
            {tab === 'avisos' && <AvisosScreen go={go} />}
            {tab === 'asistente' && <AsistenteScreen />}
            {tab === 'perfil' && <PerfilScreen theme={theme} setTheme={setTheme} big={big} setBig={setBig} />}
          </div>
          <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, paddingBottom: 18, background: 'var(--color-surface)' }}>
            <ABN value={navTab} onChange={go} items={[{ id: 'inicio', label: 'Inicio', icon: 'house' }, { id: 'tramites', label: 'Trámites', icon: 'file-text' }, { id: 'asistente', label: 'Asistente', icon: 'message-circle' }, { id: 'avisos', label: 'Avisos', icon: 'bell', badge: 2 }, { id: 'perfil', label: 'Perfil', icon: 'user-round' }]} />
          </div>
        </div>
      </IOSDevice>
      {label && <span style={{ font: '700 13px/1 var(--font-sans)', letterSpacing: '.1em', textTransform: 'uppercase', color: 'var(--neutral-600)' }}>{label}</span>}
    </div>
  );
}
function App() {
  return (
    <div style={{ display: 'flex', gap: 40, justifyContent: 'center', alignItems: 'flex-start', padding: 32, flexWrap: 'wrap', background: 'var(--neutral-100)', minHeight: '100vh', boxSizing: 'border-box' }}>
      <Phone label="Interactivo · Light" />
      <Phone initial="solicitud" fixedTheme="dark" label="Dark mode" />
      <Phone initial="avisos" fixedTheme="high-contrast" label="Alto contraste" />
    </div>
  );
}
ReactDOM.createRoot(document.getElementById('root')).render(<App />);
