var style     = "style-newspaper";
var size      = "size-medium";
var margin    = "margin-wide";
var footnotes = false;

var baseHref = window.location.toString().match(/.*\//);
var linkStringStart = "javascript:(function(){";
var linkStringEnd   = "';_readability_script=document.createElement('SCRIPT');_readability_script.type='text/javascript';_readability_script.src='" + baseHref + "js/readability.js?x='+(Math.random());document.getElementsByTagName('head')[0].appendChild(_readability_script);_readability_css=document.createElement('LINK');_readability_css.rel='stylesheet';_readability_css.href='" + baseHref + "css/readability.css';_readability_css.type='text/css';_readability_css.media='all';document.getElementsByTagName('head')[0].appendChild(_readability_css);_readability_print_css=document.createElement('LINK');_readability_print_css.rel='stylesheet';_readability_print_css.href='" + baseHref + "css/readability-print.css';_readability_print_css.media='print';_readability_print_css.type='text/css';document.getElementsByTagName('head')[0].appendChild(_readability_print_css);})();";

$(document).ready(function() {
    
    if($.browser.msie) {
		$('#bookmarkletLink').html('<img src="images/badge-readability.png" width="174" height="40" alt="Readability" title="Readability" />');

        $("#browser-instruction-placer").hide();
        $("#browser-instruction-ie").fadeIn('100');
        $("#bookmarkletLink").css("cursor","pointer");
        $("#video-instruction").attr("href","#video-ie");
    }
    else {
        $("#browser-instruction-placer").hide();
        $("#browser-instruction").fadeIn('100');
    }
						   
	$("#bookmarkletLink").attr("href", linkStringStart + "readStyle='" + style + "';readSize='" + size + "';readMargin='" + margin + linkStringEnd);
	
	function applyChange(s,y) {
		var example    = $('#example'),
		    article    = $('#articleContent');
		    references = $('#references');
		
		switch(s){
			case "style":
				style = y;
				break;
			case "size":
				size = y;
				break;
			case "margin":
				margin = y;
				break;
			case "footnotes":
				footnotes = y;
		}
		example.attr('className', style);
		article.attr('className', margin + " " + size);
		example.toggleClass('showFootnotes', footnotes);
		
		$("#bookmarkletLink").attr("href", linkStringStart + "readConvertLinksToFootnotes=" + (footnotes ? 'true' : 'false') + ";readStyle='" + style + "';readSize='" + size + "';readMargin='" + margin + linkStringEnd);
	}
	
	$("#settings input[type='radio']").bind("click", function(){
		applyChange(this.name, this.value);
	});
	$("#settings input[type='checkbox']").bind("click", function() {
		applyChange(this.name, this.checked);
	});
	$("#bookmarkletLink").bind("click", function(){
		if($.browser.msie){
			alert("To start using Readability, right-click and select 'Add To Favorites...' to save this link to your browser's bookmarks toolbar.");
		}
		else {
			alert("To start using Readability, drag this link to your browser's bookmarks toolbar.");
		}
		return false;
	});

    $('.video').fancybox({
        zoomSpeedIn: 0,
        zoomSpeedOut: 0,
        overlayShow: true,
        overlayOpacity: 0.85,
        overlayColor: "#091824",
        hideOnContentClick: false,
        frameWidth: 480,
        frameHeight: 360
    });

    $('#footnote-details').fancybox({
        zoomSpeedIn: 0,
        zoomSpeedOut: 0,
        overlayShow: true,
        overlayOpacity: 0.85,
        overlayColor: "#091824",
        hideOnContentClick: true,
        frameWidth: 480
    });
});
