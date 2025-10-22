const parser = require('node-html-parser');
const beautifyPkg = require('js-beautify');
const beautifyHtml = beautifyPkg.html || beautifyPkg;

/**
 * Default options for HTML cleaning
 */
const DEFAULT_OPTIONS = {
	// Attribute stripping options
	stripClasses: true,
	stripIds: false,
	stripStyles: false,
	stripDataAttributes: false,
	stripEventHandlers: false,
	stripAriaAttributes: false,

	// Class whitelist
	preserveClasses: [], // Array of class names or regex patterns to preserve

	// Tag removal options
	removeTags: [], // Array of tag names to remove (e.g., ['script', 'style', 'svg'])

	// HTML optimization
	optimizeHtml: true,
	removeEmptyDivs: true,
	bubbleUpWrapperDivs: true,

	// Beautification options
	beautify: true,
	preserveNewlines: false,
	indentEmptyLines: false,
	indentSize: 2,

	// Statistics tracking
	trackStatistics: true
};

/**
 * Statistics object structure
 */
class CleaningStatistics {
	constructor() {
		this.classesRemoved = 0;
		this.idsRemoved = 0;
		this.stylesRemoved = 0;
		this.dataAttributesRemoved = 0;
		this.eventHandlersRemoved = 0;
		this.ariaAttributesRemoved = 0;
		this.tagsRemoved = 0;
		this.emptyDivsRemoved = 0;
		this.divsBubbledUp = 0;
		this.elementsProcessed = 0;
	}
}

/**
 * Event handler attribute names (common ones)
 */
const EVENT_HANDLER_ATTRIBUTES = [
	'onclick', 'ondblclick', 'onmousedown', 'onmouseup', 'onmouseover',
	'onmousemove', 'onmouseout', 'onfocus', 'onblur', 'onkeypress',
	'onkeydown', 'onkeyup', 'onsubmit', 'onreset', 'onselect',
	'onchange', 'onload', 'onunload', 'onerror', 'onresize', 'onscroll'
];

/**
 * Checks if a class name matches any pattern in the whitelist
 * @param {string} className - The class name to check
 * @param {Array} whitelist - Array of strings or RegExp patterns
 * @returns {boolean}
 */
function isClassWhitelisted(className, whitelist) {
	if (!whitelist || whitelist.length === 0) return false;

	return whitelist.some(pattern => {
		if (pattern instanceof RegExp) {
			return pattern.test(className);
		}
		return className === pattern;
	});
}

/**
 * Gets preserved classes from an element based on whitelist
 * @param {Object} element - HTML element
 * @param {Array} whitelist - Whitelist patterns
 * @returns {string|null}
 */
function getPreservedClasses(element, whitelist) {
	if (!whitelist || whitelist.length === 0) return null;

	const classAttr = element.getAttribute('class');
	if (!classAttr) return null;

	const classes = classAttr.split(/\s+/).filter(Boolean);
	const preservedClasses = classes.filter(cls => isClassWhitelisted(cls, whitelist));

	return preservedClasses.length > 0 ? preservedClasses.join(' ') : null;
}

/**
 * Strips attributes from an element based on options
 * @param {Object} element - HTML element
 * @param {Object} options - Cleaning options
 * @param {Object} stats - Statistics object
 */
function stripAttributes(element, options, stats) {
	stats.elementsProcessed++;

	// Strip classes
	if (options.stripClasses) {
		const classAttr = element.getAttribute('class');
		if (classAttr) {
			const preservedClasses = getPreservedClasses(element, options.preserveClasses);
			if (preservedClasses) {
				element.setAttribute('class', preservedClasses);
				const originalCount = classAttr.split(/\s+/).filter(Boolean).length;
				const preservedCount = preservedClasses.split(/\s+/).filter(Boolean).length;
				stats.classesRemoved += (originalCount - preservedCount);
			} else {
				element.removeAttribute('class');
				stats.classesRemoved += classAttr.split(/\s+/).filter(Boolean).length;
			}
		}
	}

	// Strip IDs
	if (options.stripIds && element.hasAttribute('id')) {
		element.removeAttribute('id');
		stats.idsRemoved++;
	}

	// Strip inline styles
	if (options.stripStyles && element.hasAttribute('style')) {
		element.removeAttribute('style');
		stats.stylesRemoved++;
	}

	// Strip data attributes
	if (options.stripDataAttributes) {
		const attrs = element.attributes || {};
		Object.keys(attrs).forEach(attrName => {
			if (attrName.startsWith('data-')) {
				element.removeAttribute(attrName);
				stats.dataAttributesRemoved++;
			}
		});
	}

	// Strip event handlers
	if (options.stripEventHandlers) {
		EVENT_HANDLER_ATTRIBUTES.forEach(eventAttr => {
			if (element.hasAttribute(eventAttr)) {
				element.removeAttribute(eventAttr);
				stats.eventHandlersRemoved++;
			}
		});
	}

	// Strip ARIA attributes
	if (options.stripAriaAttributes) {
		const attrs = element.attributes || {};
		Object.keys(attrs).forEach(attrName => {
			if (attrName.startsWith('aria-')) {
				element.removeAttribute(attrName);
				stats.ariaAttributesRemoved++;
			}
		});
	}
}

/**
 * Removes specified tags from the DOM
 * @param {Object} root - Root HTML element
 * @param {Array} tagsToRemove - Array of tag names
 * @param {Object} stats - Statistics object
 */
function removeTags(root, tagsToRemove, stats) {
	if (!tagsToRemove || tagsToRemove.length === 0) return;

	tagsToRemove.forEach(tagName => {
		const elements = root.querySelectorAll(tagName.toLowerCase());
		elements.forEach(el => {
			if (el.parentNode) {
				el.parentNode.removeChild(el);
				stats.tagsRemoved++;
			}
		});
	});
}

/**
 * Checks if element has only whitespace text nodes
 * @param {Object} element - HTML element
 * @returns {boolean}
 */
function hasOnlyWhitespaceText(element) {
	const textNodes = element.childNodes.filter(x => x.nodeType === 3); // Text nodes
	return textNodes.every(node => !node.text || node.text.trim() === '');
}

/**
 * Optimizes HTML by removing empty divs and bubbling up wrapper divs
 * Interleaves operations to ensure all empty divs are removed
 * @param {Object} root - Root HTML element
 * @param {Object} options - Cleaning options
 * @param {Object} stats - Statistics object
 */
function optimizeHtml(root, options, stats) {
	if (!options.optimizeHtml) return;

	// Run optimization in multiple passes, interleaving bubble-up and empty removal
	// This ensures that empty divs created by bubbling are also removed
	let globalChanged = true;
	let globalIterations = 0;
	const maxGlobalIterations = 10;

	while (globalChanged && globalIterations < maxGlobalIterations) {
		globalChanged = false;
		globalIterations++;

		// Bubble up wrapper divs (divs that only contain other divs with no text content)
		if (options.bubbleUpWrapperDivs) {
			const divs = root.querySelectorAll('div').filter(d => d.parentNode != null);

			for (const div of divs) {
				// Skip if already removed or doesn't have valid parent hierarchy
				if (!div.parentNode || !div.parentNode.parentNode) continue;

				const elementNodes = div.childNodes.filter(x => x.nodeType === 1); // Element nodes only
				const divNodes = elementNodes.filter(x => x.rawTagName === 'div');

				// If this div only contains other divs (no text content, no other elements)
				if (elementNodes.length === divNodes.length &&
					elementNodes.length > 0 &&
					hasOnlyWhitespaceText(div)) {

					try {
						// Get all child divs (element nodes only)
						const children = [...div.childNodes.filter(x => x.nodeType === 1)];

						if (children.length > 0) {
							// Replace this div with the first child
							const firstChild = children[0].clone();
							div.parentNode.exchangeChild(div, firstChild);

							// Append any additional children after the first one
							for (let i = 1; i < children.length; i++) {
								const cloned = children[i].clone();
								div.parentNode.appendChild(cloned);
							}

							stats.divsBubbledUp++;
							globalChanged = true;
						}
					} catch (e) {
						// Skip this div if there's an error
						continue;
					}
				}
			}
		}
	}

	// Remove empty divs AFTER all bubbling is complete
	// We do this by re-parsing the HTML to avoid node-html-parser clone() bugs
	if (options.removeEmptyDivs) {
		const htmlString = root.toString();
		const freshRoot = parser.parse(htmlString);

		let emptyDivRemoved = true;
		let emptyDivIterations = 0;
		const maxEmptyDivIterations = 20;

		while (emptyDivRemoved && emptyDivIterations < maxEmptyDivIterations) {
			emptyDivRemoved = false;
			emptyDivIterations++;

			const divs = freshRoot.querySelectorAll('div');

			for (const div of divs) {
				if (div.parentNode) {
					const hasContent = div.childNodes.some(node => {
						if (node.nodeType === 1) return true; // Has element children
						if (node.nodeType === 3 && node.text && node.text.trim()) return true; // Has text content
						return false;
					});

					if (!hasContent) {
						div.parentNode.removeChild(div);
						stats.emptyDivsRemoved++;
						emptyDivRemoved = true;
						break; // Break and re-query
					}
				}
			}
		}

		// Replace root's children with freshRoot's children
		root.childNodes.length = 0;
		freshRoot.childNodes.forEach(node => {
			root.appendChild(node.clone());
		});
	}
}

/**
 * Main HTML cleaning function
 * @param {string} html - Input HTML string
 * @param {Object} userOptions - User-provided options (merged with defaults)
 * @returns {Object} - Object containing cleaned HTML and statistics
 */
function cleanHtml(html, userOptions = {}) {
	const options = { ...DEFAULT_OPTIONS, ...userOptions };
	const stats = options.trackStatistics ? new CleaningStatistics() : null;

	// Validate input
	if (!html || typeof html !== 'string') {
		return {
			html: '',
			statistics: stats,
			error: 'Invalid HTML input'
		};
	}

	try {
		// Parse HTML
		const root = parser.parse(html);

		// Remove specified tags first
		if (options.removeTags && options.removeTags.length > 0) {
			removeTags(root, options.removeTags, stats);
		}

		// Strip attributes from all elements
		const allElements = root.querySelectorAll('*');
		allElements.forEach(element => {
			stripAttributes(element, options, stats);
		});

		// Optimize HTML structure
		optimizeHtml(root, options, stats);

		// Convert back to string
		let cleanedHtml = root.toString();

		// Beautify if requested
		if (options.beautify) {
			cleanedHtml = beautifyHtml(cleanedHtml, {
				preserve_newlines: options.preserveNewlines,
				indent_empty_lines: options.indentEmptyLines,
				indent_size: options.indentSize
			});
		}

		return {
			html: cleanedHtml,
			statistics: stats,
			error: null
		};
	} catch (error) {
		return {
			html: '',
			statistics: stats,
			error: error.message
		};
	}
}

/**
 * Legacy function - strip HTML with boolean flags (backward compatibility)
 * @param {string} html - Input HTML
 * @param {boolean} removeClasses - Whether to remove classes
 * @param {boolean} removeStyles - Whether to remove styles
 * @returns {string} - Cleaned HTML
 */
function stripHtml(html, removeClasses, removeStyles) {
	const result = cleanHtml(html, {
		stripClasses: removeClasses,
		stripStyles: removeStyles,
		stripIds: false,
		optimizeHtml: false,
		beautify: false
	});
	return result.html;
}

/**
 * Convenience function - strip all (classes and styles)
 * @param {string} html - Input HTML
 * @returns {string} - Cleaned HTML
 */
function stripAll(html) {
	return stripHtml(html, true, true);
}

/**
 * Convenience function - strip only classes
 * @param {string} html - Input HTML
 * @returns {string} - Cleaned HTML
 */
function stripClasses(html) {
	return stripHtml(html, true, false);
}

/**
 * Convenience function - strip only styles
 * @param {string} html - Input HTML
 * @returns {string} - Cleaned HTML
 */
function stripStyles(html) {
	return stripHtml(html, false, true);
}

/**
 * Validates HTML input
 * @param {string} selectedText - Text to validate
 * @returns {boolean} - Whether the HTML is valid
 */
function isValidHtml(selectedText) {
	// Need at least one open\close tag to be html
	if (!selectedText.includes("<") && !selectedText.includes(">")) {
		return false;
	}

	return parser.valid(selectedText);
}

module.exports = {
	cleanHtml,
	stripHtml,
	stripAll,
	stripClasses,
	stripStyles,
	isValidHtml,
	DEFAULT_OPTIONS,
	CleaningStatistics
};
