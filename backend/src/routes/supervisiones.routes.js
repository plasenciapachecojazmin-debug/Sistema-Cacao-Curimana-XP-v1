const express = require("express");
const db = require("../config/db");
const auth = require("../middleware/auth");
const permit = require("../middleware/roles");

const router = express.Router();

router.use(auth);


// =====================================
// LISTAR SUPERVISIONES
// =====================================

router.get("/", async (req, res) => {

  try {

    const {
      q = "",
      cumplimiento = ""
    } = req.query;


    let sql = `
      SELECT
        s.id_supervision,
        s.id_visita,
        s.actividad_programada,
        s.cumplimiento,
        s.observacion,
        s.activo,

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

      FROM supervisiones s

      INNER JOIN visitas v
        ON v.id_visita = s.id_visita

      INNER JOIN tecnicos t
        ON t.id_tecnico = v.id_tecnico

      INNER JOIN beneficiarios b
        ON b.id_beneficiario = v.id_beneficiario

      INNER JOIN caserios c
        ON c.id_caserio = b.id_caserio

      LEFT JOIN parcelas p
        ON p.id_parcela = v.id_parcela

      WHERE s.activo = 1
    `;


    const params = [];


    if (q) {

      sql += `
        AND (
          s.actividad_programada LIKE ?
          OR t.nombres LIKE ?
          OR t.apellidos LIKE ?
          OR b.nombres LIKE ?
          OR b.apellidos LIKE ?
          OR c.nombre LIKE ?
          OR p.nombre_predio LIKE ?
        )
      `;

      const termino = `%${q}%`;

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


    if (cumplimiento) {

      sql += `
        AND s.cumplimiento = ?
      `;

      params.push(cumplimiento);

    }


    sql += `
      ORDER BY
        v.fecha DESC,
        s.id_supervision DESC
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
        "Error al listar las supervisiones"
    });

  }

});


// =====================================
// OBTENER SUPERVISIÓN POR ID
// =====================================

router.get("/:id", async (req, res) => {

  try {

    const [rows] =
      await db.query(
        `
        SELECT
          s.*,

          v.fecha,

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

        FROM supervisiones s

        INNER JOIN visitas v
          ON v.id_visita = s.id_visita

        INNER JOIN tecnicos t
          ON t.id_tecnico = v.id_tecnico

        INNER JOIN beneficiarios b
          ON b.id_beneficiario = v.id_beneficiario

        INNER JOIN caserios c
          ON c.id_caserio = b.id_caserio

        LEFT JOIN parcelas p
          ON p.id_parcela = v.id_parcela

        WHERE s.id_supervision = ?
        `,
        [req.params.id]
      );


    if (!rows.length) {

      return res.status(404).json({
        ok: false,
        mensaje:
          "Supervisión no encontrada"
      });

    }


    res.json({
      ok: true,
      data: rows[0]
    });


  } catch (error) {

    console.error(error);

    res.status(500).json({
      ok: false,
      mensaje:
        "Error al consultar la supervisión"
    });

  }

});


// =====================================
// REGISTRAR SUPERVISIÓN
// =====================================

router.post(
  "/",
  permit(
    "ADMINISTRADOR",
    "SUPERVISOR"
  ),
  async (req, res) => {

    try {

      const {
        id_visita,
        actividad_programada,
        cumplimiento,
        observacion = null
      } = req.body;


      if (
        !id_visita ||
        !actividad_programada ||
        !actividad_programada.trim() ||
        !cumplimiento
      ) {

        return res.status(400).json({
          ok: false,
          mensaje:
            "Visita, actividad y cumplimiento son obligatorios"
        });

      }


      const valoresPermitidos = [
        "CUMPLIDO",
        "PARCIAL",
        "NO_CUMPLIDO"
      ];


      if (
        !valoresPermitidos.includes(
          cumplimiento
        )
      ) {

        return res.status(400).json({
          ok: false,
          mensaje:
            "Estado de cumplimiento no válido"
        });

      }


      // VALIDAR VISITA

      const [visitas] =
        await db.query(
          `
          SELECT id_visita
          FROM visitas
          WHERE id_visita = ?
          AND activo = 1
          `,
          [id_visita]
        );


      if (!visitas.length) {

        return res.status(400).json({
          ok: false,
          mensaje:
            "La visita seleccionada no es válida"
        });

      }


      const [result] =
        await db.query(
          `
          INSERT INTO supervisiones
          (
            id_visita,
            actividad_programada,
            cumplimiento,
            observacion
          )
          VALUES (?, ?, ?, ?)
          `,
          [
            id_visita,
            actividad_programada.trim(),
            cumplimiento,
            observacion &&
            observacion.trim()
              ? observacion.trim()
              : null
          ]
        );


      res.status(201).json({
        ok: true,
        mensaje:
          "Supervisión registrada correctamente",
        id_supervision:
          result.insertId
      });


    } catch (error) {

      console.error(error);

      res.status(500).json({
        ok: false,
        mensaje:
          "Error al registrar la supervisión"
      });

    }

  }
);


// =====================================
// ACTUALIZAR SUPERVISIÓN
// =====================================

router.put(
  "/:id",
  permit(
    "ADMINISTRADOR",
    "SUPERVISOR"
  ),
  async (req, res) => {

    try {

      const {
        id_visita,
        actividad_programada,
        cumplimiento,
        observacion = null
      } = req.body;


      if (
        !id_visita ||
        !actividad_programada ||
        !cumplimiento
      ) {

        return res.status(400).json({
          ok: false,
          mensaje:
            "Complete los campos obligatorios"
        });

      }


      const valoresPermitidos = [
        "CUMPLIDO",
        "PARCIAL",
        "NO_CUMPLIDO"
      ];


      if (
        !valoresPermitidos.includes(
          cumplimiento
        )
      ) {

        return res.status(400).json({
          ok: false,
          mensaje:
            "Estado de cumplimiento no válido"
        });

      }


      const [result] =
        await db.query(
          `
          UPDATE supervisiones
          SET
            id_visita = ?,
            actividad_programada = ?,
            cumplimiento = ?,
            observacion = ?
          WHERE id_supervision = ?
          `,
          [
            id_visita,
            actividad_programada.trim(),
            cumplimiento,

            observacion &&
            observacion.trim()
              ? observacion.trim()
              : null,

            req.params.id
          ]
        );


      if (!result.affectedRows) {

        return res.status(404).json({
          ok: false,
          mensaje:
            "Supervisión no encontrada"
        });

      }


      res.json({
        ok: true,
        mensaje:
          "Supervisión actualizada correctamente"
      });


    } catch (error) {

      console.error(error);

      res.status(500).json({
        ok: false,
        mensaje:
          "Error al actualizar la supervisión"
      });

    }

  }
);


// =====================================
// DESACTIVAR SUPERVISIÓN
// =====================================

router.delete(
  "/:id",
  permit("ADMINISTRADOR"),
  async (req, res) => {

    try {

      // NO DESACTIVAR SI YA TIENE HALLAZGOS

      const [hallazgos] =
        await db.query(
          `
          SELECT id_hallazgo
          FROM hallazgos
          WHERE id_supervision = ?
          LIMIT 1
          `,
          [req.params.id]
        );


      if (hallazgos.length) {

        return res.status(409).json({
          ok: false,
          mensaje:
            "No se puede desactivar una supervisión que tiene hallazgos registrados"
        });

      }


      // NO DESACTIVAR SI TIENE RECOMENDACIONES

      const [recomendaciones] =
        await db.query(
          `
          SELECT id_recomendacion
          FROM recomendaciones
          WHERE id_supervision = ?
          LIMIT 1
          `,
          [req.params.id]
        );


      if (recomendaciones.length) {

        return res.status(409).json({
          ok: false,
          mensaje:
            "No se puede desactivar una supervisión que tiene recomendaciones registradas"
        });

      }


      const [result] =
        await db.query(
          `
          UPDATE supervisiones
          SET activo = 0
          WHERE id_supervision = ?
          `,
          [req.params.id]
        );


      if (!result.affectedRows) {

        return res.status(404).json({
          ok: false,
          mensaje:
            "Supervisión no encontrada"
        });

      }


      res.json({
        ok: true,
        mensaje:
          "Supervisión desactivada correctamente"
      });


    } catch (error) {

      console.error(error);

      res.status(500).json({
        ok: false,
        mensaje:
          "Error al desactivar la supervisión"
      });

    }

  }
);


module.exports = router;