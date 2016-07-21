var Q = require('q');


var EventEmitter = require('events').EventEmitter;
var util = require('util');
util.inherits(OpcuaVariable, EventEmitter);

var debug = require('debug');

function OpcuaVariable(client, nodeId, subscribe, writeInitValue){
	var self = this;
	EventEmitter.call(this);
  this.debug = debug('mi5-simple-opcua:variable:'+nodeId);

	this.nodeId = nodeId;
	this.client = client;
  this.initialized = false;

  if(subscribe != null && subscribe === false){
    this.subscribedFromBeginning = false;
  } else {
    this.subscribedFromBeginning = true;
    self.subscribe();
  }
	
	client.readDatatype(nodeId, function(err, value){
		if(!err){
			self.dataType = value;
			self.initialized = true;
			self.emit('init');
		}
		else{
			console.error('Could not read datatype of nodeId '+nodeId);
			console.error(err);
		}
	});

	this.read(function(err, value){
	  if(err)
	    return console.error(err);
		self.value = value;
	});
	
	if(writeInitValue != null){
	  this.initValue = writeInitValue;
		this.write(self.initValue);
		self.value = self.initValue;
	}

  self.on('change', function(value){
    self.value = value;
  });
}

OpcuaVariable.prototype.subscribe = function(){
  var self = this;
  if(this.monitoredItem)
    return self.debug('is already being monitored.');
  this.monitoredItem = this.client.monitorItem(self.nodeId);
  setTimeout(function(){
    self.emit('subscribed');
    self.monitoredItem.on("changed",function(dataValue){
      var value = dataValue.value.value;
      //debug(new Date().toString(), nodeId, value);
      self.emit("change", value);
    });
  },5000);
};

OpcuaVariable.prototype.unsubscribe = function(){
  if(this.monitoredItem){
    this.monitoredItem.terminate();
    delete this.monitoredItem;
    delete this.value;
  } else {
    this.debug('is already unsubscribed.');
  }

};

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
	if(this.initialized){
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
  if(!this.monitoredItem)
    this.subscribe();
  this.on('change', callback);
};

OpcuaVariable.prototype.oneChange = function(callback){
  var self = this;

  if(!this.monitoredItem)
    this.subscribe();
  this.once('change', function(value){
    if(self.subscribedFromBeginning === false)
      this.unsubscribe();

    callback(value);
  });
};

module.exports = OpcuaVariable;