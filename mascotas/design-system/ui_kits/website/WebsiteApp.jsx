const { SiteHeader, EmergencyAlert } = window.HualaDesignSystem_c0b80f;
function App() {
  const [route, setRoute] = React.useState(() => JSON.parse(localStorage.getItem('hds-web-route') || '{"r":"home"}'));
  const [alertOn, setAlertOn] = React.useState(true);
  const go = (r, id) => { const v = { r, id }; setRoute(v); localStorage.setItem('hds-web-route', JSON.stringify(v)); window.scrollTo(0, 0); };
  return (
    <div>
      {alertOn && <EmergencyAlert layout="banner" level="amarilla" title="Alerta amarilla por crecida del río Mataquito" zone="Sectores ribereños" time="Hoy 07:30" actionLabel="Qué hacer" onAction={() => setAlertOn(false)} />}
      <div onClick={(e) => { const a = e.target.closest('a[aria-label^="Inicio"]'); if (a) { e.preventDefault(); go('home'); } const l = e.target.closest('.hds-header__link'); if (l) { e.preventDefault(); if (l.textContent === 'Trámites') go('portal'); else go('home'); } }}>
        <SiteHeader assetBase={A} items={[{ label: 'Trámites', current: route.r !== 'home' }, { label: 'Beneficios' }, { label: 'Pagos' }, { label: 'Salud' }, { label: 'Territorio' }, { label: 'Municipalidad' }]} onSearch={() => go('portal')} />
      </div>
      {route.r === 'home' && <Home go={go} />}
      {route.r === 'portal' && <Portal go={go} />}
      {route.r === 'tramite' && <TramiteFlow key={route.id} id={route.id} go={go} />}
      <Footer />
    </div>
  );
}
ReactDOM.createRoot(document.getElementById('root')).render(<App />);
