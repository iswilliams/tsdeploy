"use strict";
/* utils */
var JSONValidation = require('json-validation').JSONValidation;

const validarImputControlGuardia = (datos: JSON) => {
    var jv = new JSONValidation();
    var schema = {
        type: "object",
        properties: {
            fechaHora: { type: "string", required: true },
            idTransporte: { type: "string", required: true },
            estadoTransporte: { type: "string", required: true }
        }
    };
    return jv.validate(datos, schema);

}

export { validarImputControlGuardia }