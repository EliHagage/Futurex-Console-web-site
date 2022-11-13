require('./config.js')
require('./server.js')

process.on("uncaughtException", (err) => {
    console.log('**************')
    console.log('EXCEPTION CATCHED')
    console.log('**************')
    console.log(err);
});


global["server"].listen(global["port"], () => {
    console.log(`Server run ons Port: ${global["port"]}`)
})

process.on("unhandleRejection", (err) => {
    console.log('**************')
    console.log('REJECTION CATCHED')
    console.log('**************')
    console.log(err);
});