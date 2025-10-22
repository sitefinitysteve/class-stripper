// Simple standalone test to validate helper.js without VSCode
const helper = require('../helper');
const assert = require('assert');

console.log('Running simple standalone tests...\n');

let passed = 0;
let failed = 0;

function test(name, fn) {
	try {
		fn();
		console.log(`✓ ${name}`);
		passed++;
	} catch (err) {
		console.log(`✗ ${name}`);
		console.log(`  Error: ${err.message}`);
		failed++;
	}
}

// Legacy API tests
test('Can remove class', () => {
	const rawHtml = `<div class="test"><h1>Some Title</h1></div>`;
	const expectedHtml = `<div><h1>Some Title</h1></div>`;
	assert.equal(helper.stripClasses(rawHtml), expectedHtml);
});

test('Can remove style', () => {
	const rawHtml = `<div><h1 style="margin-top: 10px">Some Title</h1></div>`;
	const expectedHtml = `<div><h1>Some Title</h1></div>`;
	assert.equal(helper.stripStyles(rawHtml), expectedHtml);
});

test('Can remove class and style', () => {
	const rawHtml = `<div class="test"><h1 style="margin-top: 10px">Some Title</h1></div>`;
	const expectedHtml = `<div><h1>Some Title</h1></div>`;
	assert.equal(helper.stripAll(rawHtml), expectedHtml);
});

test('Can detect valid HTML', () => {
	const goodHtml = `<div class="test"></div>`;
	assert.ok(helper.isValidHtml(goodHtml));
});

test('Can detect invalid HTML', () => {
	const malformedHtml = `<div class="test"></div`;
	assert.ok(!helper.isValidHtml(malformedHtml));
});

// New API tests
test('cleanHtml returns correct structure', () => {
	const html = `<div class="test">Content</div>`;
	const result = helper.cleanHtml(html);
	assert.ok(result.hasOwnProperty('html'));
	assert.ok(result.hasOwnProperty('statistics'));
	assert.ok(result.hasOwnProperty('error'));
});

test('Can strip classes with cleanHtml', () => {
	const html = `<div class="test class2">Content</div>`;
	const result = helper.cleanHtml(html, { stripClasses: true, beautify: false });
	assert.ok(!result.html.includes('class='));
	assert.equal(result.statistics.classesRemoved, 2);
});

test('Can strip IDs', () => {
	const html = `<div id="myId">Content</div>`;
	const result = helper.cleanHtml(html, { stripIds: true, beautify: false });
	assert.ok(!result.html.includes('id='));
	assert.equal(result.statistics.idsRemoved, 1);
});

test('Can strip data attributes', () => {
	const html = `<div data-foo="bar" data-baz="qux">Content</div>`;
	const result = helper.cleanHtml(html, { stripDataAttributes: true, beautify: false });
	assert.ok(!result.html.includes('data-'));
	assert.equal(result.statistics.dataAttributesRemoved, 2);
});

test('Can strip event handlers', () => {
	const html = `<button onclick="alert('hi')" onmouseover="doSomething()">Click me</button>`;
	const result = helper.cleanHtml(html, { stripEventHandlers: true, beautify: false });
	assert.ok(!result.html.includes('onclick'));
	assert.ok(!result.html.includes('onmouseover'));
	assert.equal(result.statistics.eventHandlersRemoved, 2);
});

test('Can strip ARIA attributes', () => {
	const html = `<div aria-label="test" aria-hidden="true">Content</div>`;
	const result = helper.cleanHtml(html, { stripAriaAttributes: true, beautify: false });
	assert.ok(!result.html.includes('aria-'));
	assert.equal(result.statistics.ariaAttributesRemoved, 2);
});

test('Can remove tags', () => {
	const html = `<div><script>alert('test')</script><p>Keep this</p></div>`;
	const result = helper.cleanHtml(html, { removeTags: ['script'], beautify: false });
	assert.ok(!result.html.includes('<script>'));
	assert.ok(result.html.includes('<p>'));
	assert.equal(result.statistics.tagsRemoved, 1);
});

test('Can preserve specific classes', () => {
	const html = `<div class="keep remove another">Content</div>`;
	const result = helper.cleanHtml(html, {
		stripClasses: true,
		preserveClasses: ['keep'],
		beautify: false
	});
	assert.ok(result.html.includes('class="keep"'));
	assert.ok(!result.html.includes('remove'));
	assert.equal(result.statistics.classesRemoved, 2);
});

test('Can preserve classes with regex', () => {
	const html = `<div class="container container-fluid remove">Content</div>`;
	const result = helper.cleanHtml(html, {
		stripClasses: true,
		preserveClasses: [/^container/],
		beautify: false
	});
	assert.ok(result.html.includes('container'));
	assert.ok(result.html.includes('container-fluid'));
	assert.ok(!result.html.includes('remove'));
});

test('Can remove empty divs', () => {
	const html = `<div><div></div><p>Content</p></div>`;
	const result = helper.cleanHtml(html, {
		optimizeHtml: true,
		removeEmptyDivs: true,
		beautify: false
	});
	const divCount = (result.html.match(/<div>/g) || []).length;
	assert.equal(divCount, 1);
	assert.equal(result.statistics.emptyDivsRemoved, 1);
});

test('Can handle complex nested HTML', () => {
	const html = `<div class="outer" id="main" data-test="value"><div class="inner" style="color: red"><h1 class="title">Test</h1><p class="text" onclick="alert('hi')">Content</p></div></div>`;
	const result = helper.cleanHtml(html, {
		stripClasses: true,
		stripIds: true,
		stripStyles: true,
		stripDataAttributes: true,
		stripEventHandlers: true,
		optimizeHtml: true
	});
	assert.ok(!result.html.includes('class='));
	assert.ok(!result.html.includes('id='));
	assert.ok(!result.html.includes('style='));
	assert.ok(!result.html.includes('data-'));
	assert.ok(!result.html.includes('onclick'));
	assert.ok(result.html.includes('<h1>'));
	assert.ok(result.html.includes('Content'));
});

test('Handles empty string input', () => {
	const result = helper.cleanHtml('');
	assert.equal(result.html, '');
	assert.ok(result.error);
});

test('Handles null input', () => {
	const result = helper.cleanHtml(null);
	assert.equal(result.html, '');
	assert.ok(result.error);
});

test('Statistics can be disabled', () => {
	const html = `<div class="test">Content</div>`;
	const result = helper.cleanHtml(html, {
		trackStatistics: false,
		stripClasses: true
	});
	assert.equal(result.statistics, null);
});

test('Can strip all attribute types simultaneously', () => {
	const html = `<div class="test" id="myid" style="color:blue" data-foo="bar" onclick="void(0)" aria-label="test">Content</div>`;
	const result = helper.cleanHtml(html, {
		stripClasses: true,
		stripIds: true,
		stripStyles: true,
		stripDataAttributes: true,
		stripEventHandlers: true,
		stripAriaAttributes: true,
		beautify: false
	});
	assert.equal(result.html, '<div>Content</div>');
	assert.ok(result.statistics.classesRemoved > 0);
	assert.ok(result.statistics.idsRemoved > 0);
	assert.ok(result.statistics.stylesRemoved > 0);
	assert.ok(result.statistics.dataAttributesRemoved > 0);
	assert.ok(result.statistics.eventHandlersRemoved > 0);
	assert.ok(result.statistics.ariaAttributesRemoved > 0);
});

console.log(`\n${passed} passed, ${failed} failed`);

if (failed > 0) {
	process.exit(1);
} else {
	console.log('\nAll tests passed! ✓');
	process.exit(0);
}
