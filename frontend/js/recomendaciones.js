const API =
  "http://localhost:3000/api";

const token =
  localStorage.getItem(
    "siscacao_token"
  );

const usuario =
  JSON.parse(
    localStorage.getItem(
      "siscacao_usuario"
    ) || "null"
  );


if (!token || !usuario) {

  window.location.href =
    "index.html";

}


document.getElementById(
  "usuarioActual"
).textContent =
  `${usuario.nombres} ${usuario.apellidos} · ${usuario.rol}`;


const tabla =
  document.getElementById(
    "tablaRecomendaciones"
  );

const form =
  document.getElementById(
    "formRecomendacion"
  );

const panelFormulario =
  document.getElementById(
    "panelFormulario"
  );

const mensajeFormulario =
  document.getElementById(
    "mensajeFormulario"
  );

const notificacion =
  document.getElementById(
    "notificacion"
  );

const selectHallazgo =
  document.getElementById(
    "id_hallazgo"
  );

const detalleHallazgo =
  document.getElementById(
    "detalleHallazgo"
  );

let hallazgosDisponibles = [];


// CERRAR SESIÓN
document
  .getElementById("btnSalir")
  .addEventListener(
    "click",
    () => {

      localStorage.clear();

      window.location.href =
        "index.html";

    }
  );


// API
async function apiFetch(
  url,
  opciones = {}
) {

  opciones.headers = {

    ...(opciones.headers || {}),

    Authorization:
      `Bearer ${token}`

  };


  const respuesta =
    await fetch(
      url,
      opciones
    );


  if (
    respuesta.status === 401
  ) {

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


// NOTIFICACIÓN
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


// CARGAR HALLAZGOS
async function cargarHallazgos() {

  const respuesta =
    await apiFetch(
      `${API}/hallazgos`
    );


  hallazgosDisponibles =
    respuesta.data;


  selectHallazgo.innerHTML = `

    <option value="">
      Seleccione un hallazgo
    </option>

  `;


  hallazgosDisponibles
    .forEach(h => {

      const opcion =
        document.createElement(
          "option"
        );


      opcion.value =
        h.id_hallazgo;


      opcion.textContent =
        `${h.beneficiario} | ${h.descripcion}`;


      selectHallazgo.appendChild(
        opcion
      );

    });

}


// DETALLE HALLAZGO
selectHallazgo.addEventListener(
  "change",
  mostrarDetalle
);


function mostrarDetalle() {

  const id =
    Number(
      selectHallazgo.value
    );


  if (!id) {

    detalleHallazgo.innerHTML =
      "";

    detalleHallazgo.classList.add(
      "oculto"
    );

    return;

  }


  const h =
    hallazgosDisponibles.find(
      item =>
        Number(item.id_hallazgo) === id
    );


  if (!h) {
    return;
  }


  detalleHallazgo.innerHTML = `

    <strong>
      Datos del hallazgo
    </strong>

    <div>
      <b>Beneficiario:</b>
      ${escapar(h.beneficiario)}
    </div>

    <div>
      <b>Caserío:</b>
      ${escapar(h.caserio)}
    </div>

    <div>
      <b>Actividad:</b>
      ${escapar(h.actividad_programada)}
    </div>

    <div>
      <b>Nivel:</b>
      ${escapar(h.nivel)}
    </div>

    <div>
      <b>Hallazgo:</b>
      ${escapar(h.descripcion)}
    </div>

  `;


  detalleHallazgo.classList.remove(
    "oculto"
  );

}


// LISTAR
async function cargarRecomendaciones() {

  try {

    const q =
      document.getElementById(
        "buscar"
      ).value.trim();


    const estado =
      document.getElementById(
        "filtroEstado"
      ).value;


    const respuesta =
      await apiFetch(
        `${API}/recomendaciones?q=${encodeURIComponent(q)}&estado=${encodeURIComponent(estado)}`
      );


    mostrarTabla(
      respuesta.data
    );


  } catch (error) {

    tabla.innerHTML = `

      <tr>
        <td colspan="8">
          ${escapar(error.message)}
        </td>
      </tr>

    `;

  }

}


// MOSTRAR TABLA
function mostrarTabla(
  recomendaciones
) {

  if (!recomendaciones.length) {

    tabla.innerHTML = `

      <tr>
        <td colspan="8">
          No se encontraron recomendaciones.
        </td>
      </tr>

    `;

    return;

  }


  tabla.innerHTML =
    recomendaciones.map(r => `

      <tr>

        <td>
          ${r.id_recomendacion}
        </td>

        <td>
          ${escapar(r.beneficiario)}
        </td>

        <td>
          ${escapar(r.hallazgo)}
        </td>

        <td>
          ${escapar(r.descripcion)}
        </td>

        <td>
          ${escapar(r.responsable || "-")}
        </td>

        <td>
          ${formatearFecha(r.fecha_limite)}
        </td>

        <td>

          <span class="estado ${claseEstado(r.estado)}">

            ${textoEstado(r.estado)}

          </span>

        </td>

        <td class="acciones">

          <button
            class="btn-small"
            onclick="editarRecomendacion(${r.id_recomendacion})"
          >
            Editar
          </button>

          <button
            class="btn-small danger"
            onclick="desactivarRecomendacion(${r.id_recomendacion})"
          >
            Desactivar
          </button>

        </td>

      </tr>

    `).join("");

}


// NUEVA
document
  .getElementById("btnNuevo")
  .addEventListener(
    "click",
    () => {

      limpiarFormulario();

      document.getElementById(
        "tituloFormulario"
      ).textContent =
        "Registrar nueva recomendación";

      panelFormulario.classList.remove(
        "oculto"
      );

    }
  );


// EDITAR
async function editarRecomendacion(
  id
) {

  try {

    const respuesta =
      await apiFetch(
        `${API}/recomendaciones/${id}`
      );


    const r =
      respuesta.data;


    document.getElementById(
      "id_recomendacion"
    ).value =
      r.id_recomendacion;


    selectHallazgo.value =
      r.id_hallazgo;


    mostrarDetalle();


    document.getElementById(
      "descripcion"
    ).value =
      r.descripcion;


    document.getElementById(
      "responsable"
    ).value =
      r.responsable || "";


    document.getElementById(
      "fecha_limite"
    ).value =
      r.fecha_limite
        ? String(r.fecha_limite).slice(0, 10)
        : "";


    document.getElementById(
      "tituloFormulario"
    ).textContent =
      "Editar recomendación";


    panelFormulario.classList.remove(
      "oculto"
    );


  } catch (error) {

    mostrarNotificacion(
      error.message,
      "error"
    );

  }

}


// GUARDAR
form.addEventListener(
  "submit",
  async evento => {

    evento.preventDefault();


    const id =
      document.getElementById(
        "id_recomendacion"
      ).value;


    const datos = {

      id_hallazgo:
        selectHallazgo.value,

      descripcion:
        document.getElementById(
          "descripcion"
        ).value.trim(),

      responsable:
        document.getElementById(
          "responsable"
        ).value.trim(),

      fecha_limite:
        document.getElementById(
          "fecha_limite"
        ).value

    };


    try {

      let url =
        `${API}/recomendaciones`;

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
            method:
              metodo,

            headers: {
              "Content-Type":
                "application/json"
            },

            body:
              JSON.stringify(datos)
          }
        );


      await cargarRecomendaciones();


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


// DESACTIVAR
async function desactivarRecomendacion(
  id
) {

  if (
    !confirm(
      "¿Desea desactivar esta recomendación?"
    )
  ) {
    return;
  }


  try {

    const respuesta =
      await apiFetch(
        `${API}/recomendaciones/${id}`,
        {
          method:
            "DELETE"
        }
      );


    await cargarRecomendaciones();


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


// FILTROS
document
  .getElementById("btnBuscar")
  .addEventListener(
    "click",
    cargarRecomendaciones
  );


document
  .getElementById("filtroEstado")
  .addEventListener(
    "change",
    cargarRecomendaciones
  );


document
  .getElementById("btnLimpiar")
  .addEventListener(
    "click",
    () => {

      document.getElementById(
        "buscar"
      ).value =
        "";


      document.getElementById(
        "filtroEstado"
      ).value =
        "";


      cargarRecomendaciones();

    }
  );


// CANCELAR
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


function cerrarFormulario() {

  panelFormulario.classList.add(
    "oculto"
  );

  limpiarFormulario();

}


function limpiarFormulario() {

  form.reset();

  document.getElementById(
    "id_recomendacion"
  ).value =
    "";

  detalleHallazgo.innerHTML =
    "";

  detalleHallazgo.classList.add(
    "oculto"
  );

  mensajeFormulario.textContent =
    "";

}


// UTILIDADES
function formatearFecha(
  fecha
) {

  if (!fecha) {
    return "-";
  }


  const valor =
    String(fecha).slice(
      0,
      10
    );


  const [
    anio,
    mes,
    dia
  ] =
    valor.split("-");


  return `${dia}/${mes}/${anio}`;

}


function textoEstado(
  estado
) {

  if (
    estado === "CUMPLIDO"
  ) {
    return "Cumplido";
  }


  if (
    estado === "EN_PROCESO"
  ) {
    return "En proceso";
  }


  return "Pendiente";

}


function claseEstado(
  estado
) {

  if (
    estado === "CUMPLIDO"
  ) {
    return "estado-ok";
  }


  if (
    estado === "EN_PROCESO"
  ) {
    return "estado-parcial";
  }


  return "estado-no";

}


function escapar(valor) {

  return String(valor ?? "")

    .replaceAll("&", "&amp;")

    .replaceAll("<", "&lt;")

    .replaceAll(">", "&gt;")

    .replaceAll('"', "&quot;")

    .replaceAll("'", "&#039;");

}


// INICIAR
async function iniciar() {

  try {

    await cargarHallazgos();

    await cargarRecomendaciones();

  } catch (error) {

    mostrarNotificacion(
      "No se pudo iniciar el módulo de recomendaciones",
      "error"
    );

  }

}


iniciar();