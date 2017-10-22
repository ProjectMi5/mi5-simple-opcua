/**
 * 
 * Created by Dominik on 25.04.2016.
 * Based on sample_client.js from https://github.com/node-opcua/node-opcua/blob/master/documentation/sample_client.js
 *
 */

/*global require,console,setTimeout */
var opcua = require("node-opcua");
var async = require("async");
var Q = require("q");
var should = require("should");
var EventEmitter = require('events').EventEmitter;
var util = require('util');
var debug = require('debug')('mi5-simple-opcua:client');
//debug.log = console.log.bind(console); // --> debug goes to stdout
//var the_session, the_subscription, eventEmitter;

util.inherits(OpcuaClient, EventEmitter);

function OpcuaClient(endpointUrl, callback){
	self = this;
	EventEmitter.call(this);
	this.client = new opcua.OPCUAClient();

	
	connect(self.client, endpointUrl)
		.then(createSession)
		.then(subscribe)
		.then(function(){
			self.emit('connect');
			callback();
		})
		.catch(function(err){
			console.error(err);
			self.emit('error', err);
			callback(err);

		});
}

function connect(client, endpointUrl){
	var deferred = Q.defer();

	client.connect(endpointUrl,function (err) {
		if(err) {
			deferred.reject(err);
		} else {
			debug("connected to opcua server at " + endpointUrl);
			deferred.resolve();
		}
	});
	
	return deferred.promise;
	
}

function createSession(){
	var deferred = Q.defer();
	var self = this;
	
	self.client.createSession(function(err,session) {
		if(!err) {
			self.the_session = session;
			deferred.resolve();
		} else {
			deferred.reject(err);
		}
	});
	
	return deferred.promise;
}

function subscribe(){
	var deferred = Q.defer();
	var self = this;
	
	self.the_subscription = new opcua.ClientSubscription(self.the_session,{
	   requestedPublishingInterval: 1000,
	   requestedLifetimeCount: 10,
	   requestedMaxKeepAliveCount: 2,
	   maxNotificationsPerPublish: 10,
	   publishingEnabled: true,
	   priority: 10
    });
   
    self.the_subscription.on("started",function(){
	   debug("subscription started - subscriptionId = ",the_subscription.subscriptionId);
	   deferred.resolve();
    }).on("keepalive",function(){
	   //debug("keepalive");
    }).on("terminated",function(){
	   debug("terminated");
    });
	
	return deferred.promise;
}

OpcuaClient.prototype.readVariable = function(nodeId, callback){
	//debug('nodeId: '+nodeId);
	this.the_session.readVariableValue(nodeId, function(err,dataValue) {
		dataValue.statusCode.should.eql(opcua.StatusCodes.Good);
		if(!err) callback(err, dataValue.value.value);
		else callback(err);
	});	
};

OpcuaClient.prototype.readDatatype = function(nodeId, callback){
	this.the_session.readVariableValue(nodeId, function(err,dataValue) {
		if(!err) {
			dataValue.statusCode.should.eql(opcua.StatusCodes.Good);
			callback(err, dataValue.value.dataType.key);
		} else {callback(err);}
	});
};

OpcuaClient.prototype.monitorItem = function(nodeId){
    var monitoredItem  = this.the_subscription.monitor({
 	   nodeId: opcua.resolveNodeId(nodeId),
 	   attributeId: opcua.AttributeIds.Value
    },
    {
 	   samplingInterval: 100,
 	   discardOldest: true,
 	   queueSize: 10
    },
    opcua.read_service.TimestampsToReturn.Both
    );
	
	return monitoredItem;
};

OpcuaClient.prototype.onChange = function(nodeId, callback){
	var monitoredItem = this.monitorItem(nodeId);
  setTimeout(function(){monitoredItem.on("changed",function(dataValue){
   	  var value = dataValue.value.value;
	  //debug(new Date().toString(), nodeId, value);
	  callback(value);	  
    });},10000);
};
    
OpcuaClient.prototype.writeNodeValue = function(nodeId, value, dataType, callback) {

    var nodesToWrite = [
        {
            nodeId: nodeId,
            attributeId: opcua.AttributeIds.Value,
            indexRange: null,
            value: { /* dataValue*/
				// note: most servers reject timestamps written manually here
                value: { /* Variant */
                    dataType: opcua.DataType[dataType],
                    value: value
                }
          }
        }
    ];

    this.the_session.write(nodesToWrite, function (err, statusCodes) {
        if (!err) {
					// debug('statusCodes:'+statusCodes);
					statusCodes.length.should.equal(nodesToWrite.length);
					statusCodes.forEach(function(item){
						item.should.eql(opcua.StatusCodes.Good);
					});
        }
		callback(err);
    });

};

module.exports = OpcuaClient;