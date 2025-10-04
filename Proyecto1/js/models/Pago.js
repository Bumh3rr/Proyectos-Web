class Pago {
    constructor(prestamoId, periodo, fechaPago) {
        this.prestamoId = prestamoId;
        this.periodo = periodo;
        this.fechaPago = fechaPago;
    }

    // Método para convertir a objeto plano
    toObject() {
        return {
            prestamoId: this.prestamoId,
            periodo: this.periodo,
            fechaPago: this.fechaPago
        };
    }

    // Método estático para crear desde Firestore
    static fromFirestore(doc) {
        const data = doc.data();
        return new Pago(
            data.prestamoId,
            data.periodo,
            data.fechaPago
        );
    }
}

export default Pago;