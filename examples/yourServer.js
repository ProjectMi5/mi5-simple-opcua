const Mi5OpcuaServer = require('./../models/opcua-server');
const content = {
  "Mi5":{
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
};
let newServer = new Mi5OpcuaServer(4840, {content: content});


let variable = newServer.getVariable("ns=4;s=Mi5.Output.Connected");
variable.onChange((value)=>{
  console.log(value);
});

newServer.on('method:ns=4;s=Mi5.Input.Methode', (data)=>{
  console.log('Method called');
});