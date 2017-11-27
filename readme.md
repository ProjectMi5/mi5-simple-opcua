# Mi5 Node OPC UA Simple

This app helps working with the module [node-opcua](http://node-opcua.github.io/). It allows you to easily create your
own OPC UA server or client. Please also refer to the examples provided on [github](https://github.com/ProjectMi5/mi5-simple-opcua-example).

## Getting Started

* Install the latest version of [node.js](https://nodejs.org/en/) >= v8.9.1 (includes npm v5.5.1).
* Create a new folder for your project.
* Navigate to this folder in the command prompt.
* Run `npm init` and fill in the requested information or let it empty.
* Then run `npm install https://github.com/ProjectMi5/mi5-simple-opcua --save`.
* Create a file `app.js` and fill in some code from the following sections.
* In the command line, run `node app.js`.

## Your Server

This module allows you to create a simple OPC UA server with your own folder structure and variables.
Read further to see how `port`, `ServerStructure` and `options` look like or just replace them by `undefined`.


```javascript
const simpleOpcuaServer = require('mi5-simple-opcua').OpcuaServer;
let yourServer = new simpleOpcuaServer(port, ServerStructure, options);
```

The `ServerStructure` can look like this:

```javascript
{
    resourcePath = "", //optional: this path will be added to the endpoint resource name
	rootFolder: "RootFolder", //optional: you only need to add this, if you specify anything else than "RootFolder"
	baseNodeId: "ns=4;s=", //optional: you only need to add this, if you specify anything else than "ns=4;s="
	content: FolderStructure  //FolderStructure is addressed in the following section
};
```

The `FolderStructure` is addressed in the following section.

The `options` are optional. You can further customize your server with it.
For more information have a look [here](http://node-opcua.github.io/api_doc/classes/OPCUAServer.html).


### The Folder Structure

The folder structure is a collection of elements. Each element starts with its browseName and must at least have the
attribute `type`. Possible types are `Folder`, `Object`, `Variable`, and `Method`.
As an optional attribute, you can define the `nodeId` of each element on your own. If not defined, the nodeId will be 
created automatically.


#### Folders and Objects

Folders and Objects may have subfolders, i.e. another folder structure with the attribute `content`.

#### Variables

Variables must have a `dataType` and an `initValue`; supported data types are `Boolean`, `Integer`, `Double` and `String`.

#### Methods

Methods can have the optional attributes `inputArguments`, `outputArguments` and `func`, where the specified function
has to look like this: `function(inputArguments, context, callback){/*put your code here*/}`. For more information
have a look [here](https://github.com/node-opcua/node-opcua/blob/master/documentation/server_with_method.js).

**Note:** It is recommended to not specify the `element.func` attribute but instead access the method with the following
code.

```javascript 1.8
yourServer.on('method:{nodeId}', (data)=>{
  // your code here
  // data looks like this: {inputArguments: inputArguments, context: context}
  // note: this way you cannot specify the output parameters.
});
```

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
}
```

### Browse and check your server

If you want to browse your server, you might use the [UaExpert OPC UA Client](https://www.unified-automation.com/downloads/opc-ua-clients.html). It is for free but you are required to register first. Have a look at the console output to see at which port the server is listening. If you do not change the settings, it will be `opc.tcp://127.0.0.1:4840`.

## Your Client

Your own client can be created as follows:

```javascript
const client = require('mi5-simple-opcua').OpcuaClient;
let endpointUrl = "opc.tcp://[put Server HostName here]:[put port here]"
let yourClient = new client(endpointUrl);
yourClient.connect()
    .then(()=>{
      console.log('connected');
    })
    .catch((error)=>{
      console.error(error);  
    });
```

**Note:** For a more convenient use with `async` and `await` have a look in the
[sample project](https://github.com/node-opcua/node-opcua/blob/master/documentation/server_with_method.js).

### Browse the Server with your own client

You can let your client browse through the whole server structure.

```javascript 1.8
//browse
await client.browseServer();
```

Again: if you are not familiar with `async` and `await` have a look in the
[sample project](https://github.com/node-opcua/node-opcua/blob/master/documentation/server_with_method.js).

Once your client has browsed through the server once, you can search for certain nodes by describing a path to them.
This path is an Array of Regular Expression Strings describing the browseNames of nodes. For example:

```javascript 1.8
let nodeArray = client.findPattern(['Objects', 'Server', 'Server']);
// or also try out
let nodeArray = client.findPattern(['Objects', 'Server', 'Capabilities$']);
```

## OPC UA Variables

With mi5-simple-opcua variables you can easily listen to or write OPC UA variables on a server.
**Be aware:** different variables are used for programming a server or a client.

### Server Variables

You get them as follows:

```javascript
let yourVariable = yourServer.getVariable(nodeId);
```

Each server variable comes with the following methods:

* `variable.setValue(value)`
* `variable.getValue()`
* `variable.onChange(function(value){})`
* `variable.oneChange(function(value){})`
* `variable.monitor()`
* `variable.unmonitor()`

### Client Variables

They are created as follows:

```javascript
const OpcuaVariable = require('mi5-simple-opcua').OpcuaClientVariable;
let yourVariable = new OpcuaVariable(yourClient, nodeId [, subscribe [,writeInitValue]]); // square brackets say that the parameter is optional
// more convenient alternative:
let yourVariable = yourClient.getVariable(nodeId [, subscribe [,writeInitValue]]); // square brackets say that the parameter is optional
```

The `nodeId` is a String. `subscribe` determines whether or not the variable will be monitored permanently or not.
`writeInitValue` will be written to the server once the client is connected, but can also stay `null`.

Each client variable comes with the following (async) methods:

* `async variable.write(value)`
* `async variable.read()`
* `variable.on('change', (value)=>{})`
* `variable.once('change', (value)=>{})`
* `variable.subscribe()`
* `variable.unsubscribe()`

If the variable is subscribed (either from the beginning in the constructor or later with the method), the value `variable.value` will stay up to date. Otherwise it will contain the last known value.