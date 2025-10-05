// Imports Servicios
import ClienteService from './services/ClienteService.js';
import PrestamoService from './services/PrestamoService.js'; // ⬅️ AGREGAR ESTO

// Imports Formularios
import FormCliente from './form/FormCliente.js';
import FormPrestamo from './form/FormPrestamo.js';
import FormAmortizacion from './form/FormAmortizacion.js'; // ⬅️ AGREGAR ESTO

class App {
    constructor() {
        // Servicios
        this.clienteService = new ClienteService();
        this.prestamoService = new PrestamoService();
        this.formAmortizacion = new FormAmortizacion(); 
        
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
                        // Al hacer clic manual en la pestaña, se cargan todos los préstamos
                         app.formAmortizacion.init();
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

// Hacer la función verPagos global
window.verPagos = async (prestamoId, clienteId) => {
    // 1. Cambiar la pestaña activa manualmente
    document.querySelectorAll('.tab-button').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
    document.querySelector('.tab-button[data-tab="amortizacion"]').classList.add('active');
    document.getElementById('amortizacion').classList.add('active');

    // 2. Cargar el dropdown de préstamos filtrado por cliente y ESPERAR a que termine
    await app.formAmortizacion.init(clienteId);

    // 3. Ahora sí, seleccionar el préstamo en el dropdown ya cargado y filtrado
    const prestamoSelect = document.getElementById('prestamoAmortizacion');
    prestamoSelect.value = prestamoId;

    // 4. Disparar el evento change para cargar la tabla de amortización
    // (Asegurándose de que el valor se estableció correctamente)
    if (prestamoSelect.value === prestamoId) {
        prestamoSelect.dispatchEvent(new Event('change'));
    }
};