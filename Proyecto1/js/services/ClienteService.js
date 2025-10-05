// Importar Cliente y ClienteRepository
import ClienteRepository from '../repository/ClienteRepository.js';
import Cliente from '../models/Cliente.js';
import {Timestamp} from "https://www.gstatic.com/firebasejs/10.10.0/firebase-firestore.js";

class ClienteService {
    constructor() {
        this.repository = new ClienteRepository();
    }

    capitalizeString(str) {
        if (!str || typeof str !== 'string' || !str.trim()) return '';
        
        const trimmed = str.trim();
        const normalized = trimmed.replace(/\s+/g, ' ');
        return normalized.toLowerCase().replace(/\b\w/g, l => l.toUpperCase());
    }

    // Validar nombre completo
    validateNombre(nombre) {
        if (!nombre || !nombre.trim()) {
            throw new Error('El nombre es requerido');
        }

        const nombreTrimmed = nombre.trim();
        const nombreRegex = /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/; 
        if (!nombreRegex.test(nombreTrimmed)) {
            throw new Error('El nombre solo puede contener letras y espacios');
        }

        return this.capitalizeString(nombreTrimmed);
    }

    // Validar teléfono
    validateTelefono(telefono) {
        if (!telefono || !telefono.trim()) {
            throw new Error('El teléfono es requerido');
        }

        const telefonoTrimmed = telefono.trim();
        const telefonoRegex = /^\d+$/;
        if (!telefonoRegex.test(telefonoTrimmed)) {
            throw new Error('El teléfono solo puede contener números');
        }

        if (telefonoTrimmed.length !== 10) {
            throw new Error('El teléfono debe tener exactamente 10 dígitos');
        }

        return telefonoTrimmed;
    }

    // Validar RFC
    validateRFC(rfc) {
        if (!rfc || !rfc.trim()) {
            throw new Error('El RFC es requerido');
        }

        const rfcTrimmed = rfc.trim().toUpperCase();
        if (rfcTrimmed.length !== 13) {
            throw new Error('El RFC debe tener exactamente 13 caracteres para persona física');
        }

        const rfcRegex = /^[A-Z]{4}\d{6}[A-Z0-9]{3}$/;
        if (!rfcRegex.test(rfcTrimmed)) {
            throw new Error('El RFC no tiene un formato válido. Ej. ABCD010101XXX');
        }

        return rfcTrimmed;
    }

    // Crear nuevo Cliente
    async createCliente(nombre, rfc, telefono, direccion) {
        try {
            const clienteData = {
                nombre: this.validateNombre(nombre),
                rfc: this.validateRFC(rfc),
                telefono: this.validateTelefono(telefono),
                direccion: this.capitalizeString(direccion),
                fechaRegistro: new Date(),
            };

            const clienteId = await this.repository.add(clienteData);
            return clienteId;
        } catch (error) {
            throw error;
        }
    }

    // Obtener todos los Clientes
    async getAllClientes() {
        try {
            const clientesData = await this.repository.getAll();
            return clientesData.map(data => Cliente.fromFirestore({id: data.id, data: () => data}));
        } catch (error) {
            throw error;
        }
    }

    // Obtener cliente por ID
    async getClienteById(id) {
        try {
            const clienteData = await this.repository.getById(id);
            return Cliente.fromFirestore({id: clienteData.id, data: () => clienteData});
        } catch (error) {
            throw error;
        }
    }

    // Actualizar cliente
    async updateCliente(id, updates) {
        try {
            const validUpdates = {};
            if (updates.nombre !== undefined) validUpdates.nombre = this.validateNombre(updates.nombre);
            if (updates.rfc !== undefined) validUpdates.rfc = this.validateRFC(updates.rfc);
            if (updates.telefono !== undefined) validUpdates.telefono = this.validateTelefono(updates.telefono);
            if (updates.direccion !== undefined) validUpdates.direccion = this.capitalizeString(updates.direccion);

            await this.repository.update(id, validUpdates);
        } catch (error) {
            throw error;
        }
    }

    // Validar si se puede eliminar el cliente (si tiene préstamos activos)
    async validarEliminarCliente(id) {
        return true; // Cambiar según la lógica real
    }

    // Eliminar cliente
    async eliminarCliente(id) {
        try {
            await this.repository.delete(id);
        } catch (error) {
            throw error;
        }
    }

}

export default ClienteService;