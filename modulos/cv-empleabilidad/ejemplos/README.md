# CVs de prueba

Siete archivos **ficticios** para probar la pestaña "Revisa tu CV". Nombres, teléfonos (`+56 9 5555 0xxx`), correos (`@example.com`) y RUT son inventados.

| Archivo | Formato | Perfil | Qué pone a prueba |
|---|---|---|---|
| `1-camila-soto-temporera.pdf` | PDF | Temporera agrícola | CV muy breve, sin correo ni perfil, con RUT, estado civil y fecha de nacimiento |
| `2-diego-munoz-mecanico.docx` | Word | Técnico mecánico | Frases débiles ("Encargado de…", "Responsable de…"), sin cifras ni idiomas |
| `3-valentina-rojas-ingeniera.pdf` | PDF a dos columnas | Ingeniera comercial | CV sólido con logros cuantificados; prueba la lectura de diseños con barra lateral |
| `4-matias-herrera-egresado.docx` | Word | Egresado de liceo técnico | Primer empleo: práctica, negocio familiar y voluntariado |
| `5-rosa-valenzuela-administrativa.pdf` | PDF de 2 páginas | Secretaria con 30 años de trayectoria | CV extenso, perfil genérico en primera persona, listas de funciones, datos personales innecesarios |
| `6-javiera-morales-con-imagenes.pdf` | PDF con 3 imágenes | Vendedora | Foto de su perro en lugar de foto personal + íconos decorativos: debe sugerir revisar las imágenes |
| `7-no-es-cv-receta.pdf` | PDF | (no es un CV) | Una receta de cocina: debe mostrarse "no parece ser un currículum", sin puntaje ni diseños |

Uso: `npm run dev` en la raíz, abrir http://localhost:5173 → **Revisa tu CV** y subir cualquiera de estos archivos. Si agrega más ejemplos, use solo datos inventados.
