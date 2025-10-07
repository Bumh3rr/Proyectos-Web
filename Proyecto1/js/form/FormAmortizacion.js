class FormAmortizacion {
    constructor(toast, showLoading, prestamoService) {
        this.prestamoService = prestamoService;
        this.prestamoAmortizacionSelect = document.getElementById('prestamoAmortizacion');
        this.tablaAmortizacionBody = document.querySelector('#tablaAmortizacion tbody');
        this.infoPrestamoDiv = document.getElementById('infoPrestamo');
        this.toast = toast
        this.showLoading = showLoading;
        
        // Referencias para PDF
        this.pdfGeneratorContainer = document.getElementById('pdfGeneratorContainer');
        this.nombreClientePDFInput = document.getElementById('nombreClientePDF');
        this.btnGenerarPDF = document.getElementById('btnGenerarPDF');
        this.pdfPreviewContainer = document.getElementById('pdfPreviewContainer');
        this.pdfPreview = document.getElementById('pdfPreview');
        
        // Datos actuales del préstamo y tabla
        this.currentPrestamo = null;
        this.currentTabla = null;
        
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
        
        // Event listener para el botón de generar PDF
        this.btnGenerarPDF.addEventListener('click', () => {
            this.generarPDF();
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

            // Guardar datos actuales para PDF
            this.currentPrestamo = prestamo;
            this.currentTabla = tabla;

            this.infoPrestamoDiv.innerHTML = `
                <h4>Información del Préstamo</h4>
                <p><strong>Cliente:</strong> ${prestamo.nombreCliente}</p>
                <p><strong>Monto:</strong> ${prestamo.monto.toFixed(2)}</p>
                <p><strong>Tasa:</strong> ${prestamo.tasaInteres}%</p>
                <p><strong>Cuota Mensual:</strong> ${prestamo.cuotaMensual.toFixed(2)}</p>
            `;

            // Mostrar contenedor de PDF y cargar nombre del cliente
            this.pdfGeneratorContainer.style.display = 'block';
            this.nombreClientePDFInput.value = prestamo.nombreCliente;
            this.pdfPreviewContainer.style.display = 'none';

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
        this.pdfGeneratorContainer.style.display = 'none';
        this.pdfPreviewContainer.style.display = 'none';
        this.currentPrestamo = null;
        this.currentTabla = null;
    }
    
    generarPDF() {
        if (!this.currentPrestamo || !this.currentTabla) {
            this.toast.error('No hay datos de préstamo disponibles para generar el PDF.');
            return;
        }

        try {
            // Obtener jsPDF del namespace global
            const { jsPDF } = window.jspdf;
            const doc = new jsPDF();

            const prestamo = this.currentPrestamo;
            const tabla = this.currentTabla;

            // Configuración del documento
            const pageWidth = doc.internal.pageSize.getWidth();
            const pageHeight = doc.internal.pageSize.getHeight();
            let yPosition = 20;

            // Logo (placeholder si no existe)
            // Como no hay logo en el proyecto, agregamos un texto placeholder
            doc.setFontSize(24);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(26, 42, 108); // Color primario del proyecto
            doc.text('Crédito Fácil', pageWidth / 2, yPosition, { align: 'center' });
            yPosition += 15;

            // Título
            doc.setFontSize(16);
            doc.setFont('helvetica', 'normal');
            doc.setTextColor(0, 0, 0);
            doc.text('Tabla de Amortización', pageWidth / 2, yPosition, { align: 'center' });
            yPosition += 15;

            // Información del préstamo
            doc.setFontSize(10);
            doc.setFont('helvetica', 'bold');
            doc.text('Información del Préstamo', 14, yPosition);
            yPosition += 7;

            doc.setFont('helvetica', 'normal');
            doc.text(`Cliente: ${prestamo.nombreCliente}`, 14, yPosition);
            yPosition += 6;
            doc.text(`Monto: $${prestamo.monto.toFixed(2)}`, 14, yPosition);
            yPosition += 6;
            doc.text(`Tasa de Interés: ${prestamo.tasaInteres}%`, 14, yPosition);
            yPosition += 6;
            doc.text(`Cuota Mensual: $${prestamo.cuotaMensual.toFixed(2)}`, 14, yPosition);
            yPosition += 6;
            doc.text(`Plazo: ${prestamo.plazo} meses`, 14, yPosition);
            yPosition += 10;

            // Preparar datos de la tabla (sin la columna de cuota física/acciones)
            const tableData = tabla.map(pago => {
                const estaPagado = prestamo.pagos && prestamo.pagos[pago.periodo];
                const fechaPago = estaPagado 
                    ? prestamo.pagos[pago.periodo].toDate().toLocaleDateString('es-MX')
                    : 'Pendiente';

                return [
                    pago.periodo,
                    pago.fechaProgramada.toLocaleDateString('es-MX'),
                    `$${pago.saldoInicial.toFixed(2)}`,
                    `$${pago.interes.toFixed(2)}`,
                    `$${pago.amortizacionCapital.toFixed(2)}`,
                    `$${pago.cuotaTotal.toFixed(2)}`,
                    `$${pago.saldoFinal.toFixed(2)}`,
                    fechaPago
                ];
            });

            // Generar tabla con autoTable
            doc.autoTable({
                startY: yPosition,
                head: [[
                    'Período',
                    'Fecha Prog.',
                    'Saldo Inicial',
                    'Interés',
                    'Capital',
                    'Cuota Total',
                    'Saldo Final',
                    'Fecha Pago'
                ]],
                body: tableData,
                styles: {
                    fontSize: 8,
                    cellPadding: 2
                },
                headStyles: {
                    fillColor: [26, 42, 108], // Color primario
                    textColor: [255, 255, 255],
                    fontStyle: 'bold'
                },
                alternateRowStyles: {
                    fillColor: [245, 245, 245]
                },
                margin: { top: 10, left: 14, right: 14 },
                columnStyles: {
                    0: { cellWidth: 15 },
                    1: { cellWidth: 22 },
                    2: { cellWidth: 25 },
                    3: { cellWidth: 20 },
                    4: { cellWidth: 20 },
                    5: { cellWidth: 22 },
                    6: { cellWidth: 25 },
                    7: { cellWidth: 22 }
                }
            });

            // Generar el PDF como blob y mostrarlo en el iframe
            const pdfBlob = doc.output('blob');
            const pdfUrl = URL.createObjectURL(pdfBlob);
            this.pdfPreview.src = pdfUrl;
            this.pdfPreviewContainer.style.display = 'block';

            this.toast.success('PDF generado exitosamente.');
        } catch (error) {
            console.error('Error al generar PDF:', error);
            this.toast.error(`Error al generar el PDF: ${error.message}`);
        }
    }
}

export default FormAmortizacion;
