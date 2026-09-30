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


const notificacion =
  document.getElementById(
    "notificacion"
  );


let visitasActuales = [];
let recomendacionesActuales = [];


// =====================================
// SESIÓN
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
// RESUMEN
// =====================================

async function cargarResumen() {

  const respuesta =
    await apiFetch(
      `${API}/reportes/resumen`
    );


  const d =
    respuesta.data;


  document.getElementById(
    "totalTecnicos"
  ).textContent =
    d.tecnicos;


  document.getElementById(
    "totalBeneficiarios"
  ).textContent =
    d.beneficiarios;


  document.getElementById(
    "totalParcelas"
  ).textContent =
    d.parcelas;


  document.getElementById(
    "totalVisitas"
  ).textContent =
    d.visitas;


  document.getElementById(
    "totalSupervisiones"
  ).textContent =
    d.supervisiones;


  document.getElementById(
    "totalHallazgos"
  ).textContent =
    d.hallazgos;


  document.getElementById(
    "totalPendientes"
  ).textContent =
    d.recomendaciones_pendientes;


  document.getElementById(
    "totalProceso"
  ).textContent =
    d.recomendaciones_en_proceso;


  document.getElementById(
    "totalCumplidas"
  ).textContent =
    d.recomendaciones_cumplidas;

}


// =====================================
// VISITAS
// =====================================

async function cargarVisitas() {

  try {

    const desde =
      document.getElementById(
        "fechaDesde"
      ).value;


    const hasta =
      document.getElementById(
        "fechaHasta"
      ).value;


    const respuesta =
      await apiFetch(
        `${API}/reportes/visitas?desde=${encodeURIComponent(desde)}&hasta=${encodeURIComponent(hasta)}`
      );


    visitasActuales =
      respuesta.data;


    mostrarVisitas();


  } catch (error) {

    mostrarNotificacion(
      error.message,
      "error"
    );

  }

}


function mostrarVisitas() {

  const tbody =
    document.getElementById(
      "tbodyVisitas"
    );


  if (!visitasActuales.length) {

    tbody.innerHTML = `

      <tr>

        <td colspan="8">
          No se encontraron visitas.
        </td>

      </tr>

    `;

    return;

  }


  tbody.innerHTML =
    visitasActuales.map(v => `

      <tr>

        <td>
          ${v.id_visita}
        </td>

        <td>
          ${formatearFecha(v.fecha)}
        </td>

        <td>
          ${escapar(v.tecnico)}
        </td>

        <td>
          ${escapar(v.beneficiario)}
        </td>

        <td>
          ${escapar(v.caserio)}
        </td>

        <td>
          ${escapar(v.nombre_predio || "-")}
        </td>

        <td>
          ${
            v.tipo_visita ===
            "SUPERVISION"
              ? "Supervisión"
              : "Asistencia técnica"
          }
        </td>

        <td>
          ${escapar(v.objetivo)}
        </td>

      </tr>

    `).join("");

}


// =====================================
// RECOMENDACIONES
// =====================================

async function cargarRecomendaciones() {

  try {

    const estado =
      document.getElementById(
        "estadoRecomendacion"
      ).value;


    const respuesta =
      await apiFetch(
        `${API}/reportes/recomendaciones?estado=${encodeURIComponent(estado)}`
      );


    recomendacionesActuales =
      respuesta.data;


    mostrarRecomendaciones();


  } catch (error) {

    mostrarNotificacion(
      error.message,
      "error"
    );

  }

}


function mostrarRecomendaciones() {

  const tbody =
    document.getElementById(
      "tbodyRecomendaciones"
    );


  if (
    !recomendacionesActuales.length
  ) {

    tbody.innerHTML = `

      <tr>

        <td colspan="8">
          No se encontraron recomendaciones.
        </td>

      </tr>

    `;

    return;

  }


  tbody.innerHTML =
    recomendacionesActuales.map(r => `

      <tr>

        <td>
          ${r.id_recomendacion}
        </td>

        <td>
          ${escapar(r.beneficiario)}
        </td>

        <td>
          ${escapar(r.caserio)}
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

          <span
            class="estado ${claseEstado(r.estado)}"
          >

            ${textoEstado(r.estado)}

          </span>

        </td>

      </tr>

    `).join("");

}


// =====================================
// FILTROS
// =====================================

document
  .getElementById(
    "btnFiltrarVisitas"
  )
  .addEventListener(
    "click",
    cargarVisitas
  );


document
  .getElementById(
    "btnLimpiarVisitas"
  )
  .addEventListener(
    "click",
    () => {

      document.getElementById(
        "fechaDesde"
      ).value =
        "";


      document.getElementById(
        "fechaHasta"
      ).value =
        "";


      cargarVisitas();

    }
  );


document
  .getElementById(
    "btnFiltrarRecomendaciones"
  )
  .addEventListener(
    "click",
    cargarRecomendaciones
  );


document
  .getElementById(
    "btnLimpiarRecomendaciones"
  )
  .addEventListener(
    "click",
    () => {

      document.getElementById(
        "estadoRecomendacion"
      ).value =
        "";


      cargarRecomendaciones();

    }
  );


// =====================================
// CSV VISITAS
// =====================================

document
  .getElementById(
    "btnCsvVisitas"
  )
  .addEventListener(
    "click",
    () => {

      if (!visitasActuales.length) {

        mostrarNotificacion(
          "No existen visitas para exportar",
          "error"
        );

        return;

      }


      const filas = [

        [
          "ID",
          "Fecha",
          "Técnico",
          "Beneficiario",
          "Caserío",
          "Parcela",
          "Tipo",
          "Objetivo"
        ],

        ...visitasActuales.map(v => [

          v.id_visita,

          formatearFecha(v.fecha),

          v.tecnico,

          v.beneficiario,

          v.caserio,

          v.nombre_predio || "",

          v.tipo_visita === "SUPERVISION"
            ? "Supervisión"
            : "Asistencia técnica",

          v.objetivo

        ])

      ];


      descargarCSV(
        "reporte_visitas.csv",
        filas
      );

    }
  );


// =====================================
// CSV RECOMENDACIONES
// =====================================

document
  .getElementById(
    "btnCsvRecomendaciones"
  )
  .addEventListener(
    "click",
    () => {

      if (
        !recomendacionesActuales.length
      ) {

        mostrarNotificacion(
          "No existen recomendaciones para exportar",
          "error"
        );

        return;

      }


      const filas = [

        [
          "ID",
          "Beneficiario",
          "Caserío",
          "Hallazgo",
          "Recomendación",
          "Responsable",
          "Fecha límite",
          "Estado"
        ],

        ...recomendacionesActuales.map(r => [

          r.id_recomendacion,

          r.beneficiario,

          r.caserio,

          r.hallazgo,

          r.descripcion,

          r.responsable || "",

          formatearFecha(
            r.fecha_limite
          ),

          textoEstado(
            r.estado
          )

        ])

      ];


      descargarCSV(
        "reporte_recomendaciones.csv",
        filas
      );

    }
  );


// =====================================
// DESCARGAR CSV
// =====================================

function descargarCSV(
  nombreArchivo,
  filas
) {

  const contenido =
    filas
      .map(fila =>
        fila
          .map(valor =>
            `"${String(valor ?? "")
              .replaceAll('"', '""')}"`
          )
          .join(";")
      )
      .join("\n");


  const blob =
    new Blob(
      [
        "\uFEFF" +
        contenido
      ],
      {
        type:
          "text/csv;charset=utf-8;"
      }
    );


  const url =
    URL.createObjectURL(
      blob
    );


  const enlace =
    document.createElement(
      "a"
    );


  enlace.href =
    url;


  enlace.download =
    nombreArchivo;


  document.body.appendChild(
    enlace
  );


  enlace.click();


  enlace.remove();


  URL.revokeObjectURL(
    url
  );


  mostrarNotificacion(
    "Archivo CSV generado correctamente",
    "exito"
  );

}


// =====================================
// IMPRIMIR
// =====================================

document
  .getElementById(
    "btnImprimir"
  )
  .addEventListener(
    "click",
    () => {

      window.print();

    }
  );


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

async function iniciar() {

  try {

    await cargarResumen();

    await cargarVisitas();

    await cargarRecomendaciones();

  } catch (error) {

    mostrarNotificacion(
      "No se pudo cargar el módulo de reportes",
      "error"
    );

  }

}


iniciar();