const express = require("express");
const db = require("../config/db");
const auth = require("../middleware/auth");

const router = express.Router();

router.use(auth);


// =====================================
// RESUMEN GENERAL DEL SISTEMA
// =====================================

router.get("/resumen", async (req, res) => {

  try {

    const [[tecnicos]] =
      await db.query(`
        SELECT COUNT(*) AS total
        FROM tecnicos
        WHERE activo = 1
      `);


    const [[beneficiarios]] =
      await db.query(`
        SELECT COUNT(*) AS total
        FROM beneficiarios
        WHERE activo = 1
      `);


    const [[parcelas]] =
      await db.query(`
        SELECT COUNT(*) AS total
        FROM parcelas
        WHERE activo = 1
      `);


    const [[visitas]] =
      await db.query(`
        SELECT COUNT(*) AS total
        FROM visitas
        WHERE activo = 1
      `);


    const [[supervisiones]] =
      await db.query(`
        SELECT COUNT(*) AS total
        FROM supervisiones
        WHERE activo = 1
      `);


    const [[hallazgos]] =
      await db.query(`
        SELECT COUNT(*) AS total
        FROM hallazgos
        WHERE activo = 1
      `);


    const [[pendientes]] =
      await db.query(`
        SELECT COUNT(*) AS total
        FROM recomendaciones
        WHERE activo = 1
        AND estado = 'PENDIENTE'
      `);


    const [[proceso]] =
      await db.query(`
        SELECT COUNT(*) AS total
        FROM recomendaciones
        WHERE activo = 1
        AND estado = 'EN_PROCESO'
      `);


    const [[cumplidas]] =
      await db.query(`
        SELECT COUNT(*) AS total
        FROM recomendaciones
        WHERE activo = 1
        AND estado = 'CUMPLIDO'
      `);


    res.json({
      ok: true,

      data: {
        tecnicos:
          tecnicos.total,

        beneficiarios:
          beneficiarios.total,

        parcelas:
          parcelas.total,

        visitas:
          visitas.total,

        supervisiones:
          supervisiones.total,

        hallazgos:
          hallazgos.total,

        recomendaciones_pendientes:
          pendientes.total,

        recomendaciones_en_proceso:
          proceso.total,

        recomendaciones_cumplidas:
          cumplidas.total
      }
    });


  } catch (error) {

    console.error(error);

    res.status(500).json({
      ok: false,
      mensaje:
        "Error al generar el resumen"
    });

  }

});


// =====================================
// REPORTE DE VISITAS
// =====================================

router.get("/visitas", async (req, res) => {

  try {

    const {
      desde = "",
      hasta = ""
    } = req.query;


    let sql = `
      SELECT
        v.id_visita,
        v.fecha,
        v.tipo_visita,
        v.objetivo,

        CONCAT(
          t.nombres,
          ' ',
          t.apellidos
        ) AS tecnico,

        CONCAT(
          b.nombres,
          ' ',
          b.apellidos
        ) AS beneficiario,

        c.nombre AS caserio,

        p.nombre_predio

      FROM visitas v

      INNER JOIN tecnicos t
        ON t.id_tecnico = v.id_tecnico

      INNER JOIN beneficiarios b
        ON b.id_beneficiario =
           v.id_beneficiario

      INNER JOIN caserios c
        ON c.id_caserio =
           b.id_caserio

      LEFT JOIN parcelas p
        ON p.id_parcela =
           v.id_parcela

      WHERE v.activo = 1
    `;


    const params = [];


    if (desde) {

      sql += `
        AND v.fecha >= ?
      `;

      params.push(desde);
    }


    if (hasta) {

      sql += `
        AND v.fecha <= ?
      `;

      params.push(hasta);
    }


    sql += `
      ORDER BY
        v.fecha DESC,
        v.id_visita DESC
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
        "Error al generar reporte de visitas"
    });

  }

});


// =====================================
// REPORTE DE RECOMENDACIONES
// =====================================

router.get(
  "/recomendaciones",
  async (req, res) => {

    try {

      const {
        estado = ""
      } = req.query;


      let sql = `
        SELECT
          r.id_recomendacion,
          r.descripcion,
          r.responsable,
          r.fecha_limite,
          r.estado,

          h.descripcion AS hallazgo,

          CONCAT(
            b.nombres,
            ' ',
            b.apellidos
          ) AS beneficiario,

          c.nombre AS caserio

        FROM recomendaciones r

        INNER JOIN hallazgos h
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

        WHERE r.activo = 1
      `;


      const params = [];


      if (estado) {

        sql += `
          AND r.estado = ?
        `;

        params.push(estado);
      }


      sql += `
        ORDER BY
          r.fecha_limite IS NULL,
          r.fecha_limite,
          r.id_recomendacion DESC
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
          "Error al generar reporte de recomendaciones"
      });

    }

  }
);


module.exports = router;