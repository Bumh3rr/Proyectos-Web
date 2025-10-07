// Imports Servicios
import ClienteService from "./services/ClienteService.js";
import PrestamoService from "./services/PrestamoService.js";

// Imports Formularios
import FormCliente from "./form/FormCliente.js";
import FormPrestamo from "./form/FormPrestamo.js";
import FormAmortizacion from "./form/FormAmortizacion.js";

import FormReportes from "./form/FormReportes.js";

class App {
  constructor() {
    // Servicios
    this.clienteService = new ClienteService();
    this.prestamoService = new PrestamoService();
    // Tost
    this.toast = new Notyf({
      duration: 3000,
      position: {
        x: "right",
        y: "top",
      },
      types: [
        {
          type: "warning",
          background: "orange",
          icon: {
            className: "material-icons",
            tagName: "i",
            text: "warning",
          },
        },
        {
          type: "error",
          background: "indianred",
          duration: 2000,
          dismissible: true,
        },
      ],
    });
    // Funcion Lambda para mostrar y ocultar loading
    this.showLoading = (isVisible) => {
      if (isVisible) {
        document.getElementById("loading").style.display = "block";
      } else {
        document.getElementById("loading").style.display = "none";
      }
    };

    // Formularios
    this.formCliente = new FormCliente(
      this.toast,
      this.showLoading,
      this.clienteService
    );
    this.formAmortizacion = new FormAmortizacion(
      this.toast,
      this.showLoading,
      this.prestamoService
    );
    this.formReportes = new FormReportes(
      this.prestamoService,
      this.showLoading
    );

    // Funcion Lambda para ver pagos desde FormPrestamo
    const lambdaVerPagos = async (id) => {
      await this.formAmortizacion.init(id);
    };
    this.formPrestamo = new FormPrestamo(
      this.toast,
      this.showLoading,
      this.prestamoService,
      this.clienteService,
      lambdaVerPagos
    );

    this.installEventManejoPestana(); //  <- Manejo de pestañas
    this.formCliente.cargarClientes(); // <- Cargar clientes al iniciar la app
    this.actualizarEstadosPrestamosAlIniciar(); // <- Actualizar estados de préstamos al iniciar
  }

  installEventManejoPestana() {
    document.addEventListener("DOMContentLoaded", function () {
      const tabs = document.querySelectorAll(".tab-button");
      const tabContents = document.querySelectorAll(".tab-content");

      tabs.forEach((tab) => {
        tab.addEventListener("click", () => {
          tabs.forEach((t) => t.classList.remove("active"));
          tabContents.forEach((c) => c.classList.remove("active"));

          tab.classList.add("active");
          document.getElementById(tab.dataset.tab).classList.add("active");

          if (tab.dataset.tab === "clientes") {
            app.formCliente.cargarClientes();
          } else if (tab.dataset.tab === "prestamos") {
            app.formPrestamo.cargarPrestamos();
            app.formPrestamo.cargarClientes();
          } else if (tab.dataset.tab === "amortizacion") {
            app.formAmortizacion.init();

            const btnGenerarPdf = document.querySelector(
              "#amortizacion .btn-primary"
            );
            const modalPdf = document.getElementById("modalPdf");
            const pdfViewer = document.getElementById("pdfViewer");
            const closeModal = modalPdf.querySelector(".close-button");

            // Evita múltiples listeners si cambias de pestañas
            btnGenerarPdf.replaceWith(btnGenerarPdf.cloneNode(true));
            const newBtnGenerarPdf = document.querySelector(
              "#amortizacion .btn-primary"
            );

            newBtnGenerarPdf.addEventListener("click", async () => {
              const prestamoId = document.getElementById(
                "prestamoAmortizacion"
              ).value;

              if (!prestamoId) {
                app.toast.error("Seleccione un préstamo para generar el PDF");
                return;
              }

              try {
                app.showLoading(true);

                // Obtener el préstamo
                const prestamo = await app.prestamoService.getPrestamoById(
                  prestamoId
                );
                console.log("Datos del préstamo:", prestamo);

                // Detectar el campo correcto del cliente
                const idCliente = prestamo.clienteId || prestamo.idCliente;

                if (!idCliente) {
                  throw new Error(
                    "El préstamo no tiene asociado un clienteId o idCliente."
                  );
                }

                // Obtener el cliente
                const cliente = await app.clienteService.getClienteById(
                  idCliente
                );
                console.log("Datos del cliente:", cliente);

                // Crear el documento PDF
                const { jsPDF } = window.jspdf;
                const doc = new jsPDF();

                // Encabezado
                doc.setFontSize(16);
                doc.text("Tabla de Amortización", 20, 20);

                doc.setFontSize(12);
                doc.text(
                  `Cliente: ${
                    cliente.nombre || cliente.nombreCliente || "N/D"
                  }`,
                  20,
                  30
                );
                doc.text(`Monto: $${prestamo.monto || 0}`, 20, 40);
                doc.text(`Tasa: ${prestamo.tasaInteres || 0}%`, 20, 50);
                doc.text(`Plazo: ${prestamo.plazo || 0} meses`, 20, 60);

                // Generar tabla de amortización
                const tablaAmortizacion =
                  app.prestamoService.generarTablaAmortizacion(prestamo);

                const head = [
                  [
                    "Período",
                    "Fecha Programada",
                    "Saldo Inicial",
                    "Interés",
                    "Capital",
                    "Cuota Total",
                    "Saldo Final",
                  ],
                ];
                const body = tablaAmortizacion.map((pago) => [
                  pago.periodo,
                  pago.fechaProgramada instanceof Date
                    ? pago.fechaProgramada.toLocaleDateString()
                    : pago.fechaProgramada,
                  pago.saldoInicial.toFixed(2),
                  pago.interes.toFixed(2),
                  pago.amortizacionCapital.toFixed(2),
                  pago.cuotaTotal.toFixed(2),
                  pago.saldoFinal.toFixed(2),
                ]);

                // Agregar tabla al PDF
                doc.autoTable({
                  head: head,
                  body: body,
                  startY: 70,
                });

                // Mostrar PDF en modal
                const pdfData = doc.output("datauristring");
                pdfViewer.src = pdfData;
                modalPdf.style.display = "block";
              } catch (error) {
                console.error("Error al generar el PDF:", error);
                app.toast.error(error.message || "Error al generar el PDF");
              } finally {
                app.showLoading(false);
              }
            });

            // Cerrar modal
            closeModal.addEventListener("click", () => {
              modalPdf.style.display = "none";
            });
          } else if (tab.dataset.tab === "reportes") {
            app.formReportes.cargarReporteVencidos();
          }
        });
      });
    });
  }

  // Actualizar estados de préstamos al iniciar la aplicación
  async actualizarEstadosPrestamosAlIniciar() {
    try {
      await this.prestamoService.actualizarTodosLosEstados();
    } catch (error) {
      console.error("Error al actualizar estados al iniciar:", error);
    }
  }
}

// Inicializar la aplicación
const app = new App();
window.app = app;
