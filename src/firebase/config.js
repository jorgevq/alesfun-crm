// src/firebase/config.js
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Tu configuración de Firebase (¡REEMPLAZA CON TUS PROPIOS DATOS!)
const firebaseConfig = {
  apiKey: "AIzaSyCctbUMQGoJSzQR2MXPKB33ZsPufG71448", // TU API KEY
  authDomain: "alesfun-crm.firebaseapp.com",
  projectId: "alesfun-crm",
  storageBucket: "alesfun-crm.firebasestorage.app",
  messagingSenderId: "395448114530",
  appId: "1:395448114530:web:49aa38a285672a63f9203b",
  measurementId: "G-WDKSDJCVTR", // Opcional, para Google Analytics
};

// Inicializa Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app); // Instancia para la autenticación de usuarios
const db = getFirestore(app); // Instancia para interactuar con Firestore (base de datos en la nube)

export { app, auth, db };
