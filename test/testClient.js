const Mi5OpcuaClient = require('./../models/opcua-client');
const clientVariable = require('./../models/opcua-client-variable');
const fs = require('fs');

asyncOperation().catch(console.error);


async function asyncOperation(){
  let client = new Mi5OpcuaClient("opc.tcp://127.0.0.1:4840");
  let variable = new clientVariable(client, "ns=4;s=Mi5.Output.Connected", true);

  //connect
  await client.connect();
  console.log('connected');

  //read variable and datatype
  let value = await client.readVariable("ns=4;s=Mi5.Output.Connected");
  let dataType = await client.readDatatype("ns=4;s=Mi5.Output.Connected");
  console.log(value+' '+dataType);

  //browse
  await client.browseInDepthPromise(['RootFolder']);
  fs.writeFile('message.txt', JSON.stringify(client.folderStructure, null, 2), (err) => {
    if (err) throw err;
    console.log('The file has been saved!');
  });

  //filter
  let nodeArray = client.findPattern(['Objects', 'Server', '^ServerCapabilities']);
  console.log(nodeArray);

  let clVar = new clientVariable(client, "ns=4;s=Mi5.Output.Connected", true, false);
  let result = await clVar.read();
  console.log(result);
  setTimeout(function(){console.log(clVar.value)},2000);
  clVar.onChange(console.log);
}