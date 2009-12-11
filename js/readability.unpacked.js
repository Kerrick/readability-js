var dbg = function(s) {
	if(typeof console !== 'undefined')
		console.log("Readability: " + s);
};

/*
 * Readability. An Arc90 Lab Experiment. 
 * Website: http://lab.arc90.com/experiments/readability
 * Source:  http://code.google.com/p/arc90labs-readability
 *
 * Copyright (c) 2009 Arc90 Inc
 * Readability is licensed under the Apache License, Version 2.0.
**/
var readability = {
	version:     '0.5',
	emailSrc:    'http://proto1.arc90.com/readability/email.php',
	iframeLoads: 0,

	/**
	 * All of the regular expressions in use within readability.
	 * Defined up here so we don't instantiate them repeatedly in loops.
	 **/
	regexps: {
		unlikelyCandidatesRe: /comment|combx|meta|foot|menu|nav|header|rss|sidebar|sponsor/i,
		okMaybeItsACandidateRe: /body|article|and|main|column/i,
		positiveRe: /post|hentry|entry|body|content|text|article|pagination|page/i,
		negativeRe: /comment|media|meta|scroll|footer|footnote|foot|combx|link|promo|sponsor/i,
		divToPElementsRe: /<(div|ul|ol|p|img|a|dl|pre|blockquote|table)/i,
		replaceBrsRe: /<br[^>]*>[ \r\n]*(<br[^>]*>)+/gi,
		replaceFontsRe: /<(\/?)font[^>]*>/gi
	},

	/**
	 * Runs readability.
	 * 
	 * Workflow:
	 *  1. Prep the document by removing script tags, css, etc.
	 *  2. Build readability's DOM tree.
	 *  3. Grab the article content from the current dom tree.
	 *  4. Replace the current DOM tree with the new one.
	 *  5. Read peacefully.
	 *
	 * @return void
	 **/
	init: function() {
		readability.prepDocument();
		
		/* Build readability's DOM tree */
		var overlay        = document.createElement("DIV");
		var innerDiv       = document.createElement("DIV");
		var articleTools   = readability.getArticleTools();
		var articleTitle   = readability.getArticleTitle();
		var articleContent = readability.grabArticle();
		var articleFooter  = readability.getArticleFooter();

		overlay.id              = "readOverlay";
		innerDiv.id             = "readInner";

		/* Apply user-selected styling */
		document.body.className = readStyle;
		overlay.className       = readStyle;
		innerDiv.className      = readMargin + " " + readSize;

		/* Glue the structure of our document together. */
		articleContent.appendChild( articleFooter  );
		      innerDiv.appendChild( articleTitle   );
		      innerDiv.appendChild( articleContent );
		       overlay.appendChild( articleTools   );
		       overlay.appendChild( innerDiv       );

		/* Clear the old HTML, insert the new content. */
		document.body.innerHTML = "";
		document.body.insertBefore(overlay, document.body.firstChild);
	},

	/**
	 * Get the article tools Element that has buttons like reload, print, email.
	 *
	 * @return void
	 **/
	getArticleTools: function () {
		var articleTools = document.createElement("DIV");

		articleTools.id        = "readTools";
		articleTools.innerHTML = "\
			<a href='#' onclick='return window.location.reload()' title='Reload original page' id='reload-page'>Reload Original Page</a>\
			<a href='#' onclick='javascript:window.print();' title='Print page' id='print-page'>Print Page</a>\
			<a href='#' onclick='readability.emailBox(); return false;' title='Email page' id='email-page'>Email Page</a>\
		";

		return articleTools;
	},
	
	/**
	 * Get the article title as an H1. Currently just uses document.title,
	 * we might want to be smarter in the future.
	 *
	 * @return void
	 **/
	getArticleTitle: function () {
		var articleTitle = document.createElement("H1");
		articleTitle.innerHTML = document.title;
		
		return articleTitle;
	},

	/**
	 * Get the footer with the readability mark etc.
	 *
	 * @return void
	 **/
	getArticleFooter: function () {
		var articleFooter = document.createElement("DIV");

		articleFooter.id = "readFooter";
		articleFooter.innerHTML = "\
			<a href='http://lab.arc90.com/experiments/readability'><img src='http://lab.arc90.com/experiments/readability/images/footer-readability.png'></a>\
			<a href='http://www.arc90.com'><img src='http://lab.arc90.com/experiments/readability/images/footer-arc90.png'></a>\
			<a href='http://www.twitter.com/arc90' class='footer-twitterLink'>Follow us on Twitter &raquo;</a>\
	                <div class='footer-right' >\
	                        <span class='version'>Readability version " + readability.version + "</span>\
					</div>\
		";

		return articleFooter;
	},
	
	/**
	 * Prepare the HTML document for readability to scrape it.
	 * This includes things like stripping javascript, CSS, and handling terrible markup.
	 * 
	 * @return void
	 **/
	prepDocument: function () {
		/**
		 * In some cases a body element can't be found (if the HTML is totally hosed for example)
		 * so we create a new body node and append it to the document.
		 */
		if(document.body === null)
		{
			body = document.createElement("body");
			try {
				document.body = body;		
			}
			catch(e) {
				document.documentElement.appendChild(body);
			}
		}

		/* If we're using a typekit style, inject the JS for it. */
		if (readStyle == "style-classy") {
			var typeKitScript  = document.createElement('script');
			typeKitScript.type = "text/javascript";
			typeKitScript.src  = "http://use.typekit.com/sxt6vzy.js";

			document.body.appendChild(typeKitScript);

			/**
			 * Done as a script elem so that it's ensured it will activate
			 * after typekit is loaded from the previous script src.
			**/
			var typeKitLoader  = document.createElement('script');
			typeKitLoader.type = "text/javascript";

			var typeKitLoaderContent = document.createTextNode('try{Typekit.load();}catch(e){}');
			typeKitLoader.appendChild(typeKitLoaderContent);
			document.body.appendChild(typeKitLoader);
		}

		/* remove all scripts that are not readability */
		var scripts = document.getElementsByTagName('script');
		for(i = scripts.length-1; i >= 0; i--)
		{
			if(typeof(scripts[i].src) == "undefined" || scripts[i].src.indexOf('readability') == -1)
			{
				scripts[i].parentNode.removeChild(scripts[i]);			
			}
		}

		/* remove all stylesheets */
		for (var k=0;k < document.styleSheets.length; k++) {
			if (document.styleSheets[k].href != null && document.styleSheets[k].href.lastIndexOf("readability") == -1) {
				document.styleSheets[k].disabled = true;
			}
		}

		/* Remove all style tags in head (not doing this on IE) - TODO: Why not? */
		var styleTags = document.getElementsByTagName("style");
		for (var j=0;j < styleTags.length; j++)
			if (navigator.appName != "Microsoft Internet Explorer")
				styleTags[j].textContent = "";

		/* Turn all double br's into p's */
		/* Note, this is pretty costly as far as processing goes. Maybe optimize later. */
		document.body.innerHTML = document.body.innerHTML.replace(readability.regexps.replaceBrsRe, '</p><p>').replace(readability.regexps.replaceFontsRe, '<$1span>')
	},

	/**
	 * Prepare the article node for display. Clean out any inline styles,
	 * iframes, forms, strip extraneous <p> tags, etc.
	 *
	 * @param Element
	 * @return void
	 **/
	prepArticle: function (articleContent) {
		readability.cleanStyles(articleContent);
		readability.killBreaks(articleContent);

		/* Clean out junk from the article content */
		readability.cleanConditionally(articleContent, "div");
		readability.cleanConditionally(articleContent, "table");
		readability.cleanConditionally(articleContent, "ul");
        
		readability.clean(articleContent, "form");
		readability.clean(articleContent, "object");
		readability.clean(articleContent, "h1");
		/* readability.clean(articleContent, "h2");      Debatable whether we should strip these. */
		readability.clean(articleContent, "iframe");

		/* Remove extra paragraphs */
		try {
			articleContent.innerHTML = articleContent.innerHTML.replace(/<p>(\s|<br ?\/?>)*<\/p>/gi,'').replace(/<br[^>]*>\s*<p/gi, '<p');		
		}
		catch (e) {
			dbg("Cleaning innerHTML of breaks failed. This is an IE strict-block-elements bug. Ignoring.");
		}
	},
	
	/**
	 * Initialize a node with the readability object. Also checks the
	 * className/id for special names to add to its score.
	 *
	 * @param Element
	 * @return void
	**/
	initializeNode: function (node) {
		node.readability = {"contentScore": 0};			

		if (typeof(node.className) == 'string' && node.className != "")
		{
			if(node.className.search(readability.regexps.negativeRe) !== -1)
				node.readability.contentScore -= 25;

			if(node.className.search(readability.regexps.positiveRe) !== -1)
				node.readability.contentScore += 25;				
		}

		// Look for a special ID
		if (typeof(node.id) == 'string' && node.id != "")
		{
			if(node.id.search(readability.regexps.negativeRe) !== -1)
				node.readability.contentScore -= 25;

			if(node.id.search(readability.regexps.positiveRe) !== -1)
				node.readability.contentScore += 25;				
		}
	},
	
	/***
	 * grabArticle - Using a variety of metrics (content score, classname, element types), find the content that is
	 *               most likely to be the stuff a user wants to read. Then return it wrapped up in a div.
	 *
	 * @return Element
	**/
	grabArticle: function () {

		/**
		 * First, node prepping. Trash nodes that look cruddy (like ones with the class name "comment", etc), and turn divs
		 * into P tags where they have been used inappropriately (as in, where they contain no other block level elements.)
		 *
		 * Note: Assignment from index for performance. See http://www.peachpit.com/articles/article.aspx?p=31567&seqNum=5
		 * TODO: Shouldn't this be a reverse traversal?
		**/
		for(var nodeIndex = 0; (node = document.getElementsByTagName('*')[nodeIndex]); nodeIndex++)
		{
			/* Remove unlikely candidates */
			var unlikelyMatchString = node.className + node.id;
			if (unlikelyMatchString.search(readability.regexps.unlikelyCandidatesRe) !== -1 &&
			    unlikelyMatchString.search(readability.regexps.okMaybeItsACandidateRe) == -1 &&
				node.tagName !== "BODY")
			{
				dbg("Removing unlikely candidate - " + unlikelyMatchString);
				node.parentNode.removeChild(node);
				nodeIndex--;
				continue;
			}

			/* Turn all divs that don't have children block level elements into p's */
			if (node.tagName === "DIV" && node.innerHTML.search(readability.regexps.divToPElementsRe) === -1)
			{
				dbg("Altering div to p");
				var newNode = document.createElement('p');
				try {
					newNode.innerHTML = node.innerHTML;				
					node.parentNode.replaceChild(newNode, node);
					nodeIndex--;
				}
				catch(e)
				{
					dbg("Could not alter div to p, probably an IE restriction, reverting back to div.")
				}
			}
		}

		/**
		 * Loop through all paragraphs, and assign a score to them based on how content-y they look.
		 * Then add their score to their parent node.
		 *
		 * A score is determined by things like number of commas, class names, etc. Maybe eventually link density.
		**/
		var allParagraphs = document.getElementsByTagName("p");
		var candidates    = [];

		for (var j=0; j	< allParagraphs.length; j++) {
			var parentNode = allParagraphs[j].parentNode;
			var innerText  = readability.getInnerText(allParagraphs[j]);

			/* If this paragraph is less than 25 characters, don't even count it. */
			if(innerText.length < 25)
				continue;

			/* Initialize readability data for the parent. */
			if(typeof parentNode.readability == 'undefined')
			{
				readability.initializeNode(parentNode);
				candidates.push(parentNode);
			}

			/* Add a point for the paragraph itself as a base. */
			parentNode.readability.contentScore++;

			/* Add points for any commas within this paragraph */
			parentNode.readability.contentScore += innerText.split(',').length;
			
			/**
			 * TODO: Check link density of this paragraph, and add or subtract
			 * points based on it? May be a performance hog.
			**/
		}

		/**
		 * After we've calculated scores, loop through all of the possible candidate nodes we found
		 * and find the one with the highest score.
		**/
		var topCandidate = null;
		for(var i=0, il=candidates.length; i < il; i++)
		{
			/**
			 * Scale the final candidates score based on link density. Good content should have a
			 * relatively small link density (5% or less) and be mostly unaffected by this operation.
			**/
			candidates[i].readability.contentScore = candidates[i].readability.contentScore * (1-readability.getLinkDensity(candidates[i]));

			dbg('Candidate: ' + candidates[i] + " (" + candidates[i].className + ":" + candidates[i].id + ") with score " + candidates[i].readability.contentScore);

			if(!topCandidate || candidates[i].readability.contentScore > topCandidate.readability.contentScore)
				topCandidate = candidates[i];
		}

		/**
		 * If we still have no top candidate, just use the body as a last resort.
		 * We also have to copy the body node so it is something we can modify.
		 **/
		if (topCandidate == null || topCandidate.tagName == "BODY")
		{
			topCandidate = document.createElement("DIV");
			topCandidate.innerHTML = document.body.innerHTML;
			document.body.innerHTML = "";
			document.body.appendChild(topCandidate);
			readability.initializeNode(topCandidate);
		}


		/**
		 * Now that we have the top candidate, look through its siblings for content that might also be related.
		 * Things like preambles, content split by ads that we removed, etc.
		**/
		var articleContent        = document.createElement("DIV");
	    articleContent.id     = "readability-content";
		var siblingScoreThreshold = Math.max(10, topCandidate.readability.contentScore * 0.2);
		var siblingNodes          = topCandidate.parentNode.childNodes;
		for(var i=0, il=siblingNodes.length; i < il; i++)
		{
			var siblingNode = siblingNodes[i];

			dbg("Looking at sibling node: " + siblingNode + " (" + siblingNode.className + ":" + siblingNode.id + ")" + ((typeof siblingNode.readability != 'undefined') ? (" with score " + siblingNode.readability.contentScore) : ''));

			if (siblingNode === topCandidate ||
				(
				  typeof siblingNode.readability != 'undefined' &&
				  siblingNode.readability.contentScore >= siblingScoreThreshold
				) ||
			    (
				  siblingNode.nodeName == "P" &&
			      (
				    readability.getInnerText(siblingNode).length > 80 ||
				    readability.getLinkDensity(siblingNode) < 0.25
				  )
				)
			)
			{
				dbg("Appending node: " + siblingNode)

				/* Append sibling and subtract from our list because it removes the node when you append to another node */
				articleContent.appendChild(siblingNode);
				i--;
				il--;
			}
		}				


		/**
		 * So we have all of the content that we need. Now we clean it up for presentation.
		**/
		readability.prepArticle(articleContent);
		
		return articleContent;
	},
	
	/**
	 * Get the inner text of a node - cross browser compatibly.
	 * This also strips out any excess whitespace to be found.
	 *
	 * @param Element
	 * @return string
	**/
	getInnerText: function (e) {
		if (navigator.appName == "Microsoft Internet Explorer")
			return e.innerText.replace( /^\s+|\s+$/g, "" ).replace(/\s{2,}/g, " ");
		else
			return e.textContent.replace( /^\s+|\s+$/g, "" ).replace(/\s{2,}/g, " ");
	},

	/**
	 * Get the number of times a string s appears in the node e.
	 *
	 * @param Element
	 * @param string - what to split on. Default is ","
	 * @return number (integer)
	**/
	getCharCount: function (e,s) {
	    s = s || ",";
		return readability.getInnerText(e).split(s).length;
	},

	/**
	 * Remove the style attribute on every e and under.
	 * TODO: Test if getElementsByTagName(*) is faster.
	 *
	 * @param Element
	 * @return void
	**/
	cleanStyles: function (e) {
	    e = e || document;
	    var cur = e.firstChild;

		if(!e)
			return;

		// Remove any root styles, if we're able.
		if(typeof e.removeAttribute == 'function')
			e.removeAttribute('style');

	    // Go until there are no more child nodes
	    while ( cur != null ) {
			if ( cur.nodeType == 1 ) {
				// Remove style attribute(s) :
				cur.removeAttribute("style");
				readability.cleanStyles( cur );
			}
			cur = cur.nextSibling;
		}			
	},
	
	/**
	 * Get the density of links as a percentage of the content
	 * This is the amount of text that is inside a link divided by the total text in the node.
	 * 
	 * @param Element
	 * @return number (float)
	**/
	getLinkDensity: function (e) {
		if (typeof e.readability == "undefined")	{
			readability.initializeNode(e);
		}

		if (typeof e.readability.linkDensity == "undefined") {
			var links      = e.getElementsByTagName("a");
			var textLength = readability.getInnerText(e).length;
			var linkLength = 0;
			for(var i=0, il=links.length; i<il;i++)
			{
				linkLength += readability.getInnerText(links[i]).length;
			}		

			e.readability.linkDensity = linkLength / textLength;
		}

		return e.readability.linkDensity;
	},
	
	/**
	 * Remove extraneous break tags from a node.
	 *
	 * @param Element
	 * @return void
	 **/
	killBreaks: function (e) {
		try {
			e.innerHTML = e.innerHTML.replace(/(<br\s*\/?>(\s|&nbsp;?)*){1,}/g,'<br />');		
		}
		catch (e) {
			dbg("KillBreaks failed - this is an IE bug. Ignoring.");
		}
	},

	/**
	 * Clean an element of all tags of type "tag" if they look fishy.
	 * "Fishy" is an algorithm based on content length, classnames, link density, number of images & embeds, etc.
	 *
	 * @return void
	 **/
	cleanConditionally: function (e, tag) {
		var tagsList      = e.getElementsByTagName(tag);
		var curTagsLength = tagsList.length;

		/**
		 * Gather counts for other typical elements embedded within.
		 * Traverse backwards so we can remove nodes at the same time without effecting the traversal.
		 *
		 * TODO: Consider taking into account original contentScore here.
		**/
		for (var i=curTagsLength-1; i >= 0; i--) {
			var p      = tagsList[i].getElementsByTagName("p").length;
			var img    = tagsList[i].getElementsByTagName("img").length;
			var li     = tagsList[i].getElementsByTagName("li").length;
			var embed  = tagsList[i].getElementsByTagName("embed").length;
			var input  = tagsList[i].getElementsByTagName("input").length;
			var weight = 0;

			/* Look for a special classname */
			if (tagsList[i].className != "")
			{
				if(tagsList[i].className.search(readability.regexps.negativeRe) !== -1)
					weight -= 25;

				if(tagsList[i].className.search(readability.regexps.positiveRe) !== -1)
					weight += 25;				
			}

			/* Look for a special ID */
			if (typeof(tagsList[i].id) == 'string' && tagsList[i].id != "")
			{
				if(tagsList[i].id.search(readability.regexps.negativeRe) !== -1)
					weight -= 25;

				if(tagsList[i].id.search(readability.regexps.positiveRe) !== -1)
					weight += 25;				
			}

			if(weight < 0)
			{
				tagsList[i].parentNode.removeChild(tagsList[i]);
			}
			else if ( readability.getCharCount(tagsList[i],',') < 10) {
				/**
				 * If there are not very many commas, and the number of
				 * non-paragraph elements is more than paragraphs or other ominous signs, remove the element.
				**/
				var linkDensity   = readability.getLinkDensity(tagsList[i]);
				var contentLength = readability.getInnerText(tagsList[i]).length;

				if ( img > p || (tag != "ul" && li > p) || input > Math.floor(p/3) || contentLength < 25 || ((weight < 25 && linkDensity) > .2 || (weight >= 25 && linkDensity > .5))  || embed > 0) {
					tagsList[i].parentNode.removeChild(tagsList[i]);
				}
			}
		}
	},

	/**
	 * Clean a node of all elements of type "tag".
	 * (Unless it's a youtube/vimeo video. People love movies.)
	 *
	 * @param Element
	 * @param string tag to clean
	 * @return void
	 **/
	clean: function (e, tag) {
		var targetList = e.getElementsByTagName( tag );
		var isEmbed    = (tag == 'object' || tag == 'embed');

		for (var y=targetList.length-1; y >= 0; y--) {
			/* Allow youtube and vimeo videos through as people usually want to see those. */
			if(isEmbed && targetList[y].innerHTML.search(/http:\/\/www\.(youtube|vimeo)\.com/) !== -1)
			{
				continue;
			}

			targetList[y].parentNode.removeChild(targetList[y]);
		}
	},
	
	/**
	 * Show the email popup.
	 *
	 * @return void
	 **/
	emailBox: function () {
	    var emailContainer = document.getElementById('email-container');
	    if(null != emailContainer)
	    {
	        return;
	    }

	    var emailContainer = document.createElement('div');
	    emailContainer.setAttribute('id', 'email-container');
	    emailContainer.innerHTML = '<iframe src="'+readability.emailSrc + '?pageUrl='+escape(window.location)+'&pageTitle='+escape(document.title)+'" scrolling="no" onload="readability.removeFrame()" style="width:500px; height: 490px; border: 0;"></iframe>';

	    document.body.appendChild(emailContainer);			
	},
	
	/**
	 * Close the email popup. This is a hacktackular way to check if we're in a "close loop".
	 * Since we don't have crossdomain access to the frame, we can only know when it has
	 * loaded again. If it's loaded over 3 times, we know to close the frame.
	 *
	 * @return void
	 **/
	removeFrame: function () {
	    readability.iframeLoads++;
	    if (readability.iframeLoads > 3)
	    {
	        var emailContainer = document.getElementById('email-container');
	        if (null !== emailContainer) {
	            emailContainer.parentNode.removeChild(emailContainer);
	        }

	        readability.iframeLoads = 0;
	    }			
	}
	
};

readability.init();
