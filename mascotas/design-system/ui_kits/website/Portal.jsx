const { Breadcrumbs, Tabs, TramiteCard: TC, SearchBar: SB, EmptyState, Button: Btn } = window.HualaDesignSystem_c0b80f;
function Portal({ go }) {
  const cats = ['Todos', 'Certificados', 'Tránsito', 'Comercio', 'Social', 'Vivienda y obras'];
  const [cat, setCat] = React.useState('Todos');
  const [online, setOnline] = React.useState(false);
  const list = TRAMITES.filter((t) => (cat === 'Todos' || t.cat === cat) && (!online || t.modality.includes('línea')));
  return (
    <main style={{ ...wrap, padding: '32px 32px 80px' }}>
      <Breadcrumbs items={[{ label: 'Inicio' }, { label: 'Trámites' }]} />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px,1fr))', gap: 32, alignItems: 'end', margin: '20px 0 32px' }}>
        <div><h1 style={{ margin: 0, font: '700 44px/1.1 var(--font-sans)', letterSpacing: '-.02em' }}>Trámites</h1>
          <p style={{ margin: '12px 0 0', fontSize: 19, color: 'var(--color-text-secondary)', maxWidth: 520 }}>Antes de empezar, te decimos qué necesitas, cuánto cuesta y cuánto demora.</p></div>
        <SB placeholder="Ej: permiso, patente, certificado" voice={false} />
      </div>
      <Tabs items={cats.map((c) => ({ id: c, label: c, count: c === 'Todos' ? TRAMITES.length : TRAMITES.filter((t) => t.cat === c).length }))} value={cat} onChange={setCat} />
      <div style={{ display: 'flex', gap: 8, margin: '20px 0 24px', alignItems: 'center' }}>
        <button className="hds-chip" aria-pressed={online} onClick={() => setOnline(!online)}>{online ? '✓ ' : ''}Solo en línea</button>
        <span style={{ marginLeft: 'auto', fontSize: 16, color: 'var(--color-text-secondary)' }}>{list.length} trámites</span>
      </div>
      {list.length ? <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(380px,1fr))', gap: 20 }}>
        {list.map((t) => <TC key={t.id} {...t} category={t.cat} cta={t.status === 'suspendido' ? 'No disponible' : 'Iniciar trámite'} onAction={() => go('tramite', t.id)} />)}
      </div> : <EmptyState title="No hay trámites con esos filtros" action={<Btn variant="secondary" onClick={() => { setCat('Todos'); setOnline(false); }}>Ver todos</Btn>} />}
    </main>
  );
}
Object.assign(window, { Portal });
