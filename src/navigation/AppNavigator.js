
import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, StyleSheet } from 'react-native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import * as SecureStore from 'expo-secure-store';

import LoginScreen from '../screens/LoginScreen';
import RegistroScreen from '../screens/RegistroScreen';
import CatalogScreen from '../screens/CatalogScreen';
import MisPrestamosScreen from '../screens/MisPrestamosScreen';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

const Perfil = ({ usuario, onLogout }) => (
  <View style={s.pantalla}>
    <View style={s.header}>
      <Text style={s.titulo}>Mi perfil</Text>
    </View>

    <View style={s.contenido}>
      <Ionicons name="person-circle-outline" size={95} color="#062d59" />
      <Text style={s.nombre}>{usuario.nombre || 'Usuario'}</Text>

      <View style={s.tarjeta}>
        {[
          ['id-card-outline', 'Matrícula', usuario.matricula],
          ['mail-outline', 'Correo', usuario.email],
          ['shield-checkmark-outline', 'Rol', usuario.rol]
        ].map(([icono, etiqueta, valor]) => (
          <View style={s.dato} key={etiqueta}>
            <Ionicons name={icono} size={23} color="#062d59" />
            <View style={{ flex: 1 }}>
              <Text style={s.etiqueta}>{etiqueta}</Text>
              <Text style={s.valor}>{valor || 'Sin información'}</Text>
            </View>
          </View>
        ))}
      </View>

      <TouchableOpacity style={s.boton} onPress={onLogout}>
        <Ionicons name="log-out-outline" size={22} color="white" />
        <Text style={s.textoBoton}>Cerrar sesión</Text>
      </TouchableOpacity>
    </View>
  </View>
);

const Pestañas = ({ usuario, onLogout }) => (
  <Tab.Navigator screenOptions={({ route }) => ({
    headerShown: false,
    tabBarActiveTintColor: '#062d59',
    tabBarInactiveTintColor: '#777',
    tabBarStyle: { height: 65, paddingBottom: 7 },
    tabBarIcon: ({ color, size }) => {
      const iconos = {
        Catalogo: 'book-outline',
        MisPrestamos: 'calendar-outline',
        Perfil: 'person-outline'
      };
      return <Ionicons name={iconos[route.name]} size={size} color={color} />;
    }
  })}>
    <Tab.Screen name="Catalogo" options={{ title: 'Catálogo' }}>
      {() => <CatalogScreen onLogout={onLogout} />}
    </Tab.Screen>

    <Tab.Screen
      name="MisPrestamos"
      component={MisPrestamosScreen}
      options={{ title: 'Mis préstamos' }}
    />

    <Tab.Screen name="Perfil">
      {() => <Perfil usuario={usuario} onLogout={onLogout} />}
    </Tab.Screen>
  </Tab.Navigator>
);

export default function AppNavigator() {
  const [sesion, setSesion] = useState(null);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    SecureStore.getItemAsync('user_session_token')
      .then(setSesion)
      .catch(console.log)
      .finally(() => setCargando(false));
  }, []);

  const cerrarSesion = async () => {
    await SecureStore.deleteItemAsync('user_session_token');
    setSesion(null);
  };

  if (cargando) {
    return <ActivityIndicator size="large" style={{ flex: 1 }} />;
  }

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {!sesion ? (
        <>
          <Stack.Screen name="Login">
            {props => <LoginScreen {...props} onLoginSuccess={setSesion} />}
          </Stack.Screen>
          <Stack.Screen name="Registro" component={RegistroScreen} />
        </>
      ) : (
        <Stack.Screen name="Inicio">
          {() => (
            <Pestañas
              usuario={JSON.parse(sesion)}
              onLogout={cerrarSesion}
            />
          )}
        </Stack.Screen>
      )}
    </Stack.Navigator>
  );
}

const s = StyleSheet.create({
  pantalla: { flex: 1, backgroundColor: '#f6f9fd' },
  header: { backgroundColor: '#062d59', padding: 25, alignItems: 'center' },
  titulo: { color: 'white', fontSize: 22, fontWeight: 'bold' },
  contenido: { flex: 1, alignItems: 'center', padding: 20 },
  nombre: { fontSize: 22, fontWeight: 'bold', marginBottom: 25 },
  tarjeta: { backgroundColor: 'white', width: '100%', padding: 20, borderRadius: 15, elevation: 2 },
  dato: { flexDirection: 'row', alignItems: 'center', gap: 15, marginBottom: 22 },
  etiqueta: { fontSize: 12, color: '#777' },
  valor: { fontSize: 15, fontWeight: '500', color: '#111' },
  boton: {
    backgroundColor: '#062d59', flexDirection: 'row',
    gap: 10, padding: 15, borderRadius: 10,
    justifyContent: 'center', width: '100%', marginTop: 30
  },
  textoBoton: { color: 'white', fontWeight: 'bold', fontSize: 16 }
});
