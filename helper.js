const parser = require('node-html-parser');

function stripHtml(html){
	const root = parser.parse(html);
					
	//Clean class
	root.querySelectorAll("[class]" ).forEach(function(el) {
		el.removeAttribute("class");
	});

	//Clean style
	root.querySelectorAll("[style]" ).forEach(function(el) {
		el.removeAttribute("style");
	});

	return root.toString();
}

function isValidHtml(selectedText) {
	//Need at least one open\close tag to be html
	if(!selectedText.includes("<") && !selectedText.includes(">")){
		return false;
	}

    return parser.valid(selectedText);
}

module.exports = {
	stripHtml,
	isValidHtml
}