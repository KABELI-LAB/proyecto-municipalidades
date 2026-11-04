Horizontal or vertical bars with direct labels (no legends needed); one highlight color, rest muted.

```jsx
<BarChart data={[{label:'Salud',value:42},{label:'Educación',value:31,highlight:true}]} />
```

See BarChart.d.ts for all props. Styling lives in components/hds.css (hds- classes) and resolves to tokens in tokens/*.css.
