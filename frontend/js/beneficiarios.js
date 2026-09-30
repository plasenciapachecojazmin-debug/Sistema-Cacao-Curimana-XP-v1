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
// ELEMENTOS
// =======================================

const tabla =
  document.getElementById("tablaBeneficiarios");

const panelFormulario =
  document.getElementById("panelFormulario");

const form =
  document.getElementById("formBeneficiario");

const mensajeFormulario =
  document.getElementById("mensajeFormulario");

const notificacion =
  document.getElementById("notificacion");

const selectCaserio =
  document.getElementById("id_caserio");

const filtroCaserio =
  document.getElementById("filtroCaserio");


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
// CARGAR CASERÍOS
// =======================================

async function cargarCaserios() {

  try {

    const respuesta =
      await apiFetch(
        `${API}/caserios`
      );


    const caserios =
      respuesta.data;


    selectCaserio.innerHTML = `

      <option value="">
        Seleccione un caserío
      </option>

    `;


    filtroCaserio.innerHTML = `

      <option value="">
        Todos los caseríos
      </option>

    `;


    caserios.forEach(c => {

      const opcionFormulario =
        document.createElement(
          "option"
        );


      opcionFormulario.value =
        c.id_caserio;


      opcionFormulario.textContent =
        c.nombre;


      selectCaserio.appendChild(
        opcionFormulario
      );


      const opcionFiltro =
        document.createElement(
          "option"
        );


      opcionFiltro.value =
        c.id_caserio;


      opcionFiltro.textContent =
        c.nombre;


      filtroCaserio.appendChild(
        opcionFiltro
      );

    });


  } catch (error) {

    mostrarNotificacion(
      "No se pudieron cargar los caseríos",
      "error"
    );

  }

}


// =======================================
// CARGAR BENEFICIARIOS
// =======================================

async function cargarBeneficiarios() {

  try {

    const texto =
      document
        .getElementById("buscar")
        .value
        .trim();


    const caserio =
      filtroCaserio.value;


    const url =
      `${API}/beneficiarios?q=${encodeURIComponent(texto)}&caserio=${encodeURIComponent(caserio)}`;


    const respuesta =
      await apiFetch(url);


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
  beneficiarios
) {

  if (!beneficiarios.length) {

    tabla.innerHTML = `

      <tr>

        <td colspan="8">
          No se encontraron beneficiarios.
        </td>

      </tr>

    `;

    return;
  }


  tabla.innerHTML =
    beneficiarios
      .map(b => `

        <tr>

          <td>
            ${b.id_beneficiario}
          </td>


          <td>

            <strong>
              ${escapar(b.nombres)}
              ${escapar(b.apellidos)}
            </strong>

          </td>


          <td>
            ${escapar(b.dni || "-")}
          </td>


          <td>
            ${escapar(b.telefono || "-")}
          </td>


          <td>
            ${escapar(b.caserio)}
          </td>


          <td>
            ${escapar(b.sector || "-")}
          </td>


          <td>
            ${escapar(b.referencia || "-")}
          </td>


          <td class="acciones">

            <button
              class="btn-small"
              onclick="editarBeneficiario(${b.id_beneficiario})"
            >
              Editar
            </button>


            <button
              class="btn-small danger"
              onclick="desactivarBeneficiario(${b.id_beneficiario})"
            >
              Desactivar
            </button>

          </td>

        </tr>

      `)
      .join("");

}


// =======================================
// NUEVO BENEFICIARIO
// =======================================

document
  .getElementById("btnNuevo")
  .addEventListener("click", () => {

    limpiarFormulario();


    document.getElementById(
      "tituloFormulario"
    ).textContent =
      "Registrar nuevo beneficiario";


    panelFormulario.classList.remove(
      "oculto"
    );


    document
      .getElementById("nombres")
      .focus();

  });


// =======================================
// EDITAR BENEFICIARIO
// =======================================

async function editarBeneficiario(
  id
) {

  try {

    const respuesta =
      await apiFetch(
        `${API}/beneficiarios/${id}`
      );


    const b =
      respuesta.data;


    document.getElementById(
      "id_beneficiario"
    ).value =
      b.id_beneficiario;


    document.getElementById(
      "nombres"
    ).value =
      b.nombres;


    document.getElementById(
      "apellidos"
    ).value =
      b.apellidos;


    document.getElementById(
      "dni"
    ).value =
      b.dni || "";


    document.getElementById(
      "telefono"
    ).value =
      b.telefono || "";


    document.getElementById(
      "id_caserio"
    ).value =
      b.id_caserio;


    document.getElementById(
      "sector"
    ).value =
      b.sector || "";


    document.getElementById(
      "referencia"
    ).value =
      b.referencia || "";


    document.getElementById(
      "tituloFormulario"
    ).textContent =
      "Editar beneficiario";


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
        "id_beneficiario"
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

      dni:
        document.getElementById(
          "dni"
        ).value.trim(),

      telefono:
        document.getElementById(
          "telefono"
        ).value.trim(),

      id_caserio:
        document.getElementById(
          "id_caserio"
        ).value,

      sector:
        document.getElementById(
          "sector"
        ).value.trim(),

      referencia:
        document.getElementById(
          "referencia"
        ).value.trim()

    };


    try {

      let url =
        `${API}/beneficiarios`;

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


      await cargarBeneficiarios();


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

async function desactivarBeneficiario(
  id
) {

  const confirmar =
    confirm(
      "¿Desea desactivar este beneficiario?"
    );


  if (!confirmar) {
    return;
  }


  try {

    const respuesta =
      await apiFetch(
        `${API}/beneficiarios/${id}`,
        {
          method:
            "DELETE"
        }
      );


    await cargarBeneficiarios();


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
    cargarBeneficiarios
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

        cargarBeneficiarios();

      }

    }
  );


// =======================================
// FILTRAR CASERÍO
// =======================================

filtroCaserio
  .addEventListener(
    "change",
    cargarBeneficiarios
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


      filtroCaserio.value =
        "";


      cargarBeneficiarios();

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
    "id_beneficiario"
  ).value =
    "";


  mensajeFormulario.textContent =
    "";

}


// =======================================
// SEGURIDAD PARA HTML
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

  await cargarCaserios();

  await cargarBeneficiarios();

}


iniciar();