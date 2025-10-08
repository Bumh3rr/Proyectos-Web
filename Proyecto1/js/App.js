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

                const imageToBase64 = async (url) => {
                  const response = await fetch(url);
                  const blob = await response.blob();
                  return new Promise((resolve, reject) => {
                    const reader = new FileReader();
                    reader.onloadend = () => resolve(reader.result);
                    reader.onerror = reject;
                    reader.readAsDataURL(blob);
                  });
                };

                const logoUrl = '../logo.png';
                let logoBase64 = null;
                try {
                  logoBase64 = await imageToBase64(logoUrl);
                } catch (error) {
                  console.error("Error al cargar el logo:", error);
                }


                const prestamo = await app.prestamoService.getPrestamoById(
                  prestamoId
                );
                const idCliente = prestamo.clienteId || prestamo.idCliente;
                if (!idCliente) {
                  throw new Error(
                    "El préstamo no tiene asociado un clienteId o idCliente."
                  );
                }
                const cliente = await app.clienteService.getClienteById(
                  idCliente
                );

                const { jsPDF } = window.jspdf;
                const doc = new jsPDF();
                const pageHeight = doc.internal.pageSize.height;
                const pageWidth = doc.internal.pageSize.width;

                // --- ENCABEZADO ---
                if (logoBase64) {
                  doc.addImage(logoBase64, 'PNG', 15, 15, 30, 15);
                }
                doc.setFont("helvetica", "bold");
                doc.setFontSize(20);
                doc.setTextColor(40, 40, 40);
                doc.text("Reporte de Amortización", pageWidth / 2, 22, {
                  align: "center",
                });

                doc.setLineWidth(0.5);
                doc.setDrawColor(44, 62, 80);
                doc.line(20, 35, pageWidth - 20, 35);

                // --- INFORMACIÓN DEL PRÉSTAMO ---
                doc.setFont("helvetica", "normal");
                doc.setFontSize(11);
                doc.setTextColor(80, 80, 80);

                const infoCliente = `Cliente: ${
                  cliente.nombre || cliente.nombreCliente || "N/D"
                }`;
                const infoRFC = `RFC: ${cliente.rfc || "N/D"}`;
                doc.text(infoCliente, 20, 45);
                doc.text(infoRFC, pageWidth - 20, 45, { align: "right" });

                const monto = parseFloat(prestamo.monto) || 0;
                const tasa = parseFloat(prestamo.tasaInteres) || 0;
                const plazo = parseInt(prestamo.plazo, 10) || 0;

                const infoMonto = `Monto del Préstamo: ${monto.toLocaleString(
                  "es-MX",
                  {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  }
                )}`;
                const infoTasa = `Tasa de Interés Anual: ${tasa}%`;
                const infoPlazo = `Plazo: ${plazo} meses`;

                doc.text(infoMonto, 20, 55);
                doc.text(infoTasa, pageWidth / 2, 55, { align: "center" });
                doc.text(infoPlazo, pageWidth - 20, 55, { align: "right" });

                // --- TABLA DE AMORTIZACIÓN ---
                const tablaAmortizacion =
                  app.prestamoService.generarTablaAmortizacion(prestamo);
                const head = [
                  [
                    "#",
                    "Fecha",
                    "Saldo Inicial",
                    "Interés",
                    "Capital",
                    "Cuota",
                    "Saldo Final",
                  ],
                ];
                const body = tablaAmortizacion.map((pago) => [
                  pago.periodo,
                  pago.fechaProgramada instanceof Date
                    ? pago.fechaProgramada.toLocaleDateString("es-ES")
                    : pago.fechaProgramada,
                  `${pago.saldoInicial.toLocaleString("es-MX", {
                    minimumFractionDigits: 2,
                  })}`,
                  `${pago.interes.toLocaleString("es-MX", {
                    minimumFractionDigits: 2,
                  })}`,
                  `${pago.amortizacionCapital.toLocaleString("es-MX", {
                    minimumFractionDigits: 2,
                  })}`,
                  `${pago.cuotaTotal.toLocaleString("es-MX", {
                    minimumFractionDigits: 2,
                  })}`,
                  `${pago.saldoFinal.toLocaleString("es-MX", {
                    minimumFractionDigits: 2,
                  })}`,
                ]);

                doc.autoTable({
                  head: head,
                  body: body,
                  startY: 65,
                  theme: "grid", // 'striped', 'grid', 'plain'
                  headStyles: {
                    fillColor: [44, 62, 80], // Color de fondo del encabezado
                    textColor: [255, 255, 255], // Color del texto del encabezado
                    fontStyle: "bold",
                  },
                  alternateRowStyles: {
                    fillColor: [245, 245, 245], // Color de fondo de filas alternas
                  },
                  styles: {
                    cellPadding: 3,
                    fontSize: 9,
                    valign: "middle",
                    halign: "center",
                  },
                  columnStyles: {
                    2: { halign: "right" },
                    3: { halign: "right" },
                    4: { halign: "right" },
                    5: { halign: "right" },
                    6: { halign: "right" },
                  },
                });

                // --- PIE DE PÁGINA ---
                const pageCount = doc.internal.getNumberOfPages();
                for (let i = 1; i <= pageCount; i++) {
                  doc.setPage(i);
                  doc.setFont("helvetica", "italic");
                  doc.setFontSize(8);
                  doc.setTextColor(150, 150, 150);

                  const fechaGeneracion = new Date().toLocaleDateString(
                    "es-ES",
                    {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    }
                  );

                  doc.text(
                    `Generado el ${fechaGeneracion}`,
                    20,
                    pageHeight - 10
                  );
                  doc.text(
                    `Página ${i} de ${pageCount}`,
                    pageWidth - 20,
                    pageHeight - 10,
                    { align: "right" }
                  );
                }

                // --- MOSTRAR PDF ---
                const pdfData = doc.output("datauristring");
                pdfViewer.src = pdfData;
                modalPdf.style.display = "block";
              } catch (error) {
                console.error("Error al generar el PDF:", error);
                app.toast.error(
                  error.message || "Ocurrió un error al generar el PDF."
                );
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
            app.formReportes.cargarResumenFinanciero();
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
