import { initializeApp } from "https://www.gstatic.com/firebasejs/10.10.0/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.10.0/firebase-firestore.js";

const firebaseConfig = {
    apiKey: "AIzaSyCN525uEX6vJ7eC4hmpXCeeXWQPuD6kKJk",
    authDomain: "prueba-crud-3dfce.firebaseapp.com",
    projectId: "prueba-crud-3dfce",
    storageBucket: "prueba-crud-3dfce.firebasestorage.app",
    messagingSenderId: "710530342207",
    appId: "1:710530342207:web:626ca4f6cd5c17e1e4078a",
};

// Inicializar Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export { db };