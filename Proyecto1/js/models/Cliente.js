class Cliente {
    constructor(id, nombre, telefono, rfc, direccion, fechaRegistro = new Date()) {
        this.id = id;
        this.nombre = nombre;
        this.telefono = telefono;
        this.rfc = rfc;
        this.direccion = direccion;
        this.fechaRegistro = fechaRegistro;
    }

    // Método estático para crear desde Firestore
    static fromFirestore(doc) {
        const data = doc.data();
        return new Cliente(
            doc.id,
            data.nombre,
            data.telefono,
            data.rfc,
            data.direccion,
            data.fechaRegistro?.toDate(),
        );
    }
}

export default Cliente;