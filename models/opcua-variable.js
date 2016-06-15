var Q = require('q');

var dataType;

var EventEmitter = require('events').EventEmitter;
var util = require('util');
util.inherits(OpcuaVariable, EventEmitter);

function OpcuaVariable(client, nodeId){
	var self = this;
	EventEmitter.call(this);
	this.nodeId = nodeId;
	this.client = client;
	client.readDatatype(nodeId, function(err, value){
		if(!err)
			dataType = value;
		else{
			console.error('Could not read datatype of nodeId '+nodeId);
			console.error(err);
		}
	});

	this.read(function(value){
		this.value = value;
	});
	client.onChange(nodeId, function(value){
		self.value = value;
		self.emit('change', value);
	});
	
}

OpcuaVariable.prototype.read = function(callback){
	var self = this;
	this.client.readVariable(self.nodeId, callback);
};

OpcuaVariable.prototype.readQ = function(){
	var deferred = Q.defer();
	var self = this;
	this.client.readVariable(self.nodeId, function(err, value){
		if(!err){
			deferred.resolve(value);
		} else {
			deferred.reject(err);
		}
	});
	return deferred.promise;
};

OpcuaVariable.prototype.writeCB = function(value, callback){
	var self = this;
	this.client.writeNodeValue(self.nodeId, value, dataType, callback);
};

OpcuaVariable.prototype.write = function(value){
	var self = this;
	this.client.writeNodeValue(self.nodeId, value, dataType, function(err){
		if(err)
			console.error(err);
	});
};

OpcuaVariable.prototype.onChange = function(callback){
  this.on('change', callback);
};

OpcuaVariable.prototype.oneChange = function(callback){
  this.once('change', callback);
};

module.exports = OpcuaVariable;