class FormCliente {

    constructor(toast, showLoading, clienteService) {
        this.clienteService = clienteService;
        this.toast = toast;
        this.showLoading = showLoading;
        this.formCliente = document.getElementById('formCliente');
        this.tablaClientesBody = document.querySelector('#tablaClientes tbody');
        this.modalEditCliente = document.getElementById('modalEditarCliente')
        this.loading = document.getElementById('loading');
        this.initEventListeners();
    }

    initEventListeners() {
        this.installEventRegistrarCliente(); // <- Evento para registrar cliente
        this.installEventShowModalEditarCliente(); // <- Evento para mostrar modal de edición de cliente
        this.installEventEliminarCliente(); // <- Evento para eliminar cliente
        this.installEventBuscarCliente(); // <- Evento para buscar cliente
    }

    // RF01: Registrar nuevo cliente
    // Evento para registrar cliente
    installEventRegistrarCliente() {
        this.formCliente.addEventListener('submit', async (e) => {
            e.preventDefault();

            const nombre = document.getElementById('nombre').value;
            const rfc = document.getElementById('rfc').value;
            const telefono = document.getElementById('telefono').value;
            const direccion = document.getElementById('direccion').value;

            try {
                this.loading.style.display = 'block'; // Mostrar loading
                let id = await this.clienteService.createCliente(nombre, rfc, telefono, direccion);

                this.loading.style.display = 'none'; // Ocultar loading
                this.toast.success('Cliente registrado exitosamente, ID: ' + id);
                this.formCliente.reset();

                await this.cargarClientes();
            } catch (error) {
                this.loading.style.display = 'none'; // Ocultar loading
                this.toast.error('Error al registrar el cliente\n' + error.message);
            }
        });
    }

    // RF02: Mostrar lista de clientes
    // Cargar clientes y mostrarlos en la tabla
    async cargarClientes() {
        try {
            this.showLoading(true);// Mostrar loading

            const listaClientes = await this.clienteService.getAllClientes();
            if (listaClientes.length === 0) {
                this.tablaClientesBody.innerHTML = '<tr><td colspan="6" style="text-align: center;">No hay clientes registrados</td></tr>';
                return;
            }

            this.tablaClientesBody.innerHTML = '';
            listaClientes.forEach(cliente => {
                console.log(cliente);
                const fecha = cliente.fechaRegistro.toLocaleDateString('es-MX');
                const row = document.createElement('tr');
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
                this.tablaClientesBody.appendChild(row);
            });

            this.showLoading(false) // Ocultar loading
        } catch (error) {
            this.showLoading(false) // Ocultar loading
            this.toast.error('Error al cargar clientes\n' + error.message);
        }
    }

    // RF03: Modificar datos de cliente
    // Evento para mostrar modal de edición de cliente
    installEventShowModalEditarCliente() {
        window.editarCliente = async (id) => {
            try {
                this.showLoading(true); // Mostrar loading
                const cliente = await this.clienteService.getClienteById(id);

                document.getElementById('editarClienteId').value = id;
                document.getElementById('editarNombre').value = cliente.nombre;
                document.getElementById('editarRfc').value = cliente.rfc;
                document.getElementById('editarTelefono').value = cliente.telefono;
                document.getElementById('editarDireccion').value = cliente.direccion;

                this.showLoading(false); // Ocultar loading
                this.modalEditCliente.style.display = 'block'; // Mostrar modal de edición
            } catch (error) {
                this.showLoading(false); // Ocultar loading
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
            if (event.target === modalEditarCliente) {
                modalEditarCliente.style.display = 'none';
            }
        });

        formEditarCliente.addEventListener('submit', async (e) => {
            e.preventDefault();
            const id = document.getElementById('editarClienteId').value;

            try {
                this.loading.style.display = 'block'; // Mostrar loading
                await this.clienteService.updateCliente(id, {
                    nombre: document.getElementById('editarNombre').value,
                    rfc: document.getElementById('editarRfc').value,
                    telefono: document.getElementById('editarTelefono').value,
                    direccion: document.getElementById('editarDireccion').value
                });
                this.loading.style.display = 'block'; // Mostrar loading
                this.toast.success('Cliente actualizado exitosamente'); // Notificación de éxito
                document.getElementById('modalEditarCliente').style.display = 'none'; // Ocultar modal de edición

                await this.cargarClientes(); // Recargar la lista de clientes
            } catch (error) {
                this.toast.error('Error al actualizar el cliente\n' + error.message);
                this.loading.style.display = 'none'; 
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
                this.showLoading(true); // Mostrar loading
                // Verificar si tiene préstamos activos
                const isValidDelete = this.clienteService.validarEliminarCliente(id);
                if (!isValidDelete) {
                    this.showLoading(false); // Ocultar loading
                    this.toast.error('No se puede eliminar el cliente porque tiene préstamos activos');
                    return;
                }

                clienteAEliminarId = id;
                this.showLoading(false); // Ocultar loading
                modalConfirmarEliminar.style.display = 'block';

            } catch (error) {
                this.showLoading(false); // Ocultar loading
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

    // RF05: Búsqueda de clientes
    installEventBuscarCliente() {
        const buscarClienteInput = document.getElementById('buscarClienteInput');

        buscarClienteInput.addEventListener('keyup', () => {
            const termino = buscarClienteInput.value.toLowerCase();
            const rows = this.tablaClientesBody.getElementsByTagName('tr');

            for (let i = 0; i < rows.length; i++) {
                const nombre = rows[i].getElementsByTagName('td')[0].textContent.toLowerCase();
                const rfc = rows[i].getElementsByTagName('td')[1].textContent.toLowerCase();

                if (nombre.includes(termino) || rfc.includes(termino)) {
                    rows[i].style.display = '';
                } else {
                    rows[i].style.display = 'none';
                }
            }
        });

    }

}

export default FormCliente;