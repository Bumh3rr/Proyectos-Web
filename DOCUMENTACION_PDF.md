# Documentación: Función de Generación de PDF para Tabla de Amortización

## 📋 Resumen

Se ha implementado una funcionalidad completa para generar y visualizar PDFs de tablas de amortización en el sistema "Crédito Fácil".

## 🎯 Características Implementadas

### 1. **Botón "Generar PDF"**
- Aparece automáticamente cuando se selecciona un préstamo en la sección de Amortización
- Se oculta cuando no hay datos disponibles
- Icono: 📄 Generar PDF

### 2. **Logo de la Empresa**
- Archivo SVG creado: `Proyecto1/img/logo.svg`
- Dimensiones: 200x80px
- Colores: Azul (#2563eb) con detalles dorados (#fbbf24)
- Texto: "Crédito Fácil" con subtítulo "Sistema de Gestión de Préstamos"
- Se escala automáticamente en el PDF (40x16 unidades)

### 3. **Estructura del PDF**

El PDF generado incluye:

#### Encabezado
- Logo centrado en la parte superior
- Título: "Tabla de Amortización"

#### Información del Cliente
- Nombre completo del cliente

#### Parámetros del Préstamo
- **Monto**: Formateado como moneda (ej: $100,000.00)
- **Tasa de Interés Anual**: Porcentaje (ej: 12%)
- **Plazo**: En meses (ej: 12 meses)
- **Tasa de Interés Mensual**: Calculada y mostrada con 4 decimales (ej: 1.0000%)

#### Tabla de Amortización
Columnas:
1. **Período**: Número del mes (1, 2, 3...)
2. **Saldo Inicial**: Saldo al inicio del período
3. **Interés**: Interés del período
4. **Amortización (Capital)**: Capital pagado en el período
5. **Cuota Total**: Pago total del período
6. **Saldo Final**: Saldo al final del período

Características visuales:
- Encabezados en azul (#2563eb) con texto blanco
- Filas alternadas con fondo gris claro (#f5f7fa)
- Números alineados a la derecha
- Período centrado
- Fuente: Tamaño 9 para el contenido

#### Fila de Totales
- Última fila de la tabla
- Texto "TOTALES" en negrita y centrado
- Suma de: Interés total, Amortización total, Cuota total
- Formato en negrita para destacar

### 4. **Visualización en Iframe**
- Iframe de 600px de alto
- Aparece automáticamente al generar el PDF
- Bordes redondeados (8px)
- Borde gris (#ddd)
- Scroll automático hacia el iframe

## 💻 Implementación Técnica

### Archivos Modificados

#### 1. `Proyecto1/index.html`
```html
<!-- Librerías añadidas -->
<script src="https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js"></script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/jspdf-autotable/3.5.31/jspdf.plugin.autotable.min.js"></script>

<!-- Botón añadido -->
<button id="btnGenerarPDF" class="btn btn-primary" style="display: none;">
    📄 Generar PDF
</button>

<!-- Iframe añadido -->
<div id="pdfViewer" class="pdf-viewer-container" style="display: none;">
    <h3>Vista Previa del PDF</h3>
    <iframe id="pdfIframe" style="width: 100%; height: 600px;"></iframe>
</div>
```

#### 2. `Proyecto1/js/form/FormAmortizacion.js`

Nuevas propiedades:
```javascript
this.btnGenerarPDF = document.getElementById('btnGenerarPDF');
this.pdfViewer = document.getElementById('pdfViewer');
this.pdfIframe = document.getElementById('pdfIframe');
this.currentPrestamo = null;
this.currentTabla = null;
```

Nuevo método principal:
```javascript
async generarPDF() {
    // 1. Crear documento PDF
    // 2. Cargar y añadir logo (con manejo de errores)
    // 3. Añadir título y datos del préstamo
    // 4. Generar tabla con autoTable
    // 5. Calcular y añadir totales
    // 6. Convertir a Blob y mostrar en iframe
}
```

### Librerías Utilizadas

1. **jsPDF** (v2.5.1)
   - Generación de documentos PDF
   - Manipulación de texto e imágenes
   
2. **jsPDF-autoTable** (v3.5.31)
   - Generación automática de tablas
   - Estilos y temas predefinidos
   - Soporte para encabezados y filas con formato

## 🔧 Cómo Usar

### Para el Usuario Final

1. Navegar a la sección **"Amortización"** en el menú lateral
2. Seleccionar un préstamo del dropdown
3. Revisar la tabla de amortización mostrada
4. Hacer clic en el botón **"📄 Generar PDF"**
5. Esperar unos segundos mientras se genera el PDF
6. El PDF aparecerá automáticamente en un visor debajo del botón
7. Opcional: Hacer clic derecho en el iframe y "Guardar como..." para descargar

### Para Desarrolladores

#### Generar PDF Manualmente
```javascript
// Obtener instancia de FormAmortizacion
const formAmortizacion = app.formAmortizacion;

// Asegurarse de que hay datos cargados
if (formAmortizacion.currentPrestamo && formAmortizacion.currentTabla) {
    await formAmortizacion.generarPDF();
}
```

#### Personalizar el PDF
Para modificar el diseño del PDF, editar el método `generarPDF()` en `FormAmortizacion.js`:

- **Colores**: Modificar `fillColor` en `headStyles` y `alternateRowStyles`
- **Fuentes**: Cambiar `setFontSize()` y `setFont()`
- **Espaciado**: Ajustar valores de `startY` y `margin`
- **Logo**: Cambiar dimensiones en `addImage()`

## 📊 Ejemplo de Datos

### Entrada (Préstamo)
```javascript
{
    nombreCliente: "Juan Pérez García",
    monto: 100000,
    tasaInteres: 12,
    plazo: 12,
    cuotaMensual: 8884.88
}
```

### Salida (PDF)
- **Archivo**: Blob URL visualizable en navegador
- **Tamaño**: ~50-100KB dependiendo de la cantidad de períodos
- **Páginas**: 1-2 páginas (12 meses cabe en 1 página)
- **Orientación**: Vertical (Portrait)
- **Formato**: A4

## 🐛 Manejo de Errores

### Logo No Disponible
Si el archivo `img/logo.svg` no se puede cargar:
- El PDF se genera sin logo
- Se muestra advertencia en consola
- El resto del documento se ajusta automáticamente

### Datos Incompletos
Si no hay préstamo o tabla cargados:
- Mensaje de error: "No hay datos para generar el PDF"
- Toast notification roja
- No se genera el PDF

### Error en Generación
Si hay un error durante la generación:
- Mensaje de error específico en toast
- Error completo en consola del navegador
- El loading spinner se oculta correctamente

## 🎨 Formato de Números

Todos los valores monetarios usan formato mexicano:
```javascript
numero.toLocaleString('es-MX', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
})
```

Ejemplos:
- 100000 → "100,000.00"
- 1234.56 → "1,234.56"
- 0.01 → "0.01"

## 🚀 Mejoras Futuras (Opcionales)

1. **Botón de Descarga Directa**: Añadir botón para descargar PDF sin visor
2. **Múltiples Formatos**: Soporte para Excel o CSV
3. **Personalización de Logo**: Permitir al usuario subir su propio logo
4. **Marca de Agua**: Añadir marca "PAGADO" o "VENCIDO" según estado
5. **Gráficas**: Incluir gráfico circular o de barras con distribución de pagos
6. **Email**: Enviar PDF por correo directamente
7. **Historial**: Registro de PDFs generados
8. **Plantillas**: Múltiples diseños de PDF para elegir

## 📝 Notas de Compatibilidad

- **Navegadores**: Chrome 90+, Firefox 88+, Safari 14+, Edge 90+
- **Dispositivos Móviles**: Funciona, pero mejor experiencia en desktop
- **Impresión**: El PDF se puede imprimir directamente desde el iframe
- **Resolución**: Optimizado para pantallas 1920x1080 y superiores

## 🔒 Consideraciones de Seguridad

- Los PDFs se generan completamente en el cliente (navegador)
- No se envían datos a servidores externos
- El Blob URL es temporal y válido solo en la sesión actual
- No se almacenan copias del PDF automáticamente

## 📞 Soporte

Para problemas o preguntas sobre la funcionalidad de PDF:
1. Revisar la consola del navegador para errores específicos
2. Verificar que las librerías jsPDF estén cargadas correctamente
3. Asegurarse de que el archivo logo.svg existe en `Proyecto1/img/`
4. Verificar que hay datos de préstamo cargados antes de generar PDF
