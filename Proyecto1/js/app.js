// Imports Servicios
import ClienteService from './services/ClienteService.js';
import PrestamoService from './services/PrestamoService.js';

// Imports Formularios
import FormCliente from './form/FormCliente.js';
import FormPrestamo from './form/FormPrestamo.js';

class App {
    constructor() {
        // Servicios
        this.clienteService = new ClienteService();
        this.prestamoService = new PrestamoService();

        // Formularios
        this.formCliente = new FormCliente(this.clienteService);
        this.formPrestamo = new FormPrestamo(this.prestamoService);

        this.installEventManejoPestana();
        this.formCliente.cargarClientes(); // <- Cargar clientes al iniciar la app
    }

    installEventManejoPestana() {
        document.addEventListener('DOMContentLoaded', () => {
            const tabs = document.querySelectorAll('.tab-button');
            const tabContents = document.querySelectorAll('.tab-content');

            tabs.forEach(tab => {
                tab.addEventListener('click', () => {
                    tabs.forEach(t => t.classList.remove('active'));
                    tabContents.forEach(c => c.classList.remove('active'));

                    tab.classList.add('active');
                    document.getElementById(tab.dataset.tab).classList.add('active');

                    if (tab.dataset.tab === 'clientes') {
                        this.formCliente.cargarClientes();
                    } else if (tab.dataset.tab === 'prestamos') {
                        this.formPrestamo.cargarPrestamos();
                    } else if (tab.dataset.tab === 'amortizacion') {
                        // Lógica para la pestaña de amortización
                    } else if (tab.dataset.tab === 'tasas') {
                        // Lógica para la pestaña de tasas
                    }
                });
            });
        });
    }
}

// Inicializar la aplicación
const app = new App();
window.app = app; // <- Hacerla global para los event listeners
    // Cambiar a la pestaña de amortización
    document.querySelector('.tab-button[data-tab="amortizacion"]').click();

    // Seleccionar el préstamo en el dropdown
    prestamoAmortizacionSelect.value = prestamoId;

    // Disparar el evento change para cargar la tabla
    prestamoAmortizacionSelect.dispatchEvent(new Event('change'));
}
    // Cambiar a la pestaña de amortización
    document.querySelector('.tab-button[data-tab="amortizacion"]').click();

    // Seleccionar el préstamo en el dropdown
    prestamoAmortizacionSelect.value = prestamoId;

    // Disparar el evento change para cargar la tabla
    prestamoAmortizacionSelect.dispatchEvent(new Event('change'));
}