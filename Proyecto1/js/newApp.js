// Imports Servicios
import ClienteService from './services/ClienteService.js';
import PrestamoService from './services/PrestamoService.js'; // ⬅️ AGREGAR ESTO

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
        this.formCliente.cargarClientes();
    }

    installEventManejoPestana() {
        document.addEventListener('DOMContentLoaded', function () {
            const tabs = document.querySelectorAll('.tab-button');
            const tabContents = document.querySelectorAll('.tab-content');

            tabs.forEach(tab => {
                tab.addEventListener('click', () => {
                    tabs.forEach(t => t.classList.remove('active'));
                    tabContents.forEach(c => c.classList.remove('active'));

                    tab.classList.add('active');
                    document.getElementById(tab.dataset.tab).classList.add('active');
                    
                    if (tab.dataset.tab === 'clientes') {
                        app.formCliente.cargarClientes();
                    } else if (tab.dataset.tab === 'prestamos') {
                        app.formPrestamo.cargarPrestamos();
                    } else if (tab.dataset.tab === 'amortizacion') {
                        // TODO
                    } else if (tab.dataset.tab === 'tasas') {
                        // TODO
                    }
                });
            });
        });
    }
}

// Inicializar la aplicación
const app = new App();
window.app = app;