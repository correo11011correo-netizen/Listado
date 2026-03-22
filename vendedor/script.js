
const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbyedlJ_j4-XQLjWsg5s-paxMRJWtP_SoVTq3jnnmo1_QDRQOZx0yRVk75mHHjsKGUTX/exec';
let catalogo = [];
let carrito = {};

// Al cargar, obtener la lista
document.addEventListener('DOMContentLoaded', () => {
  cargarCatalogo();
});

async function cargarCatalogo() {
  const loader = document.getElementById('loader');
  if (catalogo.length === 0) loader.style.display = 'block';
  
  try {
    const res = await fetch(SCRIPT_URL);
    const json = await res.json();
    
    if (json.estado === 'ok' && json.contenido) {
      // El formato de Sheets devuelve un Array de Arrays: [Fecha, Vendedor, Marca, Modelo, Rep, Precio, Img]
      catalogo = json.contenido.map((fila, idx) => ({
        id: 'item-' + idx,
        marca: fila[2],
        modelo: fila[3],
        reparacion: fila[4],
        precioNum: parseFloat(fila[5]) || 0,
        img: fila[6] || '',
        titulo: fila[2] + ' ' + fila[3]
      }));
      renderizarCatalogo(catalogo);
    }
  } catch (err) {
    console.error('Error cargando catálogo:', err);
  } finally {
    loader.style.display = 'none';
  }
}

function renderizarCatalogo(listaItems) {
  const contenedorCatalogo = document.getElementById('lista-catalogo');
  contenedorCatalogo.innerHTML = '';
  
  const agrupado = {};
  listaItems.forEach(item => {
    if (!agrupado[item.titulo]) agrupado[item.titulo] = [];
    agrupado[item.titulo].push(item);
  });

  Object.keys(agrupado).forEach(titulo => {
    const itemsDelModelo = agrupado[titulo];
    const card = document.createElement('div');
    card.className = 'item-card-agrupada';
    card.innerHTML = ;
    
    const bodyAgrupado = document.createElement('div');
    bodyAgrupado.className = 'card-body-agrupado';

    itemsDelModelo.forEach(item => {
      const fila = document.createElement('div');
      fila.className = 'reparacion-fila';
      fila.innerHTML = ;
      bodyAgrupado.appendChild(fila);
    });
    
    card.appendChild(bodyAgrupado);
    contenedorCatalogo.appendChild(card);
  });
}
// ... (Lógica de carrito y WhatsApp mantenida) ...
