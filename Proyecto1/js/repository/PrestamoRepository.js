import { db } from '../config/firebase-config.js';
import { collection, addDoc, getDocs, query, orderBy, doc, getDoc, updateDoc, deleteDoc, where, Timestamp } from "https://www.gstatic.com/firebasejs/10.10.0/firebase-firestore.js";

class PrestamoRepository {
    constructor() {
        this.collectionName = 'prestamos';
        this.collection = collection(db, this.collectionName);
    }

    async add(prestamoData) {
        try {
            const docRef = await addDoc(this.collection, { ...prestamoData });
            return docRef.id;
        } catch (error) {
            throw error;
        }
    }

    async getAll(filtros = {}) {
        try {
            const { estado, clienteId } = filtros;
            const queryConstraints = [orderBy('fechaCreacion', 'desc')];

            if (estado && estado !== 'todos') {
                queryConstraints.unshift(where('estado', '==', estado));
            }

            if (clienteId) {
                queryConstraints.unshift(where('idCliente', '==', clienteId));
            }

            const q = query(this.collection, ...queryConstraints);
            const querySnapshot = await getDocs(q);
            
            return querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
        } catch (error) {
            throw error;
        }
    }

    async getById(id) {
        try {
            const docRef = doc(db, this.collectionName, id);
            const docSnap = await getDoc(docRef);

            if (docSnap.exists()) {
                return {
                    id: docSnap.id,
                    ...docSnap.data()
                };
            } else {
                throw new Error('Préstamo no encontrado');
            }
        } catch (error) {
            throw error;
        }
    }

    async update(id, updates) {
        try {
            const docRef = doc(db, this.collectionName, id);
            await updateDoc(docRef, updates);
        } catch (error) {
            throw error;
        }
    }

    async delete(id) {
        try {
            const docRef = doc(db, this.collectionName, id);
            await deleteDoc(docRef);
        } catch (error) {
            throw error;
        }
    }
}

export default PrestamoRepository;