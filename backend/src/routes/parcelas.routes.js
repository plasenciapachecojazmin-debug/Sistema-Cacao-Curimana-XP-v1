const express = require("express");
const db = require("../config/db");
const auth = require("../middleware/auth");
const permit = require("../middleware/roles");

const router = express.Router();

router.use(auth);


// =====================================
// LISTAR Y BUSCAR PARCELAS
// =====================================

router.get("/", async (req, res) => {

  try {

    const {
      q = "",
      beneficiario = ""
    } = req.query;


    let sql = `
      SELECT
        p.id_parcela,
        p.id_beneficiario,
        p.nombre_predio,
        p.cultivo,
        p.area_ha,
        p.latitud,
        p.longitud,
        p.observacion,
        p.activo,

        CONCAT(
          b.nombres,
          ' ',
          b.apellidos
        ) AS beneficiario,

        c.nombre AS caserio

      FROM parcelas p

      INNER JOIN beneficiarios b
        ON b.id_beneficiario =
           p.id_beneficiario

      INNER JOIN caserios c
        ON c.id_caserio =
           b.id_caserio

      WHERE p.activo = 1
    `;


    const params = [];


    // BÚSQUEDA

    if (q) {

      sql += `
        AND (
          p.nombre_predio LIKE ?
          OR p.cultivo LIKE ?
          OR b.nombres LIKE ?
          OR b.apellidos LIKE ?
          OR c.nombre LIKE ?
        )
      `;


      const termino =
        `%${q}%`;


      params.push(
        termino,
        termino,
        termino,
        termino,
        termino
      );
    }


    // FILTRO POR BENEFICIARIO

    if (beneficiario) {

      sql += `
        AND p.id_beneficiario = ?
      `;

      params.push(
        beneficiario
      );
    }


    sql += `
      ORDER BY
        b.apellidos,
        b.nombres,
        p.id_parcela DESC
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
        "Error al listar las parcelas"
    });

  }

});


// =====================================
// OBTENER PARCELA POR ID
// =====================================

router.get("/:id", async (req, res) => {

  try {

    const [rows] =
      await db.query(
        `
        SELECT
          p.*,

          CONCAT(
            b.nombres,
            ' ',
            b.apellidos
          ) AS beneficiario,

          c.nombre AS caserio

        FROM parcelas p

        INNER JOIN beneficiarios b
          ON b.id_beneficiario =
             p.id_beneficiario

        INNER JOIN caserios c
          ON c.id_caserio =
             b.id_caserio

        WHERE p.id_parcela = ?
        `,
        [req.params.id]
      );


    if (!rows.length) {

      return res.status(404).json({
        ok: false,
        mensaje:
          "Parcela no encontrada"
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
        "Error al consultar la parcela"
    });

  }

});


// =====================================
// REGISTRAR PARCELA
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
        id_beneficiario,
        nombre_predio = null,
        cultivo = "Cacao",
        area_ha = null,
        latitud = null,
        longitud = null,
        observacion = null
      } = req.body;


      if (!id_beneficiario) {

        return res.status(400).json({
          ok: false,
          mensaje:
            "Debe seleccionar un beneficiario"
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


      // VALIDAR ÁREA

      if (
        area_ha !== null &&
        area_ha !== "" &&
        Number(area_ha) < 0
      ) {

        return res.status(400).json({
          ok: false,
          mensaje:
            "El área no puede ser negativa"
        });

      }


      // VALIDAR LATITUD

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


      // VALIDAR LONGITUD

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
          INSERT INTO parcelas
          (
            id_beneficiario,
            nombre_predio,
            cultivo,
            area_ha,
            latitud,
            longitud,
            observacion
          )
          VALUES (?, ?, ?, ?, ?, ?, ?)
          `,
          [
            id_beneficiario,

            nombre_predio &&
            nombre_predio.trim()
              ? nombre_predio.trim()
              : null,

            cultivo &&
            cultivo.trim()
              ? cultivo.trim()
              : "Cacao",

            area_ha !== ""
              ? area_ha
              : null,

            latitud !== ""
              ? latitud
              : null,

            longitud !== ""
              ? longitud
              : null,

            observacion &&
            observacion.trim()
              ? observacion.trim()
              : null
          ]
        );


      res.status(201).json({
        ok: true,
        mensaje:
          "Parcela registrada correctamente",
        id_parcela:
          result.insertId
      });


    } catch (error) {

      console.error(error);


      res.status(500).json({
        ok: false,
        mensaje:
          "Error al registrar la parcela"
      });

    }

  }
);


// =====================================
// ACTUALIZAR PARCELA
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
        id_beneficiario,
        nombre_predio = null,
        cultivo = "Cacao",
        area_ha = null,
        latitud = null,
        longitud = null,
        observacion = null
      } = req.body;


      if (!id_beneficiario) {

        return res.status(400).json({
          ok: false,
          mensaje:
            "Debe seleccionar un beneficiario"
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


      const [result] =
        await db.query(
          `
          UPDATE parcelas
          SET
            id_beneficiario = ?,
            nombre_predio = ?,
            cultivo = ?,
            area_ha = ?,
            latitud = ?,
            longitud = ?,
            observacion = ?
          WHERE id_parcela = ?
          `,
          [
            id_beneficiario,

            nombre_predio &&
            nombre_predio.trim()
              ? nombre_predio.trim()
              : null,

            cultivo &&
            cultivo.trim()
              ? cultivo.trim()
              : "Cacao",

            area_ha !== ""
              ? area_ha
              : null,

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
            "Parcela no encontrada"
        });

      }


      res.json({
        ok: true,
        mensaje:
          "Parcela actualizada correctamente"
      });


    } catch (error) {

      console.error(error);


      res.status(500).json({
        ok: false,
        mensaje:
          "Error al actualizar la parcela"
      });

    }

  }
);


// =====================================
// DESACTIVAR PARCELA
// =====================================

router.delete(
  "/:id",
  permit("ADMINISTRADOR"),
  async (req, res) => {

    try {

      const [result] =
        await db.query(
          `
          UPDATE parcelas
          SET activo = 0
          WHERE id_parcela = ?
          `,
          [req.params.id]
        );


      if (!result.affectedRows) {

        return res.status(404).json({
          ok: false,
          mensaje:
            "Parcela no encontrada"
        });

      }


      res.json({
        ok: true,
        mensaje:
          "Parcela desactivada correctamente"
      });


    } catch (error) {

      console.error(error);


      res.status(500).json({
        ok: false,
        mensaje:
          "Error al desactivar la parcela"
      });

    }

  }
);


module.exports = router;