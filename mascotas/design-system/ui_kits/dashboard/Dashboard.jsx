const { Sidebar, MetricCard, LineChart, DonutChart, BarChart, DataTable, ProgressBar, StatusBadge, ServiceStatus, Tabs, Button, Icon, Select, Timeline, Badge } = window.HualaDesignSystem_c0b80f;
const DA = '../../assets';
const panel = { background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 20, padding: 24, display: 'flex', flexDirection: 'column', gap: 18, minWidth: 0 };
function PanelHead({ title, sub, right }) {
  return <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}><div><h2 style={{ margin: 0, fontSize: 19, lineHeight: 1.3 }}>{title}</h2>{sub && <div style={{ fontSize: 14, color: 'var(--color-text-secondary)', marginTop: 2 }}>{sub}</div>}</div>{right}</div>;
}
const OBRAS = [
  { n: 'Pavimentación calle Libertad', s: 'Hualañé centro', p: 68, m: '$ 412.300.000', st: 'operativo' },
  { n: 'Sede vecinal Quilpoco', s: 'Quilpoco', p: 92, m: '$ 84.000.000', st: 'operativo' },
  { n: 'Defensa fluvial ribera Mataquito', s: 'Los Coipos', p: 35, m: '$ 1.240.000.000', st: 'intermitente' },
  { n: 'Luminarias LED rurales', s: 'Toda la comuna', p: 100, m: '$ 126.500.000', st: 'finalizado' },
  { n: 'APR La Huerta — mejoramiento', s: 'La Huerta', p: 12, m: '$ 356.000.000', st: 'suspendido' },
];
function Resumen() {
  return <>
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))', gap: 16 }}>
      <MetricCard icon="laptop" label="Trámites en línea" value="1.284" delta="+18%" caption="vs. septiembre" />
      <MetricCard icon="clock" label="Tiempo de respuesta" value="2,4" unit="días" delta="−0,6 días" trend="down" upIsGood={false} caption="promedio" />
      <MetricCard icon="users" label="Atenciones en terreno" value="312" delta="+42" caption="4 sectores" />
      <MetricCard icon="wallet" label="Ejecución presupuestaria" value="71" unit="%" progress={71} caption="M$ 5.850 de M$ 8.240" />
    </div>
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(420px,1fr))', gap: 16 }}>
      <div style={panel}><PanelHead title="Trámites por canal" sub="Mayo a octubre 2026" right={<Badge tone="green" icon="trending-up">En línea supera a presencial en oct.</Badge>} />
        <LineChart labels={['May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct']} series={[{ name: 'En línea', values: [420, 510, 640, 760, 980, 1284] }, { name: 'Presencial', values: [1900, 1820, 1760, 1650, 1500, 1180] }]} height={240} /></div>
      <div style={panel}><PanelHead title="Presupuesto 2026" sub="Distribución por área" /><DonutChart size={190} centerLabel="total" centerValue="M$8.240" data={[{ label: 'Salud', value: 38 }, { label: 'Educación', value: 34 }, { label: 'Gestión municipal', value: 16 }, { label: 'Desarrollo comunitario', value: 12 }]} /></div>
    </div>
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(420px,1fr))', gap: 16 }}>
      <div style={panel}><PanelHead title="Solicitudes por sector" sub="Últimos 30 días" /><BarChart data={[{ label: 'Hualañé centro', value: 412, highlight: true }, { label: 'La Huerta de Mataquito', value: 198 }, { label: 'Quilpoco', value: 121 }, { label: 'Los Coipos', value: 86 }, { label: 'Parronal', value: 64 }]} /></div>
      <div style={panel}><PanelHead title="Estado de servicios" sub="Actualizado 09:12" right={<Button size="sm" variant="ghost" iconLeft="refresh-cw">Actualizar</Button>} />
        <div><ServiceStatus name="Recolección de basura" status="intermitente" detail="La Huerta con 1 día de retraso" updated="09:12" /><ServiceStatus name="Agua potable rural" status="operativo" updated="08:40" /><ServiceStatus name="Ruta J-60" status="suspendido" detail="Corte parcial hasta 18:00" updated="07:55" /><ServiceStatus name="CESFAM Hualañé" status="operativo" detail="Espera promedio 25 min" updated="09:00" /></div></div>
    </div>
  </>;
}
function Obras() {
  return <div style={panel}>
    <PanelHead title="Avance de obras" sub="5 proyectos activos · M$ 2.219 en inversión" right={<Button size="sm" variant="secondary" iconLeft="download">Exportar</Button>} />
    <DataTable caption="Obras" columns={[{ key: 'n', label: 'Proyecto', render: (r) => <div><div style={{ fontWeight: 700 }}>{r.n}</div><div style={{ fontSize: 14, color: 'var(--color-text-secondary)' }}>{r.s}</div></div> }, { key: 'p', label: 'Avance', render: (r) => <div style={{ minWidth: 180 }}><ProgressBar value={r.p} tone={r.p === 100 ? 'green' : 'blue'} /></div> }, { key: 'st', label: 'Estado', render: (r) => <StatusBadge size="sm" status={r.st} /> }, { key: 'm', label: 'Monto', numeric: true }]} rows={OBRAS} />
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(320px,1fr))', gap: 24, paddingTop: 8 }}>
      <div><h3 style={{ margin: '0 0 14px', fontSize: 17 }}>Defensa fluvial ribera Mataquito</h3><Timeline steps={[{ title: 'Diseño aprobado', meta: 'Marzo 2026', state: 'done' }, { title: 'Licitación adjudicada', meta: 'Junio 2026', state: 'done' }, { title: 'Ejecución tramo 1', meta: '35% · retraso por crecida', state: 'current' }, { title: 'Recepción final', meta: 'Estimado: marzo 2027', state: 'pending' }]} /></div>
      <div style={{ borderRadius: 16, background: 'url(' + DA + '/photos/feria-terreno.jpg) center 60%/cover', minHeight: 220 }} />
    </div>
  </div>;
}
function Dash() {
  const [view, setView] = React.useState('resumen');
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '264px 1fr', minHeight: '100vh', background: 'var(--color-surface-sunken)', fontFamily: 'var(--font-sans)' }}>
      <Sidebar value={view} onChange={setView}
        header={<div style={{ display: 'flex', gap: 12, alignItems: 'center', padding: '4px 8px 12px' }}><img src={DA + '/logo/digital-mark.svg'} alt="" style={{ width: 40, borderRadius: 10 }} /><div><div style={{ fontWeight: 800, fontSize: 17 }}>Panel municipal</div><div style={{ fontSize: 13, color: 'var(--color-text-secondary)' }}>Hualañé</div></div></div>}
        groups={[{ items: [{ id: 'resumen', label: 'Resumen', icon: 'layout-dashboard' }, { id: 'obras', label: 'Obras', icon: 'construction' }, { id: 'tramites', label: 'Trámites', icon: 'file-text', badge: 12 }, { id: 'atencion', label: 'Atención ciudadana', icon: 'headset', badge: 3 }] }, { title: 'Territorio', items: [{ id: 'mapa', label: 'Mapa comunal', icon: 'map' }, { id: 'terreno', label: 'Operativos en terreno', icon: 'truck' }, { id: 'alertas', label: 'Emergencias', icon: 'siren' }] }, { title: 'Transparencia', items: [{ id: 'presupuesto', label: 'Presupuesto', icon: 'wallet' }, { id: 'cuenta', label: 'Cuenta pública', icon: 'files' }] }]}
        footer={<div style={{ display: 'flex', gap: 10, alignItems: 'center', padding: 8, borderTop: '1px solid var(--color-border)' }}><span style={{ width: 36, height: 36, borderRadius: 18, background: 'var(--green-100)', color: 'var(--green-800)', display: 'grid', placeItems: 'center', fontWeight: 800, fontSize: 14 }}>JP</span><div style={{ fontSize: 14 }}><b>Juan Pérez</b><div style={{ color: 'var(--color-text-secondary)' }}>SECPLAN</div></div></div>} />
      <main style={{ padding: '28px 32px 48px', display: 'flex', flexDirection: 'column', gap: 20, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 16, flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: 260 }}><div style={{ fontSize: 15, color: 'var(--color-text-secondary)' }}>Lunes 5 de octubre de 2026</div><h1 style={{ margin: '4px 0 0', font: '800 34px/1.15 var(--font-sans)', letterSpacing: '-.015em' }}>{view === 'obras' ? 'Obras' : 'Resumen comunal'}</h1></div>
          <div style={{ width: 220 }}><Select label="Periodo" options={['Últimos 30 días', 'Este trimestre', '2026']} /></div>
          <Button iconLeft="files">Informe para el Concejo</Button>
        </div>
        <Tabs items={[{ id: 'resumen', label: 'Resumen' }, { id: 'obras', label: 'Obras', count: 5 }]} value={view === 'obras' ? 'obras' : 'resumen'} onChange={setView} />
        {view === 'obras' ? <Obras /> : <Resumen />}
      </main>
    </div>
  );
}
ReactDOM.createRoot(document.getElementById('root')).render(<Dash />);
