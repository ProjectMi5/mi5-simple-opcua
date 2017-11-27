const EventEmitter = require('events').EventEmitter;
const debug = require('debug');

class OpcuaClientVariable extends EventEmitter {
  constructor(client, nodeId, subscribe = false, writeInitValue = null){
    super();
    let self = this;
    this.debug = debug('mi5-simple-opcua:variable:'+nodeId);

    this.nodeId = nodeId;
    this.client = client;
    this.initialized = false;
    this.writeInitValue = writeInitValue;

    if(!subscribe)
      this.subscribedFromBeginning = false;
    else{
      this.subscribedFromBeginning = true;
    }

    if(client.connected)
      self.init();
    else {
      client.once('connect', function(){
        self.init();
      })
    }



    self.on('change', function(value){
      self.value = value;
    });

  }

  init(){
    let self = this;
    if(self.subscribedFromBeginning)
      self.subscribe();
    self.client.readDatatype(self.nodeId)
      .then(function(value){
        self.dataType = value;
        self.initialized = true;
        self.emit('init');
      })
      .catch(function(err){
        console.error('Could not read datatype of nodeId '+nodeId);
        console.error(err);
      });

    this.read()
      .then(function(value){
        self.value = value;
      })
      .catch(console.error);

    if(self.writeInitValue !== null){
      this.initValue = self.writeInitValue;
      this.write(self.initValue);
      self.value = self.initValue;
    }
  }

  subscribe(){
    let self = this;
    if(this.monitoredItem)
      return self.debug('is already being monitored.');
    this.monitoredItem = this.client.monitorItem(self.nodeId);
    setTimeout(function(){
      self.emit('subscribed');
      self.monitoredItem.on("changed",function(dataValue){
        let value = dataValue.value.value;
        //debug(new Date().toString(), nodeId, value);
        self.emit("change", value);
      });
    },5000);
  }

  unsubscribe(){
    if(this.monitoredItem){
      this.monitoredItem.terminate();
      delete this.monitoredItem;
      delete this.value;
    } else {
      this.debug('is already unsubscribed.');
    }
  }

  async read(){
    let self = this;
    return await this.client.readVariable(self.nodeId);
  };

  async write(value){
    let self = this;
    if(this.initialized){
      return await self.client.writeNodeValue(self.nodeId, value, self.dataType);
    } else {
      return new Promise(function(resolve, reject){
        self.once('init', function(){
          self.client.writeNodeValue(self.nodeId, value, self.dataType).then(resolve);
        });
      });
    }

  }

  onChange(callback){
    if(!this.monitoredItem)
      this.subscribe();
    this.on('change', callback);
  }

  oneChange(callback){
    let self = this;

    if(!this.monitoredItem)
      this.subscribe();
    this.once('change', function(value){
      if(self.subscribedFromBeginning === false)
        this.unsubscribe();

      callback(value);
    });
  }





}

module.exports = OpcuaClientVariable;