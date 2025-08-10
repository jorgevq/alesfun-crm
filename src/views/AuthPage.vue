<template>
  <div class="auth-container">
    <div class="auth-box">
      <h1 class="app-title">ALESFUN</h1>
      <p class="app-subtitle-orbitron">Aleaciones Especiales en Fundición</p>

      <form @submit.prevent="handleLogin">
        <div class="input-group">
          <label for="email">Correo Electrónico:</label>
          <input
            type="email"
            id="email"
            v-model="email"
            required
            placeholder="tu.correo@alesfun.com"
          />
        </div>
        <div class="input-group">
          <label for="password">Contraseña:</label>
          <input
            type="password"
            id="password"
            v-model="password"
            required
            placeholder="••••••••"
          />
        </div>
        <button type="submit" :disabled="loading">
          {{ loading ? "Iniciando Sesión..." : "Iniciar Sesión" }}
        </button>
        <p v-if="error" class="error-message">{{ error }}</p>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref } from "vue";
import { auth } from "@/firebase/config"; // Importa 'auth' desde tu configuración de Firebase
import { signInWithEmailAndPassword } from "firebase/auth";
import { useRouter } from "vue-router"; // Para la navegación de Vue

const email = ref("");
const password = ref("");
const error = ref(null);
const loading = ref(false);
const router = useRouter();

const handleLogin = async () => {
  loading.value = true;
  error.value = null; // Limpiar errores previos

  try {
    await signInWithEmailAndPassword(auth, email.value, password.value);
    // Si el login es exitoso, redirigir al Home
    router.push("/app/home"); // CAMBIADO: Redirige a /app/home
  } catch (err) {
    // Manejo de errores de Firebase Authentication
    console.error("Error de autenticación:", err.code, err.message);
    switch (err.code) {
      case "auth/user-not-found":
        error.value = "Usuario no encontrado. Verifica tu correo.";
        break;
      case "auth/wrong-password":
        error.value = "Contraseña incorrecta. Inténtalo de nuevo.";
        break;
      case "auth/invalid-email":
        error.value = "Formato de correo electrónico inválido.";
        break;
      case "auth/too-many-requests":
        error.value =
          "Demasiados intentos fallidos. Intenta de nuevo más tarde.";
        break;
      default:
        error.value = "Error al iniciar sesión. Inténtalo de nuevo.";
    }
  } finally {
    loading.value = false;
  }
};
</script>

<style scoped>
/* NOTA: La fuente Orbitron se importa globalmente en src/styles/global.css */

.app-title {
  font-family: "Orbitron", sans-serif; /* Usamos la fuente global */
  font-weight: 700;
  font-size: 2.5em;
  color: #00bfff; /* Celeste vibrante para el título */
  text-shadow:
    0 0 10px #00bfff,
    0 0 20px #00bfff;
  letter-spacing: 2px;
}
.app-subtitle-orbitron {
  /* Nueva clase para este subtítulo específico con Orbitron */
  font-family: "Orbitron", sans-serif; /* Aplica Orbitron aquí también */
  color: #b0bec5;
  font-size: 0.9em;
  margin-top: -10px;
  margin-bottom: 25px;
}

.auth-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background: linear-gradient(
    135deg,
    #0f0c29,
    #302b63,
    #24243e
  ); /* Gradiente oscuro azul/púrpura */
  color: #e0e0e0; /* Color de texto general */
  padding: 20px;
  box-sizing: border-box;
}

.auth-box {
  background: rgba(
    0,
    0,
    0,
    0.7
  ); /* Fondo semi-transparente para la caja de login */
  border-radius: 15px;
  padding: 40px 30px;
  box-shadow: 0 10px 30px rgba(0, 191, 255, 0.3); /* Sombra con el color celeste */
  text-align: center;
  max-width: 400px;
  width: 100%;
  border: 1px solid rgba(0, 191, 255, 0.5); /* Borde sutil celeste */
}

.input-group {
  margin-bottom: 20px;
  text-align: left;
}

label {
  display: block;
  margin-bottom: 8px;
  font-weight: bold;
  color: #add8e6; /* Azul claro para las etiquetas */
}

input[type="email"],
input[type="password"] {
  width: 100%;
  padding: 12px 15px;
  border: 1px solid #4682b4; /* Azul acero */
  border-radius: 8px;
  background: #1a2a3a; /* Fondo muy oscuro para los inputs */
  color: #e0e0e0;
  font-size: 1em;
  box-sizing: border-box; /* Incluye padding en el ancho total */
  transition:
    border-color 0.3s ease,
    box-shadow 0.3s ease;
}

input[type="email"]:focus,
input[type="password"]:focus {
  border-color: #00bfff; /* Celeste vibrante al enfocar */
  box-shadow: 0 0 8px rgba(0, 191, 255, 0.5);
  outline: none;
}

button {
  background: linear-gradient(
    45deg,
    #00bfff,
    #1e90ff
  ); /* Gradiente celeste/azul para el botón */
  color: white;
  padding: 14px 25px;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 1.1em;
  font-weight: bold;
  width: 100%;
  transition:
    background 0.3s ease,
    transform 0.2s ease;
  box-shadow: 0 4px 15px rgba(0, 191, 255, 0.4);
}

button:hover:not(:disabled) {
  background: linear-gradient(45deg, #1e90ff, #00bfff);
  transform: translateY(-2px);
}

button:disabled {
  background: #424242;
  cursor: not-allowed;
  box-shadow: none;
}

.error-message {
  color: #ff5252; /* Rojo para mensajes de error */
  margin-top: 15px;
  font-size: 0.9em;
  font-weight: bold;
}
</style>
