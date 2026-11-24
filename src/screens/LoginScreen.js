
import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, Image,
  StyleSheet, Alert, ActivityIndicator, ScrollView,
  KeyboardAvoidingView, Platform, Dimensions
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as SecureStore from 'expo-secure-store';

const LoginScreen = ({ navigation, onLoginSuccess }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [mostrar, setMostrar] = useState(false);
  const [cargando, setCargando] = useState(false);

  const handleLogin = async () => {
    if (!email.trim() || !password) {
      Alert.alert('Aviso', 'Completa todos los campos.');
      return;
    }

    try {
      setCargando(true);

      const respuesta = await fetch(
        `${process.env.EXPO_PUBLIC_API_BASE_URL}/api/auth/login`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-token': process.env.EXPO_PUBLIC_API_APP_TOKEN
          },
          body: JSON.stringify({ email: email.trim(), password })
        }
      );

      const datos = await respuesta.json();
      if (!respuesta.ok) throw new Error(datos.message || 'Error al iniciar sesión.');
      if (!datos.token) throw new Error('No se recibió el token.');

      const sesion = JSON.stringify({ token: datos.token, ...datos.user });
      await SecureStore.setItemAsync('user_session_token', sesion);
      onLoginSuccess(sesion);

    } catch (error) {
      Alert.alert('Error', error.message);
    } finally {
      setCargando(false);
    }
  };

  return (
    <SafeAreaView style={styles.pantalla} edges={['top']}>
      <KeyboardAvoidingView style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>

        <ScrollView contentContainerStyle={styles.contenido}>

          <View style={styles.encabezado}>
            <Image source={require('../../assets/logo-libro.png')} style={styles.logo} />
            <Text style={styles.marca}>Biblioteca{'\n'}Universitaria</Text>
          </View>

          <View style={styles.panel}>
            <Text style={styles.titulo}>Inicia sesión</Text>

            <View style={styles.formulario}>
              <View style={styles.campo}>
                <Ionicons name="mail-outline" size={22} color="#14345b" />
                <TextInput style={styles.input} placeholder="Email"
                  placeholderTextColor="#333" keyboardType="email-address"
                  autoCapitalize="none" autoCorrect={false}
                  value={email} onChangeText={setEmail} />
              </View>

              <View style={styles.campo}>
                <Ionicons name="lock-closed-outline" size={23} color="#14345b" />
                <TextInput style={styles.input} placeholder="Password"
                  placeholderTextColor="#333" secureTextEntry={!mostrar}
                  value={password} onChangeText={setPassword} />

                <TouchableOpacity onPress={() => setMostrar(!mostrar)}>
                  <Ionicons name={mostrar ? 'eye-off-outline' : 'eye-outline'}
                    size={21} color="#14345b" />
                </TouchableOpacity>
              </View>

              <TouchableOpacity style={styles.boton}
                onPress={handleLogin} disabled={cargando}>
                {cargando ? <ActivityIndicator color="white" /> :
                  <Text style={styles.textoBoton}>Iniciar sesión</Text>}
              </TouchableOpacity>

              <View style={styles.registro}>
                <Text style={styles.pregunta}>¿No tienes una cuenta?</Text>
                <TouchableOpacity onPress={() => navigation.navigate('Registro')}>
                  <Text style={styles.enlace}>Regístrate</Text>
                </TouchableOpacity>
              </View>
            </View>

            <Image source={require('../../assets/ondas-login.png')}
              style={styles.ondas} resizeMode="stretch" />
          </View>

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  pantalla: { flex: 1, backgroundColor: '#2b4388' },
  contenido: { flexGrow: 1, backgroundColor: '#2b4388' },

  encabezado: {
    height: 220, alignItems: 'center',
    justifyContent: 'center', paddingBottom: 18
  },
  logo: { width: 105, height: 105, resizeMode: 'contain' },
  marca: {
    color: 'white', fontSize: 24, fontWeight: 'bold',
    textAlign: 'center', lineHeight: 25, marginTop: 4
  },
  panel: {
    flex: 1, minHeight: 550, backgroundColor: 'white',
    borderTopLeftRadius: 35, borderTopRightRadius: 35,
    paddingHorizontal: 22, paddingTop: 25, overflow: 'hidden'
  },
  titulo: {
    color: '#111', fontSize: 22,
    fontWeight: 'bold', textAlign: 'center'
  },
  formulario: { marginTop: 60 },
  campo: {
    height: 49, flexDirection: 'row', alignItems: 'center',
    borderWidth: 1, borderColor: '#8294ec',
    borderRadius: 6, paddingHorizontal: 10, marginBottom: 12
  },
  input: { flex: 1, fontSize: 16, paddingHorizontal: 10, color: '#111' },
  boton: {
    backgroundColor: '#2b4388', height: 50,
    justifyContent: 'center', alignItems: 'center',
    borderRadius: 5, marginTop: 13
  },
  textoBoton: { color: 'white', fontSize: 17 },
  registro: { alignItems: 'center', marginTop: 28 },
  pregunta: { color: '#111', fontSize: 13 },
  enlace: { color: '#2196f3', fontSize: 14, marginTop: 4 },
  ondas: {
    position: 'absolute', bottom: 0, left: 0,
    width: Dimensions.get('window').width, height: 135
  }
});

export default LoginScreen;
