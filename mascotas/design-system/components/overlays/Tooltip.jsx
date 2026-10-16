import React from 'react';
export function Tooltip({ content, children, open }) {
  const [o, setO] = React.useState(false);
  const show = open ?? o;
  return (
    <span className="hds-tip" onMouseEnter={() => setO(true)} onMouseLeave={() => setO(false)} onFocus={() => setO(true)} onBlur={() => setO(false)}>
      {children}
      {show && <span role="tooltip" className="hds-tip__bubble">{content}</span>}
    </span>
  );
}