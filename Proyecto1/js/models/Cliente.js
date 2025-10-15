class Cliente {
    constructor(id, nombre, telefono, rfc, direccion, fechaRegistro = new Date(), genero, foto, firma) {
        this.id = id;
        this.nombre = nombre;
        this.telefono = telefono;
        this.rfc = rfc;
        this.direccion = direccion;
        this.fechaRegistro = fechaRegistro;
        this.genero = genero;
        this.foto = foto;
        this.firma = firma
    }

    static fromFirestore(doc) {
        const data = doc.data();
        return new Cliente(
            doc.id,
            data.nombre,
            data.telefono,
            data.rfc,
            data.direccion,
            data.fechaRegistro?.toDate(),
            data.genero,
            data.foto,
            data.firma
        );
    }
}

export default Cliente;