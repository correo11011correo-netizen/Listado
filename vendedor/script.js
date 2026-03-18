// Variable para almacenar el catálogo completo traído de Google Sheets
let catalogo = [];
// Carrito de compras: mapa donde Key = id de reparación, Value = objeto reparación con cantidad
let carrito = {};

const contenedorCatalogo = document.getElementById('lista-catalogo');
const loader = document.getElementById('loader');

// Al cargar, obtener la lista
document.addEventListener("DOMContentLoaded", () => {
  cargarCatalogo();
});

function parsePrecioStr(str) {
  // Ej: "15000" o "15.000$" -> 15000
  return parseFloat(str.replace(/[^0-9,-]+/g, "")) || 0;
}

async function cargarCatalogo() {
  loader.style.display = "block";
  contenedorCatalogo.innerHTML = "";
  try {
    const res = await fetch(CONFIG.SCRIPT_URL);
    const json = await res.json();
    
    if (json.contenido) {
      const lineas = json.contenido.trim().split("\n");
      
      lineas.forEach((linea, idx) => {
        const partes = linea.split(" | ");
        if (partes.length >= 6) {
          const marca = partes[2];
          const modelo = partes[3];
          const reparacion = partes[4];
          const precioOriginal = partes[5];
          const precioNum = parsePrecioStr(precioOriginal);

          // Crear objeto único por reparación
          const item = {
            id: `item-${idx}`,
            marca: marca,
            modelo: modelo,
            reparacion: reparacion,
            titulo: `${marca} ${modelo}`,
            precioStr: precioOriginal,
            precioNum: precioNum
          };
          catalogo.push(item);
        }
      });
      renderizarCatalogo(catalogo);
    }
  } catch (err) {
    alert("Error cargando el catálogo: " + err);
  } finally {
    loader.style.display = "none";
  }
}

// Dibuja las tarjetas en el medio
function renderizarCatalogo(listaItems) {
  contenedorCatalogo.innerHTML = "";
  listaItems.forEach(item => {
    // Si ya está en el carrito, mostramos su cantidad actual
    const cantActual = carrito[item.id] ? carrito[item.id].cantidad : 0;
    
    const card = document.createElement("div");
    card.className = "item-card";
    card.dataset.id = item.id;
    
    // Convertimos precio en formato legible
    let precioVisible = item.precioNum.toLocaleString("es-AR") + "$";

    card.innerHTML = `
      <div class="item-info">
        <h3>${item.titulo}</h3>
        <p class="reparacion">${item.reparacion}</p>
        <p class="precio">${precioVisible}</p>
      </div>
      <div class="item-controles">
        <button class="btn-resta ${cantActual > 0 ? 'activo-resta' : ''}">-</button>
        <span class="cantidad">${cantActual}</span>
        <button class="btn-suma activo-suma">+</button>
      </div>
    `;

    // Eventos de suma y resta
    const btnSuma = card.querySelector('.btn-suma');
    const btnResta = card.querySelector('.btn-resta');
    
    btnSuma.addEventListener('click', () => {
      agregarAlCarrito(item);
      card.querySelector('.cantidad').textContent = carrito[item.id].cantidad;
      btnResta.classList.add('activo-resta');
      actualizarFooter();
    });

    btnResta.addEventListener('click', () => {
      restarDelCarrito(item.id);
      const nuevaCant = carrito[item.id] ? carrito[item.id].cantidad : 0;
      card.querySelector('.cantidad').textContent = nuevaCant;
      if (nuevaCant === 0) {
        btnResta.classList.remove('activo-resta');
      }
      actualizarFooter();
    });

    contenedorCatalogo.appendChild(card);
  });
}

// Buscador
document.getElementById('buscador-reparaciones').addEventListener('input', (e) => {
  const filtro = e.target.value.toLowerCase();
  const filtrados = catalogo.filter(item => {
    const texto = `${item.marca} ${item.modelo} ${item.reparacion}`.toLowerCase();
    return texto.includes(filtro);
  });
  renderizarCatalogo(filtrados);
});

// === LOGICA DE CARRITO Y DESCUENTOS ===
function agregarAlCarrito(item) {
  if (carrito[item.id]) {
    carrito[item.id].cantidad += 1;
  } else {
    carrito[item.id] = { ...item, cantidad: 1 };
  }
}

function restarDelCarrito(id) {
  if (carrito[id]) {
    carrito[id].cantidad -= 1;
    if (carrito[id].cantidad <= 0) {
      delete carrito[id];
    }
  }
}

function obtenerResumenCarrito() {
  let subtotal = 0;
  let totalItems = 0;

  Object.values(carrito).forEach(item => {
    subtotal += (item.precioNum * item.cantidad);
    totalItems += item.cantidad;
  });

  // Algoritmo de descuento global (aplica sobre el total para este prototipo)
  let porcentajeDesc = 0;
  if (totalItems === 2) {
    porcentajeDesc = 15;
  } else if (totalItems >= 3) {
    porcentajeDesc = 30;
  }

  const montoDesc = subtotal * (porcentajeDesc / 100);
  const totalFinal = subtotal - montoDesc;

  return { totalItems, subtotal, porcentajeDesc, montoDesc, totalFinal };
}

function actualizarFooter() {
  const { totalItems, porcentajeDesc, totalFinal } = obtenerResumenCarrito();

  document.getElementById('cant-items').textContent = totalItems + (totalItems === 1 ? " item" : " items");
  document.getElementById('porc-desc').textContent = porcentajeDesc;
  document.getElementById('total-final').textContent = "$" + totalFinal.toLocaleString("es-AR");

  const btnGenerar = document.getElementById('btn-generar');
  if (totalItems > 0) {
    btnGenerar.disabled = false;
  } else {
    btnGenerar.disabled = true;
  }
}

// === MODAL Y WHATSAPP ===
const modal = document.getElementById('modal-presupuesto');
const btnGenerar = document.getElementById('btn-generar');
const btnCerrar = document.getElementById('btn-cerrar-modal');

btnGenerar.addEventListener('click', () => {
  const nombre = document.getElementById('nombre-cliente').value || 'Cliente sin nombre';
  const tel = document.getElementById('telefono-cliente').value || 'Sin teléfono';
  
  document.getElementById('resumen-cliente').textContent = `${nombre} (${tel})`;

  const ul = document.getElementById('resumen-lista-items');
  ul.innerHTML = '';
  
  Object.values(carrito).forEach(item => {
    const li = document.createElement('li');
    li.innerHTML = `
      <span>${item.cantidad}x ${item.titulo} - ${item.reparacion}</span>
      <strong>$${(item.precioNum * item.cantidad).toLocaleString("es-AR")}</strong>
    `;
    ul.appendChild(li);
  });

  const { subtotal, porcentajeDesc, montoDesc, totalFinal } = obtenerResumenCarrito();
  
  document.getElementById('resumen-subtotal').textContent = subtotal.toLocaleString("es-AR");
  document.getElementById('resumen-porc-desc').textContent = porcentajeDesc;
  document.getElementById('resumen-monto-desc').textContent = montoDesc.toLocaleString("es-AR");
  document.getElementById('resumen-total').textContent = totalFinal.toLocaleString("es-AR");

  modal.classList.remove('oculto');
});

btnCerrar.addEventListener('click', () => {
  modal.classList.add('oculto');
});

document.getElementById('btn-enviar-whatsapp').addEventListener('click', () => {
  const nombre = document.getElementById('nombre-cliente').value;
  const tel = document.getElementById('telefono-cliente').value;
  
  const { subtotal, porcentajeDesc, totalFinal } = obtenerResumenCarrito();

  let mensaje = `*Presupuesto de Reparación*%0A`;
  if (nombre) mensaje += `Cliente: ${nombre}%0A`;
  mensaje += `%0A*Detalles:*%0A`;

  Object.values(carrito).forEach(item => {
    mensaje += `- ${item.cantidad}x ${item.titulo} (${item.reparacion}) : $${item.precioNum * item.cantidad}%0A`;
  });

  mensaje += `%0A*Subtotal:* $${subtotal}`;
  if (porcentajeDesc > 0) {
    mensaje += `%0A*Descuento (${porcentajeDesc}%):* Aplicado`;
  }
  mensaje += `%0A*Total Final:* $${totalFinal}%0A%0A`;
  mensaje += `¡Gracias por elegirnos!`;

  // Limpiar número
  let numLimpio = tel.replace(/[^0-9]/g, "");
  
  let urlStr = '';
  if (numLimpio) {
    // Intenta enviar directo a ese número
    urlStr = `https://wa.me/${numLimpio}?text=${mensaje}`;
  } else {
    urlStr = `https://wa.me/?text=${mensaje}`;
  }

  window.open(urlStr, '_blank');
});
