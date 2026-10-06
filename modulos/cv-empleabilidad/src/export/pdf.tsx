import { Document, Page, pdf, StyleSheet, Text, View } from '@react-pdf/renderer'
import type { ReactNode } from 'react'
import type { CvData } from '../services/types'
import { COLOR, contacto, type DisenoId } from './comun'

/**
 * PDF con texto real (seleccionable, legible por ATS) para cada diseño.
 * Replica las plantillas HTML de src/templates/. Helvetica: fuente estándar
 * del PDF, con soporte para tildes y ñ.
 */

const base = StyleSheet.create({
  page: { fontFamily: 'Helvetica', fontSize: 10, lineHeight: 1.4, color: COLOR.grisTexto },
  bold: { fontFamily: 'Helvetica-Bold' },
  periodo: { fontSize: 9, color: COLOR.grisMedio },
  vineta: { flexDirection: 'row', marginTop: 2 },
  vinetaPunto: { width: 10 },
  vinetaTexto: { flex: 1 },
  item: { marginBottom: 8 },
  itemHeader: { flexDirection: 'row', justifyContent: 'space-between', gap: 8 },
})

function Vinetas({ items }: { items: string[] }) {
  return (
    <>
      {items.map((l, i) => (
        <View key={i} style={base.vineta}>
          <Text style={base.vinetaPunto}>•</Text>
          <Text style={base.vinetaTexto}>{l}</Text>
        </View>
      ))}
    </>
  )
}

function Experiencias({ cv }: { cv: CvData }) {
  return (
    <>
      {cv.experiencia.map((e, i) => (
        <View key={i} style={base.item} wrap={false}>
          <View style={base.itemHeader}>
            <Text style={{ flex: 1 }}>
              <Text style={base.bold}>{e.cargo}</Text>
              {e.organizacion ? ` · ${e.organizacion}` : ''}
            </Text>
            {e.periodo ? <Text style={base.periodo}>{e.periodo}</Text> : null}
          </View>
          <Vinetas items={e.logros} />
        </View>
      ))}
    </>
  )
}

function Educaciones({ cv }: { cv: CvData }) {
  return (
    <>
      {cv.educacion.map((e, i) => (
        <View key={i} style={base.item} wrap={false}>
          <View style={base.itemHeader}>
            <Text style={[base.bold, { flex: 1 }]}>{e.titulo}</Text>
            {e.periodo ? <Text style={base.periodo}>{e.periodo}</Text> : null}
          </View>
          {e.institucion ? <Text>{e.institucion}</Text> : null}
        </View>
      ))}
    </>
  )
}

// ---------- Clásico ----------

const clasico = StyleSheet.create({
  page: { paddingVertical: 48, paddingHorizontal: 56 },
  header: { alignItems: 'center', marginBottom: 18 },
  // lineHeight explícito: el heredado se calcula con el fontSize de la página y se superpone.
  nombre: { fontFamily: 'Helvetica-Bold', fontSize: 22, lineHeight: 1.2, color: COLOR.azul },
  titular: { fontFamily: 'Helvetica-Bold', fontSize: 11, lineHeight: 1.3, marginTop: 2 },
  contacto: { fontSize: 9, marginTop: 6 },
  seccion: { marginBottom: 12 },
  seccionTitulo: {
    fontFamily: 'Helvetica-Bold',
    fontSize: 10,
    letterSpacing: 1.2,
    color: COLOR.azul,
    borderBottomWidth: 1.2,
    borderBottomColor: COLOR.azul,
    paddingBottom: 3,
    marginBottom: 7,
  },
})

function SeccionClasico({ titulo, children }: { titulo: string; children: ReactNode }) {
  return (
    <View style={clasico.seccion}>
      <Text style={clasico.seccionTitulo}>{titulo.toUpperCase()}</Text>
      {children}
    </View>
  )
}

function ClasicoPdf({ cv }: { cv: CvData }) {
  return (
    <Page size="A4" style={[base.page, clasico.page]}>
      <View style={clasico.header}>
        <Text style={clasico.nombre}>{cv.nombre}</Text>
        <Text style={clasico.titular}>{cv.titular}</Text>
        <Text style={clasico.contacto}>{contacto(cv).join('   ·   ')}</Text>
      </View>
      <SeccionClasico titulo="Perfil profesional">
        <Text>{cv.perfil}</Text>
      </SeccionClasico>
      {cv.experiencia.length > 0 && (
        <SeccionClasico titulo="Experiencia laboral">
          <Experiencias cv={cv} />
        </SeccionClasico>
      )}
      {cv.educacion.length > 0 && (
        <SeccionClasico titulo="Formación">
          <Educaciones cv={cv} />
        </SeccionClasico>
      )}
      {cv.habilidades.length > 0 && (
        <SeccionClasico titulo="Habilidades">
          <Text>{cv.habilidades.join(' · ')}</Text>
        </SeccionClasico>
      )}
      <SeccionClasico titulo="Idiomas">
        <Text>{cv.idiomas.join(' · ')}</Text>
      </SeccionClasico>
    </Page>
  )
}

// ---------- Moderno ----------

const SIDE = 175
const moderno = StyleSheet.create({
  page: { flexDirection: 'row' },
  fondo: { position: 'absolute', top: 0, left: 0, bottom: 0, width: SIDE, backgroundColor: COLOR.azul },
  side: { width: SIDE, paddingVertical: 40, paddingHorizontal: 20, color: COLOR.marfil },
  nombre: { fontFamily: 'Helvetica-Bold', fontSize: 18, color: '#FFFFFF', lineHeight: 1.15 },
  titular: { marginTop: 6 },
  sideTitulo: {
    fontFamily: 'Helvetica-Bold',
    fontSize: 9,
    letterSpacing: 1.2,
    color: '#FFFFFF',
    marginTop: 20,
    marginBottom: 5,
    paddingTop: 8,
    borderTopWidth: 0.6,
    borderTopColor: '#8FA5B6',
  },
  sideItem: { fontSize: 9, marginBottom: 3 },
  main: { flex: 1, paddingVertical: 40, paddingHorizontal: 30 },
  mainSeccion: { marginBottom: 14 },
  mainTituloFila: { flexDirection: 'row', alignItems: 'center', marginBottom: 7 },
  mainTituloBarra: { width: 18, height: 3, backgroundColor: COLOR.verde, marginRight: 8 },
  mainTitulo: { fontFamily: 'Helvetica-Bold', fontSize: 13, lineHeight: 1.2, color: COLOR.azul },
})

function SeccionModerno({ titulo, children }: { titulo: string; children: ReactNode }) {
  return (
    <View style={moderno.mainSeccion}>
      <View style={moderno.mainTituloFila}>
        <View style={moderno.mainTituloBarra} />
        <Text style={moderno.mainTitulo}>{titulo}</Text>
      </View>
      {children}
    </View>
  )
}

function ListaLateral({ titulo, items }: { titulo: string; items: string[] }) {
  if (items.length === 0) return null
  return (
    <>
      <Text style={moderno.sideTitulo}>{titulo.toUpperCase()}</Text>
      {items.map((x) => (
        <Text key={x} style={moderno.sideItem}>
          {x}
        </Text>
      ))}
    </>
  )
}

function ModernoPdf({ cv }: { cv: CvData }) {
  return (
    <Page size="A4" style={[base.page, moderno.page]}>
      <View style={moderno.fondo} fixed />
      <View style={moderno.side}>
        <Text style={moderno.nombre}>{cv.nombre}</Text>
        <Text style={moderno.titular}>{cv.titular}</Text>
        <ListaLateral titulo="Contacto" items={contacto(cv)} />
        <ListaLateral titulo="Habilidades" items={cv.habilidades} />
        <ListaLateral titulo="Idiomas" items={cv.idiomas} />
      </View>
      <View style={moderno.main}>
        <SeccionModerno titulo="Perfil">
          <Text>{cv.perfil}</Text>
        </SeccionModerno>
        {cv.experiencia.length > 0 && (
          <SeccionModerno titulo="Experiencia">
            <Experiencias cv={cv} />
          </SeccionModerno>
        )}
        {cv.educacion.length > 0 && (
          <SeccionModerno titulo="Formación">
            <Educaciones cv={cv} />
          </SeccionModerno>
        )}
      </View>
    </Page>
  )
}

// ---------- Compacto ----------

const compacto = StyleSheet.create({
  page: { paddingVertical: 36, paddingHorizontal: 44, fontSize: 9.5 },
  header: { flexDirection: 'row', justifyContent: 'space-between', borderLeftWidth: 5, borderLeftColor: COLOR.verde, paddingLeft: 12, marginBottom: 12 },
  nombre: { fontFamily: 'Helvetica-Bold', fontSize: 19, lineHeight: 1.2 },
  titular: { color: COLOR.verde, fontFamily: 'Helvetica-Bold' },
  contacto: { fontSize: 9, textAlign: 'right' },
  perfil: { backgroundColor: COLOR.grisClaro, padding: 9, borderRadius: 3, marginBottom: 10 },
  fila: { flexDirection: 'row', paddingVertical: 8, borderTopWidth: 0.8, borderTopColor: COLOR.grisClaro },
  filaTitulo: { width: 90, fontFamily: 'Helvetica-Bold', fontSize: 8.5, letterSpacing: 1, color: COLOR.verde },
  filaCuerpo: { flex: 1 },
})

function FilaCompacto({ titulo, children }: { titulo: string; children: ReactNode }) {
  return (
    <View style={compacto.fila}>
      <Text style={compacto.filaTitulo}>{titulo.toUpperCase()}</Text>
      <View style={compacto.filaCuerpo}>{children}</View>
    </View>
  )
}

function CompactoPdf({ cv }: { cv: CvData }) {
  return (
    <Page size="A4" style={[base.page, compacto.page]}>
      <View style={compacto.header}>
        <View>
          <Text style={compacto.nombre}>{cv.nombre}</Text>
          <Text style={compacto.titular}>{cv.titular}</Text>
        </View>
        <View>
          {contacto(cv).map((c) => (
            <Text key={c} style={compacto.contacto}>
              {c}
            </Text>
          ))}
        </View>
      </View>
      <Text style={compacto.perfil}>{cv.perfil}</Text>
      {cv.experiencia.length > 0 && (
        <FilaCompacto titulo="Experiencia">
          <Experiencias cv={cv} />
        </FilaCompacto>
      )}
      {cv.educacion.length > 0 && (
        <FilaCompacto titulo="Formación">
          <Educaciones cv={cv} />
        </FilaCompacto>
      )}
      {cv.habilidades.length > 0 && (
        <FilaCompacto titulo="Habilidades">
          <Text>{cv.habilidades.join(' · ')}</Text>
        </FilaCompacto>
      )}
      <FilaCompacto titulo="Idiomas">
        <Text>{cv.idiomas.join(' · ')}</Text>
      </FilaCompacto>
    </Page>
  )
}

const PAGINAS: Record<DisenoId, (p: { cv: CvData }) => ReactNode> = {
  clasico: ClasicoPdf,
  moderno: ModernoPdf,
  compacto: CompactoPdf,
}

export function CvPdfDocument({ cv, diseno }: { cv: CvData; diseno: DisenoId }) {
  const Pagina = PAGINAS[diseno]
  return (
    <Document title={`CV ${cv.nombre}`} author={cv.nombre} language="es-CL">
      <Pagina cv={cv} />
    </Document>
  )
}

// Función junto al componente a propósito: este archivo no participa de fast refresh.
// eslint-disable-next-line react-refresh/only-export-components
export function renderPdf(cv: CvData, diseno: DisenoId): Promise<Blob> {
  return pdf(<CvPdfDocument cv={cv} diseno={diseno} />).toBlob()
}
