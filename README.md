# TPE-MS-Transporte

##Microservicio correspondiente control guardia, inicio de carga y carga listo para facturar

El microservicio procesa un objeto tipo json con la siguiente estructura:
```
{ 
    "fechaHora": "2021-03-08T09:12:28Z", 
    "idTransporte": "123", 
    "estadoTransporte": "EN REPARTO" 
}
```
Donde estadoTransporte corresponde al status control guardia, inicio de carga o carga listo para facturar.

Este json llega a la cola de inicio del proceso llamada control_guardia y luego de ser procesasado envia un mensaje a la cola input_sap para notificar el cambio del proceso control guardia, el cual internamente actualiza el estado del trasporte a "EN REPARTO", "EN PROCESO" o "LISTO PARA FACTURAR" y envia a la cola el estado correspondiente de SAP.

En caso exitoso para los casos de control guardia e inicio de carga retorna un objeto con la siguiente estructura:
```
{
  "code": 0,
  "type": "string",
  "message": "string",
  "payload": {
      "idTransporte": "string", 
      "estadoTransporte": "string",
      "idSap": "number"
  }
}
```

En caso exitoso para el caso carga listo para facturar retorna un objeto con la siguiente estructura:
```
{
  "code": 0,
  "type": "string",
  "message": "string",
  "payload": {
      "idTransporte": "string", 
      "estadoTransporte": "string",
      "idSap": "number",
      "pallet": []
  }
}
```

### Pasos que ejecuta la funcionalidad:

##### 1. Recibe un mensaje de la cola control_guardia con el formato especificado.
##### 2. Obtiene el estado especificado en mensaje, en este caso EN REPARTO.
##### 3. Valida la existencia del transporte y si este ya se encuentra con el estado especificado.
##### 4. Registra la modificación correspondiente en la tabla de modificaciones del transporte donde se indica el estado al cual fue modificado.
##### 5. Genera un evento a la cola input_sap con la siguiente respuesta:
```
    {
        code: 200,
        type: "Control Guardia",
        message: "Control Guardia OK",
        payload: { 
            "fechaHora": "2021-03-08T09:12:28Z", 
            "idTransporte": "123", 
            "idSap": 6,
            "estadoTransporte": "INICIO DEL TRANSPORTE" 
        }
    }
```