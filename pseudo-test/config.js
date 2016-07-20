var fs = require('fs');

var ModuleID = '2101';

var folderStructure = require('./folderStructure.json');

var helper = require('./../helper/folderStructureHelper');
var expandFolderStructure = helper.expandFolderStructure;
var setInitValues = helper.setInitValues;

folderStructure = expandFolderStructure(folderStructure);

var valueStatements = [
{
	path: 'Output.Name',
	initValue: 'Cookie Module (Mock)'
},
{
	path: 'Output.ID',
	initValue: 2101
},
{
	path: 'Output.SkillOutput.SkillOutput0.Dummy',
	initValue: false
},
{
	path: 'Output.SkillOutput.SkillOutput0.ID',
	initValue: 1010
}
];

folderStructure = setInitValues(folderStructure, valueStatements);

exports.ServerStructure = {
	moduleName: 'Module'+ModuleID,
	serverInfo: {
		port: 4842, // the port of the listening socket of the server
		resourcePath: "", // this path will be added to the endpoint resource name
		buildInfo : {
			productName: 'Module'+ModuleID, //module name
			buildNumber: "7658",
			buildDate: new Date(2016,3,25)
		}
	},
	rootFolder: "RootFolder",
	baseNodeId: "ns=4;s=MI5.",
	content:{
		Module2101: {
			type: 'Folder',
			content: folderStructure
		}	
	} 
	
};
