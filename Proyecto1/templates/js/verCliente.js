import ClienteService from "../../js/services/ClienteService.js";

async function main() {

    function getQueryParam(name) {
        const url = new URL(window.location.href);
        return url.searchParams.get(name);
    }

    const id = getQueryParam('id');
    const contenido = document.getElementById('contenido');
    const clienteService = new ClienteService();
    const loadingC = document.getElementById('loading');

    const loading = (enable) =>{
        if (enable) {
            loadingC.style.display = 'block';
        }else{
            loadingC.style.display = 'none';
        }
    }


    loading(true);
    if (!id) {
        contenido.innerHTML = '<p>La URL no contiene el parámetro <code>id</code>.</p>';
        loading(false);
        return;
    }


    try {
        const cliente = await clienteService.getClienteById(id);
        if (!cliente) {
            contenido.innerHTML = `<p>No se encontró ningún cliente con ID: ${id}</p>`;
            return;
        }

        // Helpers
        const getInitials = (name = '') =>
            name.split(/\s+/).filter(Boolean).map(n => n[0]).slice(0, 2).join('').toUpperCase();

        const initials = getInitials(cliente.nombre);
        const fotoHtml = cliente.foto && cliente.foto.startsWith('data:image')
            ? `<img class="foto" alt="Foto de ${cliente.nombre || 'cliente'}" src="${cliente.foto}">`
            : `<div class="avatar-placeholder" aria-hidden="true">${initials || '—'}</div>`;

        const firmaHtml = cliente.firma && cliente.firma.startsWith('data:image')
            ? `<div class="firma"><div class="label">Firma</div><img alt="Firma de ${cliente.nombre || ''}" src="${cliente.firma}"></div>`
            : '';

        contenido.innerHTML = `
      <div id="cliente-card" role="region" aria-label="Credencial del cliente">
        
        <div class="left">
          ${fotoHtml}
          <div class="small-label">ID: ${cliente.id || 'N/A'}</div>
        </div>

        <div class="right">
        
          <div class="details" aria-hidden="false">
            <div class="field"><span class="label">Nombre</span><span class="value">${cliente.nombre || '—'}</span></div>
            <div class="field"><span class="label">RFC</span><span class="value">${cliente.rfc || '—'}</span></div>

            <div class="field"><span class="label">Teléfono</span><span class="value">${cliente.telefono || '—'}</span></div>
            <div class="field"><span class="label">Género</span><span class="value">${cliente.genero || '—'}</span></div>

            <div class="field" style="grid-column:1 / -1;"><span class="label">Dirección</span><span class="value">${cliente.direccion || '—'}</span></div>
          </div>
          ${firmaHtml}
        </div>
      </div>
    `;
    } catch (err) {
        contenido.innerHTML = `<p>Error al obtener cliente: ${err.message}</p>`;
    }finally {
        loading(false);
    }
}

main();