import React from 'react';
export function DataTable({ columns = [], rows = [], caption }) {
  return (
    <div style={{ overflowX: 'auto', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-large)' }}>
      <table className="hds-table">
        {caption && <caption className="hds-visually-hidden">{caption}</caption>}
        <thead><tr>{columns.map((c) => <th key={c.key} style={{ textAlign: c.numeric ? 'right' : 'left' }}>{c.label}</th>)}</tr></thead>
        <tbody>{rows.map((r, i) => <tr key={i}>{columns.map((c) => <td key={c.key} className={c.numeric ? 'num' : undefined}>{c.render ? c.render(r) : r[c.key]}</td>)}</tr>)}</tbody>
      </table>
    </div>
  );
}