// ============================================================
// SISCACAO - FUNCIONES COMUNES DEL SISTEMA
// ============================================================

(() => {

    const TOKEN_KEY = "siscacao_token";
    const USER_KEY = "siscacao_usuario";


    // ========================================================
    // CERRAR SESIÓN
    // ========================================================

    function cerrarSesionSeguro() {

        // Eliminar autenticación
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(USER_KEY);

        // Limpiar datos temporales
        sessionStorage.clear();

        // Volver al login sin permitir regresar con "Atrás"
        window.location.replace("index.html");
    }


    // Hacer disponible la función para onclick=""
    window.cerrarSesionSeguro = cerrarSesionSeguro;


    // ========================================================
    // OBTENER PÁGINA ACTUAL
    // ========================================================

    function obtenerPaginaActual() {

        const partes =
            window.location.pathname.split("/");

        return partes[partes.length - 1] || "index.html";
    }


    // ========================================================
    // VALIDAR SESIÓN
    // ========================================================

    function validarSesion() {

        const paginaActual =
            obtenerPaginaActual();


        // En el Login no exigimos token
        if (paginaActual === "index.html") {
            return true;
        }


        const token =
            localStorage.getItem(TOKEN_KEY);

        const usuarioTexto =
            localStorage.getItem(USER_KEY);


        if (!token || !usuarioTexto) {

            cerrarSesionSeguro();

            return false;
        }


        try {

            const usuario =
                JSON.parse(usuarioTexto);


            const usuarioActual =
                document.getElementById(
                    "usuarioActual"
                );


            if (usuarioActual) {

                usuarioActual.textContent =
                    `${usuario.nombres} ${usuario.apellidos} · ${usuario.rol}`;
            }


            return true;

        } catch (error) {

            console.error(
                "Error al leer la sesión:",
                error
            );

            cerrarSesionSeguro();

            return false;
        }
    }


    // ========================================================
    // MENÚ ACTIVO
    // ========================================================

    function marcarMenuActivo() {

        const paginaActual =
            obtenerPaginaActual();


        const enlaces =
            document.querySelectorAll(
                ".sidebar a[href]"
            );


        enlaces.forEach(enlace => {

            const href =
                enlace.getAttribute("href");


            if (!href) {
                return;
            }


            const destino =
                href.split("/").pop();


            enlace.classList.toggle(
                "active",
                destino === paginaActual
            );
        });
    }


    // ========================================================
    // CIERRE DE SESIÓN POR DELEGACIÓN
    // ========================================================
    // Esto funciona incluso si el botón se renderiza después.

    document.addEventListener(
        "click",
        evento => {

            const botonSalir =
                evento.target.closest(
                    "#btnSalir, [data-logout]"
                );


            if (!botonSalir) {
                return;
            }


            evento.preventDefault();
            evento.stopPropagation();

            cerrarSesionSeguro();
        }
    );


    // ========================================================
    // SOLO NÚMEROS
    // ========================================================

    function activarCamposNumericos() {

        const campos =
            document.querySelectorAll(
                "[data-only-digits]"
            );


        campos.forEach(input => {

            input.addEventListener(
                "input",
                function () {

                    const maximo =
                        Number(
                            this.dataset.onlyDigits
                        ) || 0;


                    let valor =
                        this.value.replace(
                            /\D/g,
                            ""
                        );


                    if (maximo > 0) {

                        valor =
                            valor.slice(
                                0,
                                maximo
                            );
                    }


                    this.value = valor;
                }
            );
        });
    }


    // ========================================================
    // VALIDAR LONGITUD EXACTA
    // ========================================================

    function activarValidacionLongitudes() {

        document.addEventListener(
            "submit",
            evento => {

                const formulario =
                    evento.target;


                if (
                    !(
                        formulario instanceof
                        HTMLFormElement
                    )
                ) {
                    return;
                }


                const campos =
                    formulario.querySelectorAll(
                        "[data-exact-length]"
                    );


                for (const campo of campos) {

                    const longitud =
                        Number(
                            campo.dataset.exactLength
                        );


                    const valor =
                        campo.value.trim();


                    const nombre =
                        campo.dataset.label ||
                        campo.id;


                    // Campo opcional vacío: permitido
                    if (!valor) {
                        continue;
                    }


                    if (
                        valor.length !==
                        longitud
                    ) {

                        evento.preventDefault();

                        evento.stopImmediatePropagation();


                        alert(
                            `${nombre} debe tener exactamente ${longitud} dígitos.`
                        );


                        campo.focus();

                        return;
                    }
                }
            },
            true
        );
    }


    // ========================================================
    // INICIALIZAR
    // ========================================================

    document.addEventListener(
        "DOMContentLoaded",
        () => {

            if (!validarSesion()) {
                return;
            }


            marcarMenuActivo();

            activarCamposNumericos();

            activarValidacionLongitudes();
        }
    );

})();