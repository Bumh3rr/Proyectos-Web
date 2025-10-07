class FormAmortizacion {
    constructor(toast, showLoading, prestamoService) {
        this.prestamoService = prestamoService;
        this.prestamoAmortizacionSelect = document.getElementById('prestamoAmortizacion');
        this.tablaAmortizacionBody = document.querySelector('#tablaAmortizacion tbody');
        this.infoPrestamoDiv = document.getElementById('infoPrestamo');
        this.btnGenerarPDF = document.getElementById('btnGenerarPDF');
        this.pdfViewer = document.getElementById('pdfViewer');
        this.pdfIframe = document.getElementById('pdfIframe');
        this.toast = toast
        this.showLoading = showLoading;
        
        // Store current loan and amortization table data
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
        
        // Event listener for PDF generation button
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
            
            // Store current data for PDF generation
            this.currentPrestamo = prestamo;
            this.currentTabla = tabla;
            
            // Show PDF button
            this.btnGenerarPDF.style.display = 'inline-block';

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
        this.btnGenerarPDF.style.display = 'none';
        this.pdfViewer.style.display = 'none';
        this.currentPrestamo = null;
        this.currentTabla = null;
    }
    
    async generarPDF() {
        if (!this.currentPrestamo || !this.currentTabla) {
            this.toast.error('No hay datos para generar el PDF');
            return;
        }

        try {
            this.showLoading(true);
            
            const { jsPDF } = window.jspdf;
            const doc = new jsPDF();
            
            const prestamo = this.currentPrestamo;
            const tabla = this.currentTabla;
            const tasaMensual = (prestamo.tasaInteres / 100) / 12;
            
            // Load and add logo
            const logoPath = 'img/logo.svg';
            let logoLoaded = false;
            
            try {
                const response = await fetch(logoPath);
                const svgText = await response.text();
                const logoDataUrl = 'data:image/svg+xml;base64,' + btoa(svgText);
                
                // Add logo centered at top
                doc.addImage(logoDataUrl, 'SVG', 85, 10, 40, 16);
                logoLoaded = true;
            } catch (error) {
                console.warn('No se pudo cargar el logo, continuando sin él');
            }
            
            const startY = logoLoaded ? 35 : 20;
            
            // Title
            doc.setFontSize(18);
            doc.setFont(undefined, 'bold');
            doc.text('Tabla de Amortización', 105, startY, { align: 'center' });
            
            // Client name
            doc.setFontSize(12);
            doc.setFont(undefined, 'normal');
            doc.text(`Cliente: ${prestamo.nombreCliente}`, 14, startY + 10);
            
            // Loan parameters section
            doc.setFontSize(11);
            doc.setFont(undefined, 'bold');
            doc.text('Parámetros del Préstamo:', 14, startY + 20);
            
            doc.setFont(undefined, 'normal');
            doc.text(`Monto: $${prestamo.monto.toLocaleString('es-MX', {minimumFractionDigits: 2, maximumFractionDigits: 2})}`, 14, startY + 27);
            doc.text(`Tasa de Interés Anual: ${prestamo.tasaInteres}%`, 14, startY + 33);
            doc.text(`Plazo: ${prestamo.plazo} meses`, 14, startY + 39);
            doc.text(`Tasa de Interés Mensual: ${(tasaMensual * 100).toFixed(4)}%`, 14, startY + 45);
            
            // Prepare table data
            const tableData = tabla.map(pago => [
                pago.periodo,
                pago.saldoInicial.toLocaleString('es-MX', {minimumFractionDigits: 2, maximumFractionDigits: 2}),
                pago.interes.toLocaleString('es-MX', {minimumFractionDigits: 2, maximumFractionDigits: 2}),
                pago.amortizacionCapital.toLocaleString('es-MX', {minimumFractionDigits: 2, maximumFractionDigits: 2}),
                pago.cuotaTotal.toLocaleString('es-MX', {minimumFractionDigits: 2, maximumFractionDigits: 2}),
                pago.saldoFinal.toLocaleString('es-MX', {minimumFractionDigits: 2, maximumFractionDigits: 2})
            ]);
            
            // Calculate totals
            const totalInteres = tabla.reduce((sum, pago) => sum + pago.interes, 0);
            const totalAmortizacion = tabla.reduce((sum, pago) => sum + pago.amortizacionCapital, 0);
            const totalCuota = tabla.reduce((sum, pago) => sum + pago.cuotaTotal, 0);
            
            // Add totals row
            tableData.push([
                { content: 'TOTALES', styles: { fontStyle: 'bold', halign: 'center' } },
                '',
                { content: totalInteres.toLocaleString('es-MX', {minimumFractionDigits: 2, maximumFractionDigits: 2}), styles: { fontStyle: 'bold' } },
                { content: totalAmortizacion.toLocaleString('es-MX', {minimumFractionDigits: 2, maximumFractionDigits: 2}), styles: { fontStyle: 'bold' } },
                { content: totalCuota.toLocaleString('es-MX', {minimumFractionDigits: 2, maximumFractionDigits: 2}), styles: { fontStyle: 'bold' } },
                ''
            ]);
            
            // Generate table using autoTable
            doc.autoTable({
                startY: startY + 52,
                head: [['Período', 'Saldo Inicial', 'Interés', 'Amortización (Capital)', 'Cuota Total', 'Saldo Final']],
                body: tableData,
                theme: 'striped',
                headStyles: {
                    fillColor: [37, 99, 235],
                    textColor: 255,
                    fontStyle: 'bold',
                    halign: 'center'
                },
                bodyStyles: {
                    fontSize: 9,
                    halign: 'right'
                },
                columnStyles: {
                    0: { halign: 'center', cellWidth: 20 }
                },
                alternateRowStyles: {
                    fillColor: [245, 247, 250]
                },
                margin: { top: 10, left: 14, right: 14 }
            });
            
            // Generate PDF as blob URL
            const pdfBlob = doc.output('blob');
            const pdfUrl = URL.createObjectURL(pdfBlob);
            
            // Display in iframe
            this.pdfIframe.src = pdfUrl;
            this.pdfViewer.style.display = 'block';
            
            // Scroll to PDF viewer
            this.pdfViewer.scrollIntoView({ behavior: 'smooth', block: 'start' });
            
            this.showLoading(false);
            this.toast.success('PDF generado exitosamente');
            
        } catch (error) {
            this.showLoading(false);
            this.toast.error('Error al generar el PDF: ' + error.message);
            console.error('Error generando PDF:', error);
        }
    }
}

export default FormAmortizacion;
