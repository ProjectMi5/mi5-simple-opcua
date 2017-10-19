# Mi5 Node OPC UA Simple

This app helps working with the module [node-opcua](http://node-opcua.github.io/). It allows you to easily create your own OPC UA server or client.

## Getting Started

* Install [node.js](https://nodejs.org/en/)
* Create a new folder for your project.
* In this folder run `npm init` and fill in the requested information or let it empty.
* Then run `npm install https://github.com/ProjectMi5/mi5-simple-opcua --save`.
* Create a file `app.js` and require the module:
`require('mi5-simple-opcua');`

## Your Server

This module allows you to create a simple OPC UA server with your own folder structure and variables.

```javascript
var server = require('mi5-simple-opcua').OpcuaServer;
var yourServer = server.newOpcuaServer(ServerStructure);
```

The `ServerStructure` can look like this:

```javascript
{
	moduleName: 'Module Bla Bla',
	serverInfo: {
		port: 4842, // the port of the listening socket of the server
		resourcePath: "", // this path will be added to the endpoint resource name, default: empty
		buildInfo : {
			productName: 'Bla Bla', //any name
			buildNumber: "7658", // any number
			buildDate: new Date(2016,3,25) // any date
		}
	},
	rootFolder: "RootFolder",
	baseNodeId: "ns=4;s=MI5.", //this ist just an example
	content: FolderStructure
	} 
};
```

The `FolderStructure` is addressed in the following section.

### The Folder Structure

The folder structure is an array of elements. Each element has at least the attributes `type` and `browseName`.

Possible types are `Folder`, `Object` and `Variable`, so far. 

#### Folders and Objects

Folders and Objects may have subfolders, i.e. an array of objects with the attribute `content`.

#### Variables

Variables must have a `dataType` and an `initValue`; supported data types are Boolean, Double, String.

#### Example

```json
   {
        "type": "Folder",
        
        "browseName": "Output",
        
        "content": [
	
			{
	
				"type": "Variable",
	
				"browseName": "Connected",
	
				"dataType": "Boolean",
	
				"initValue": true
	
			}
	
			]
	
	}
```

## Your Client

Your own client can be created as follows:

```javascript
var client = require('mi5-simple-opcua').OpcuaClient;
var endpointUrl = "opc.tcp://[put Server HostName here]:[put port here]"
var yourClient = new client(endpointUrl, function(error){
  if(error)
    return console.log(error);
  console.log('connection established');
});
```

The `callback(error)` will be executed, once the connection is established or an error occurred.

### OPC UA Variables

With mi5-simple-opcua variables you can easily listen to or write OPC UA variables on a server.

They are created as follows:

```javascript
var OpcuaVariable = require('mi5-simple-opcua').OpcuaVariable;
var yourVariable = new OpcuaVariable(yourClient, nodeId, subscribe [,writeInitValue]);
```

The `nodeId` is a String. `subscribe` determines whether or not the variable will be monitored permanently or not. `writeInitValue` will be written to the server once the client is connected, but can also stay `null`.

#### Methods

Each variable comes with the following methods:

* `variable.write(value)`
* `variable.read(function(value){})`
* `variable.on('change', function(value){})`
* `variable.once('change', function(value){})`
* `variable.subscribe()`
* `variable.unsubscribe)`

If the variable is subscribed (either from the beginning in the constructor or later with the method), the value `variable.value` will stay up to date. Otherwise it will contain the last known value.