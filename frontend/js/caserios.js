const API = "http://localhost:3000/api";

const token = localStorage.getItem("siscacao_token");

const usuario = JSON.parse(
  localStorage.getItem("siscacao_usuario") || "null"
);

// VALIDAR SESIÓN
if (!token || !usuario) {
  window.location.href = "index.html";
}

// MOSTRAR USUARIO
document.getElementById("usuarioActual").textContent =
  `${usuario.nombres} ${usuario.apellidos} · ${usuario.rol}`;

// ELEMENTOS PRINCIPALES
const tabla = document.getElementById("tablaCaserios");
const panelFormulario = document.getElementById("panelFormulario");
const form = document.getElementById("formCaserio");
const mensajeFormulario = document.getElementById("mensajeFormulario");

const notificacion =
  document.getElementById("notificacion");


function mostrarNotificacion(
  mensaje,
  tipo = "exito"
) {

  notificacion.textContent = mensaje;

  notificacion.classList.remove(
    "oculto",
    "exito",
    "error"
  );

  notificacion.classList.add(tipo);

  setTimeout(() => {

    notificacion.classList.add(
      "oculto"
    );

  }, 3000);
}

// CERRAR SESIÓN
document
  .getElementById("btnSalir")
  .addEventListener("click", () => {
    localStorage.removeItem("siscacao_token");
    localStorage.removeItem("siscacao_usuario");

    window.location.href = "index.html";
  });

// FUNCIÓN GENERAL PARA LLAMAR A LA API
async function apiFetch(url, opciones = {}) {
  opciones.headers = {
    ...(opciones.headers || {}),
    Authorization: `Bearer ${token}`
  };

  const respuesta = await fetch(url, opciones);

  if (respuesta.status === 401) {
    localStorage.clear();
    window.location.href = "index.html";
    return;
  }

  const data = await respuesta.json();

  if (!respuesta.ok) {
    throw new Error(
      data.mensaje || "Ocurrió un error"
    );
  }

  return data;
}

// LISTAR CASERÍOS
async function cargarCaserios() {
  try {
    const texto = document
      .getElementById("buscar")
      .value
      .trim();

    const url =
      `${API}/caserios?q=${encodeURIComponent(texto)}`;

    const respuesta = await apiFetch(url);

    mostrarTabla(respuesta.data);

  } catch (error) {
    tabla.innerHTML = `
      <tr>
        <td colspan="7">
          ${error.message}
        </td>
      </tr>
    `;
  }
}

// MOSTRAR DATOS EN LA TABLA
function mostrarTabla(caserios) {
  if (!caserios.length) {
    tabla.innerHTML = `
      <tr>
        <td colspan="7">
          No se encontraron caseríos.
        </td>
      </tr>
    `;

    return;
  }

  tabla.innerHTML = caserios
    .map(c => `
      <tr>

        <td>
          ${c.id_caserio}
        </td>

        <td>
          <strong>
            ${escapar(c.nombre)}
          </strong>
        </td>

        <td>
          ${escapar(c.distrito)}
        </td>

        <td>
          ${escapar(c.provincia)}
        </td>

        <td>
          ${escapar(c.departamento)}
        </td>

        <td>
          ${escapar(c.observacion || "-")}
        </td>

        <td class="acciones">

          <button
            class="btn-small"
            onclick="editarCaserio(${c.id_caserio})"
          >
            Editar
          </button>

          <button
            class="btn-small danger"
            onclick="desactivarCaserio(${c.id_caserio})"
          >
            Desactivar
          </button>

        </td>

      </tr>
    `)
    .join("");
}

// BOTÓN NUEVO CASERÍO
document
  .getElementById("btnNuevo")
  .addEventListener("click", () => {

    limpiarFormulario();

    document.getElementById(
      "tituloFormulario"
    ).textContent =
      "Registrar nuevo caserío";

    panelFormulario.classList.remove(
      "oculto"
    );

    document
      .getElementById("nombre")
      .focus();
  });

// EDITAR CASERÍO
async function editarCaserio(id) {
  try {
    const respuesta =
      await apiFetch(
        `${API}/caserios/${id}`
      );

    const c = respuesta.data;

    document.getElementById(
      "id_caserio"
    ).value =
      c.id_caserio;

    document.getElementById(
      "nombre"
    ).value =
      c.nombre;

    document.getElementById(
      "distrito"
    ).value =
      c.distrito;

    document.getElementById(
      "provincia"
    ).value =
      c.provincia;

    document.getElementById(
      "departamento"
    ).value =
      c.departamento;

    document.getElementById(
      "observacion"
    ).value =
      c.observacion || "";

    document.getElementById(
      "tituloFormulario"
    ).textContent =
      "Editar caserío";

    panelFormulario.classList.remove(
      "oculto"
    );

    window.scrollTo({
      top: document.body.scrollHeight,
      behavior: "smooth"
    });

  } catch (error) {
    alert(error.message);
  }
}

// GUARDAR O ACTUALIZAR CASERÍO
form.addEventListener(
  "submit",
  async (evento) => {

    evento.preventDefault();

    mensajeFormulario.textContent =
      "Guardando...";

    const id = document.getElementById(
      "id_caserio"
    ).value;

    const datos = {

      nombre:
        document.getElementById(
          "nombre"
        ).value.trim(),

      distrito:
        document.getElementById(
          "distrito"
        ).value.trim(),

      provincia:
        document.getElementById(
          "provincia"
        ).value.trim(),

      departamento:
        document.getElementById(
          "departamento"
        ).value.trim(),

      observacion:
        document.getElementById(
          "observacion"
        ).value.trim()
    };

    try {
      let url =
        `${API}/caserios`;

      let metodo =
        "POST";

      if (id) {
        url += `/${id}`;
        metodo = "PUT";
      }

      const respuesta =
        await apiFetch(
          url,
          {
            method: metodo,

            headers: {
              "Content-Type":
                "application/json"
            },

            body:
              JSON.stringify(datos)
          }
        );

  await cargarCaserios();

cerrarFormulario();

mostrarNotificacion(
  respuesta.mensaje,
  "exito"
);
    } catch (error) {

  mensajeFormulario.textContent =
    error.message;

  mostrarNotificacion(
    error.message,
    "error"
  );
}
  }
);

// DESACTIVAR CASERÍO
async function desactivarCaserio(id) {
  const confirmar = confirm(
    "¿Desea desactivar este caserío?"
  );

  if (!confirmar) {
    return;
  }

  try {
    const respuesta =
      await apiFetch(
        `${API}/caserios/${id}`,
        {
          method: "DELETE"
        }
      );

    await cargarCaserios();

mostrarNotificacion(
  respuesta.mensaje,
  "exito"
);

 } catch (error) {

  mostrarNotificacion(
    error.message,
    "error"
  );
}
}

// BOTÓN BUSCAR
document
  .getElementById("btnBuscar")
  .addEventListener(
    "click",
    cargarCaserios
  );

// BUSCAR CON ENTER
document
  .getElementById("buscar")
  .addEventListener(
    "keydown",
    evento => {

      if (evento.key === "Enter") {
        cargarCaserios();
      }
    }
  );

// LIMPIAR BÚSQUEDA
document
  .getElementById("btnLimpiar")
  .addEventListener(
    "click",
    () => {

      document.getElementById(
        "buscar"
      ).value = "";

      cargarCaserios();
    }
  );

// CANCELAR FORMULARIO
document
  .getElementById("btnCancelar")
  .addEventListener(
    "click",
    cerrarFormulario
  );

// CERRAR FORMULARIO
document
  .getElementById("btnCerrarFormulario")
  .addEventListener(
    "click",
    cerrarFormulario
  );

// FUNCIÓN PARA CERRAR FORMULARIO
function cerrarFormulario() {
  panelFormulario.classList.add(
    "oculto"
  );

  limpiarFormulario();
}

// LIMPIAR FORMULARIO
function limpiarFormulario() {
  form.reset();

  document.getElementById(
    "id_caserio"
  ).value = "";

  document.getElementById(
    "distrito"
  ).value =
    "Curimaná";

  document.getElementById(
    "provincia"
  ).value =
    "Padre Abad";

  document.getElementById(
    "departamento"
  ).value =
    "Ucayali";

  document.getElementById(
    "observacion"
  ).value = "";

  mensajeFormulario.textContent =
    "";
}

// EVITAR QUE TEXTO DE BD SE INTERPRETE COMO HTML
function escapar(valor) {
  return String(valor ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

// CARGAR INFORMACIÓN AL ABRIR
cargarCaserios();