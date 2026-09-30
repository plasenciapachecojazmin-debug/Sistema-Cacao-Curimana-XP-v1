const express = require("express");
const db = require("../config/db");
const auth = require("../middleware/auth");
const permit = require("../middleware/roles");

const router = express.Router();

router.use(auth);


// =====================================
// LISTAR Y BUSCAR BENEFICIARIOS
// =====================================

router.get("/", async (req, res) => {

  try {

    const {
      q = "",
      caserio = ""
    } = req.query;


    let sql = `
      SELECT
        b.id_beneficiario,
        b.nombres,
        b.apellidos,
        b.dni,
        b.telefono,
        b.id_caserio,
        c.nombre AS caserio,
        b.sector,
        b.referencia,
        b.activo

      FROM beneficiarios b

      INNER JOIN caserios c
        ON c.id_caserio = b.id_caserio

      WHERE b.activo = 1
    `;


    const params = [];


    // =================================
    // BUSCADOR
    // =================================

    if (q) {

      sql += `
        AND (
          b.nombres LIKE ?
          OR b.apellidos LIKE ?
          OR b.dni LIKE ?
          OR b.telefono LIKE ?
          OR b.sector LIKE ?
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
        termino,
        termino
      );
    }


    // =================================
    // FILTRO POR CASERÍO
    // =================================

    if (caserio) {

      sql += `
        AND b.id_caserio = ?
      `;


      params.push(
        caserio
      );
    }


    sql += `
      ORDER BY
        b.apellidos,
        b.nombres
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
      "Error al listar beneficiarios:",
      error
    );


    res.status(500).json({
      ok: false,
      mensaje:
        "Error al listar los beneficiarios"
    });

  }

});


// =====================================
// OBTENER BENEFICIARIO POR ID
// =====================================

router.get("/:id", async (req, res) => {

  try {

    const [rows] =
      await db.query(
        `
        SELECT
          b.*,
          c.nombre AS caserio

        FROM beneficiarios b

        INNER JOIN caserios c
          ON c.id_caserio = b.id_caserio

        WHERE b.id_beneficiario = ?

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
          "Beneficiario no encontrado"
      });
    }


    res.json({
      ok: true,
      data: rows[0]
    });


  } catch (error) {

    console.error(
      "Error al consultar beneficiario:",
      error
    );


    res.status(500).json({
      ok: false,
      mensaje:
        "Error al consultar el beneficiario"
    });

  }

});


// =====================================
// REGISTRAR BENEFICIARIO
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
        dni = null,
        telefono = null,
        id_caserio,
        sector = null,
        referencia = null
      } = req.body;


      // =================================
      // CAMPOS OBLIGATORIOS
      // =================================

      if (
        !nombres ||
        !nombres.trim() ||
        !apellidos ||
        !apellidos.trim() ||
        !id_caserio
      ) {

        return res.status(400).json({
          ok: false,
          mensaje:
            "Nombres, apellidos y caserío son obligatorios"
        });
      }


      // =================================
      // PREPARAR DNI
      // =================================

      const dniLimpio =
        dni
          ? String(dni).trim()
          : "";


      // =================================
      // VALIDAR DNI
      // Solo números y exactamente 8
      // =================================

      if (
        dniLimpio &&
        !/^\d{8}$/.test(
          dniLimpio
        )
      ) {

        return res.status(400).json({
          ok: false,
          mensaje:
            "El DNI debe contener exactamente 8 dígitos y solo números"
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
      // VALIDAR CASERÍO
      // =================================

      const [caserios] =
        await db.query(
          `
          SELECT id_caserio
          FROM caserios
          WHERE id_caserio = ?
          AND activo = 1
          LIMIT 1
          `,
          [
            id_caserio
          ]
        );


      if (!caserios.length) {

        return res.status(400).json({
          ok: false,
          mensaje:
            "El caserío seleccionado no es válido"
        });
      }


      // =================================
      // VALIDAR DNI DUPLICADO
      // =================================

      if (dniLimpio) {

        const [existente] =
          await db.query(
            `
            SELECT id_beneficiario
            FROM beneficiarios
            WHERE dni = ?
            LIMIT 1
            `,
            [
              dniLimpio
            ]
          );


        if (existente.length) {

          return res.status(409).json({
            ok: false,
            mensaje:
              "Ya existe un beneficiario con este DNI"
          });
        }
      }


      // =================================
      // PREPARAR CAMPOS OPCIONALES
      // =================================

      const sectorLimpio =
        sector
          ? String(sector).trim()
          : "";


      const referenciaLimpia =
        referencia
          ? String(referencia).trim()
          : "";


      // =================================
      // REGISTRAR
      // =================================

      const [result] =
        await db.query(
          `
          INSERT INTO beneficiarios
          (
            nombres,
            apellidos,
            dni,
            telefono,
            id_caserio,
            sector,
            referencia
          )
          VALUES (?, ?, ?, ?, ?, ?, ?)
          `,
          [
            nombres.trim(),
            apellidos.trim(),

            dniLimpio ||
            null,

            telefonoLimpio ||
            null,

            id_caserio,

            sectorLimpio ||
            null,

            referenciaLimpia ||
            null
          ]
        );


      res.status(201).json({
        ok: true,
        mensaje:
          "Beneficiario registrado correctamente",
        id_beneficiario:
          result.insertId
      });


    } catch (error) {

      console.error(
        "Error al registrar beneficiario:",
        error
      );


      res.status(500).json({
        ok: false,
        mensaje:
          "Error al registrar el beneficiario"
      });

    }

  }
);


// =====================================
// ACTUALIZAR BENEFICIARIO
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
        dni = null,
        telefono = null,
        id_caserio,
        sector = null,
        referencia = null
      } = req.body;


      // =================================
      // CAMPOS OBLIGATORIOS
      // =================================

      if (
        !nombres ||
        !nombres.trim() ||
        !apellidos ||
        !apellidos.trim() ||
        !id_caserio
      ) {

        return res.status(400).json({
          ok: false,
          mensaje:
            "Nombres, apellidos y caserío son obligatorios"
        });
      }


      // =================================
      // PREPARAR DNI
      // =================================

      const dniLimpio =
        dni
          ? String(dni).trim()
          : "";


      // =================================
      // VALIDAR DNI
      // =================================

      if (
        dniLimpio &&
        !/^\d{8}$/.test(
          dniLimpio
        )
      ) {

        return res.status(400).json({
          ok: false,
          mensaje:
            "El DNI debe contener exactamente 8 dígitos y solo números"
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
      // VALIDAR CASERÍO
      // =================================

      const [caserios] =
        await db.query(
          `
          SELECT id_caserio
          FROM caserios
          WHERE id_caserio = ?
          AND activo = 1
          LIMIT 1
          `,
          [
            id_caserio
          ]
        );


      if (!caserios.length) {

        return res.status(400).json({
          ok: false,
          mensaje:
            "El caserío seleccionado no es válido"
        });
      }


      // =================================
      // VALIDAR DNI DUPLICADO EN OTRO
      // BENEFICIARIO
      // =================================

      if (dniLimpio) {

        const [existente] =
          await db.query(
            `
            SELECT id_beneficiario
            FROM beneficiarios
            WHERE dni = ?
            AND id_beneficiario <> ?
            LIMIT 1
            `,
            [
              dniLimpio,
              req.params.id
            ]
          );


        if (existente.length) {

          return res.status(409).json({
            ok: false,
            mensaje:
              "El DNI ya pertenece a otro beneficiario"
          });
        }
      }


      // =================================
      // PREPARAR CAMPOS OPCIONALES
      // =================================

      const sectorLimpio =
        sector
          ? String(sector).trim()
          : "";


      const referenciaLimpia =
        referencia
          ? String(referencia).trim()
          : "";


      // =================================
      // ACTUALIZAR
      // =================================

      const [result] =
        await db.query(
          `
          UPDATE beneficiarios

          SET
            nombres = ?,
            apellidos = ?,
            dni = ?,
            telefono = ?,
            id_caserio = ?,
            sector = ?,
            referencia = ?

          WHERE id_beneficiario = ?
          `,
          [
            nombres.trim(),
            apellidos.trim(),

            dniLimpio ||
            null,

            telefonoLimpio ||
            null,

            id_caserio,

            sectorLimpio ||
            null,

            referenciaLimpia ||
            null,

            req.params.id
          ]
        );


      if (!result.affectedRows) {

        return res.status(404).json({
          ok: false,
          mensaje:
            "Beneficiario no encontrado"
        });
      }


      res.json({
        ok: true,
        mensaje:
          "Beneficiario actualizado correctamente"
      });


    } catch (error) {

      console.error(
        "Error al actualizar beneficiario:",
        error
      );


      res.status(500).json({
        ok: false,
        mensaje:
          "Error al actualizar el beneficiario"
      });

    }

  }
);


// =====================================
// DESACTIVAR BENEFICIARIO
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
          UPDATE beneficiarios
          SET activo = 0
          WHERE id_beneficiario = ?
          AND activo = 1
          `,
          [
            req.params.id
          ]
        );


      if (!result.affectedRows) {

        return res.status(404).json({
          ok: false,
          mensaje:
            "Beneficiario no encontrado o ya está desactivado"
        });
      }


      res.json({
        ok: true,
        mensaje:
          "Beneficiario desactivado correctamente"
      });


    } catch (error) {

      console.error(
        "Error al desactivar beneficiario:",
        error
      );


      res.status(500).json({
        ok: false,
        mensaje:
          "Error al desactivar el beneficiario"
      });

    }

  }
);


module.exports = router;