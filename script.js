let idToken = null;
let editIndex = null;

function handleCredentialResponse(response) {
  idToken = response.credential;
  cargarListado();
}

function formatPrecio(valor) {
  var num = parseInt(valor, 10);
  if (isNaN(num)) return valor;
  return num.toLocaleString("es-AR") + "$";
}

async function cargarListado() {
  const res = await fetch(CONFIG.SCRIPT_URL);
  const json = await res.json();
  const tbody = document.querySelector("#tablaPrecios tbody");
  tbody.innerHTML = "";

  if (json.contenido) {
    const lineas = json.contenido.trim().split("\n");
    const marcas = new Set();
    const modelos = new Set();

    lineas.forEach((linea, idx) => {
      const partes = linea.split(" | ");
      if (partes.length >= 6) {
        const fecha = partes[0];
        const usuario = partes[1];
        const marca = partes[2];
        const modelo = partes[3];
        const reparacion = partes[4];
        const precio = formatPrecio(partes[5]);

        marcas.add(marca);
        modelos.add(modelo);

        const tr = document.createElement("tr");
        tr.innerHTML = `
          <td>${marca}</td>
          <td>${modelo}</td>
          <td>${reparacion}</td>
          <td>${precio}</td>
          <td>${usuario}</td>
          <td>${fecha}</td>
          <td class="acciones">
            <button class="editar">Editar</button>
            <button class="eliminar">Eliminar</button>
          </td>`;
        tbody.appendChild(tr);

        // Editar
        tr.querySelector(".editar").addEventListener("click", () => {
          document.getElementById("nuevaMarca").value = marca;
          document.getElementById("nuevoModelo").value = modelo;
          document.getElementById("reparacion").value = reparacion;
          document.getElementById("precio").value = partes[5];
          editIndex = idx;
        });

        // Eliminar
        tr.querySelector(".eliminar").addEventListener("click", async () => {
          if (!idToken) return alert("Inicia sesión primero");
          const data = { token: idToken, accion: "eliminar", linea: idx };
          const res = await fetch(CONFIG.SCRIPT_URL, {
            method: "POST",
            body: JSON.stringify(data)
          });
          const json = await res.json();
          if (json.estado === "ok") cargarListado();
          else alert("Error al eliminar: " + json.error);
        });
      }
    });

    // Actualizar selects
    const marcaSelect = document.getElementById("marca");
    marcaSelect.innerHTML = "";
    marcas.forEach(m => {
      const opt = document.createElement("option");
      opt.value = m;
      opt.textContent = m;
      marcaSelect.appendChild(opt);
    });

    const modeloSelect = document.getElementById("modelo");
    modeloSelect.innerHTML = "";
    modelos.forEach(m => {
      const opt = document.createElement("option");
      opt.value = m;
      opt.textContent = m;
      modeloSelect.appendChild(opt);
    });
  }
}

// Guardar nueva reparación o editar existente
document.getElementById("formulario").addEventListener("submit", async (e) => {
  e.preventDefault();
  if (!idToken) return alert("Inicia sesión primero");

  const marca = document.getElementById("nuevaMarca").value || document.getElementById("marca").value;
  const modelo = document.getElementById("nuevoModelo").value || document.getElementById("modelo").value;
  const reparacion = document.getElementById("reparacion").value;
  const precio = document.getElementById("precio").value;

  const data = {
    token: idToken,
    accion: editIndex !== null ? "editar" : "agregar",
    linea: editIndex,
    marca, modelo, reparacion, precio
  };

  const res = await fetch(CONFIG.SCRIPT_URL, {
    method: "POST",
    body: JSON.stringify(data)
  });
  const json = await res.json();
  if (json.estado === "ok") {
    editIndex = null;
    cargarListado();
  } else {
    alert("Error: " + json.error);
  }
});

// Cargar listado al iniciar página
document.addEventListener("DOMContentLoaded", cargarListado);
