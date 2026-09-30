const express = require("express");
const db = require("../config/db");
const auth = require("../middleware/auth");
const permit = require("../middleware/roles");

const router = express.Router();

router.use(auth);


// =====================================
// LISTAR Y BUSCAR TÉCNICOS
// =====================================

router.get("/", async (req, res) => {

  try {

    const { q = "" } = req.query;


    let sql = `
      SELECT
        id_tecnico,
        nombres,
        apellidos,
        cargo,
        telefono,
        email,
        activo
      FROM tecnicos
      WHERE activo = 1
    `;


    const params = [];


    if (q) {

      sql += `
        AND (
          nombres LIKE ?
          OR apellidos LIKE ?
          OR cargo LIKE ?
          OR telefono LIKE ?
          OR email LIKE ?
        )
      `;


      const termino = `%${q}%`;


      params.push(
        termino,
        termino,
        termino,
        termino,
        termino
      );
    }


    sql += `
      ORDER BY
        apellidos,
        nombres
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

    console.error(
      "Error al listar técnicos:",
      error
    );


    res.status(500).json({
      ok: false,
      mensaje:
        "Error al listar los técnicos"
    });

  }

});


// =====================================
// OBTENER TÉCNICO POR ID
// =====================================

router.get("/:id", async (req, res) => {

  try {

    const [rows] =
      await db.query(
        `
        SELECT
          id_tecnico,
          nombres,
          apellidos,
          cargo,
          telefono,
          email,
          activo
        FROM tecnicos
        WHERE id_tecnico = ?
        LIMIT 1
        `,
        [
          req.params.id
        ]
      );


    if (!rows.length) {

      return res.status(404).json({
        ok: false,
        mensaje:
          "Técnico no encontrado"
      });

    }


    res.json({
      ok: true,
      data: rows[0]
    });


  } catch (error) {

    console.error(
      "Error al consultar técnico:",
      error
    );


    res.status(500).json({
      ok: false,
      mensaje:
        "Error al consultar el técnico"
    });

  }

});


// =====================================
// REGISTRAR TÉCNICO
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
        nombres,
        apellidos,
        cargo,
        telefono = null,
        email = null
      } = req.body;


      // =================================
      // VALIDAR CAMPOS OBLIGATORIOS
      // =================================

      if (
        !nombres ||
        !nombres.trim() ||
        !apellidos ||
        !apellidos.trim() ||
        !cargo ||
        !cargo.trim()
      ) {

        return res.status(400).json({
          ok: false,
          mensaje:
            "Nombres, apellidos y cargo son obligatorios"
        });

      }


      // =================================
      // PREPARAR TELÉFONO
      // =================================

      const telefonoLimpio =
        telefono
          ? String(telefono).trim()
          : "";


      // =================================
      // VALIDAR TELÉFONO
      // Solo números y exactamente 9
      // =================================

      if (
        telefonoLimpio &&
        !/^\d{9}$/.test(
          telefonoLimpio
        )
      ) {

        return res.status(400).json({
          ok: false,
          mensaje:
            "El teléfono debe contener exactamente 9 dígitos y solo números"
        });

      }


      // =================================
      // PREPARAR CORREO
      // =================================

      const emailLimpio =
        email
          ? String(email).trim()
          : "";


      // =================================
      // REGISTRAR
      // =================================

      const [result] =
        await db.query(
          `
          INSERT INTO tecnicos
          (
            nombres,
            apellidos,
            cargo,
            telefono,
            email
          )
          VALUES (?, ?, ?, ?, ?)
          `,
          [
            nombres.trim(),
            apellidos.trim(),
            cargo.trim(),

            telefonoLimpio ||
            null,

            emailLimpio ||
            null
          ]
        );


      res.status(201).json({
        ok: true,
        mensaje:
          "Técnico registrado correctamente",
        id_tecnico:
          result.insertId
      });


    } catch (error) {

      console.error(
        "Error al registrar técnico:",
        error
      );


      res.status(500).json({
        ok: false,
        mensaje:
          "Error al registrar el técnico"
      });

    }

  }
);


// =====================================
// ACTUALIZAR TÉCNICO
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
        nombres,
        apellidos,
        cargo,
        telefono = null,
        email = null
      } = req.body;


      // =================================
      // VALIDAR CAMPOS OBLIGATORIOS
      // =================================

      if (
        !nombres ||
        !nombres.trim() ||
        !apellidos ||
        !apellidos.trim() ||
        !cargo ||
        !cargo.trim()
      ) {

        return res.status(400).json({
          ok: false,
          mensaje:
            "Nombres, apellidos y cargo son obligatorios"
        });

      }


      // =================================
      // PREPARAR TELÉFONO
      // =================================

      const telefonoLimpio =
        telefono
          ? String(telefono).trim()
          : "";


      // =================================
      // VALIDAR TELÉFONO
      // =================================

      if (
        telefonoLimpio &&
        !/^\d{9}$/.test(
          telefonoLimpio
        )
      ) {

        return res.status(400).json({
          ok: false,
          mensaje:
            "El teléfono debe contener exactamente 9 dígitos y solo números"
        });

      }


      // =================================
      // PREPARAR CORREO
      // =================================

      const emailLimpio =
        email
          ? String(email).trim()
          : "";


      // =================================
      // ACTUALIZAR
      // =================================

      const [result] =
        await db.query(
          `
          UPDATE tecnicos
          SET
            nombres = ?,
            apellidos = ?,
            cargo = ?,
            telefono = ?,
            email = ?
          WHERE id_tecnico = ?
          `,
          [
            nombres.trim(),
            apellidos.trim(),
            cargo.trim(),

            telefonoLimpio ||
            null,

            emailLimpio ||
            null,

            req.params.id
          ]
        );


      if (
        !result.affectedRows
      ) {

        return res.status(404).json({
          ok: false,
          mensaje:
            "Técnico no encontrado"
        });

      }


      res.json({
        ok: true,
        mensaje:
          "Técnico actualizado correctamente"
      });


    } catch (error) {

      console.error(
        "Error al actualizar técnico:",
        error
      );


      res.status(500).json({
        ok: false,
        mensaje:
          "Error al actualizar el técnico"
      });

    }

  }
);


// =====================================
// DESACTIVAR TÉCNICO
// =====================================

router.delete(
  "/:id",
  permit(
    "ADMINISTRADOR"
  ),
  async (req, res) => {

    try {

      const [result] =
        await db.query(
          `
          UPDATE tecnicos
          SET activo = 0
          WHERE id_tecnico = ?
          AND activo = 1
          `,
          [
            req.params.id
          ]
        );


      if (
        !result.affectedRows
      ) {

        return res.status(404).json({
          ok: false,
          mensaje:
            "Técnico no encontrado o ya está desactivado"
        });

      }


      res.json({
        ok: true,
        mensaje:
          "Técnico desactivado correctamente"
      });


    } catch (error) {

      console.error(
        "Error al desactivar técnico:",
        error
      );


      res.status(500).json({
        ok: false,
        mensaje:
          "Error al desactivar el técnico"
      });

    }

  }
);


module.exports = router;