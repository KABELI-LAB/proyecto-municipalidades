import React from 'react';
import { Icon } from '../core/Icon.jsx';
export function PersonCard({ name, role, unit, phone, email, hours, photo }) {
  const initials = name.split(' ').map((s) => s[0]).slice(0, 2).join('');
  return (
    <div className="hds-card"><div className="hds-card__pad" style={{ gap: 14 }}>
      <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
        <span style={{ width: 56, height: 56, borderRadius: '50%', flex: 'none', background: photo ? 'center/cover url(' + photo + ')' : 'var(--blue-100)', color: 'var(--blue-800)', display: 'grid', placeItems: 'center', font: '700 20px/1 var(--font-sans)' }}>{photo ? '' : initials}</span>
        <span style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <span style={{ fontWeight: 700, fontSize: 19 }}>{name}</span>
          <span style={{ fontSize: 16, color: 'var(--color-text-secondary)' }}>{role}{unit ? ' · ' + unit : ''}</span>
        </span>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 16 }}>
        {phone && <a href={'tel:' + phone} style={{ display: 'flex', gap: 8, alignItems: 'center' }}><Icon name="phone" size={18} />{phone}</a>}
        {email && <a href={'mailto:' + email} style={{ display: 'flex', gap: 8, alignItems: 'center' }}><Icon name="mail" size={18} />{email}</a>}
        {hours && <span style={{ display: 'flex', gap: 8, alignItems: 'center', color: 'var(--color-text-secondary)' }}><Icon name="clock" size={18} />{hours}</span>}
      </div>
    </div></div>
  );
}