# Mi5 Node OPC UA Simple

This app helps working with the module [node-opcua](http://node-opcua.github.io/). Examples are located in the `/example` folder. More information coming soon.

## Getting Started

* coming soon.

## The Folder Structure

The folder structure is an array of elements. Each element has at least the attributes `type` and `browseName`.

Possible types are `Folder`, `Object` and `Variable`, so far. 

### Folders and Objects

Folders and Objects may have subfolders, i.e. an array of objects with the attribute `content`.

### Variables

Variables must have a `dataType` and an `initValue`; supported data types are Boolean, Double, String.

### Example

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
