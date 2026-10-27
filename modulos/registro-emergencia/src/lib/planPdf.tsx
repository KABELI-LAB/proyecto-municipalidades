/**
 * PDF del plan familiar de emergencia (R3) con la tarjeta recortable.
 * Se importa bajo demanda desde descargas.ts. Fuente Helvetica (incluida en
 * react-pdf, cubre los acentos del español).
 */
// No es un componente de pantalla (se carga bajo demanda): Fast Refresh no aplica.
/* eslint-disable react-refresh/only-export-components */
import { Document, Image, Page, pdf, StyleSheet, Text, View } from '@react-pdf/renderer'
import type { MiHogar } from '../../shared/contrato.ts'
import { fechaCorta, fechaTabla } from '../../shared/fechas.ts'
import { NIVELES } from '../../shared/incentivos.ts'
import { COLORES } from './descargas'

const st = StyleSheet.create({
  pagina: { padding: 40, fontFamily: 'Helvetica', fontSize: 11, color: COLORES.texto, lineHeight: 1.4 },
  cabecera: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 18 },
  escudo: { height: 44 },
  titulo: { fontSize: 20, fontFamily: 'Helvetica-Bold', color: COLORES.blue700, lineHeight: 1.15 },
  subtitulo: { fontSize: 10, color: COLORES.neutral600 },
  tarjeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: 323,
    height: 204,
    padding: 16,
    borderRadius: 14,
    backgroundColor: COLORES.blue700,
    color: '#fff',
    marginBottom: 6,
  },
  tarjetaNombre: { fontSize: 15, fontFamily: 'Helvetica-Bold', marginTop: 10, lineHeight: 1.15 },
  tarjetaDato: { fontSize: 9, marginTop: 3 },
  codigo: { fontSize: 14, fontFamily: 'Courier-Bold', marginTop: 14 },
  nivel: {
    alignSelf: 'flex-start',
    marginTop: 6,
    paddingVertical: 2,
    paddingHorizontal: 8,
    borderRadius: 8,
    backgroundColor: COLORES.yellow400,
    color: COLORES.blue950,
    fontSize: 8,
    fontFamily: 'Helvetica-Bold',
  },
  qr: { width: 110, height: 110, backgroundColor: '#fff', padding: 4, borderRadius: 6, alignSelf: 'center' },
  recorte: { fontSize: 8, color: COLORES.neutral600, marginBottom: 18 },
  h2: { fontSize: 14, fontFamily: 'Helvetica-Bold', color: COLORES.blue700, marginTop: 14, marginBottom: 6 },
  caja: { borderWidth: 1, borderColor: COLORES.neutral200, borderRadius: 8, padding: 10 },
  grupo: { marginBottom: 8 },
  grupoTitulo: { fontFamily: 'Helvetica-Bold', marginBottom: 2 },
  item: { flexDirection: 'row', gap: 6 },
  casilla: { width: 9, height: 9, borderWidth: 1, borderColor: COLORES.texto, marginTop: 2 },
  fila: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 3, borderBottomWidth: 1, borderBottomColor: COLORES.neutral200 },
  mono: { fontFamily: 'Courier-Bold' },
  pie: { position: 'absolute', bottom: 28, left: 40, right: 40, fontSize: 8, color: COLORES.neutral600 },
})

function PlanDocumento({ h, qr, escudo }: { h: MiHogar; qr: string; escudo: string }) {
  return (
    <Document title={`Plan familiar de emergencia · ${h.nombreTarjeta}`} author="Municipalidad de Hualañé" language="es-CL">
      <Page size="A4" style={st.pagina}>
        <View style={st.cabecera}>
          <Image src={escudo} style={st.escudo} />
          <View>
            <Text style={st.titulo}>Plan familiar de emergencia</Text>
            <Text style={st.subtitulo}>{h.nombreTarjeta} · Municipalidad de Hualañé</Text>
          </View>
        </View>

        <View style={st.tarjeta}>
          <View style={{ flex: 1 }}>
            <Text style={{ fontFamily: 'Helvetica-Bold', fontSize: 11 }}>Hogar Preparado · Hualañé</Text>
            <Text style={st.tarjetaNombre}>{h.nombreTarjeta}</Text>
            <Text style={st.tarjetaDato}>{h.direccion}</Text>
            <Text style={st.tarjetaDato}>
              {h.totalPersonas} {h.totalPersonas === 1 ? 'persona' : 'personas'}
            </Text>
            <Text style={st.codigo}>{h.codigoFamiliar}</Text>
            <Text style={st.nivel}>
              Nivel {h.nivel} · {NIVELES[h.nivel].nombre}
            </Text>
            <Text style={[st.tarjetaDato, { marginTop: 6 }]}>Vigente hasta {fechaTabla(h.vigenteHasta)}</Text>
          </View>
          <Image src={qr} style={st.qr} />
        </View>
        <Text style={st.recorte}>Recorta la tarjeta y guárdala con tus documentos. Si la pierdes, basta con el RUT del jefe o jefa de hogar.</Text>

        <Text style={st.h2}>Punto de encuentro</Text>
        <View style={st.caja}>
          <Text style={{ fontFamily: 'Helvetica-Bold' }}>{h.plan.puntoEncuentro}</Text>
          {h.plan.puntoEncuentroEsSugerido && <Text style={st.subtitulo}>Sugerido para tu sector. Puedes acordar otro con tu familia.</Text>}
        </View>

        <Text style={st.h2}>Mochila de emergencia</Text>
        <View style={st.caja}>
          {h.plan.mochila.map((g) => (
            <View key={g.titulo} style={st.grupo} wrap={false}>
              <Text style={st.grupoTitulo}>{g.titulo}</Text>
              {g.items.map((i) => (
                <View key={i} style={st.item}>
                  <View style={st.casilla} />
                  <Text>{i}</Text>
                </View>
              ))}
            </View>
          ))}
        </View>

        <Text style={st.h2}>Teléfonos de emergencia</Text>
        <View style={st.caja} wrap={false}>
          {h.plan.telefonos.map((t) => (
            <View key={t.nombre} style={st.fila}>
              <Text>{t.nombre}</Text>
              <Text style={st.mono}>{t.numero}</Text>
            </View>
          ))}
        </View>

        <Text style={st.pie} fixed>
          Generado el {fechaCorta(new Date())}. Confirma tus datos cada 6 meses para mantener tus beneficios.
        </Text>
      </Page>
    </Document>
  )
}

export async function generarPdfPlan(h: MiHogar, qr: string, escudo: string): Promise<Blob> {
  return pdf(<PlanDocumento h={h} qr={qr} escudo={escudo} />).toBlob()
}
