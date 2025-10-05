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

    async getAllPrestamos(filtros = {}) {
        try {
            const prestamos = await this.prestamoRepository.getAll(filtros);
            return prestamos;
        } catch (error) {
            throw error;
        }
    }

    async getPrestamoById(id) {
        try {
            const prestamo = await this.prestamoRepository.getById(id);
            // Las fechas de Firestore vienen como Timestamps, las convertimos a Date de JS
            if (prestamo.fechaDesembolso) {
                prestamo.fechaDesembolso = prestamo.fechaDesembolso.toDate();
            }
            if (prestamo.fechaCreacion) {
                prestamo.fechaCreacion = prestamo.fechaCreacion.toDate();
            }
            return prestamo;
        } catch (error) {
            throw error;
        }
    }

    generarTablaAmortizacion(prestamo) {
        const tabla = [];
        let saldoInicial = prestamo.monto;
        const tasaMensual = (prestamo.tasaInteres / 100) / 12;

        for (let i = 1; i <= prestamo.plazo; i++) {
            const interes = saldoInicial * tasaMensual;
            const amortizacionCapital = prestamo.cuotaMensual - interes;
            const saldoFinal = saldoInicial - amortizacionCapital;

            // Calculamos la fecha programada para este pago
            const fechaProgramada = new Date(prestamo.fechaDesembolso);
            fechaProgramada.setMonth(fechaProgramada.getMonth() + i);

            const pago = {
                periodo: i,
                fechaProgramada: fechaProgramada,
                saldoInicial: saldoInicial,
                interes: interes,
                amortizacionCapital: amortizacionCapital,
                cuotaTotal: prestamo.cuotaMensual,
                saldoFinal: saldoFinal < 0.01 ? 0 : saldoFinal, // Redondeo para el último pago
                fechaPagoReal: null // Esto se actualizará cuando se registre un pago
            };
            tabla.push(pago);
            saldoInicial = saldoFinal;
        }
        return tabla;
    }

    async realizarPago(prestamoId, periodo) {
        try {
            await this.prestamoRepository.registrarPago(prestamoId, periodo, new Date());

            // Opcional: Verificar si todos los pagos están hechos para cambiar el estado del préstamo
            const prestamo = await this.getPrestamoById(prestamoId);
            const tabla = this.generarTablaAmortizacion(prestamo);

            // Suponiendo que la info de pagos se guarda en el documento del préstamo
            const todosPagados = tabla.every(p => prestamo.pagos && prestamo.pagos[p.periodo]);
            if (todosPagados) {
                await this.prestamoRepository.update(prestamoId, { estado: 'Pagado' });
            }

        } catch (error) {
            throw error;
        }
    }
}

export default PrestamoService;