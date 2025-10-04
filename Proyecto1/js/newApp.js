// Imports Servicios
import ClienteService from './services/ClienteService.js';
// Imports Formularios
import FormCliente from './form/FormCliente.js';

class App {
    constructor() {
        // Servicios
        this.clienteService = new ClienteService();
        // Formularios
        this.formCliente = new FormCliente(this.clienteService);

        this.installEventManejoPestana();
        this.formCliente.cargarClientes(); // <- Cargar clientes al iniciar la app
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
                    }else if (tab.dataset.tab === 'prestamos') {

                    }else if (tab.dataset.tab === 'amortizacion') {

                    }else if ( tab.dataset.tab === 'tasas') {

                    }
                });
            });
        });
    }
}


// Inicializar la aplicación
const app = new App();
window.app = app; // <- Hacerla global para los event listeners