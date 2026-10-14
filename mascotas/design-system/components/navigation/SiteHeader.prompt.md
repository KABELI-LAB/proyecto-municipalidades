Citizen website header: gov strip + logo + needs-based nav + search/accessibility actions.

```jsx
<SiteHeader items={[{label:'Trámites',current:true},{label:'Beneficios'},{label:'Pagos'}]} />
```

See SiteHeader.d.ts for all props. Styling lives in components/hds.css (hds- classes) and resolves to tokens in tokens/*.css.
