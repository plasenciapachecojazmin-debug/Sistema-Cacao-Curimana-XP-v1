const express = require("express");
const db = require("../config/db");
const auth = require("../middleware/auth");
const permit = require("../middleware/roles");

const router = express.Router();

router.use(auth);


// =====================================
// LISTAR Y FILTRAR VISITAS
// =====================================

router.get("/", async (req, res) => {

  try {

    const {
      q = "",
      tecnico = "",
      beneficiario = "",
      tipo = "",
      fecha_desde = "",
      fecha_hasta = ""
    } = req.query;


    let sql = `
      SELECT
        v.id_visita,
        v.fecha,
        v.id_tecnico,
        v.id_beneficiario,
        v.id_parcela,
        v.tipo_visita,
        v.objetivo,
        v.latitud,
        v.longitud,
        v.observacion,
        v.activo,

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
        ON b.id_beneficiario = v.id_beneficiario

      INNER JOIN caserios c
        ON c.id_caserio = b.id_caserio

      LEFT JOIN parcelas p
        ON p.id_parcela = v.id_parcela

      WHERE v.activo = 1
    `;

    const params = [];


    if (q) {

      sql += `
        AND (
          t.nombres LIKE ?
          OR t.apellidos LIKE ?
          OR b.nombres LIKE ?
          OR b.apellidos LIKE ?
          OR c.nombre LIKE ?
          OR p.nombre_predio LIKE ?
          OR v.objetivo LIKE ?
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


    if (tecnico) {

      sql += `
        AND v.id_tecnico = ?
      `;

      params.push(tecnico);
    }


    if (beneficiario) {

      sql += `
        AND v.id_beneficiario = ?
      `;

      params.push(beneficiario);
    }


    if (tipo) {

      sql += `
        AND v.tipo_visita = ?
      `;

      params.push(tipo);
    }


    if (fecha_desde) {

      sql += `
        AND v.fecha >= ?
      `;

      params.push(fecha_desde);
    }


    if (fecha_hasta) {

      sql += `
        AND v.fecha <= ?
      `;

      params.push(fecha_hasta);
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
        "Error al listar las visitas"
    });

  }

});


// =====================================
// OBTENER VISITA POR ID
// =====================================

router.get("/:id", async (req, res) => {

  try {

    const [rows] =
      await db.query(
        `
        SELECT
          v.*,

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
          ON b.id_beneficiario = v.id_beneficiario

        INNER JOIN caserios c
          ON c.id_caserio = b.id_caserio

        LEFT JOIN parcelas p
          ON p.id_parcela = v.id_parcela

        WHERE v.id_visita = ?
        `,
        [req.params.id]
      );


    if (!rows.length) {

      return res.status(404).json({
        ok: false,
        mensaje:
          "Visita no encontrada"
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
        "Error al consultar la visita"
    });

  }

});


// =====================================
// REGISTRAR VISITA
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
        fecha,
        id_tecnico,
        id_beneficiario,
        id_parcela = null,
        tipo_visita = "SUPERVISION",
        objetivo,
        latitud = null,
        longitud = null,
        observacion = null
      } = req.body;


      if (
        !fecha ||
        !id_tecnico ||
        !id_beneficiario ||
        !objetivo ||
        !objetivo.trim()
      ) {

        return res.status(400).json({
          ok: false,
          mensaje:
            "Fecha, técnico, beneficiario y objetivo son obligatorios"
        });

      }


      const tiposPermitidos = [
        "ASISTENCIA_TECNICA",
        "SUPERVISION"
      ];


      if (
        !tiposPermitidos.includes(
          tipo_visita
        )
      ) {

        return res.status(400).json({
          ok: false,
          mensaje:
            "Tipo de visita no válido"
        });

      }


      // VALIDAR TÉCNICO

      const [tecnicos] =
        await db.query(
          `
          SELECT id_tecnico
          FROM tecnicos
          WHERE id_tecnico = ?
          AND activo = 1
          `,
          [id_tecnico]
        );


      if (!tecnicos.length) {

        return res.status(400).json({
          ok: false,
          mensaje:
            "El técnico seleccionado no es válido"
        });

      }


      // VALIDAR BENEFICIARIO

      const [beneficiarios] =
        await db.query(
          `
          SELECT id_beneficiario
          FROM beneficiarios
          WHERE id_beneficiario = ?
          AND activo = 1
          `,
          [id_beneficiario]
        );


      if (!beneficiarios.length) {

        return res.status(400).json({
          ok: false,
          mensaje:
            "El beneficiario seleccionado no es válido"
        });

      }


      // VALIDAR PARCELA Y RELACIÓN CON BENEFICIARIO

      if (id_parcela) {

        const [parcelas] =
          await db.query(
            `
            SELECT id_parcela
            FROM parcelas
            WHERE id_parcela = ?
            AND id_beneficiario = ?
            AND activo = 1
            `,
            [
              id_parcela,
              id_beneficiario
            ]
          );


        if (!parcelas.length) {

          return res.status(400).json({
            ok: false,
            mensaje:
              "La parcela no pertenece al beneficiario seleccionado"
          });

        }

      }


      // VALIDAR GPS

      if (
        latitud !== null &&
        latitud !== "" &&
        (
          Number(latitud) < -90 ||
          Number(latitud) > 90
        )
      ) {

        return res.status(400).json({
          ok: false,
          mensaje:
            "La latitud debe estar entre -90 y 90"
        });

      }


      if (
        longitud !== null &&
        longitud !== "" &&
        (
          Number(longitud) < -180 ||
          Number(longitud) > 180
        )
      ) {

        return res.status(400).json({
          ok: false,
          mensaje:
            "La longitud debe estar entre -180 y 180"
        });

      }


      const [result] =
        await db.query(
          `
          INSERT INTO visitas
          (
            fecha,
            id_tecnico,
            id_beneficiario,
            id_parcela,
            tipo_visita,
            objetivo,
            latitud,
            longitud,
            observacion,
            id_usuario_registro
          )
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `,
          [
            fecha,
            id_tecnico,
            id_beneficiario,
            id_parcela || null,
            tipo_visita,
            objetivo.trim(),
            latitud !== ""
              ? latitud
              : null,
            longitud !== ""
              ? longitud
              : null,
            observacion &&
            observacion.trim()
              ? observacion.trim()
              : null,
            req.user.id_usuario
          ]
        );


      res.status(201).json({
        ok: true,
        mensaje:
          "Visita registrada correctamente",
        id_visita:
          result.insertId
      });


    } catch (error) {

      console.error(error);

      res.status(500).json({
        ok: false,
        mensaje:
          "Error al registrar la visita"
      });

    }

  }
);


// =====================================
// ACTUALIZAR VISITA
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
        fecha,
        id_tecnico,
        id_beneficiario,
        id_parcela = null,
        tipo_visita,
        objetivo,
        latitud = null,
        longitud = null,
        observacion = null
      } = req.body;


      if (
        !fecha ||
        !id_tecnico ||
        !id_beneficiario ||
        !tipo_visita ||
        !objetivo
      ) {

        return res.status(400).json({
          ok: false,
          mensaje:
            "Complete los campos obligatorios"
        });

      }


      if (id_parcela) {

        const [parcelas] =
          await db.query(
            `
            SELECT id_parcela
            FROM parcelas
            WHERE id_parcela = ?
            AND id_beneficiario = ?
            AND activo = 1
            `,
            [
              id_parcela,
              id_beneficiario
            ]
          );


        if (!parcelas.length) {

          return res.status(400).json({
            ok: false,
            mensaje:
              "La parcela no pertenece al beneficiario seleccionado"
          });

        }

      }


      const [result] =
        await db.query(
          `
          UPDATE visitas
          SET
            fecha = ?,
            id_tecnico = ?,
            id_beneficiario = ?,
            id_parcela = ?,
            tipo_visita = ?,
            objetivo = ?,
            latitud = ?,
            longitud = ?,
            observacion = ?
          WHERE id_visita = ?
          `,
          [
            fecha,
            id_tecnico,
            id_beneficiario,
            id_parcela || null,
            tipo_visita,
            objetivo.trim(),
            latitud !== ""
              ? latitud
              : null,
            longitud !== ""
              ? longitud
              : null,
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
            "Visita no encontrada"
        });

      }


      res.json({
        ok: true,
        mensaje:
          "Visita actualizada correctamente"
      });


    } catch (error) {

      console.error(error);

      res.status(500).json({
        ok: false,
        mensaje:
          "Error al actualizar la visita"
      });

    }

  }
);


// =====================================
// DESACTIVAR VISITA
// =====================================

router.delete(
  "/:id",
  permit("ADMINISTRADOR"),
  async (req, res) => {

    try {

      const [supervisiones] =
        await db.query(
          `
          SELECT id_supervision
          FROM supervisiones
          WHERE id_visita = ?
          LIMIT 1
          `,
          [req.params.id]
        );


      if (supervisiones.length) {

        return res.status(409).json({
          ok: false,
          mensaje:
            "No se puede desactivar una visita que ya tiene supervisiones registradas"
        });

      }


      const [result] =
        await db.query(
          `
          UPDATE visitas
          SET activo = 0
          WHERE id_visita = ?
          `,
          [req.params.id]
        );


      if (!result.affectedRows) {

        return res.status(404).json({
          ok: false,
          mensaje:
            "Visita no encontrada"
        });

      }


      res.json({
        ok: true,
        mensaje:
          "Visita desactivada correctamente"
      });


    } catch (error) {

      console.error(error);

      res.status(500).json({
        ok: false,
        mensaje:
          "Error al desactivar la visita"
      });

    }

  }
);


module.exports = router;