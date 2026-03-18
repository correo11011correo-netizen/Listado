let idToken = null;
let editIndex = null;

function handleCredentialResponse(response) {
  idToken = response.credential;
  localStorage.setItem("idToken", idToken);
  document.getElementById("formulario").style.display = "block"; // mostrar formulario
  cargarListado();
}

function formatPrecio(valor) {
  var num = parseInt(valor, 10);
  if (isNaN(num)) return valor;
  return num.toLocaleString("es-AR") + "$";
}

function formatFecha(fechaIso) {
  const d = new Date(fechaIso);
  return d.getDate().toString().padStart(2,"0") + "/" +
         (d.getMonth()+1).toString().padStart(2,"0") + "/" +
         d.getFullYear();
}

async function cargarListado() {
  mostrarLoader();
  try {
    const res = await fetch(CONFIG.SCRIPT_URL);
    const json = await res.json();
    const contenedor = document.querySelector("#tarjetas");
    contenedor.innerHTML = "";
    const btnViejo = document.getElementById("btn-ver-mas");
    if (btnViejo) btnViejo.remove();

    if (json.contenido) {
      const lineas = json.contenido.trim().split("\n");
      const marcas = new Set();
      const modelos = new Set();

      lineas.forEach((linea, idx) => {
        const partes = linea.split(" | ");
        if (partes.length >= 6) {
          const fecha = formatFecha(partes[0]);
          const marca = partes[2];
          const modelo = partes[3];
          const reparacion = partes[4];
          const precio = formatPrecio(partes[5]);

          marcas.add(marca);
          modelos.add(modelo);

          const card = document.createElement("div");
          card.className = "card fade-in";
          card.innerHTML = `
            <div class="card-header">
              <h3>${marca} ${modelo}</h3>
            </div>
            <p><strong>Reparación:</strong> ${reparacion}</p>
            <p><strong>Precio:</strong> ${precio}</p>
            <p><strong>Fecha:</strong> ${fecha}</p>
          `;

          // Solo mostrar acciones si hay sesión iniciada
          if (idToken) {
            const acciones = document.createElement("div");
            acciones.className = "acciones-inline";
            acciones.innerHTML = `
              <button class="editar">✏️</button>
              <button class="eliminar">🗑️</button>
            `;
            card.querySelector(".card-header").appendChild(acciones);

            acciones.querySelector(".editar").addEventListener("click", () => {
              document.getElementById("nuevaMarca").value = marca;
              document.getElementById("nuevoModelo").value = modelo;
              document.getElementById("reparacion").value = reparacion;
              document.getElementById("precio").value = partes[5];
              editIndex = idx;
            });

            acciones.querySelector(".eliminar").addEventListener("click", async () => {
              mostrarLoader();
              const data = { token: idToken, accion: "eliminar", linea: idx };
              const res = await fetch(CONFIG.SCRIPT_URL, {
                method: "POST",
                body: JSON.stringify(data)
              });
              const json = await res.json();
              ocultarLoader();
              if (json.estado === "ok") cargarListado();
              else alert("Error al eliminar: " + json.error);
            });
          }

          contenedor.prepend(card); // Insertar al principio (las más nuevas arriba)
        }
      });

      // Limitar a 5 tarjetas por defecto
      const allCards = Array.from(contenedor.children);
      allCards.forEach((c, i) => {
        if (i >= 5) {
          c.classList.add('oculta-limite');
          c.style.display = 'none';
        }
      });

      // Si hay más de 5, agregar botón "Ver todas"
      if (allCards.length > 5) {
        const btnVerMas = document.createElement("button");
        btnVerMas.id = "btn-ver-mas";
        btnVerMas.textContent = "Ver todo el listado (" + allCards.length + ")";
        btnVerMas.style.marginTop = "15px";
        btnVerMas.addEventListener("click", () => {
          allCards.forEach(c => {
            c.classList.remove('oculta-limite');
            c.style.display = 'flex'; // o block según css
          });
          btnVerMas.style.display = "none";
        });
        contenedor.parentElement.appendChild(btnVerMas);
      }

      // actualizar selects
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
  } catch (err) {
    alert("Error cargando datos: " + err);
  } finally {
    ocultarLoader();
  }
}

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

  mostrarLoader();
  const res = await fetch(CONFIG.SCRIPT_URL, {
    method: "POST",
    body: JSON.stringify(data)
  });
  const json = await res.json();
  ocultarLoader();

  if (json.estado === "ok") {
    editIndex = null;
    cargarListado();
    document.getElementById("formulario").reset();
  } else {
    alert("Error: " + json.error);
  }
});

// Loader helpers SIN texto
function mostrarLoader() {
  let loader = document.getElementById("loader");
  if (!loader) {
    loader = document.createElement("div");
    loader.id = "loader";
    loader.className = "loader";
    document.body.appendChild(loader);
  } else {
    loader.style.display = "block";
  }
}
function ocultarLoader() {
  const loader = document.getElementById("loader");
  if (loader) loader.remove();
}

// Buscador dinámico
document.getElementById("buscador").addEventListener("input", () => {
  const filtro = document.getElementById("buscador").value.toLowerCase();
  const btnVerMas = document.getElementById("btn-ver-mas");
  
  if (filtro === "") {
    // Si se borra la búsqueda, volver al estado original
    document.querySelectorAll("#tarjetas .card").forEach((card, i) => {
      if (card.classList.contains('oculta-limite')) {
        card.style.display = 'none';
      } else {
        card.style.display = 'flex'; // o el que corresponda
      }
    });
    if (btnVerMas) btnVerMas.style.display = 'block';
  } else {
    // Si está buscando, ignorar límite
    document.querySelectorAll("#tarjetas .card").forEach(card => {
      const texto = card.innerText.toLowerCase();
      card.style.display = texto.includes(filtro) ? "flex" : "none";
    });
    if (btnVerMas) btnVerMas.style.display = 'none';
  }
});

// Detectar sesión guardada
document.addEventListener("DOMContentLoaded", () => {
  const savedToken = localStorage.getItem("idToken");
  if (savedToken) {
    idToken = savedToken;
    document.getElementById("formulario").style.display = "block";
  }
  cargarListado();
});

// Botón para alternar a Versión PC/Móvil
document.getElementById("btn-toggle-view").addEventListener("click", (e) => {
  document.body.classList.toggle("pc-view");
  if (document.body.classList.contains("pc-view")) {
    e.target.textContent = "Versión Móvil";
  } else {
    e.target.textContent = "Versión PC";
  }
});

