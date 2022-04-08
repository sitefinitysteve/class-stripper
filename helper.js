const parser = require('node-html-parser');

function stripHtml(html, removeClasses, removeStyles){
	const root = parser.parse(html);
					
	//Clean class
	if(removeClasses === true){
		root.querySelectorAll("[class]" ).forEach(function(el) {
			el.removeAttribute("class");
		});
	}

	//Clean style
	if(removeStyles === true){
		root.querySelectorAll("[style]" ).forEach(function(el) {
			el.removeAttribute("style");
		});
	}

	return root.toString();
}

function stripAll(html){
	return stripHtml(html, true, true);
}

function stripClasses(html){
	return stripHtml(html, true, false);
}

function stripStyles(html){
	return stripHtml(html, false, true);
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
	stripAll,
	stripClasses,
	stripStyles,
	isValidHtml
}