export const aws_sdk =  {
    ip: process.env.HOST_AWS || '192.168.1.106',
    port : process.env.PORT_AWS || '4566',
    region: process.env.REGION_AWS || 'REGION',
    accessKeyId: process.env.ACCESS_KEY_ID || 'na',
    secretAccessKey: process.env.ACCESS_KEY_SECRET || 'na'
}

export const database = {
    host: process.env.HOST_DB || '192.168.1.106',
    user: process.env.USER_DB || 'root',
    password: process.env.PASSWORD_DB || 'password',
    database: process.env.NAME_DB || 'db'
}

export const sqsConfig = {
    queueName: process.env.INPUT_QUEUE_NAME || 'input_sap',
    awsId: process.env.INPUT_AWS_ID || "000000000000"
}

export const status4 = process.env.INPUT_AWS_ID || "LISTO PARA FACTURAR";