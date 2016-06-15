var Q = require('q');

var self;
var dataType;
var self;

var EventEmitter = require('events').EventEmitter;
var util = require('util');
util.inherits(OpcuaVariable, EventEmitter);

function OpcuaVariable(client, nodeId){
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
    self = this;
	client.read(function(err, value){
		if(err)
			return console.error(error);
		this.value = value;
	});
	client.onChange(nodeId, function(value){
		this.value = value;
		self.emit('change', value);
	});
	
}

OpcuaVariable.prototype.read = function(callback){
	self.client.readVariable(this.nodeId, callback);
};

OpcuaVariable.prototype.readQ = function(){
	var deferred = Q.defer();
	self.client.readVariable(this.nodeId, function(err, value){
		if(!err){
			deferred.resolve(value);
		} else {
			deferred.reject(err);
		}
	});
	return deferred.promise;
};

OpcuaVariable.prototype.writeCB = function(value, callback){
    self.client.writeNodeValue(this.nodeId, value, dataType, callback);
};

OpcuaVariable.prototype.write = function(value){
    self.client.writeNodeValue(this.nodeId, value, dataType, function(err){
		if(err)
			console.error(err);
	});
};

OpcuaVariable.prototype.onChange = function(callback){
  self.on('change', callback);
};

OpcuaVariable.prototype.oneChange = function(callback){
  self.once('change', callback);
};

module.exports = OpcuaVariable;