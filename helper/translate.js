/**
 * This function helps to translate legicy folderStructures to the new version.
 * usage: node translate -i {inputFile} -o {outputFile}
 *
 */

var fs = require('fs');

var input = undefined;
var output = undefined;

process.argv.forEach(function(value, index, array){
	if(value == '-i'){
		input = './'+array[index+1];
	}
	if(value == '-o'){
		output = './'+array[index+1];
	}
});

if(!input||!output){
	console.error('Input or output is not defined correctly.\n'+
	'usage: node translate -i {inputFile} -o {outputFile}');
	return;
}

var folderStructure = require(input);
var newStructure = {};

try {
	translateArray(folderStructure, newStructure);
}
catch(e) {
	if(e == 'TypeError: array.forEach is not a function'){
		folderStructure = [folderStructure];
		translateArray(folderStructure, newStructure);
	} else {
		console.error(e);
		return;
	}
}
	

fs.writeFileSync(output, JSON.stringify(newStructure));

function translateArray(array, parentStructure){
	array.forEach(function(item){
		if(item.type == 'RepeatUnit'){
			var newElement = item.unit;
			newElement.repeat = true;
			var numberOfRepetitions = item.numberOfRepetitions;
			var indexKey = item.indexKey;
			var indexStart = item.indexStart;
			
			if(numberOfRepetitions){
				newElement.numberOfRepetitions = numberOfRepetitions;
			}
			if(indexKey){
				newElement.indexKey = indexKey;
			}
			if(indexStart){
				newElement.indexStart = indexStart;
			}

			item = newElement;
		}
		
		var name = item.browseName;
		delete item.browseName;
	
		if(item.type == 'Folder'){
			var substructure = {};
			translateArray(item.content, substructure);
			item.content = substructure;
		}
		parentStructure[name] = item;
	});
}