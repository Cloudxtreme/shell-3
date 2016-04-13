var env = {
	osName: 'jsTerm',
	host: 'localhost',
	user: 'root',
	version: '0.1.4'
};

var commands = {

	// --- Base ---

	clear: {
		action: function(args) {
			core.clearOutput();
		},
		description: "Clears the output"
	},

	echo: {
		action: function(args) {
            args.shift();
            var outputString = args.join(' ');
			core.output(outputString);
		},
		description: "Writes string to the standard output"
	},

	man: {
		action: function(args) {
			if (commands[args[1]]) {
                if (commands[args[1]].man) {
                    $.each(commands[args[1]].man, function(i, obj) { core.output(obj); });
                } else {
                    core.output(commands[args[1]].description);
                }
            } else {
				core.output("Specified command not found");
			}
		},
		description: "Echos the description or, if available, the manual of the given command"
	},

	uname: {
		action: function(args) {
			var output = env.osName,
				input = utility.parseFlags(args);

			if (input.flags['a'])  output = env.osName + ' ' + env.host + ' ' + env.version + ' ' + env.user + ' ' + utility.currentDate()
			else if (input.flags['host']) output = navigator.userAgent || navigator.appVersion || 'Host not detected';

			core.output(output);
		},
		description: "Print operating system name"
	},

    help: {
        action: function(args) {
            core.output('Available commands:');
            $.each(commands, function(i, obj) {
                core.output(i + ' - ' + obj.description);
            });
        },
        description: "Lists all commands with descriptions"
    },

	// --- File System ---

	ls: {
		action: function(args) {

			var input = utility.parseFlags(args),
				foundArray = filesystem.readDir(input.vals[0]),
				output = "";

			foundArray.unshift({name:".",type:"folder"},{name:"..",type:"folder"});

			$.each(foundArray, function(i, obj) {
				if (obj.name.substring(0,1) === "." && !input.flags["a"]) return true;

				if (input.flags["l"]) {
					var directoryFlag = (obj.type === "folder") ? "d" : "-";
					output += directoryFlag + 'rwxr-xr-x 1 root ' + obj.name + ' \n';
				} else {
					output += obj.name + ' ';
				}
				
			});

			core.output(output);

		},
		description: "List directory contents"
	},

	cd: {
		action: function(args) {
            if (args[1] === ".") return true;
			var navDirAnswer = filesystem.navigateDir(args[1]);
			if (!navDirAnswer) core.output(args[1] + ': no such directory');
		},
		description: "Navigate to directory"
	},

	cat: {
		action: function(args) {
            if (!args[1]) core.output('usage: cat <directory>');
            else {
                var fileContent = filesystem.readFile(args[1]);
                if (fileContent !== false) core.output(fileContent);
                else core.output(args[1] + ': no such file');
            }
		},
		description: "Echo content of file"
	},

	mkdir: {
		action: function(args) {
			if(!args[1]) core.output('usage: mkdir <directory>');
			else {
				var answer = filesystem.createDir(args[1]);
				if(!answer) core.output(args[1] + ': Folder exists');
			}
		},
		description: 'Create a folder with the specified name'
	},

	touch: {
		action: function(args) {
			if(!args[1]) core.output('usage: touch <directory>');
			else {
				var answer = filesystem.createFile(args[1]);
				if(!answer) core.output(args[1] + ': File exists');
			}
		},
		description: 'Create a file with the specified name'
	},

	rm: {
		action: function(args) {
			if(!args[1]) core.output('usage: rm <directory>');
			else {
				var answer = filesystem.removeEntity(args[1]);
				if (answer === false) core.output(args[1] + ': no such file or directory');
			}
		},
		description: 'Remove a given file or folder'
	},

	push: {
		action: function(args) {
			if(args[1] && args[2]) {
				var answer = filesystem.writeFile(args[1], args[2]);
				if (answer === false) core.output(args[1] + ': no such file or directory');
			} else {
				core.output('usage: push <file> <content>');
			}
		},
		description: "Overwrite content of file"
	},

	//TODO: Write to files with echo and a simple editor

	// --- Meta ---

	lstore: {
		action: function(args) {

			var input = utility.parseFlags(args);

			if (input.flags['read'] || input.flags['r']) {
				var readObject = localStorage.getItem('filesystem');
				if (readObject) {
                    var byteSize = utility.bytesToSize(utility.getByteCount(readObject));
					filesystem.home = JSON.parse(readObject);
					if (!input.flags['s']) core.output('Disk loaded  (' + byteSize + ')');
				} else {
					if (!input.flags['s']) core.output('No backup found');
				}
			} else if (input.flags['write'] || input.flags['w']) {
				localStorage.setItem('filesystem', JSON.stringify(filesystem.home));
				if (!input.flags['s']) core.output('Written to localstorage');
			} else if (input.flags['help'] || input.flags['h']) {
                core.runCommand(['man', 'lstore']);
            } else {
				core.output('help page: lstore --help');
			}
		},
		description: 'Backup or load the Disk',
        man: [
            "lstore 0.1",
            "Backup or load the Disk",
            "Usage:",
            "$ lstore -r|--read",
            "Load Disk from localstorage",
            "$ lstore -w|--write",
            "Write Disk to localstorage",
            "$ lstore -h|--help",
            "Display this page",
            "Flags:",
            "-s : Silent (no output)"
        ]
	},

    // --- Custom ---

    nt: {
        action: function(args) {
            if (!args[1]) {
            	core.output('help page: nt --help');
            	return;
            }

        	var input = utility.parseFlags(args);

            if (input.flags['w']) {
                if (!input.vals[2]) core.output('usage: nt -w <group> <name> <url>');
                else {
                    var favObj = filesystem.readReqFile('fav', true);

                    utility.setValue(favObj, input.vals[0] + '.' + input.vals[1], input.vals[2]);

                    filesystem.writeReqFile('fav', favObj);
                    core.output(input.vals[0] + ' - ' + input.vals[1] + ': written to /req/fav.rf');
                    core.runCommand(['lstore', '-ws']);

                }
            } else if (input.flags['r']) {
                if (!input.vals[1]) core.output('usage: nt -r <group> <name>');
                else {
                    var favObj = filesystem.readReqFile('fav', true);

                    if (favObj[input.vals[0]]) {
                        if (favObj[input.vals[0]][input.vals[1]]) delete favObj[input.vals[0]][input.vals[1]];
                        else core.output(input.vals[0] + ' - ' + input.vals[1] + ': not found in favorites');
                    } else core.output(input.vals[0] + ': not found in favorites');

                    
                    filesystem.writeReqFile('fav', favObj);
                    core.output(input.vals[0] + ' - ' + input.vals[1] + ': written to /req/fav.rf');

                }
            } else if (input.flags['l']) {
                var favObj = filesystem.readReqFile('fav', false);
                if (favObj === false) core.output('/req/fav.rf: no such file');
                else {
                    $.each(favObj, function(i, obj) { core.output(i); });
                }
            } else if (input.flags['h'] || input.flags['help']) {
                core.runCommand(['man', 'nt']);
            } else {
                var favObj = filesystem.readReqFile('fav', false);
                if (favObj === false) core.output('/req/fav.rf: no such file');
                else {
                    if (input.vals[1]) {
                        var favValue = utility.getValue(favObj, input.vals[0] + '.' + input.vals[1])
                        if (favValue) utility.openTab(favValue);
                        else core.output(input.vals[0] + ' - ' + input.vals[1] + ': not found in favorites');
                    } else {
                        var favGroup = utility.getValue(favObj, input.vals[0]);
                        if (favGroup) {
                            $.each(favGroup, function(i, obj) { core.output(i); });
                        } else core.output(input.vals[0] + ': not found in favorites');
                    }

                    
                    
                }
            }
        },
        description: 'Manage favorites, read, write or delete entries.',
        man: [
            "nt 0.1",
            "Manage favorites, read, write or delete entries. ",
            "nt reads and writes to /req/fav.rf",
            "Usage:",
            "$ nt <group> <name>",
            "Open the given entry in a new tab",
            "$ nt <group>",
            "List all entries in the given group",
            "$ nt -w <group> <name> <url>",
            "Write the URL to the favorites. This automatically saves the Disk.",
            "$ nt -r <group> <name>",
            "Remove the given entry",
            "$ nt -l",
            "List all groups",
            "$ nt -h|--help",
            "Display this page"
        ]
    },

    conf: {
        action: function(args) {
            if (!args[1]) {
            	core.output('usage: conf -u|-r|-w <key> <value>');
            	return;
            }

            var confObj = filesystem.readReqFile('conf', false),
            	input = utility.parseFlags(args);

            if (confObj === false) {
                core.output('/req/conf.rf: no such file');
                return false;
            }

            if (input.flags['u']) {
                var count = 0;
                $.each(confObj, function(i, obj) {
                    utility.parseConfig(i, obj);
                    count++;
                });
                core.output('Read ' + count + ' config entries');
            } else if (input.flags['w']) {
                if (!input.vals[1]) core.output('usage: conf -w <key> <value>');
                else {
                    confObj[input.vals[0]] = input.vals[1];
                    filesystem.writeReqFile('conf', confObj);
                }
            } else if (input.flags['r']) {
                filesystem.writeReqFile('conf', {});
                core.output('/req/conf.rf: cleared');
            } else core.output('usage: conf -u|-r|-w <key> <value>');
        },
        description: 'Update or remove configuration files (WIP)'
    },

    search: {
        action: function(args) {
            if (!args[1]) core.output('usage: search <string>');
            else {
                args.shift();
                var searchString = args.join(' ');
                utility.openTab("https://www.google.de/#q=" + searchString);
            }
        },
        description: 'Search for the string with a search engine'
    },

    ping: {
        action: function (args) {
            if (!args[1]) {
                core.output('usage: ping <domain>');
                return false;
            }
            var input = utility.parseFlags(args),
                urlToPing = input.vals[0];

            if (!/^https?:\/\//i.test(urlToPing)) urlToPing = 'http://' + urlToPing;

            utility.pingUrl(urlToPing, 0.3).then(function(delta) {
                core.output('Answer by ' + urlToPing + ' Time=' + Math.round(delta) + 'ms');
            }).catch(function(error) {
                core.output(String(error));
            });
        },
        description: 'Ping a webserver.'
    },

    lookup: {
        action: function (args) {
            if (!args[1]) {
                core.output('usage: lookup <domain>');
                return false;
            }
            var input = utility.parseFlags(args);

            utility.getIp(input.vals[0]).then(function(answer) {
                core.output(answer);
            }).catch(function(error) {
                core.output(error);
            });
        },
        description: 'Request ip of a domain'
    }


};

var core = {

	vars: {
		inputActive: true,
		inputHistory: [],
		inputHistoryPosition: null
	},

	focusInput: function() {
		$('#input')
			.select()
			.focus();
	},

	parseInput: function() {
		if (!this.vars.inputActive) return false;
		this.suspendInput();
		this.resetHistory();

		var input = $('#input').val(),
			inputArray = input.split(' ');

		this.output(input, true);
		$('#input').val('').focus();

		if (input) {
			this.runCommand(inputArray);
			this.vars.inputHistory.push(input);
		}
		this.activateInput();
	},

	runCommand: function(inputArray) {
		if (commands[inputArray[0]]) {
			commands[inputArray[0]].action(inputArray);
		} else {
			this.output(inputArray[0] + ': command not found');
		}
	},

	suspendInput: function() {
		this.vars.inputActive = false;
		$('#input-wrap').hide();
	},

	activateInput: function() {
		this.vars.inputActive = true;
		$('#input-wrap').show();
		$('#input')
			.val('')
			.focus();
	},

	output: function(str, doBash) {
		var classString = (doBash) ? 'output-block output-block-bash' : 'output-block',
			escapedString = $('<div/>').text(str).html().replace(/\n/g, "<br />");

		$('<div/>', {
			class: classString
		})
			.html(escapedString)
			.appendTo('#output');

		window.scrollTo(0,document.body.scrollHeight);

	},

	clearOutput: function() {
		$('#output').html('');
	},

	// --- History ---

	getInputHistory: function(i) {
		var historyData = this.vars.inputHistory[this.vars.inputHistory.length - (i + 1)];
		if (historyData) return historyData;
		else return false;
	},

	resetHistory: function() {
		this.vars.inputHistoryPosition = null;
	},

	checkInputHistory: function() {
		if (this.vars.inputHistoryPosition === null) this.vars.inputHistoryPosition = 0;
		else this.vars.inputHistoryPosition++;

		var checkedHistory = this.getInputHistory(this.vars.inputHistoryPosition);
		if (checkedHistory !== false) $('#input').val(checkedHistory);
	}

};

var filesystem = {

	home: {},

	vars: {
		location: '/'
	},

	// -- Commands --

	readFile: function(str) {
		str = str || "";
		var locationObject = this.getObjectForLocation(this.getParentLocation(str)),
			inputArray = str.split('/'),
			fileLookup = inputArray[inputArray.length - 1];

		if (this.checkIfFileExists(locationObject, fileLookup)) {
			return locationObject[fileLookup].content;
		} else {
			return false;
		}
	},

	readDir: function(str) {
		str = str || "";
		var locationObject = this.getObjectForLocation(this.getFullLocation(str)),
			outputArray = [];

		$.each(locationObject, function(i, obj) {
			outputArray.push({
				name: i,
				type: obj.type
			});
		});

		return outputArray;
	},

	createDir: function(str, origin) {
        origin = origin || '';
		var locationObject = this.getObjectForLocation(this.getFullLocation(origin));

		if (locationObject[str]) return false;

		locationObject[str] = {
			type: 'folder',
			content: {}
		};

		return true;
	},

	writeFile: function(str, buffer) {
		str = str || "";
		var locationObject = this.getObjectForLocation(this.getParentLocation(str)),
			inputArray = str.split('/'),
			fileLookup = inputArray[inputArray.length - 1];

		if (this.checkIfFileExists(locationObject, fileLookup)) {
			locationObject[fileLookup].content = buffer;
			return true;
		} else {
			return false;
		}
	},

	createFile: function(str, origin) {
        origin = origin || '';
		var locationObject = this.getObjectForLocation(this.getFullLocation(origin));

		if (locationObject[str]) return false;

		locationObject[str] = {
			type: 'file',
			content: ''
		};

		return true;
	},

	removeEntity: function(str) {
		str = str || "";
		var locationObject = this.getObjectForLocation(this.getParentLocation(str)),
			inputArray = str.split('/'),
			fileLookup = inputArray[inputArray.length - 1];

		if (locationObject[fileLookup]) {
			delete locationObject[fileLookup];
			return true;
		} else {
			return false;
		}
	},

	navigateDir: function(str) {
		var newLocation, locationObject;

		if (!str) str = '/';
		if (str === '..') {
			newLocation = this.getParentLocation('')
		} else {
			newLocation = this.getFullLocation(str);
		}

		if (newLocation === '') return false;
		locationObject = this.getObjectForLocation(newLocation)

		if (locationObject) {
			this.vars.location = newLocation;
			return true;
		} else {
			return false;
		}
	},

	// -- Logic --

	getParentLocation: function(str) {
		var oldLocation = this.getFullLocation(str);
		var newLocation = oldLocation.split('/');
		newLocation.splice(newLocation.length - 2, 1);
		return newLocation.join('/');
	},

	getFullLocation: function(str) {
		var origin;

		if (str.substr(0, 1) === '/') origin = '';
		else origin = this.vars.location;

		if (str.substr(str.length - 1, 1) !== '/' && str !== '') str += '/';
		return origin + str;
	},

	getObjectForLocation: function(str) {
		str = str.substr(1);

		var originObject = this.home,
			locationArray = str.split('/'),
			validLocation = true;

		if (locationArray.length === 1 && locationArray[0] === "") return originObject;

		$.each(locationArray, function(i, obj) {
			if (!obj) return true;

			if (this.checkIfFolderExists(originObject, obj)) {
				originObject = originObject[obj].content;
			} else {
				validLocation = false;
				return false;
			}
		}.bind(this));

		if (validLocation) return originObject;
		else return false;
	},

	checkIfFileExists: function(obj, name) {
		if (obj[name]) {
			return obj[name].type == 'file';
		} else {
			return false;
		}
	},

	checkIfFolderExists: function(obj, name) {
		if (obj[name]) {
			return obj[name].type == 'folder';
		} else {
			return false;
		}
	},

    // --- extended ---

    readReqFile: function(name, createIfMissing) {
        var reqFile = filesystem.readFile('/req/' + name + '.rf');
        if (reqFile === false && createIfMissing) {
            if (filesystem.getObjectForLocation('/req') === false) filesystem.createDir('req', '/');
            filesystem.createFile(name + '.rf', '/req');
            core.output('/req/' + name + '.rf created');
        } else if (reqFile === false && !createIfMissing) {
            return false;
        }

        try { var reqObj = JSON.parse(reqFile); }
        catch(err) { var reqObj = {}; }
        if (reqObj === false) reqObj = {};

        return reqObj;
    },

    writeReqFile: function(name, object) {
        filesystem.writeFile('/req/' + name + '.rf', JSON.stringify(object));
    }
};

$(function() {
	// Startup
	core.runCommand(['uname', '--host']);
	core.runCommand(['uname', '-a']);
	core.runCommand(['lstore', '-r']);

	// Up/Down Arrow Detection
	$(document).keydown(function(e) {
		if (e.which === 38) {
            e.preventDefault();
			core.checkInputHistory();
		} else if (e.which === 40) {
            e.preventDefault();
			core.resetHistory();
			$('#input').val('').focus();
		}
	});
});

var utility = {

    currentDate: function () {
        return new Date();
    },

    getByteCount: function (s) {
        return encodeURI(s).split(/%..|./).length - 1;
    },

    bytesToSize: function (bytes) {
        var sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
        if (bytes == 0) return '0 Byte';
        var i = parseInt(Math.floor(Math.log(bytes) / Math.log(1024)));
        return Math.round(bytes / Math.pow(1024, i), 2) + ' ' + sizes[i];
    },

    openTab: function (url) {
        var win = window.open(url, '_blank');
        if (win) win.focus();
        else core.output('Popup suppressed by browser');
    },

    parseFlags: function (args) {
        args.shift();
        var flags = {},
            values = [];

        $.each(args, function (i, obj) {
            if (obj.substring(0, 1) === '-') {

                // Full-word flags as in --version
                if (obj.substring(0, 2) === '--') flags[obj.substring(2)] = true;

                // Single-char flags as in -v or -alh
                else {
                    $.each(obj.substring(1).split(''), function (i, obj) {
                        flags[obj] = true;
                    });
                }
            } else {
                values.push(obj);
            }
        });

        return {
            flags: flags,
            vals: values
        }
    },

    parseConfig: function (key, val) {
        // TODO
        //$('#shell').css(key, val);
    },

    setValue: function (object, path, value) {
        var a = path.split('.');
        var o = object;
        for (var i = 0; i < a.length - 1; i++) {
            var n = a[i];
            if (n in o) {
                o = o[n];
            } else {
                o[n] = {};
                o = o[n];
            }
        }
        o[a[a.length - 1]] = value;
    },

    getValue: function (object, path) {
        var o = object;
        path = path.replace(/\[(\w+)\]/g, '.$1');
        path = path.replace(/^\./, '');
        var a = path.split('.');
        while (a.length) {
            var n = a.shift();
            if (n in o) {
                o = o[n];
            } else {
                return;
            }
        }
        return o;
    },

    // Network

    /**
     * Creates and loads an image element by url.
     * @param  {String} url
     * @return {Promise} promise that resolves to an image element or
     *                   fails to an Error.
     */
    requestImage: function (url) {
        return new Promise(function (resolve, reject) {
            var img = new Image();
            img.onload = function () {
                resolve(img);
            };
            img.onerror = function () {
                reject(url);
            };
            img.src = url + '?random-no-cache=' + Math.floor((1 + Math.random()) * 0x10000).toString(16);
        });
    },

    /**
     * Pings a url.
     * @param  {String} url
     * @param  {Number} multiplier - optional, factor to adjust the ping by.  0.3 works well for HTTP servers.
     * @return {Promise} promise that resolves to a ping (ms, float).
     */
    pingUrl: function (url, multiplier) {
        return new Promise(function (resolve, reject) {
            var start = (new Date()).getTime();
            var response = function () {
                var delta = ((new Date()).getTime() - start);
                delta *= (multiplier || 1);
                resolve(delta);
            };
            this.requestImage(url).then(response).catch(response);

            // Set a timeout for max-pings, 5s.
            setTimeout(function () {
                reject(Error('Timeout'));
            }, 2500);
        }.bind(this));
    },

    /**
     * Fetches ip of an url.
     * @param {String} domain
     * @returns {Promise} promise that resolves to an ip (String)
     */
    getIp: function (domain) {
        domain = domain.replace('http://','').replace('https://','');
        return new Promise(function(resolve, reject) {
            var oReq = new XMLHttpRequest();

            oReq.onload = function () { resolve(this.responseText); };
            oReq.onerror = function() { reject('Request failed'); };

            oReq.open("get", "http://cors.io?u=http://api.konvert.me/forward-dns/" + domain, true);
            oReq.send();
        });
    }
};

