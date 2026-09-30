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
    "formSeguimiento"
  );

const panelSeguimiento =
  document.getElementById(
    "panelSeguimiento"
  );

const panelHistorial =
  document.getElementById(
    "panelHistorial"
  );

const tablaHistorial =
  document.getElementById(
    "tablaHistorial"
  );

const detalleRecomendacion =
  document.getElementById(
    "detalleRecomendacion"
  );

const notificacion =
  document.getElementById(
    "notificacion"
  );

const mensajeFormulario =
  document.getElementById(
    "mensajeFormulario"
  );

let recomendacionesActuales = [];


// =====================================
// CERRAR SESIÓN
// =====================================

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


// =====================================
// API
// =====================================

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


// =====================================
// NOTIFICACIÓN
// =====================================

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


// =====================================
// CARGAR RECOMENDACIONES
// =====================================

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


    recomendacionesActuales =
      respuesta.data;


    mostrarTabla(
      recomendacionesActuales
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


// =====================================
// MOSTRAR TABLA
// =====================================

function mostrarTabla(
  recomendaciones
) {

  if (!recomendaciones.length) {

    tabla.innerHTML = `

      <tr>

        <td colspan="7">
          No se encontraron recomendaciones.
        </td>

      </tr>

    `;

    return;

  }


  tabla.innerHTML =
    recomendaciones
      .map(r => `

        <tr>

          <td>
            ${r.id_recomendacion}
          </td>


          <td>
            ${escapar(r.beneficiario)}
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

            <span
              class="estado ${claseEstado(r.estado)}"
            >

              ${textoEstado(r.estado)}

            </span>

          </td>


          <td class="acciones">

            <button
              class="btn-small"
              onclick="abrirSeguimiento(${r.id_recomendacion})"
            >
              Actualizar
            </button>


            <button
              class="btn-small secondary"
              onclick="verHistorial(${r.id_recomendacion})"
            >
              Historial
            </button>

          </td>

        </tr>

      `)
      .join("");

}


// =====================================
// ABRIR SEGUIMIENTO
// =====================================

function abrirSeguimiento(id) {

  const r =
    recomendacionesActuales.find(
      item =>
        Number(item.id_recomendacion) ===
        Number(id)
    );


  if (!r) {
    return;
  }


  document.getElementById(
    "id_recomendacion"
  ).value =
    r.id_recomendacion;


  document.getElementById(
    "estado_actual"
  ).value =
    r.estado;


  document.getElementById(
    "nuevo_estado"
  ).value =
    "";


  document.getElementById(
    "observacion"
  ).value =
    "";


  mensajeFormulario.textContent =
    "";


  detalleRecomendacion.innerHTML = `

    <strong>
      Recomendación seleccionada
    </strong>

    <div>
      <b>Beneficiario:</b>
      ${escapar(r.beneficiario)}
    </div>

    <div>
      <b>Hallazgo:</b>
      ${escapar(r.hallazgo)}
    </div>

    <div>
      <b>Recomendación:</b>
      ${escapar(r.descripcion)}
    </div>

    <div>
      <b>Responsable:</b>
      ${escapar(r.responsable || "-")}
    </div>

    <div>
      <b>Estado actual:</b>
      ${textoEstado(r.estado)}
    </div>

  `;


  panelSeguimiento.classList.remove(
    "oculto"
  );


  window.scrollTo({
    top:
      document.body.scrollHeight,
    behavior:
      "smooth"
  });

}


// =====================================
// GUARDAR CAMBIO DE ESTADO
// =====================================

form.addEventListener(
  "submit",
  async evento => {

    evento.preventDefault();


    const id =
      document.getElementById(
        "id_recomendacion"
      ).value;


    const estadoActual =
      document.getElementById(
        "estado_actual"
      ).value;


    const nuevoEstado =
      document.getElementById(
        "nuevo_estado"
      ).value;


    const observacion =
      document.getElementById(
        "observacion"
      ).value.trim();


    if (!nuevoEstado) {

      mostrarNotificacion(
        "Seleccione el nuevo estado",
        "error"
      );

      return;

    }


    if (
      nuevoEstado ===
      estadoActual
    ) {

      mostrarNotificacion(
        "Seleccione un estado diferente al actual",
        "error"
      );

      return;

    }


    try {

      const respuesta =
        await apiFetch(
          `${API}/recomendaciones/${id}/estado`,
          {

            method:
              "PATCH",

            headers: {
              "Content-Type":
                "application/json"
            },

            body:
              JSON.stringify({
                estado:
                  nuevoEstado,

                observacion:
                  observacion
              })

          }
        );


      cerrarSeguimiento();


      await cargarRecomendaciones();


      mostrarNotificacion(
        respuesta.mensaje,
        "exito"
      );


      await verHistorial(id);


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


// =====================================
// VER HISTORIAL
// =====================================

async function verHistorial(id) {

  try {

    const respuesta =
      await apiFetch(
        `${API}/seguimientos/recomendacion/${id}`
      );


    const movimientos =
      respuesta.data;


    if (!movimientos.length) {

      tablaHistorial.innerHTML = `

        <tr>

          <td colspan="5">
            Aún no existen movimientos
            para esta recomendación.
          </td>

        </tr>

      `;

    } else {

      tablaHistorial.innerHTML =
        movimientos.map(s => `

          <tr>

            <td>
              ${formatearFecha(s.fecha)}
            </td>


            <td>
              ${textoEstado(s.estado_anterior)}
            </td>


            <td>

              <span
                class="estado ${claseEstado(s.estado_nuevo)}"
              >
                ${textoEstado(s.estado_nuevo)}
              </span>

            </td>


            <td>
              ${escapar(s.observacion || "-")}
            </td>


            <td>
              ${escapar(s.usuario_registro)}
            </td>

          </tr>

        `).join("");

    }


    panelHistorial.classList.remove(
      "oculto"
    );


    window.scrollTo({
      top:
        document.body.scrollHeight,
      behavior:
        "smooth"
    });


  } catch (error) {

    mostrarNotificacion(
      error.message,
      "error"
    );

  }

}


// =====================================
// FILTROS
// =====================================

document
  .getElementById(
    "btnBuscar"
  )
  .addEventListener(
    "click",
    cargarRecomendaciones
  );


document
  .getElementById(
    "buscar"
  )
  .addEventListener(
    "keydown",
    evento => {

      if (
        evento.key === "Enter"
      ) {

        cargarRecomendaciones();

      }

    }
  );


document
  .getElementById(
    "filtroEstado"
  )
  .addEventListener(
    "change",
    cargarRecomendaciones
  );


document
  .getElementById(
    "btnLimpiar"
  )
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


// =====================================
// CERRAR PANELES
// =====================================

document
  .getElementById(
    "btnCancelar"
  )
  .addEventListener(
    "click",
    cerrarSeguimiento
  );


document
  .getElementById(
    "btnCerrarSeguimiento"
  )
  .addEventListener(
    "click",
    cerrarSeguimiento
  );


document
  .getElementById(
    "btnCerrarHistorial"
  )
  .addEventListener(
    "click",
    () => {

      panelHistorial.classList.add(
        "oculto"
      );

    }
  );


function cerrarSeguimiento() {

  panelSeguimiento.classList.add(
    "oculto"
  );


  form.reset();


  mensajeFormulario.textContent =
    "";

}


// =====================================
// UTILIDADES
// =====================================

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


function escapar(valor) {

  return String(valor ?? "")

    .replaceAll("&", "&amp;")

    .replaceAll("<", "&lt;")

    .replaceAll(">", "&gt;")

    .replaceAll('"', "&quot;")

    .replaceAll("'", "&#039;");

}


// =====================================
// INICIO
// =====================================

cargarRecomendaciones();