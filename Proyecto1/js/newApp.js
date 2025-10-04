// Imports
import ClienteService from './services/ClienteService.js';

class PrestamoApp {

    constructor() {
        this.clienteService = new ClienteService();
        this.toast = new Notyf({
            duration: 3000,
            position: {
                x: 'right',
                y: 'top',
            },
            types: [
                {
                    type: 'warning',
                    background: 'orange',
                    icon: {
                        className: 'material-icons',
                        tagName: 'i',
                        text: 'warning'
                    }
                },
                {
                    type: 'error',
                    background: 'indianred',
                    duration: 2000,
                    dismissible: true
                }
            ]
        });
        this.initEventListeners();
        this.cargarClientes();
    }

    initEventListeners() {
        this.installEventoManejoPestanas(); // <- Evento de Manejo de pestañas
        this.installEventRegistrarCliente(); // <- Evento para registrar cliente
        this.installEventShowModalEditarCliente(); // <- Evento para mostrar modal de edición de cliente
        this.installEventEliminarCliente(); // <- Evento para eliminar cliente
    }

    // Evento de Manejo de pestañas
    installEventoManejoPestanas() {
        document.addEventListener('DOMContentLoaded', function () {
            const tabs = document.querySelectorAll('.tab-button');
            const tabContents = document.querySelectorAll('.tab-content');

            tabs.forEach(tab => {
                tab.addEventListener('click', () => {
                    tabs.forEach(t => t.classList.remove('active'));
                    tabContents.forEach(c => c.classList.remove('active'));

                    tab.classList.add('active');
                    document.getElementById(tab.dataset.tab).classList.add('active');
                });
            });
        });
    }

    // RF01: Registrar nuevo cliente
    // Evento para registrar cliente
    installEventRegistrarCliente() {
        const formCliente = document.getElementById('formCliente');
        formCliente.addEventListener('submit', async (e) => {
            e.preventDefault();

            const nombre = document.getElementById('nombre').value;
            const rfc = document.getElementById('rfc').value;
            const telefono = document.getElementById('telefono').value;
            const direccion = document.getElementById('direccion').value;

            try {
                let id = await this.clienteService.createCliente(nombre, rfc, telefono, direccion);
                this.toast.success('✅ Cliente registrado exitosamente, ID: ' + id);
                formCliente.reset();

                this.cargarClientes();
            } catch (error) {
                this.toast.error('Error al registrar el cliente\n' + error.message);
            }
        });
    }

    // RF02: Mostrar lista de clientes
    // Cargar clientes y mostrarlos en la tabla
    async cargarClientes() {
        try {
            const tablaClientesBody = document.querySelector('#tablaClientes tbody');
            const listaClientes = await this.clienteService.getAllClientes();

            if (listaClientes.length === 0) {
                tablaClientesBody.innerHTML = '<tr><td colspan="6" style="text-align: center;">No hay clientes registrados</td></tr>';
                return;
            }

            tablaClientesBody.innerHTML = '';
            listaClientes.forEach(cliente => {
                console.log(cliente);
                const fecha = cliente.fechaRegistro.toLocaleDateString('es-MX');
                const row = document.createElement('tr');
                // Eliminar el contenido previo

                row.innerHTML = `
                    <td>${cliente.nombre}</td>
                    <td>${cliente.rfc}</td>
                    <td>${cliente.telefono}</td>
                    <td>${cliente.direccion}</td>
                    <td>${fecha}</td>
                    <td class="acciones_customer">
                        <button type="button" class="btn btn-outline-success" onclick="editarCliente('${cliente.id}')">Editar</button>
                        <button type="button" class="btn btn-primary btn-sm" onclick="eliminarCliente('${cliente.id}')">Eliminar</button>
                    </td>
                `;
                tablaClientesBody.appendChild(row);
            });

            // Notificación de éxito
            this.toast.success('Clientes cargados correctamente');

            // Actualizar el select de clientes en la sección de préstamos
            await this.actualizarSelectClientesFromPrestamo(listaClientes);
        } catch (error) {
            this.toast.error('Error al cargar clientes\n' + error.message);
        }
    }

    // RF03: Modificar datos de cliente
    // Evento para mostrar modal de edición de cliente
    installEventShowModalEditarCliente() {
        window.editarCliente = async (id) => {
            try {
                const cliente = await this.clienteService.getClienteById(id);

                document.getElementById('editarClienteId').value = id;
                document.getElementById('editarNombre').value = cliente.nombre;
                document.getElementById('editarRfc').value = cliente.rfc;
                document.getElementById('editarTelefono').value = cliente.telefono;
                document.getElementById('editarDireccion').value = cliente.direccion;

                // Mostrar modal
                document.getElementById('modalEditarCliente').style.display = 'block';
            } catch (error) {
                this.toast.error('Error al obtener cliente para editar\n' + error.message);
            }
        }

        const formEditarCliente = document.getElementById('formEditarCliente');
        const modalEditarCliente = document.getElementById('modalEditarCliente');
        const closeButton = document.querySelector('.close-button');

        closeButton.addEventListener('click', () => {
            modalEditarCliente.style.display = 'none';
        });
        window.addEventListener('click', (event) => {
            if (event.target == modalEditarCliente) {
                modalEditarCliente.style.display = 'none';
            }
        });

        formEditarCliente.addEventListener('submit', async (e) => {
            e.preventDefault();
            const id = document.getElementById('editarClienteId').value;

            try {
                await this.clienteService.updateCliente(id, {
                    nombre: document.getElementById('editarNombre').value,
                    rfc: document.getElementById('editarRfc').value,
                    telefono: document.getElementById('editarTelefono').value,
                    direccion: document.getElementById('editarDireccion').value
                });
                this.toast.success('Cliente actualizado exitosamente');
                document.getElementById('modalEditarCliente').style.display = 'none';
                this.cargarClientes();
            } catch (error) {
                this.toast.error('Error al actualizar el cliente\n' + error.message);
            }
        });
    }

    // RF04: Eliminar cliente (solo si no tiene préstamos activos)
    installEventEliminarCliente() {
        const btnConfirmarEliminar = document.getElementById('btnConfirmarEliminar');
        const modalConfirmarEliminar = document.getElementById('modalConfirmarEliminar');
        const btnCancelarEliminar = document.getElementById('btnCancelarEliminar');
        let clienteAEliminarId = null;
        window.eliminarCliente = async (id) => {
            try {
                // Verificar si tiene préstamos activos
                const isValidDelete = this.clienteService.validarEliminarCliente(id);
                if (!isValidDelete) {
                    this.toast.error('No se puede eliminar el cliente porque tiene préstamos activos');
                    return;
                }

                clienteAEliminarId = id;
                modalConfirmarEliminar.style.display = 'block';

            } catch (error) {
                this.toast.error('Error al intentar eliminar el cliente\n' + error.message);
            }
        }

        btnCancelarEliminar.addEventListener('click', () => {
            modalConfirmarEliminar.style.display = 'none';
        });

        btnConfirmarEliminar.addEventListener('click', async () => {
            try {
                await this.clienteService.eliminarCliente(clienteAEliminarId);
                this.toast.success('Cliente eliminado exitosamente');
                this.cargarClientes();
            } catch (error) {
                this.toast.error('Error al eliminar el cliente\n' + error.message);
            }
            modalConfirmarEliminar.style.display = 'none';
            clienteAEliminarId = null;
        });

    }

    async actualizarSelectClientesFromPrestamo(listaClientes) {
        const selectCliente = document.getElementById('clientePrestamo');
        selectCliente.innerHTML = '<option value="">Seleccione un cliente...</option>';

        try {
            listaClientes.forEach(cliente => {
                const option = document.createElement('option');
                option.value = cliente.id;
                option.textContent = `${cliente.nombre} (${cliente.rfc})`;
                selectCliente.appendChild(option);
            });
        } catch (error) {
            console.error('Error al cargar clientes en select:', error);
        }
    }

}

// Inicializar la aplicación
const app = new PrestamoApp();
window.app = app; // <- Hacerla global para los event listeners