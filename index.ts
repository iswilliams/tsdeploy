//import { SQSEvent } from 'aws-lambda';

import {
    getTransporte,
    getEstado,
    insertHistoryTransporte,
    getInfoPallet,
} from './sqlController';
import { execRetrySQS } from "./sqsController";
import { Response, Estado, Transporte, PalletResponse } from "./types";
import { validarImputControlGuardia } from "./imputValidation";
import { status4 } from "./config";

const handler = async (event: any, context: any) => {
    try {

        let response = new Response();
        for (
            let indexRecords = 0;
            indexRecords < event.Records.length;
            indexRecords++
        ) {
            const { body } = event.Records[indexRecords];
            let jsonInput = JSON.parse(body);
            //console.info("json obtenido -> ", jsonInput);
            var isValid = validarImputControlGuardia(jsonInput);
            if (!isValid.ok) {
                console.info("Input no contiene un formato válido");
                throw new Error("Input no contiene un formato válido");
            }

            /* Se comprueba si el estado a cambiar es de estatus 4
            */
            var isStatus4 = (jsonInput.estadoTransporte).toUpperCase() === status4.toUpperCase();

            //***********
            //Procesa funcionalidad
            //***********
            try {
                // obtener el estado por el nombre indicado desde el mensaje
                let estado_result = new Estado();
                estado_result = await getEstado(jsonInput.estadoTransporte);

                //busca transporte en bd
                const transporte_result: Transporte = await getTransporte(jsonInput.idTransporte, estado_result.id_estado);

                //insertar en la tabla Modificacion_Pallet el estado 'en reparto'
                await insertHistoryTransporte(
                    jsonInput.fechaHora,
                    "SI",
                    transporte_result.id_transporte,
                    estado_result.id_estado
                );

                //si el estado corresponde a status 4 se recopila info de los pallets
                if (isStatus4) {
                    let pallets: PalletResponse[] = await getInfoPallet(transporte_result.id_transporte);
                    const payload = {idTransporte: jsonInput.idTransporte,
                        idSap: estado_result.id_estado_sap,
                        estadoTransporte: estado_result.nombre_estado_sap,
                        pallet: pallets
                    };
                    response.payload = payload;
                } else {
                    //Datos para cola SAP
                    jsonInput.idSap = estado_result.id_estado_sap;
                    jsonInput.estadoTransporte = estado_result.nombre_estado_sap;
                    response.payload = jsonInput;
                }
                // let pallet: Pallet = 

                //notificar a la cola correspondiente
                response.code = 200;
                response.type = estado_result.nombre_estado;
                response.message = estado_result.nombre_estado + " OK";
                //console.info("mensaje-->", response);
                await execRetrySQS(response);

            } catch (err) {
                console.info(err);
            }
        }
        context.succeed("Successfully added message to queue", null);
    } catch (err) {
        console.info(err);
        context.fail("Error ", err);
    }
};

export { handler }