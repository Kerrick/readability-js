(function(){
	var objOverlay = document.createElement("div");
	var objinnerDiv = document.createElement("div");

	objOverlay.id = "readOverlay";
	objinnerDiv.id = "readInner";
	
	// Apply user-selected styling:
	document.body.className = readStyle;
	objOverlay.className = readStyle;
	objinnerDiv.className = readMargin + " " + readSize;
	
	objinnerDiv.appendChild(grabArticle());		// Get the article and place it inside the inner Div
	objOverlay.appendChild(objinnerDiv);		// Insert the inner div into the overlay

	// For totally hosed HTML, add body node that can't be found because of bad HTML or something.
	if(document.body == null)
	{
		body = document.createElement("body");
		document.body = body;
	}
	
	// This removes everything else on the page. Requires a page refresh to undo it.
	// I tried the damn overlay on top - but had rendering issues:
	document.body.innerHTML = "";
	
	// Inserts the new content :
	document.body.insertBefore(objOverlay, document.body.firstChild);
})()

/* Remove this and any dbg calls before release to bring down file size. */
function dbg(text)
{
	if(typeof console != 'undefined')
		console.log(text);
}

function grabArticle() {
	var allParagraphs = document.getElementsByTagName("p");
	var topDivCount = 0;
	var topDiv = null;
	var topDivParas;
	
	var articleContent = document.createElement("DIV");
	var articleTitle = document.createElement("H1");
	var articleFooter = document.createElement("DIV");
	
	// Replace all doubled-up <BR> tags with <P> tags, and remove fonts.
	var pattern =  new RegExp ("<br/?>[ \r\n\s]*<br/?>", "g");
	document.body.innerHTML = document.body.innerHTML.replace(pattern, "</p><p>").replace(/<\/?font[^>]*>/g, '');
	
	// Grab the title from the <title> tag and inject it as the title.
	articleTitle.innerHTML = document.title;
	articleContent.appendChild(articleTitle);
	
	// Study all the paragraphs and find the chunk that has the best score.
	// A score is determined by things like: Number of <p>'s, commas, special classes, etc.
	for (var j=0; j	< allParagraphs.length; j++) {
		parentNode = allParagraphs[j].parentNode;

		/* Initialize readability data */
		if(typeof parentNode.readability == 'undefined')
		{
			parentNode.readability = {"contentScore": 0};			

			// Look for a special classname
			if(parentNode.className.match(/(comment|meta)/))
				parentNode.readability.contentScore -= 50;
			else if(parentNode.className.match(/(hentry|entry[-]?(content|text|body)|article[-]?(content|text|body))/))
				parentNode.readability.contentScore += 50;

			// Look for a special ID
			if(parentNode.className.match(/(comment|meta)/))
				parentNode.readability.contentScore -= 50;
			else if(parentNode.className.match(/(hentry|entry[-]?(content|text)|article[-]?(text|content))/))
				parentNode.readability.contentScore += 50;
		}

		/* Add a point for the paragraph found */
		parentNode.readability.contentScore++;

		/* Add points for any commas within this paragraph */
		parentNode.readability.contentScore += getCharCount(allParagraphs[j]);
	}

	/* Assignment from index for performance. See http://www.peachpit.com/articles/article.aspx?p=31567&seqNum=5 */
	for(nodeIndex = 0; (node = document.getElementsByTagName('*')[nodeIndex]); nodeIndex++)
	{
		if(typeof node.readability != 'undefined')
		{
			dbg('Found a node with a content score of ' + node.readability.contentScore);
			if(topDiv == null || node.readability.contentScore > topDiv.readability.contentScore)
			{
				dbg('Found a more fit node. Setting topDiv');				
				topDiv = node;
			}
		}
	}
	
	// REMOVES ALL STYLESHEETS ...
	for (var k=0;k < document.styleSheets.length; k++) {
		if (document.styleSheets[k].href != null && document.styleSheets[k].href.lastIndexOf("readability") == -1) {
			document.styleSheets[k].disabled = true;
		}
	}
	// Remove all style tags in head (not doing this on IE) :
	var styleTags = document.getElementsByTagName("style");
	for (var j=0;j < styleTags.length; j++) {
		if (navigator.appName != "Microsoft Internet Explorer") {
			styleTags[j].textContent = "";
		}		
	}

	cleanStyles(topDiv);					// Removes all style attributes
	topDiv = killDivs(topDiv);				// Goes in and removes DIV's that have more non <p> stuff than <p> stuff
	topDiv = killBreaks(topDiv);            // Removes any consecutive <br />'s into just one <br /> 

	// Cleans out junk from the topDiv just in case:
	topDiv = clean(topDiv, "form");
	topDiv = clean(topDiv, "object");
	topDiv = clean(topDiv, "table");
	topDiv = clean(topDiv, "h1");
	topDiv = clean(topDiv, "h2");
	topDiv = clean(topDiv, "iframe");
	
	// Add the footer and contents:
	articleFooter.id = "readFooter";
	articleFooter.innerHTML = "<a href='http://www.arc90.com'><img src='http://lab.arc90.com/experiments/readability/images/footer.png'></a>";
	
	articleContent.appendChild(topDiv);
	articleContent.appendChild(articleFooter);

	return articleContent;
}

// Get character count
function getCharCount ( e,s ) {
    s = s || ",";
	if (navigator.appName == "Microsoft Internet Explorer") {
		return parentContent = e.innerText.split(',').length;
	}
	else {
		return parentContent = e.textContent.split(',').length;
	}
}

function cleanStyles( e ) {
    e = e || document;
    var cur = e.firstChild;

	// Remove any root styles
	e.removeAttribute('style');

    // Go until there are no more child nodes
    while ( cur != null ) {
		if ( cur.nodeType == 1 ) {
			// Remove style attribute(s) :
			cur.removeAttribute("style");
			cleanStyles( cur );
		}
		cur = cur.nextSibling;
	}
}

function killDivs ( e ) {
	var divsList = e.getElementsByTagName( "div" );
	var curDivLength = divsList.length;
	
	// Gather counts for other typical elements embedded within.
	// Traverse backwards so we can remove nodes at the same time without effecting the traversal.
	for (var i=curDivLength-1; i >= 0; i--) {
		var p = divsList[i].getElementsByTagName("p").length;
		var img = divsList[i].getElementsByTagName("img").length;
		var li = divsList[i].getElementsByTagName("li").length;
		var a = divsList[i].getElementsByTagName("a").length;
		var embed = divsList[i].getElementsByTagName("embed").length;

	// If the number of commas is less than 10 (bad sign) ...
	if ( getCharCount(divsList[i]) < 10) {
			// And the number of non-paragraph elements is more than paragraphs 
			// or other ominous signs :
			if ( img > p || li > p || a > p || p == 0 || embed > 0) {
				divsList[i].parentNode.removeChild(divsList[i]);
			}
		}
	}
	return e;
}

function killBreaks ( e ) {
	e.innerHTML = e.innerHTML.replace(/(<br\s*\/?>(\s|&nbsp;?)*){1,}/g,'<br />');
	return e;
}

function clean(e, tags, minWords) {
	var targetList = e.getElementsByTagName( tags );
	minWords = minWords || 1000000;

	for (var y=0; y < targetList.length; y++) {
		// If the text content isn't laden with words, remove the child:
		if (getCharCount(targetList[y], " ") < minWords) {
			targetList[y].parentNode.removeChild(targetList[y]);
		}
	}
	return e;
}

