import { initializeApp } from "https://www.gstatic.com/firebasejs/10.10.0/firebase-app.js";
import { getFirestore, collection, addDoc, getDocs, query, orderBy, doc, getDoc, updateDoc, deleteDoc, where, Timestamp } from "https://www.gstatic.com/firebasejs/10.10.0/firebase-firestore.js";

const firebaseConfig = {
    apiKey: "AIzaSyCN525uEX6vJ7eC4hmpXCeeXWQPuD6kKJk",
    authDomain: "prueba-crud-3dfce.firebaseapp.com",
    projectId: "prueba-crud-3dfce",
    storageBucket: "prueba-crud-3dfce.firebasestorage.app",
    messagingSenderId: "710530342207",
    appId: "1:710530342207:web:626ca4f6cd5c17e1e4078a",
};

// Inicializar Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// ==========================================
// REFERENCIAS A LAS COLECCIONES
// ==========================================
const clientesRef = collection(db, 'clientes');
const prestamosRef = collection(db, 'prestamos');
const amortizacionRef = collection(db, 'amortizacion');
const pagosRef = collection(db, 'pagos');
const formCliente = document.getElementById('formCliente');
const tablaClientesBody = document.querySelector('#tablaClientes tbody');


// RF03: Modificar datos de cliente (excepto ID)
const modalEditarCliente = document.getElementById('modalEditarCliente');
const formEditarCliente = document.getElementById('formEditarCliente');
const closeButton = document.querySelector('.close-button');

// RF03: Modificar datos de cliente (excepto ID)
window.editarCliente = async function(id) {
    try {
        const clienteDoc = doc(db, "clientes", id);
        const docSnap = await getDoc(clienteDoc);
        const cliente = docSnap.data();

        document.getElementById('editarClienteId').value = id;
        document.getElementById('editarNombre').value = cliente.nombre;
        document.getElementById('editarRfc').value = cliente.rfc;
        document.getElementById('editarTelefono').value = cliente.telefono;
        document.getElementById('editarDireccion').value = cliente.direccion;

        modalEditarCliente.style.display = 'block';
    } catch (error) {
        console.error('Error al obtener cliente para editar:', error);
    }
}

closeButton.addEventListener('click', () => {
    modalEditarCliente.style.display = 'none';
});

window.addEventListener('click', (event) => {
    if (event.target == modalEditarCliente) {
        modalEditarCliente.style.display = 'none';
    }
});

formEditarCliente.addEventListener('submit', async function(e) {
    e.preventDefault();
    const id = document.getElementById('editarClienteId').value;
    const clienteDoc = doc(db, "clientes", id);

    try {
        await updateDoc(clienteDoc, {
            nombre: document.getElementById('editarNombre').value,
            rfc: document.getElementById('editarRfc').value,
            telefono: document.getElementById('editarTelefono').value,
            direccion: document.getElementById('editarDireccion').value
        });
        alert('✅ Cliente actualizado');
        modalEditarCliente.style.display = 'none';
        cargarClientes();
    } catch (error) {
        console.error('Error al actualizar cliente:', error);
        alert('❌ Error al actualizar el cliente');
    }
});

// RF04: Eliminar cliente (solo si no tiene préstamos activos)
const modalConfirmarEliminar = document.getElementById('modalConfirmarEliminar');
const btnConfirmarEliminar = document.getElementById('btnConfirmarEliminar');
const btnCancelarEliminar = document.getElementById('btnCancelarEliminar');
let clienteAEliminarId = null;

// RF04: Eliminar cliente (solo si no tiene préstamos activos)
window.eliminarCliente = async function(id) {
    try {
        // Verificar si tiene préstamos activos
        const q = query(prestamosRef, where('idCliente', '==', id), where('estado', '==', 'Activo'));
        const prestamos = await getDocs(q);
        
        if (!prestamos.empty) {
            alert('❌ No se puede eliminar el cliente porque tiene préstamos activos');
            return;
        }

        clienteAEliminarId = id;
        modalConfirmarEliminar.style.display = 'block';

    } catch (error) {
        console.error('Error al verificar préstamos del cliente:', error);
        alert('❌ Error al intentar eliminar el cliente');
    }
}

btnCancelarEliminar.addEventListener('click', () => {
    modalConfirmarEliminar.style.display = 'none';
});

btnConfirmarEliminar.addEventListener('click', async () => {
    if (clienteAEliminarId) {
        try {
            const clienteDoc = doc(db, "clientes", clienteAEliminarId);
            await deleteDoc(clienteDoc);
            alert('✅ Cliente eliminado');
            cargarClientes();
        } catch (error) {
            console.error('Error al eliminar cliente:', error);
            alert('❌ Error al eliminar el cliente');
        }
        modalConfirmarEliminar.style.display = 'none';
        clienteAEliminarId = null;
    }
});

// RF05: Búsqueda de clientes
const buscarClienteInput = document.getElementById('buscarClienteInput');

buscarClienteInput.addEventListener('keyup', () => {
    const termino = buscarClienteInput.value.toLowerCase();
    const rows = tablaClientesBody.getElementsByTagName('tr');

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

// Actualizar select de clientes en formulario de préstamos
async function actualizarSelectClientes() {
    const selectCliente = document.getElementById('clientePrestamo');
    selectCliente.innerHTML = '<option value="">Seleccione un cliente...</option>';

    try {
        const q = query(clientesRef, orderBy('nombre'));
        const snapshot = await getDocs(q);
        snapshot.forEach(doc => {
            const cliente = doc.data();
            const option = document.createElement('option');
            option.value = doc.id;
            option.textContent = `${cliente.nombre} (${cliente.rfc})`;
            selectCliente.appendChild(option);
        });
    } catch (error) {
        console.error('Error al cargar clientes en select:', error);
    }
}

// ==========================================
// GESTIÓN DE AMORTIZACIÓN
// ==========================================
const prestamoAmortizacionSelect = document.getElementById('prestamoAmortizacion');
const tablaAmortizacionBody = document.querySelector('#tablaAmortizacion tbody');
const infoPrestamoDiv = document.getElementById('infoPrestamo');

async function cargarPrestamosEnSelect() {
    prestamoAmortizacionSelect.innerHTML = '<option value="">Seleccione un préstamo...</option>';
    try {
        const q = query(prestamosRef, where('estado', '==', 'Activo'), orderBy('fechaCreacion', 'desc'));
        const snapshot = await getDocs(q);
        snapshot.forEach(doc => {
            const prestamo = doc.data();
            const option = document.createElement('option');
            option.value = doc.id;
            option.textContent = `${prestamo.nombreCliente} - ${prestamo.monto.toFixed(2)} (${prestamo.plazo} meses)`;
            prestamoAmortizacionSelect.appendChild(option);
        });
    } catch (error) {
        console.error('Error al cargar préstamos en select:', error);
    }
}

prestamoAmortizacionSelect.addEventListener('change', async function() {
    const prestamoId = this.value;
    if (!prestamoId) {
        tablaAmortizacionBody.innerHTML = '';
        infoPrestamoDiv.innerHTML = '';
        return;
    }

    try {
        const prestamoDoc = await getDoc(doc(db, "prestamos", prestamoId));
        if (!prestamoDoc.exists()) return;

        const prestamo = prestamoDoc.data();
        
        // Mostrar información del préstamo
        infoPrestamoDiv.innerHTML = `
            <h4>Información del Préstamo</h4>
            <p><strong>Cliente:</strong> ${prestamo.nombreCliente}</p>
            <p><strong>Monto:</strong> ${prestamo.monto.toFixed(2)}</p>
            <p><strong>Tasa:</strong> ${prestamo.tasaInteres}% anual</p>
            <p><strong>Plazo:</strong> ${prestamo.plazo} meses</p>
            <p><strong>Cuota Mensual:</strong> ${prestamo.cuotaMensual.toFixed(2)}</p>
        `;

        // Generar y mostrar tabla de amortización
        generarTablaAmortizacion(prestamo, prestamoId);

    } catch (error) {
        console.error('Error al obtener el préstamo:', error);
    }
});

async function generarTablaAmortizacion(prestamo, prestamoId) {
    tablaAmortizacionBody.innerHTML = '';
    let saldoRestante = prestamo.monto;
    const tasaMensual = (prestamo.tasaInteres / 100) / 12;

    const qPagos = query(pagosRef, where('prestamoId', '==', prestamoId));
    const pagosSnapshot = await getDocs(qPagos);
    const pagos = {};
    pagosSnapshot.forEach(doc => {
        const pago = doc.data();
        pagos[pago.periodo] = pago;
    });

    for (let i = 1; i <= prestamo.plazo; i++) {
        const interes = saldoRestante * tasaMensual;
        const capital = prestamo.cuotaMensual - interes;
        saldoRestante -= capital;

        const fechaPagoProgramada = new Date(prestamo.fechaDesembolso.toDate());
        fechaPagoProgramada.setMonth(fechaPagoProgramada.getMonth() + i);

        const pago = pagos[i];
        const fechaDePago = pago ? pago.fechaPago.toDate().toLocaleDateString('es-MX') : '-';
        const botonPago = pago
            ? `<button class="btn btn-success btn-small" disabled>Pagado</button>`
            : `<button class="btn btn-success btn-small" onclick="registrarPago('${prestamoId}', ${i})">Registrar Pago</button>`;


        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${i}</td>
            <td>${fechaPagoProgramada.toLocaleDateString('es-MX')}</td>
            <td>${(saldoRestante + capital).toFixed(2)}</td>
            <td>${interes.toFixed(2)}</td>
            <td>${capital.toFixed(2)}</td>
            <td>${prestamo.cuotaMensual.toFixed(2)}</td>
            <td>${saldoRestante.toFixed(2)}</td>
            <td>${fechaDePago}</td>
            <td>${botonPago}</td>
        `;
        tablaAmortizacionBody.appendChild(row);
    }
}

window.registrarPago = async function(prestamoId, periodo) {
    try {
        const confirmacion = confirm(`¿Está seguro de que desea registrar el pago para el período ${periodo}?`);
        if (!confirmacion) {
            return;
        }

        await addDoc(pagosRef, {
            prestamoId: prestamoId,
            periodo: periodo,
            fechaPago: Timestamp.now()
        });

        alert('✅ Pago registrado exitosamente');
        
        const prestamoDoc = await getDoc(doc(db, "prestamos", prestamoId));
        if (prestamoDoc.exists()) {
            const prestamo = prestamoDoc.data();
            generarTablaAmortizacion(prestamo, prestamoId);
        }

    } catch (error) {
        console.error('Error al registrar el pago:', error);
        alert('❌ Error al registrar el pago');
    }
}

// ==========================================
// GESTIÓN DE TASAS DE INTERÉS
// ==========================================
const formTasas = document.getElementById('formTasas');
const tablaTasasBody = document.querySelector('#tablaTasas tbody');

formTasas.addEventListener('submit', async function(e) {
    e.preventDefault();

    const nuevaTasa = {
        nombre: document.getElementById('tasaNombre').value,
        porcentaje: parseFloat(document.getElementById('tasaPorcentaje').value),
        descripcion: document.getElementById('tasaDescripcion').value,
    };

    try {
        await addDoc(collection(db, 'tasas'), nuevaTasa);
        alert('✅ Tasa registrada exitosamente');
        formTasas.reset();
        cargarTasas();
    } catch (error) {
        console.error('Error al registrar tasa:', error);
        alert('❌ Error al registrar la tasa');
    }
});

async function cargarTasas() {
    try {
        const q = query(collection(db, 'tasas'), orderBy('nombre'));
        const snapshot = await getDocs(q);
        tablaTasasBody.innerHTML = '';

        if (snapshot.empty) {
            tablaTasasBody.innerHTML = '<tr><td colspan="4" style="text-align: center;">No hay tasas registradas</td></tr>';
            return;
        }

        snapshot.forEach(doc => {
            const tasa = doc.data();
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${tasa.nombre}</td>
                <td>${tasa.porcentaje}%</td>
                <td>${tasa.descripcion}</td>
                <td>
                    <button class="btn btn-info btn-small" onclick="editarTasa('${doc.id}')">✏️ Editar</button>
                    <button class="btn btn-danger btn-small" onclick="eliminarTasa('${doc.id}')">🗑️ Eliminar</button>
                </td>
            `;
            tablaTasasBody.appendChild(row);
        });
    } catch (error) {
        console.error('Error al cargar tasas:', error);
    }
}

window.editarTasa = async function(id) {
    // Implementación futura
}

window.eliminarTasa = async function(id) {
    try {
        const confirmacion = confirm('¿Está seguro de que desea eliminar esta tasa?');
        if (!confirmacion) {
            return;
        }

        const tasaDoc = doc(db, "tasas", id);
        await deleteDoc(tasaDoc);

        alert('✅ Tasa eliminada exitosamente');
        cargarTasas();
    } catch (error) {
        console.error('Error al eliminar la tasa:', error);
        alert('❌ Error al eliminar la tasa');
    }
}

// ==========================================
// GESTIÓN DE PRÉSTAMOS
// ==========================================
const formPrestamo = document.getElementById('formPrestamo');
const tablaPrestamosBody = document.querySelector('#tablaPrestamos tbody');
const resultadoCalculo = document.getElementById('resultadoCalculo');

formPrestamo.addEventListener('submit', async function (e) {
    e.preventDefault();

    const idCliente = document.getElementById('clientePrestamo').value;
    const monto = parseFloat(document.getElementById('montoSolicitado').value);
    const tasaAnual = parseFloat(document.getElementById('tasaInteres').value);
    const plazo = parseInt(document.getElementById('plazoMeses').value);
    const fechaDesembolso = new Date(document.getElementById('fechaDesembolso').value);

    if (!idCliente || isNaN(monto) || isNaN(tasaAnual) || isNaN(plazo)) {
        alert('Por favor, complete todos los campos correctamente.');
        return;
    }

    const tasaMensual = (tasaAnual / 100) / 12;
    const cuotaMensual = (monto * tasaMensual) / (1 - Math.pow(1 + tasaMensual, -plazo));

    resultadoCalculo.innerHTML = `
        <h4>Cálculo de Préstamo:</h4>
        <p>Cuota Mensual Estimada: <strong>${cuotaMensual.toFixed(2)}</strong></p>
    `;

    const confirmacion = confirm(`La cuota mensual será de ${cuotaMensual.toFixed(2)}. ¿Desea crear el préstamo?`);

    if (confirmacion) {
        try {
            const clienteDoc = await getDoc(doc(db, "clientes", idCliente));
            if (!clienteDoc.exists()) {
                alert('El cliente seleccionado no existe.');
                return;
            }
            const nombreCliente = clienteDoc.data().nombre;


            await addDoc(prestamosRef, {
                idCliente: idCliente,
                nombreCliente: nombreCliente,
                monto: monto,
                tasaInteres: tasaAnual,
                plazo: plazo,
                fechaDesembolso: Timestamp.fromDate(fechaDesembolso),
                cuotaMensual: cuotaMensual,
                estado: 'Activo',
                fechaCreacion: Timestamp.now()
            });
            alert('✅ Préstamo creado exitosamente');
            formPrestamo.reset();
            resultadoCalculo.innerHTML = '';
            cargarPrestamos();
        } catch (error) {
            console.error('Error al crear el préstamo:', error);
            alert('❌ Error al crear el préstamo');
        }
    }
});

const filtroPrestamoRadios = document.querySelectorAll('input[name="filtroPrestamo"]');

filtroPrestamoRadios.forEach(radio => {
    radio.addEventListener('change', () => {
        cargarPrestamos(radio.value);
    });
});

async function cargarPrestamos(filtro = 'todos') {
    try {
        let q;
        if (filtro === 'todos') {
            q = query(prestamosRef, orderBy('fechaCreacion', 'desc'));
        } else {
            q = query(prestamosRef, where('estado', '==', filtro), orderBy('fechaCreacion', 'desc'));
        }

        const snapshot = await getDocs(q);
        tablaPrestamosBody.innerHTML = '';

        if (snapshot.empty) {
            tablaPrestamosBody.innerHTML = '<tr><td colspan="8" style="text-align: center;">No hay préstamos que coincidan con el filtro</td></tr>';
            return;
        }

        snapshot.forEach(doc => {
            const prestamo = doc.data();
            const fecha = prestamo.fechaCreacion.toDate().toLocaleDateString('es-MX');
            
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${prestamo.nombreCliente}</td>
                <td>${prestamo.monto.toFixed(2)}</td>
                <td>${prestamo.tasaInteres}%</td>
                <td>${prestamo.plazo} meses</td>
                <td>${prestamo.cuotaMensual.toFixed(2)}</td>
                <td><span class="status status-${prestamo.estado.toLowerCase()}">${prestamo.estado}</span></td>
                <td>${fecha}</td>
                <td>
                    <button class="btn btn-info btn-small" onclick="verPagos('${doc.id}')">Ver Pagos</button>
                </td>
            `;
            tablaPrestamosBody.appendChild(row);
        });
    } catch (error) {
        console.error('Error al cargar préstamos:', error);
    }
}

function verPagos(prestamoId) {
    // Cambiar a la pestaña de amortización
    document.querySelector('.tab-button[data-tab="amortizacion"]').click();

    // Seleccionar el préstamo en el dropdown
    prestamoAmortizacionSelect.value = prestamoId;

    // Disparar el evento change para cargar la tabla
    prestamoAmortizacionSelect.dispatchEvent(new Event('change'));
}