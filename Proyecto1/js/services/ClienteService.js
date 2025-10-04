// Importar Cliente y ClienteRepository
import ClienteRepository from '../repository/ClienteRepository.js';
import Cliente from '../models/Cliente.js';

class ClienteService {
    constructor() {
        this.repository = new ClienteRepository();
    }

    // Crear nuevo Cliente
    async createCliente(nombre, rfc, telefono, direccion) {
        try {
            const clienteData = {
                nombre: nombre.trim(),
                rfc: rfc.trim(),
                telefono: telefono.trim(),
                direccion: direccion.trim(),
                fechaRegistro: new Date()
            };

            // Validaciones
            if (!clienteData.nombre) {
                throw new Error('El nombre es requerido');
            }

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
            if (updates.nombre !== undefined) validUpdates.nombre = updates.nombre.trim();
            if (updates.rfc !== undefined) validUpdates.rfc = updates.rfc.trim();
            if (updates.telefono !== undefined) validUpdates.telefono = updates.telefono.trim();
            if (updates.direccion !== undefined) validUpdates.direccion = updates.direccion.trim();

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
            const canDelete = await this.validarEliminarCliente(id);
            if (!canDelete) {
                throw new Error('No se puede eliminar el cliente porque tiene préstamos activos');
            }
            await this.repository.delete(id);
        } catch (error) {
            throw error;
        }
    }

}

export default ClienteService;