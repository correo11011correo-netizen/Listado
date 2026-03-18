let reparaciones = [];

// Referencias al DOM
const form = document.getElementById('form-reparacion');
const lista = document.getElementById('lista-reparaciones');
const inputComision = document.getElementById('comision-porcentaje');

// Elementos de totales
const elCant = document.getElementById('cant-reparaciones');
const elSubRep = document.getElementById('sub-repuestos');
const elSubMano = document.getElementById('sub-mano-obra');
const elPorcDesc = document.getElementById('porcentaje-descuento');
const elMontoDesc = document.getElementById('monto-descuento');
const elTotalCliente = document.getElementById('total-cliente');
const elTotalComision = document.getElementById('total-comision');

// Escuchar formulario
form.addEventListener('submit', (e) => {
  e.preventDefault();
  
  const nombre = document.getElementById('nombre-reparacion').value;
  const repuesto = parseFloat(document.getElementById('costo-repuesto').value) || 0;
  const manoObra = parseFloat(document.getElementById('costo-mano-obra').value) || 0;

  reparaciones.push({
    id: Date.now(),
    nombre,
    repuesto,
    manoObra
  });

  form.reset();
  actualizarUI();
});

// Cambios en la comisión recalculan todo
inputComision.addEventListener('input', actualizarUI);

// Limpiar todo
document.getElementById('btn-limpiar').addEventListener('click', () => {
  if (confirm('¿Seguro que deseas limpiar el presupuesto?')) {
    reparaciones = [];
    actualizarUI();
  }
});

function eliminarReparacion(id) {
  reparaciones = reparaciones.filter(r => r.id !== id);
  actualizarUI();
}

function actualizarUI() {
  // 1. Renderizar la lista
  lista.innerHTML = '';
  reparaciones.forEach(rep => {
    const li = document.createElement('li');
    li.innerHTML = `
      <div>
        <strong>${rep.nombre}</strong><br>
        <small style="color:#bbb">Repuesto: $${rep.repuesto} | Mano Obra: $${rep.manoObra}</small>
      </div>
      <button class="btn-eliminar-item" onclick="eliminarReparacion(${rep.id})">X</button>
    `;
    lista.appendChild(li);
  });

  // 2. Calcular algoritmo de precios
  const cantidad = reparaciones.length;
  let totalRepuestos = 0;
  let totalManoObraBase = 0;

  reparaciones.forEach(rep => {
    totalRepuestos += rep.repuesto;
    totalManoObraBase += rep.manoObra;
  });

  // Lógica de descuentos sobre MANO DE OBRA
  // 1 rep = 0%
  // 2 reps = 15% (intermedio entre 10 y 20)
  // 3+ reps = 30%
  let porcentajeDescuento = 0;
  if (cantidad === 2) {
    porcentajeDescuento = 15;
  } else if (cantidad >= 3) {
    porcentajeDescuento = 30;
  }

  const montoDescuento = totalManoObraBase * (porcentajeDescuento / 100);
  const manoObraConDescuento = totalManoObraBase - montoDescuento;
  
  const totalCliente = totalRepuestos + manoObraConDescuento;

  // Cálculo de comisión (ejemplo: % sobre la mano de obra neta o sobre el total)
  // Lo calcularemos sobre el Total del Cliente para este diseño
  const porcentajeComision = parseFloat(inputComision.value) || 0;
  const totalComision = totalCliente * (porcentajeComision / 100);

  // 3. Actualizar textos en pantalla
  elCant.textContent = cantidad;
  elSubRep.textContent = totalRepuestos.toFixed(2);
  elSubMano.textContent = totalManoObraBase.toFixed(2);
  elPorcDesc.textContent = porcentajeDescuento;
  elMontoDesc.textContent = montoDescuento.toFixed(2);
  elTotalCliente.textContent = totalCliente.toFixed(2);
  elTotalComision.textContent = totalComision.toFixed(2);
}
