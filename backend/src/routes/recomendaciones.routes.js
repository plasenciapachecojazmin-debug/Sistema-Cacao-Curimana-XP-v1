const express = require("express");
const db = require("../config/db");
const auth = require("../middleware/auth");
const permit = require("../middleware/roles");

const router = express.Router();

router.use(auth);


// =====================================
// LISTAR RECOMENDACIONES
// =====================================

router.get("/", async (req, res) => {

  try {

    const {
      q = "",
      estado = ""
    } = req.query;


    let sql = `
      SELECT
        r.id_recomendacion,
        r.id_supervision,
        r.id_hallazgo,
        r.descripcion,
        r.responsable,
        r.fecha_limite,
        r.estado,
        r.activo,

        h.descripcion AS hallazgo,
        h.nivel,

        s.actividad_programada,

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

      FROM recomendaciones r

      INNER JOIN hallazgos h
        ON h.id_hallazgo = r.id_hallazgo

      INNER JOIN supervisiones s
        ON s.id_supervision = r.id_supervision

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

      WHERE r.activo = 1
      AND h.activo = 1
      AND s.activo = 1
    `;


    const params = [];


    if (q) {

      sql += `
        AND (
          r.descripcion LIKE ?
          OR r.responsable LIKE ?
          OR h.descripcion LIKE ?
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
        "Error al listar las recomendaciones"
    });

  }

});


// =====================================
// OBTENER RECOMENDACIÓN
// =====================================

router.get("/:id", async (req, res) => {

  try {

    const [rows] =
      await db.query(
        `
        SELECT
          r.*,
          h.descripcion AS hallazgo,
          h.nivel
        FROM recomendaciones r

        INNER JOIN hallazgos h
          ON h.id_hallazgo = r.id_hallazgo

        WHERE r.id_recomendacion = ?
        `,
        [req.params.id]
      );


    if (!rows.length) {

      return res.status(404).json({
        ok: false,
        mensaje:
          "Recomendación no encontrada"
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
        "Error al consultar la recomendación"
    });

  }

});


// =====================================
// REGISTRAR RECOMENDACIÓN
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
        id_hallazgo,
        descripcion,
        responsable = null,
        fecha_limite = null
      } = req.body;


      if (
        !id_hallazgo ||
        !descripcion ||
        !descripcion.trim()
      ) {

        return res.status(400).json({
          ok: false,
          mensaje:
            "Hallazgo y recomendación son obligatorios"
        });
      }


      // OBTENER SUPERVISIÓN DESDE EL HALLAZGO

      const [hallazgos] =
        await db.query(
          `
          SELECT
            id_hallazgo,
            id_supervision
          FROM hallazgos
          WHERE id_hallazgo = ?
          AND activo = 1
          `,
          [id_hallazgo]
        );


      if (!hallazgos.length) {

        return res.status(400).json({
          ok: false,
          mensaje:
            "El hallazgo seleccionado no es válido"
        });
      }


      const id_supervision =
        hallazgos[0].id_supervision;


      const [result] =
        await db.query(
          `
          INSERT INTO recomendaciones
          (
            id_supervision,
            id_hallazgo,
            descripcion,
            responsable,
            fecha_limite,
            estado
          )
          VALUES (?, ?, ?, ?, ?, 'PENDIENTE')
          `,
          [
            id_supervision,
            id_hallazgo,
            descripcion.trim(),

            responsable &&
            responsable.trim()
              ? responsable.trim()
              : null,

            fecha_limite || null
          ]
        );


      res.status(201).json({
        ok: true,
        mensaje:
          "Recomendación registrada correctamente",
        id_recomendacion:
          result.insertId
      });


    } catch (error) {

      console.error(error);

      res.status(500).json({
        ok: false,
        mensaje:
          "Error al registrar la recomendación"
      });

    }

  }
);


// =====================================
// ACTUALIZAR RECOMENDACIÓN
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
        id_hallazgo,
        descripcion,
        responsable = null,
        fecha_limite = null
      } = req.body;


      if (
        !id_hallazgo ||
        !descripcion ||
        !descripcion.trim()
      ) {

        return res.status(400).json({
          ok: false,
          mensaje:
            "Complete los campos obligatorios"
        });
      }


      const [hallazgos] =
        await db.query(
          `
          SELECT id_supervision
          FROM hallazgos
          WHERE id_hallazgo = ?
          AND activo = 1
          `,
          [id_hallazgo]
        );


      if (!hallazgos.length) {

        return res.status(400).json({
          ok: false,
          mensaje:
            "El hallazgo seleccionado no es válido"
        });
      }


      const [result] =
        await db.query(
          `
          UPDATE recomendaciones
          SET
            id_supervision = ?,
            id_hallazgo = ?,
            descripcion = ?,
            responsable = ?,
            fecha_limite = ?
          WHERE id_recomendacion = ?
          `,
          [
            hallazgos[0].id_supervision,
            id_hallazgo,
            descripcion.trim(),

            responsable &&
            responsable.trim()
              ? responsable.trim()
              : null,

            fecha_limite || null,

            req.params.id
          ]
        );


      if (!result.affectedRows) {

        return res.status(404).json({
          ok: false,
          mensaje:
            "Recomendación no encontrada"
        });
      }


      res.json({
        ok: true,
        mensaje:
          "Recomendación actualizada correctamente"
      });


    } catch (error) {

      console.error(error);

      res.status(500).json({
        ok: false,
        mensaje:
          "Error al actualizar la recomendación"
      });

    }

  }
);


// =====================================
// ACTUALIZAR ESTADO + CREAR SEGUIMIENTO
// Se utilizará principalmente en PASO 21
// =====================================

router.patch(
  "/:id/estado",
  permit(
    "ADMINISTRADOR",
    "SUPERVISOR",
    "TECNICO"
  ),
  async (req, res) => {

    const {
      estado,
      observacion = null
    } = req.body;


    const estadosPermitidos = [
      "PENDIENTE",
      "EN_PROCESO",
      "CUMPLIDO"
    ];


    if (
      !estadosPermitidos.includes(
        estado
      )
    ) {

      return res.status(400).json({
        ok: false,
        mensaje:
          "Estado no válido"
      });
    }


    const conn =
      await db.getConnection();


    try {

      await conn.beginTransaction();


      const [rows] =
        await conn.query(
          `
          SELECT estado
          FROM recomendaciones
          WHERE id_recomendacion = ?
          AND activo = 1
          FOR UPDATE
          `,
          [req.params.id]
        );


      if (!rows.length) {

        await conn.rollback();

        return res.status(404).json({
          ok: false,
          mensaje:
            "Recomendación no encontrada"
        });
      }


      const estadoAnterior =
        rows[0].estado;

        if (estadoAnterior === estado) {

  await conn.rollback();

  return res.status(400).json({
    ok: false,
    mensaje:
      "La recomendación ya se encuentra en ese estado"
  });

}


      await conn.query(
        `
        UPDATE recomendaciones
        SET estado = ?
        WHERE id_recomendacion = ?
        `,
        [
          estado,
          req.params.id
        ]
      );


      await conn.query(
        `
        INSERT INTO seguimientos
        (
          id_recomendacion,
          fecha,
          estado_anterior,
          estado_nuevo,
          observacion,
          id_usuario
        )
        VALUES (?, CURDATE(), ?, ?, ?, ?)
        `,
        [
          req.params.id,
          estadoAnterior,
          estado,
          observacion,
          req.user.id_usuario
        ]
      );


      await conn.commit();


      res.json({
        ok: true,
        mensaje:
          "Estado actualizado correctamente"
      });


    } catch (error) {

      await conn.rollback();

      console.error(error);

      res.status(500).json({
        ok: false,
        mensaje:
          "Error al actualizar el estado"
      });


    } finally {

      conn.release();

    }

  }
);


// =====================================
// DESACTIVAR RECOMENDACIÓN
// =====================================

router.delete(
  "/:id",
  permit("ADMINISTRADOR"),
  async (req, res) => {

    try {

      const [seguimientos] =
        await db.query(
          `
          SELECT id_seguimiento
          FROM seguimientos
          WHERE id_recomendacion = ?
          LIMIT 1
          `,
          [req.params.id]
        );


      if (seguimientos.length) {

        return res.status(409).json({
          ok: false,
          mensaje:
            "No se puede desactivar una recomendación que ya tiene seguimiento registrado"
        });
      }


      const [result] =
        await db.query(
          `
          UPDATE recomendaciones
          SET activo = 0
          WHERE id_recomendacion = ?
          `,
          [req.params.id]
        );


      if (!result.affectedRows) {

        return res.status(404).json({
          ok: false,
          mensaje:
            "Recomendación no encontrada"
        });
      }


      res.json({
        ok: true,
        mensaje:
          "Recomendación desactivada correctamente"
      });


    } catch (error) {

      console.error(error);

      res.status(500).json({
        ok: false,
        mensaje:
          "Error al desactivar la recomendación"
      });

    }

  }
);


module.exports = router;