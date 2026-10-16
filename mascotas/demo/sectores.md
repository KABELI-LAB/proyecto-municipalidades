# Territorio de Hualañé (entregado por el equipo)

Cuatro sectores, que son la unidad de priorización y del mapa por sectores,
y sus localidades, que se usan para ubicar solicitudes, publicaciones y reportes.

| Sector | Localidades |
| --- | --- |
| Hualañé | Hualañé, La Higuera, El Buche, Mira Río, Barandica, Peralillo, El Rincón, El Molino, El Porvenir |
| Patacón | Patacón, Los Sauces, Quilico, Boquil, Tilicura, Los Cristales, Espinalillo |
| Los Coipos | Los Coipos, Caone, Barba Rubia, Camarico, El Llano, El Cobre, Alto de Caone |
| La Huerta | La Huerta, Orilla de Valdés, Orilla de Navarro, Remolino, Parronal |

## Lugares de referencia

| Lugar | Tipo | Sector asignado |
| --- | --- | --- |
| Plaza de Armas de Hualañé | Plaza | Hualañé |
| Municipalidad de Hualañé | Edificio municipal | Hualañé |
| Estadio Municipal de Hualañé | Recinto deportivo | Hualañé |
| Liceo Bicentenario de Hualañé | Establecimiento educacional | Hualañé |
| Escuela Monseñor Manuel Larraín Errázuriz | Escuela | Hualañé |
| Escuela La Huerta de Mataquito | Escuela | La Huerta |
| Escuela Orilla de Navarro | Escuela | La Huerta (Orilla de Navarro) |
| Escuela Carlos Correa Núñez – Mira Río | Escuela | Hualañé (Mira Río) |
| Escuela Caone | Escuela | Los Coipos (Caone) |
| Sala Multipropósito | Espacio comunitario | Hualañé (a confirmar) |

## Coordenadas

Las coordenadas aproximadas de las localidades están en `coordenadas.json`.
El centro de cada sector es el promedio de sus localidades, y los lugares de
referencia usan la coordenada de su localidad hasta tener la propia.

Por revisar:

- Alto de Caone no tiene coordenada; usa la de Caone.
- Quilico, Tilicura y Los Cristales tienen la misma coordenada, así que sus
  puntos se superponen en el mapa.
- Mira Río (sector Hualañé) queda junto a las localidades de Patacón, y
  Peralillo (Hualañé) junto a Parronal (La Huerta). Confirmar que es correcto.
- Para ubicar con precisión un lugar de referencia, agregar su coordenada en
  `coordenadas.json` dentro de `"lugares"` y ejecutar `python3 generar.py`.
