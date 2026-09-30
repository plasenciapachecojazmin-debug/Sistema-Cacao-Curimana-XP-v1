const API =
    "http://localhost:3000/api";


const form =
    document.getElementById(
        "loginForm"
    );


const usuarioInput =
    document.getElementById(
        "usuario"
    );


const passwordInput =
    document.getElementById(
        "password"
    );


const recordarInput =
    document.getElementById(
        "recordarme"
    );


const btnIngresar =
    document.getElementById(
        "btnIngresar"
    );


const btnTogglePassword =
    document.getElementById(
        "btnTogglePassword"
    );


const mensaje =
    document.getElementById(
        "msg"
    );


// ==========================================================
// USUARIO RECORDADO
// ==========================================================

document.addEventListener(
    "DOMContentLoaded",
    () => {

        const usuarioRecordado =
            localStorage.getItem(
                "siscacao_recordar_usuario"
            );


        if (
            usuarioRecordado
        ) {

            usuarioInput.value =
                usuarioRecordado;


            recordarInput.checked =
                true;


            passwordInput.focus();

        } else {

            usuarioInput.focus();

        }

    }
);


// ==========================================================
// MOSTRAR / OCULTAR CONTRASEÑA
// ==========================================================

btnTogglePassword.addEventListener(
    "click",
    () => {

        const estaOculta =
            passwordInput.type ===
            "password";


        passwordInput.type =
            estaOculta
                ? "text"
                : "password";


        btnTogglePassword.setAttribute(
            "aria-label",
            estaOculta
                ? "Ocultar contraseña"
                : "Mostrar contraseña"
        );


        btnTogglePassword.setAttribute(
            "title",
            estaOculta
                ? "Ocultar contraseña"
                : "Mostrar contraseña"
        );

    }
);


// ==========================================================
// LOGIN
// ==========================================================

form.addEventListener(
    "submit",
    async evento => {

        evento.preventDefault();


        const usuario =
            usuarioInput.value.trim();


        const password =
            passwordInput.value;


        if (
            !usuario ||
            !password
        ) {

            mostrarMensaje(
                "Ingrese su usuario y contraseña.",
                "error"
            );

            return;

        }


        bloquearFormulario(
            true
        );


        mostrarMensaje(
            "Validando credenciales...",
            ""
        );


        try {

            const respuesta =
                await fetch(
                    `${API}/auth/login`,
                    {

                        method:
                            "POST",

                        headers: {

                            "Content-Type":
                                "application/json"

                        },

                        body:
                            JSON.stringify({

                                usuario,
                                password

                            })

                    }
                );


            const data =
                await respuesta.json();


            if (!respuesta.ok) {

                throw new Error(
                    data.mensaje ||
                    "Usuario o contraseña incorrectos."
                );

            }


            if (
                !data.token ||
                !data.usuario
            ) {

                throw new Error(
                    "Respuesta de autenticación incompleta."
                );

            }


            // TOKEN

            localStorage.setItem(
                "siscacao_token",
                data.token
            );


            // USUARIO

            localStorage.setItem(
                "siscacao_usuario",
                JSON.stringify(
                    data.usuario
                )
            );


            // RECORDAR USUARIO

            if (
                recordarInput.checked
            ) {

                localStorage.setItem(
                    "siscacao_recordar_usuario",
                    usuario
                );

            } else {

                localStorage.removeItem(
                    "siscacao_recordar_usuario"
                );

            }


            mostrarMensaje(
                "Acceso correcto. Ingresando...",
                "success"
            );


            setTimeout(
                () => {

                    window.location.href =
                        "dashboard.html";

                },
                300
            );


        } catch (error) {

            mostrarMensaje(
                error.message,
                "error"
            );


            bloquearFormulario(
                false
            );

        }

    }
);


// ==========================================================
// MENSAJES
// ==========================================================

function mostrarMensaje(
    texto,
    tipo
) {

    mensaje.textContent =
        texto;


    mensaje.classList.remove(
        "error",
        "success"
    );


    if (tipo) {

        mensaje.classList.add(
            tipo
        );

    }

}


// ==========================================================
// BLOQUEAR BOTÓN
// ==========================================================

function bloquearFormulario(
    bloquear
) {

    btnIngresar.disabled =
        bloquear;


    btnIngresar.innerHTML =
        bloquear
            ? `
                <span>
                    Ingresando...
                </span>
              `
            : `
                <span class="submit-icon">
                    ↪
                </span>

                <span>
                    Iniciar sesión
                </span>
              `;

}