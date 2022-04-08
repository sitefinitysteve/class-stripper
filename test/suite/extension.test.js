const assert = require('assert');

// You can import and use all API from the 'vscode' module
// as well as import your extension to test it
const vscode = require('vscode');
const helper = require('../../helper');

suite('Extension Test Suite', () => {
	vscode.window.showInformationMessage('Start all tests.');

	test('Can remove class', () => {
		var rawHtml = `<div class="test"><h1>Some Title</h1></div>`;
		var expectedHtml = `<div><h1>Some Title</h1></div>`;

		assert.equal(helper.stripHtml(rawHtml), expectedHtml);
	});

	test('Can remove style', () => {
		var rawHtml = `<div><h1 style="margin-top: 10px">Some Title</h1></div>`;
		var expectedHtml = `<div><h1>Some Title</h1></div>`;

		assert.equal(helper.stripHtml(rawHtml), expectedHtml);
	});

	test('Can remove class and style', () => {
		var rawHtml = `<div class="test"><h1 style="margin-top: 10px">Some Title</h1></div>`;
		var expectedHtml = `<div><h1>Some Title</h1></div>`;

		assert.equal(helper.stripHtml(rawHtml), expectedHtml);
	});

	test('Newlines are preserved', () => {
		var rawHtml = `<div class="test">
							<h1 style="margin-top: 10px">Some Title</h1>
						</div>`;
		var strippedHtml = helper.stripHtml(rawHtml);

		assert.ok(rawHtml.includes("\n"));
		assert.ok(strippedHtml.includes("\n"));
	});

	test('Can detect invalid Html', () => {
		var goodHtml = `<div class="test"></div>`;
		var malformedHtml = `<div class="test"></div`;
		var wtfNotHtmlAtAll = `This is not html, it's text`;
		
		assert.ok(helper.isValidHtml(goodHtml), "Good html should be valid");
		assert.ok(!helper.isValidHtml(malformedHtml), "Malformed html should be invalid");
		assert.ok(!helper.isValidHtml(wtfNotHtmlAtAll), "Wtf is this, not html is invalid");
	});
});
