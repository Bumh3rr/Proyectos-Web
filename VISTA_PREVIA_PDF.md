# Vista Previa Visual del PDF Generado

```
╔══════════════════════════════════════════════════════════════════════════════╗
║                                                                              ║
║                     ┌────────────────────────────────────┐                  ║
║                     │  [Logo] Crédito Fácil              │                  ║
║                     │  Sistema de Gestión de Préstamos   │                  ║
║                     └────────────────────────────────────┘                  ║
║                                                                              ║
║                         Tabla de Amortización                               ║
║                                                                              ║
║  Cliente: Juan Pérez García                                                 ║
║                                                                              ║
║  Parámetros del Préstamo:                                                   ║
║  Monto: $100,000.00                                                         ║
║  Tasa de Interés Anual: 12%                                                 ║
║  Plazo: 12 meses                                                            ║
║  Tasa de Interés Mensual: 1.0000%                                           ║
║                                                                              ║
║  ┌────────────────────────────────────────────────────────────────────────┐ ║
║  │ Período │ Saldo Inicial │  Interés  │ Amortización │ Cuota  │ Saldo   │ ║
║  │         │               │           │  (Capital)   │ Total  │  Final  │ ║
║  ├─────────┼───────────────┼───────────┼──────────────┼────────┼─────────┤ ║
║  │    1    │  100,000.00   │ 1,000.00  │   7,884.88   │8,884.88│92,115.12│ ║
║  │    2    │   92,115.12   │   921.15  │   7,963.73   │8,884.88│84,151.39│ ║
║  │    3    │   84,151.39   │   841.51  │   8,043.37   │8,884.88│76,108.02│ ║
║  │    4    │   76,108.02   │   761.08  │   8,123.80   │8,884.88│67,984.22│ ║
║  │    5    │   67,984.22   │   679.84  │   8,205.04   │8,884.88│59,779.18│ ║
║  │    6    │   59,779.18   │   597.79  │   8,287.09   │8,884.88│51,492.09│ ║
║  │    7    │   51,492.09   │   514.92  │   8,369.96   │8,884.88│43,122.13│ ║
║  │    8    │   43,122.13   │   431.22  │   8,453.66   │8,884.88│34,668.47│ ║
║  │    9    │   34,668.47   │   346.68  │   8,538.20   │8,884.88│26,130.27│ ║
║  │   10    │   26,130.27   │   261.30  │   8,623.58   │8,884.88│17,506.69│ ║
║  │   11    │   17,506.69   │   175.07  │   8,709.81   │8,884.88│ 8,796.88│ ║
║  │   12    │    8,796.88   │    87.97  │   8,796.91   │8,884.88│     0.00│ ║
║  ├─────────┼───────────────┼───────────┼──────────────┼────────┼─────────┤ ║
║  │ TOTALES │               │ 6,618.53  │  100,000.03  │106,618.│         │ ║
║  └─────────┴───────────────┴───────────┴──────────────┴────────┴─────────┘ ║
║                                                                              ║
║                                                                        Pág 1 ║
╚══════════════════════════════════════════════════════════════════════════════╝

COLORES:
- Encabezados de tabla: Azul (#2563eb) con texto blanco
- Filas pares: Blanco
- Filas impares: Gris claro (#f5f7fa)
- Fila de totales: Texto en negrita
- Logo: Azul (#2563eb) con detalles dorados (#fbbf24)

ALINEACIÓN:
- Período: Centrado
- Números: Alineados a la derecha
- Texto "TOTALES": Centrado y en negrita

FORMATO:
- Todos los números monetarios con 2 decimales
- Separador de miles: coma (,)
- Separador decimal: punto (.)
- Formato: es-MX (Español - México)
```

## Vista en el Navegador

Cuando el usuario genera el PDF, verá esto en la interfaz:

```
┌───────────────────────────────────────────────────────────────────────────┐
│  Tabla de Amortización                                                    │
│                                                                           │
│  [Dropdown: Préstamo seleccionado ▼]                                     │
│                                                                           │
│  Información del Préstamo                                                │
│  Cliente: Juan Pérez García                                              │
│  Monto: 100000.00                                                        │
│  Tasa: 12%                                                               │
│  Cuota Mensual: 8884.88                                                  │
│                                                                           │
│  Plan de Pagos                                                           │
│  ┌─────────────────┐                                                     │
│  │ 📄 Generar PDF  │  ← Botón visible cuando hay datos                  │
│  └─────────────────┘                                                     │
│                                                                           │
│  [Tabla HTML con todos los períodos de pago...]                         │
│                                                                           │
│  Vista Previa del PDF                                                    │
│  ┌───────────────────────────────────────────────────────────────────┐  │
│  │                                                                     │  │
│  │  [PDF renderizado aquí en iframe]                                  │  │
│  │  (El usuario puede hacer scroll, zoom, e imprimir desde aquí)     │  │
│  │                                                                     │  │
│  │                                                                     │  │
│  │                           600px                                     │  │
│  │                                                                     │  │
│  └───────────────────────────────────────────────────────────────────┘  │
└───────────────────────────────────────────────────────────────────────────┘
```

## Flujo de Usuario

```
1. Usuario selecciona préstamo
   ↓
2. Se carga tabla de amortización
   ↓
3. Aparece botón "📄 Generar PDF"
   ↓
4. Usuario hace clic en botón
   ↓
5. [Loading spinner] "Generando PDF..."
   ↓
6. PDF se genera en ~1-2 segundos
   ↓
7. Iframe aparece con PDF
   ↓
8. Scroll automático al PDF
   ↓
9. Usuario puede:
   - Ver el PDF
   - Hacer zoom
   - Imprimir (Ctrl+P o clic derecho)
   - Descargar (clic derecho → Guardar como)
```

## Ejemplo de Notificaciones Toast

```
✅ Éxito:
┌────────────────────────────────────┐
│ ✓ PDF generado exitosamente       │
└────────────────────────────────────┘

❌ Error (sin datos):
┌────────────────────────────────────┐
│ ✗ No hay datos para generar el PDF│
└────────────────────────────────────┘

❌ Error (generación):
┌────────────────────────────────────┐
│ ✗ Error al generar el PDF: [msg]  │
└────────────────────────────────────┘
```
