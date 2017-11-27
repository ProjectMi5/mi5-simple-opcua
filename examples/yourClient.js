const Mi5OpcuaClient = require('./../models/opcua-client');
const clientVariable = require('./../models/opcua-client-variable');

// This async thing makes programming easier for you. You do not necessarily have to understand it ;-)
asyncOperation().catch(console.error);

async function asyncOperation(){
  let client = new Mi5OpcuaClient("opc.tcp://127.0.0.1:4840");
  let yourVariable = new clientVariable(client, "ns=4;s=Mi5.Output.Connected");

  //connect
  await client.connect();
  console.log('connected');

  // read variable
  let result = await yourVariable.read();
  console.log('Read variable: '+result);

  // subscribe to variable
  yourVariable.onChange((value)=>{
    console.log('Subscribed variable changed to: '+ value);
  });

  // write variable
  // note: your subscription will not inform you about value changes that were invoked by you.
  console.log('write variable');
  await yourVariable.write(false);

  // read variable again
  result = await yourVariable.read();
  console.log('Read variable: '+result);
}