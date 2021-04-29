import mysql = require('mysql');

import { database } from "./config";
import {
  EstadoTransporte,
  Transporte,
  Estado,
  ResponseMysql,
  PalletResponse
} from "./types";

const MAX_RETRY = process.env.MAX_RETRY || 1;
//const sysdate = new Date().toISOString().slice(0, 19).replace("T", " ");

// Configuración de base de datos
const connection = mysql.createConnection({
  host: database.host,
  user: database.user,
  password: database.password,
  database: database.database,
});

function executeAsyncQuery(sql: string, params: number): Promise<any> {
  return new Promise((resolve, reject) => {
    connection.query(sql, params, (err, results) => {
      if (err) {
        console.info(err);
        reject(err);
      }
      //console.log("-----Query Done!");
      resolve(results);
    });
  });
}

const isEqualsStatus = async (idTransporte: number, idStatus: number) => {
  let sql = `SELECT fk_estado 
  FROM Modificacion_Transporte
  WHERE fk_transporte = ${idTransporte}
  AND fk_estado = ${idStatus}
  ORDER BY fecha_modificacion_transporte DESC`;

  //console.log(sql);
  const estado_result: EstadoTransporte[] = await executeAsyncQuery(sql, 0);
  //console.info("Modificacion transporte -> ", estado_result);

  //return estado_result && estado_result.length > 0 ? estado_result[0].estado_transporte == idStatus : false;
  return estado_result && estado_result.length > 0 ? estado_result[0].fk_estado != undefined : false;
};

const getTransporte = async (numeroTransporte: string, idEstado: number) => {
  let currentRetry = 1;
  while (currentRetry <= MAX_RETRY) {
    try {
      currentRetry++;
      const sql_transporte = `SELECT max(id_transporte) as id_transporte,
      numero_transporte,
      tipo_transporte,
      estado_transporte
      FROM Transporte
      WHERE numero_transporte = '${numeroTransporte}'
      GROUP BY
      id_transporte,
      numero_transporte,
      tipo_transporte,
      estado_transporte`;

      const transporte_result: Transporte[] = await executeAsyncQuery(sql_transporte, 0);
      //console.log("trsnportes -> ", pallets_result.length);

      //arrojar error si no encuentra transporte
      if (transporte_result == undefined || transporte_result.length < 1) {
        console.info(
          "error: El transporte indicado no se encuentra en nuestros registros"
        );
        throw new Error("Conflict: El transporte no fue encontrado. ");
      } else if (transporte_result[0].estado_transporte == 0) {
        //arrojar error en caso de transporte se encuentra anulado
        console.info("error: El transporte indicado se encuentra anulado");
        throw new Error("Error: El transporte indicado se encuentra anulado. ");
      } else {
        var isInReparto: boolean = await isEqualsStatus(transporte_result[0].id_transporte, idEstado);
        if (isInReparto) {
          //arrojar error en caso de transporte se encuentre en reparto
          console.info("error: El transporte indicado ya se encuentra en reparto");
          throw new Error("Error: El transporte indicado ya se encuentra en reparto. ");
        }
      }

      return transporte_result[0];
    } catch (err) {
      // Pintar informacion a cloudwatch
      console.info("Failed getting transporte: Retry N°" + (currentRetry - 1));
    }
  }
  throw new Error("Too many retries...");
};

const getEstado = async (nombreEstado: string) => {
  let currentRetry = 1;
  while (currentRetry <= MAX_RETRY) {
    try {
      currentRetry++;
      let sql_estado_pallet = `SELECT id_estado,
          nombre_estado,
          id_estado_sap,
          nombre_estado_sap
          FROM Estado
          WHERE UPPER(nombre_estado) = UPPER('${nombreEstado.toUpperCase()}') limit 1`;

      //console.log(sql_estado_pallet);
      const estado_result: Estado[] = await executeAsyncQuery(sql_estado_pallet, 0);
      //console.log("estado palet -> ", estado_result);

      if (estado_result == undefined || estado_result.length < 1) {
        console.info(
          "Conflict: No se encuentra el estado indicado en los registros"
        );
        //retornar error
        throw new Error(
          "Conflict: No se encuentra el estado indicado en los registros"
        );
      }

      return estado_result[0];
    } catch (err) {
      // Pintar informacion a cloudwatch
      console.info(
        "Failed getting Guard Control status: Retry N°" + (currentRetry - 1)
      );
    }
  }
  throw new Error("Too many retries...");
};

const insertHistoryTransporte = async (date: string, origin: string, idTransporte: number, idEstado: number) => {
  let currentRetry = 1;
  while (currentRetry <= MAX_RETRY) {
    try {
      currentRetry++;
      const sql_insert_historyTransport = `INSERT INTO db.Modificacion_Transporte
      (fecha_modificacion_transporte,
      detalle_modificacion_transporte,
      origen_modificacion_transporte,
      tipo_modificacion_transporte,
      fk_transporte,
      fk_estado)
      VALUES
      ('${date.slice(0, 19).replace("T", " ")}',
      'Actualización de estado',
      '${origin}',
      'ESTADO',
      ${idTransporte},
      ${idEstado})`;

      const insert_result: ResponseMysql = await executeAsyncQuery(sql_insert_historyTransport, 0);
      //console.log("insert modificaciones transporte -> ", insert_result.insertId);

      if (insert_result == undefined || insert_result.insertId == 0) {
        console.info("Conflict: No se pudo actualizar el estado del transporte");
        //retornar error
        throw new Error("Conflict: No se pudo actualizar el estado del transporte");
      }
      return true;
    } catch (err) {
      // Pintar informacion a cloudwatch
      console.info(
        "Failed inserting transporte modification: Retry N°" + (currentRetry - 1),
        err
      );
    }
  }
  throw new Error("Too many retries...");
};


const getInfoPallet = async (idTransporte: number) => {
  let currentRetry = 1;
  while (currentRetry <= MAX_RETRY) {
    try {
      currentRetry++;
      const sqlInfoPallet = `SELECT PT.id_pallet_transporte,
      (CASE
          WHEN OE.fecha_inicio_operador_expedicionario IS NULL THEN PT.fecha_fin_pallet
          ELSE OE.fecha_inicio_operador_expedicionario
      END) horaInicioExp,
      (CASE
          WHEN OE.fecha_fin_operador_expedicionario IS NULL THEN PT.fecha_fin_pallet
          ELSE OE.fecha_fin_operador_expedicionario
      END) horaFinExp,
      (CASE
          WHEN (P.nombre_persona IS NULL AND P.apellido_persona IS NULL) THEN 'APOLOEXPED'
          ELSE P.nombre_persona || ' ' || P.apellido_persona
      END) chequeador,
      PT.tipo_pallet,
      (CASE
          WHEN (SUM(PC.cantidad_producto_sap) = SUM(PC.cantidad_producto_picking)) THEN 'C'
          ELSE 'D'
      END) status_final,
      SUM(PC.cantidad_producto_sap) cantidad_sap,
      SUM(PC.cantidad_producto_picking) cantidad_picking
      FROM  Transporte T
      INNER JOIN Pallet_Transporte PT ON T.id_transporte = PT.fk_transporte
      INNER JOIN Capa C ON C.fk_pallet_transporte = PT.id_pallet_transporte
      INNER JOIN Producto_Capa PC ON PC.fk_capa = C.id_capa
      LEFT JOIN Operador_Expedicionario OE ON PT.id_pallet_transporte = OE.fk_pallet_transporte
      LEFT JOIN Operador_Sesion OS ON OE.fk_operador_sesion = OS.id_operador_sesion
      LEFT JOIN Persona_Rol PR ON OS.fk_persona_rol = PR.id_persona_rol
      LEFT JOIN Persona P ON PR.fk_persona = P.id_persona
      AND P.fk_cd = T.fk_cd
      where PT.estado_pallet = 1
        AND C.estado_capa = 1
        AND PC.estado_producto = 1
        AND T.id_transporte = ${idTransporte}
      group by PT.id_pallet_transporte,
      horaInicioExp,
      PT.tipo_pallet,
      horaFinExp,
      nombre,
      tipo_pallet`;

      const select_result: PalletResponse[] = await executeAsyncQuery(sqlInfoPallet, 0);
      //console.log("Info pallets -> ", select_result);

      if (select_result == undefined || select_result.length == 0) {
        console.info("Conflict: No encontro la información de los pallet asociados al transporte");
        //retornar error
        throw new Error("Conflict: No encontro la información de los pallet asociados al transporte.");
      }
      return select_result;
    } catch (err) {
      // Pintar informacion a cloudwatch
      console.info(
        "Failed find pallet info: Retry N°" + (currentRetry - 1),
        err
      );
    }
  }
  throw new Error("Too many retries...");
};

export {
  getTransporte,
  getEstado,
  insertHistoryTransporte,
  getInfoPallet,
};
