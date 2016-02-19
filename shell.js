
$(function() {
	$('#input').focus()
});

var env = {
	osName: 'jsTerm',
	host: 'localhost',
	user: 'root',
	version: '0.0.1'
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
			var outputString = args.join(' ').substr(5);
			core.output(outputString);
		},
		description: "Writes string to the standard output"
	},

	man: {
		action: function(args) {
			if (commands[args[1]]) core.output(commands[args[1]].description);
			else {
				core.output("Specified command not found");
			}
		},
		description: "Explains commands"
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
			var fileContent = filesystem.readFile(args[1]);
			if (fileContent !== false) core.output(fileContent);
			else core.output(args[1] + ': no such file');
		},
		description: "Echo content of file"
	},

	mkdir: {
		action: function(args) {
			if(!args[1]) core.output('usage: mkdir <directory>');
			else filesystem.createDir(args[1]);
		},
		description: 'Create a folder with the specified name'
	},

	touch: {
		action: function(args) {
			if(!args[1]) core.output('usage: touch <directory>');
			else filesystem.createFile(args[1]);
		},
		description: 'Create a file with the specified name'
	},

	rm: {
		action: function(args) {
			if(!args[1]) core.output('usage: rm <directory>');
			else {
				var removeAnswer = filesystem.removeEntity(args[1]);
				if (removeAnswer === false) core.output(args[1] + ': no such file or directory');
			}
		},
		description: 'Remove a given file or folder'
	},

	//TODO: Write to files with echo and a simple editor, maybe develop a syntax for favorite files

	// --- Meta ---

	lstore: {
		action: function(args) {
			if (args[1] === 'read') {
				var readObject = localStorage.getItem('filesystem');
				if (readObject) {
					filesystem.home = JSON.parse(readObject);
					core.output('Disk loaded');
				} else {
					core.output('No backup found');
				}
			} else if (args[1] === 'write') {
				localStorage.setItem('filesystem', JSON.stringify(filesystem.home));
				core.output('Written to localstorage');
			} else {
				core.output('usage: lstore read|write');
			}
		},
		description: 'Backup or reload the Disk'
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
		if (checkedHistory !== false) $('#input').val(checkedHistory);
		utility.moveCursorToEnd();
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

		if (locationObject[fileLookup]) {
			if (locationObject[fileLookup].type === 'file') {
				return locationObject[fileLookup].content;
			} else {
				return false;
			}
		} else {
			return false;
		}
	},

	readDir: function(str) {
		str = str || "";
		var locationObject = this.getObjectForLocation(this.getFullLocation(str)),
			outputString = '';

		$.each(locationObject, function(i, obj) {
			outputString += i + ' ';
		});

		return outputString;
	},

	createDir: function(str) {
		var locationObject = this.getObjectForLocation(this.getFullLocation(''));

		locationObject[str] = {
			type: 'folder',
			content: {}
		}
	},

	createFile: function(str) {
		var locationObject = this.getObjectForLocation(this.getFullLocation(''));

		locationObject[str] = {
			type: 'file',
			content: ''
		}
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

	checkIfFolderExists: function(obj, name) {

		if (obj[name]) {
			if (obj[name].type == 'folder') return true;
			else return false;
		} else {
			return false;
		}
	}

}

$(function() {
	core.runCommand(['uname', '-a']);
	core.runCommand(['lstore', 'read']);

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

	moveCursorToEnd: function() {
		//TODO: Get this to work
		var el = document.getElementById('input');
		if (typeof el.selectionStart == "number") {
			el.selectionStart = el.selectionEnd = el.value.length;
		} else if (typeof el.createTextRange != "undefined") {
			el.focus();
			var range = el.createTextRange();
			range.collapse(false);
			range.select();
		}
	}

}

