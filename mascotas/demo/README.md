# Datos de demostración

Todo lo que está en esta carpeta es FICTICIO, salvo los nombres de sectores,
localidades y lugares (ver `sectores.md`). Cada archivo de `datos/` lleva
`"_demo": true` y debe mostrarse con la franja «Datos de demostración».

## Archivos

| Archivo | Contenido |
| --- | --- |
| `municipio.json` | Configuración del municipio |
| `sectores.json`, `localidades.json`, `lugares.json` | Territorio (coordenadas pendientes) |
| `animales.json` | 152 animales ficticios con sus características |
| `personas.json` | 164 personas ficticias («Vecino/a demo N», RUT de la serie 11.111.xxx, correos `@demo.invalid`) |
| `postulaciones.json` | Postulaciones a adopción con su persona |
| `usuarios.json` | 5 cuentas municipales de demostración, una por rol |
| `propuestas_adopcion.json` | Quién propuso cada ficha de adopción (un vecino ficticio), con su código TR y su relación con el animal |
| `catalogos.json` | Tipos de reporte, servicios, colores y tamaños |
| `perros_comunitarios.json` | 8 perros comunitarios asociados a lugares públicos |
| `adopcion.json`, `adopciones_realizadas.json` | 14 disponibles y 12 adopciones concretadas |
| `publicaciones.json` | Perdidas y encontradas: activas, reencontradas y archivadas |
| `operativos.json`, `atenciones.json` | 4 operativos cerrados, 1 borrador en La Huerta y 83 atenciones |
| `solicitudes.json` | 46 pendientes y 30 históricas, cada una con persona, animal y código `TR-NNNN` |
| `reportes.json`, `puntos_recurrentes.json` | 104 reportes y 5 puntos recurrentes para el mapa de calor |
| `avisos.json` | 4 avisos municipales |
| `prioridad.json` | Índice calculado por sector, con su explicación |
| `resumen.json` | Cifras del panel y del retrato de la comuna |

## Escenario de demostración

- Panel: 46 solicitudes pendientes, 34 reportes en 30 días, 83 atenciones y
  12 adopciones en 12 meses.
- La Huerta queda en prioridad alta (índice 1,00): 22 solicitudes pendientes,
  18 de esterilización, 214 días sin operativo.
- Un perro café con collar rojo perdido en Orilla de Valdés y otro encontrado
  en La Huerta: el sistema debe sugerirlo como posible coincidencia.
- El operativo de La Huerta existe como borrador para crearlo en vivo.
- Las pérdidas de mascotas aumentan en enero y septiembre (fuegos artificiales).

## Ubicaciones

Los puntos (publicaciones, reportes, comunitarios) no tienen coordenadas fijas:
tienen una referencia (localidad o lugar) y una `posicion` con desplazamiento
en metros (`dx_m`, `dy_m`). Cada punto ya trae su `lat` y `lng` calculados desde
`coordenadas.json` (referencia + desplazamiento). Si se corrigen coordenadas,
basta con ejecutar `python3 generar.py` para recalcular todo.

## Fotos

Cada animal tiene `"foto": null`. Al agregar fotos en `fotos/`, se asignan a
las fichas según especie, color y tamaño. Nunca generar ni descargar otras.

## Regenerar

`python3 generar.py` (o `python generar.py`) vuelve a crear `datos/` con los mismos resultados
(semilla fija). Para cambiar el escenario, edite el script.

## Personas ficticias

Las personas existen solo para que funcionen los flujos (invitación
prioritaria, Mis solicitudes, postulaciones). Para probar Mis solicitudes,
use el RUT y el código de cualquier solicitud de `solicitudes.json`.
Nunca deben mostrarse en el portal público ni usarse fuera del modo demostración.
