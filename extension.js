// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
const vscode = require('vscode');
const parser = require('node-html-parser');

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed

/**
 * @param {vscode.ExtensionContext} context
 */
function activate(context) {

	// The command has been defined in the package.json file
	// Now provide the implementation of the command with  registerCommand
	// The commandId parameter must match the command field in package.json
	let disposable = vscode.commands.registerCommand('class-stripper.cleanClasses', function () {
		// Get the active text editor
		const editor = vscode.window.activeTextEditor;

		if (editor) {
			const document = editor.document;
			const selection = editor.selection;

			if(!selection.isEmpty){
				try{
					var selectedText = document.getText(selection);

					// Get the word within the selection
					if(parser.valid(selectedText)){
						const root = parser.parse(selectedText);
					
						root.querySelectorAll("[class]" ).forEach(function(el) {
							el.removeAttribute("class");
						});

						editor.edit(editBuilder => {
							editBuilder.replace(selection, root.toString());
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
	});

	context.subscriptions.push(disposable);
}

// this method is called when your extension is deactivated
function deactivate() {}

module.exports = {
	activate,
	deactivate
}
