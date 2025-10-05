import PrestamoRepository from '../repository/PrestamoRepository.js';
import ClienteRepository from '../repository/ClienteRepository.js';
import { Timestamp } from "https://www.gstatic.com/firebasejs/10.10.0/firebase-firestore.js";

class PrestamoService {
    constructor() {
        this.prestamoRepository = new PrestamoRepository();
        this.clienteRepository = new ClienteRepository();
    }

    async createPrestamo(idCliente, monto, tasaAnual, plazo, fechaDesembolso) {
        try {
            if (!idCliente || isNaN(monto) || isNaN(tasaAnual) || isNaN(plazo)) {
                throw new Error('Por favor, complete todos los campos correctamente.');
            }

            const tasaMensual = (tasaAnual / 100) / 12;
            const cuotaMensual = (monto * tasaMensual) / (1 - Math.pow(1 + tasaMensual, -plazo));

            const clienteDoc = await this.clienteRepository.getById(idCliente);
            if (!clienteDoc) {
                throw new Error('El cliente seleccionado no existe.');
            }
            const nombreCliente = clienteDoc.nombre;

            const prestamoData = {
                idCliente: idCliente,
                nombreCliente: nombreCliente,
                monto: monto,
                tasaInteres: tasaAnual,
                plazo: plazo,
                fechaDesembolso: Timestamp.fromDate(fechaDesembolso),
                cuotaMensual: cuotaMensual,
                estado: 'Activo',
                fechaCreacion: Timestamp.now()
            };

            const prestamoId = await this.prestamoRepository.add(prestamoData);
            return { prestamoId, cuotaMensual };

        } catch (error) {
            throw error;
        }
    }

    async getAllPrestamos(filtro = 'todos') {
        try {
            const prestamos = await this.prestamoRepository.getAll(filtro);
            return prestamos;
        } catch (error) {
            throw error;
        }
    }
}

export default PrestamoService;