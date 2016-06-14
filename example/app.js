/**
 * Created by Dominik on 25.04.2016.
 */

var server = require('./../index').OpcuaServer;

var client;
var OpcuaClient = require('./../index').OpcuaClient;
var OpcuaVariable = require('./../index').OpcuaVariable; 

var config = require('./config')

var endpointUrl = "opc.tcp://" + require("os").hostname() + ":" + config.ServerStructure.serverInfo.port;
var baseNodeIdInput = config.ServerStructure.baseNodeId + '.' + config.ServerStructure.moduleName + '.Input.SkillInput.SkillInput0.';
var baseNodeIdOutput = config.ServerStructure.baseNodeId + '.' + config.ServerStructure.moduleName + '.Output.SkillOutput.SkillOutput0.';

server = server.newOpcuaServer(config.ServerStructure);
