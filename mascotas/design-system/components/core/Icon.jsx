import React from 'react';
const LUCIDE = 'https://unpkg.com/lucide-static@0.469.0/icons/';
const cache = {};
const pending = {};
function load(name) {
  if (!pending[name]) {
    pending[name] = fetch(LUCIDE + name + '.svg').then((r) => (r.ok ? r.text() : '')).catch(() => '').then((t) => {
      cache[name] = t.replace(/<!--[\s\S]*?-->/g, '').replace(/\swidth="24"/, ' width="100%"').replace(/\sheight="24"/, ' height="100%"').replace(/class="[^"]*"/, '');
      return cache[name];
    });
  }
  return pending[name];
}
export function Icon({ name, size = 20, label, style, className = '', strokeWidth }) {
  const [svg, setSvg] = React.useState(cache[name]);
  React.useEffect(() => {
    let alive = true;
    if (cache[name] !== undefined) setSvg(cache[name]);
    else load(name).then((t) => alive && setSvg(t));
    return () => { alive = false; };
  }, [name]);
  const html = svg && strokeWidth ? svg.replace(/stroke-width="2"/, 'stroke-width="' + strokeWidth + '"') : svg;
  return <span role={label ? 'img' : undefined} aria-label={label} aria-hidden={label ? undefined : true}
    className={'hds-icon ' + className}
    style={{ width: size, height: size, ...style }}
    dangerouslySetInnerHTML={html ? { __html: html } : undefined} />;
}
