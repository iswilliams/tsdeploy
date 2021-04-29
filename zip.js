var fs = require('fs');
var archiver = require('archiver');
const DIRECTORIO_RAIZ = process.cwd();

//Elimina el archivo si existe
//fs.unlinkSync('./mstransporte.zip');
//console.log('Archivo Eliminado');


console.log("Zipeando archivos");
var output = fs.createWriteStream('controlGuardia.zip');
var archive = archiver('zip');

output.on('close', function () {
    console.log(archive.pointer() + ' total bytes');
    console.log('archiver has been finalized and the output file descriptor has closed.');
});

archive.on('error', function(err){
    throw err;
});

archive.pipe(output);

archive.directory(DIRECTORIO_RAIZ+"/dist", false);

archive.directory('subdir/', 'new-subdir');

archive.finalize();