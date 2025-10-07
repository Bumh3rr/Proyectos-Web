import PrestamoRepository from '../repository/PrestamoRepository.js';
import ClienteRepository from '../repository/ClienteRepository.js';
import {Timestamp} from "https://www.gstatic.com/firebasejs/10.10.0/firebase-firestore.js";

class PrestamoService {
    constructor() {
        this.prestamoRepository = new PrestamoRepository();
        this.clienteRepository = new ClienteRepository();
    }

    async createPrestamo(idCliente, cuotaMensual, monto, tasaAnual, plazo, fechaDesembolso) {
        try {
            if (!idCliente || isNaN(monto) || isNaN(tasaAnual) || isNaN(plazo)) {
                throw new Error('Por favor, complete todos los campos correctamente.');
            }

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
                fechaDesembolso: new Date(fechaDesembolso),
                cuotaMensual: cuotaMensual,
                estado: 'Activo',
                fechaCreacion: new Date(),
            };

            return await this.prestamoRepository.add(prestamoData);
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

            // Actualizar el estado del préstamo después del pago
            await this.actualizarEstadoPrestamo(prestamoId);

        } catch (error) {
            throw error;
        }
    }

    // Método para determinar y actualizar el estado de un préstamo
    async actualizarEstadoPrestamo(prestamoId) {
        try {
            const prestamo = await this.getPrestamoById(prestamoId);
            const tabla = this.generarTablaAmortizacion(prestamo);
            
            // Verificar si todos los pagos están hechos
            const todosPagados = tabla.every(p => prestamo.pagos && prestamo.pagos[p.periodo]);
            if (todosPagados) {
                await this.prestamoRepository.update(prestamoId, {estado: 'Pagado'});
                return;
            }

            // Si no está pagado completamente, verificar si está vencido o activo
            const fechaActual = new Date();
            fechaActual.setHours(0, 0, 0, 0); // Normalizar a medianoche para comparación de fechas

            // Obtener la última fecha programada del préstamo
            const ultimaFechaProgramada = new Date(Math.max(...tabla.map(pago => pago.fechaProgramada.getTime())));
            ultimaFechaProgramada.setHours(0, 0, 0, 0);

            // Calcular el día siguiente a la última fecha programada
            const diaSiguienteUltimaFecha = new Date(ultimaFechaProgramada);
            diaSiguienteUltimaFecha.setDate(diaSiguienteUltimaFecha.getDate() + 1);

            // Determinar el nuevo estado
            let nuevoEstado = 'Activo';
            
            if (fechaActual >= diaSiguienteUltimaFecha) {
                nuevoEstado = 'Vencido';
            }

            // Actualizar el estado si ha cambiado
            if (prestamo.estado !== nuevoEstado) {
                await this.prestamoRepository.update(prestamoId, {estado: nuevoEstado});
            }

        } catch (error) {
            console.error('Error al actualizar estado del préstamo:', error);
            throw error;
        }
    }

    // Método para actualizar estados de todos los préstamos activos y vencidos
    async actualizarTodosLosEstados() {
        try {
            // Obtener todos los préstamos que no están pagados
            const prestamosActivos = await this.getAllPrestamos({estado: 'activo'});
            const prestamosVencidos = await this.getAllPrestamos({estado: 'vencido'});
            
            const todosLosPrestamos = [...prestamosActivos, ...prestamosVencidos];

            for (const prestamo of todosLosPrestamos) {
                await this.actualizarEstadoPrestamo(prestamo.id);
            }

            return {
                procesados: todosLosPrestamos.length,
                mensaje: `Se procesaron ${todosLosPrestamos.length} préstamos`
            };

        } catch (error) {
            console.error('Error al actualizar todos los estados:', error);
            throw error;
        }
    }
}

export default PrestamoService;