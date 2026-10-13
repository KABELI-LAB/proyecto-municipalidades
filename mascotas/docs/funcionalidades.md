# Funcionalidades construidas

Lo que el prototipo ya hace, a octubre de 2026. El diseño completo está en
[concepto.md](concepto.md); aquí se describe solo lo construido. Al final hay
una lista de lo que el concepto define pero todavía no está construido.

La plataforma tiene tres partes:

- **Portal ciudadano** (`/`): público y sin cuenta. Pensado primero para celular.
- **Panel municipal** (`/panel`): con usuario y contraseña. Pensado para escritorio.
- **Vista de terreno** (`/terreno`): para celular, se usa el día del operativo.

---

## 1. Reglas que valen en toda la plataforma

- **Sin cuenta para la ciudadanía.** Cada trámite termina con un código de
  seguimiento (formato TR-NNNN). Con el RUT y ese código la persona consulta
  todos sus trámites.
- **RUT solo donde hace falta.** Obligatorio en cupos, adopción (postular y
  dar) y mascota perdida; opcional al solicitar un servicio; no se pide en SOS,
  mascota avistada ni novedad de perro comunitario (salvo el cuidador). Lo
  hecho sin RUT no aparece en Mis solicitudes.
- **Ubicación mínima: el sector.** La persona elige su localidad de una lista
  cerrada y de ella se deduce el sector. Nunca se pide ni se muestra una
  dirección exacta.
- **Contacto protegido.** Los mensajes entre vecinos pasan por la plataforma.
  Nunca se muestran teléfonos ni correos.
- **Solo animales con foto.** Fichas, listas, mapa público y bandejas muestran
  y cuentan únicamente los animales que tienen foto.
- **Municipio configurable.** El nombre, los sectores y la identidad vienen de
  configuración, no del código.
- **Datos de demostración.** Toda vista con datos simulados muestra la franja
  «Datos de demostración». Esos datos están separados de los reales y se
  pueden cargar o borrar de una vez.
- **Navegación.** Cada pantalla tiene un botón «Inicio» y otro «Volver». Las
  bandejas vuelven a la vista de Bandejas.
- **Notificaciones simuladas.** Los avisos por correo o SMS se registran en la
  base de datos, pero no se envían.
- **Accesibilidad e interfaz.** Botones de al menos 44 px de alto, carga con
  bloques de esqueleto, transiciones suaves y respeto de la preferencia de
  movimiento reducido. Los estados siempre llevan color, texto e ícono.

---

## 2. Portal ciudadano

### Inicio (`/`)

Pocas palabras y ningún enlace repetido. Se ordena así:

1. **Bienvenida y collage:** el título y las fotos de animales de la comuna,
   cada una con su frase («Busca hogar · Bruno», «Se perdió en El Buche») y su
   enlace a la ficha.
2. **Tres bloques principales**, con huellas y corazones decorativos y sin
   subrayados (los enlaces de la web de vecinos no se subrayan):
   - **Operativos**: todo el bloque lleva a `/operativos`. «Fechas, servicios y cupos.» y el
     distintivo «Cupos disponibles» si quedan cupos.
   - **Mascotas perdidas y avistadas**: el título lleva a `/mascotas` y dos
     accesos directos abren el formulario: «Perdí mi mascota» y «Vi una
     mascota».
   - **SOS Mascotas**: todo el bloque lleva a `/reportar`. «¿Vio un animal que necesita ayuda?». La
     advertencia de que no garantiza atención inmediata aparece al enviar el
     reporte.
3. **Otras funciones:** Adopción (adoptar o dar en adopción), Solicitar un
   servicio y Perros comunitarios.
4. **Tres tarjetas:** el mapa por sector (con el posible reencuentro), el
   retrato de la comuna y los avisos municipales.

La barra superior lleva solo la firma institucional y «Mis solicitudes». El
pie de página lleva solo la institución y su sitio web: las secciones se abren
desde la portada, y cada página tiene «Volver» e «Inicio».

### Operativos (`/operativos`)

- **Listado:** encabezado de una sola línea («Operativos de tenencia
  responsable», filtro por sector y acceso a responder una invitación, que en
  celular se omite porque «Mis solicitudes» está en la barra superior), para
  que los operativos se vean sin desplazarse. Cada operativo es una tarjeta con la
  fecha como hoja de calendario, su estado (inscripciones abiertas, sin cupos:
  lista de espera, o inscripciones cerradas; siempre con ícono y texto),
  horario, lugar y localidad, servicios con sus cupos y «Ver operativo e
  inscribirme» (o «Ver operativo» si ya no admite inscripciones). Se listan
  los próximos con inscripciones abiertas o cerradas. Sin operativos, un
  mensaje que invita a «Solicitar un servicio». Mientras carga, bloques de
  esqueleto.
- **Inscripción:** la página muestra solo el formulario, centrado. Los cupos
  están en las tarjetas de servicio del paso 1; la fecha, el horario, el lugar,
  los requisitos y el límite por hogar, en el resumen del paso «Confirmar». Si
  el operativo ya no admite inscripciones, lo dice (cerradas, en curso o
  finalizado) y ofrece «Solicitar un servicio». Incluye fotos cuando existen.
- **Inscribirse en tres pasos:** «Servicio y mascota» (servicios como tarjetas
  con ícono, frase breve y cupos; un servicio por inscripción), «Sus datos» y
  «Confirmar», con el resumen agrupado y «Editar» para volver a cada bloque.
  Valida cada paso al continuar, conserva lo escrito al volver y no envía dos
  veces aunque se pulse dos veces. Respeta el límite por hogar; si no quedan
  cupos, la persona pasa a la lista de espera por orden de llegada.

### Solicitar un servicio (`/servicio`)

- Esterilización, vacuna, microchip u otros servicios configurados, aunque no
  haya un operativo programado.
- La solicitud registra la demanda del sector. Cuando se publique un operativo
  cerca, la persona recibe una invitación prioritaria.

### SOS Mascotas (`/reportar`)

Reemplaza a «Reportar una situación». Se abre desde el bloque destacado de la
portada (ícono de salvavidas y acento terracota). Al enviar, el resultado
aclara que no garantiza atención inmediata y que, si hay peligro para una
persona, se llame a los servicios de emergencia.

- **Seis categorías:** animal herido o enfermo; posible maltrato o abandono;
  animal agresivo o en peligro; perro comunitario que necesita atención;
  animal atrapado o en una situación de riesgo; otra situación de bienestar
  animal. Los tipos anteriores (abandono, jauría, atropello, maltrato) quedan
  inactivos: ya no se ofrecen, pero siguen clasificando los reportes antiguos.
- **Sin pregunta de urgencia:** era subjetiva (cualquiera elegiría «urgente»).
  El equipo revisa primero lo que lleva más tiempo esperando.
- **Datos del caso:** localidad (de ella se deduce el sector), especie,
  cantidad, si el animal sigue en el lugar, descripción y una **foto
  opcional**.
- **Foto privada:** el navegador la reduce antes de enviarla. El servidor
  verifica que sea una imagen, la vuelve a codificar sin metadatos (incluida
  la ubicación GPS) y la guarda fuera de la carpeta pública, en `ALMACEN_DIR`.
  Solo se entrega por `/panel/reportes/[id]/foto` a quien tiene permiso de ver
  reportes.
- **Seguimiento:** código TR, confirmación que aclara que «recibido» no
  significa «atendido», y estado en Mis solicitudes (Recibido, En revisión o
  Cerrado, con la fecha de cada cambio).
- Los reportes nunca se publican: solo los ve el equipo municipal, y el panel
  no muestra la identidad de quien reporta.

### Mascotas perdidas y avistadas (`/mascotas`)

- **Lista** de avisos vigentes con foto, con filtros por tipo, especie y sector.
- **Tres acciones:** «Reportar mascota perdida» (`/mascotas/publicar?tipo=PERDIDA`),
  «Informar mascota avistada» (`?tipo=ENCONTRADA`) y «Ver avisos».
- **El aviso pide:**
  - especie, color, tamaño, sexo, collar, microchip y señas
  - fecha y localidad (nunca la dirección)
  - una foto opcional, que se guarda sin metadatos fuera de la carpeta
    pública y se ve solo mientras el aviso está vigente y no fue ocultado
  - en un avistamiento, dónde está el animal ahora: con quien informa,
    retenido en otro lugar (veterinaria, local, vecino) o solo visto. Si está
    resguardado, se indica la localidad (el aviso muestra la localidad y su
    sector) y qué lugar es en pocas palabras, sin dirección ni teléfonos

  El aviso queda recibido: se publica en el portal (y en Instagram) cuando el
  municipio lo acepta. El portal muestra solo los avisos con foto; los demás
  igual buscan coincidencias.
- **Avistamiento vinculado.** Desde un aviso de pérdida, «Informar que la vi»
  abre el formulario vinculado a ese aviso. Queda como posible coincidencia
  (nunca como confirmación), se avisa a quien la perdió sin exponer contactos y
  aparece en el aviso como «Avistamientos informados para este aviso».
- **Coincidencias automáticas.** Al publicar, la plataforma compara el aviso
  con los avisos opuestos abiertos y muestra hasta 3 posibles coincidencias.
  Usa reglas explicables:
  - misma especie
  - mismo sector o localidades a menos de 10 km
  - una ventana de 15 días
  - color y tamaño compatibles
  - collar y señas en común

  Siempre se presentan como «posible coincidencia» y nunca se afirma que es el
  mismo animal. Las tarjetas muestran la marca «Posible coincidencia: revise
  el aviso».
- **Ficha del aviso.** Incluye:
  - foto, rasgos, sector y fecha
  - posibles coincidencias
  - mensaje protegido a quien publicó
  - botón para reportar un aviso inadecuado

### Adopción (`/adoptar`)

- Fichas de los animales disponibles, con fotos y estos datos:
  - nombre, especie, edad aproximada, tamaño y sexo
  - esterilización, vacunas y microchip
  - carácter y convivencia
- **Postular a una adopción.** Pide contacto, sector, tipo de vivienda,
  experiencia previa y otros animales en el hogar. No se puede postular dos
  veces al mismo animal.
- **El municipio no da en adopción por ahora:** solo se postula a animales que
  publica un vecino; la postulación le llega a esa persona, que elige y se pone
  en contacto. El panel no gestiona postulaciones.

### Dar en adopción (`/adoptar/dar`)

Distinto de «Quiero adoptar»: es para proponer a un animal que necesita hogar.
Se abre desde el catálogo de adopción («Adopción» en la portada).

- **Formulario en 4 pasos:** el animal (1 a 3 fotos, nombre o apodo; especie,
  sexo y tamaño en listas; edad escrita en años o meses, o «No se sabe»);
  salud y cómo es (esterilización, vacunas y microchip, más un solo texto
  opcional con sugerencias: carácter, convivencia, salud y qué hogar le
  vendría bien); quien propone (relación con el animal, datos de contacto,
  localidad donde está y declaración de autorización); revisión.
- **«No sé» en todo antecedente:** se guarda como dato desconocido, no se
  inventa.
- **Revisión municipal antes de publicar:** la propuesta no aparece en el
  catálogo ni sus fotos son públicas hasta que el municipio la aprueba.
- **Duplicados:** se rechaza la misma foto en otra propuesta abierta y el mismo
  animal (nombre y especie) propuesto dos veces por la misma persona.
- **Correcciones:** si el municipio las pide, la persona entra desde Mis
  solicitudes, escribe su RUT y corrige el mismo formulario ya completado. Si
  sube fotos nuevas, reemplazan a las anteriores.
- **Cierre:** desde Mis solicitudes puede retirar la propuesta o avisar que el
  animal encontró hogar por otra vía (no cuenta como adopción de la
  plataforma). Si hay una adopción en curso, debe coordinarlo con el municipio.
- **Postulaciones sin el municipio:** las postulaciones a su animal le llegan a
  ella, no al municipio. En Mis solicitudes ve cada postulación (nombre,
  localidad, vivienda, experiencia, otros animales) sin teléfono ni correo, y
  puede elegir o descartar.
- **Contacto con consentimiento:** quien postula acepta, al postular, que se
  comparta su contacto si le eligen. Al elegir, cada uno ve el contacto del
  otro (ella en la postulación; la persona elegida en su propia postulación).
  Solo una persona elegida a la vez.
- **Cierre de la adopción:** ella registra si se concretó (la ficha pasa a
  Adoptado, se cierran las demás postulaciones y se crean los compromisos de
  esterilización o microchip a nombre de quien adopta) o si no se concretó
  (la ficha vuelve a estar disponible).

### Perros comunitarios (`/comunitarios`)

Siempre a cargo de vecinos; el municipio no interviene. El fin es que sean públicos.

- Lista con filtro por sector y botón **«Registrar un perro»**.
- **Registrar** (`/comunitarios/registrar`): foto obligatoria, apodo, sexo,
  tamaño, color y señas; lugar público de referencia (nunca un domicilio);
  esterilización, vacunas y microchip con «No sé»; datos de quien registra
  (RUT obligatorio). **Se publica de inmediato** y quien lo registra queda como
  su **cuidador**, con un código TR que es su credencial.
- **Gestión por su cuidador** (en Mis solicitudes, con su RUT y su código, o
  con el código que llega al correo): «Lo vi hoy» (queda como última revisión,
  visible en la ficha), actualizar la ficha (con foto nueva opcional), leer las
  novedades de los vecinos y marcarlas como vistas, y «Ya no está» (la ficha deja
  de mostrarse).
- **Seguimiento:** estado de actualización, fecha de la última revisión, fecha
  de la última actualización de los datos y si tiene un vecino que lo cuida, sin
  publicar quién es. Nunca afirma cómo está el perro hoy.
- **Hacerme cargo** (`/comunitarios/[id]/cuidar`): un perro sin cuidador (por
  ejemplo, los de la demostración) muestra este botón en vez de «Informar una
  novedad». Con nombre, RUT y contacto, el vecino queda como su cuidador y recibe
  su código. Si ya tiene cuidador, no se puede.
- **Informar una novedad** (`/comunitarios/[id]/novedad`, solo si tiene
  cuidador): está herido o enfermo, no está en su lugar, le falta agua o
  alimento, un dato que corregir u otra; sin RUT ni foto, con un teléfono o
  correo. **Le llega a su cuidador**, que no ve el contacto de quien informa. Lo
  urgente va por SOS Mascotas.

### Mapa de la comuna (`/mapa`)

Mapa ciudadano con cinco capas, una a la vez, elegidas con un selector simple
(en celular se desliza en una fila). La capa queda en la dirección
(`/mapa?capa=adopcion`) para compartirla.

| Capa | Qué muestra | Desde el mapa se abre |
| --- | --- | --- |
| Perdidas y avistadas | Avisos vigentes por sector, cuántos perdidos y avistados; marca «Posible coincidencia: revise el aviso» | Cada aviso y la lista del sector |
| Adopción | Animales publicados, por el sector donde están | Cada ficha de adopción |
| Operativos | Operativos publicados en su lugar de referencia: fecha, horario, servicios y cupos | Cada operativo; si no hay, «Solicitar un servicio» |
| Perros comunitarios | Perros en su lugar de referencia, con la fecha de su última revisión registrada | Cada ficha e «Informar una novedad» (SOS Mascotas) |
| Resultados | Por sector, últimos 12 meses: atenciones, operativos, adopciones y mascotas que volvieron a casa | — |

- **Sin marcas superpuestas:** una marca por sector o lugar de referencia (lo
  que comparte ubicación aproximada va junto); tamaño e intensidad según la
  cantidad; etiquetas que se acomodan para no taparse.
- **Ficha lateral:** al tocar una marca se ve lo que hay en ese lugar, con foto
  y enlace a cada ficha. Sin lugar elegido, la ficha lista todos los lugares:
  la misma información, accesible sin usar el mapa.
- **Sin datos:** cada capa explica qué pasa cuando no hay nada que mostrar y
  ofrece el siguiente paso (publicar un aviso, dar en adopción, solicitar un
  servicio).
- **Privacidad:** ubicaciones aproximadas (sector o lugar público), nunca
  domicilios, contactos, cuidadores ni reportes ciudadanos.

- **Mapa base:** OpenStreetMap; por privacidad, el acercamiento se limita a
  calles y localidades y nunca llega a las viviendas.

### Avisos (`/avisos`)

- Comunicaciones vigentes del municipio: operativos, cambios o cancelaciones,
  campañas, alertas e información general.
- Cada aviso indica los sectores a los que se dirige y su vencimiento. Un
  aviso vencido desaparece solo.

### Invitaciones prioritarias a operativos

**Hoy están apagadas** (`parametros.invitacionesPrioritarias: false` en
`config/municipios/<municipio>.json`): no se invita ni se retiene ningún cupo,
y «Solicitar un servicio» solo sirve para medir la necesidad de la comuna (la
demanda que usa la priorización de sectores). Un cupo liberado pasa al primero
de la lista de espera. Si se activan, funcionan así:

- Al publicar un operativo, quienes tenían una solicitud pendiente compatible
  (mismo servicio; mismo sector o a menos de 10 km del lugar) reciben una
  invitación, por prioridad (sector primero, luego antigüedad), hasta completar
  los cupos libres. Sin duplicados y respetando el límite por hogar.
- La invitación retiene el cupo mientras está abierta (no se ofrece al
  público), con un plazo de 48 horas que nunca pasa del día anterior al operativo.
- En **Mis solicitudes** la persona ve servicio, fecha, horario, lugar, plazo y
  condiciones, y responde **«Me interesa»** o **«No podré asistir»**. Confirmar
  interés no reserva: el sistema asigna el cupo si hay disponibilidad (si no,
  queda «Interés confirmado: esperando cupo» y se asigna cuando se libera uno).
- Si rechaza o vence el plazo, su solicitud vuelve a la demanda pendiente y se
  invita a la siguiente persona; si ya no hay a quién invitar, el cupo pasa a la
  lista de espera pública.
- Acceso visible: aviso en **Operativos** («¿Recibió una invitación
  prioritaria?») y en la portada, junto al próximo operativo.
- **Avisos para usted:** Mis solicitudes muestra las notificaciones que se le
  registraron (en el prototipo no salen correos ni SMS).
- Tarea programada `npm run invitaciones:vencer` para vencer las invitaciones
  sin respuesta e invitar a las siguientes (también se procesan al consultar
  Mis solicitudes y desde el panel con «Actualizar invitaciones»).
- En el panel, la ficha del operativo muestra los cupos retenidos y la tabla de
  invitaciones con prioridad, estado, envío, plazo, respuesta, asignación y
  motivo de cierre. Al iniciar o cancelar el operativo, las invitaciones
  abiertas se cierran y sus solicitudes vuelven a la demanda pendiente.

### Correos

Las notificaciones (cupo confirmado, se liberó un cupo, aviso publicado,
postulaciones, etc.) salen por correo cuando el envío está configurado
(`SMTP_*` de la casilla institucional o `BREVO_API_KEY`, más `CORREO_REMITENTE`;
vea `.env.example`). Quedan en cola y se envían después de guardar la acción;
cada una queda como enviada o fallida, con el motivo. Sin configuración, o con
datos de demostración, quedan simuladas y se ven en Mis solicitudes.

### Mis solicitudes (`/mis-solicitudes`)

- **Dos formas de entrar, sin registrarse:**
  - **«Recibir un código en mi correo»:** escribe solo su RUT y le enviamos un
    código de 6 dígitos al correo que dejó en sus trámites. Vence en 10
    minutos, sirve una vez y admite 5 intentos; se pueden pedir hasta 3 cada
    15 minutos. La respuesta es la misma exista o no el RUT. Sin envío de
    correos configurado, fuera de producción el código se muestra en pantalla
    (modo de prueba) y en producción la opción avisa que no está disponible.
  - **«Tengo un código de trámite»:** RUT y cualquier código propio.
- Ve todos sus trámites con su estado:
  - solicitudes de servicio
  - cupos (con el lugar en la lista de espera, si corresponde)
  - reportes
  - avisos de mascotas
  - postulaciones de adopción
- **Cancelar un cupo propio** («Cancelar mi cupo» o «Salir de la lista de
  espera»), con confirmación, mientras el operativo no haya comenzado. El
  lugar pasa a la primera persona de la lista de espera y la lista avanza.
- **Gestionar un aviso propio:**
  - **«Sigue vigente»:** extiende la publicación por 30 días más.
  - **«Mi mascota volvió»** o **«Ya volvió con su familia»:** pregunta si ayudó
    alguna coincidencia. Si la persona elige la coincidencia concreta, se
    cierran los dos avisos y se avisa a la otra persona.
  - **«Ya no aplica»:** retira el aviso.
- **Vigencia de los avisos.** A los 30 días se pide confirmar que el aviso
  sigue vigente. Si no hay respuesta en 7 días, se archiva.

---

## 3. Panel municipal

Se ingresa en `/panel/ingresar`. Pensado para funcionarios que quieren cosas
simples: sin menú de módulos, todo se alcanza desde una sola pantalla, como el
portal de vecinos. Cada acción vuelve a comprobar el permiso en el servidor.

### Roles

| Rol | Qué hace |
| --- | --- |
| Coordinación de tenencia responsable | Aprobar, operativos, reportes SOS, avisos y adopciones |
| Comunicaciones y moderación | Aprobar avisos de mascotas y gestionar avisos; ve operativos |
| Directivo | Lectura: lo que piden los vecinos, mapa y operativos, sin datos personales |
| Funcionario de terreno | Registrar la asistencia de los operativos que tenga asignados |
| Administración | Todo |

### Pantalla principal (`/panel`)

Tres bloques grandes, decorados con huellas y corazones como el portal, y cada
uno con su número de pendientes:

- **Por aprobar** → `/panel/aprobar`.
- **Operativos**, con el próximo operativo y los atajos «Crear operativo» y «Ver
  inscritos».
- **Reportes SOS** → `/panel/reportes`.

Debajo, una fila discreta: Lo que piden los vecinos, Mapa y Avisos a vecinos.

### Por aprobar (`/panel/aprobar`)

Un solo lugar para lo que envían los vecinos, en dos grupos:

- **Perdidos y avistados:** «Aprobar y publicar» (sale en el portal y en
  Instagram y se avisa a quien lo envió) o «No publicar».
- **Adopciones:** foto, datos, texto de quien la propone; «Aprobar y
  publicar», «Pedir cambios» o «No publicar», con un motivo que ve quien propuso.

Las páginas de detalle siguen disponibles por dirección para casos puntuales:
avisos publicados u ocultos (`/panel/publicaciones`, con «Ocultar» y «Marcar
como reencontrada»), propuestas publicadas (`/panel/propuestas`) y posibles
reencuentros (`/panel/coincidencias`).

### Reportes SOS (`/panel/reportes`)

- Muestran el contenido y el sector, nunca la identidad de quien reporta.
- Los pendientes se ordenan por antigüedad: primero lo que lleva más tiempo esperando.
- Muestran, si existe, la foto (por una ruta con
  permiso, sin caché compartida).
- Se pasan a revisión, se cierran (con aviso a quien reportó) o se reabren.
  Cada cambio queda en un historial con quién lo hizo y cuándo.
- Filtro por sector.

### Operativos (`/panel/operativos`)

- **Crear operativo** (`/panel/operativos/nuevo`): un formulario corto que
  publica de una vez. Lugar (el sector se deduce), fecha, horario, cupos por
  servicio ya sugeridos según lo que piden los vecinos del sector, y requisitos
  plegados. Al publicar se abren las inscripciones en el portal, sale en
  Instagram y queda un aviso en borrador.
- **Ficha del operativo:** ocupación de cupos, lista de espera, recordatorios,
  cerrar o reabrir inscripciones, iniciar, cerrar (calcula asistencia,
  atenciones y demanda no cubierta) o cancelar (avisa a los inscritos).
- **Registrar asistencia** (`/panel/operativos/[id]/asistencia`, con el
  operativo en curso): marcar quién llegó, registrar la atención (servicio,
  resultado y observaciones, con opción de deshacer) y atenciones espontáneas.
  Pensada para usarla en el teléfono.

### Lo que piden los vecinos (`/panel/vecinos`)

Un resumen simple de lo que hacen los vecinos en el portal, sin índices:

- Cuatro cifras: solicitudes de servicio pendientes, mascotas perdidas (y
  avistadas) en el portal, reportes SOS de los últimos 30 días y personas que
  quieren adoptar.
- **Qué servicios piden**, de más a menos, con barras.
- **Qué reportan por SOS** en 30 días, por tipo.
- **Dónde:** por sector, solicitudes, reportes y avisos de mascotas.

### Mapa por sectores (`/panel/mapa`)

- Mapa real de OpenStreetMap con una capa a la vez:
  - prioridad
  - solicitudes pendientes
  - días sin intervención
  - reportes
  - calor de reportes
  - perdidas y encontradas (con el porcentaje resuelto)
  - atenciones
  - adopciones
  - operativos
- **Línea de tiempo** para recorrer los últimos 12 meses mes a mes o ver el año
  completo.
- **Calor de reportes** en zonas de cerca de 1 km, solo donde hay 3 o más
  reportes.
- **Ficha lateral** del sector elegido, con nivel de prioridad, pendientes por
  servicio, último operativo y el botón «Crear operativo».

### Avisos a vecinos (`/panel/avisos`)

Un CRUD simple:

- **Nuevo aviso:** tipo, título, texto y hasta cuándo se ve. Se publica de una
  vez para toda la comuna.
- **Lista** de lo que está en el portal y de los borradores (por ejemplo, el
  que deja un operativo al publicarse), con «Publicar» y «Eliminar».
- **Editar** un aviso desde su ficha: texto, fechas, retirar del portal o
  eliminar.

### Instagram (sin ventana propia)

Aceptar o publicar un contenido en el panel lo publica en la web y en
Instagram a la vez; no hay una bandeja de redes aparte.

- **Qué sale a Instagram:** los avisos de mascotas perdidas y avistadas al
  aceptarlos, los operativos al publicarlos y las fichas de adopción al
  aprobarlas (si quien propuso autorizó publicarlas). Solo con foto (salvo los
  operativos). SOS Mascotas, reportes y contenido privado nunca salen.
- **Pieza gráfica** (1080 × 1350, JPEG): escudo negativo sobre azul
  institucional, firma del municipio desde la configuración, distintivo del
  tipo, la foto del animal solo recortada para encuadrar, título, datos y cómo
  participar o informar.
- **Texto:** tono municipal, solo datos existentes, enlace al portal (si
  `APP_URL` es pública) y tres etiquetas como máximo. Sin RUT, teléfonos,
  correos, domicilios ni cuidadores; sin afirmar vacunas, salud ni
  esterilización. En perdidas y avistadas lleva la misma
  información que el aviso del portal: nombre (en perdidas), especie y sexo
  («perra», «gata»), color, tamaño, collar y señas particulares (se omiten si
  parecen incluir un teléfono, correo o RUT). Nunca el microchip ni dónde está
  resguardado el animal.
- **Sin duplicados:** cada contenido se publica una vez; volver a mostrarlo no
  lo publica de nuevo. Si Instagram falla, el contenido igual queda en la web y
  su tarjeta muestra el error y «Reintentar en Instagram», que reutiliza el
  contenedor del intento anterior.
- **Bitácora:** cada publicación guarda quién la aceptó, los intentos, el id y
  el enlace de Instagram o el error.
- **Credenciales:** API oficial de publicación de contenido
  (`graph.instagram.com`), con variables de entorno del servidor (vea
  `.env.example`); nunca en el navegador ni en el repositorio. Sin ellas, se
  publica solo en la web. La imagen se entrega a Instagram por una dirección
  pública firmada, solo mientras se publica.

---

## 5. Tareas y comandos

| Comando | Qué hace |
| --- | --- |
| `npm run dev` | Levanta el sitio en http://localhost:3000 |
| `npm run demo:cargar` | Carga o recarga los datos de demostración (borra lo creado a mano) |
| `npm run demo:borrar` | Borra todos los datos de demostración de una vez |
| `npm run publicaciones:vigencia` | Pide confirmar vigencia a los 30 días y archiva sin respuesta a los 7 |
| `npm run invitaciones:vencer` | Vence las invitaciones prioritarias sin respuesta e invita a la siguiente persona |
| `npm test` | Corre las pruebas automáticas |

En la página `/muestra` se ven los componentes del sistema de diseño.

---

## 6. Definido en el concepto, pero aún no construido

- **Imagen de cada aviso en formato de historia de Instagram** (hoy solo la
  pieza 4:5 que se publica en Instagram).
- **Botón para compartir avisos a WhatsApp y redes.**
- **Envío real de correos y SMS.** Hoy las notificaciones se registran, pero no
  se envían.
- **Filtros por período y especie en el panel.**
- **Seguimiento de la adopción a los 30 días.**
- **Segunda etapa** (sección 16 del concepto): comparación de fotografías,
  organizaciones colaboradoras, mensajes por WhatsApp a inscritos y
  sobreasignación según inasistencias.
