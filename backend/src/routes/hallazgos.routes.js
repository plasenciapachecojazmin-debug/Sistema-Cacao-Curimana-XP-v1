const express = require("express");
const db = require("../config/db");
const auth = require("../middleware/auth");
const permit = require("../middleware/roles");

const router = express.Router();

router.use(auth);


// LISTAR HALLAZGOS
router.get("/", async (req, res) => {

  try {

    const {
      q = "",
      nivel = ""
    } = req.query;


    let sql = `
      SELECT
        h.id_hallazgo,
        h.id_supervision,
        h.descripcion,
        h.nivel,
        h.creado_en,
        h.activo,

        s.actividad_programada,
        s.cumplimiento,

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

      FROM hallazgos h

      INNER JOIN supervisiones s
        ON s.id_supervision = h.id_supervision

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

      WHERE h.activo = 1
      AND s.activo = 1
    `;

    const params = [];


    if (q) {

      sql += `
        AND (
          h.descripcion LIKE ?
          OR s.actividad_programada LIKE ?
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
        termino,
        termino
      );

    }


    if (nivel) {

      sql += `
        AND h.nivel = ?
      `;

      params.push(nivel);

    }


    sql += `
      ORDER BY
        h.id_hallazgo DESC
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
        "Error al listar los hallazgos"
    });

  }

});


// OBTENER HALLAZGO POR ID
router.get("/:id", async (req, res) => {

  try {

    const [rows] =
      await db.query(
        `
        SELECT *
        FROM hallazgos
        WHERE id_hallazgo = ?
        `,
        [req.params.id]
      );


    if (!rows.length) {

      return res.status(404).json({
        ok: false,
        mensaje:
          "Hallazgo no encontrado"
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
        "Error al consultar el hallazgo"
    });

  }

});


// REGISTRAR HALLAZGO
router.post(
  "/",
  permit(
    "ADMINISTRADOR",
    "SUPERVISOR"
  ),
  async (req, res) => {

    try {

      const {
        id_supervision,
        descripcion,
        nivel = "MEDIO"
      } = req.body;


      if (
        !id_supervision ||
        !descripcion ||
        !descripcion.trim()
      ) {

        return res.status(400).json({
          ok: false,
          mensaje:
            "Supervisión y descripción son obligatorias"
        });

      }


      const nivelesPermitidos = [
        "BAJO",
        "MEDIO",
        "ALTO"
      ];


      if (
        !nivelesPermitidos.includes(
          nivel
        )
      ) {

        return res.status(400).json({
          ok: false,
          mensaje:
            "Nivel de hallazgo no válido"
        });

      }


      const [supervisiones] =
        await db.query(
          `
          SELECT id_supervision
          FROM supervisiones
          WHERE id_supervision = ?
          AND activo = 1
          `,
          [id_supervision]
        );


      if (!supervisiones.length) {

        return res.status(400).json({
          ok: false,
          mensaje:
            "La supervisión seleccionada no es válida"
        });

      }


      const [result] =
        await db.query(
          `
          INSERT INTO hallazgos
          (
            id_supervision,
            descripcion,
            nivel
          )
          VALUES (?, ?, ?)
          `,
          [
            id_supervision,
            descripcion.trim(),
            nivel
          ]
        );


      res.status(201).json({
        ok: true,
        mensaje:
          "Hallazgo registrado correctamente",
        id_hallazgo:
          result.insertId
      });


    } catch (error) {

      console.error(error);

      res.status(500).json({
        ok: false,
        mensaje:
          "Error al registrar el hallazgo"
      });

    }

  }
);


// ACTUALIZAR HALLAZGO
router.put(
  "/:id",
  permit(
    "ADMINISTRADOR",
    "SUPERVISOR"
  ),
  async (req, res) => {

    try {

      const {
        id_supervision,
        descripcion,
        nivel
      } = req.body;


      if (
        !id_supervision ||
        !descripcion ||
        !nivel
      ) {

        return res.status(400).json({
          ok: false,
          mensaje:
            "Complete los campos obligatorios"
        });

      }


      const [result] =
        await db.query(
          `
          UPDATE hallazgos
          SET
            id_supervision = ?,
            descripcion = ?,
            nivel = ?
          WHERE id_hallazgo = ?
          `,
          [
            id_supervision,
            descripcion.trim(),
            nivel,
            req.params.id
          ]
        );


      if (!result.affectedRows) {

        return res.status(404).json({
          ok: false,
          mensaje:
            "Hallazgo no encontrado"
        });

      }


      res.json({
        ok: true,
        mensaje:
          "Hallazgo actualizado correctamente"
      });


    } catch (error) {

      console.error(error);

      res.status(500).json({
        ok: false,
        mensaje:
          "Error al actualizar el hallazgo"
      });

    }

  }
);


// DESACTIVAR HALLAZGO
router.delete(
  "/:id",
  permit("ADMINISTRADOR"),
  async (req, res) => {

    try {

      const [result] =
        await db.query(
          `
          UPDATE hallazgos
          SET activo = 0
          WHERE id_hallazgo = ?
          `,
          [req.params.id]
        );


      if (!result.affectedRows) {

        return res.status(404).json({
          ok: false,
          mensaje:
            "Hallazgo no encontrado"
        });

      }


      res.json({
        ok: true,
        mensaje:
          "Hallazgo desactivado correctamente"
      });


    } catch (error) {

      console.error(error);

      res.status(500).json({
        ok: false,
        mensaje:
          "Error al desactivar el hallazgo"
      });

    }

  }
);


module.exports = router;