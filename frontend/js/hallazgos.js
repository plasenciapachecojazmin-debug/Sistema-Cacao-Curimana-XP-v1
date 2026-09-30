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
// MOSTRAR USUARIO
// =======================================

document.getElementById(
  "usuarioActual"
).textContent =
  `${usuario.nombres} ${usuario.apellidos} · ${usuario.rol}`;


// =======================================
// ELEMENTOS
// =======================================

const tabla =
  document.getElementById("tablaHallazgos");

const form =
  document.getElementById("formHallazgo");

const panelFormulario =
  document.getElementById("panelFormulario");

const mensajeFormulario =
  document.getElementById("mensajeFormulario");

const notificacion =
  document.getElementById("notificacion");

const selectSupervision =
  document.getElementById("id_supervision");

const detalleSupervision =
  document.getElementById("detalleSupervision");

let supervisionesDisponibles = [];


// =======================================
// CERRAR SESIÓN
// =======================================

document
  .getElementById("btnSalir")
  .addEventListener("click", () => {

    localStorage.clear();

    window.location.href =
      "index.html";

  });


// =======================================
// FUNCIÓN GENERAL API
// =======================================

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
// CARGAR SUPERVISIONES
// =======================================

async function cargarSupervisiones() {

  try {

    const respuesta =
      await apiFetch(
        `${API}/supervisiones`
      );


    supervisionesDisponibles =
      respuesta.data;


    selectSupervision.innerHTML = `

      <option value="">
        Seleccione una supervisión
      </option>

    `;


    supervisionesDisponibles
      .forEach(s => {

        const opcion =
          document.createElement(
            "option"
          );


        opcion.value =
          s.id_supervision;


        opcion.textContent =
          `${formatearFecha(s.fecha)} | ${s.beneficiario} | ${s.actividad_programada}`;


        selectSupervision.appendChild(
          opcion
        );

      });


  } catch (error) {

    mostrarNotificacion(
      "No se pudieron cargar las supervisiones",
      "error"
    );

  }

}


// =======================================
// DETALLE DE SUPERVISIÓN
// =======================================

selectSupervision
  .addEventListener(
    "change",
    mostrarDetalle
  );


function mostrarDetalle() {

  const id =
    Number(
      selectSupervision.value
    );


  if (!id) {

    detalleSupervision.innerHTML =
      "";

    detalleSupervision.classList.add(
      "oculto"
    );

    return;

  }


  const supervision =
    supervisionesDisponibles.find(
      item =>
        Number(item.id_supervision) === id
    );


  if (!supervision) {

    detalleSupervision.classList.add(
      "oculto"
    );

    return;

  }


  detalleSupervision.innerHTML = `

    <strong>
      Datos de la supervisión
    </strong>

    <div>
      <b>Fecha:</b>
      ${formatearFecha(supervision.fecha)}
    </div>

    <div>
      <b>Beneficiario:</b>
      ${escapar(supervision.beneficiario)}
    </div>

    <div>
      <b>Técnico:</b>
      ${escapar(supervision.tecnico)}
    </div>

    <div>
      <b>Caserío:</b>
      ${escapar(supervision.caserio)}
    </div>

    <div>
      <b>Parcela:</b>
      ${escapar(supervision.nombre_predio || "-")}
    </div>

    <div>
      <b>Actividad:</b>
      ${escapar(supervision.actividad_programada)}
    </div>

    <div>
      <b>Cumplimiento:</b>
      ${textoCumplimiento(supervision.cumplimiento)}
    </div>

  `;


  detalleSupervision.classList.remove(
    "oculto"
  );

}


// =======================================
// LISTAR / BUSCAR HALLAZGOS
// =======================================

async function cargarHallazgos() {

  try {

    const q =
      document
        .getElementById("buscar")
        .value
        .trim();


    const nivel =
      document
        .getElementById("filtroNivel")
        .value;


    const respuesta =
      await apiFetch(
        `${API}/hallazgos?q=${encodeURIComponent(q)}&nivel=${encodeURIComponent(nivel)}`
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


// =======================================
// MOSTRAR TABLA
// =======================================

function mostrarTabla(
  hallazgos
) {

  if (!hallazgos.length) {

    tabla.innerHTML = `

      <tr>

        <td colspan="8">
          No se encontraron hallazgos.
        </td>

      </tr>

    `;

    return;

  }


  tabla.innerHTML =
    hallazgos
      .map(h => `

        <tr>

          <td>
            ${h.id_hallazgo}
          </td>

          <td>
            ${formatearFecha(h.fecha)}
          </td>

          <td>
            ${escapar(h.beneficiario)}
          </td>

          <td>
            ${escapar(h.caserio)}
          </td>

          <td>
            ${escapar(h.actividad_programada)}
          </td>

          <td>
            ${escapar(h.descripcion)}
          </td>

          <td>

            <span class="estado ${claseNivel(h.nivel)}">

              ${textoNivel(h.nivel)}

            </span>

          </td>

          <td class="acciones">

            <button
              class="btn-small"
              onclick="editarHallazgo(${h.id_hallazgo})"
            >
              Editar
            </button>

            <button
              class="btn-small danger"
              onclick="desactivarHallazgo(${h.id_hallazgo})"
            >
              Desactivar
            </button>

          </td>

        </tr>

      `)
      .join("");

}


// =======================================
// NUEVO HALLAZGO
// =======================================

document
  .getElementById("btnNuevo")
  .addEventListener(
    "click",
    () => {

      limpiarFormulario();


      document.getElementById(
        "tituloFormulario"
      ).textContent =
        "Registrar nuevo hallazgo";


      panelFormulario.classList.remove(
        "oculto"
      );


      selectSupervision.focus();

    }
  );


// =======================================
// EDITAR HALLAZGO
// =======================================

async function editarHallazgo(id) {

  try {

    const respuesta =
      await apiFetch(
        `${API}/hallazgos/${id}`
      );


    const h =
      respuesta.data;


    document.getElementById(
      "id_hallazgo"
    ).value =
      h.id_hallazgo;


    selectSupervision.value =
      h.id_supervision;


    mostrarDetalle();


    document.getElementById(
      "descripcion"
    ).value =
      h.descripcion;


    document.getElementById(
      "nivel"
    ).value =
      h.nivel;


    document.getElementById(
      "tituloFormulario"
    ).textContent =
      "Editar hallazgo";


    panelFormulario.classList.remove(
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


// =======================================
// GUARDAR / ACTUALIZAR
// =======================================

form.addEventListener(
  "submit",
  async evento => {

    evento.preventDefault();


    mensajeFormulario.textContent =
      "Guardando...";


    const id =
      document.getElementById(
        "id_hallazgo"
      ).value;


    const datos = {

      id_supervision:
        selectSupervision.value,

      descripcion:
        document.getElementById(
          "descripcion"
        ).value.trim(),

      nivel:
        document.getElementById(
          "nivel"
        ).value

    };


    try {

      let url =
        `${API}/hallazgos`;

      let metodo =
        "POST";


      if (id) {

        url +=
          `/${id}`;

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


      await cargarHallazgos();


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
// DESACTIVAR
// =======================================

async function desactivarHallazgo(
  id
) {

  const confirmar =
    confirm(
      "¿Desea desactivar este hallazgo?"
    );


  if (!confirmar) {
    return;
  }


  try {

    const respuesta =
      await apiFetch(
        `${API}/hallazgos/${id}`,
        {
          method:
            "DELETE"
        }
      );


    await cargarHallazgos();


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
    cargarHallazgos
  );


document
  .getElementById("buscar")
  .addEventListener(
    "keydown",
    evento => {

      if (evento.key === "Enter") {

        cargarHallazgos();

      }

    }
  );


// =======================================
// FILTRO POR NIVEL
// =======================================

document
  .getElementById("filtroNivel")
  .addEventListener(
    "change",
    cargarHallazgos
  );


// =======================================
// LIMPIAR FILTROS
// =======================================

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
        "filtroNivel"
      ).value =
        "";


      cargarHallazgos();

    }
  );


// =======================================
// CANCELAR
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
    "id_hallazgo"
  ).value =
    "";


  document.getElementById(
    "nivel"
  ).value =
    "MEDIO";


  detalleSupervision.innerHTML =
    "";


  detalleSupervision.classList.add(
    "oculto"
  );


  mensajeFormulario.textContent =
    "";

}


// =======================================
// UTILIDADES
// =======================================

function formatearFecha(fecha) {

  if (!fecha) {
    return "-";
  }


  const valor =
    String(fecha)
      .slice(0, 10);


  const [
    anio,
    mes,
    dia
  ] =
    valor.split("-");


  return `${dia}/${mes}/${anio}`;

}


function textoNivel(nivel) {

  if (nivel === "BAJO") {
    return "Bajo";
  }

  if (nivel === "ALTO") {
    return "Alto";
  }

  return "Medio";

}


function claseNivel(nivel) {

  if (nivel === "BAJO") {
    return "estado-ok";
  }

  if (nivel === "ALTO") {
    return "estado-no";
  }

  return "estado-parcial";

}


function textoCumplimiento(valor) {

  if (valor === "CUMPLIDO") {
    return "Cumplido";
  }

  if (valor === "PARCIAL") {
    return "Parcial";
  }

  return "No cumplido";

}


function escapar(valor) {

  return String(valor ?? "")

    .replaceAll("&", "&amp;")

    .replaceAll("<", "&lt;")

    .replaceAll(">", "&gt;")

    .replaceAll('"', "&quot;")

    .replaceAll("'", "&#039;");

}


// =======================================
// INICIO DEL MÓDULO
// =======================================

async function iniciar() {

  try {

    await cargarSupervisiones();

    await cargarHallazgos();

  } catch (error) {

    mostrarNotificacion(
      "No se pudo iniciar el módulo de Hallazgos",
      "error"
    );

  }

}


iniciar();