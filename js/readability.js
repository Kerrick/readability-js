var highestScore = -1;
var malformedContent = false;

// for now we want to hold on to our debugging, but if a browser doesn't 
// support it, we'll create a console.log() method that does nothing
if (typeof console == 'undefined') 
{
	var console = {};
	
	console.log = function(msg) {
		return;
	};
}

(function(){
	// some sites use plugins (jCarousel) that when Readability removes scripts 
	// or does something funky it causes an alert to appear every few seconds, 
	// to avoid this we'll override the alert and timer methods, we won't need 
	// them, yet consider a better approach
	window.alert = function(message) {};
	window.setInterval = function(method, timeout) {};
	window.setTimeout = function(method, timeout) {};
	
	var overlayContainer = document.createElement("DIV"), 
		articleTitle = document.createElement("H1"), 
		contentContainer = document.createElement("DIV"), 
		articleFooter = document.createElement("DIV"), 
		toolBar = document.createElement("DIV"), 
		readabilityVersion = "1.0.0.1", 
		emailSrc = "http://proto1.arc90.com/readability/email.php";
	
	overlayContainer.id = "readOverlay";
	contentContainer.id = "readInner";
	
	// apply user-selected styling
	document.body.className = readStyle;
	overlayContainer.className = readStyle;
	contentContainer.className = readMargin + " " + readSize;
	
	// set up the toolbar widget
	toolBar.id = "readTools";
	toolBar.innerHTML = '<a href="#" onclick="window.location.reload();return false;" title="Reload original page" id="reload-page">Reload Original Page</a>' + 
		'<a href="#" onclick="javascript:window.print();return false;" title="Print page" id="print-page">Print Page</a>' + 
		'<a href="#" onclick="emailBox();return false;" title="Email page" id="email-page">Email Page</a>';
	
	// we'll use the page title as our title, unfortunately not all sites use 
	// this well, so we might want to consider say stripping an H1 tag
	articleTitle.innerHTML = document.title;
	contentContainer.appendChild(articleTitle);
	
	// parse the article content and add it to the new content container
	contentContainer.appendChild(parseContent());
	
	// add the footer and contents
	articleFooter.id = "readFooter";
	articleFooter.innerHTML = '<div><a href="http://lab.arc90.com/experiments/readability/"><img src="http://lab.arc90.com/experiments/readability/images/footer-readability.png" width="201" height="66" /></a><a href="http://www.arc90.com/"><img src="http://lab.arc90.com/experiments/readability/images/footer-arc90.png" width="108" height="66" /></a></div><div><a href="http://www.twitter.com/arc90" class="footer-twitterLink">Follow us on Twitter &raquo;</a></div><div id="readability-version">' + readabilityVersion + '</div>';
	contentContainer.appendChild(articleFooter);
	
	// add the toolbar and then the conent container to our body
	overlayContainer.appendChild(toolBar);
	overlayContainer.appendChild(contentContainer);
	
	// for totally hosed HTML, add body node that can"t be found because of bad HTML or something
	if (!document.body) 
		document.body = document.createElement("body");
	
	document.body.id = "";
	document.body.innerHTML = "";
	
	// with all previous body content removed, add our new overlay/main container
	document.body.insertBefore(overlayContainer, document.body.firstChild);
})();


function determineContentScore(score, parent, element) 
{
	// TODO: should set as a global var since badKeywords are used elsewhere
	var goodKeywords = ["article", "body", "content", "entry", "hentry", "post", "story", "text"], 
		semiGoodKeywords = ["area", "container", "inner", "main"], 
		badKeywords = ["ad", "captcha", "classified", "comment", "footer", "footnote", "leftcolumn", "listing", "menu", "meta", "module", "nav", "navbar", "rightcolumn", "sidebar", "sponsor", "tab", "toolbar", "tools", "trackback", "widget"], 
		className = parent.className.toLowerCase(), // we'll be doing a case insensitive compare
		id = parent.id.toLowerCase(), // we'll be doing a case insensitive compare
		i = goodKeywords.length, 
		j = semiGoodKeywords.length, 
		k = badKeywords.length;
	
	// increment the score if the content might be what we are looking for
	while (i--) 
	{
		if (className.indexOf(goodKeywords[i]) >= 0) 
			score++;
		
		if (id.indexOf(goodKeywords[i]) >= 0) 
			score++;
	}
	
	// TODO: would like to improve the content scoring algorithm here 
	// to not have to use so many for loops
	
	// at least a single good keyword was found indiciating we may have found our 
	// content container but we have other keywords that don't necessarily have to 
	// do with content but when used in conjuction with the good keywords we want 
	// to increment our score
	if (score >= 1) 
	{
		// increment the score if the content might be what we are looking for
		while (j--) 
		{
			if (className.indexOf(semiGoodKeywords[i]) >= 0) 
				score++;
			
			if (id.indexOf(semiGoodKeywords[i]) >= 0) 
				score++;
		}
	}
	
	// decrement the score if the content is not what we are looking for
	while (k--) 
	{
		if (className.indexOf(badKeywords[j]) >= 0) 
			score = score - 15;
		
		if (id.indexOf(badKeywords[j]) >= 0) 
			score = score - 15;
	}
	
	// TODO: verify that 20 seems an acceptable minimum, consider 15
	// 
	// Add a point for the paragraph found
	if (element.tagName.toLowerCase() == "p" && getWordCount(element) > 20) //|| (score == 0 && getText(element).length > 10)) 
		score++;
	
	// DEBUG
	console.log(element.tagName.toLowerCase() + " " + getWordCount(element));
	
	//if (getWordCount(element) > 30) 
	//	score++;
	
	// FIXME: not sure yet if this will be included, this would break 
	// pages that use multiple containers for content, or we could tweak 
	// the acceptable minimum... but that would have to be set quite 
	// high, for now we'll leave it out
	//
	// Add points for any words within this paragraph
	//if (score > 0 && malformedContent) 
	//	score += getWordCount(element);
	
	// keep track of the highest score we've come across
	if (score > highestScore) 
		highestScore = score;
	
	return score;
}


function parseContent() {
	// replace all doubled-up <BR> tags with <P> tags, and remove inline fonts
	document.body.innerHTML = document.body.innerHTML.replace(/<br[^>]*>\s|&nbsp;*<br[^>]*>/gi, "<p />").replace(/<\/?font[^>]*>/gi, "");
	
	var articleContent = document.createElement("DIV"), 
		paragraphs = document.getElementsByTagName("P"), 
		contentBlocks = [];
	
	
	// DEBUG
	console.log(paragraphs.length + " Paragraphs found");
	
	
	/*
	// PRE based content parsing only! 
	// this was only an EXPERIMENT, need to be revisited
	
	var pres = document.getElementsByTagName("PRE");
	for (var i = 0; i < pres.length; i++) 
	{
		var pre = pres[i];
		
		var content = document.createElement("DIV");
		
		var text = pre.textContent;
		var firstTime = true;
		
		while (text.indexOf('\n\n') >= 0) 
		{
			if (firstTime) 
			{
				text = text.replace('\n\n', '<p>'); // first item
				firstTime = false;
			}
			else 
			{
				if (text.indexOf('\n\n') == text.lastIndexOf('\n\n')) 
					text = text.replace('\n\n', '</p>'); // last item
				else 
					text = text.replace('\n\n', '</p><p>'); // every item in between
			}
		}
		
		content.innerHTML = text.replace(/={10,}/g, "====================");
		
		paragraphs = content.getElementsByTagName("P");
		
		var preElements = [];
		for (var j = 0; j < paragraphs.length; j++) 
		{
			p = paragraphs[j];
			
			breaks = p.getElementsByTagName("BR");
			
			if (p.innerHTML.indexOf("\t") == -1 && p.innerHTML.indexOf("  ") == -1 && breaks.length >= 1) 
			{
				p.innerHTML = p.innerHTML.replace(/<br\/?>/gi, " ");
			}
			
			console.log("tabs: " + p.innerHTML.split("\t").length + " -- " + p.innerHTML.split(/\s{2,}/g).length + " -- " + p.innerHTML.substr(0, 35))
			
			numTabs = p.innerHTML.split("\t").length + p.innerHTML.split(/ {3,}/g).length;
			
			if (numTabs > 3) 
			{
				preElements.push(p);
			}
		}
		
		for (var k = 0; k < preElements.length; k++) 
		{
			var p = preElements[k];
			
			var newPre = document.createElement("PRE");
			newPre.innerHTML = p.innerHTML.replace(/<br\/>/gi, "\n");
			newPre.className = "normalPre";
			
			p.parentNode.replaceChild(newPre, p);
		}
		
		content.innerHTML = content.innerHTML.replace(/<p>[ \r\n\s]*<p>/gi, "<p>");
		
		contentBlocks.push(content);
	}
	*/
	
	// no paragraphs found so we'll attempt to parse content from 
	// div's and set our malformedContent flag
	if (paragraphs.length == 0) 
	{
		paragraphs = document.getElementsByTagName("DIV");
		
		malformedContent = true;
	}
	
	var i = paragraphs.length;
	
	while (i--) 
	{
		var parentNode = paragraphs[i].parentNode;
		
		// TODO: originally the if/continue statement below checked if the parent 
		// 		was the body tag and if it was continued on.. why?
		
		// if the parent happens to be a form element, accessing properties 
		// such as id or className don't work, or rather it attempts to access 
		// children so we need to make sure we only deal with string values
		if (typeof parentNode.id != "string" || typeof parentNode.className != "string") 
			continue;
		
		// initialize readability score data
		if (typeof parentNode.readability == "undefined") 
			parentNode.readability = {"contentScore": 0};
		
		parentNode.readability.contentScore = determineContentScore(parentNode.readability.contentScore, parentNode, paragraphs[i]);
		
		// looks like we have possible content candidates, add it
		if (parentNode.readability.contentScore > 0) 
		{
			// DEBUG
			console.log(parentNode.tagName + " id: " + parentNode.id + " -- class: " + parentNode.className + " -- score: " + parentNode.readability.contentScore);
			
			// careful, only add parent element once!
			if (contentBlocks.indexOf(parentNode) == -1) 
				contentBlocks.push(parentNode);
		}
	}
	
	/*
	// TODO: need to revisit parsing strictly tables/divs content only
	if (contentBlocks.length == 0) 
	{
		var paragraphs = document.getElementsByTagName("tbody");
		
		for (var i = 0; i < paragraphs.length; i++) 
		{
			var parentNode = paragraphs[i].parentNode;
			
			// Initialize readability data
			if (typeof parentNode.readability == "undefined")
			{
				parentNode.readability = {"contentScore": determineContentScore(parentNode, paragraphs[i])};
				
				if (parentNode.readability.contentScore > 0) 
				{
					console.log(parentNode.tagName + " id: " + parentNode.id + " -- class: " + parentNode.className + " -- score: " + parentNode.readability.contentScore);
					
					if (contentBlocks.indexOf(parentNode) == -1) 
						contentBlocks.push(parentNode);
				}
			}
		}
	}
	*/
	
	removeScripts();
	removeStylesheets();
	removeStyles();
	
	
	// DEBUG
	console.log("ContentBlocks: " + contentBlocks.length + " -- HighestScore: " + highestScore);
	
	
	var m = contentBlocks.length;
	
	// remove all content elements that aren't of the highest score
	while (m--) 
	{
		var contentElement = contentBlocks[m];
		
		
		// DEBUG
		//console.log("id: " + contentElement.id + " -- class: " + contentElement.className + " -- result: " + ((highestScore < 20 && contentElement.readability.contentScore < highestScore) || (contentElement.readability.contentScore < 20)).toString().toUpperCase());
		
		
		// FIXME: had trouble writing the if/else if as a single if or statement
		// FIXME: not sure the minimum score is correct, need to test against wide 
		// 		  range of content, particularly content divided in 2+ containers
		
		// sometimes our content won't reach such a high score so here we look for an 
		// acceptable minimum, if our highest score didn't go above twenty remove all 
		// but the highest
		if (highestScore < 20 && contentElement.readability && contentElement.readability.contentScore < highestScore) 
		{
			contentBlocks.splice(m, 1);
		} //otherwise we only remove content blocks that have scored less than that minimum
		else if (highestScore > 20 && contentElement.readability && contentElement.readability.contentScore < 20) 
		{
			contentBlocks.splice(m, 1);
		}
	}
	
	
	// with many content containers we need to verify that some 
	// aren't descendants of others otherwise we'll get multiple output
	if (contentBlocks.length > 1) 
	{
		var n = contentBlocks.length;
		
		// remove all content elements that are descandants of another
		while (n--) 
		{
			var contentElement = contentBlocks[n];
			
			/**
			 * hasAnyAncestor should work better overall but some sites 
			 * have so many div's up the hierarchy with lots of good keywords 
			 * its hard to keep those out, for those sites 
			 * (http://www.azstarnet.com/news/290815) hasAnyDescendant works 
			 * best so will need to consider changing and QA heavily.
			 */
			if (hasAnyDescendant(contentElement, contentBlocks)) 
				contentBlocks.splice(n, 1);
		}
	}
	
	
	// DEBUG
	console.log("ContentBlocks: " + contentBlocks.length);
	
	
	var p = contentBlocks.length;
	
	while (p--) 
	{
		var contentElement = contentBlocks[p];
		
		removeElementStyles(contentElement);
		
		// remove any consecutive <br />'s into just one <br />
		removeBreaks(contentElement);
		
		// this cleanup should only happen if paragraphs were found since 
		// malformed content suggests div's are used to maintain content
		if (!malformedContent) 
		{
			// goes in and removes DIV's that have more non <p> stuff than <p> stuff
			removeNonContentElement(contentElement, "div");
		}
		
		//removeNonContentElement(contentElement, "ul");
		
		// clean out anymore possible junk
		removeElementByMinWords(contentElement, "form");
		removeElementByMinWords(contentElement, "object");
		removeElementByMinWords(contentElement, "table", 250);
		removeElementByMinWords(contentElement, "h1");
		removeElementByMinWords(contentElement, "h2");
		removeElementByMinWords(contentElement, "iframe");
		
		articleContent.appendChild(contentElement);
	}
	
	// Readability has failed you.. show msg that content was not found
	if (contentBlocks.length == 0) 
	{
		articleContent = document.createElement("DIV");
		articleContent.innerHTML = 'Sorry, readability was unable to parse this page for content. If you feel like it should have been able to, please <a href="http://code.google.com/p/arc90labs-readability/issues/entry">let us know by submitting an issue.</a>';
	}
	
	return articleContent;
}



//--------------------------------------------------------------------------
//
//  ContentParserUtils
//
//--------------------------------------------------------------------------

/**
 * Removes any elements of the provided tag name from the specified element 
 * if it doesn't contain the minimum amount of words.
 * 
 * @param element The element.
 * @param tagName The tag name of the elements to be retrieved from within 
 * the provided element.
 * @param minWords The minimum number of words.
 */
function removeElementByMinWords(element, tagName, minWords) 
{
	// default minimum if none is provided
	minWords = minWords || 1000000; // FIXME: not sure why such a higher number!
	
	var elements = element.getElementsByTagName(tagName), 
		i = elements.length;
	
	while (i--) 
	{
		var target = elements[i];
		
		// the text content doesn't meet our requirements so remove it
		if (getWordCount(target) < minWords) 
		{
			target.parentNode.removeChild(target);
		}
	}
}

/**
 * Removes any instances of the provided non-content element from the 
 * specified root element if it passes a few tests. First, if a single 
 * bad keyword is found or second less than 25 words exist within.
 * 
 * @param element The element.
 * @param tagName The tag name of the elements to be retrieved from within 
 * the provided element.
 */
function removeNonContentElement(element, tagName) 
{
	var elements = element.getElementsByTagName(tagName), 
		i = elements.length;
	
	// gather counts for other typical elements embedded within and then traverse 
	// backwards so we can remove elements at the same time without effecting the traversal
	while (i--) 
	{
		var badKeywords = ["ad", "captcha", "classified", "clear", "comment", "crumbs", "footer", "footnote", "leftcolumn", "listing", "menu", "meta", "module", "nav", "navbar", "rightcolumn", "sidebar", "sponsor", "tab", "tag", "toolbar", "tools", "trackback", "tweetback", "widget"], 
			descendant = elements[i], 
			descendantId = descendant.id.toLowerCase(), 
			descendantClassName = descendant.className.toLowerCase(), 
			p = descendant.getElementsByTagName("p").length, 
			img = descendant.getElementsByTagName("img").length, 
			li = descendant.getElementsByTagName("li").length, 
			a = descendant.getElementsByTagName("a").length, 
			embed = descendant.getElementsByTagName("embed").length;
		
		
		/*
		// no basic elements were found at all
		if (a == 0 && embed == 0 & img == 0 && li == 0 && p == 0) 
		{
			// retrieve all children to see if it contains any elements
			var children = descendant.getElementsByTagName("*");
			var containsOnlyText = true;
			
			for (var j = 0; j < children.length; j++) 
			{
				var child = children[j];
				
				// element type found so we don't have an element (e.g. DIV) with just text
				if (child.nodeType == 1) 
				{
					containsOnlyText = false;
					break;
				}
			}
			
			// 
			if (!containsOnlyText) 
			{
				descendant.parentNode.removeChild(descendant);	
			}
			
			continue;
		} 
		else 
		{*/
			var j = badKeywords.length;
			
			// should improve this but for if the element has a single bad keyword remove it
			while (j--) 
			{
				if (descendantId.indexOf(badKeywords[j]) >= 0 || descendantClassName.indexOf(badKeywords[j]) >= 0) 
				{
					descendant.parentNode.removeChild(descendant);
					descendant = null;
					break;
				}
			}
		/*}*/
		
		// found a bad keyword so the element has been removed, continue to the next one
		if (!descendant) 
			continue;
		
		// we have fewer than 25 words.. bad sign..
		if (getWordCount(descendant) < 25) 
		{
			// the number of non-paragraph elements is more than actual 
			// paragraphs or other ominous signs (:) and elements
			if (img > p || li > p || a > p || p == 0 || embed > 0) 
			{
				descendant.parentNode.removeChild(descendant);
			}
		}
	}
}

//--------------------------------------------------------------------------
//
//  ElementUtils
//
//--------------------------------------------------------------------------

/**
 * Returns the text content of the specified element.
 * 
 * @param element The element from which to retrieve its text content.
 * 
 * @return The string content of the specified element.
 */
function getText(element) 
{
	return (typeof element.textContent != "undefined") 
				? element.textContent 
				: element.innerText;
}

/**
 * Returns the word count for the specified element.
 * 
 * @param element The element.
 * 
 * @returns A count indicating the number of words
 */
function getWordCount(element) 
{
	// normalize replaces consecutive spacing with a single space, 
	// by then triming, we can safely split on a space for a count
	return trim(normalize(getText(element))).split(" ").length;
}

/**
 * Determines if the specified element has one of the provided array of 
 * ancestors and if so returns true.
 * 
 * @param element The element.
 * @param ancestors An array of possible ancestors.
 * 
 * @returns True if the element has one of the provided ancestors, 
 * false if it does not.
 */
function hasAnyAncestor(element, ancestors) 
{
	var parent = element.parentNode;
	
	while (parent != null) 
	{
		// ancestor found!
		if (ancestors.indexOf(parent) >= 0) 
			return true;
		
		parent = parent.parentNode;
	}
	
	return false;
}

/**
 * Determines if the specified element has one of the provided array of 
 * descendants and if so returns true.
 * 
 * @param element The element.
 * @param descendants An array of possible descendants.
 * 
 * @returns True if the element has one of the provided descendants, 
 * false if it does not.
 */
function hasAnyDescendant(element, descendants) 
{
	var elements = element.getElementsByTagName("*"), 
		i = elements.length;
	
	while (i--) 
	{
		// descendant found!
		if (descendants.indexOf(elements[i]) >= 0) 
			return true;
	}
	
	return false;
}

/**
 * Returns true if the value given is defined. Otherwise returns false.
 * 
 * @param value The value to determine if defined.
 * 
 * @return True if the value given is defined, false if it does not.
 */
function isDefined(value) 
{
	var undefined;
	return value !== undefined;
}

/**
 * Replaces consecutive spaces with a single space.
 */
function normalize(text) 
{
	return (text || "").replace(/\s{2,}/g, " ");
}

/**
 * Replaces consecutive br tags with a single br tag from the specified element.
 * 
 * @param element The element containing consecutive br tags.
 */
function removeBreaks(element) 
{
	// FIXME: the regex doesn't seem to pick up consecutive br tags, need to revisit
	element.innerHTML = element.innerHTML.replace(/((<br[^>]*>)[\s]*(<br[^>]*>)){1,}/gi, "<br />");
}

/**
 * Removes any styles on the specified element.
 * 
 * @param element The element containing the styles to be removed.
 */
function removeElementStyles(element) 
{
	// bad node, there's not much we can do
	if (!element) 
		return;
	
	// remove any root styles, if we're able
	if (typeof element.removeAttribute == "function") 
		element.removeAttribute("style");
	
	
	// TODO: do not use firstChild and nextSibling, use childNodes array instead
	
	
	// prepare to remove styles on all children and siblings
	var childElement = element.firstChild;
	
    while (childElement) 
    {
		if (childElement.nodeType == 1) 
		{
			// remove any root styles, if we're able
			if (typeof element.removeAttribute == "function") 
				childElement.removeAttribute("style");
			
			// remove styles recursively
			removeElementStyles(childElement);
		}
		
		childElement = childElement.nextSibling;
	}
}

/**
 * Removes all inline or external referencing scripts.
 */
function removeScripts() 
{
	var scripts = document.getElementsByTagName("SCRIPT"), 
		i = scripts.length;
	
	while (i--) 
	{
		var script = scripts[i];
		
		// remove inline or external referencing scripts (that aren't Readability related)
		if (!script.src || (script.src && script.src.indexOf("readability") == -1)) 
		{
			script.parentNode.removeChild(script);
		}
	}
}

/**
 * Removes all inline styles.
 */
function removeStyles() 
{
	var styles = document.getElementsByTagName("STYLE"), 
		i = styles.length;
	
	while (i--) 
	{
		var style = styles[i];
		
		// we prefer to remove the tag completely but if not able we'll clear it
		if (style.parentNode) 
		{
			style.parentNode.removeChild(style);
		}
		else 
		{
			if (style.textContent) 
			{
				style.textContent = "";
			} 
			else 
			{
				// most browsers support textContent but IE has its own way but it 
				// seems that Firefox supports both, check link for last example
				// http://www.phpied.com/the-star-hack-in-ie8-and-dynamic-stylesheets/
				// note that if the style tag contains no text content, then 
				// no styleSheet object is defined either
				if (style.styleSheet) 
					style.styleSheet.cssText = "";
			}
		}
	}
}

/**
 * Removes all linked stylesheets.
 */
function removeStylesheets() 
{
	var i = document.styleSheets.length;
	
	// TODO: need to do more research, not sure if disabling is enough 
	// for cross browser compatibility, might consider removal via parent 
	// just as done in the removeScripts method, but will need to retrieve 
	// all LINK tags and make sure rel attr is "stylesheet" or that its 
	// type attr is "text/css"
	while (i--) 
	{
		var styleSheet = document.styleSheets[i];
		
		if (styleSheet.href && styleSheet.href.lastIndexOf("readability") == -1) 
		{
			styleSheet.disabled = true;
		}
	}
}

/**
 * Removes whitespace from the front and the end of the specified string.
 * 
 * @param text The String whose beginning and ending whitespace will be removed.
 * 
 * @returns A String with whitespace removed from the begining and end
 */
function trim(text) 
{
	return (text || "").replace(/^\s+|\s+$/g, "");
}