# Mi5 Node OPC UA Simple

This app helps working with the module [node-opcua](http://node-opcua.github.io/). It allows you to easily create your own OPC UA server or client.

## Getting Started

* Install [node.js](https://nodejs.org/en/)
* Create a new folder for your project.
* Navigate to this folder in the command prompt.
* Run `npm init` and fill in the requested information or let it empty.
* Then run `npm install https://github.com/ProjectMi5/mi5-simple-opcua --save`.
* Create a file `app.js` and require the module:
`require('mi5-simple-opcua');`

## Your Server

This module allows you to create a simple OPC UA server with your own folder structure and variables.

```javascript
const simpleOpcuaServer = require('mi5-simple-opcua').OpcuaServer;
let yourServer = new simpleOpcuaServer(port, ServerStructure, options).start();
```

The `ServerStructure` can look like this:

/**
	 *
   * @param {Number} [port] The TCP port to listen to. Default is 4840.
   * @param [ServerStructure]
   * @param [ServerStructure.rootFolder = RootFolder]
	 * @param [ServerStructure.resourcePath = ""] this path will be added to the endpoint resource name
	 * @param [ServerStructure.baseNodeId = "ns=4;s="]
	 * @param [ServerStructure.content = {}]
   * @param [options = {}] for more information see here: http://node-opcua.github.io/api_doc/classes/OPCUAServer.html
   */

```javascript
{
    resourcePath = "", //this path will be added to the endpoint resource name
	rootFolder: "RootFolder",
	baseNodeId: "ns=4;s=", //this ist just an example
	content: FolderStructure
};
```

The `FolderStructure` is addressed in the following section.

The `options` are optional. You can further customize your server with it. For more information have a look [here](http://node-opcua.github.io/api_doc/classes/OPCUAServer.html).


### The Folder Structure

The folder structure is a collection of elements. Each element starts with its browseName and must at least have the attribute `type`. Possible types are `Folder`, `Object`, `Variable`, and `Method`. 


#### Folders and Objects

Folders and Objects may have subfolders, i.e. another folder structure with the attribute `content`.

#### Variables

Variables must have a `dataType` and an `initValue`; supported data types are `Boolean`, `Integer`, `Double` and `String`.

#### Example

```json
{
  "Mi5": {
    "type": "Folder",
    "content": {
      "Output": {
        "type": "Folder",
        "content": {
          "Connected": {
            "type": "Variable",
            "dataType": "Boolean",
            "initValue": true
          },
          "Voltage": {
            "type": "Variable",
            "dataType": "Double",
            "initValue": 2.345
          }
        }
      },
      "Input": {
        "type": "Folder",
        "content": {
          "Methode": {
            "type": "Method"
          },
          "Auto": {
            "type": "Object"
          }
        }
      }
    }
  }
```

## Your Client

Your own client can be created as follows:

```javascript
const client = require('mi5-simple-opcua').OpcuaClient;
let endpointUrl = "opc.tcp://[put Server HostName here]:[put port here]"
let yourClient = new client(endpointUrl, function(error){
  if(error)
    return console.log(error);
  console.log('connection established');
});
```

The `callback(error)` will be executed, once the connection is established or an error occurred.

### OPC UA Variables

With mi5-simple-opcua variables you can easily listen to or write OPC UA variables on a server. Be aware that different variables are used for programming a server or a client.

#### Server Variables

You get them as follows:

```javascript
let yourVariable = server.getVariable(nodeId);
```

Each server variable comes with the following methods:

* `variable.setValue(value)`
* `variable.getValue()`
* `variable.onChange(function(value){})`
* `variable.oneChange(function(value){})`
* `variable.monitor()`
* `variable.unmonitor()`

#### Client Variables

They are created as follows:

```javascript
const OpcuaVariable = require('mi5-simple-opcua').OpcuaClientVariable;
let yourVariable = new OpcuaVariable(yourClient, nodeId, subscribe [,writeInitValue]);
```

The `nodeId` is a String. `subscribe` determines whether or not the variable will be monitored permanently or not. `writeInitValue` will be written to the server once the client is connected, but can also stay `null`.

Each client variable comes with the following methods:

* `async variable.write(value)`
* `async variable.read()`
* `variable.on('change', function(value){})`
* `variable.once('change', function(value){})`
* `variable.subscribe()`
* `variable.unsubscribe)`

If the variable is subscribed (either from the beginning in the constructor or later with the method), the value `variable.value` will stay up to date. Otherwise it will contain the last known value.