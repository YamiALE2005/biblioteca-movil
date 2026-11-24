
import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, ScrollView, Alert, ActivityIndicator
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

const RegistroScreen = ({ navigation }) => {
  const [form, setForm] = useState({
    nombre: '', matricula: '', email: '',
    password: '', confirmarPassword: ''
  });
  const [cargando, setCargando] = useState(false);

  const handleChange = (campo, valor) => {
    setForm({ ...form, [campo]: valor });
  };

  const handleRegistro = async () => {
    if (Object.values(form).some(valor => !valor.trim())) {
      Alert.alert('Aviso', 'Completa todos los campos.');
      return;
    }

    if (form.password !== form.confirmarPassword) {
      Alert.alert('Error', 'Las contraseñas no coinciden.');
      return;
    }

    try {
      setCargando(true);

      const respuesta = await fetch(
        `${process.env.EXPO_PUBLIC_API_BASE_URL}/api/auth/register`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-token': process.env.EXPO_PUBLIC_API_APP_TOKEN
          },
          body: JSON.stringify({
            nombre: form.nombre.trim(),
            matricula: form.matricula.trim(),
            email: form.email.trim(),
            password: form.password,
            rol: 'USER'
          })
        }
      );

      const datos = await respuesta.json();

      if (!respuesta.ok) {
        throw new Error(datos.message || 'No se pudo registrar.');
      }

      Alert.alert('Correcto', 'Usuario registrado correctamente.', [
        { text: 'Aceptar', onPress: () => navigation.navigate('Login') }
      ]);

    } catch (error) {
      Alert.alert('Error', error.message);
    } finally {
      setCargando(false);
    }
  };

  const campos = [
    { nombre: 'nombre', texto: 'Nombre completo', icono: 'person-outline' },
    { nombre: 'matricula', texto: 'Matrícula', icono: 'id-card-outline' },
    { nombre: 'email', texto: 'Email', icono: 'mail-outline' },
    { nombre: 'password', texto: 'Password', icono: 'lock-closed-outline' },
    { nombre: 'confirmarPassword', texto: 'Confirmar password', icono: 'lock-closed-outline' }
  ];

  return (
    <SafeAreaView style={styles.pantalla} edges={['top']}>
      <View style={styles.encabezado}>
        <TouchableOpacity onPress={() => navigation.navigate('Login')}>
          <Ionicons name="arrow-back" size={28} color="white" />
        </TouchableOpacity>
        <Text style={styles.tituloHeader}>Registro</Text>
      </View>

      <ScrollView contentContainerStyle={styles.panel}>
        <Text style={styles.titulo}>Crear una cuenta</Text>

        <View style={styles.formulario}>
          {campos.map(campo => (
            <View style={styles.campo} key={campo.nombre}>
              <Ionicons name={campo.icono} size={21} color="#244680" />
              <TextInput
                style={styles.input}
                placeholder={campo.texto}
                placeholderTextColor="#777"
                value={form[campo.nombre]}
                onChangeText={valor => handleChange(campo.nombre, valor)}
                secureTextEntry={campo.nombre.toLowerCase().includes('password')}
                keyboardType={campo.nombre === 'email' ? 'email-address' : 'default'}
                autoCapitalize={campo.nombre === 'email' ? 'none' : 'sentences'}
              />
            </View>
          ))}

          <TouchableOpacity
            style={styles.boton}
            onPress={handleRegistro}
            disabled={cargando}
          >
            {cargando ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text style={styles.textoBoton}>Crear cuenta</Text>
            )}
          </TouchableOpacity>

          <View style={styles.volver}>
            <Text>¿Ya tienes una cuenta?</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Login')}>
              <Text style={styles.enlace}>Inicia sesión</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  pantalla: { flex: 1, backgroundColor: '#2b4388' },
  encabezado: {
    height: 110, flexDirection: 'row',
    alignItems: 'center', paddingHorizontal: 25, gap: 30
  },
  tituloHeader: { color: 'white', fontSize: 24, fontWeight: 'bold' },
  panel: {
    flexGrow: 1, backgroundColor: 'white',
    borderTopLeftRadius: 35, borderTopRightRadius: 35,
    padding: 25, alignItems: 'center'
  },
  titulo: {
    color: '#111', fontSize: 23, fontWeight: 'bold',
    marginTop: 25, marginBottom: 65
  },
  formulario: { width: '100%' },
  campo: {
    flexDirection: 'row', alignItems: 'center',
    borderWidth: 1, borderColor: '#8294ec',
    borderRadius: 6, paddingHorizontal: 10,
    height: 48, marginBottom: 12
  },
  input: { flex: 1, paddingHorizontal: 10, fontSize: 16, color: '#111' },
  boton: {
    backgroundColor: '#2b4388', padding: 15,
    borderRadius: 6, alignItems: 'center',
    marginTop: 15
  },
  textoBoton: { color: 'white', fontSize: 17 },
  volver: { alignItems: 'center', marginTop: 55 },
  enlace: { color: '#2196f3', marginTop: 5, fontSize: 15 }
});

export default RegistroScreen;
