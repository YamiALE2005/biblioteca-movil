
import React, { useState, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, Image,
  FlatList, Modal, Alert, ActivityIndicator, StyleSheet
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as SecureStore from 'expo-secure-store';

const API = process.env.EXPO_PUBLIC_API_BASE_URL;
const TOKEN = process.env.EXPO_PUBLIC_API_APP_TOKEN;

const peticion = async (ruta, body) => {
  const sesion = JSON.parse(
    (await SecureStore.getItemAsync('user_session_token')) || '{}'
  );

  const res = await fetch(`${API}${ruta}`, {
    method: body ? 'POST' : 'GET',
    headers: {
      'Content-Type': 'application/json',
      'x-api-token': TOKEN,
      Authorization: `Bearer ${sesion.token || ''}`
    },
    ...(body && { body: JSON.stringify({ ...body, userId: sesion.id }) })
  });

  const datos = await res.json();
  if (!res.ok) throw new Error(datos.message || 'Error en la API');
  return datos;
};

const FichaLibro = ({ libro }) => {
  const titulo = (libro.titulo || '').normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '').toLowerCase();

  const imagen = titulo.includes('robotica industrial')
    ? require('../../assets/robotica-industrial.png')
    : titulo.includes('control automatico')
    ? require('../../assets/control-automatico.png')
    : null;

  return (
    <View style={s.fila}>
      <View style={s.portada}>
        {imagen
          ? <Image source={imagen} style={s.imagen} />
          : <Ionicons name="book-outline" size={35} color="white" />}
      </View>

      <View style={{ flex: 1 }}>
        <Text style={s.nombre}>{libro.titulo}</Text>
        <Text style={s.info}>ISBN: {libro.isbn}</Text>
        <Text style={s.info}>Autor: {libro.autor}</Text>
        <Text style={s.info}>Categoría: {libro.categoria}</Text>
        <Text style={s.stock}>Disponibles: {libro.stockDisponible}</Text>
      </View>
    </View>
  );
};

export default function CatalogScreen({ onLogout }) {
  const [libros, setLibros] = useState([]);
  const [busqueda, setBusqueda] = useState('');
  const [categoria, setCategoria] = useState('Todas');
  const [verCategorias, setVerCategorias] = useState(false);
  const [seleccion, setSeleccion] = useState(null);
  const [fecha, setFecha] = useState('');
  const [cargando, setCargando] = useState(true);
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState('');

  const cargarLibros = async () => {
    try {
      setError('');
      setLibros(await peticion('/api/books'));
    } catch (e) {
      setError(e.message);
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => { cargarLibros(); }, []);

  const solicitar = async () => {
    const partes = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(fecha.trim());

    if (!partes) {
      Alert.alert('Aviso', 'Usa el formato DD/MM/AAAA');
      return;
    }

    const [, dia, mes, anio] = partes;
    const fechaElegida = new Date(+anio, +mes - 1, +dia);
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);

    if (fechaElegida.getDate() !== +dia ||
        fechaElegida.getMonth() !== +mes - 1 ||
        fechaElegida.getFullYear() !== +anio ||
        fechaElegida <= hoy) {
      Alert.alert('Aviso', 'Ingresa una fecha futura válida');
      return;
    }

    try {
      setEnviando(true);
      await peticion('/api/loans/books', {
        bookId: seleccion.id,
        fechaDevolucionEstimada: `${anio}-${mes}-${dia}`
      });

      setSeleccion(null);
      setFecha('');
      await cargarLibros();
      Alert.alert('Correcto', 'Préstamo registrado correctamente');
    } catch (e) {
      Alert.alert('Error', e.message);
    } finally {
      setEnviando(false);
    }
  };

  const categorias = ['Todas', ...new Set(libros.map(l => l.categoria).filter(Boolean))];

  const filtrados = libros.filter(l =>
    `${l.titulo || ''} ${l.autor || ''}`.toLowerCase()
      .includes(busqueda.toLowerCase()) &&
    (categoria === 'Todas' || l.categoria === categoria)
  );

  return (
    <SafeAreaView style={s.pantalla} edges={['top']}>
      <View style={s.header}>
        <Ionicons name="book-outline" size={24} color="white" />
        <Text style={s.headerTexto}>Biblioteca Universitaria</Text>
        <TouchableOpacity onPress={onLogout}>
          <Ionicons name="log-out-outline" size={24} color="white" />
        </TouchableOpacity>
      </View>

      <View style={s.contenido}>
        <View style={s.campo}>
          <Ionicons name="search" size={21} color="#062d59" />
          <TextInput style={s.input} placeholder="Buscar por título o autor..."
            value={busqueda} onChangeText={setBusqueda} />
        </View>

        <TouchableOpacity style={s.campo} onPress={() => setVerCategorias(true)}>
          <Ionicons name="funnel-outline" size={20} color="#062d59" />
          <Text style={[s.input, { paddingTop: 13 }]}>
            {categoria === 'Todas' ? 'Todas las categorías' : categoria}
          </Text>
          <Ionicons name="chevron-down" size={20} color="#062d59" />
        </TouchableOpacity>

        {cargando ? <ActivityIndicator size="large" color="#062d59" /> :
         error ? <Text>{error}</Text> :
          <FlatList
            data={filtrados}
            keyExtractor={l => String(l.id)}
            ListEmptyComponent={<Text>No se encontraron libros</Text>}
            renderItem={({ item }) => (
              <View style={s.tarjeta}>
                <FichaLibro libro={item} />
                <TouchableOpacity
                  style={[s.botonClaro, item.stockDisponible <= 0 && { backgroundColor: '#ddd' }]}
                  disabled={item.stockDisponible <= 0}
                  onPress={() => { setSeleccion(item); setFecha(''); }}
                >
                  <Text style={s.textoAzul}>
                    {item.stockDisponible > 0 ? 'Solicitar préstamo' : 'Sin disponibilidad'}
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          />}
      </View>

      <Modal visible={verCategorias} transparent animationType="fade"
        onRequestClose={() => setVerCategorias(false)}>
        <View style={s.fondo}>
          <View style={s.modal}>
            <Text style={s.titulo}>Seleccionar categoría</Text>
            {categorias.map(c => (
              <TouchableOpacity key={c} style={s.opcion}
                onPress={() => { setCategoria(c); setVerCategorias(false); }}>
                <Text>{c}</Text>
              </TouchableOpacity>
            ))}
            <TouchableOpacity onPress={() => setVerCategorias(false)}>
              <Text style={s.cancelar}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal visible={!!seleccion} transparent animationType="fade"
        onRequestClose={() => !enviando && setSeleccion(null)}>
        <View style={s.fondo}>
          <View style={s.modal}>
            <View style={s.filaBotones}>
              <Text style={s.titulo}>Solicitar préstamo</Text>
              <TouchableOpacity disabled={enviando} onPress={() => setSeleccion(null)}>
                <Ionicons name="close" size={25} color="#062d59" />
              </TouchableOpacity>
            </View>

            {seleccion && <FichaLibro libro={seleccion} />}

            <View style={s.linea} />
            <Text style={s.etiqueta}>Fecha estimada de devolución</Text>

            <View style={s.campo}>
              <Ionicons name="calendar-outline" size={21} color="#062d59" />
              <TextInput style={s.input} placeholder="DD/MM/AAAA"
                value={fecha} onChangeText={setFecha} maxLength={10} />
            </View>

            <View style={s.filaBotones}>
              <TouchableOpacity style={s.botonCancelar} disabled={enviando}
                onPress={() => setSeleccion(null)}>
                <Text style={s.textoAzul}>Cancelar</Text>
              </TouchableOpacity>

              <TouchableOpacity style={s.botonConfirmar} disabled={enviando}
                onPress={solicitar}>
                {enviando ? <ActivityIndicator color="white" /> :
                  <Text style={s.textoBlanco}>Confirmar préstamo</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  pantalla: { flex: 1, backgroundColor: '#062d59' },
  header: { height: 70, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 15 },
  headerTexto: { color: 'white', fontSize: 18, fontWeight: 'bold' },
  contenido: { flex: 1, backgroundColor: '#f6f9fd', borderTopLeftRadius: 23, borderTopRightRadius: 23, padding: 15 },
  campo: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'white', borderWidth: 1, borderColor: '#ccd8e8', borderRadius: 10, paddingHorizontal: 12, marginBottom: 12 },
  input: { flex: 1, height: 46, marginLeft: 9, color: '#111' },
  tarjeta: { backgroundColor: 'white', borderRadius: 15, padding: 13, marginBottom: 14, elevation: 2 },
  fila: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  portada: { width: 75, height: 105, backgroundColor: '#062d59', borderRadius: 7, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  imagen: { width: '100%', height: '100%', resizeMode: 'cover' },
  nombre: { fontSize: 15, fontWeight: 'bold', color: '#111', marginBottom: 5 },
  info: { fontSize: 12, color: '#33435b', marginBottom: 4 },
  stock: { color: 'green', backgroundColor: '#d4f8db', alignSelf: 'flex-start', padding: 4, borderRadius: 5, fontSize: 12 },
  botonClaro: { backgroundColor: '#a7cfff', padding: 12, borderRadius: 9, alignItems: 'center', marginTop: 14 },
  textoAzul: { color: '#062d59', fontWeight: 'bold', fontSize: 13 },
  fondo: { flex: 1, backgroundColor: '#0009', justifyContent: 'center', padding: 17 },
  modal: { backgroundColor: 'white', borderRadius: 17, padding: 17 },
  titulo: { fontSize: 18, fontWeight: 'bold', color: '#091c3a' },
  opcion: { paddingVertical: 13, borderBottomWidth: 1, borderColor: '#eee' },
  cancelar: { textAlign: 'center', color: '#062d59', marginTop: 20 },
  filaBotones: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 9, marginBottom: 15 },
  linea: { height: 1, backgroundColor: '#ddd', marginVertical: 20 },
  etiqueta: { fontSize: 14, fontWeight: 'bold', marginBottom: 10 },
  botonCancelar: { flex: 1, padding: 13, borderWidth: 1, borderColor: '#ccd8e8', borderRadius: 9, alignItems: 'center' },
  botonConfirmar: { flex: 1.7, padding: 13, backgroundColor: '#062d59', borderRadius: 9, alignItems: 'center' },
  textoBlanco: { color: 'white', fontWeight: 'bold', fontSize: 13 }
});
