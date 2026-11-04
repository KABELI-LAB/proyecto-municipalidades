Plain data table: uppercase small headers, mono right-aligned numbers, row hover.

```jsx
<DataTable columns={[{key:'n',label:'Proyecto'},{key:'m',label:'Monto',numeric:true}]} rows={[{n:'Sede vecinal',m:'$ 84.000.000'}]} />
```

See DataTable.d.ts for all props. Styling lives in components/hds.css (hds- classes) and resolves to tokens in tokens/*.css.
