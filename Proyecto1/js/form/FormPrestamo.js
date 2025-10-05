class FormPrestamo {
    constructor(prestamoService) {
        this.prestamoService = prestamoService;
        this.toast = new Notyf({
            duration: 3000,
            position: {
                x: 'right',
                y: 'top',
            }
        });
        this.formPrestamo = document.getElementById('formPrestamo');
        this.tablaPrestamosBody = document.querySelector('#tablaPrestamos tbody');
        this.resultadoCalculo = document.getElementById('resultadoCalculo');
        this.loading = document.getElementById('loading');
        this.initEventListeners();
    }

    initEventListeners() {
        this.formPrestamo.addEventListener('submit', this.handlePrestamoSubmit.bind(this));
        const filtroPrestamoRadios = document.querySelectorAll('input[name="filtroPrestamo"]');
        filtroPrestamoRadios.forEach(radio => {
            radio.addEventListener('change', () => {
                this.cargarPrestamos(radio.value);
            });
        });
    }

    async handlePrestamoSubmit(e) {
        e.preventDefault();

        const idCliente = document.getElementById('clientePrestamo').value;
        const monto = parseFloat(document.getElementById('montoSolicitado').value);
        const tasaAnual = parseFloat(document.getElementById('tasaInteres').value);
        const plazo = parseInt(document.getElementById('plazoMeses').value);
        const fechaDesembolso = new Date(document.getElementById('fechaDesembolso').value);

        try {
            this.loading.style.display = 'block';
            const { prestamoId, cuotaMensual } = await this.prestamoService.createPrestamo(idCliente, monto, tasaAnual, plazo, fechaDesembolso);
            this.loading.style.display = 'none';

            this.resultadoCalculo.innerHTML = "`
                <h4>Cálculo de Préstamo:</h4>
                <p>Cuota Mensual Estimada: <strong>${cuotaMensual.toFixed(2)}</strong></p>
            `";

            const confirmacion = confirm(`La cuota mensual será de ${cuotaMensual.toFixed(2)}. ¿Desea crear el préstamo?`);

            if(confirmacion){
                this.toast.success('Préstamo creado exitosamente, ID: ' + prestamoId);
                this.formPrestamo.reset();
                this.resultadoCalculo.innerHTML = '';
                this.cargarPrestamos();
            }

        } catch (error) {
            this.loading.style.display = 'none';
            this.toast.error('Error al crear el préstamo\n' + error.message);
        }
    }

    async cargarPrestamos(filtro = 'todos') {
        try {
            this.loading.style.display = 'block';
            const listaPrestamos = await this.prestamoService.getAllPrestamos(filtro);
            this.tablaPrestamosBody.innerHTML = '';

            if (listaPrestamos.length === 0) {
                this.tablaPrestamosBody.innerHTML = '<tr><td colspan="8" style="text-align: center;">No hay préstamos que coincidan con el filtro</td></tr>';
                this.loading.style.display = 'none';
                return;
            }

            listaPrestamos.forEach(prestamo => {
                const fecha = prestamo.fechaCreacion.toDate().toLocaleDateString('es-MX');
                const row = document.createElement('tr');
                row.innerHTML = "`
                    <td>${prestamo.nombreCliente}</td>
                    <td>${prestamo.monto.toFixed(2)}</td>
                    <td>${prestamo.tasaInteres}%</td>
                    <td>${prestamo.plazo} meses</td>
                    <td>${prestamo.cuotaMensual.toFixed(2)}</td>
                    <td><span class="status status-${prestamo.estado.toLowerCase()}">${prestamo.estado}</span></td>
                    <td>${fecha}</td>
                    <td>
                        <button class="btn btn-info btn-small" onclick="verPagos('${prestamo.id}')">Ver Pagos</button>
                    </td>
                `";
                this.tablaPrestamosBody.appendChild(row);
            });
            this.loading.style.display = 'none';
        } catch (error) {
            this.loading.style.display = 'none';
            this.toast.error('Error al cargar los préstamos\n' + error.message);
        }
    }
}

export default FormPrestamo;
