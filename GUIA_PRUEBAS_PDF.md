# Guía de Pruebas - Funcionalidad de PDF

## 🧪 Cómo Probar la Funcionalidad

### Requisitos Previos

1. **Servidor Web**: El proyecto debe ejecutarse en un servidor web (no file://)
   ```bash
   # Opción 1: Python
   cd Proyecto1
   python3 -m http.server 8080
   
   # Opción 2: Node.js
   npx http-server -p 8080
   
   # Opción 3: PHP
   php -S localhost:8080
   ```

2. **Firebase Configurado**: Asegúrese de que Firebase está correctamente configurado en `js/config/firebase-config.js`

3. **Navegador Moderno**: Chrome 90+, Firefox 88+, Safari 14+, Edge 90+

### Pasos de Prueba

#### Test 1: Verificar que el botón aparece/desaparece correctamente

**Pasos:**
1. Abrir la aplicación en el navegador
2. Ir a la pestaña "Amortización"
3. **Verificar**: El botón "📄 Generar PDF" NO debe estar visible
4. Seleccionar un préstamo del dropdown
5. Esperar a que cargue la tabla
6. **Verificar**: El botón "📄 Generar PDF" DEBE aparecer
7. Cambiar la selección a "Seleccione un préstamo..."
8. **Verificar**: El botón debe desaparecer nuevamente

**Resultado Esperado:** ✅ El botón solo aparece cuando hay datos de préstamo cargados

---

#### Test 2: Generar PDF con datos válidos

**Prerequisito:** Tener al menos un préstamo creado en el sistema

**Pasos:**
1. Ir a la pestaña "Amortización"
2. Seleccionar un préstamo existente
3. Verificar que la tabla de amortización se muestra correctamente
4. Hacer clic en "📄 Generar PDF"
5. **Verificar**: Aparece un spinner de carga
6. Esperar 1-3 segundos
7. **Verificar**: Aparece un toast verde con "PDF generado exitosamente"
8. **Verificar**: Aparece un iframe con el PDF renderizado
9. **Verificar**: La página hace scroll automático al iframe

**Resultado Esperado:** ✅ PDF generado y visible en el iframe

---

#### Test 3: Validar contenido del PDF

**Pasos:**
1. Generar un PDF (seguir Test 2)
2. En el iframe del PDF, verificar la presencia de:
   - [ ] Logo "Crédito Fácil" en la parte superior
   - [ ] Título "Tabla de Amortización"
   - [ ] Nombre del cliente correcto
   - [ ] Monto del préstamo con formato correcto (ej: $100,000.00)
   - [ ] Tasa de interés anual (ej: 12%)
   - [ ] Plazo en meses (ej: 12 meses)
   - [ ] Tasa de interés mensual calculada (ej: 1.0000%)
   - [ ] Tabla con 6 columnas: Período, Saldo Inicial, Interés, Amortización, Cuota Total, Saldo Final
   - [ ] Todas las filas de períodos (tantas como el plazo)
   - [ ] Fila de TOTALES al final
   - [ ] Formato de números con comas y 2 decimales

**Resultado Esperado:** ✅ Todos los elementos presentes y correctos

---

#### Test 4: Validar cálculos en el PDF

**Pasos:**
1. Tomar nota de los siguientes valores de un préstamo:
   - Monto: M = $100,000
   - Tasa anual: T = 12%
   - Plazo: P = 12 meses
   - Cuota mensual: C = $8,884.88

2. Generar el PDF

3. Verificar manualmente algunos cálculos:
   
   **Primer período:**
   - Saldo Inicial = M = $100,000.00 ✓
   - Interés = M × (T/100/12) = 100,000 × 0.01 = $1,000.00 ✓
   - Amortización = C - Interés = 8,884.88 - 1,000.00 = $7,884.88 ✓
   - Saldo Final = Saldo Inicial - Amortización = 100,000 - 7,884.88 = $92,115.12 ✓
   
   **Último período:**
   - Saldo Final debe ser $0.00 o muy cercano (< $0.01) ✓
   
   **Totales:**
   - Total Interés ≈ $6,618.56 (sumar todos los intereses)
   - Total Amortización ≈ $100,000.00 (debe igual al monto original)
   - Total Cuota = C × P = 8,884.88 × 12 = $106,618.56

**Resultado Esperado:** ✅ Todos los cálculos son correctos

---

#### Test 5: Imprimir y descargar PDF

**Pasos:**
1. Generar un PDF
2. Hacer clic derecho dentro del iframe
3. Seleccionar "Imprimir"
4. **Verificar**: Se abre el diálogo de impresión del navegador
5. **Verificar**: El PDF se ve correcto en la vista previa de impresión
6. Cancelar la impresión
7. Hacer clic derecho en el iframe nuevamente
8. Seleccionar "Guardar como..." o "Descargar"
9. Guardar el archivo con un nombre (ej: "tabla-amortizacion.pdf")
10. Abrir el archivo descargado
11. **Verificar**: El PDF descargado se ve idéntico al del iframe

**Resultado Esperado:** ✅ PDF se puede imprimir y descargar correctamente

---

#### Test 6: Generar múltiples PDFs consecutivos

**Pasos:**
1. Seleccionar un préstamo y generar su PDF
2. Sin recargar la página, seleccionar un préstamo diferente
3. Generar otro PDF
4. **Verificar**: El nuevo PDF reemplaza al anterior en el iframe
5. **Verificar**: Los datos mostrados corresponden al segundo préstamo
6. Repetir con 2-3 préstamos más

**Resultado Esperado:** ✅ Se pueden generar PDFs múltiples sin problemas

---

#### Test 7: Manejo de errores - Sin datos

**Pasos:**
1. Abrir la consola del navegador (F12)
2. En la consola, ejecutar:
   ```javascript
   app.formAmortizacion.currentPrestamo = null;
   app.formAmortizacion.currentTabla = null;
   app.formAmortizacion.generarPDF();
   ```
3. **Verificar**: Aparece un toast rojo con "No hay datos para generar el PDF"
4. **Verificar**: No se genera ningún PDF
5. **Verificar**: No aparecen errores en la consola

**Resultado Esperado:** ✅ Error manejado correctamente

---

#### Test 8: Manejo de errores - Logo faltante

**Prerequisito:** Temporalmente renombrar o mover `img/logo.svg`

**Pasos:**
1. Mover o renombrar el archivo logo.svg
2. Seleccionar un préstamo
3. Generar PDF
4. **Verificar**: En la consola aparece: "No se pudo cargar el logo, continuando sin él"
5. **Verificar**: El PDF se genera de todos modos SIN el logo
6. **Verificar**: El resto del contenido se ajusta correctamente
7. **Verificar**: Aparece el toast de éxito
8. Restaurar el archivo logo.svg

**Resultado Esperado:** ✅ PDF se genera sin logo cuando no está disponible

---

#### Test 9: Rendimiento - Préstamo de largo plazo

**Pasos:**
1. Crear o seleccionar un préstamo con plazo de 24 meses
2. Generar el PDF
3. Medir el tiempo de generación (debería ser < 3 segundos)
4. **Verificar**: El PDF se genera correctamente
5. **Verificar**: Todas las 24 filas están presentes
6. **Verificar**: El PDF tiene 1-2 páginas
7. **Verificar**: La fila de totales está en la última página

**Resultado Esperado:** ✅ PDF se genera rápidamente incluso con muchas filas

---

#### Test 10: Compatibilidad de navegadores

**Pasos:**
1. Probar la generación de PDF en:
   - [ ] Google Chrome
   - [ ] Mozilla Firefox
   - [ ] Microsoft Edge
   - [ ] Safari (si está disponible)

2. Para cada navegador, verificar:
   - [ ] El botón aparece correctamente
   - [ ] El PDF se genera sin errores
   - [ ] El iframe muestra el PDF
   - [ ] El formato y colores son correctos
   - [ ] Se puede descargar el PDF

**Resultado Esperado:** ✅ Funciona en todos los navegadores modernos

---

#### Test 11: Responsive - Vista móvil

**Pasos:**
1. Abrir DevTools (F12)
2. Activar modo responsive
3. Seleccionar dispositivo móvil (ej: iPhone 12)
4. Navegar a la sección de Amortización
5. Seleccionar un préstamo
6. Generar PDF
7. **Verificar**: El botón es accesible en móvil
8. **Verificar**: El iframe se ajusta al ancho de pantalla
9. **Verificar**: El PDF es legible en pantalla pequeña

**Resultado Esperado:** ✅ Funciona en dispositivos móviles (aunque mejor en desktop)

---

#### Test 12: Formato de moneda

**Pasos:**
1. Verificar que los números en el PDF tienen formato correcto:
   - 100000.00 → "100,000.00" ✓
   - 1234.56 → "1,234.56" ✓
   - 500.5 → "500.50" ✓
   - 0.01 → "0.01" ✓

2. Verificar en varios préstamos con diferentes montos

**Resultado Esperado:** ✅ Todos los números tienen formato consistente

---

## 📊 Checklist de Validación Completa

Marcar cada item después de verificarlo:

### Funcionalidad Básica
- [ ] Botón aparece cuando hay datos
- [ ] Botón desaparece cuando no hay datos
- [ ] PDF se genera al hacer clic
- [ ] Iframe muestra el PDF
- [ ] Toast de éxito aparece

### Contenido del PDF
- [ ] Logo presente y bien escalado
- [ ] Título correcto
- [ ] Nombre del cliente correcto
- [ ] Monto formateado correctamente
- [ ] Tasa anual correcta
- [ ] Plazo correcto
- [ ] Tasa mensual calculada correctamente
- [ ] Tabla con todas las columnas
- [ ] Todas las filas presentes
- [ ] Fila de totales presente
- [ ] Totales calculados correctamente

### Estilos y Diseño
- [ ] Encabezados en azul con texto blanco
- [ ] Filas alternadas con fondo gris claro
- [ ] Números alineados a la derecha
- [ ] Período centrado
- [ ] Fila de totales en negrita
- [ ] Márgenes apropiados

### Interacción
- [ ] Se puede hacer scroll en el iframe
- [ ] Se puede hacer zoom
- [ ] Clic derecho funciona
- [ ] Se puede imprimir
- [ ] Se puede descargar
- [ ] Scroll automático al iframe funciona

### Manejo de Errores
- [ ] Error si no hay datos
- [ ] Continúa sin logo si falta
- [ ] Mensajes de error claros
- [ ] No hay errores en consola

### Rendimiento
- [ ] Genera en < 3 segundos
- [ ] Funciona con préstamos largos (24 meses)
- [ ] No afecta el rendimiento de la app

### Compatibilidad
- [ ] Chrome
- [ ] Firefox
- [ ] Edge
- [ ] Safari
- [ ] Móvil (responsive)

## 🐛 Problemas Conocidos y Soluciones

### Problema 1: "jsPDF is not defined"
**Solución:** Verificar que los scripts CDN están cargando:
```html
<script src="https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js"></script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/jspdf-autotable/3.5.31/jspdf.plugin.autotable.min.js"></script>
```

### Problema 2: Logo no aparece
**Solución:** Verificar que existe el archivo `Proyecto1/img/logo.svg`

### Problema 3: Iframe en blanco
**Solución:** Abrir consola y verificar errores. Puede ser un problema de CORS o Blob URL.

### Problema 4: Números sin formato
**Solución:** Verificar la configuración de locale en `toLocaleString('es-MX', {...})`

## 📝 Reporte de Bugs

Si encuentra un bug, incluir:
1. Navegador y versión
2. Datos del préstamo que causó el problema
3. Screenshot del error
4. Contenido de la consola del navegador
5. Pasos para reproducir
