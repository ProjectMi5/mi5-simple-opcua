const assert = require('assert');
const Mi5OpcuaClient = require('./../models/opcua-client');
const cp = require('child_process');
const nodeId1 = 'ns=1;b=1020FFAA';
const nodeId2 = 'ns=1;i=1001';
let opcuaServerProcess, endpointUrl;

describe('Mi5 OPC UA Client', function() {
  before(function(done) {
    // Start a sample opcua server first.
    opcuaServerProcess = cp.fork('./test/ressources/sample_server.js');
    opcuaServerProcess.on('message', m => {
      endpointUrl = m;
      done();
    });
  });
  after(function() {
    opcuaServerProcess.kill();
  });

  describe('Client', function() {
    it('should connect to the server', async function() {
      let client = new Mi5OpcuaClient(endpointUrl);
      await client.connect();
      //console.log('connected');
      await client.end();
    });

    it('should be able to read variable value', async function() {
      let client = new Mi5OpcuaClient(endpointUrl);
      //let variable = new clientVariable(client, "ns=4;s=Mi5.Output.Connected", true);

      //connect
      await client.connect();
      //console.log('connected');

      //read variable and datatype
      let value = await client.readVariable(nodeId1);
      let dataType = await client.readDatatype(nodeId1);
      //console.log(value+' '+dataType);
      assert.equal(value, 10, 'should read value 10.');
      assert.equal(dataType, 'Double', 'should read dataType Double.');

      let variable = client.getVariable(nodeId1);
      await new Promise(resolve => {
        variable.once('init', resolve);
      });
      assert.equal(await variable.read(), value, 'value is not correct.');
      assert.equal(variable.dataType, dataType, 'dataType is not correct.');
      await client.end();
    });

    it('should be able to write value', async function() {
      let client = new Mi5OpcuaClient(endpointUrl);
      //let variable = new clientVariable(client, "ns=4;s=Mi5.Output.Connected", true);

      //connect
      await client.connect();
      //console.log('connected');

      let variable = await client.getVariable(nodeId1);
      await variable.write(20);
      assert.equal(await variable.read(), 20, 'should have set value to 20.');
      await variable.write(10);
      await client.end();
    });

    it('should be informed about changes', async function() {
      let client = new Mi5OpcuaClient(endpointUrl);

      //connect
      await client.connect();
      //console.log('connected');

      let variable = client.getVariable(nodeId2);
      await new Promise(resolve => {
        variable.oneChange(value => {
          //console.log('value: '+value);
          resolve();
        });
      });
      await new Promise(resolve => {
        variable.oneChange(value => {
          //console.log('value: '+value);
          resolve();
        });
      });
      await client.end();
    });

    it('should be able to browse the folders', async function() {
      let client = new Mi5OpcuaClient(endpointUrl);

      //connect
      await client.connect();
      //console.log('connected');

      //browse
      await client.browseInDepthPromise(['RootFolder']);

      //filter
      let nodeArray = client.findPattern([
        'Objects',
        'Server',
        '^ServerCapabilities'
      ]);
      //console.log(nodeArray);
      assert.equal(nodeArray.pop(), 'ns=0;i=2268', 'Did not find ...');
      await client.end();
    });
  });
});
