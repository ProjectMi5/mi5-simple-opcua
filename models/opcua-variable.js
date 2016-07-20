var Q = require('q');


var EventEmitter = require('events').EventEmitter;
var util = require('util');
util.inherits(OpcuaVariable, EventEmitter);

function OpcuaVariable(client, nodeId, initValue){
	var self = this;
	EventEmitter.call(this);
	this.nodeId = nodeId;
	this.client = client;
	this.dataType;
	this.init = false;
	
	if(initValue){
		this.initValue = initValue;
	}
	
	client.readDatatype(nodeId, function(err, value){
		if(!err){
			self.dataType = value;
			self.init = true;
			self.emit('init');
		}
		else{
			console.error('Could not read datatype of nodeId '+nodeId);
			console.error(err);
		}
	});

	this.read(function(value){
		this.value = value;
	});
	
	if(this.initValue){
		this.write(initValue);
		self.value = initValue;
	}
	
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
	if(this.init){
		self.client.writeNodeValue(self.nodeId, value, self.dataType, callback);
	} else {
		self.once('init', function(){
			self.client.writeNodeValue(self.nodeId, value, self.dataType, callback);
		});
	}
	
};

OpcuaVariable.prototype.write = function(value){
	var self = this;
	this.writeCB(value, function(err){
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