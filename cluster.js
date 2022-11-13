
const cluster = require("cluster");
const os = require("os");


if(cluster.isMaster)
{
	const cpus = os.cpus().length;

	console.log(`[+] Taking advantage of ${cpus} CPUs`);

	for(let i = 0; i < cpus; i++)
	{
		cluster.fork();
	};

	console.dir(cluster.workers, {depth: 0});

	process.stdin.on("data", (data) => 
	{
		initControlCommands(data);
	});

	cluster.on("exit", (worker, code) => 
	{
		if(code != 0 && !worker.exitAfterDisconnect)
		{
			console.log(`\x1b[34m[+] Worker ${worker.process.pid} crashed.\nStarting a new worker...\n\x1b[0m`);
			const nw = cluster.fork();
			console.log(`\x1b[34m[+] Worker ${nw.process.pid} will replace him \x1b[0m`);
		}
	});

	console.log(`[+] Master PID: ${process.pid}`);

	console.log(`[+] SCHEDULER RUNS ON PID: ${process.pid}`);

	require('./config.js')
	const { 
		runSchedulerTasks
	} = require('./jobs.js');
	
	runSchedulerTasks().then(_ => { console.log(_) }).catch( e => {console.log(e)})    

}
else 
{
	require('./app.js');	
}



const initControlCommands = (dataAsBuffer =>
{
	let wcounter = 0;

	const data = dataAsBuffer.toString().trim();

	if(data === "lsw")
	{
		Object.values(cluster.workers).forEach(worker =>
		{
			wcounter++;

			console.log(`\x1b[32m[+] ALIVE: Worker with PID: ${worker.process.pid}\x1b[0m`);
		})
		console.log(`\x1b[32m[+] Total of ${wcounter} living workers.\x1b[0m`);

		return;
	};

	if(data === "-help")
	{
		console.log('[+] lsw -> list workers\n[+] kill :pid -> kill worker\n[+] restart :pid -> restart worker\n[+] cw -> create worker');

		return;
	};

	if(data === "cw")
	{
		const newWorker = cluster.fork();

		console.log(`[+] Created new worker with PID ${newWorker.process.pid}`);

		return;
	};

	const commandArray = data.split(' ');

	let command = commandArray[0];

	if(command === "kill")
	{
		const filteredArr = Object.values(cluster.workers).filter((worker) => worker.process.pid === parseInt(commandArray[1]));

		if(filteredArr.length === 1)
		{
			filteredArr[0].kill("SIGTERM");
			console.log(`\x1b[31m[+] Killed worker ${filteredArr[0].process.pid} .\x1b[0m`);
		} 
		else
		{
			console.log(`\x1b[31m[+] Worker with PID ${commandArray[1]} does not found. Are you sure this is the PID?\x1b[0m`);
		}

		return;
		
	};

	if(command === "restart")
	{
		const filteredArr = Object.values(cluster.workers).filter((worker) => worker.process.pid === parseInt(commandArray[1]));

		if(filteredArr.length === 1)
		{
			console.log(`\x1b[31m[+] Worker ${filteredArr[0].process.pid} restarting\x1b[0m`);
			
			filteredArr[0].disconnect();

			const nw = cluster.fork();

			console.log(`\x1b[32m[+] Worker is up with new PID ${nw.process.pid}. \x1b[0m`);
		}
		else
		{
			console.log(`\x1b[31m[+] Worker with PID ${commandArray[1]} does not found. Are you sure this is the PID?\x1b[0m`);
		}

		return;
	};

	return console.log('[!] unknown command -> -help to get all available commands');
})

