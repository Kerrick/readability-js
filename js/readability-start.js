var margin = "margin-wide";
var size = "size-large";
var style = "style-newspaper";

var baseHref = window.location.toString().match(/.*\//);

var linkStart = "javascript:(function(){";
var linkEnd = "var elements=document.getElementsByTagName('HEAD');var headElement;if(elements.length>=1){headElement=elements[0];}else{headElement=document.createElement('HEAD');document.documentElement.appendChild(headElement);}_readability_script=document.createElement('SCRIPT');_readability_script.type='text/javascript';_readability_script.src='" + baseHref + "js/readability.js?x='+Math.random();headElement.insertBefore(_readability_script,headElement.firstChild);_readability_css=document.createElement('LINK');_readability_css.rel='stylesheet';_readability_css.href='" + baseHref + "css/readability.css';_readability_css.type='text/css';headElement.insertBefore(_readability_css,headElement.firstChild);_readability_print_css=document.createElement('LINK');_readability_print_css.rel='stylesheet';_readability_print_css.href='" + baseHref + "css/readability-print.css';_readability_print_css.media='print';_readability_print_css.type='text/css';headElement.insertBefore(_readability_print_css,headElement.firstChild);})();";

$(document).ready(function()
{
	// load example with defaults at first
	applyChange("margin", margin);
	applyChange("size", size);
	applyChange("style", style);
	
	// helper that takes the user input and customizes the bookmarklet source
	function applyChange(property, value) 
	{
		var example = document.getElementById("example");
		var article = document.getElementById("articleContent");
		
		// determine the property that is being changed
		switch (property) 
		{
			case "margin":
				margin = value;
				break;
			
			case "size":
				size = value;
				break;
			
			case "style":
				style = value;
				break;
		}
		
		// update the presentation of the example content
		example.className = style;
		article.className = margin + " " + size;
		
		// update the bookmarklet source
		$("#bookmarkletLink").attr("href", linkStart + "readStyle='" + style + "';readSize='" + size + "';readMargin='" + margin + "';" + linkEnd);
	}
	
	$("#settings input").bind("click", function(){
		applyChange(this.name, this.value);
	});
	
	// the user needs to drag the bookmarklet link to their bookmarks bar, but 
	// if they don't notify them what to do (unique case for IE)
	$("#bookmarkletLink").bind("click", function(){
		if ($.browser.msie) 
		{
			alert("To start using Readability, right-click and select 'Add To Favorites...' to save this link to your browser's bookmarks toolbar.");
		} 
		else 
		{
			alert("To start using Readability, drag this link to your browser's bookmarks toolbar.");
		}
		
		return false;
	});
});