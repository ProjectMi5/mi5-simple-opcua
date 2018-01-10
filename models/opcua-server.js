/**
 * Created by Dominik Serve on 25.04.2016.
 * Rewritten by Dominik Serve on 21.11.2017.
 * Based on sample_server.js from https://github.com/node-opcua/node-opcua/blob/master/documentation/sample_server.js
 * In this module the server structure can easily be managed with the ServerStructure object. For more information see README.md
 */

/*global require,setInterval,console */
//process.env.debug = "mi5-simple-opcua:*";
const Promise = require('bluebird');
const opcua = Promise.promisifyAll(require('node-opcua'), {
  suffix: 'Promise'
});
const serverVariable = require('./opcua-server-variable');
//const opcua = require('node-opcua');
const debug = require('debug')('mi5-simple-opcua:server');
const EventEmitter = require('events');

const defaultOptions = {
  buildInfo: {
    productName: 'Mi5-Simple-Server',
    buildNumber: '1',
    buildDate: new Date()
  }
};

class OpcuaServer extends EventEmitter {
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
  constructor(port = 4840, ServerStructure = {}, options = defaultOptions) {
    super(); // invoke constructor of EventEmitter
    let self = this;

    // set defaults on deeper object levels
    ServerStructure.resourcePath = ServerStructure.resourcePath || '';
    ServerStructure.rootFolder = ServerStructure.rootFolder || 'RootFolder';
    ServerStructure.baseNodeId = ServerStructure.baseNodeId || 'ns=4;s=';
    ServerStructure.content = ServerStructure.content || {};

    options.port = port;

    this.initialized = false;
    this.running = false;
    this.structure = ServerStructure;
    this.variables = {};
    this.server = new opcua.OPCUAServer(options);
    this.ownAddressSpace = {};

    this.server.initialize(function(error) {
      if (error) return debug(error);
      self.addressSpace = self.server.engine.addressSpace;
      addContentFromStructure(
        self,
        self.structure.baseNodeId,
        self.structure.rootFolder,
        self.structure.content
      );
      debug('server initialized');
      self.initialized = true;
      self.emit('init');
      self.start();
    });
  }

  start() {
    let self = this;
    if (!this.initialized)
      return this.once('init', function() {
        self.start();
      });
    this.server.start(function(error) {
      if (error) return debug(error);
      console.log(
        'Server is now listening ... ( press CTRL+C to stop)\n' +
          'port ' +
          self.server.endpoints[0].port
      );
      let endpointUrl = self.server.endpoints[0].endpointDescriptions()[0]
        .endpointUrl;
      console.log('the primary server endpoint url is ', endpointUrl);
      self.running = true;
      self.emit('running');
    });
    return self;
  }

  async waitForServerToRun() {
    let self = this;
    return new Promise(function(resolve, reject) {
      if (self.running) return resolve();
      self.once('running', resolve);
    });
  }

  stop() {
    let self = this;
    this.server.shutdown(function(err) {
      self.running = false;
      self.emit('stopped');
    });
  }

  /**
   *
   * @param par
   * @param elem
   * @param elem.browseName
   * @param elem.type
   * @param elem.nodeId
   * @param [elem.dataType]
   * @param [elem.initValue]
   * @param [elem.inputArguments] {Array}
   * @param [elem.outputArguments]
   * @param [elem.func]
   * @returns newElement
   */
  addElementToAddressSpace(par, elem) {
    let self = this;
    let newElement;
    let addressSpace = self.addressSpace;

    if (elem.type === 'Folder')
      newElement = addressSpace.addFolder(par, { browseName: elem.browseName });
    else if (elem.type === 'Object')
      newElement = addressSpace.addObject({
        organizedBy: par,
        browseName: elem.browseName
      });
    else if (elem.type === 'Variable') {
      let dummy = self.variables[elem.nodeId];

      if (dummy) dummy.undummy(elem.initValue, elem.dataType);
      else
        self.variables[elem.nodeId] = new serverVariable(
          elem.initValue,
          elem.dataType
        );

      newElement = addressSpace.addVariable({
        componentOf: par,
        browseName: elem.browseName,
        dataType: elem.dataType,
        nodeId: elem.nodeId,
        value: {
          get: function() {
            return new opcua.Variant({
              dataType: opcua.DataType[elem.dataType],
              value: self.variables[elem.nodeId].value
            });
          },
          set: function(variant) {
            self.variables[elem.nodeId].setValue(variant.value);
            return opcua.StatusCodes.Good;
          }
        }
      });
    } else if (elem.type === 'Method') {
      newElement = addressSpace.addMethod(par, {
        browseName: elem.browseName,
        nodeId: elem.nodeId,
        inputArguments: elem.inputArguments || [],
        outputArguments: elem.outputArguments || []
      });

      let defaultFunction = function(inputArguments, context, callback) {
        self.emit('method:' + elem.nodeId, {
          inputArguments: inputArguments,
          context: context
        });
        callback(null, { statusCode: opcua.StatusCodes.Good });
      };
      let methodFunction = elem.func || defaultFunction;
      newElement.bindMethod(methodFunction);
    } else {
      console.error('Unknown type ' + elem.type);
    }
    self.ownAddressSpace[elem.nodeId] = newElement;
    return newElement;
  }

  /**
   *
   * @param baseNodeId
   * @param par nodeId of the parent Folder
   * @param elems
   * @returns {*}
   */
  addStructure(baseNodeId, par, elems) {
    addContentFromStructure(this, baseNodeId, par, elems);
    return elems;
  }

  getVariable(nodeId) {
    if (!this.variables[nodeId])
      this.variables[nodeId] = new serverVariable(null, null, null, true);
    return this.variables[nodeId];
  }
}

module.exports = OpcuaServer;

/**
 *
 * @param self
 * @param baseNodeId
 * @param par
 * @param elems
 */
function addContentFromStructure(self, baseNodeId, par, elems) {
  // for loop is faster than forEach
  for (let key in elems) {
    if (elems.hasOwnProperty(key)) {
      addElementFromStructure(self, baseNodeId, par, key, elems[key]);
    }
  }
}

/**
 *
 * @param self
 * @param baseNodeId
 * @param par
 * @param browseName
 * @param elem
 */
function addElementFromStructure(self, baseNodeId, par, browseName, elem) {
  let newElement, dot;
  if (par !== 'RootFolder') {
    dot = '.';
  } else {
    dot = '';
  }
  if (
    par !== 'RootFolder' &&
    (typeof par === 'string' || par instanceof String)
  ) {
    par = self.ownAddressSpace[par];
  }

  if (elem.nodeId) elem.nodeId = baseNodeId + elem.nodeId;
  else elem.nodeId = baseNodeId + dot + browseName;

  elem.browseName = browseName;

  newElement = self.addElementToAddressSpace(par, elem);
  elem.nodePoint = newElement;

  if (typeof elem.content !== 'undefined') {
    if (elem.type === 'RepeatUnit') {
      throw new Error(
        "The object of type RepeatUnit must not have 'content'. Try the attribute 'unit' instead."
      );
    }
    addContentFromStructure(self, elem.nodeId, newElement, elem.content);
  }
}
