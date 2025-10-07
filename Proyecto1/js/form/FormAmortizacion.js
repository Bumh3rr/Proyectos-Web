class FormAmortizacion {
    constructor(toast, showLoading, prestamoService) {
        this.prestamoService = prestamoService;
        this.prestamoAmortizacionSelect = document.getElementById('prestamoAmortizacion');
        this.tablaAmortizacionBody = document.querySelector('#tablaAmortizacion tbody');
        this.infoPrestamoDiv = document.getElementById('infoPrestamo');
        this.toast = toast
        this.showLoading = showLoading;
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

            const toDecimal = (numero) => {
                return numero.toLocaleString('es-MX', {minimumFractionDigits: 2, maximumFractionDigits: 2});
            }


            // Encontrar el primer período pendiente de pago
            let siguientePeriodoAPagar = null;
            for (let i = 1; i <= prestamo.plazo; i++) {
                if (!prestamo.pagos || !prestamo.pagos[i]) {
                    siguientePeriodoAPagar = i;
                    break;
                }
            }

            // Fecha actual para comparaciones
            const fechaActual = new Date();
            fechaActual.setHours(0, 0, 0, 0);

            // Determinar si todo el préstamo está vencido
            const prestamoVencido = prestamo.estado === 'Vencido';

            this.tablaAmortizacionBody.innerHTML = '';
            tabla.forEach(pago => {
                const estaPagado = prestamo.pagos && prestamo.pagos[pago.periodo];
                const fechaPagoReal = estaPagado 
                    ? prestamo.pagos[pago.periodo].toDate().toLocaleDateString('es-MX')
                    : null;

                // Determinar estado del pago
                let estadoPago = 'Pendiente';
                let claseEstado = 'card-pedding-date';
                
                if (estaPagado) {
                    estadoPago = 'Pagado';
                    claseEstado = 'card-success-date';
                } else {
                    const fechaProgramada = new Date(pago.fechaProgramada);
                    fechaProgramada.setHours(0, 0, 0, 0);
                    
                    if (prestamoVencido || fechaActual > fechaProgramada) {
                        estadoPago = 'Vencido';
                        claseEstado = 'card-overdue-date';
                    }
                }

                const puedeRealizarse = pago.periodo === siguientePeriodoAPagar;

                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${pago.periodo}</td>
                    <td>${pago.fechaProgramada.toLocaleDateString('es-MX')}</td>
                    <td>${toDecimal(pago.saldoInicial)}</td>
                    <td>${pago.interes.toFixed(2)}</td>
                    <td>${toDecimal(pago.amortizacionCapital)}</td>
                    <td>${toDecimal(pago.cuotaTotal)}</td>
                    <td>${toDecimal(pago.saldoFinal)}</td>
                    
                    <td>
                        <div class="${claseEstado}">
                            ${estaPagado 
                                ? `<div class="card-body p-2">
                                    <strong>Pagado</strong><br>
                                    <span>${fechaPagoReal}</span>
                                   </div>`
                                : `<div>${estadoPago}</div>`
                            }
                        </div>
                    </td>
                    
                    <td>
                        ${this.generarBotonPago(prestamo.id, pago.periodo, estaPagado, puedeRealizarse)}
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
                this.toast.success(`Pago del período ${periodo} registrado correctamente.`);
                await this.mostrarTablaAmortizacion(prestamoId);
            } catch (error) {
                this.toast.error(`Error al registrar el pago: ${error.message}`);
            }
        };
    }

    generarBotonPago(prestamoId, periodo, estaPagado, puedeRealizarse) {
        if (estaPagado) {
            return '<span class="estado-pagado">Pagado</span>';
        }
        
        if (puedeRealizarse) {
            return `<button class="btn btn-success btn-small" onclick="registrarPago('${prestamoId}', ${periodo})" title="Pagar período ${periodo}">
                        Pagar
                    </button>`;
        }
        
        return `<button class="btn btn-secondary btn-small" disabled title="Debe pagar los períodos anteriores primero">
                    Bloqueado
                </button>`;
    }

    limpiarVista() {
        this.infoPrestamoDiv.innerHTML = '';
        this.tablaAmortizacionBody.innerHTML = '';
    }
}

export default FormAmortizacion;
