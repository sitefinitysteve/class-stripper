const assert = require('assert');
const vscode = require('vscode');
const helper = require('../../helper');

suite('Extension Test Suite', () => {
	vscode.window.showInformationMessage('Start all tests.');

	// Legacy API tests (backward compatibility)
	suite('Legacy API Tests', () => {
		test('Can remove class', () => {
			var rawHtml = `<div class="test"><h1>Some Title</h1></div>`;
			var expectedHtml = `<div><h1>Some Title</h1></div>`;

			assert.equal(helper.stripClasses(rawHtml), expectedHtml);
		});

		test('Can remove style', () => {
			var rawHtml = `<div><h1 style="margin-top: 10px">Some Title</h1></div>`;
			var expectedHtml = `<div><h1>Some Title</h1></div>`;

			assert.equal(helper.stripStyles(rawHtml), expectedHtml);
		});

		test('Can remove class and style', () => {
			var rawHtml = `<div class="test"><h1 style="margin-top: 10px">Some Title</h1></div>`;
			var expectedHtml = `<div><h1>Some Title</h1></div>`;

			assert.equal(helper.stripAll(rawHtml), expectedHtml);
		});

		test('Newlines are preserved', () => {
			var rawHtml = `<div class="test">
							<h1 style="margin-top: 10px">Some Title</h1>
						</div>`;
			var strippedHtml = helper.stripAll(rawHtml);

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

	// New cleanHtml API tests
	suite('cleanHtml API Tests', () => {
		test('Returns object with html, statistics, and error properties', () => {
			var html = `<div class="test">Content</div>`;
			var result = helper.cleanHtml(html);

			assert.ok(result.hasOwnProperty('html'), 'Should have html property');
			assert.ok(result.hasOwnProperty('statistics'), 'Should have statistics property');
			assert.ok(result.hasOwnProperty('error'), 'Should have error property');
		});

		test('Can strip classes with cleanHtml', () => {
			var html = `<div class="test class2">Content</div>`;
			var result = helper.cleanHtml(html, { stripClasses: true, beautify: false });

			assert.ok(!result.html.includes('class='), 'Should not have class attribute');
			assert.ok(result.statistics.classesRemoved === 2, 'Should count removed classes');
		});

		test('Can strip IDs', () => {
			var html = `<div id="myId">Content</div>`;
			var result = helper.cleanHtml(html, { stripIds: true, beautify: false });

			assert.ok(!result.html.includes('id='), 'Should not have id attribute');
			assert.equal(result.statistics.idsRemoved, 1, 'Should count removed IDs');
		});

		test('Can strip data attributes', () => {
			var html = `<div data-foo="bar" data-baz="qux">Content</div>`;
			var result = helper.cleanHtml(html, { stripDataAttributes: true, beautify: false });

			assert.ok(!result.html.includes('data-'), 'Should not have data attributes');
			assert.equal(result.statistics.dataAttributesRemoved, 2, 'Should count removed data attributes');
		});

		test('Can strip event handlers', () => {
			var html = `<button onclick="alert('hi')" onmouseover="doSomething()">Click me</button>`;
			var result = helper.cleanHtml(html, { stripEventHandlers: true, beautify: false });

			assert.ok(!result.html.includes('onclick'), 'Should not have onclick attribute');
			assert.ok(!result.html.includes('onmouseover'), 'Should not have onmouseover attribute');
			assert.equal(result.statistics.eventHandlersRemoved, 2, 'Should count removed event handlers');
		});

		test('Can strip ARIA attributes', () => {
			var html = `<div aria-label="test" aria-hidden="true">Content</div>`;
			var result = helper.cleanHtml(html, { stripAriaAttributes: true, beautify: false });

			assert.ok(!result.html.includes('aria-'), 'Should not have aria attributes');
			assert.equal(result.statistics.ariaAttributesRemoved, 2, 'Should count removed aria attributes');
		});

		test('Can remove tags', () => {
			var html = `<div><script>alert('test')</script><p>Keep this</p></div>`;
			var result = helper.cleanHtml(html, { removeTags: ['script'], beautify: false });

			assert.ok(!result.html.includes('<script>'), 'Should not have script tag');
			assert.ok(result.html.includes('<p>'), 'Should still have p tag');
			assert.equal(result.statistics.tagsRemoved, 1, 'Should count removed tags');
		});

		test('Can remove multiple tag types', () => {
			var html = `<div><script>test</script><style>body{}</style><svg></svg><p>Keep</p></div>`;
			var result = helper.cleanHtml(html, { removeTags: ['script', 'style', 'svg'], beautify: false });

			assert.ok(!result.html.includes('<script>'), 'Should not have script tag');
			assert.ok(!result.html.includes('<style>'), 'Should not have style tag');
			assert.ok(!result.html.includes('<svg>'), 'Should not have svg tag');
			assert.ok(result.html.includes('<p>'), 'Should still have p tag');
			assert.equal(result.statistics.tagsRemoved, 3, 'Should count all removed tags');
		});
	});

	// Class preservation tests
	suite('Class Preservation Tests', () => {
		test('Can preserve specific classes', () => {
			var html = `<div class="keep remove another">Content</div>`;
			var result = helper.cleanHtml(html, {
				stripClasses: true,
				preserveClasses: ['keep'],
				beautify: false
			});

			assert.ok(result.html.includes('class="keep"'), 'Should keep preserved class');
			assert.ok(!result.html.includes('remove'), 'Should remove non-preserved classes');
			assert.equal(result.statistics.classesRemoved, 2, 'Should count only removed classes');
		});

		test('Can preserve multiple classes', () => {
			var html = `<div class="keep1 remove keep2">Content</div>`;
			var result = helper.cleanHtml(html, {
				stripClasses: true,
				preserveClasses: ['keep1', 'keep2'],
				beautify: false
			});

			assert.ok(result.html.includes('keep1'), 'Should keep first preserved class');
			assert.ok(result.html.includes('keep2'), 'Should keep second preserved class');
			assert.ok(!result.html.includes('remove'), 'Should remove non-preserved class');
		});

		test('Can preserve classes with regex pattern', () => {
			var html = `<div class="container container-fluid nav-item remove">Content</div>`;
			var result = helper.cleanHtml(html, {
				stripClasses: true,
				preserveClasses: [/^container/],
				beautify: false
			});

			assert.ok(result.html.includes('container'), 'Should keep classes matching regex');
			assert.ok(result.html.includes('container-fluid'), 'Should keep classes matching regex');
			assert.ok(!result.html.includes('nav-item'), 'Should remove non-matching classes');
			assert.ok(!result.html.includes('remove'), 'Should remove non-matching classes');
		});

		test('Can mix string and regex patterns', () => {
			var html = `<div class="exact-match prefix-test another-prefix remove">Content</div>`;
			var result = helper.cleanHtml(html, {
				stripClasses: true,
				preserveClasses: ['exact-match', /^prefix-/],
				beautify: false
			});

			assert.ok(result.html.includes('exact-match'), 'Should keep exact match');
			assert.ok(result.html.includes('prefix-test'), 'Should keep regex match');
			assert.ok(!result.html.includes('another-prefix'), 'Should remove non-matching prefix');
			assert.ok(!result.html.includes('remove'), 'Should remove non-preserved class');
		});
	});

	// HTML optimization tests
	suite('HTML Optimization Tests', () => {
		test('Can remove empty divs', () => {
			var html = `<div><div></div><p>Content</p></div>`;
			var result = helper.cleanHtml(html, {
				optimizeHtml: true,
				removeEmptyDivs: true,
				beautify: false
			});

			// Count div occurrences
			var divCount = (result.html.match(/<div>/g) || []).length;
			assert.equal(divCount, 1, 'Should remove empty div, keeping only outer div');
			assert.ok(result.html.includes('<p>'), 'Should keep content');
			assert.equal(result.statistics.emptyDivsRemoved, 1, 'Should count removed empty divs');
		});

		test('Can remove nested empty divs', () => {
			var html = `<div><div><div></div></div><p>Content</p></div>`;
			var result = helper.cleanHtml(html, {
				optimizeHtml: true,
				removeEmptyDivs: true,
				beautify: false
			});

			var divCount = (result.html.match(/<div>/g) || []).length;
			assert.equal(divCount, 1, 'Should remove all nested empty divs');
			assert.ok(result.statistics.emptyDivsRemoved >= 2, 'Should count all removed empty divs');
		});

		test('Can bubble up wrapper divs', () => {
			var html = `<div><div><div><p>Content</p></div></div></div>`;
			var result = helper.cleanHtml(html, {
				optimizeHtml: true,
				bubbleUpWrapperDivs: true,
				removeEmptyDivs: false,
				beautify: false
			});

			assert.ok(result.statistics.divsBubbledUp > 0, 'Should bubble up wrapper divs');
			assert.ok(result.html.includes('<p>'), 'Should preserve content');
		});

		test('Does not remove divs with text content', () => {
			var html = `<div>Text content</div>`;
			var result = helper.cleanHtml(html, {
				optimizeHtml: true,
				removeEmptyDivs: true,
				beautify: false
			});

			assert.ok(result.html.includes('<div>'), 'Should keep div with text');
			assert.equal(result.statistics.emptyDivsRemoved, 0, 'Should not count as removed');
		});
	});

	// Complex integration tests
	suite('Complex Integration Tests', () => {
		test('Can handle complex nested HTML', () => {
			var html = `
				<div class="outer" id="main" data-test="value">
					<div class="inner" style="color: red">
						<h1 class="title">Test</h1>
						<p class="text" onclick="alert('hi')">Content</p>
					</div>
				</div>
			`;
			var result = helper.cleanHtml(html, {
				stripClasses: true,
				stripIds: true,
				stripStyles: true,
				stripDataAttributes: true,
				stripEventHandlers: true,
				optimizeHtml: true
			});

			assert.ok(!result.html.includes('class='), 'Should remove all classes');
			assert.ok(!result.html.includes('id='), 'Should remove all IDs');
			assert.ok(!result.html.includes('style='), 'Should remove all styles');
			assert.ok(!result.html.includes('data-'), 'Should remove all data attributes');
			assert.ok(!result.html.includes('onclick'), 'Should remove all event handlers');
			assert.ok(result.html.includes('<h1>'), 'Should preserve structure');
			assert.ok(result.html.includes('Content'), 'Should preserve content');
		});

		test('Can handle mixed attribute types', () => {
			var html = `<div class="test" id="myid" style="color:blue" data-foo="bar" onclick="void(0)" aria-label="test">Content</div>`;
			var result = helper.cleanHtml(html, {
				stripClasses: true,
				stripIds: true,
				stripStyles: true,
				stripDataAttributes: true,
				stripEventHandlers: true,
				stripAriaAttributes: true,
				beautify: false
			});

			assert.equal(result.html, '<div>Content</div>', 'Should strip all attributes');
			assert.ok(result.statistics.classesRemoved > 0);
			assert.ok(result.statistics.idsRemoved > 0);
			assert.ok(result.statistics.stylesRemoved > 0);
			assert.ok(result.statistics.dataAttributesRemoved > 0);
			assert.ok(result.statistics.eventHandlersRemoved > 0);
			assert.ok(result.statistics.ariaAttributesRemoved > 0);
		});

		test('Selective stripping works correctly', () => {
			var html = `<div class="test" id="myid" style="color:blue">Content</div>`;
			var result = helper.cleanHtml(html, {
				stripClasses: true,
				stripIds: false,
				stripStyles: false,
				beautify: false
			});

			assert.ok(!result.html.includes('class='), 'Should remove classes');
			assert.ok(result.html.includes('id='), 'Should keep IDs');
			assert.ok(result.html.includes('style='), 'Should keep styles');
		});

		test('Works with self-closing tags', () => {
			var html = `<div class="test"><img src="test.jpg" class="image" /><br class="break" /></div>`;
			var result = helper.cleanHtml(html, {
				stripClasses: true,
				beautify: false
			});

			assert.ok(!result.html.includes('class='), 'Should remove all classes including from self-closing tags');
			assert.ok(result.html.includes('src='), 'Should preserve other attributes');
		});

		test('Handles multiple elements with same attributes', () => {
			var html = `
				<div class="test">One</div>
				<div class="test">Two</div>
				<div class="test">Three</div>
			`;
			var result = helper.cleanHtml(html, { stripClasses: true });

			var classCount = (result.html.match(/class=/g) || []).length;
			assert.equal(classCount, 0, 'Should remove all class attributes');
			assert.equal(result.statistics.classesRemoved, 3, 'Should count all removed classes');
		});
	});

	// Error handling tests
	suite('Error Handling Tests', () => {
		test('Handles empty string input', () => {
			var result = helper.cleanHtml('');

			assert.equal(result.html, '', 'Should return empty string');
			assert.ok(result.error, 'Should have error message');
		});

		test('Handles null input', () => {
			var result = helper.cleanHtml(null);

			assert.equal(result.html, '', 'Should return empty string');
			assert.ok(result.error, 'Should have error message');
		});

		test('Handles non-string input', () => {
			var result = helper.cleanHtml(12345);

			assert.equal(result.html, '', 'Should return empty string');
			assert.ok(result.error, 'Should have error message');
		});

		test('Handles malformed HTML gracefully', () => {
			var html = `<div class="test"><p>Unclosed paragraph<div>`;
			var result = helper.cleanHtml(html, { stripClasses: true });

			// Should still process what it can
			assert.ok(result.html, 'Should return some HTML');
		});
	});

	// Statistics tracking tests
	suite('Statistics Tracking Tests', () => {
		test('Statistics can be disabled', () => {
			var html = `<div class="test">Content</div>`;
			var result = helper.cleanHtml(html, {
				trackStatistics: false,
				stripClasses: true
			});

			assert.equal(result.statistics, null, 'Statistics should be null when disabled');
		});

		test('Statistics tracks all operations', () => {
			var html = `
				<div class="c1 c2" id="id1" style="color:red" data-x="1" onclick="void(0)" aria-label="test">
					<div></div>
					<p class="text">Content</p>
				</div>
			`;
			var result = helper.cleanHtml(html, {
				stripClasses: true,
				stripIds: true,
				stripStyles: true,
				stripDataAttributes: true,
				stripEventHandlers: true,
				stripAriaAttributes: true,
				optimizeHtml: true,
				removeEmptyDivs: true
			});

			assert.ok(result.statistics.classesRemoved >= 3, 'Should count classes');
			assert.ok(result.statistics.idsRemoved >= 1, 'Should count IDs');
			assert.ok(result.statistics.stylesRemoved >= 1, 'Should count styles');
			assert.ok(result.statistics.dataAttributesRemoved >= 1, 'Should count data attributes');
			assert.ok(result.statistics.eventHandlersRemoved >= 1, 'Should count event handlers');
			assert.ok(result.statistics.ariaAttributesRemoved >= 1, 'Should count aria attributes');
			assert.ok(result.statistics.elementsProcessed > 0, 'Should count processed elements');
		});
	});

	// Beautification tests
	suite('Beautification Tests', () => {
		test('Can disable beautification', () => {
			var html = `<div class="test"><p>Content</p></div>`;
			var result = helper.cleanHtml(html, {
				beautify: false,
				stripClasses: true
			});

			// Should be on one line when not beautified
			assert.ok(!result.html.includes('\n  '), 'Should not have indentation when beautify is false');
		});

		test('Beautification formats HTML nicely', () => {
			var html = `<div class="test"><div class="inner"><p>Content</p></div></div>`;
			var result = helper.cleanHtml(html, {
				beautify: true,
				stripClasses: true,
				indentSize: 2
			});

			// Should have proper indentation
			assert.ok(result.html.length > html.length, 'Beautified HTML should be longer due to formatting');
		});
	});
});
