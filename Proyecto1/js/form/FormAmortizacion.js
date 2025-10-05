
import PrestamoService from '../services/PrestamoService.js';
import Amortizacion from '../models/Amortizacion.js';

class FormAmortizacion {
    constructor() {
        this.prestamoService = new PrestamoService();
        this.prestamoAmortizacionSelect = document.getElementById('prestamoAmortizacion');
        this.tablaAmortizacionBody = document.querySelector('#tablaAmortizacion tbody');
        this.infoPrestamoDiv = document.getElementById('infoPrestamo');
        this.toast = new Notyf({
            duration: 3000,
            position: { x: 'right', y: 'top' },
        });

        this.initEventListeners();
    }

    initEventListeners() {
        this.prestamoAmortizacionSelect.addEventListener('change', async () => {
            const prestamoId = this.prestamoAmortizacionSelect.value;
            if (prestamoId) {
                await this.mostrarTablaAmortizacion(prestamoId);
            } else {
                this.limpiarVista();
            }
        });
    }

    async init(clienteId = null) {
        await this.cargarPrestamosEnDropdown(clienteId);
    }

    async cargarPrestamosEnDropdown(clienteId = null) {
        try {
            const filtros = { estado: 'todos' };
            if (clienteId) {
                filtros.clienteId = clienteId;
            }
            const prestamos = await this.prestamoService.getAllPrestamos(filtros);
            this.prestamoAmortizacionSelect.innerHTML = '<option value="">Seleccione un préstamo...</option>';
            prestamos.forEach(prestamo => {
                const option = document.createElement('option');
                option.value = prestamo.id;
                option.textContent = `${prestamo.nombreCliente} - ${prestamo.monto.toFixed(2)} (${prestamo.estado})`;
                this.prestamoAmortizacionSelect.appendChild(option);
            });
        } catch (error) {
            this.toast.error('Error al cargar los préstamos en el selector.');
            console.error(error);
        }
    }

    async mostrarTablaAmortizacion(prestamoId) {
        try {
            const prestamo = await this.prestamoService.getPrestamoById(prestamoId);
            const tabla = this.prestamoService.generarTablaAmortizacion(prestamo);

            this.infoPrestamoDiv.innerHTML = `
                <h4>Información del Préstamo</h4>
                <p><strong>Cliente:</strong> ${prestamo.nombreCliente}</p>
                <p><strong>Monto:</strong> ${prestamo.monto.toFixed(2)}</p>
                <p><strong>Tasa:</strong> ${prestamo.tasaInteres}%</p>
                <p><strong>Cuota Mensual:</strong> ${prestamo.cuotaMensual.toFixed(2)}</p>
            `;

            this.tablaAmortizacionBody.innerHTML = '';
            tabla.forEach(pago => {
                const fechaPagoReal = prestamo.pagos && prestamo.pagos[pago.periodo] 
                    ? prestamo.pagos[pago.periodo].toDate().toLocaleDateString('es-MX') 
                    : 'Pendiente';

                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${pago.periodo}</td>
                    <td>${pago.fechaProgramada.toLocaleDateString('es-MX')}</td>
                    <td>${pago.saldoInicial.toFixed(2)}</td>
                    <td>${pago.interes.toFixed(2)}</td>
                    <td>${pago.amortizacionCapital.toFixed(2)}</td>
                    <td>${pago.cuotaTotal.toFixed(2)}</td>
                    <td>${pago.saldoFinal.toFixed(2)}</td>
                    <td>${fechaPagoReal}</td>
                    <td>
                        ${fechaPagoReal === 'Pendiente' ? `<button class="btn btn-success btn-small" onclick="registrarPago('${prestamo.id}', ${pago.periodo})">Pagar</button>` : 'Pagado'}
                    </td>
                `;
                this.tablaAmortizacionBody.appendChild(row);
            });

        } catch (error) {
            this.toast.error(`Error al mostrar la tabla de amortización: ${error.message}`);
            console.error(error);
        }
    }

    limpiarVista() {
        this.infoPrestamoDiv.innerHTML = '';
        this.tablaAmortizacionBody.innerHTML = '';
    }
}

export default FormAmortizacion;
