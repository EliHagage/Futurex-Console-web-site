const schedule = require('node-schedule');
const utils = require(`${global["homedir"]}\\utils.js`)
const {BattleNode} = require('./bnode.js');
const be = BattleNode;


global["schedules"] = {};

const createSchedulerDatabase = async () => {
    return new Promise((resolve,reject) => {
        utils.createServerWebControlRconSchedulerTable().then(_ => {
            resolve(true);
        }).catch(e => { reject(e)});
    })
}

const createNewSchedulerTask = async (tokenId,hours) => {
    return new Promise((resolve,reject) => {
        utils.insertNewServerWebControlRconSchedulerByHours(tokenId,hours).then(_ => {
            resolve(true);
        }).catch(e => { reject(e)});
    })
}

const updateSchedulerTaskById = async () => {
    
}

const deleteSchedulerTaskById = async (id) => {
    return new Promise((resolve,reject) => {
        utils.deleteNewServerWebControlRconSchedulerById(id).then(_ => {
            resolve(true);
        }).catch(e => { reject(e)});
    })
}

const runSchedulerTasks = async () => {

    let handlers = function(bnode, task) {
   
        bnode.on('disconnected', function(err, success) {

            console.log(`disconnected from rcon...`)

            bnode.connected = false;
               
        });
    }

    let connect = function(bnode, task) {
        return new Promise((resolve,reject) => {
            bnode.on('login', function(err, success) {
        
                if (err) { 
                    console.log(`Unable to connect to server... ${bnode.config.ip}:${bnode.config.port}`);
                    bnode.connected = false;
                    return reject(err)
                }

                if (success == true) {
                    console.log('Logged in RCON successfully.');
                    bnode.connected = true;
                    handlers(bnode,task)
                    return resolve(bnode)
                }
                else if (success == false) {
                    console.log('RCON login failed! (password may be incorrect)');
                    bnode.connected = false;
                    return reject(success)
                }
                        
            });

            bnode.login();
        })
    }

    let sendCmd = function(bnode,cmd) {
        try {
            setTimeout(function() {
                console.log('sending command to rcon.. '+cmd)
                bnode.sendCommand(cmd, function(_) {console.log(_)});
            }, 1000);
        } catch (error) {
            console.log(error)
        }
    }

    let kickAllPlayers = function(bnode) {
        try {
            setTimeout(function() {
                bnode.sendCommand('Players', function(data) {
                    // get players id and kick
                    let dataArray = [
                        ...data.matchAll(/(\d+)\s+(\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}):(\d+\b)\s+(\d+)\s+([0-9a-fA-F]+)\(\w+\)\s([\S ]+)$/gim),
                    ].map((e) => e.splice(1, e.length - 1));
                    dataArray.map((e) => {
                        let name = e[5];
                        if (name.includes(' (Lobby)')) {
                            e[5] = name.replace(' (Lobby)', '');
                            e[6] = true;
                        } else {
                            e[6] = false;
                        }
                    });
                   

                    for (let p = 0; p < dataArray.length; p++) {
                        const element = dataArray[p];
                        sendCmd(bnode, `kick ${element[0]} ${'You have been kicked! Server is restarting in 2 minutes.'}`)
                    }
                });
            }, 1000);
        } catch (error) {
            console.log(error)
        }
    }
    return new Promise((resolve,reject) => {
        utils.__selectServerWebControlRconSchedulers().then(schedulers => {

            schedulers.forEach(task => {
                try {
                    console.log(!global["schedules"].hasOwnProperty(task.id))
                    if (!global["schedules"].hasOwnProperty(task.id)) {
                        global["schedules"][task.id] = {};
                        global["schedules"][task.id]["task"] = task;
                     

                        let shutdown = `0 */${task.restartIntervalAtHours} * * *`;

                       /*

                        global["schedules"][task.id]["task"]["shutdown"] = schedule.scheduleJob(shutdown, function(task){
                            console.log('shutdown scheduler execute time at: ' + new Date().toISOString())
                            utils.selectServerWebControlByTokenId(task.tokenId).then(servers => {

                                var config = {
                                    ip: servers[0].rcon_host,
                                    port: servers[0].rcon_port,
                                    rconPassword: servers[0].rcon_password,
                                };
                                var bnode = null;
                                var  t = null;

                                if (global["schedules"][task.id]["task"].hasOwnProperty('bnode')) {
                                    bnode = global["schedules"][task.id]["task"]["bnode"];

                                    if (bnode.connected) {
                                        sendCmd(bnode, '#shutdown');
                                    } else {
                                        delete global["schedules"][task.id]["task"]["bnode"];
                                    }
                                    
                                } else {
                                    global["schedules"][task.id]["task"]["bnode"] = new be(config);
                                    bnode = global["schedules"][task.id]["task"]["bnode"];
                                    
                                    connect(bnode,task).then(bn => {
                                        
                                        sendCmd(bnode, '#shutdown');
                                    }).catch(e => {
                                        delete global["schedules"][task.id]["task"]["bnode"];
                                    })
                                };

                               
                            }).catch(err => {console.log(err)})
                        
                        }.bind(null,task));
                        */
                        
                        let message = null;
                        
                        if (Number(task.restartIntervalAtHours) > 1) {
                            message = `45/1 */${Number(task.restartIntervalAtHours) - 1} * * *`;
                        } else {
                            
                            message = `45/1 * * * *`;
                        }
                        
                        global["schedules"][task.id]["task"]["message"] = schedule.scheduleJob(message, function(task){
                            
                            utils.selectServerWebControlByTokenId(task.tokenId).then(servers => {
                                let minutes = new Date().getMinutes();
                                minutes = 60 - minutes;
                                var config = {
                                    ip: servers[0].rcon_host,
                                    port: servers[0].rcon_port,
                                    rconPassword: servers[0].rcon_password,
                                };
                                var bnode = null;
                                var  t = null;

                                // check sql for server by token id if a custo mrestart runs
                                // if a custo restart is active then dont send any restart messages from scheduler
                                // else keep going

                                if (global["schedules"][task.id]["task"].hasOwnProperty('bnode')) {
                                    bnode = global["schedules"][task.id]["task"]["bnode"];

                                    if (bnode.connected) {
                                        sendCmd(bnode, 'say -1 restart in minutes..'+minutes);
                                        if (minutes == 5) {
                                            sendCmd(bnode, 'say -1 Server will be locked in 3 minutes...');
                                            sendCmd(bnode, 'say -1 Server is schedules for the next restart. You will be kicked in 3 minutes...');
                                        }

                                        if (minutes == 2) {
                                            sendCmd(bnode, 'say -1 Server is now locked!');
                                            sendCmd(bnode, '#lock');

                                            // kick all palyers..
                                            kickAllPlayers(bnode);
                                        }

                                        if (minutes == 1) {
                                            sendCmd(bnode, '#shutdown');
                                        }

                                    } else {
                                        delete global["schedules"][task.id]["task"]["bnode"];
                                    }
                                    
                                } else {
                                    global["schedules"][task.id]["task"]["bnode"] = new be(config);
                                    bnode = global["schedules"][task.id]["task"]["bnode"];
                                    
                                    connect(bnode,task).then(bn => {
                                        
                                        if (minutes == 5) {
                                            sendCmd(bnode, 'say -1 Server will be locked in 3 minutes...');
                                            sendCmd(bnode, 'say -1 Server is schedules for the next restart. You will be kicked in 3 minutes...');
                                        }

                                        if (minutes == 2) {
                                            sendCmd(bnode, 'say -1 Server is now locked!');
                                            sendCmd(bnode, '#lock');

                                            // kick all palyers..
                                            kickAllPlayers(bnode);
                                        }

                                        sendCmd(bnode, 'say -1 restart in minutes..'+minutes);
                                    }).catch(e => {
                                        delete global["schedules"][task.id]["task"]["bnode"];
                                    })
                                };
                            }).catch(err => {console.log(err)})
                                
                        }.bind(null,task));
                        
                        let lock = null;
                        
                        if (Number(task.restartIntervalAtHours) > 1) {
                            lock = `5/1 */${Number(task.restartIntervalAtHours) - 1} * * *`;
                        } else {
                            
                            lock = `5/1 * * * *`;
                        }
                        
                        /*
                        global["schedules"][task.id]["task"]["lock"] = schedule.scheduleJob(lock, function(task){
                            
                            utils.selectServerWebControlByTokenId(task.tokenId).then(servers => {
                                
                                var config = {
                                    ip: servers[0].rcon_host,
                                    port: servers[0].rcon_port,
                                    rconPassword: servers[0].rcon_password,
                                };
                                var bnode = null;
                                var  t = null;

                                if (global["schedules"][task.id]["task"].hasOwnProperty('bnode')) {
                                    bnode = global["schedules"][task.id]["task"]["bnode"];

                                    if (bnode.connected) {
                                        sendCmd(bnode, 'say -1 Server is now locked!');
                                        sendCmd(bnode, '#lock');
                                    } else {
                                        delete global["schedules"][task.id]["task"]["bnode"];
                                    }
                                    
                                } else {
                                    global["schedules"][task.id]["task"]["bnode"] = new be(config);
                                    bnode = global["schedules"][task.id]["task"]["bnode"];
                                    
                                    connect(bnode,task).then(bn => {
                                        sendCmd(bnode, 'say -1 Server is now locked!');
                                        sendCmd(bnode, '#lock');
                                    }).catch(e => {
                                        delete global["schedules"][task.id]["task"]["bnode"];
                                    })
                                };

                            }).catch(err => {console.log(err)})
                                
                        }.bind(null,task));
                        */
                        
                        let kick = `*/58 */${task.restartIntervalAtHours - 1} * * *`; // test for every second after 45 seconds ahead
                        /*
                        global["schedules"][task.id]["task"]["kick"] = schedule.scheduleJob(kick, function(task){
                            
                            utils.selectServerWebControlByTokenId(task.tokenId).then(servers => {
                                let seconds = new Date().getSeconds();
                                seconds = 60 - seconds;
                                var config = {
                                    ip: servers[0].rcon_host,
                                    port: servers[0].rcon_port,
                                    rconPassword: servers[0].rcon_password,
                                };
                                var bnode = null;
                                var  t = null;

                                if (global["schedules"][task.id]["task"].hasOwnProperty('bnode')) {
                                    bnode = global["schedules"][task.id]["task"]["bnode"];

                                    if (bnode.connected) {
                                        kickAllPlayers(bnode);
                                    } else {
                                        delete global["schedules"][task.id]["task"]["bnode"];
                                    }
                                    
                                } else {
                                    global["schedules"][task.id]["task"]["bnode"] = new be(config);
                                    bnode = global["schedules"][task.id]["task"]["bnode"];
                                    
                                    connect(bnode,task).then(bn => {
                                        
                                        kickAllPlayers(bnode);
                                    }).catch(e => {
                                        delete global["schedules"][task.id]["task"]["bnode"];
                                    })
                                };

                                if (global["schedules"][task.id]["task"].hasOwnProperty('bnode')) {
                                    bnode = global["schedules"][task.id]["task"]["bnode"];
                                    kickAllPlayers(bnode);
                                }
                            }).catch(err => {console.log(err)})
                                
                        }.bind(null,task));
                        */
                        

                        resolve(`[+] Task with ID ${task.id} started!`)
                    } else {
                        console.log(`[!] Task with ID ${task.id} already exist!`)
                    }
                } catch (error) {
                    reject(error)
                }
            });

        }).catch(err => {reject(err)})
    })
}



module.exports = {
    createSchedulerDatabase,
    createNewSchedulerTask,
    updateSchedulerTaskById,
    deleteSchedulerTaskById,
    runSchedulerTasks
}