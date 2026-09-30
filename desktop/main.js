const {
    app,
    BrowserWindow,
    dialog
} = require("electron");

const path = require("path");

let backendServer = null;


// ============================================================
// INICIAR BACKEND DE SISCACAO
// ============================================================

function iniciarBackend() {

    try {

        const backend = require(
            path.join(
                __dirname,
                "..",
                "backend",
                "src",
                "server.js"
            )
        );


        backendServer =
            backend.server || null;


        if (backendServer) {

            backendServer.on(
                "error",
                error => {

                    console.error(
                        "Error del servidor SISCACAO:",
                        error
                    );


                    if (
                        error.code ===
                        "EADDRINUSE"
                    ) {

                        dialog.showErrorBox(
                            "Puerto ocupado",
                            "El puerto 3000 ya está siendo utilizado.\n\n" +
                            "Cierra cualquier terminal donde esté ejecutándose npm run dev y vuelve a abrir SISCACAO."
                        );

                    } else {

                        dialog.showErrorBox(
                            "Error del servidor",
                            error.message
                        );

                    }

                }
            );

        }


        console.log(
            "Backend SISCACAO cargado."
        );


    } catch (error) {

        console.error(
            "No se pudo iniciar el backend:",
            error
        );


        dialog.showErrorBox(
            "Error al iniciar SISCACAO",
            "No se pudo iniciar el servidor interno.\n\n" +
            error.message
        );


        throw error;

    }

}


// ============================================================
// CREAR VENTANA PRINCIPAL
// ============================================================

function crearVentanaPrincipal() {

    const ventana =
        new BrowserWindow({

            width: 1450,

            height: 900,

            minWidth: 1050,

            minHeight: 680,

            show: false,

            title:
                "SISCACAO - Proyecto Cacao Curimaná",

            backgroundColor:
                "#edf3ee",

            autoHideMenuBar: true,

            icon: path.join(
                __dirname,
                "..",
                "frontend",
                "img",
                "logo-siscacao.png"
            ),

            webPreferences: {

                nodeIntegration:
                    false,

                contextIsolation:
                    true,

                sandbox:
                    true

            }

        });


    // Ocultar menú de Electron
    ventana.setMenuBarVisibility(
        false
    );


    // Abrir Login
    ventana.loadFile(
        path.join(
            __dirname,
            "..",
            "frontend",
            "index.html"
        )
    );


    ventana.once(
        "ready-to-show",
        () => {

            ventana.show();

        }
    );


    ventana.webContents.on(
        "did-fail-load",
        (
            event,
            errorCode,
            errorDescription
        ) => {

            console.error(
                "Error al cargar la interfaz:",
                errorCode,
                errorDescription
            );

        }
    );

}


// ============================================================
// INICIAR APLICACIÓN
// ============================================================

app.whenReady().then(
    () => {

        iniciarBackend();

        crearVentanaPrincipal();


        app.on(
            "activate",
            () => {

                if (
                    BrowserWindow
                        .getAllWindows()
                        .length === 0
                ) {

                    crearVentanaPrincipal();

                }

            }
        );

    }
);


// ============================================================
// CERRAR APLICACIÓN
// ============================================================

app.on(
    "window-all-closed",
    () => {

        if (
            process.platform !==
            "darwin"
        ) {

            app.quit();

        }

    }
);


// ============================================================
// CERRAR BACKEND AL SALIR
// ============================================================

app.on(
    "before-quit",
    () => {

        if (
            backendServer &&
            typeof backendServer.close ===
                "function"
        ) {

            backendServer.close();

        }

    }
);