var Q = require('q');

var instance;

function OpcuaVariable(client, nodeId){
    this.nodeId = nodeId;
    this.client = client;
		client.readDatatype(nodeId, function(err, value){
			this.dataType = value;
		});
    instance = this;

}

OpcuaVariable.prototype.read = function(callback){
	instance.client.readVariable(this.nodeId, callback);
};

OpcuaVariable.prototype.readQ = function(){
	var deferred = Q.defer();
	instance.client.readVariable(this.nodeId, function(err, value){
		if(!err){
			deferred.resolve(value);
		} else {
			deferred.reject(err);
		}
	});
	return deferred.promise;
};

OpcuaVariable.prototype.write = function(value){
    instance.client.writeNodeValue(this.nodeId, value, this.dataType, function(err){
		if(err)
			console.error(err);
	});
};

OpcuaVariable.prototype.onChange = function(callback){
  var self = instance;
  self.client.onChange(this.nodeId, callback);
};

module.exports = OpcuaVariable;