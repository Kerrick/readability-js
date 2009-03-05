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
	
	// This removes everything else on the page. Requires a page refresh to undo it.
	// I tried the damn overlay on top - but had rendering issues:
	document.body.innerHTML = "";
	
	// Inserts the new content :
	document.body.insertBefore(objOverlay, document.body.firstChild);
})()

function grabArticle() {
	var allParagraphs = document.getElementsByTagName("p");
	var topDivCount = 0;
	var topDiv;
	var topDivParas;
	
	var articleContent = document.createElement("DIV");
	var articleTitle = document.createElement("H1");
	var articleFooter = document.createElement("DIV");
	
	// Replace all doubled-up <BR> tags with <P> tags :
	var pattern =  new RegExp ("<br/?>[ \r\n\s]*<br/?>", "g");
	document.body.innerHTML = document.body.innerHTML.replace(pattern, "</p><p>");
	
	// Grab the title from the <title> tag and inject it as the title.
	articleTitle.innerHTML = document.title;
	articleContent.appendChild(articleTitle);
	
	// Study all the paragraphs and find the chunk that has the most <p>'s and keep it:
	for (var j=0; j	< allParagraphs.length; j++) {
		var tempParas = allParagraphs[j].parentNode.getElementsByTagName("p");
	
		if ( tempParas.length > topDivCount && getCharCount(allParagraphs[j].parentNode) >= tempParas.length ) {
			topDivCount = tempParas.length;
			topDiv = allParagraphs[j].parentNode;
		}
	}
	
	// REMOVES ALL STYLESHEETS ...
	for (var k=0;k < document.styleSheets.length; k++) {
		if (document.styleSheets[k].href != null && document.styleSheets[k].href.lastIndexOf("arc90.com/experiments/readability") == -1) {
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
	
	// Gather counts for other typical elements embedded within :
	for (var i=0; i < curDivLength; i ++) {
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
				divsList[i].style.display = "none";
			}
		}
	}
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

