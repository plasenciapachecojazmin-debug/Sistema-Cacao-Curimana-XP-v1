const API = "http://localhost:3000/api";

const token =
  localStorage.getItem("siscacao_token");

const usuario =
  JSON.parse(
    localStorage.getItem("siscacao_usuario") || "null"
  );


if (!token || !usuario) {
  window.location.href = "index.html";
}


document.getElementById(
  "usuarioActual"
).textContent =
  `${usuario.nombres} ${usuario.apellidos} · ${usuario.rol}`;


const tabla =
  document.getElementById("tablaVisitas");

const form =
  document.getElementById("formVisita");

const panelFormulario =
  document.getElementById("panelFormulario");

const mensajeFormulario =
  document.getElementById("mensajeFormulario");

const notificacion =
  document.getElementById("notificacion");

const selectTecnico =
  document.getElementById("id_tecnico");

const filtroTecnico =
  document.getElementById("filtroTecnico");

const selectBeneficiario =
  document.getElementById("id_beneficiario");

const selectParcela =
  document.getElementById("id_parcela");


// =====================================
// CERRAR SESIÓN
// =====================================

document
  .getElementById("btnSalir")
  .addEventListener("click", () => {

    localStorage.clear();

    window.location.href =
      "index.html";

  });


// =====================================
// API FETCH
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
// CARGAR TÉCNICOS
// =====================================

async function cargarTecnicos() {

  const respuesta =
    await apiFetch(
      `${API}/tecnicos`
    );


  selectTecnico.innerHTML = `
    <option value="">
      Seleccione un técnico
    </option>
  `;


  filtroTecnico.innerHTML = `
    <option value="">
      Todos los técnicos
    </option>
  `;


  respuesta.data.forEach(t => {

    const nombre =
      `${t.nombres} ${t.apellidos}`;


    const op1 =
      document.createElement(
        "option"
      );


    op1.value =
      t.id_tecnico;


    op1.textContent =
      nombre;


    selectTecnico.appendChild(
      op1
    );


    const op2 =
      document.createElement(
        "option"
      );


    op2.value =
      t.id_tecnico;


    op2.textContent =
      nombre;


    filtroTecnico.appendChild(
      op2
    );

  });

}


// =====================================
// CARGAR BENEFICIARIOS
// =====================================

async function cargarBeneficiarios() {

  const respuesta =
    await apiFetch(
      `${API}/beneficiarios`
    );


  selectBeneficiario.innerHTML = `
    <option value="">
      Seleccione un beneficiario
    </option>
  `;


  respuesta.data.forEach(b => {

    const op =
      document.createElement(
        "option"
      );


    op.value =
      b.id_beneficiario;


    op.textContent =
      `${b.nombres} ${b.apellidos} - ${b.caserio}`;


    selectBeneficiario.appendChild(
      op
    );

  });

}


// =====================================
// CARGAR PARCELAS DEL BENEFICIARIO
// =====================================

async function cargarParcelasBeneficiario() {

  const idBeneficiario =
    selectBeneficiario.value;


  selectParcela.innerHTML = `
    <option value="">
      Sin parcela específica
    </option>
  `;


  if (!idBeneficiario) {
    return;
  }


  const respuesta =
    await apiFetch(
      `${API}/parcelas?beneficiario=${idBeneficiario}`
    );


  respuesta.data.forEach(p => {

    const op =
      document.createElement(
        "option"
      );


    op.value =
      p.id_parcela;


    op.textContent =
      p.nombre_predio ||
      `Parcela ${p.id_parcela}`;


    selectParcela.appendChild(
      op
    );

  });

}


selectBeneficiario
  .addEventListener(
    "change",
    cargarParcelasBeneficiario
  );


// =====================================
// CARGAR VISITAS
// =====================================

async function cargarVisitas() {

  try {

    const q =
      document.getElementById(
        "buscar"
      ).value.trim();


    const tecnico =
      filtroTecnico.value;


    const tipo =
      document.getElementById(
        "filtroTipo"
      ).value;


    const respuesta =
      await apiFetch(
        `${API}/visitas?q=${encodeURIComponent(q)}&tecnico=${encodeURIComponent(tecnico)}&tipo=${encodeURIComponent(tipo)}`
      );


    mostrarTabla(
      respuesta.data
    );


  } catch (error) {

    tabla.innerHTML = `

      <tr>

        <td colspan="9">
          ${escapar(error.message)}
        </td>

      </tr>

    `;

  }

}


// =====================================
// MOSTRAR TABLA
// =====================================

function mostrarTabla(visitas) {

  if (!visitas.length) {

    tabla.innerHTML = `

      <tr>

        <td colspan="9">
          No se encontraron visitas.
        </td>

      </tr>

    `;

    return;
  }


  tabla.innerHTML =
    visitas.map(v => `

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

        <td class="acciones">

          <button
            class="btn-small"
            onclick="editarVisita(${v.id_visita})"
          >
            Editar
          </button>

          <button
            class="btn-small danger"
            onclick="desactivarVisita(${v.id_visita})"
          >
            Desactivar
          </button>

        </td>

      </tr>

    `).join("");

}


// =====================================
// NUEVA VISITA
// =====================================

document
  .getElementById("btnNuevo")
  .addEventListener("click", () => {

    limpiarFormulario();


    document.getElementById(
      "tituloFormulario"
    ).textContent =
      "Registrar nueva visita";


    panelFormulario.classList.remove(
      "oculto"
    );


    document.getElementById(
      "fecha"
    ).value =
      new Date()
        .toISOString()
        .slice(0, 10);

  });


// =====================================
// EDITAR
// =====================================

async function editarVisita(id) {

  try {

    const respuesta =
      await apiFetch(
        `${API}/visitas/${id}`
      );


    const v =
      respuesta.data;


    document.getElementById(
      "id_visita"
    ).value =
      v.id_visita;


    document.getElementById(
      "fecha"
    ).value =
      String(v.fecha)
        .slice(0, 10);


    selectTecnico.value =
      v.id_tecnico;


    selectBeneficiario.value =
      v.id_beneficiario;


    await cargarParcelasBeneficiario();


    selectParcela.value =
      v.id_parcela || "";


    document.getElementById(
      "tipo_visita"
    ).value =
      v.tipo_visita;


    document.getElementById(
      "objetivo"
    ).value =
      v.objetivo;


    document.getElementById(
      "latitud"
    ).value =
      v.latitud ?? "";


    document.getElementById(
      "longitud"
    ).value =
      v.longitud ?? "";


    document.getElementById(
      "observacion"
    ).value =
      v.observacion || "";


    document.getElementById(
      "tituloFormulario"
    ).textContent =
      "Editar visita";


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


// =====================================
// GUARDAR
// =====================================

form.addEventListener(
  "submit",
  async (evento) => {

    evento.preventDefault();


    const id =
      document.getElementById(
        "id_visita"
      ).value;


    const datos = {

      fecha:
        document.getElementById(
          "fecha"
        ).value,

      id_tecnico:
        selectTecnico.value,

      id_beneficiario:
        selectBeneficiario.value,

      id_parcela:
        selectParcela.value || null,

      tipo_visita:
        document.getElementById(
          "tipo_visita"
        ).value,

      objetivo:
        document.getElementById(
          "objetivo"
        ).value.trim(),

      latitud:
        document.getElementById(
          "latitud"
        ).value,

      longitud:
        document.getElementById(
          "longitud"
        ).value,

      observacion:
        document.getElementById(
          "observacion"
        ).value.trim()

    };


    try {

      let url =
        `${API}/visitas`;

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


      await cargarVisitas();


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


// =====================================
// DESACTIVAR
// =====================================

async function desactivarVisita(id) {

  if (
    !confirm(
      "¿Desea desactivar esta visita?"
    )
  ) {
    return;
  }


  try {

    const respuesta =
      await apiFetch(
        `${API}/visitas/${id}`,
        {
          method:
            "DELETE"
        }
      );


    await cargarVisitas();


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


// =====================================
// FILTROS
// =====================================

document
  .getElementById("btnBuscar")
  .addEventListener(
    "click",
    cargarVisitas
  );


document
  .getElementById("btnLimpiar")
  .addEventListener("click", () => {

    document.getElementById(
      "buscar"
    ).value = "";


    filtroTecnico.value =
      "";


    document.getElementById(
      "filtroTipo"
    ).value = "";


    cargarVisitas();

  });


filtroTecnico
  .addEventListener(
    "change",
    cargarVisitas
  );


document.getElementById(
  "filtroTipo"
).addEventListener(
  "change",
  cargarVisitas
);


// =====================================
// CANCELAR
// =====================================

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
    "id_visita"
  ).value = "";

  selectParcela.innerHTML = `
    <option value="">
      Sin parcela específica
    </option>
  `;

  mensajeFormulario.textContent =
    "";

}


// =====================================
// UTILIDADES
// =====================================

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


function escapar(valor) {

  return String(valor ?? "")

    .replaceAll("&", "&amp;")

    .replaceAll("<", "&lt;")

    .replaceAll(">", "&gt;")

    .replaceAll('"', "&quot;")

    .replaceAll("'", "&#039;");

}


// =====================================
// INICIAR
// =====================================

async function iniciar() {

  try {

    await cargarTecnicos();

    await cargarBeneficiarios();

    await cargarVisitas();

  } catch (error) {

    mostrarNotificacion(
      "No se pudo iniciar el módulo de visitas",
      "error"
    );

  }

}


iniciar();