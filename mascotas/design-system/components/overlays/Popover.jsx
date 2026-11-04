import React from 'react';
export function Popover({ trigger, children, open, onOpenChange }) {
  const [o, setO] = React.useState(false);
  const show = open ?? o;
  const set = (v) => { setO(v); onOpenChange && onOpenChange(v); };
  return (
    <span style={{ position: 'relative', display: 'inline-flex' }}>
      <span onClick={() => set(!show)}>{trigger}</span>
      {show && <div className="hds-popover" role="dialog">{children}</div>}
    </span>
  );
}