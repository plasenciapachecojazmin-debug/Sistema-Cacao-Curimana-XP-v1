const express = require("express");
const db = require("../config/db");
const auth = require("../middleware/auth");

const router = express.Router();

router.use(auth);


// =====================================
// LISTAR TODO EL HISTORIAL
// =====================================

router.get("/", async (req, res) => {

  try {

    const {
      q = "",
      estado = ""
    } = req.query;


    let sql = `
      SELECT
        sg.id_seguimiento,
        sg.id_recomendacion,
        sg.fecha,
        sg.estado_anterior,
        sg.estado_nuevo,
        sg.observacion,
        sg.creado_en,

        r.descripcion AS recomendacion,
        r.responsable,
        r.fecha_limite,

        h.descripcion AS hallazgo,

        CONCAT(
          b.nombres,
          ' ',
          b.apellidos
        ) AS beneficiario,

        c.nombre AS caserio,

        CONCAT(
          u.nombres,
          ' ',
          u.apellidos
        ) AS usuario_registro

      FROM seguimientos sg

      INNER JOIN recomendaciones r
        ON r.id_recomendacion =
           sg.id_recomendacion

      LEFT JOIN hallazgos h
        ON h.id_hallazgo =
           r.id_hallazgo

      INNER JOIN supervisiones s
        ON s.id_supervision =
           r.id_supervision

      INNER JOIN visitas v
        ON v.id_visita =
           s.id_visita

      INNER JOIN beneficiarios b
        ON b.id_beneficiario =
           v.id_beneficiario

      INNER JOIN caserios c
        ON c.id_caserio =
           b.id_caserio

      INNER JOIN usuarios u
        ON u.id_usuario =
           sg.id_usuario

      WHERE 1 = 1
    `;


    const params = [];


    // BUSCADOR

    if (q) {

      sql += `
        AND (
          r.descripcion LIKE ?
          OR r.responsable LIKE ?
          OR h.descripcion LIKE ?
          OR b.nombres LIKE ?
          OR b.apellidos LIKE ?
          OR c.nombre LIKE ?
          OR sg.observacion LIKE ?
        )
      `;


      const termino =
  `%${q}%`;


      params.push(
        termino,
        termino,
        termino,
        termino,
        termino,
        termino,
        termino
      );

    }


    // FILTRO POR NUEVO ESTADO

    if (estado) {

      sql += `
        AND sg.estado_nuevo = ?
      `;

      params.push(estado);

    }


    sql += `
      ORDER BY
        sg.fecha DESC,
        sg.id_seguimiento DESC
    `;


    const [rows] =
      await db.query(
        sql,
        params
      );


    res.json({
      ok: true,
      data: rows
    });


  } catch (error) {

    console.error(error);


    res.status(500).json({
      ok: false,
      mensaje:
        "Error al listar los seguimientos"
    });

  }

});


// =====================================
// HISTORIAL DE UNA RECOMENDACIÓN
// =====================================

router.get(
  "/recomendacion/:id",
  async (req, res) => {

    try {

      const [rows] =
        await db.query(
          `
          SELECT
            sg.id_seguimiento,
            sg.id_recomendacion,
            sg.fecha,
            sg.estado_anterior,
            sg.estado_nuevo,
            sg.observacion,
            sg.creado_en,

            CONCAT(
              u.nombres,
              ' ',
              u.apellidos
            ) AS usuario_registro

          FROM seguimientos sg

          INNER JOIN usuarios u
            ON u.id_usuario =
               sg.id_usuario

          WHERE sg.id_recomendacion = ?

          ORDER BY
            sg.fecha DESC,
            sg.id_seguimiento DESC
          `,
          [req.params.id]
        );


      res.json({
        ok: true,
        data: rows
      });


    } catch (error) {

      console.error(error);


      res.status(500).json({
        ok: false,
        mensaje:
          "Error al consultar el historial"
      });

    }

  }
);


module.exports = router;