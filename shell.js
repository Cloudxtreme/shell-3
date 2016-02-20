
$(function() {
	$('#input').focus()
});

var env = {
	osName: 'jsTerm',
	host: 'localhost',
	user: 'root',
	version: '0.0.7'
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
            args.splice(0,1);
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
			var output = env.osName;

			$.each(args, function(i, obj) { 
				if (obj == '-a') {
					output += ' ' + env.host + ' ' + env.version + ' ' + env.user + ' ' + utility.currentDate()
				}
			});
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
			core.output(filesystem.readDir(args[1]));
		},
		description: "List directory contents"
	},

	cd: {
		action: function(args) {
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
			if (args[1] === '--read' || args[1] === '-r') {
				var readObject = localStorage.getItem('filesystem');
				if (readObject) {
                    var byteSize = utility.bytesToSize(utility.getByteCount(readObject));
					filesystem.home = JSON.parse(readObject);
					core.output('Disk loaded  (' + byteSize + ')');
				} else {
					core.output('No backup found');
				}
			} else if (args[1] === '--write' || args[1] === '-w') {
				localStorage.setItem('filesystem', JSON.stringify(filesystem.home));
				core.output('Written to localstorage');
			} else if (args[1] === '--help' || args[1] === '-h') {
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
            "Display this page"
        ]
	},

    // --- Custom ---

    nt: {
        action: function(args) {
            if (!args[1]) core.output('help page: nt --help');
            else {
                if (args[1] === '-w') {
                    if (!args[2] || !args[3] || !args[4]) core.output('usage: nt -w <group> <name> <url>');
                    else {
                        var favObj = filesystem.readReqFile('fav', true);

                        utility.setValue(favObj, args[2] + '.' + args[3], args[4]);

                        filesystem.writeReqFile('fav', favObj);
                        core.output(args[2] + ' - ' + args[3] + ': written to /req/fav.rf');

                    };
                } else if (args[1] === '-r') {
                    if (!args[2] || !args[3]) core.output('usage: nt -r <group> <name>');
                    else {
                        var favObj = filesystem.readReqFile('fav', true);

                        if (favObj[args[2]]) {
                            if (favObj[args[2]][args[3]]) delete favObj[args[2]][args[3]];
                            else core.output(args[2] + ' - ' + args[3] + ': not found in favorites');
                        } else core.output(args[2] + ': not found in favorites');

                        
                        filesystem.writeReqFile('fav', favObj);
                        core.output(args[2] + ' - ' + args[3] + ': written to /req/fav.rf');

                    };
                } else if (args[1] === '-l') {
                    var favObj = filesystem.readReqFile('fav', false);
                    if (favObj === false) core.output('/req/fav.rf: no such file');
                    else {
                        $.each(favObj, function(i, obj) { core.output(i); });
                    }
                } else if (args[1] === '-h' || args[1] === '--help') {
                    core.runCommand(['man', 'nt']);
                } else {
                    var favObj = filesystem.readReqFile('fav', false);
                    if (favObj === false) core.output('/req/fav.rf: no such file');
                    else {
                        if (args[2]) {
                            var favValue = utility.getValue(favObj, args[1] + '.' + args[2])
                            if (favValue) utility.openTab(favValue);
                            else core.output(args[1] + ' - ' + args[2] + ': not found in favorites');
                        } else {
                            var favGroup = utility.getValue(favObj, args[1]);
                            if (favGroup) {
                                $.each(favGroup, function(i, obj) { core.output(i); });
                            } else core.output(args[1] + ': not found in favorites');
                        }

                        
                        
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
            "Write the URL to the favorites",
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
            if (!args[1]) core.output('usage: conf -u|-r|-w <key> <value>');
            else {
                var confObj = filesystem.readReqFile('conf', false);
                if (confObj === false) {
                    core.output('/req/conf.rf: no such file');
                    return false;
                }

                if (args[1] === '-u') {
                    var count = 0;
                    $.each(confObj, function(i, obj) {
                        utility.parseConfig(i, obj);
                        count++;
                    });
                    core.output('Read ' + count + ' config entries');
                } else if (args[1] === '-w') {
                    if (!args[2] || !args[3]) core.output('usage: conf -w <key> <value>');
                    else {
                        confObj[args[2]] = args[3];
                        filesystem.writeReqFile('conf', confObj);
                    }
                } else if (args[1] === '-r') {
                    filesystem.writeReqFile('conf', {});
                    core.output('/req/conf.rf: cleared');
                } else core.output('usage: conf -u|-r|-w <key> <value>')
            }
        },
        description: 'Update or remove configuration files (WIP)'
    },

    search: {
        action: function(args) {
            if (!args[1]) core.output('usage: search <string>');
            else {
                args.splice(0,1);
                var searchString = args.join(' ');
                utility.openTab("https://www.google.de/#q=" + searchString);
            }
        },
        description: 'Search for the string with a search engine'
    }


}

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
		var classString = (doBash) ? 'output-block output-block-bash' : 'output-block';

		$('<div/>', {
			class: classString
		})
			.text(str)
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
		if (checkedHistory !== false) $('#input').val(checkedHistory).putCursorAtEnd();
	}

}

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
			outputString = '';

		$.each(locationObject, function(i, obj) {
			outputString += i + '   ';
		});

		return outputString;
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
			if (obj[name].type == 'file') return true;
			else return false;
		} else {
			return false;
		}
	},

	checkIfFolderExists: function(obj, name) {
		if (obj[name]) {
			if (obj[name].type == 'folder') return true;
			else return false;
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
}

$(function() {
	core.runCommand(['uname', '-a']);
	core.runCommand(['lstore', '-r']);

	$(document).keydown(function(e) {
		if (e.which === 38) {
			core.checkInputHistory();
		} else if (e.which === 40) {
			core.resetHistory();
			$('#input').val('').focus();
		}
	});
});

var utility = {

	currentDate: function() {
		return new Date();
	},

    getByteCount: function(s) {
        return encodeURI(s).split(/%..|./).length - 1;
    },

    bytesToSize: function(bytes) {
        var sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
        if (bytes == 0) return '0 Byte';
        var i = parseInt(Math.floor(Math.log(bytes) / Math.log(1024)));
        return Math.round(bytes / Math.pow(1024, i), 2) + ' ' + sizes[i];
    },

    openTab: function(url) {
        var win = window.open(url, '_blank');
        if (win) win.focus();
        else core.output('Popup suppressed by browser');
    },

    parseConfig: function(key, val) {
        // TODO
        //$('#shell').css(key, val);
    },

    setValue: function(object, path, value) {
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

    getValue: function(object, path) {
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
    }

}

jQuery.fn.putCursorAtEnd = function() {

  return this.each(function() {

    $(this).focus();

    if (this.setSelectionRange) {

      var len = $(this).val().length * 2;

      this.setSelectionRange(len, len);
    
    } else {

      $(this).val($(this).val());
      
    }

  });

};

