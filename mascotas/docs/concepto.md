# Plataforma de Tenencia Responsable Hualañé — Diseño conceptual del producto

Versión del 6 de octubre de 2026. Fuente de verdad del producto para el desarrollo.

## Resumen

La plataforma no es un portal de publicaciones: cada trámite ciudadano queda registrado por sector, especie y fecha, y alimenta un índice que ayuda al municipio a decidir dónde y cuándo hacer el próximo operativo. El portal ciudadano es la puerta de entrada; el valor está en el panel municipal y en el ciclo que conecta ambos.

Ciclo del producto:

```
Ciudadanía → Datos → Inteligencia → Decisión municipal → Operativo → Resultados
                ↑                                                       │
                └──────────────────── nuevo ciclo ──────────────────────┘
```

El ciclo se cierra cuando los resultados de un operativo actualizan la ficha del sector y recalculan su prioridad. Sin ese retorno, la plataforma sería solo un registro.

## 1. Arquitectura de información

La plataforma tiene dos espacios —Portal ciudadano y Panel municipal— que leen y escriben sobre un mismo núcleo de datos. Todo registro queda asociado a cuatro ejes comunes: sector, fecha, especie y tipo de servicio. Esos cuatro ejes son los que hacen posible la inteligencia territorial.

### Portal ciudadano (público, sin cuenta obligatoria)

| Sección | Qué permite hacer |
| --- | --- |
| Inicio | Ver las 5 acciones principales, próximos operativos y avisos vigentes |
| Perdí o encontré una mascota | Publicar, buscar por especie y sector, ver posibles coincidencias |
| Quiero adoptar | Ver fichas de animales disponibles y postular |
| Operativos | Ver operativos por fecha y sector, revisar cupos y requisitos, solicitar cupo |
| Solicitar un servicio | Registrar interés en esterilización, vacuna o microchip aunque no haya operativo |
| Reportar una situación | Abandono, animal herido, jauría, atropello, maltrato, animal comunitario sin atención u otro problema de tenencia |
| Mis solicitudes | Consultar estado con RUT + código de seguimiento |
| Perros comunitarios | Fichas de los perros comunitarios y su lugar de referencia; cualquier vecino puede registrar uno y queda como su cuidador |
| Avisos | Comunicados municipales vigentes, filtrables por sector |
| Tenencia responsable | Información práctica y normativa |

### Panel municipal (autenticado)

Una sola pantalla, como el portal de vecinos, sin menú de módulos. Los funcionarios quieren cosas simples.

| Módulo | Pregunta que responde |
| --- | --- |
| Por aprobar | ¿Qué enviaron los vecinos (perdidos, avistados, adopciones) que hay que aprobar? |
| Operativos | ¿Qué operativos hay y cómo van los cupos? Crear uno es un formulario corto que publica de una vez |
| Reportes SOS | ¿Qué situaciones reportó la ciudadanía y cuáles siguen abiertas? |
| Lo que piden los vecinos | ¿Qué servicios piden, qué reportan y dónde? Cifras directas, sin índices |
| Mapa | ¿Dónde se concentra la demanda? |
| Avisos a vecinos | Crear, editar y eliminar lo que se comunica en el portal |

Fuera del panel (decisión del equipo): Sectores, Inteligencia, minuta y correo semanal. Configuración queda solo para Instagram (publicación automática), para administración. La asistencia de los operativos se registra en la ficha de cada operativo, no en una vista de terreno aparte.

### Núcleo de datos (entidades)

| Entidad | Contenido clave | Alimenta |
| --- | --- | --- |
| Municipio | Nombre, identidad visual, parámetros | Replicabilidad multi-municipio |
| Sector | Nombre, tipo (urbano, rural o urbano-rural), centro aproximado, población si existe | Mapa, priorización |
| Localidad | Nombre, sector, coordenada aproximada | Ubicar solicitudes, publicaciones y reportes |
| Lugar de referencia | Nombre, tipo (plaza, escuela, recinto), localidad, coordenada aproximada | Operativos, perros comunitarios |
| Persona | Nombre, RUT, contacto, sector (nunca dirección pública) | Solicitudes, cupos |
| Animal | Especie, sexo, edad aprox., color, tamaño, estado sanitario | Atenciones, adopción |
| Solicitud de servicio | Persona, animal, servicio, sector, fecha, estado | Demanda pendiente |
| Reporte ciudadano | Tipo, sector, localidad o lugar, fecha, descripción, estado | Mapa de calor del panel |
| Perro comunitario | Ficha pública siempre a cargo de vecinos (se publica de inmediato): animal, apodo, foto, lugar de referencia, última revisión, actualización de los datos; cuidador (quien lo registra o se hace cargo, con un código para gestionarlo); novedades de vecinos (le llegan a su cuidador); historial de cambios. El municipio no interviene | Portal y Mis solicitudes (cuidador) |
| Publicación de mascota | Perdida/encontrada, rasgos, foto, sector, fecha | Coincidencias |
| Operativo | Sector, fecha, horario, servicios, capacidad, estado | Ciclo de intervención |
| Cupo | Operativo, persona, animal, servicio, estado | Asistencia |
| Atención | Animal, servicio realizado, resultado, funcionario | Resultados territoriales |
| Aviso | Tipo, sectores, vigencia | Comunicación |
| Usuario municipal | Rol, permisos | Control de acceso |

La entidad Municipio está en la raíz: cambiar de Hualañé a Curepto significa cargar otro municipio con sus sectores, no reconstruir la plataforma.

## 2. Roles de usuario

Siete roles cubren el MVP; el ciudadano no necesita crear cuenta, y cada rol municipal ve solo lo que su trabajo requiere.

| Rol | Quién es | Puede hacer | No puede hacer |
| --- | --- | --- | --- |
| Visitante | Cualquier persona | Ver publicaciones, adopciones, operativos, avisos | Ver datos de contacto directos |
| Ciudadano identificado | Persona que entrega contacto al hacer un trámite; el RUT se pide solo donde hace falta (ver «RUT en los formularios») | Publicar mascota, solicitar servicio o cupo, postular a adopción, consultar estado | Ver datos de otros ciudadanos |
| Funcionario de terreno | Veterinario, técnico o apoyo en operativo | Ver lista de inscritos del operativo asignado, registrar asistencia y atenciones | Crear operativos, ver inteligencia |
| Coordinador de tenencia responsable | Encargado municipal del programa | Crear operativos, gestionar cupos, revisar solicitudes, ver mapa e inteligencia | Configurar el sistema |
| Comunicaciones / moderación | Equipo de comunicaciones | Publicar avisos, moderar publicaciones de mascotas | Ver datos sanitarios o de denuncias |
| Directivo | Alcalde, director de área, concejo | Ver resumen, mapa, resultados y reportes en modo lectura | Ver datos personales individuales |
| Administrador | Responsable técnico | Configurar municipio, sectores, servicios, usuarios y pesos de priorización | — |

En segunda etapa se agrega el rol Organización colaboradora (fundaciones, agrupaciones animalistas, juntas de vecinos), con permisos acotados para publicar adopciones y apoyar operativos.

## 3. Flujo ciudadano

Toda acción ciudadana se completa en tres pasos o menos y termina con un código de seguimiento; el ciudadano no crea cuenta.

La página de inicio muestra cinco botones grandes: Perdí o encontré una mascota, Quiero adoptar, Buscar un operativo, Solicitar un servicio, Ver avisos. Debajo aparecen el próximo operativo con sus cupos disponibles y los avisos vigentes.

**SOS Mascotas.** El reporte ciudadano se presenta como SOS Mascotas, con un acceso destacado y cálido en la portada, sin tono de emergencia. Seis categorías (animal herido o enfermo; posible maltrato o abandono; animal agresivo o en peligro; perro comunitario que necesita atención; animal atrapado o en una situación de riesgo; otra situación de bienestar animal) y una foto opcional que solo ve el equipo municipal, guardada sin metadatos. No se pregunta la urgencia, porque es subjetiva: el equipo revisa primero lo que lleva más tiempo esperando. Estados reales: Recibido, En revisión y Cerrado, cada cambio con su fecha y responsable en el historial.

Patrón común de cada trámite:

1. Elegir qué necesita (servicio, tipo de publicación, operativo).
2. Completar un formulario corto: datos del animal, sector elegido de una lista, nombre, RUT y teléfono o correo.
3. Confirmar y recibir un código de seguimiento (formato TR-NNNN) en pantalla y por correo o SMS.

Con ese código y su RUT, la persona entra a Mis solicitudes y ve el estado de cada trámite: Recibida, En lista de espera, Cupo confirmado, Atendida.

**RUT en los formularios.** Se pide solo donde hace falta saber quién es la persona:

- Obligatorio: cupo en operativo (límite por hogar), postular a adopción, dar en adopción y reportar una mascota perdida (el dueño gestiona su aviso).
- Opcional: solicitar un servicio (solo mide la necesidad).
- No se pide: SOS, mascota avistada y novedad de perro comunitario (salvo el cuidador autorizado, que se identifica con RUT y código). Basta un teléfono o correo.

Un trámite hecho sin RUT no aparece en Mis solicitudes; si hace falta, el municipio escribe al contacto que dejó la persona.

Decisiones de diseño:

- La localidad se elige de una lista cerrada, no se escribe, y de ella se deduce el sector; así el dato es limpio y mapeable.
- No se pide dirección exacta. La ubicación pública es siempre el sector.
- Si no hay operativo en su sector, el sistema registra la demanda y le avisa cuando se publique uno cercano. Nunca termina en "no hay disponibilidad" sin siguiente paso.
- El lenguaje es municipal y cercano: "Su solicitud fue recibida" en lugar de mensajes técnicos.

## 4. Flujo municipal

El panel está organizado en torno a una rutina de trabajo: revisar, priorizar, actuar y cerrar. Desde la simplificación del panel, se entra por tres bloques (Por aprobar, Operativos y Reportes SOS); lo que sigue describe la rutina, no pantallas separadas.

1. **Revisar.** El Resumen muestra la situación actual y una bandeja de pendientes: reportes sin revisar, publicaciones por moderar, coincidencias por validar, postulaciones de adopción.
2. **Entender.** Desde un indicador o el mapa, el coordinador abre la ficha de un sector: demanda pendiente por servicio, reportes recientes, último operativo y su resultado.
3. **Priorizar.** El módulo Territorio ordena los sectores por prioridad y explica por qué cada uno está arriba.
4. **Actuar.** Desde la ficha del sector, Crear operativo abre el formulario con el sector cargado y una sugerencia de capacidad según la demanda pendiente.
5. **Gestionar.** Durante las inscripciones se ve cómo se llenan los cupos y la lista de espera.
6. **Ejecutar.** El día del operativo, el funcionario de terreno usa una vista móvil para marcar asistencia y registrar atenciones.
7. **Cerrar.** El operativo se cierra y sus resultados actualizan los indicadores del sector.

En paralelo: moderar publicaciones, responder reportes, publicar avisos y revisar postulaciones de adopción.

## 5. Flujo completo de operativos

1. **Origen.** Se crea desde una recomendación de prioridad, desde la ficha de un sector o desde cero.
2. **Configuración.** Sector, lugar de referencia (sede social, escuela, posta), fecha, horario, servicios y cupos por servicio (por ejemplo, 20 esterilizaciones, 40 vacunas, 40 microchips). Requisitos visibles: ayuno, edad mínima, documentos.
3. **Borrador y revisión.** Queda en Borrador hasta publicarse. Al publicar, el sistema prepara un aviso automático para que comunicaciones lo revise.
4. **Invitación prioritaria.** Antes de abrir al público, se invita a quienes ya tenían solicitudes pendientes en ese sector.
5. **Inscripciones.** Al agotarse los cupos, las nuevas solicitudes pasan a lista de espera.
6. **Confirmación.** Recordatorio 48 horas antes. Cupos no confirmados o cancelados se liberan a la lista de espera.
7. **Ejecución.** Se marca asistencia y se registra cada atención: servicio, resultado, observaciones. Se permiten atenciones espontáneas sin inscripción.
8. **Cierre.** El sistema calcula ocupación, asistencia, atenciones por servicio y demanda no cubierta.
9. **Retorno.** Los resultados actualizan la ficha del sector, reinician el contador de días sin intervención y recalculan su prioridad. Quienes quedaron en espera vuelven a la demanda pendiente.

Estados: Borrador → Publicado → Inscripciones cerradas → En curso → Cerrado. Antes de En curso puede pasar a Cancelado, lo que notifica a todos los inscritos.

## 6. Flujo de mascotas perdidas y avistadas

1. **Publicar.** «Reportar mascota perdida» o «Informar mascota avistada»: especie, foto (opcional), color principal, tamaño, sexo si lo sabe, rasgos (collar, cicatriz, mancha), localidad y fecha. Quien la vio indica si la tiene consigo, si está retenida en otro lugar (veterinaria, local, vecino) o si solo la vio; si está resguardada, indica la localidad (se muestra con su sector) y qué lugar es, sin dirección ni teléfonos, y puede vincular el avistamiento a un aviso de pérdida: queda como posible coincidencia, nunca como confirmación de que es el mismo animal.
2. **Publicación.** El aviso queda recibido y el municipio lo acepta en la bandeja de publicaciones; al aceptarlo se publica en el portal y en Instagram a la vez. Contacto protegido: los mensajes pasan por la plataforma sin exponer el teléfono. Si alguien lo reporta, vuelve a la bandeja.
3. **Coincidencias.** El sistema compara contra publicaciones opuestas abiertas y muestra hasta 3 posibles coincidencias ordenadas por similitud.
4. **Aviso.** Ambas personas reciben: "Hay una publicación que podría corresponder a su mascota". Nunca se afirma que es el mismo animal.
5. **Resolución.** Se marca Reencontrada o Ya no aplica, registrando si el reencuentro vino de una coincidencia sugerida. Si quien publica indica la coincidencia que la ayudó, se cierran ambos avisos y se avisa a la otra persona. Si alguien avisa por otra vía (teléfono, en persona), el equipo municipal puede marcar el aviso como Reencontrada desde la bandeja de publicaciones.
6. **Expiración.** A los 30 días se pide confirmar vigencia; sin respuesta, se archiva.
7. **Difusión.** Al aceptar un aviso de mascota perdida o avistada (con foto), al publicar un operativo o al aprobar una ficha de adopción, el sistema genera una pieza para Instagram (4:5) con la foto, rasgos generales, el sector y la fecha, y un texto sin teléfonos, direcciones ni rasgos que permitan reclamos fraudulentos, y la publica de inmediato con la API oficial de Meta, si la municipalidad configuró sus credenciales en el servidor; sin ellas, se publica solo en la web. No hay un paso de revisión aparte: aceptar en el panel es publicar en ambos lados.

Coincidencia del MVP por reglas explicables: misma especie (obligatorio), mismo sector o localidades a menos de 10 km según sus coordenadas aproximadas, ventana de 15 días, color y tamaño compatibles, collar y señas en común. Se muestra como "Posible coincidencia — función experimental". La comparación de fotografías queda para segunda etapa.

## 7. Flujo de adopciones

Las propone un vecino o el municipio, y siempre las publica el municipio tras revisarlas (en segunda etapa también organizaciones colaboradoras). Sin precio y con compromiso de esterilización: así se evita un marketplace de animales.

0. **Propuesta.** Un vecino propone dar en adopción a un animal («Dar en adopción», distinto de «Quiero adoptar»): de 1 a 3 fotos, datos del animal (todo antecedente admite «No sé»), carácter, salud conocida, qué hogar le vendría bien, su relación con el animal, una declaración de que puede darlo en adopción, su contacto (protegido) y su localidad. Queda en revisión: el municipio la aprueba y publica, pide correcciones, la rechaza o, ya publicada, la oculta, siempre con un motivo que ve quien la propuso. Las fotos son privadas hasta que la ficha se publica. Se evitan duplicados (la misma foto en otra propuesta abierta, o el mismo animal propuesto dos veces por la misma persona). Quien propuso puede retirarla o avisar que encontró hogar, desde Mis solicitudes; eso no cuenta como adopción de la plataforma.
   **Las postulaciones a un animal propuesto por un vecino no pasan por el municipio:** le llegan a quien lo propuso, que las ve en Mis solicitudes sin datos de contacto. Al elegir a una persona (que aceptó al postular que se comparta su contacto), la plataforma muestra a cada uno el contacto del otro y la ficha queda en proceso. Luego quien propuso registra si la adopción se concretó (la ficha pasa a Adoptado y se crean los compromisos de esterilización o microchip) o no (vuelve a estar disponible). Hoy todas las fichas del catálogo son de vecinos (también las de la demostración, ver `demo/datos/propuestas_adopcion.json`). Si el municipio publicara fichas propias, por ejemplo de un canil municipal, esas seguirían el flujo municipal de los pasos 2 a 5.
1. **Ficha.** Fotos, nombre, especie, edad aproximada, tamaño, sexo, esterilización, vacunas, microchip, carácter y convivencia.
2. **Postulación.** Contacto, sector, tipo de vivienda, experiencia previa, otros animales.
3. **Revisión.** En evaluación, Aprobada o No seleccionada; opcionalmente conversación o visita.
4. **Adopción.** La ficha pasa a Adoptado y se registra el sector del adoptante.
5. **Compromisos.** Si falta esterilización o microchip, se genera una solicitud de servicio pendiente a nombre del adoptante.
6. **Seguimiento.** Opcional, recordatorio a los 30 días.

Indicadores: adopciones por mes y sector, tiempo promedio hasta adopción, animales que más tiempo esperan.

## 8. Sistema de avisos

Comunicaciones con tipo, sectores destinatarios y fecha de vencimiento; un aviso vencido desaparece solo.

| Tipo | Ejemplo | Origen |
| --- | --- | --- |
| Operativo | "Operativo de esterilización en La Huerta, sábado [fecha]" | Automático al publicar un operativo, revisado por comunicaciones |
| Cambio o cancelación | "El operativo se traslada a la sede social" | Automático al editar o cancelar |
| Campaña | Vacunación antirrábica, campaña de adopción | Manual |
| Alerta | Animal agresivo suelto, alerta sanitaria | Manual, destacado en portada |
| Información general | Horarios, normativa de tenencia responsable | Manual |

Canales MVP: portal web y botón para compartir a WhatsApp y redes. Segunda etapa: SMS o WhatsApp a personas inscritas o con solicitudes en el sector.

## 9. Sistema de solicitudes y cupos

Se separan la solicitud de servicio (demanda, sin fecha) y la solicitud de cupo (inscripción en un operativo concreto).

| | Solicitud de servicio | Solicitud de cupo |
| --- | --- | --- |
| Ejemplo | "Quiero esterilizar a mi gata" | "Quiero un cupo en el operativo de La Huerta" |
| Existe sin operativo | Sí | No |
| Para qué sirve | Medir demanda por sector y servicio | Organizar la atención de un día |
| Qué alimenta | Priorización y mapa | Ocupación, asistencia, resultados |

Al publicarse un operativo, las solicitudes pendientes compatibles reciben una invitación prioritaria: mismo servicio que ofrece el operativo; del mismo sector o de una localidad a menos de 10 km del lugar; primero el sector y, dentro de cada grupo, la más antigua; sin duplicados y respetando el límite por hogar. Se invita hasta completar los cupos libres. La invitación tiene un plazo (48 horas, nunca después del día anterior al operativo), muestra servicio, fecha, lugar y condiciones, y retiene el cupo para que la inscripción pública no lo tome, pero no es una reserva: si la persona confirma interés, el sistema le asigna el cupo efectivo cuando hay disponibilidad. Si la rechaza o vence el plazo, su solicitud vuelve a la demanda pendiente y se invita a la siguiente; si no queda demanda que invitar, el cupo libre pasa a la lista de espera pública. Se registran envío, plazo, respuesta, asignación y cierre. Las notificaciones son internas (se ven en Mis solicitudes); el envío por correo o SMS queda para cuando exista una integración real.

Estados: Recibida → Invitado a operativo → Cupo confirmado (o En lista de espera) → Atendida. También: No asistió, Cancelada por la persona, Cancelada por el municipio.

Reglas de cupos:

- Capacidad por servicio dentro de cada operativo.
- Límite por hogar configurable (por ejemplo, 2 animales).
- Lista de espera automática por orden de llegada.
- Recordatorio 48 horas antes con cancelación en un clic.
- Registro de inasistencias (base para sobreasignación en etapa 2).
- Quien queda sin cupo vuelve a la demanda pendiente.

## 10. Dashboard municipal

El funcionario no trabaja todo el día en el panel: el Resumen responde «¿qué tengo que decidir hoy?» y cada pendiente se resuelve con un clic. El detalle (mapa, tendencia, resultados) queda en Inteligencia y en la minuta. Cada semana, un correo lleva la minuta y los pendientes, con enlaces directos a cada acción.

**Para hoy:** recomendación del sector prioritario con su acción (publicar o crear el operativo) y hasta cinco pendientes accionables.

**Minuta:** una página con membrete institucional (cifras, recomendación, tres hallazgos calculados y lo que viene), para imprimir o guardar en PDF y llevar a la dirección o al concejo.

| Bloque | Contenido | Decisión que habilita |
| --- | --- | --- |
| Situación actual | Solicitudes pendientes, reportes recientes (30 días), atenciones en el período, adopciones; con variación vs período anterior | Saber si la carga sube o baja |
| Sector que requiere atención | Sector de mayor prioridad, nivel, motivos y botón Crear operativo | Iniciar una intervención |
| Próximos operativos | Fecha, sector, ocupación de cupos por servicio | Reforzar difusión |
| Pendientes de revisión | Reportes, publicaciones, coincidencias, postulaciones | Ordenar el trabajo del día |
| Resultados recientes | Último operativo cerrado: asistencia, atenciones, demanda no cubierta | Evaluar la intervención |
| Tendencia | Solicitudes y atenciones por mes, 12 meses | Ver si la oferta alcanza |

Controles: período (30 días, trimestre, año) y especie. Cada cifra lleva al listado o al mapa filtrado. Con datos simulados, franja fija "Datos de demostración". Vista directiva: igual, en lectura, sin bandeja.

Escenario de demostración (cifras guionizadas): 46 solicitudes pendientes, 34 reportes recientes, 83 atenciones realizadas, 12 adopciones; sector prioritario La Huerta.

## 11. Mapa e inteligencia territorial

Sectores coloreados por intensidad, no puntos sobre casas, sobre un mapa base de OpenStreetMap (Leaflet) con el acercamiento limitado a calles y localidades, nunca a viviendas. Para producción se recomienda un proveedor de teselas con acuerdo de uso, manteniendo la atribución a OpenStreetMap. Una capa a la vez. El mapa del panel incluye una línea de tiempo para recorrer los últimos 12 meses y un mapa de calor de reportes, que muestra calor solo donde hay 3 o más registros. El mapa público (mapa ciudadano) tiene cinco capas, una a la vez: mascotas perdidas y avistadas por sector (con sus posibles coincidencias como sugerencia), animales en adopción por el sector donde están, operativos publicados en su lugar de referencia (fecha, servicios y cupos), perros comunitarios en su lugar de referencia (con la fecha de su última revisión registrada y «Informar una novedad») y resultados de la comuna por sector (atenciones, operativos, adopciones y reencuentros de los últimos 12 meses). Cada marca agrupa lo que comparte ubicación aproximada y abre una ficha lateral con enlaces a cada ficha. Ningún reporte es público, ni domicilios, contactos o cuidadores.

| Capa | Pregunta | Medida por sector |
| --- | --- | --- |
| Prioridad | ¿Dónde conviene el próximo operativo? | Alta / Media / Baja |
| Solicitudes pendientes | ¿Dónde hay más demanda sin atender? | Solicitudes abiertas por servicio |
| Días sin intervención | ¿Qué sectores llevan más tiempo sin operativo? | Días desde el último operativo cerrado |
| Reportes | ¿Dónde se concentran los problemas? | Reportes en el período |
| Perdidas / encontradas | ¿Dónde se pierden animales? | Publicaciones y % resueltas |
| Atenciones | ¿Dónde ya llegó el municipio? | Esterilizaciones, vacunas, microchips |
| Adopciones | ¿De dónde vienen los adoptantes? | Adopciones en el período |
| Operativos | ¿Dónde y cuándo se ha intervenido? | Operativos y asistencia |

Filtros: especie y período. Clic en sector → ficha lateral con cifras, demanda por servicio, último operativo, prioridad con motivos y Crear operativo.

- **Normalizar:** con población o viviendas por sector, mostrar tasas por cada 100 viviendas además de totales.
- **Sectores configurables:** lista y límites a validar con el municipio; zonas aproximadas, sin GIS.

## 12. Priorización

Índice transparente; el funcionario siempre ve por qué y siempre decide.

```
P(sector) = 0,40·D + 0,25·R + 0,20·T + 0,15·E
```

D = demanda pendiente; R = reportes últimos 90 días; T = tiempo desde la última intervención; E = demanda no cubierta del último operativo. Cada factor se normaliza 0–1 entre sectores con mínimo y máximo: (valor − mínimo) / (máximo − mínimo). Pesos configurables; en Configuración, un simulador muestra en vivo cómo cambia el orden de los sectores antes de guardar.

Niveles: Alta si P ≥ 0,66; Media entre 0,33 y 0,66; Baja bajo 0,33. Siempre color + texto. Recomendación según nivel: alta, "Se recomienda evaluar un operativo territorial con énfasis en [servicio]"; media, "Se recomienda mantener seguimiento"; baja, "Sin acción recomendada por ahora".

Tarjeta de recomendación:

> **La Huerta — Prioridad alta**
> **Por qué:** [N] solicitudes de esterilización pendientes, [N] reportes en 90 días, [N] días desde el último operativo.
> **Recomendación:** Se recomienda evaluar un operativo territorial con énfasis en esterilización.
> [Crear operativo] [Ver sector] [Marcar como evaluado]

Lenguaje: "se recomienda evaluar", nunca "debe"; mostrar las cifras; advertir pocos datos ("basado en 6 registros, confianza baja"). Marcar como evaluado registra la decisión (auditable).

## 13. Machine Learning

| Uso | Decisión que apoya | Datos necesarios | Etapa |
| --- | --- | --- | --- |
| Coincidencia por atributos | ¿Este animal encontrado es el que alguien busca? | Reglas sobre especie, sector, fecha, color | MVP (reglas) |
| Coincidencia por fotografía | Igual, con más precisión | Embeddings de modelo preentrenado | Etapa 2, experimental |
| Clasificación de reportes | ¿Qué tipo de situación es? | Texto; revisión humana siempre | Etapa 2 |
| Predicción de inasistencia | ¿Cuántos cupos extra asignar? | 10–15 operativos con asistencia | Etapa 2 |
| Pronóstico de demanda | ¿Qué sector tendrá más demanda? | 12–24 meses de datos reales | Etapa 3 |
| Ajuste de pesos | ¿El índice predice bien? | Historial de recomendaciones y resultados | Etapa 3 |

Descartados: reconocimiento de razas, chatbot general, reconocimiento facial de mascotas.

## 14. Público vs privado

| Información | Pública | Interna | Notas |
| --- | --- | --- | --- |
| Mascotas perdidas/encontradas | Foto, descripción, sector, fecha; en el mapa, por sector | Nombre y contacto | Contacto vía plataforma |
| Perros comunitarios | Ficha, foto, lugar de referencia, fecha de la última revisión, si hay un cuidador autorizado e historial de controles y atenciones | Quiénes son los cuidadores, novedades, notas internas | Nunca un domicilio |
| Adopción | Datos del animal | Postulaciones | |
| Operativos | Sector, lugar, fecha, servicios, cupos disponibles | Inscritos y asistentes | Terreno ve solo su operativo |
| Avisos | Todo | Autor y borradores | |
| Solicitudes de servicio | No | Todo | Ciudadano ve las suyas con RUT + código |
| Reportes y denuncias | No, de ningún tipo | Contenido, sector, mapa de calor | Identidad del denunciante restringida |
| Atenciones | Totales por sector | Detalle por animal | |
| Estadísticas por sector | Opcional, agregadas | Todo | Ocultar cifras menores a 5 |
| Prioridad por sector | No | Sí | Herramienta interna |
| Dirección exacta | Nunca | No se solicita | Ubicación mínima: sector |

Validar con jurídica: Ley 19.628, Ley 21.719 (datos personales) y Ley 21.020 (tenencia responsable).

## 15. MVP

Portal ciudadano: inicio con 5 acciones y retrato de la comuna; perdidas/encontradas con contacto protegido y coincidencias por atributos; adopción y postulación; operativos y cupos con lista de espera; solicitud de servicio sin operativo; reportes; Mis solicitudes; avisos por sector con vencimiento; sección «Perros comunitarios» con sus fichas; mapa público de perdidas y avistadas por sector y de perros comunitarios; propuesta de adopción por vecinos; subida de fotos; imagen para compartir de cada aviso.

Panel municipal: resumen «Para hoy» con acciones de un clic, minuta imprimible y correo semanal (simulado en el prototipo); mapa por sectores con línea de tiempo de 12 meses y mapa de calor de reportes, y ficha de sector; prioridad por reglas con tarjeta explicada; ciclo completo de operativos; vista móvil de terreno; bandejas; Inteligencia con pérdidas por mes y alerta preventiva antes de enero y septiembre (propone un aviso en borrador para los sectores con más pérdidas ese mes el año anterior); avisos; configuración de sectores, servicios, usuarios y pesos, con simulador de pesos; revisión de adopciones propuestas por vecinos; datos simulados identificados.

## 16. Segunda etapa

SMS/WhatsApp; coincidencia por fotografía; clasificación de reportes; predicción de inasistencia; organizaciones colaboradoras; ClaveÚnica; exportación de reportes (además de la minuta); envío real de correos; estadísticas públicas; seguimiento post-adopción; plantilla multi-municipio (Curepto, Vichuquén); ML de demanda (etapa 3).

Fuera de alcance: app nativa, GPS en tiempo real, pagos, red social, marketplace, historial veterinario completo, réplica del Registro Nacional de Mascotas (no asumir que existe una API pública).

## 17. Demostrativo vs real

| Componente | Prototipo | Con datos reales |
| --- | --- | --- |
| Modelo de datos y flujos | Reales | Base definitiva |
| Índice de prioridad y coincidencias | Lógica real, datos simulados | Se mantienen |
| Registros | Simulados por script | Carga real o histórico |
| Sectores | Aproximados | Lista oficial |
| Población por sector | Ausente o estimada | Censo o datos municipales |
| Cifras del escenario | Guionizadas | Dependen de los datos |
| Notificaciones | Simuladas en pantalla | Requieren proveedor |
| Identidad visual | Hualañé | Configurable por municipio |
| Usuarios | Cuentas demo | Cuentas reales con roles |

Reglas: franja "Datos de demostración" siempre visible; datos simulados separados y borrables de una vez; ninguna cifra simulada se presenta como diagnóstico de Hualañé.
