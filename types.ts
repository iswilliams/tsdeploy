/***
 * Estado del transporte
 * Atributes:
 * estado_transporte: 0=activo, 1=cancelado
***/
class EstadoTransporte { fk_estado: number }

/***
 * Transporte
 * Atributes:
 * id_transporte: Identificador del transporte
 * numero_transporte: Numero del transporte
 * camion_transporte: Camion del trasporte
 * estado_transporte: Estado del transporte, 0=activo, 1=cancelado
***/
class  Transporte {
    id_transporte: number;
    numero_transporte: string;
    tipo_transporte: string;
    estado_transporte: number;
}

/***
 * Estado
 * Atributes:
 * id_estado: Identificador del estado
 * nombre_estado: Nomre del estado
 * descripcion_estado: Descripcion del estado
 * tipo_estado: tipo de estado
***/
class  Estado {
    id_estado: number;
    nombre_estado: string;
    id_estado_sap: number;
    nombre_estado_sap: string;
}

/**
 * Objeto de respuesta al insertar/actualizar en mysql
 */
class ResponseMysql {
        fieldCount: number;
        affectedRows: number;
        insertId: number;
        serverStatus: number;
        warningCount: number;
        message: string;
        protocol41: boolean;
        changedRows: number;
}

/**
 * Mensaje de respuesta la cola imput de sap
 */
class Response {
    code: number;
    type: string;
    message: string;
    payload: {};
  };

/**
 * Informacion pallet para respuesta a expedicionario tras confirmacion del ultimo pallet
 */
 class PalletResponse {
    id_pallet_transporte: String;
    horaInicioExp: Date;
    horaFinExp: Date;
    chequeador: String;
    status_final: String;
  };


export { EstadoTransporte,
    Transporte,
    Estado,
    ResponseMysql,
    Response,
    PalletResponse
 };