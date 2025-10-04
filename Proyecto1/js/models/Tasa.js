class Tasa {
    constructor(descripcion, nombre, porcentaje) {
        this.descripcion = descripcion;
        this.nombre = nombre;
        this.porcentaje = porcentaje;
    }

    // Método para convertir a objeto plano
    toObject() {
        return {
            descripcion: this.descripcion,
            nombre: this.nombre,
            porcentaje: this.porcentaje
        };
    }

    // Método estático para crear desde Firestore
    static fromFirestore(doc) {
        const data = doc.data();
        return new Tasa(
            data.descripcion,
            data.nombre,
            data.porcentaje
        );
    }
}

export default Tasa;