/* eslint-disable no-unused-vars */
// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
const vscode = require('vscode');
const parser = require('node-html-parser');
const helper = require('./helper');

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed

/**
 * @param {vscode.ExtensionContext} context
 */
function activate(context) {
	context.subscriptions.push(vscode.commands.registerCommand('class-stripper.cleanClassAndStyle', function() {
		// Get the active text editor
		const editor = vscode.window.activeTextEditor;

		if (editor) {
			const document = editor.document;
			const selection = editor.selection;
			
			if(!selection.isEmpty){
				try{
					var selectedText = document.getText(selection);

					// Get the word within the selection
					if(helper.isValidHtml(selectedText)){
						var resultingHtml = helper.stripHtml(selectedText, true, true);

						editor.edit(editBuilder => {
							editBuilder.replace(selection, resultingHtml);
						});
					}else {
						vscode.window.showInformationMessage('Class Stripper: Invalid HTML');
					}
				}catch(err){
					vscode.window.showInformationMessage('Class Stripper: Invalid HTML');
				}
			}else{
				vscode.window.showInformationMessage('Class Stripper: Select some HTML please!');
			}
		}
	}));
}


// this method is called when your extension is deactivated
function deactivate() {}

module.exports = {
	activate,
	deactivate
}
