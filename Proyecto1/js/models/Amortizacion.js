class Amortizacion {
    constructor(periodo, fechaProgramada, saldoInicial, interes, amortizacionCapital, cuotaTotal, saldoFinal, fechaPagoReal) {
        this.periodo = periodo;
        this.fechaProgramada = fechaProgramada;
        this.saldoInicial = saldoInicial;
        this.interes = interes;
        this.amortizacionCapital = amortizacionCapital;
        this.cuotaTotal = cuotaTotal;
        this.saldoFinal = saldoFinal;
        this.fechaPagoReal = fechaPagoReal;
    }

    // Método para convertir a objeto plano
    toObject() {
        return {
            periodo: this.periodo,
            fechaProgramada: this.fechaProgramada,
            saldoInicial: this.saldoInicial,
            interes: this.interes,
            amortizacionCapital: this.amortizacionCapital,
            cuotaTotal: this.cuotaTotal,
            saldoFinal: this.saldoFinal,
            fechaPagoReal: this.fechaPagoReal
        };
    }

    // Método estático para crear desde Firestore
    static fromFirestore(doc) {
        const data = doc.data();
        return new Amortizacion(
            data.periodo,
            data.fechaProgramada?.toDate(),
            data.saldoInicial,
            data.interes,
            data.amortizacionCapital,
            data.cuotaTotal,
            data.saldoFinal,
            data.fechaPagoReal?.toDate()
        );
    }
}

export default Amortizacion;