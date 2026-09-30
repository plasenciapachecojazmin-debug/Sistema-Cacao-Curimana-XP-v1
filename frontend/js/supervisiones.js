const API = "http://localhost:3000/api";

const token =
  localStorage.getItem("siscacao_token");

const usuario =
  JSON.parse(
    localStorage.getItem("siscacao_usuario") || "null"
  );


if (!token || !usuario) {

  window.location.href =
    "index.html";

}


document.getElementById(
  "usuarioActual"
).textContent =
  `${usuario.nombres} ${usuario.apellidos} · ${usuario.rol}`;


// =======================================
// ELEMENTOS
// =======================================

const tabla =
  document.getElementById(
    "tablaSupervisiones"
  );

const form =
  document.getElementById(
    "formSupervision"
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

const selectVisita =
  document.getElementById(
    "id_visita"
  );

const detalleVisita =
  document.getElementById(
    "detalleVisita"
  );

let visitasDisponibles = [];


// =======================================
// CERRAR SESIÓN
// =======================================

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


// =======================================
// API
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


// =======================================
// NOTIFICACIÓN
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
// CARGAR VISITAS TIPO SUPERVISIÓN
// =======================================

async function cargarVisitas() {

  try {

    const respuesta =
      await apiFetch(
        `${API}/visitas?tipo=SUPERVISION`
      );


    visitasDisponibles =
      respuesta.data;


    selectVisita.innerHTML = `

      <option value="">
        Seleccione una visita
      </option>

    `;


    visitasDisponibles
      .forEach(v => {

        const opcion =
          document.createElement(
            "option"
          );


        opcion.value =
          v.id_visita;


        opcion.textContent =
          `${formatearFecha(v.fecha)} | ${v.beneficiario} | ${v.tecnico}`;


        selectVisita.appendChild(
          opcion
        );

      });


  } catch (error) {

    mostrarNotificacion(
      "No se pudieron cargar las visitas",
      "error"
    );

  }

}


// =======================================
// MOSTRAR DETALLE DE VISITA
// =======================================

selectVisita.addEventListener(
  "change",
  mostrarDetalleVisita
);


function mostrarDetalleVisita() {

  const id =
    Number(
      selectVisita.value
    );


  if (!id) {

    detalleVisita.classList.add(
      "oculto"
    );

    detalleVisita.innerHTML =
      "";

    return;

  }


  const visita =
    visitasDisponibles.find(
      v =>
        Number(v.id_visita) === id
    );


  if (!visita) {

    detalleVisita.classList.add(
      "oculto"
    );

    return;

  }


  detalleVisita.innerHTML = `

    <strong>
      Datos de la visita
    </strong>

    <div>
      <b>Técnico:</b>
      ${escapar(visita.tecnico)}
    </div>

    <div>
      <b>Beneficiario:</b>
      ${escapar(visita.beneficiario)}
    </div>

    <div>
      <b>Caserío:</b>
      ${escapar(visita.caserio)}
    </div>

    <div>
      <b>Parcela:</b>
      ${escapar(
        visita.nombre_predio || "-"
      )}
    </div>

    <div>
      <b>Objetivo:</b>
      ${escapar(visita.objetivo)}
    </div>

  `;


  detalleVisita.classList.remove(
    "oculto"
  );

}


// =======================================
// CARGAR SUPERVISIONES
// =======================================

async function cargarSupervisiones() {

  try {

    const q =
      document.getElementById(
        "buscar"
      ).value.trim();


    const cumplimiento =
      document.getElementById(
        "filtroCumplimiento"
      ).value;


    const respuesta =
      await apiFetch(

        `${API}/supervisiones?q=${encodeURIComponent(q)}&cumplimiento=${encodeURIComponent(cumplimiento)}`

      );


    mostrarTabla(
      respuesta.data
    );


  } catch (error) {

    tabla.innerHTML = `

      <tr>

        <td colspan="10">
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
  supervisiones
) {

  if (
    !supervisiones.length
  ) {

    tabla.innerHTML = `

      <tr>

        <td colspan="10">
          No se encontraron supervisiones.
        </td>

      </tr>

    `;

    return;

  }


  tabla.innerHTML =
    supervisiones
      .map(s => `

        <tr>

          <td>
            ${s.id_supervision}
          </td>


          <td>
            ${formatearFecha(s.fecha)}
          </td>


          <td>
            ${escapar(s.tecnico)}
          </td>


          <td>
            ${escapar(s.beneficiario)}
          </td>


          <td>
            ${escapar(s.caserio)}
          </td>


          <td>
            ${escapar(
              s.nombre_predio || "-"
            )}
          </td>


          <td>
            ${escapar(
              s.actividad_programada
            )}
          </td>


          <td>

            <span class="estado ${claseCumplimiento(s.cumplimiento)}">

              ${textoCumplimiento(s.cumplimiento)}

            </span>

          </td>


          <td>
            ${escapar(
              s.observacion || "-"
            )}
          </td>


          <td class="acciones">

            <button
              class="btn-small"
              onclick="editarSupervision(${s.id_supervision})"
            >
              Editar
            </button>


            <button
              class="btn-small danger"
              onclick="desactivarSupervision(${s.id_supervision})"
            >
              Desactivar
            </button>

          </td>

        </tr>

      `)
      .join("");

}


// =======================================
// NUEVA SUPERVISIÓN
// =======================================

document
  .getElementById(
    "btnNuevo"
  )
  .addEventListener(
    "click",
    () => {

      limpiarFormulario();


      document.getElementById(
        "tituloFormulario"
      ).textContent =
        "Registrar nueva supervisión";


      panelFormulario.classList.remove(
        "oculto"
      );


      selectVisita.focus();

    }
  );


// =======================================
// EDITAR
// =======================================

async function editarSupervision(
  id
) {

  try {

    const respuesta =
      await apiFetch(
        `${API}/supervisiones/${id}`
      );


    const s =
      respuesta.data;


    document.getElementById(
      "id_supervision"
    ).value =
      s.id_supervision;


    selectVisita.value =
      s.id_visita;


    mostrarDetalleVisita();


    document.getElementById(
      "actividad_programada"
    ).value =
      s.actividad_programada;


    document.getElementById(
      "cumplimiento"
    ).value =
      s.cumplimiento;


    document.getElementById(
      "observacion"
    ).value =
      s.observacion || "";


    document.getElementById(
      "tituloFormulario"
    ).textContent =
      "Editar supervisión";


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
// GUARDAR
// =======================================

form.addEventListener(
  "submit",
  async evento => {

    evento.preventDefault();


    const id =
      document.getElementById(
        "id_supervision"
      ).value;


    const datos = {

      id_visita:
        selectVisita.value,

      actividad_programada:
        document.getElementById(
          "actividad_programada"
        ).value.trim(),

      cumplimiento:
        document.getElementById(
          "cumplimiento"
        ).value,

      observacion:
        document.getElementById(
          "observacion"
        ).value.trim()

    };


    try {

      let url =
        `${API}/supervisiones`;

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


      await cargarSupervisiones();


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

async function desactivarSupervision(
  id
) {

  if (
    !confirm(
      "¿Desea desactivar esta supervisión?"
    )
  ) {
    return;
  }


  try {

    const respuesta =
      await apiFetch(
        `${API}/supervisiones/${id}`,
        {
          method:
            "DELETE"
        }
      );


    await cargarSupervisiones();


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
  .getElementById(
    "btnBuscar"
  )
  .addEventListener(
    "click",
    cargarSupervisiones
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

        cargarSupervisiones();

      }

    }
  );


// =======================================
// FILTRO
// =======================================

document
  .getElementById(
    "filtroCumplimiento"
  )
  .addEventListener(
    "change",
    cargarSupervisiones
  );


// =======================================
// LIMPIAR
// =======================================

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
        "filtroCumplimiento"
      ).value =
        "";


      cargarSupervisiones();

    }
  );


// =======================================
// CANCELAR
// =======================================

document
  .getElementById(
    "btnCancelar"
  )
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
    "id_supervision"
  ).value =
    "";


  detalleVisita.innerHTML =
    "";


  detalleVisita.classList.add(
    "oculto"
  );


  mensajeFormulario.textContent =
    "";

}


// =======================================
// UTILIDADES
// =======================================

function formatearFecha(
  fecha
) {

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


function textoCumplimiento(
  valor
) {

  if (
    valor === "CUMPLIDO"
  ) {
    return "Cumplido";
  }


  if (
    valor === "PARCIAL"
  ) {
    return "Parcial";
  }


  return "No cumplido";

}


function claseCumplimiento(
  valor
) {

  if (
    valor === "CUMPLIDO"
  ) {
    return "estado-ok";
  }


  if (
    valor === "PARCIAL"
  ) {
    return "estado-parcial";
  }


  return "estado-no";

}


function escapar(valor) {

  return String(valor ?? "")

    .replaceAll(
      "&",
      "&amp;"
    )

    .replaceAll(
      "<",
      "&lt;"
    )

    .replaceAll(
      ">",
      "&gt;"
    )

    .replaceAll(
      '"',
      "&quot;"
    )

    .replaceAll(
      "'",
      "&#039;"
    );

}


// =======================================
// INICIAR
// =======================================

async function iniciar() {

  try {

    await cargarVisitas();

    await cargarSupervisiones();

  } catch (error) {

    mostrarNotificacion(
      "No se pudo iniciar el módulo de supervisiones",
      "error"
    );

  }

}


iniciar();