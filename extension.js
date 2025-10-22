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
						// Use the new cleanHtml API with default options
						const result = helper.cleanHtml(selectedText, {
							stripClasses: true,
							stripStyles: true,
							optimizeHtml: true,
							trackStatistics: true
						});

						if (result.error) {
							vscode.window.showErrorMessage(`Class Stripper: ${result.error}`);
							return;
						}

						editor.edit(editBuilder => {
							editBuilder.replace(selection, result.html);
						});

						// Show statistics to the user
						if (result.statistics) {
							const stats = result.statistics;
							const messages = [];

							if (stats.classesRemoved > 0) messages.push(`${stats.classesRemoved} classes`);
							if (stats.stylesRemoved > 0) messages.push(`${stats.stylesRemoved} styles`);
							if (stats.emptyDivsRemoved > 0) messages.push(`${stats.emptyDivsRemoved} empty divs`);
							if (stats.divsBubbledUp > 0) messages.push(`${stats.divsBubbledUp} wrapper divs`);

							if (messages.length > 0) {
								vscode.window.showInformationMessage(
									`Class Stripper: Removed ${messages.join(', ')}`
								);
							} else {
								vscode.window.showInformationMessage('Class Stripper: No changes needed');
							}
						}
					}else {
						vscode.window.showInformationMessage('Class Stripper: Invalid HTML');
					}
				}catch(err){
					vscode.window.showErrorMessage(`Class Stripper: ${err.message || 'Invalid HTML'}`);
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
