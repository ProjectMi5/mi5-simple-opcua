/**
 * Created by Dominik Serve on 23.11.2017.
 *
 */

const EventEmitter = require('events');

class OpcuaServerVariable {
  /**
   *
   * @param {*} value
   * @param dataType
   * @param {Boolean} [subscribe]
   * @param dummy
   */
  constructor(value, dataType, subscribe, dummy) {
    this.subscribe = subscribe || false;
    this.listeners = [];
    this.oneTimeListeners = [];
    this.dummy = dummy || false;
    if (dummy) return;
    this.value = this.parseByDataType(dataType, value);
    this.dataType = dataType;
  }

  undummy(value, dataType) {
    this.value = this.parseByDataType(dataType, value);
    this.dataType = dataType;
    this.dummy = false;
  }

  onChange(callback) {
    this.subscribe = true;
    this.listeners.push(callback);
  }

  onceChange(callback) {
    this.subscribe = true;
    this.oneTimeListeners.push(callback);
  }

  emit(value) {
    this.oneTimeListeners.forEach(function(callback) {
      callback(value);
    });
    this.oneTimeListeners = [];

    this.listeners.forEach(function(callback) {
      callback(value);
    });
  }

  monitor() {
    this.subscribe = true;
  }

  unmonitor() {
    this.subscribe = false;
    this.listeners = [];
    this.oneTimeListeners = [];
  }

  setValue(value) {
    let self = this;
    value = this.parseByDataType(self.dataType, value);
    if (this.value === value) return;
    this.value = value;
    this.emit(value);
  }

  getValue() {
    return this.value;
  }

  /**
   *
   * @param dataType
   * @param content
   * @returns {*}
   */
  parseByDataType(dataType, content) {
    if (dataType === 'Boolean') {
      return JSON.parse(content);
    } else if (dataType === 'Float' || dataType === 'Double') {
      return parseFloat(content); // in javascript all numbers are 64bit float
    } else if (dataType === 'Integer') {
      return parseInt(content, 10);
    } else {
      return content;
    }
  }
}

module.exports = OpcuaServerVariable;
