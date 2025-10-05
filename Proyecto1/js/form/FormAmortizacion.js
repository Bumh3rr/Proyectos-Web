class FormAmortizacion {
    constructor(toast,showLoading, prestamoService) {
        this.prestamoService = prestamoService;
        this.prestamoAmortizacionSelect = document.getElementById('prestamoAmortizacion');
        this.tablaAmortizacionBody = document.querySelector('#tablaAmortizacion tbody');
        this.infoPrestamoDiv = document.getElementById('infoPrestamo');
        this.toast = toast
        this.showLoading = showLoading;
        this.loading = document.getElementById('loading');
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
            const filtros = {estado: 'todos'};
            if (clienteId) {
                filtros.clienteId = clienteId;
            }
            this.showLoading(true);
            const prestamos = await this.prestamoService.getAllPrestamos(filtros);
            this.prestamoAmortizacionSelect.innerHTML = '<option value="">Seleccione un préstamo...</option>';
            prestamos.forEach(prestamo => {
                const option = document.createElement('option');
                option.value = prestamo.id;
                option.textContent = `${prestamo.nombreCliente} - ${prestamo.monto.toFixed(2)} (${prestamo.estado})`;
                this.prestamoAmortizacionSelect.appendChild(option);
            });
            this.showLoading(false);
        } catch (error) {
            this.showLoading(false);
            this.toast.error('Error al cargar los préstamos en el selector.');
        }
    }

    async mostrarTablaAmortizacion(prestamoId) {
        try {
            this.showLoading(true);
            const prestamo = await this.prestamoService.getPrestamoById(prestamoId);
            const tabla = this.prestamoService.generarTablaAmortizacion(prestamo);

            this.infoPrestamoDiv.innerHTML = `
                <h4>Información del Préstamo</h4>
                <p><strong>Cliente:</strong> ${prestamo.nombreCliente}</p>
                <p><strong>Monto:</strong> ${prestamo.monto.toFixed(2)}</p>
                <p><strong>Tasa:</strong> ${prestamo.tasaInteres}%</p>
                <p><strong>Cuota Mensual:</strong> ${prestamo.cuotaMensual.toFixed(2)}</p>
            `;

            const toDecimal = (numero) =>{
               return  numero.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
            }


            this.tablaAmortizacionBody.innerHTML = '';
            tabla.forEach(pago => {
                const fechaPagoReal = prestamo.pagos && prestamo.pagos[pago.periodo]
                    ? prestamo.pagos[pago.periodo].toDate().toLocaleDateString('es-MX')
                    : 'Pendiente';

                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${pago.periodo}</td>
                    <td>${pago.fechaProgramada.toLocaleDateString('es-MX')}</td>
                    <td>${toDecimal(pago.saldoInicial)}</td>
                    <td>${pago.interes.toFixed(2)}</td>
                    <td>${toDecimal(pago.amortizacionCapital)}</td>
                    <td>${toDecimal(pago.cuotaTotal)}</td>
                    <td>${toDecimal(pago.saldoFinal)}</td>
                    <td>${fechaPagoReal}</td>
                    <td>
                        ${fechaPagoReal === 'Pendiente' ? `<button class="btn btn-success btn-small" onclick="registrarPago('${prestamo.id}', ${pago.periodo})">Pagar</button>` : 'Pagado'}
                    </td>
                `;
                this.tablaAmortizacionBody.appendChild(row);
            });

            this.showLoading(false);
        } catch (error) {
            this.showLoading(false);
            this.toast.error(`Error al mostrar la tabla de amortización: ${error.message}`);
        }

        window.registrarPago = async (prestamoId, periodo) => {
            try {
                await this.prestamoService.realizarPago(prestamoId, periodo);
                this.toast.success('Pago registrado correctamente.');
                await this.mostrarTablaAmortizacion(prestamoId);
            } catch (error) {
                this.toast.error(`Error al registrar el pago: ${error.message}`);
            }
        };
    }

    limpiarVista() {
        this.infoPrestamoDiv.innerHTML = '';
        this.tablaAmortizacionBody.innerHTML = '';
    }
}

export default FormAmortizacion;
