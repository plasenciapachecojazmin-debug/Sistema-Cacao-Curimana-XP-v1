const express = require("express");
const db = require("../config/db");
const auth = require("../middleware/auth");
const permit = require("../middleware/roles");

const router = express.Router();

router.use(auth);

// LISTAR CASERÍOS
router.get("/", async (req, res) => {
  try {
    const { q = "" } = req.query;

    let sql = `
      SELECT
        id_caserio,
        nombre,
        distrito,
        provincia,
        departamento,
        observacion,
        activo
      FROM caserios
      WHERE activo = 1
    `;

    const params = [];

    if (q) {
      sql += `
        AND (
          nombre LIKE ?
          OR distrito LIKE ?
          OR provincia LIKE ?
        )
      `;

      const term = `%${q}%`;
      params.push(term, term, term);
    }

    sql += " ORDER BY nombre";

    const [rows] = await db.query(sql, params);

    res.json({
      ok: true,
      data: rows
    });

  } catch (error) {
    console.error(error);

    res.status(500).json({
      ok: false,
      mensaje: "Error al listar caseríos"
    });
  }
});


// BUSCAR CASERÍO POR ID
router.get("/:id", async (req, res) => {
  try {

    const [rows] = await db.query(
      `
      SELECT *
      FROM caserios
      WHERE id_caserio = ?
      `,
      [req.params.id]
    );

    if (!rows.length) {
      return res.status(404).json({
        ok: false,
        mensaje: "Caserío no encontrado"
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
      mensaje: "Error al consultar el caserío"
    });
  }
});


// REGISTRAR CASERÍO
router.post(
  "/",
  permit("ADMINISTRADOR", "SUPERVISOR"),
  async (req, res) => {

    try {

      const {
        nombre,
        distrito = "Curimaná",
        provincia = "Padre Abad",
        departamento = "Ucayali",
        observacion = null
      } = req.body;

      if (!nombre || !nombre.trim()) {
        return res.status(400).json({
          ok: false,
          mensaje: "El nombre del caserío es obligatorio"
        });
      }

      const [existente] = await db.query(
        `
        SELECT id_caserio
        FROM caserios
        WHERE nombre = ?
        AND distrito = ?
        LIMIT 1
        `,
        [nombre.trim(), distrito]
      );

      if (existente.length) {
        return res.status(409).json({
          ok: false,
          mensaje: "El caserío ya se encuentra registrado"
        });
      }

      const [result] = await db.query(
        `
        INSERT INTO caserios
        (
          nombre,
          distrito,
          provincia,
          departamento,
          observacion
        )
        VALUES (?, ?, ?, ?, ?)
        `,
        [
          nombre.trim(),
          distrito,
          provincia,
          departamento,
          observacion
        ]
      );

      res.status(201).json({
        ok: true,
        mensaje: "Caserío registrado correctamente",
        id_caserio: result.insertId
      });

    } catch (error) {

      console.error(error);

      res.status(500).json({
        ok: false,
        mensaje: "Error al registrar el caserío"
      });
    }
  }
);


// ACTUALIZAR CASERÍO
router.put(
  "/:id",
  permit("ADMINISTRADOR", "SUPERVISOR"),
  async (req, res) => {

    try {

      const {
        nombre,
        distrito,
        provincia,
        departamento,
        observacion = null
      } = req.body;

      if (!nombre || !distrito || !provincia || !departamento) {

        return res.status(400).json({
          ok: false,
          mensaje: "Complete los campos obligatorios"
        });
      }

      const [result] = await db.query(
        `
        UPDATE caserios
        SET
          nombre = ?,
          distrito = ?,
          provincia = ?,
          departamento = ?,
          observacion = ?
        WHERE id_caserio = ?
        `,
        [
          nombre.trim(),
          distrito,
          provincia,
          departamento,
          observacion,
          req.params.id
        ]
      );

      if (!result.affectedRows) {

        return res.status(404).json({
          ok: false,
          mensaje: "Caserío no encontrado"
        });
      }

      res.json({
        ok: true,
        mensaje: "Caserío actualizado correctamente"
      });

    } catch (error) {

      console.error(error);

      res.status(500).json({
        ok: false,
        mensaje: "Error al actualizar el caserío"
      });
    }
  }
);


// DESACTIVAR CASERÍO
router.delete(
  "/:id",
  permit("ADMINISTRADOR"),
  async (req, res) => {

    try {

      const [result] = await db.query(
        `
        UPDATE caserios
        SET activo = 0
        WHERE id_caserio = ?
        `,
        [req.params.id]
      );

      if (!result.affectedRows) {

        return res.status(404).json({
          ok: false,
          mensaje: "Caserío no encontrado"
        });
      }

      res.json({
        ok: true,
        mensaje: "Caserío desactivado correctamente"
      });

    } catch (error) {

      console.error(error);

      res.status(500).json({
        ok: false,
        mensaje: "Error al desactivar el caserío"
      });
    }
  }
);

module.exports = router;