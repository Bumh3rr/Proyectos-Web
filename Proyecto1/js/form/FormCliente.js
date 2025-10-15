class FormCliente {
    constructor(toast, showLoading, clienteService) {
        this.clienteService = clienteService;
        this.toast = toast;
        this.showLoading = showLoading;
        this.formCliente = document.getElementById("formCliente");
        this.tablaClientesBody = document.querySelector("#tablaClientes tbody");
        this.modalEditCliente = document.getElementById("modalEditarCliente");
        this.paginacionContainer = document.getElementById("paginacionClientes");

        this.listaClientesCompleta = [];
        this.listaClientesFiltrada = [];
        this.currentPage = 1;
        this.rowsPerPage = 5; // Puedes ajustar este valor

        this.initEventListeners();
    }

    initEventListeners() {
        this.installEventRegistrarCliente();
        this.installEventShowModalEditarCliente();
        this.installEventEliminarCliente();
        this.installEventBuscarCliente();
        this.installEventShowModalShowCredencialCliente();
    }

    // RF01: Registrar nuevo cliente
    installEventRegistrarCliente() {
        this.formCliente.addEventListener("submit", async (e) => {
            e.preventDefault();

            const nombre = document.getElementById("nombre").value;
            const rfc = document.getElementById("rfc").value;
            const telefono = document.getElementById("telefono").value;
            const direccion = document.getElementById("direccion").value;
            const genero = document.getElementById("genero").value;

            try {
                this.showLoading(true);
                let id = await this.clienteService.createCliente(
                    nombre,
                    rfc,
                    telefono,
                    direccion,
                    genero
                );
                this.showLoading(false);

                this.toast.success("Cliente registrado exitosamente, ID: " + id);
                this.formCliente.reset();

                await this.cargarClientes(); // Recarga toda la lista
            } catch (error) {
                this.showLoading(false);
                this.toast.error("Error al registrar el cliente\n" + error.message);
            }
        });
    }

    // Cargar clientes y prepararlos para la paginación
    async cargarClientes() {
        try {
            this.showLoading(true);
            this.listaClientesCompleta = await this.clienteService.getAllClientes();
            this.listaClientesFiltrada = this.listaClientesCompleta;
            this.currentPage = 1;
            this.render();
            this.showLoading(false);
        } catch (error) {
            this.showLoading(false);
            this.toast.error("Error al cargar clientes\n" + error.message);
        }
    }

    // Renderiza la tabla y los controles de paginación
    render() {
        this.renderTable();
        this.renderPaginationControls();
    }

    // RF02: Mostrar lista paginada de clientes
    renderTable() {
        this.tablaClientesBody.innerHTML = "";

        if (this.listaClientesFiltrada.length === 0) {
            this.tablaClientesBody.innerHTML =
                '<tr><td colspan="6" style="text-align: center;">No hay clientes que coincidan con la búsqueda</td></tr>';
            return;
        }

        const startIndex = (this.currentPage - 1) * this.rowsPerPage;
        const endIndex = startIndex + this.rowsPerPage;
        const clientesPagina = this.listaClientesFiltrada.slice(
            startIndex,
            endIndex
        );

        clientesPagina.forEach((cliente) => {
            const fecha = cliente.fechaRegistro.toLocaleDateString("es-MX");
            const row = document.createElement("tr");
            row.innerHTML = `
                <td>${cliente.nombre}</td>
                <td>${cliente.genero}</td>
                <td>${cliente.rfc}</td>
                <td>${cliente.telefono}</td>
                <td>${cliente.direccion}</td>
                <td>${fecha}</td>
                <td class="acciones_customer">
                    <button type="button" class="btn btn-outline-info" onclick="verCredencial('${cliente.id}')">Ver Credencial</button>
                    <button type="button" class="btn btn-outline-success" onclick="editarCliente('${cliente.id}')">Editar</button>
                    <button type="button" class="btn btn-outline-danger" onclick="eliminarCliente('${cliente.id}')">Eliminar</button>
                </td>
            `;
            this.tablaClientesBody.appendChild(row);
        });
    }

    // Renderiza los controles de paginación
    renderPaginationControls() {
        this.paginacionContainer.innerHTML = "";
        const totalPages = Math.ceil(
            this.listaClientesFiltrada.length / this.rowsPerPage
        );

        if (totalPages <= 1) return; // No mostrar controles si solo hay una página

        const prevButton = document.createElement("button");
        prevButton.textContent = "Anterior";
        prevButton.className = "btn";
        prevButton.disabled = this.currentPage === 1;
        prevButton.addEventListener("click", () => {
            if (this.currentPage > 1) {
                this.currentPage--;
                this.render();
            }
        });

        const pageInfo = document.createElement("span");
        pageInfo.textContent = `Página ${this.currentPage} de ${totalPages}`;
        pageInfo.className = "page-info";

        const nextButton = document.createElement("button");
        nextButton.textContent = "Siguiente";
        nextButton.className = "btn";
        nextButton.disabled = this.currentPage === totalPages;
        nextButton.addEventListener("click", () => {
            if (this.currentPage < totalPages) {
                this.currentPage++;
                this.render();
            }
        });

        this.paginacionContainer.appendChild(prevButton);
        //Agrear un espacio entre los botones y el texto
        this.paginacionContainer.appendChild(document.createTextNode(" "));
        this.paginacionContainer.appendChild(pageInfo);
        this.paginacionContainer.appendChild(document.createTextNode(" "));
        this.paginacionContainer.appendChild(nextButton);
    }

    // RF03: Modificar datos de cliente
    installEventShowModalEditarCliente() {
        window.editarCliente = async (id) => {
            try {
                this.showLoading(true);
                const cliente = await this.clienteService.getClienteById(id);

                document.getElementById("editarClienteId").value = id;
                document.getElementById("editarNombre").value = cliente.nombre;
                document.getElementById("editarRfc").value = cliente.rfc;
                document.getElementById("editarTelefono").value = cliente.telefono;
                document.getElementById("editarDireccion").value = cliente.direccion;

                this.showLoading(false);
                this.modalEditCliente.style.display = "block";
            } catch (error) {
                this.showLoading(false);
                this.toast.error(
                    "Error al obtener cliente para editar\n" + error.message
                );
            }
        };

        const formEditarCliente = document.getElementById("formEditarCliente");
        const modalEditarCliente = document.getElementById("modalEditarCliente");
        const closeButton = modalEditarCliente.querySelector(".close-button");

        closeButton.addEventListener("click", () => {
            modalEditarCliente.style.display = "none";
        });
        window.addEventListener("click", (event) => {
            if (event.target === modalEditarCliente) {
                modalEditarCliente.style.display = "none";
            }
        });

        formEditarCliente.addEventListener("submit", async (e) => {
            e.preventDefault();
            const id = document.getElementById("editarClienteId").value;

            try {
                this.showLoading(true);
                await this.clienteService.updateCliente(id, {
                    nombre: document.getElementById('editarNombre').value,
                    telefono: document.getElementById('editarTelefono').value,
                    direccion: document.getElementById('editarDireccion').value
                });
                this.toast.success("Cliente actualizado exitosamente");
                modalEditarCliente.style.display = "none";

                await this.cargarClientes();
            } catch (error) {
                this.toast.error("Error al actualizar el cliente\n" + error.message);
            }finally {
                this.showLoading(false);
            }
        });
    }

    // RF04: Eliminar cliente
    installEventEliminarCliente() {
        const btnConfirmarEliminar = document.getElementById(
            "btnConfirmarEliminar"
        );
        const modalConfirmarEliminar = document.getElementById(
            "modalConfirmarEliminar"
        );
        const btnCancelarEliminar = document.getElementById("btnCancelarEliminar");
        let clienteAEliminarId = null;

        window.eliminarCliente = async (id) => {
            try {
                this.showLoading(true);
                const onDelete = await this.clienteService.validarEliminarCliente(id);

                if (!onDelete.canDelete){
                    this.toast.error(onDelete.message);
                    return;
                }

                clienteAEliminarId = id;
                modalConfirmarEliminar.style.display = "block";
            } catch (error) {
                this.toast.error("Error al intentar eliminar el cliente\n" + error.message);
            }finally {
                this.showLoading(false);
            }
        };

        btnCancelarEliminar.addEventListener("click", () => {
            modalConfirmarEliminar.style.display = "none";
        });

        btnConfirmarEliminar.addEventListener("click", async () => {
            if (clienteAEliminarId) {
                try {
                    await this.clienteService.eliminarCliente(clienteAEliminarId);
                    this.toast.success("Cliente eliminado exitosamente");
                    await this.cargarClientes(); // Recarga la lista
                } catch (error) {
                    this.toast.error("Error al eliminar el cliente\n" + error.message);
                }
                modalConfirmarEliminar.style.display = "none";
                clienteAEliminarId = null;
            }
        });
    }

    // RF05: Búsqueda de clientes
    installEventBuscarCliente() {
        const buscarClienteInput = document.getElementById("buscarClienteInput");

        buscarClienteInput.addEventListener("keyup", () => {
            const termino = buscarClienteInput.value.toLowerCase().trim();

            if (termino === "") {
                this.listaClientesFiltrada = this.listaClientesCompleta;
            } else {
                this.listaClientesFiltrada = this.listaClientesCompleta.filter(
                    (cliente) => {
                        const nombre = cliente.nombre.toLowerCase();
                        const rfc = cliente.rfc.toLowerCase();
                        return nombre.includes(termino) || rfc.includes(termino);
                    }
                );
            }

            this.currentPage = 1;
            this.render();
        });
    }

    // Imprimir lista de clientes en PDF
    imprimirClientesPDF() {
        const {jsPDF} = window.jspdf;
        const doc = new jsPDF();

        doc.text("Lista de Clientes", 20, 10);

        const tableColumn = ["Nombre", "RFC", "Teléfono", "Dirección", "Fecha Registro"];
        const tableRows = [];

        const clientesOrdenados = [...this.listaClientesFiltrada].sort((a, b) => a.nombre.localeCompare(b.nombre));

        clientesOrdenados.forEach(cliente => {
            const clienteData = [
                cliente.nombre,
                cliente.rfc,
                cliente.telefono,
                cliente.direccion,
                cliente.fechaRegistro.toLocaleDateString("es-MX")
            ];
            tableRows.push(clienteData);
        });

        doc.autoTable(tableColumn, tableRows, {startY: 20});
        const pdfOutput = doc.output('blob');
        const pdfUrl = URL.createObjectURL(pdfOutput);

        const modalPdf = document.getElementById('modalPdf');
        const pdfViewer = document.getElementById('pdfViewer');

        pdfViewer.src = pdfUrl;
        modalPdf.style.display = 'block';

        const closeButton = modalPdf.querySelector(".close-button");
        closeButton.addEventListener("click", () => {
            modalPdf.style.display = "none";
        });

        window.addEventListener("click", (event) => {
            if (event.target === modalPdf) {
                modalPdf.style.display = "none";
            }
        });
    }

    // Ver Credencial del cliente
    installEventShowModalShowCredencialCliente() {
        window.verCredencial = async (id) => {
            try {
                this.showLoading(true);
                const cliente = await this.clienteService.getClienteById(id);

                document.getElementById("editarClienteId").value = id;
                document.getElementById("editarNombre").value = cliente.nombre;
                document.getElementById("editarRfc").value = cliente.rfc;
                document.getElementById("editarTelefono").value = cliente.telefono;
                document.getElementById("editarDireccion").value = cliente.direccion;

                this.modalEditCliente.style.display = "block";
            } catch (error) {
                this.toast.error("Error al obtener cliente para editar\n" + error.message);
            }finally {
                this.showLoading(false);
            }
        };
    }
}

export default FormCliente;