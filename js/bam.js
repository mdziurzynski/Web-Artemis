
var maxBamHgt = 550;
var bamViewPortHgt = 150;
var step = 3;
var bamObjs = new Array();

function bamObj(bamId) {
	this.bamId = bamId;
	this.isStack  = true;
	this.isStrand = false;
	this.flag = 4; // filter unmapped reads
}

function isBamVisible(bamId) {
	for(i=0; i<bamObjs.length; i++) {
		if(bamObjs[i].bamId == bamId)
			return true;
	}
	return false;
}

function getBamObj(bamId) {
	for(i=0; i<bamObjs.length; i++) {
		if(bamObjs[i].bamId == bamId)
			return bamObjs[i];
	}
	return null;
}

function removeBamObj(bamId) {
	var tmp = new Array();
	for(i=0; i<bamObjs.length; i++) {
		if(bamObjs[i].bamId != bamId) {
			tmp.push(bamObjs[i]);
		}
	}
	bamObjs = tmp;
}

var aSamCoverage = function ajaxGetSamCoverage(fDisplay, returned, options) {
	var coverage = returned.response.coverage;
	var max = returned.response.max;

	if(max == 0) {
		$("#bam"+options.bamId).drawLine(0, maxBamHgt-1, displayWidth, maxBamHgt-1,
				{color:'#0000FF', stroke:'1'});
	} else {
		var window = options.window;
		baseInterval = (fDisplay.basesDisplayWidth/displayWidth)*screenInterval;
		var basePerPixel  = baseInterval/screenInterval;
		
		for(i=0; i<coverage.length-1; i++ ) {
			var xpos1 = margin+Math.round( ((i*window)+(window/2)) /basePerPixel);
			var ypos1 = maxBamHgt-((coverage[i]/max)*bamViewPortHgt);
			var xpos2 = margin+Math.round( (((i+1)*window)+(window/2)) /basePerPixel);
			var ypos2 = maxBamHgt-((coverage[i+1]/max)*bamViewPortHgt);

			$("#bam"+options.bamId).drawLine(xpos1, ypos1, xpos2, ypos2,
				{color:'#0000FF', stroke:'1'});
		}
	}
	$('body').css('cursor','default');
};

var aSamCall = function ajaxGetSamRecords(fDisplay, returned, options) {
	var thisBam = getBamObj(options.bamId);
	thisBam.samRecords = returned.response.records;
	drawReadDisplay(fDisplay, thisBam);
}

function drawReadDisplay(fDisplay, thisBam) {	
	if(thisBam.isStack) {
		drawStack(fDisplay, thisBam);
	} else if(thisBam.isStrand) {
		drawStrandView(fDisplay, thisBam);
	}

	$('body').css('cursor','default');
};

var aSamSeqs = function ajaxGetSamSeqs(fDisplay, returned, options) {
    $("#bam"+options.bamId).html('');
	var samSeqs  = returned.response.sequences;	
	var sequenceName = samSeqs[0].name.replace(/(\|\.)/g,'\\$1');
	var thisBam = getBamObj(options.bamId);
	
	var start = fDisplay.leftBase;
	var end = parseInt(start) + parseInt(fDisplay.basesDisplayWidth);
	
	if(fDisplay.basesDisplayWidth > 4000) {
		var window = Math.round(fDisplay.basesDisplayWidth/100);
		var serviceName = '/sams/coverage.json?';
		handleAjaxCalling(serviceName, aSamCoverage,
			{ fileID:options.bamId, sequence:sequenceName, start:start, end:end, window:window/*, filter:thisBam.flag*/ }, fDisplay, { window:window, bamId:options.bamId });
	} else {
		serviceName = '/sams/query.json?';
		handleAjaxCalling(serviceName, aSamCall,
			{ fileID:options.bamId, sequence:sequenceName, start:start, end:end, filter:thisBam.flag }, fDisplay, { bamId:options.bamId });
	}
};

function drawStack(fDisplay, thisBam) {
	baseInterval = (fDisplay.basesDisplayWidth/displayWidth)*screenInterval;
	var basePerPixel  = baseInterval/screenInterval;
	
	var alignmentEnd   = thisBam.samRecords.alignmentEnd;
	var alignmentStart = thisBam.samRecords.alignmentStart;
	var name  = thisBam.samRecords.readName;
	var flags = thisBam.samRecords.flags;
	var ypos  = maxBamHgt-1;

    var lastEndAtZero = -100;
    var lastStart = -1;
    var lastEnd   = -1; 
    var properPair = true;
    
    var colour = '#000000';
	for(var i=0; i<thisBam.samRecords.alignmentStart.length; i++ ) {
		var thisStart = alignmentStart[i]-fDisplay.leftBase;
		var thisEnd   = alignmentEnd[i]-fDisplay.leftBase;
		var thisName  = name[i];
		var thisFlags = flags[i];
		
		if(lastStart == thisStart && lastEnd == thisEnd) {
			if(colour == '#32cd32') {
				// already drawn
				continue;
			}
			colour = '#32cd32';
		} else {
			lastStart = thisStart;
			lastEnd   = thisEnd;
			
			if(thisFlags & 0x0002) {
				colour = '#0000FF';
			} else if(properPair && !(thisFlags & 0x0002)) {
				continue;
			}
			if(thisStart > lastEndAtZero+1 || (fDisplay.marginTop-ypos) > maxBamHgt) {
				ypos=maxBamHgt-1;
				lastEndAtZero = thisEnd;
			} else {
				ypos=ypos-step;
			}
		}
			
		drawRead(thisStart, thisEnd, colour, ypos, basePerPixel, thisBam, i);
	}	
}

function drawStrandView(fDisplay, thisBam) {
	baseInterval = (fDisplay.basesDisplayWidth/displayWidth)*screenInterval;
	var basePerPixel  = baseInterval/screenInterval;
	
	//var bamTop = $("#bam"+fDisplay.index).css('margin-top').replace("px", "");
	var midPt = Math.round(maxBamHgt/2);
	
	drawStrand(fDisplay, thisBam, -step, true, basePerPixel, midPt); // fwd
	drawStrand(fDisplay, thisBam, step, false, basePerPixel, midPt); // rev
}

function drawStrand(fDisplay, thisBam, thisStep, isNegStrand, basePerPixel, midPt) {
	var samRecords = thisBam.samRecords;
	var bamId = thisBam.bamId;
	var alignmentEnd   = samRecords.alignmentEnd;
	var alignmentStart = samRecords.alignmentStart;
	var name  = samRecords.readName;
	var flags = samRecords.flags;

	var ypos  = midPt+thisStep;
    var lastEndAtZero = -100;
    var lastStart = -1;
    var lastEnd   = -1; 
    
    var colour = '#000000';
	for(var i=0; i<samRecords.alignmentStart.length; i++ ) {
		if( (!isNegStrand && !(samRecords.flags[i] & 0x0010)) || //reverse strand
		    ( isNegStrand &&   samRecords.flags[i] & 0x0010) ) 
			continue;
		
		var thisStart = alignmentStart[i]-fDisplay.leftBase;
		var thisEnd   = alignmentEnd[i]-fDisplay.leftBase;
		var thisName  = name[i];
		var thisFlags = flags[i];
		
		if(thisFlags & 0x0004) { // unmapped
			continue;
		}
		
		if(lastStart == thisStart && lastEnd == thisEnd) {
			if(colour == '#32cd32') {
				// already drawn
				continue;
			}
			colour = '#32cd32';
		} else {
			lastStart = thisStart;
			lastEnd   = thisEnd;
			
			if(thisFlags & 0x0002) {        // read mapped in proper pair
				colour = '#0000FF';
			} else {
				colour = '#000000';
			}

			if(thisStart > lastEndAtZero+1 || (maxBamHgt-ypos) > maxBamHgt ||
					(maxBamHgt-ypos) < 10) {
				ypos = midPt+thisStep;
				lastEndAtZero = thisEnd;
			} else {
				ypos=ypos+thisStep;
			}
		}
			
		drawRead(thisStart, thisEnd, colour, ypos, basePerPixel, thisBam, i);
	}	
}

function drawRead(thisStart, thisEnd, colour, ypos, basePerPixel, thisBam, idx) {
	thisStart = margin+Math.round(thisStart/basePerPixel);
	thisEnd   = margin+Math.round(thisEnd/basePerPixel);

	if(thisBam.click) {
		if(thisBam.samRecords.readName[idx] == thisBam.readName) {
			$("#bam"+thisBam.bamId).drawLine(thisStart, ypos, thisEnd, ypos,
					{color:colour, stroke:'3'});

			// put the index of the clicked read at the start of this array
			if(thisBam.mouseOverY+2 > ypos      && thisBam.mouseOverY-2 < ypos &&
			   thisBam.mouseOverX   > thisStart && thisBam.mouseOverX   < thisEnd )
				thisBam.idx.unshift(idx);
			else
				thisBam.idx.push(idx);
			return;
		}
	} else if(thisBam.mouseOverY+2 > ypos      && thisBam.mouseOverY-2 < ypos &&
			  thisBam.mouseOverX   > thisStart && thisBam.mouseOverX   < thisEnd ) {
		thisBam.readName = thisBam.samRecords.readName[idx];
	}
	if(thisBam.mouseOver)
		return;

	$("#bam"+thisBam.bamId).drawLine(thisStart, ypos, thisEnd, ypos,
			{color:colour, stroke:'1'});
}

function drawBam(fDisplay, bamId) {
	var serviceName = '/sams/sequences.json?';
	
	var thisBam = getBamObj(bamId);
	if(thisBam == null) {
		thisBam = new bamObj(bamId);
		bamObjs.push(thisBam);
	}
	
	if(bamId == undefined) {
		for(i=0; i<bamObjs.length; i++) {
			if(bamObjs[i].bamId == undefined)
				continue;
			
			if(i ==  1) {
				$('body').css('cursor','wait');
			}
			handleAjaxCalling(serviceName, aSamSeqs,
					{ fileID:bamObjs[i].bamId }, fDisplay, { bamId : bamObjs[i].bamId });
		}
	} else {
		$('body').css('cursor','wait');
		handleAjaxCalling(serviceName, aSamSeqs,
				{ fileID:bamId }, fDisplay, { bamId : bamId });
	}
}

function addBamMenu(fDisplay, bamId) {
	$('#menuHeader').append('<ul id="bamMenus'+bamId+'" class="contextMenu" style="width:290px;">' +
    		'<li><a href="#stack">Stack View</a></li>'+
    		'<li><a href="#strand">Strand Stack View</a></li>'+
    		'<li><a href="#filter">Filter By Flags ...</a></li>'+
   		'</ul>');

    $('#bam'+bamId).contextMenu({menu: 'bamMenus'+bamId}, 
    		function(action, el, pos) { rightClickBamMenu(action, el, pos, fDisplay, bamId) });
}

var rightClickBamMenu = function(action, el, pos, self, bamId) {
	var thisBam = getBamObj(bamId);

	if(action.match(/stack/)) {
		thisBam.isStrand = false;
		thisBam.isStack = true;
		$("#bam"+bamId).html('');
		$("#bamscroll"+bamId).scrollTop(maxBamHgt);
		drawReadDisplay(self, thisBam);
	} else if(action.match(/strand/)) {
		thisBam.isStrand = true;
		thisBam.isStack = false;
		$("#bam"+bamId).html('');	
		$("#bamscroll"+bamId).scrollTop( (maxBamHgt-bamViewPortHgt)/2 );
		drawReadDisplay(self, thisBam);
	} else if(action.match(/filter/)) {
		filterFlagsDisplay(self, thisBam);
	}
};

function adjustHeight(fDisplay, hgt) {
	$('#ticks'+fDisplay.index).find('.tickClass').each(function(index) {
	    var thisTop = parseInt($(this).css('margin-top').replace("px", ""));
	    $(this).css({'margin-top': thisTop+hgt+'px'});
	 });
	
	$('div[id*=features'+fDisplay.index+']').find('[class*=feat]').each(function(index) {
		var thisTop = parseInt($(this).css('margin-top').replace("px", ""));
	    $(this).css({'margin-top': thisTop+hgt+'px'});
	 });
	
	var thisTop = parseInt($('#featureList').css('top').replace("px", ""));
    $('#featureList').css({'top': thisTop+hgt+'px'});
}

function showPopupBam(thisBam, event) {
	var msg = thisBam.samRecords.readName[thisBam.idx[0]]+"<br />";
	msg += "<table><tr><td>Position</td><td>"+
	 	   thisBam.samRecords.alignmentStart[thisBam.idx[0]]+".."+
	       thisBam.samRecords.alignmentEnd[thisBam.idx[0]]+"</td></tr>";
	if(thisBam.idx.length > 1)
		msg += "<tr><td>Mate Position</td><td>"+
		       thisBam.samRecords.alignmentStart[thisBam.idx[1]]+".."+
	       	   thisBam.samRecords.alignmentEnd[thisBam.idx[1]]+"</td></tr>";
	msg += "</table>";
	
	msg += printFlagHTML(thisBam.samRecords.flags[thisBam.idx[0]]);
	loadPopup(msg, event.pageX+10, event.pageY+10, 20000);
}

function handleBamClick(fDisplay, event, tgt) {
	var bamId = $(event.currentTarget).attr('id').replace("bam","");
	var x = Math.round(event.pageX - $(event.target).offset().left);
	var y = Math.round(event.pageY - $(event.target).offset().top);

	var thisBam = getBamObj(bamId);
	thisBam.x = x;
	thisBam.y = y;
	thisBam.click = true;
	thisBam.idx = new Array();

	$("#bam"+bamId).html('');
	drawReadDisplay(fDisplay, thisBam);
	thisBam.click = false;
	showPopupBam(thisBam, event);
}

function handleBamDoubleClick(fDisplay, event, tgt, region) {
	var bamId = $(event.currentTarget).attr('id').replace("bam","");
	var thisBam = getBamObj(bamId);
	thisBam.x = undefined;
	thisBam.y = undefined;
	thisBam.readName = undefined;
	$("#bam"+bamId).html('');
	drawReadDisplay(fDisplay, thisBam);
}

function addDragEdge(fDisplay) {
	$('#bamDrag').remove();
	var nbams = $('.bamScroll').size();
	
	if(nbams > 0)
		return;
	
	$('#bam').append('<div id="bamDrag" class="ui-resizable-se ui-icon ui-icon-gripsmall-diagonal-se"></div>');
	setDragCss(fDisplay);

	$('#bamDrag').draggable({
		stop: function(event, ui) {
			var nbams = $('.bamScroll').size();
			var hgt = ((ui.offset.top)-(margin*6)+ $("#bamDrag").height())/nbams;
			var diff = hgt-bamViewPortHgt;
			bamViewPortHgt = hgt;
			
			$('.bamScroll').css('height', bamViewPortHgt+'px');

			fDisplay.marginTop = fDisplay.marginTop+(diff*nbams);
			adjustFeatureDisplayPosition(false, fDisplay);
			drawFrameAndStrand(fDisplay);
		    adjustHeight(fDisplay, diff*nbams);
		    
		    hgt = $("#bamDrag").height()/2;
		    $("#bamDrag").css('left',displayWidth-hgt+margin+'px');
		}
	});
}

function setDragCss(fDisplay) {
	var hgt = $("#bamDrag").height()/2;
	var top = fDisplay.marginTop+bamViewPortHgt-(hgt*2)-margin;

	var cssObj = {
			'border': '0px solid #FF0000',
			'position': 'absolute',
		    'left': displayWidth-hgt+margin+'px',
		    'top': top+'px',
		    'z-index':'2'
		};
	
	$("#bamDrag").css(cssObj);
}

function addBamDisplay(fDisplay, tgt) {
	var bamId = $(tgt).attr('name');
	addDragEdge(fDisplay);

	$('#bam').append('<div id="bamscroll'+bamId+'" class="bamScroll" title="'+$(tgt).attr('text')+'"></div></div>');
	$('#bam').append('<span id="bamClose'+bamId+'" class="ui-icon ui-icon-circle-close" title="close"></span>');
	
	$('#bamscroll'+bamId).append('<div id="bam'+bamId+'" class="canvas"></div>');
	
	var hgt = fDisplay.marginTop-5;
	$("#bam"+bamId).css( { 'height': maxBamHgt+'px', 'width': displayWidth+margin+'px' });
	$('#bamscroll'+bamId).css({ 
		'margin-top': hgt+'px', 
		'height': bamViewPortHgt+'px', 
		'width': displayWidth+margin+20+'px', 
		'border': '1px solid #666',
		'background-color': '#ccc'});

	$('#bamClose'+bamId).css({
		'margin-left': '0px', 
		'position':'absolute', 
		'margin-top': hgt+'px', 
		'border': '1px solid #666'});
	
	$('#bamClose'+bamId).click(function() {
		removeBamDisplay(fDisplay, bamId);
	});
	
	$("#bamscroll"+bamId).scrollTop(maxBamHgt);
	fDisplay.marginTop = fDisplay.marginTop+bamViewPortHgt;
	
	adjustFeatureDisplayPosition(false, fDisplay);
	drawFrameAndStrand(fDisplay);
    addBamMenu(fDisplay, bamId);
    drawBam(fDisplay, bamId); 
    adjustHeight(fDisplay, $('#bamscroll'+bamId).height());
    
	// click handler
	$('#bam'+bamId).single_double_click(handleBamClick, handleBamDoubleClick, fDisplay, 500);
	$('#bam'+bamId).mousemove(function(event) {
		disablePopup();
		var bamId = $(event.currentTarget).attr('id').replace("bam","");
		var thisBam = getBamObj(bamId);
		
		if( !thisBam.samRecords )
			return;
		
		thisBam.mouseOverX = Math.round(event.pageX - $(event.target).offset().left);
		thisBam.mouseOverY = Math.round(event.pageY - $(event.target).offset().top);
		thisBam.mouseOver = true;

		drawReadDisplay(fDisplay, thisBam);
		thisBam.mouseOver = false;
	});
}

function removeBamDisplay(fDisplay, bamId) {
	if(bamId != undefined) {
		removeBamObj(bamId);
		removeBam(fDisplay, bamId);
	} else {
		for(i=0; i<bamObjs.length; i++) {
			if(bamObjs[i].bamId == undefined)
				continue;
			removeBam(fDisplay, bamObjs[i].bamId);
		}
		bamObjs = new Array();
	}
	
	if($('.bamScroll').size() == 0)
		$('#bamDrag').remove();
}

function removeBam(fDisplay, bamId) {
	var hgt = $('#bamscroll'+bamId).height();
	// remove bam ID from array of current bam's
	var top = $("#bamscroll"+bamId).css('margin-top').replace("px", "");
	$("#bam"+bamId).remove();
	$('#bamClose'+bamId).remove();
	$("#bamscroll"+bamId).remove();

	$('.bamScroll').each(function(index) {
	    var thisTop = $(this).css('margin-top').replace("px", "");
	    if(parseInt(thisTop) > parseInt(top)) {
	    	$(this).css({'margin-top': thisTop-hgt+'px'});
	    }
	 });
	
	$('[id*=bamClose]').each(function(index) {
	    var thisTop = $(this).css('margin-top').replace("px", "");
	    if(parseInt(thisTop) > parseInt(top)) {
	    	$(this).css({'margin-top': thisTop-hgt+'px'});
	    }
	 });

	fDisplay.marginTop = fDisplay.marginTop-hgt;
	adjustFeatureDisplayPosition(false, fDisplay);
	drawFrameAndStrand(fDisplay);
    adjustHeight(fDisplay, -hgt);
}