const Mi5OpcuaServer = require('./../models/opcua-server');
const content = {
  Mi5: {
    type: 'Folder',
    content: {
      Output: {
        type: 'Folder',
        content: {
          Connected: {
            type: 'Variable',
            dataType: 'Boolean',
            initValue: true
          },
          Voltage: {
            type: 'Variable',
            dataType: 'Double',
            initValue: 2.345
          }
        }
      },
      Input: {
        type: 'Folder',
        content: {
          Methode: {
            type: 'Method'
          },
          Auto: {
            type: 'Object'
          }
        }
      }
    }
  }
};
let server;

describe('Mi5 OPC UA Server', function() {
  describe('Server', function() {
    it('should start the server without error', function() {
      server = new Mi5OpcuaServer(4841, { content: content });
    });

    it('should do soemthing else', function() {
      let variable = server.getVariable('ns=4;s=Mi5.Output.Connected');
      variable.onChange(console.log);
    });
  });
});
