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
// ELEMENTOS PRINCIPALES
// =======================================

const tabla =
  document.getElementById("tablaParcelas");

const panelFormulario =
  document.getElementById("panelFormulario");

const form =
  document.getElementById("formParcela");

const mensajeFormulario =
  document.getElementById("mensajeFormulario");

const notificacion =
  document.getElementById("notificacion");

const selectBeneficiario =
  document.getElementById("id_beneficiario");

const filtroBeneficiario =
  document.getElementById("filtroBeneficiario");


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
// PETICIÓN GENERAL A LA API
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
// CARGAR BENEFICIARIOS
// =======================================

async function cargarBeneficiarios() {

  try {

    const respuesta =
      await apiFetch(
        `${API}/beneficiarios`
      );


    const beneficiarios =
      respuesta.data;


    selectBeneficiario.innerHTML = `

      <option value="">
        Seleccione un beneficiario
      </option>

    `;


    filtroBeneficiario.innerHTML = `

      <option value="">
        Todos los beneficiarios
      </option>

    `;


    beneficiarios.forEach(b => {

      const nombreCompleto =
        `${b.nombres} ${b.apellidos}`;


      // OPCIÓN PARA FORMULARIO

      const opcionFormulario =
        document.createElement(
          "option"
        );


      opcionFormulario.value =
        b.id_beneficiario;


      opcionFormulario.textContent =
        `${nombreCompleto} - ${b.caserio}`;


      selectBeneficiario.appendChild(
        opcionFormulario
      );


      // OPCIÓN PARA FILTRO

      const opcionFiltro =
        document.createElement(
          "option"
        );


      opcionFiltro.value =
        b.id_beneficiario;


      opcionFiltro.textContent =
        nombreCompleto;


      filtroBeneficiario.appendChild(
        opcionFiltro
      );

    });


  } catch (error) {

    mostrarNotificacion(
      "No se pudieron cargar los beneficiarios",
      "error"
    );

  }

}


// =======================================
// CARGAR PARCELAS
// =======================================

async function cargarParcelas() {

  try {

    const texto =
      document
        .getElementById("buscar")
        .value
        .trim();


    const beneficiario =
      filtroBeneficiario.value;


    const url =
      `${API}/parcelas?q=${encodeURIComponent(texto)}&beneficiario=${encodeURIComponent(beneficiario)}`;


    const respuesta =
      await apiFetch(url);


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
// MOSTRAR PARCELAS EN TABLA
// =======================================

function mostrarTabla(parcelas) {

  if (!parcelas.length) {

    tabla.innerHTML = `

      <tr>

        <td colspan="10">
          No se encontraron parcelas.
        </td>

      </tr>

    `;

    return;

  }


  tabla.innerHTML =
    parcelas
      .map(p => `

        <tr>

          <td>
            ${p.id_parcela}
          </td>


          <td>

            <strong>
              ${escapar(p.beneficiario)}
            </strong>

          </td>


          <td>
            ${escapar(p.caserio)}
          </td>


          <td>
            ${escapar(p.nombre_predio || "-")}
          </td>


          <td>
            ${escapar(p.cultivo || "Cacao")}
          </td>


          <td>
            ${
              p.area_ha !== null
                ? escapar(p.area_ha)
                : "-"
            }
          </td>


          <td>
            ${
              p.latitud !== null
                ? escapar(p.latitud)
                : "-"
            }
          </td>


          <td>
            ${
              p.longitud !== null
                ? escapar(p.longitud)
                : "-"
            }
          </td>


          <td>
            ${escapar(p.observacion || "-")}
          </td>


          <td class="acciones">

            <button
              class="btn-small"
              onclick="editarParcela(${p.id_parcela})"
            >
              Editar
            </button>


            <button
              class="btn-small danger"
              onclick="desactivarParcela(${p.id_parcela})"
            >
              Desactivar
            </button>

          </td>

        </tr>

      `)
      .join("");

}


// =======================================
// NUEVA PARCELA
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
        "Registrar nueva parcela";


      panelFormulario.classList.remove(
        "oculto"
      );


      selectBeneficiario.focus();

    }
  );


// =======================================
// EDITAR PARCELA
// =======================================

async function editarParcela(id) {

  try {

    const respuesta =
      await apiFetch(
        `${API}/parcelas/${id}`
      );


    const p =
      respuesta.data;


    document.getElementById(
      "id_parcela"
    ).value =
      p.id_parcela;


    document.getElementById(
      "id_beneficiario"
    ).value =
      p.id_beneficiario;


    document.getElementById(
      "nombre_predio"
    ).value =
      p.nombre_predio || "";


    document.getElementById(
      "cultivo"
    ).value =
      p.cultivo || "Cacao";


    document.getElementById(
      "area_ha"
    ).value =
      p.area_ha ?? "";


    document.getElementById(
      "latitud"
    ).value =
      p.latitud ?? "";


    document.getElementById(
      "longitud"
    ).value =
      p.longitud ?? "";


    document.getElementById(
      "observacion"
    ).value =
      p.observacion || "";


    document.getElementById(
      "tituloFormulario"
    ).textContent =
      "Editar parcela";


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
  async (evento) => {

    evento.preventDefault();


    mensajeFormulario.textContent =
      "Guardando...";


    const id =
      document.getElementById(
        "id_parcela"
      ).value;


    const area =
      document.getElementById(
        "area_ha"
      ).value;


    const latitud =
      document.getElementById(
        "latitud"
      ).value;


    const longitud =
      document.getElementById(
        "longitud"
      ).value;


    // VALIDACIÓN DEL ÁREA

    if (
      area !== "" &&
      Number(area) < 0
    ) {

      mostrarNotificacion(
        "El área no puede ser negativa",
        "error"
      );

      return;

    }


    // VALIDAR LATITUD

    if (
      latitud !== "" &&
      (
        Number(latitud) < -90 ||
        Number(latitud) > 90
      )
    ) {

      mostrarNotificacion(
        "La latitud debe estar entre -90 y 90",
        "error"
      );

      return;

    }


    // VALIDAR LONGITUD

    if (
      longitud !== "" &&
      (
        Number(longitud) < -180 ||
        Number(longitud) > 180
      )
    ) {

      mostrarNotificacion(
        "La longitud debe estar entre -180 y 180",
        "error"
      );

      return;

    }


    const datos = {

      id_beneficiario:
        document.getElementById(
          "id_beneficiario"
        ).value,

      nombre_predio:
        document.getElementById(
          "nombre_predio"
        ).value.trim(),

      cultivo:
        document.getElementById(
          "cultivo"
        ).value.trim(),

      area_ha:
        area,

      latitud:
        latitud,

      longitud:
        longitud,

      observacion:
        document.getElementById(
          "observacion"
        ).value.trim()

    };


    try {

      let url =
        `${API}/parcelas`;

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


      await cargarParcelas();


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
// DESACTIVAR PARCELA
// =======================================

async function desactivarParcela(id) {

  const confirmar =
    confirm(
      "¿Desea desactivar esta parcela?"
    );


  if (!confirmar) {
    return;
  }


  try {

    const respuesta =
      await apiFetch(
        `${API}/parcelas/${id}`,
        {
          method:
            "DELETE"
        }
      );


    await cargarParcelas();


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
    cargarParcelas
  );


// =======================================
// BUSCAR CON ENTER
// =======================================

document
  .getElementById("buscar")
  .addEventListener(
    "keydown",
    evento => {

      if (
        evento.key === "Enter"
      ) {

        cargarParcelas();

      }

    }
  );


// =======================================
// FILTRAR POR BENEFICIARIO
// =======================================

filtroBeneficiario
  .addEventListener(
    "change",
    cargarParcelas
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


      filtroBeneficiario.value =
        "";


      cargarParcelas();

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
    "id_parcela"
  ).value =
    "";


  document.getElementById(
    "cultivo"
  ).value =
    "Cacao";


  mensajeFormulario.textContent =
    "";

}


// =======================================
// EVITAR HTML INYECTADO
// =======================================

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
// INICIO
// =======================================

async function iniciar() {

  await cargarBeneficiarios();

  await cargarParcelas();

}


iniciar();