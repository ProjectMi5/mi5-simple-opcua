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
var events = require("events");
var client, the_session, the_subscription, eventEmitter;

function OpcuaClient(endpointUrl, callback){
	eventEmitter = new events.EventEmitter();
	client = new opcua.OPCUAClient();

	
	connect(client, endpointUrl)
		.then(createSession)
		.then(subscribe)
		.then(function(){
			eventEmitter.emit('connect');
			callback();
		})
		.catch(function(err){
			console.error(err);
			eventEmitter.emit('error', err);
			callback(err);

		});
}

function connect(client, endpointUrl){
	var deferred = Q.defer();

	client.connect(endpointUrl,function (err) {
		if(err) {
			deferred.reject(err);
		} else {
			console.log("connected to opcua server at " + endpointUrl);
			deferred.resolve();
		}
	});
	
	return deferred.promise;
	
}

function createSession(){
	var deferred = Q.defer();
	
	client.createSession(function(err,session) {
		if(!err) {
			the_session = session;
			deferred.resolve();
		} else {
			deferred.reject(err);
		}
	});
	
	return deferred.promise;
}

function subscribe(){
	var deferred = Q.defer();
	
	the_subscription = new opcua.ClientSubscription(the_session,{
	   requestedPublishingInterval: 1000,
	   requestedLifetimeCount: 10,
	   requestedMaxKeepAliveCount: 2,
	   maxNotificationsPerPublish: 10,
	   publishingEnabled: true,
	   priority: 10
    });
   
    the_subscription.on("started",function(){
	   console.log("subscription started - subscriptionId = ",the_subscription.subscriptionId);
	   deferred.resolve();
    }).on("keepalive",function(){
	   //console.log("keepalive");
    }).on("terminated",function(){
	   console.log("terminated");
    });
	
	return deferred.promise;
}

OpcuaClient.prototype.readVariable = function(nodeId, callback){
	//console.log('nodeId: '+nodeId);
	the_session.readVariableValue(nodeId, function(err,dataValue) {
	   callback(err, dataValue.value.value);
	});	
};

OpcuaClient.prototype.readDatatype = function(nodeId, callback){
	the_session.readVariableValue(nodeId, function(err,dataValue) {
		callback(err, dataValue.value.dataType.key);
	});
};

OpcuaClient.prototype.monitorItem = function(nodeId){
    var monitoredItem  = the_subscription.monitor({
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
	  //console.log(new Date().toString(), nodeId, value);
	  callback(value);	  
    });},10000);
};

OpcuaClient.prototype.on = function(topic, callback){
	eventEmitter.on(topic, callback);
};

OpcuaClient.prototype.once = function(topic, callback){
	eventEmitter.once(topic, callback);
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

    the_session.write(nodesToWrite, function (err, statusCodes) {
        if (!err) {
			// console.log('statusCodes:'+statusCodes);
            statusCodes.length.should.equal(nodesToWrite.length);
            statusCodes.forEach(function(item){
				item.should.eql(opcua.StatusCodes.Good);
			});
        }
		callback(err);
    });

};

module.exports = OpcuaClient;