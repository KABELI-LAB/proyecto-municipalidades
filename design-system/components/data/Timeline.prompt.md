Step-by-step status of a trámite or obra: done / current / pending, with dates.

```jsx
<Timeline steps={[{title:'Solicitud recibida',meta:'3 oct',state:'done'},{title:'En revisión',state:'current'},{title:'Lista para retiro',state:'pending'}]} />
```

See Timeline.d.ts for all props. Styling lives in components/hds.css (hds- classes) and resolves to tokens in tokens/*.css.
