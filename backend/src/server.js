const path = require("path");


// ============================================================
// VARIABLES DE ENTORNO
// ============================================================

require("dotenv").config({
    path: path.join(
        __dirname,
        "..",
        ".env"
    )
});


const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");

const db = require("./config/db");


// ============================================================
// CREAR APLICACIÓN EXPRESS
// ============================================================

const app = express();


// ============================================================
// MIDDLEWARES
// ============================================================

app.use(
    helmet({
        crossOriginResourcePolicy: false
    })
);

app.use(
    cors({
        origin: true,
        credentials: true
    })
);

app.use(
    express.json()
);

app.use(
    express.urlencoded({
        extended: true
    })
);

app.use(
    morgan("dev")
);


// ============================================================
// RUTA PRINCIPAL
// ============================================================

app.get(
    "/",
    (req, res) => {

        res.json({
            ok: true,
            sistema: "SISCACAO",
            proyecto:
                "Proyecto Cacao Curimaná – 2026",
            metodologia:
                "Extreme Programming (XP)",
            mensaje:
                "API SISCACAO activa"
        });

    }
);


// ============================================================
// ESTADO DE API Y BASE DE DATOS
// ============================================================

app.get(
    "/api/estado",
    async (req, res) => {

        try {

            const [rows] =
                await db.query(
                    `
                    SELECT
                        NOW() AS fecha_servidor
                    `
                );


            res.json({
                ok: true,
                mensaje:
                    "API y MySQL conectados",
                fecha_servidor:
                    rows[0].fecha_servidor
            });


        } catch (error) {

            console.error(
                "Error de conexión MySQL:",
                error
            );


            res.status(500).json({
                ok: false,
                mensaje:
                    "La API está activa, pero no se pudo conectar con MySQL",
                error:
                    error.message
            });

        }

    }
);


// ============================================================
// RUTAS DEL SISTEMA
// ============================================================

app.use(
    "/api/auth",
    require(
        "./routes/auth.routes"
    )
);


app.use(
    "/api/caserios",
    require(
        "./routes/caserios.routes"
    )
);


app.use(
    "/api/tecnicos",
    require(
        "./routes/tecnicos.routes"
    )
);


app.use(
    "/api/beneficiarios",
    require(
        "./routes/beneficiarios.routes"
    )
);


app.use(
    "/api/parcelas",
    require(
        "./routes/parcelas.routes"
    )
);


app.use(
    "/api/visitas",
    require(
        "./routes/visitas.routes"
    )
);


app.use(
    "/api/supervisiones",
    require(
        "./routes/supervisiones.routes"
    )
);


app.use(
    "/api/hallazgos",
    require(
        "./routes/hallazgos.routes"
    )
);


app.use(
    "/api/recomendaciones",
    require(
        "./routes/recomendaciones.routes"
    )
);


app.use(
    "/api/seguimientos",
    require(
        "./routes/seguimientos.routes"
    )
);


app.use(
    "/api/reportes",
    require(
        "./routes/reportes.routes"
    )
);


app.use(
    "/api/dashboard",
    require(
        "./routes/dashboard.routes"
    )
);


// ============================================================
// RUTA NO ENCONTRADA
// ============================================================

app.use(
    (req, res) => {

        res.status(404).json({
            ok: false,
            mensaje:
                "Ruta no encontrada"
        });

    }
);


// ============================================================
// PUERTO
// ============================================================

const PORT =
    Number(
        process.env.PORT ||
        3000
    );


// ============================================================
// INICIAR SERVIDOR
// ============================================================

const server =
    app.listen(
        PORT,
        "127.0.0.1",
        () => {

            console.log(
                "======================================"
            );

            console.log(
                " SISCACAO - Proyecto Cacao Curimaná"
            );

            console.log(
                ` API: http://127.0.0.1:${PORT}`
            );

            console.log(
                "======================================"
            );

        }
    );


// ============================================================
// CONTROLAR ERROR DE PUERTO
// ============================================================

server.on(
    "error",
    error => {

        if (
            error.code ===
            "EADDRINUSE"
        ) {

            console.error(
                `El puerto ${PORT} ya está ocupado.`
            );

        } else {

            console.error(
                "Error del servidor:",
                error
            );

        }

    }
);


// ============================================================
// EXPORTAR PARA ELECTRON
// ============================================================

module.exports = {
    app,
    server
};