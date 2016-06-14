var fs = require('fs');

function replaceKeysInFolderStructure(inputPath, destinationPath, replaceStatements){
	// the following code must be blocking
	var temp = fs.readFileSync(inputPath, 'utf8');
	replaceStatements.forEach(function(statement){
		temp = temp.replace(statement.key, statement.replacement); 
	});
	fs.writeFileSync(destinationPath, temp);
}

module.exports.replaceKeysInFolderStructure = replaceKeysInFolderStructure;

function expandFolderStructure(inputStructure){
	return iterateContent(inputStructure);	
}

module.exports.expandFolderStructure = expandFolderStructure;

function expandFolderStructureToFile(inputPath, destinationPath){
	// the following code must be blocking
	var temp = require(inputPath);
	temp = iterateContent(temp);	
	fs.writeFileSync(destinationPath, JSON.stringify(temp));
}

function expandObject(key, input){
	var newObject = {};
		
	var indexStart = input.indexStart;
	var numberOfRepetitions = input.numberOfRepetitions;
	var indexKey = input.indexKey;
	
	delete input.repeat;
	
	if(!indexStart){
		indexStart = 0;
	} else {
		delete input.indexStart;
	}
	
	if(numberOfRepetitions){
		delete input.numberOfRepetitions;
	}
	
	if(indexKey){
		delete input.indexKey;
	}
	
	for (var j = indexStart, len = indexStart+numberOfRepetitions; j < len; j++) {
		if(!indexKey){
			newObject[key+j] = input;
		} else {
			// we need a clone because we want to edit each unit object without editing the original object
			var jsonClone = JSON.stringify(input);
			jsonClone = jsonClone.split(indexKey).join(j);
			var copyKey = key.replace(indexKey, j);
			newObject[copyKey] = JSON.parse(jsonClone);
		}
	}
	
	return newObject;
}

function iterateContent(input){
	var result = {};
	
	
	for(var key in input){
		var item = input[key];
		var repeat = item.repeat;
		var content = item.content;
		
		if(repeat){
			var repeatedUnits = iterateContent(expandObject(key, item));
			for(var anotherKey in repeatedUnits){
				result[anotherKey] = repeatedUnits[anotherKey];
			}
		} else if (content){
			result[key] = item;
			result[key].content = iterateContent(content);
		} else {
			result[key] = item;
		}
	}
	
	return result;
}

function includeObjects(targetObject, objects){
	for(var key in objects){
		targetObject[key] = objects[key];
	}
	return targetObject;
}

function setInitValues(inputStructure, valueStatements){
	valueStatements.forEach(function(item){
		var path = item.path.split('.').join('.content.') + '.initValue';
		set(inputStructure, path, item.initValue);
	});
	return inputStructure;
}

module.exports.setInitValues = setInitValues;

/**
 * sets an attribute in an object
 * @param {object} obj 
 * @param {String} path
 * @return {object} value
 */
function set(obj, path, value) {
    var schema = obj;  // a moving reference to internal objects within obj
    var pList = path.split('.');
    var len = pList.length;
    for(var i = 0; i < len-1; i++) {
        var elem = pList[i];
        if( !schema[elem] ) schema[elem] = {};
        schema = schema[elem];
    }

    schema[pList[len-1]] = value;
}