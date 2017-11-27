/**
 *
 * Created by Dominik on 25.04.2016.
 * Based on sample_client.js from https://github.com/node-opcua/node-opcua/blob/master/documentation/sample_client.js
 *
 */

/*global require,console,setTimeout */
/*global require,setInterval,console */
//process.env.debug = "mi5-simple-opcua:*";
const Promise = require('bluebird');
const opcua = Promise.promisifyAll(require('node-opcua'), {suffix: 'Promise'});
const serverVariable = require('./opcua-server-variable');
const should = require("should");
//const opcua = require('node-opcua');
const debug = require('debug')('mi5-simple-opcua:client');
const assert = require('assert');
const EventEmitter = require('events');
const defaultSubscriptionSettings = {
  requestedPublishingInterval: 200,
  requestedLifetimeCount: 10,
  requestedMaxKeepAliveCount: 2,
  maxNotificationsPerPublish: 10,
  publishingEnabled: true,
  priority: 10
};

class OpcuaClient extends EventEmitter {
  constructor(endpointUrl, subscribe = true, subscriptionSettings) {
    super(); //event emitter
    this.endpointUrl = endpointUrl;
    this.sub = subscribe;
    this.subscriptionSettings = subscriptionSettings;
    this.client = new opcua.OPCUAClient();
    this.numberOfBrowsers = 0;
    this.folderStructure = {
      RootFolder: {nodeId: 'RootFolder', name: 'RootFolder'}
    };
  }

  async connect() {
    let self = this;
    //connect
    await this.client.connectPromise(self.endpointUrl);
    debug("connected to opcua server at " + self.endpointUrl);
    //create session
    this.connected = true;
    this.session = await self.client.createSessionPromise();
    //subscribe
    if (this.sub)
      await this.subscribe();
    self.emit('connect');
  }

  async subscribe() {
    let self = this;
    return new Promise(function (resolve, reject) {
      self.subscriptionSettings = _applyDefault(self.subscriptionSettings, defaultSubscriptionSettings);
      self.subscription = new opcua.ClientSubscription(self.session, self.subscriptionSettings);
      self.subscription.on("started", function () {
        debug("subscription started - subscriptionId = ", self.subscription.subscriptionId);
        resolve();
      }).on("terminated", function () {
        debug("subscription terminated");
      });
    });
  }

  async readVariable(nodeId) {
    //debug('nodeId: '+nodeId);
    let dataValue = await this.session.readVariableValuePromise(nodeId);
    dataValue.statusCode.should.eql(opcua.StatusCodes.Good);
    return dataValue.value.value;
  }

  async readDatatype(nodeId) {
    let dataValue = await this.session.readVariableValuePromise(nodeId);
    dataValue.statusCode.should.eql(opcua.StatusCodes.Good);
    return dataValue.value.dataType.key;
  }

  monitorItem(nodeId, samplingInterval) {
    let self = this;
    assert(self.subscription, 'You can only monitor items after subscribing to the server.');
    return this.subscription.monitor({
        nodeId: opcua.resolveNodeId(nodeId),
        attributeId: opcua.AttributeIds.Value
      },
      {
        samplingInterval: samplingInterval || 100,
        discardOldest: true,
        queueSize: 10
      },
      opcua.read_service.TimestampsToReturn.Both
    );
  }

  onChange(nodeId, callback) {
    let monitoredItem = this.monitorItem(nodeId);
    setTimeout(function () {
      monitoredItem.on("changed", function (dataValue) {
        let value = dataValue.value.value;
        //debug(new Date().toString(), nodeId, value);
        callback(value);
      });
    }, 10000);
  };

  async writeNodeValue(nodeId, value, dataType) {

    let nodesToWrite = [
      {
        nodeId: nodeId,
        attributeId: opcua.AttributeIds.Value,
        indexRange: null,
        value: {
          /* dataValue*/
          // note: most servers reject timestamps written manually here
          value: {
            /* Variant */
            dataType: opcua.DataType[dataType],
            value: value
          }
        }
      }
    ];

    let statusCodes = await this.session.writePromise(nodesToWrite);
    statusCodes.length.should.equal(nodesToWrite.length);
    statusCodes.forEach(function (item) {
      item.should.eql(opcua.StatusCodes.Good);
    });
    return statusCodes

  }

  /**
   * Browses a node with the given nodeId and adds its subitems to folderStructure if not already present.
   * @param {string} nodeId
   * @returns {Promise<Array<string>>} A promise that contains an array of child node ids
   */
  browseNode(nodeId) {
    let self = this;
    return self.session.browsePromise(nodeId)
      .then(function (browse_result) {
        let childNodeIds = [];
        browse_result[0].references.forEach(function (reference) {
          if (reference.isForward === false)
            return;
          if (/Type/.test(reference.nodeClass.toString()))
            return;
          if (/DefaultConfiguration/.test(reference.browseName.name))
            return;
          let childNodeId = reference.nodeId.toString();
          childNodeIds.push(childNodeId);
          if (typeof self.folderStructure[childNodeId] !== 'undefined')
            return;
          self.folderStructure[childNodeId] = {
            name: reference.browseName.name,
            nodeId: childNodeId,
            nodeClass: reference.nodeClass
          };
        });
        self.folderStructure[nodeId].subItems = childNodeIds;
      });
  }

  async browseInDepthPromise(nodeArray) {
    let self = this;
    return new Promise(function (resolve, reject) {
      self.browseInDepth(nodeArray, function () {
        resolve(nodeArray);
      });
    });
  }

  /**
   *
   * @param nodeIdArray
   * @param callback
   */
  browseInDepth(nodeIdArray, callback) {
    let self = this;
    //console.log('browseInDepth: nodeIdArray:' + nodeIdArray.toString() + ' numberOfBrowsers: ' + self.numberOfBrowsers);
    if ((nodeIdArray.length === 0) && (self.numberOfBrowsers === 0)) {
      return callback();
    }
    self.numberOfBrowsers += nodeIdArray.length;
    nodeIdArray.forEach(function (item, index, array) {
      //console.log(self.folderStructure[item]);
      if (typeof self.folderStructure[item].subItems !== 'undefined') {
        self.numberOfBrowsers--;
        return self.browseInDepth([], callback);
      }
      self.browseNode(item)
        .then(function () {
          self.numberOfBrowsers--;
          self.browseInDepth(self.folderStructure[item].subItems, callback);
        });
    });
  }

  /**
   * 
   * @param patternArray
   * @returns {*}
   */
  findPattern(patternArray) {
    if (patternArray.length === 0)
      return [];
    let copy = JSON.parse(JSON.stringify(patternArray));
    copy.reverse();
    let firstMatches = this.findItemAnywhere(copy.pop());
    return this.findItemsRecursive(firstMatches, copy);
  }

  /**
   * Find an item anywhere who's name matches the regExp
   * @param {String} re2 String of regular Expression in re2 Syntax
   * @returns {Promise<Array<node>>} A promise that contains an array of child nodes in the form
   * <pre><code>{ name: 'Module2001',
   * nodeClass: { key: 'Variable', value: 2 },
   * nodeId: 'ns=4;s=MI5.Module2001',
   * subItems:
   *   [ 'ns=4;s=MI5.Module2001.Input',
   *     'ns=4;s=MI5.Module2001.Output' ] }
   * </code></pre>
   */
  findItemAnywhere(re2) {
    let self = this;
    let folderStructure = this.folderStructure;
    let result = [];
    let reg = new RegExp(re2);
    for (let key in folderStructure) {
      if (reg.test(folderStructure[key].name)) {
        //console.log(re2+' '+folderStructure[key].name);
        result.push(folderStructure[key]);
      }
    }
    return result;
  }


  /**
   *
   * @param nodesArray
   * @param patternArrayReverse
   * @returns {*}
   */
  findItemsRecursive(nodesArray, patternArrayReverse) {
    //console.log('pattern array reverse: '+patternArrayReverse);
    if (patternArrayReverse.length === 0)
      return nodesArray;
    let self = this;
    let re2filter = new RegExp(patternArrayReverse.pop());
    let result = [];

    nodesArray.forEach(function (item) {
      self.folderStructure[item.nodeId].subItems.forEach(function (subItem) {
        //console.log(re2filter+' '+self.folderStructure[subItem].name);
        if (re2filter.test(self.folderStructure[subItem].name)) {
          result.push(self.folderStructure[subItem]);
        }
      });
    });

    return self.findItemsRecursive(result, patternArrayReverse);
  }

}


function _applyDefault(object, defaultObject) {
  if (!object)
    return defaultObject;
  for (let key in defaultObject) {
    if (typeof object[key] === 'undefined') {
      object[key] = defaultObject[key];
    }
  }
  return object;
}

module.exports = OpcuaClient;