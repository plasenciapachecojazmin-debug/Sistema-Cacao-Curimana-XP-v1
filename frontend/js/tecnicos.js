const API = "http://localhost:3000/api";

const token =
  localStorage.getItem("siscacao_token");

const usuario =
  JSON.parse(
    localStorage.getItem("siscacao_usuario") || "null"
  );


// =======================================
// VALIDAR SESIÓN
// =======================================

if (!token || !usuario) {
  window.location.href = "index.html";
}


// =======================================
// MOSTRAR USUARIO ACTUAL
// =======================================

document.getElementById(
  "usuarioActual"
).textContent =
  `${usuario.nombres} ${usuario.apellidos} · ${usuario.rol}`;

   
// =======================================
// ELEMENTOS PRINCIPALES
// =======================================

const tabla =
  document.getElementById("tablaTecnicos");

const panelFormulario =
  document.getElementById("panelFormulario");

const form =
  document.getElementById("formTecnico");

const mensajeFormulario =
  document.getElementById("mensajeFormulario");

const notificacion =
  document.getElementById("notificacion");


// =======================================
// CERRAR SESIÓN
// =======================================

document
  .getElementById("btnSalir")
  .addEventListener("click", () => {

    localStorage.removeItem(
      "siscacao_token"
    );

    localStorage.removeItem(
      "siscacao_usuario"
    );

    window.location.href =
      "index.html";

  });


// =======================================
// FUNCIÓN GENERAL PARA LLAMAR A LA API
// =======================================

async function apiFetch(
  url,
  opciones = {}
) {

  opciones.headers = {
    ...(opciones.headers || {}),
    Authorization: `Bearer ${token}`
  };


  const respuesta =
    await fetch(url, opciones);


  if (respuesta.status === 401) {

    localStorage.clear();

    window.location.href =
      "index.html";

    return;
  }


  const data =
    await respuesta.json();


  if (!respuesta.ok) {

    throw new Error(
      data.mensaje ||
      "Ocurrió un error"
    );
  }


  return data;
}


// =======================================
// NOTIFICACIONES
// =======================================

function mostrarNotificacion(
  mensaje,
  tipo = "exito"
) {

  notificacion.textContent =
    mensaje;


  notificacion.classList.remove(
    "oculto",
    "exito",
    "error"
  );


  notificacion.classList.add(
    tipo
  );


  setTimeout(() => {

    notificacion.classList.add(
      "oculto"
    );

  }, 3000);
}


// =======================================
// CARGAR TÉCNICOS
// =======================================

async function cargarTecnicos() {

  try {

    const texto =
      document
        .getElementById("buscar")
        .value
        .trim();


    const url =
      `${API}/tecnicos?q=${encodeURIComponent(texto)}`;


    const respuesta =
      await apiFetch(url);


    mostrarTabla(
      respuesta.data
    );


  } catch (error) {

    tabla.innerHTML = `

      <tr>

        <td colspan="7">

          ${escapar(error.message)}

        </td>

      </tr>

    `;
  }
}


// =======================================
// MOSTRAR TABLA
// =======================================

function mostrarTabla(tecnicos) {

  if (!tecnicos.length) {

    tabla.innerHTML = `

      <tr>

        <td colspan="7">

          No se encontraron técnicos.

        </td>

      </tr>

    `;

    return;
  }


  tabla.innerHTML =
    tecnicos
      .map(t => `

        <tr>

          <td>
            ${t.id_tecnico}
          </td>

          <td>
            <strong>
              ${escapar(t.nombres)}
            </strong>
          </td>

          <td>
            ${escapar(t.apellidos)}
          </td>

          <td>
            ${escapar(t.cargo)}
          </td>

          <td>
            ${escapar(t.telefono || "-")}
          </td>

          <td>
            ${escapar(t.email || "-")}
          </td>

          <td class="acciones">

            <button
              class="btn-small"
              onclick="editarTecnico(${t.id_tecnico})"
            >
              Editar
            </button>


            <button
              class="btn-small danger"
              onclick="desactivarTecnico(${t.id_tecnico})"
            >
              Desactivar
            </button>

          </td>

        </tr>

      `)
      .join("");
}


// =======================================
// NUEVO TÉCNICO
// =======================================

document
  .getElementById("btnNuevo")
  .addEventListener("click", () => {

    limpiarFormulario();


    document.getElementById(
      "tituloFormulario"
    ).textContent =
      "Registrar nuevo técnico";


    panelFormulario.classList.remove(
      "oculto"
    );


    document
      .getElementById("nombres")
      .focus();

  });


// =======================================
// EDITAR TÉCNICO
// =======================================

async function editarTecnico(id) {

  try {

    const respuesta =
      await apiFetch(
        `${API}/tecnicos/${id}`
      );


    const t =
      respuesta.data;


    document.getElementById(
      "id_tecnico"
    ).value =
      t.id_tecnico;


    document.getElementById(
      "nombres"
    ).value =
      t.nombres;


    document.getElementById(
      "apellidos"
    ).value =
      t.apellidos;


    document.getElementById(
      "cargo"
    ).value =
      t.cargo;


    document.getElementById(
      "telefono"
    ).value =
      t.telefono || "";


    document.getElementById(
      "email"
    ).value =
      t.email || "";


    document.getElementById(
      "tituloFormulario"
    ).textContent =
      "Editar técnico";


    panelFormulario.classList.remove(
      "oculto"
    );


    window.scrollTo({
      top:
        document.body.scrollHeight,
      behavior: "smooth"
    });


  } catch (error) {

    mostrarNotificacion(
      error.message,
      "error"
    );
  }
}


// =======================================
// GUARDAR / ACTUALIZAR
// =======================================

form.addEventListener(
  "submit",
  async (evento) => {

    evento.preventDefault();


    mensajeFormulario.textContent =
      "Guardando...";


    const id =
      document.getElementById(
        "id_tecnico"
      ).value;


    const datos = {

      nombres:
        document.getElementById(
          "nombres"
        ).value.trim(),

      apellidos:
        document.getElementById(
          "apellidos"
        ).value.trim(),

      cargo:
        document.getElementById(
          "cargo"
        ).value.trim(),

      telefono:
        document.getElementById(
          "telefono"
        ).value.trim(),

      email:
        document.getElementById(
          "email"
        ).value.trim()

    };


    try {

      let url =
        `${API}/tecnicos`;

      let metodo =
        "POST";


      if (id) {

        url += `/${id}`;

        metodo =
          "PUT";
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


      await cargarTecnicos();


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


// =======================================
// DESACTIVAR TÉCNICO
// =======================================

async function desactivarTecnico(id) {

  const confirmar =
    confirm(
      "¿Desea desactivar este técnico?"
    );


  if (!confirmar) {
    return;
  }


  try {

    const respuesta =
      await apiFetch(
        `${API}/tecnicos/${id}`,
        {
          method: "DELETE"
        }
      );


    await cargarTecnicos();


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


// =======================================
// BUSCAR
// =======================================

document
  .getElementById("btnBuscar")
  .addEventListener(
    "click",
    cargarTecnicos
  );


// BUSCAR CON ENTER

document
  .getElementById("buscar")
  .addEventListener(
    "keydown",
    evento => {

      if (
        evento.key === "Enter"
      ) {

        cargarTecnicos();
      }
    }
  );


// =======================================
// LIMPIAR BÚSQUEDA
// =======================================

document
  .getElementById("btnLimpiar")
  .addEventListener(
    "click",
    () => {

      document.getElementById(
        "buscar"
      ).value = "";


      cargarTecnicos();
    }
  );


// =======================================
// CANCELAR FORMULARIO
// =======================================

document
  .getElementById("btnCancelar")
  .addEventListener(
    "click",
    cerrarFormulario
  );


document
  .getElementById(
    "btnCerrarFormulario"
  )
  .addEventListener(
    "click",
    cerrarFormulario
  );


// =======================================
// CERRAR FORMULARIO
// =======================================

function cerrarFormulario() {

  panelFormulario.classList.add(
    "oculto"
  );


  limpiarFormulario();
}


// =======================================
// LIMPIAR FORMULARIO
// =======================================

function limpiarFormulario() {

  form.reset();


  document.getElementById(
    "id_tecnico"
  ).value = "";


  mensajeFormulario.textContent =
    "";
}


// =======================================
// SEGURIDAD PARA TEXTO HTML
// =======================================

function escapar(valor) {

  return String(valor ?? "")

    .replaceAll("&", "&amp;")

    .replaceAll("<", "&lt;")

    .replaceAll(">", "&gt;")

    .replaceAll('"', "&quot;")

    .replaceAll("'", "&#039;");
}


// =======================================
// INICIO
// =======================================

cargarTecnicos();