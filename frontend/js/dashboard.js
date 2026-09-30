const API =
    "http://localhost:3000/api";


const token =
    localStorage.getItem(
        "siscacao_token"
    );


// ============================================================
// PETICIÓN API
// ============================================================

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

        window.cerrarSesionSeguro();

        return null;
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


// ============================================================
// CARGAR RESUMEN
// ============================================================

async function cargarResumen() {

    try {

        const respuesta =
            await apiFetch(
                `${API}/reportes/resumen`
            );


        if (!respuesta) {
            return;
        }


        const d =
            respuesta.data;


        asignarTexto(
            "totalTecnicos",
            d.tecnicos
        );


        asignarTexto(
            "totalBeneficiarios",
            d.beneficiarios
        );


        asignarTexto(
            "totalParcelas",
            d.parcelas
        );


        asignarTexto(
            "totalVisitas",
            d.visitas
        );


        asignarTexto(
            "totalSupervisiones",
            d.supervisiones
        );


        asignarTexto(
            "totalHallazgos",
            d.hallazgos
        );


        asignarTexto(
            "totalPendientes",
            d.recomendaciones_pendientes
        );


        asignarTexto(
            "totalProceso",
            d.recomendaciones_en_proceso
        );


        asignarTexto(
            "totalCumplidas",
            d.recomendaciones_cumplidas
        );


    } catch (error) {

        console.error(
            "Error al cargar Dashboard:",
            error
        );
    }
}


// ============================================================
// ASIGNAR TEXTO
// ============================================================

function asignarTexto(
    id,
    valor
) {

    const elemento =
        document.getElementById(id);


    if (elemento) {

        elemento.textContent =
            valor ?? 0;
    }
}


// ============================================================
// INICIO
// ============================================================

document.addEventListener(
    "DOMContentLoaded",
    cargarResumen
);