/**
 * 
 * Created by Dominik on 25.04.2016.
 * Based on sample_server.js from https://github.com/node-opcua/node-opcua/blob/master/documentation/sample_server.js
 * In this module the server structure can easily be managed with the ServerStructure object. For more information see README.md
 */

/*global require,setInterval,console */
var opcua = require("node-opcua");
var server, structure;


exports.newOpcuaServer = function(ServerStructure){
	console.log('Comment by Dominik: The error called "Ignoring reversed keyword nodeClass" may be ignored. It is issued on github, already.')
	structure = ServerStructure;
	// Let's create an instance of OPCUAServer
	server = new opcua.OPCUAServer(structure.serverInfo);
	server.initialize(post_initialize);
	return server;
};

function post_initialize() {
    console.log("initialized");
	server.variables = {};
	
    function construct_my_address_space(server) {
    
        var addressSpace = server.engine.addressSpace;
		addArrayOfElements(addressSpace, structure.baseNodeId, structure.rootFolder,
			structure.content);
	}	

    construct_my_address_space(server);
    server.start(function() {
        console.log("Server is now listening ... ( press CTRL+C to stop)");
        console.log("port ", server.endpoints[0].port);
        var endpointUrl = server.endpoints[0].endpointDescriptions()[0].endpointUrl;
        console.log(" the primary server endpoint url is ", endpointUrl );
    });
}

function addArrayOfElements(addressSpace, baseNodeId, par, elems){
	// for loop is faster than forEach
	for (var key in elems) {
	  addElement(addressSpace, baseNodeId, par, key, elems[key]);
	}
}

function createArrayOfElementsFromRepeatUnit(indexStart, numberOfRepetitions, unit){
	var content = [];
	for (var j = indexStart, len = indexStart+numberOfRepetitions; j < len; j++) {
		// we need a clone because we want to edit each unit object without editing the original object
		var clone = JSON.parse(JSON.stringify(unit));
		clone.browseName = clone.browseName + j;
		content.push(clone);
	}
	return content;
}

function addElement(addressSpace, baseNodeId, par, browseName, elem){
	var nodeId, newElement, dot;
	if(par != 'RootFolder'){
		dot = '.';
	} else {
		dot = '';
	}
	nodeId = baseNodeId + dot + browseName;
	if(elem.nodeId){
		nodeId = baseNodeId + elem.nodeId;
	}
	
	if(elem.type == 'Folder'){
		newElement = addressSpace.addFolder(par,{browseName: browseName});
	}
	else if (elem.type == 'Object'){
		newElement = addressSpace.addObject({organizedBy: par,
			browseName: browseName});
	}
	else if (elem.type == 'Variable'){
		server.variables[nodeId] = parseByDataType(elem.dataType, elem.initValue);
		
		newElement = addressSpace.addVariable({
            componentOf: par,
            browseName: browseName,
            dataType: elem.dataType,
			nodeId: nodeId,
            value: {
                get: function () {
                    return new opcua.Variant({dataType: opcua.DataType[elem.dataType], value: server.variables[nodeId]});
                },
                set: function (variant) {
                    server.variables[nodeId] = variant.value;
                    return opcua.StatusCodes.Good;
                }
            }
        });
	} else {
		console.error('Unknown type '+elem.type);
	}
	
	if(typeof elem.content != 'undefined'){
		if(elem.type == 'RepeatUnit'){
			throw new Error("The object of type RepeatUnit must not have 'content'. Try the attribute 'unit' instead.");
		}
		addArrayOfElements(addressSpace, nodeId, newElement, elem.content);
	}
}

function parseByDataType(dataType, content){
	if(dataType == 'Boolean'){
		return JSON.parse(content);
	} else if (dataType == 'Float' | dataType == 'Double'){
		return parseFloat(content); // in javascript all numbers are 64bit float
	} else if (dataType == 'Integer'){
		return parseInt(content, 10);
	} else {
		return content;
	}
	
}

