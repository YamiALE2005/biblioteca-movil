
import React, { useState, useEffect } from 'react';
import {
  View, Text, FlatList, TouchableOpacity,
  ActivityIndicator, StyleSheet
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as SecureStore from 'expo-secure-store';

const fechaTexto = (fecha) => {
  if (!fecha) return 'Sin fecha';
  const [anio, mes, dia] = fecha.substring(0, 10).split('-');
  return `${dia}/${mes}/${anio}`;
};

export default function MisPrestamosScreen() {
  const [prestamos, setPrestamos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');

  const cargarPrestamos = async () => {
    try {
      setError('');
      const sesion = JSON.parse(
        (await SecureStore.getItemAsync('user_session_token')) || '{}'
      );

      const respuesta = await fetch(
        `${process.env.EXPO_PUBLIC_API_BASE_URL}/api/loans/books`,
        {
          headers: {
            'x-api-token': process.env.EXPO_PUBLIC_API_APP_TOKEN,
            Authorization: `Bearer ${sesion.token || ''}`
          }
        }
      );

      const datos = await respuesta.json();
      if (!respuesta.ok)
        throw new Error(datos.message || 'Error al cargar préstamos');

      setPrestamos(datos.filter(p => String(p.userId) === String(sesion.id)));
    } catch (e) {
      setError(e.message);
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => { cargarPrestamos(); }, []);

  return (
    <SafeAreaView style={s.pantalla} edges={['top']}>
      <View style={s.header}>
        <Ionicons name="book-outline" size={24} color="white" />
        <Text style={s.titulo}>Mis préstamos</Text>
      </View>

      <View style={s.contenido}>
        {cargando ? (
          <ActivityIndicator size="large" color="#062d59" />
        ) : error ? (
          <Text style={s.mensaje}>{error}</Text>
        ) : (
          <FlatList
            data={prestamos}
            keyExtractor={p => String(p.loanId)}
            onRefresh={cargarPrestamos}
            refreshing={cargando}
            ListEmptyComponent={
              <Text style={s.mensaje}>Todavía no tienes préstamos.</Text>
            }
            renderItem={({ item }) => (
              <View style={s.tarjeta}>
                <View style={s.fila}>
                  <View style={s.portada}>
                    <Ionicons name="book-outline" size={34} color="white" />
                  </View>

                  <View style={{ flex: 1 }}>
                    <Text style={s.nombre}>{item.libro}</Text>
                    <Text style={s.info}>Autor: {item.autor}</Text>
                    <Text style={[
                      s.estado,
                      item.estatus === 'DEVUELTO' && s.devuelto
                    ]}>
                      {item.estatus}
                    </Text>
                  </View>
                </View>

                <View style={s.linea} />

                <Text style={s.fecha}>
                  <Ionicons name="calendar-outline" size={15} />
                  {'  '}Fecha de préstamo: {fechaTexto(item.fechaPrestamo)}
                </Text>

                <Text style={s.fecha}>
                  <Ionicons name="calendar-outline" size={15} />
                  {'  '}Fecha límite: {fechaTexto(item.fechaDevolucionEstimada)}
                </Text>
              </View>
            )}
          />
        )}
      </View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  pantalla: { flex: 1, backgroundColor: '#062d59' },
  header: {
    height: 70, flexDirection: 'row', alignItems: 'center',
    justifyContent: 'center', gap: 12
  },
  titulo: { color: 'white', fontSize: 20, fontWeight: 'bold' },
  contenido: {
    flex: 1, backgroundColor: '#f6f9fd',
    borderTopLeftRadius: 23, borderTopRightRadius: 23, padding: 15
  },
  tarjeta: {
    backgroundColor: 'white', padding: 15,
    borderRadius: 15, marginBottom: 15, elevation: 2
  },
  fila: { flexDirection: 'row', alignItems: 'center', gap: 13 },
  portada: {
    width: 68, height: 90, borderRadius: 8,
    backgroundColor: '#062d59',
    alignItems: 'center', justifyContent: 'center'
  },
  nombre: { fontSize: 16, fontWeight: 'bold', marginBottom: 6 },
  info: { fontSize: 13, color: '#444', marginBottom: 8 },
  estado: {
    backgroundColor: '#c7f4cf', color: 'green',
    padding: 6, borderRadius: 15, alignSelf: 'flex-start',
    fontSize: 12, fontWeight: 'bold'
  },
  devuelto: { backgroundColor: '#cce5ff', color: '#174a83' },
  linea: { height: 1, backgroundColor: '#eee', marginVertical: 13 },
  fecha: { color: '#33435b', fontSize: 13, marginBottom: 8 },
  mensaje: { textAlign: 'center', marginTop: 30, color: '#555' }
});
