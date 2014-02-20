
var maxBamHgt = 650;
var bamViewPortHgt = 150;
var step = 4;
var maxDisplayWidth = 16000;
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

var aSamCoverage = function ajaxGetSamCoverage(fDisplay, returnedCoverage, options) {
	var coverage = returnedCoverage.data;
	var max = returnedCoverage.max;

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
		
		// draw max value
		var thisBam = getBamObj(options.bamId);
		var ctx = getBamCanvasCtx(thisBam, false);
		var maxStr = max+"";
		drawString(ctx, maxStr, displayWidth-(12*(maxStr.length-1)), maxBamHgt-bamViewPortHgt+14, '#000000', 0,"Courier New",12);
	}
	$('body').css('cursor','default');
};

var aSamCall = function ajaxGetSamRecords(fDisplay, query, options) {
	var thisBam = getBamObj(options.bamId);
    thisBam.samRecords = query.records;
	drawReadDisplay(fDisplay, thisBam);
}

function drawReadDisplay(fDisplay, thisBam) {
	
	if(isZoomedIn(fDisplay)) {
		drawSequenceStack(fDisplay, thisBam);
	} else if(thisBam.isStack) {
		drawStack(fDisplay, thisBam);
	} else if(thisBam.isStrand) {
		drawStrandView(fDisplay, thisBam);
	}

	$('body').css('cursor','default');
};

var aSamSeqs = function ajaxGetSamSeqs(fDisplay, samSeqs, options) {
    $("#bam"+options.bamId).html('');
	
	var sequenceName = fDisplay.srcFeature;  //samSeqs[0].name.replace(/(\|\.)/g,'\\$1');
	var thisBam = getBamObj(options.bamId);
	
	var start = fDisplay.leftBase;
	var end = parseInt(start) + parseInt(fDisplay.basesDisplayWidth);
	
	if(fDisplay.basesDisplayWidth > maxDisplayWidth) {
		var window = Math.round(fDisplay.basesDisplayWidth/400);
		var serviceName = '/sams/coverage.json?';
		handleAjaxCalling(serviceName, aSamCoverage,
			{ fileID:options.bamId, sequence:sequenceName, start:start, end:end, window:window, contained:false/*, filter:thisBam.flag*/ }, fDisplay, { window:window, bamId:options.bamId });
	} else {
		serviceName = '/sams/query.json?';
		
		var props = ['alignmentBlocks', 'readName', 'flags'];
		if(isZoomedIn(fDisplay)){
			props.push('readString');
		}
		handleAjaxCalling(serviceName, aSamCall,
			{ fileID:options.bamId, sequence:sequenceName, start:start, end:end, filter:thisBam.flag, properties:props, contained:false }, fDisplay, { bamId:options.bamId });
	}
};


function getBamCanvasCtx(thisBam, clearCanvas) {
	  var width = $("#bam"+thisBam.bamId).css('width').replace("px", "");
	  var height = $("#bam"+thisBam.bamId).css('height').replace("px", "");

	  if (!$("#bam"+thisBam.bamId).find('canvas').get(0)) {
		  $("#bam"+thisBam.bamId).append("<canvas  width='"+width+"' height='"+height+"' style='position: absolute; top: 0; left: 0;'></canvas>");
	  }
	  
	  var canvas = $("#bam"+thisBam.bamId).find("canvas").get(0);
	  var ctx = canvas.getContext("2d");
	  if(clearCanvas) {
		  ctx.clearRect(0, 0, width, height);
	  }
	  return ctx;
}

function drawSequenceStack(fDisplay, thisBam) {
	baseInterval = (fDisplay.basesDisplayWidth/displayWidth)*screenInterval;
	var basePerPixel  = baseInterval/screenInterval;
	var ypos  = maxBamHgt+13;
    var ctx = getBamCanvasCtx(thisBam, true);
    
    var nreads = thisBam.samRecords.alignmentBlocks.length;
    var drawn = new Array(nreads);
    for(var i=0; i<nreads; i++) {
      drawn[i] = false;
    }
   
    for (var i = 0; i < nreads; i++) {
        if (!drawn[i]) {
        	ypos -= 14;
        	var thisEnd = drawSeq(thisBam, fDisplay, ypos, basePerPixel, ctx, i);
        	drawn[i] = true;

        	if (thisEnd == 0) {
        		var thisStart = thisBam.samRecords.alignmentBlocks[i][0].referenceStart-fDisplay.leftBase;
        		thisEnd = thisStart + thisBam.samRecords.readString[i].length;
        	}
        	
        	for (var j = i + 1; j < nreads; j++) {
        		if (!drawn[j]) {
        			var nextStart = thisBam.samRecords.alignmentBlocks[j][0].referenceStart-fDisplay.leftBase;
        			if (nextStart > thisEnd + 1) {
        				var nextEnd = drawSeq(thisBam, fDisplay, ypos, basePerPixel, ctx, j);
        				drawn[j] = true;
        				thisEnd = nextEnd;
        	        	if (thisEnd == 0) {
        	        		thisEnd = nextStart + thisBam.samRecords.readString[j].length;
        	        	}
        			} 
        		}
        	}
        }
    }
}

// draw zoomed in read sequence
function drawSeq(thisBam, fDisplay, ypos, basePerPixel, ctx, i) {
	var thisFlags = thisBam.samRecords.flags[i];
	var readStr   = thisBam.samRecords.readString[i];

	if(thisFlags & 0x0001) {
		colour = '#0000FF';
	} else {
		colour = '#000000';
	}

	var xlast = -100000;
	var blockEnd = -1;

	var j;
	var k;
	for(j=0; j<thisBam.samRecords.alignmentBlocks[i].length; j++) {
		var blockStart = thisBam.samRecords.alignmentBlocks[i][j].referenceStart-fDisplay.leftBase;
		var blockLen = thisBam.samRecords.alignmentBlocks[i][j].length;
		blockEnd = blockStart+blockLen;

		var xpos = margin+Math.round(blockStart/basePerPixel);
		var xposEnd = margin+Math.round(blockEnd/basePerPixel);
		var readStart = thisBam.samRecords.alignmentBlocks[i][j].readStart-1;
		var lineCol = '#FFFFFF';
		if(thisBam.click) {
			if(thisBam.samRecords.readName[i] == thisBam.readName) {
				
				if($.inArray(i, thisBam.idx) == -1) {
				// put the index of the clicked read at the start of this array
					if(thisBam.mouseOverY+7 > ypos      && thisBam.mouseOverY-7 < ypos &&
					   thisBam.mouseOverX   > blockStart && thisBam.mouseOverX   < blockEnd )
						thisBam.idx.unshift(i);
					else
						thisBam.idx.push(i);
				}
				
				// drawRect seems broken so using drawPolygon
				//$("#bam"+thisBam.bamId).drawRect(xpos, (ypos-11), (xposEnd-xpos), 13, {color:'#FF0000', stroke:3});
				var Xpoints = new Array(xpos, xpos, xposEnd, xposEnd) ;
				var Ypoints = new Array((ypos-11),(ypos+2),(ypos+2),(ypos-11)) ;
				lineCol = '#FF0000';
				$("#bam"+thisBam.bamId).drawPolygon(Xpoints,Ypoints, {color:lineCol, stroke:1});
			} 
		} else if(thisBam.mouseOverY+7 > ypos      && thisBam.mouseOverY-7 < ypos &&
				  thisBam.mouseOverX   > xpos && thisBam.mouseOverX   < xposEnd ) {
			thisBam.readName = thisBam.samRecords.readName[i];
		}
		
		if(xlast > -100000) {
			// join alignment blocks
			$("#bam"+thisBam.bamId).drawLine(xlast, ypos-3, xpos, ypos-3, {color:lineCol, stroke:1});
		}
		
		for(k=0; k<blockLen; k++) {
			var thisColour = colour;
			if(blockStart+k > -1) {
				// colour SNPs red
				if(fDisplay.sequence.charAt(blockStart+k) != readStr.charAt(readStart+k)) {
					thisColour = "#FF0000";
				}
			}
			
			drawString(ctx, readStr.charAt(readStart+k), xpos, ypos, thisColour, 0,"Courier New",14);
			xpos += (1/basePerPixel);
		}
		xlast = xpos+1;
	}
	return blockEnd;
}


function drawStack(fDisplay, thisBam) {
	baseInterval = (fDisplay.basesDisplayWidth/displayWidth)*screenInterval;
	var basePerPixel  = baseInterval/screenInterval;
	
	var name  = thisBam.samRecords.readName;
	var flags = thisBam.samRecords.flags;
	var blocks = thisBam.samRecords.alignmentBlocks;
	var ypos  = maxBamHgt-1;

    var lastEndAtZero = -100;
    var lastStart = -1;
    var lastEnd   = -1; 
    var properPair = true;
   
    var colour = '#000000';
    var i;
    var j;
	for(i=0; i<thisBam.samRecords.alignmentBlocks.length; i++ ) {
		var thisName  = name[i];
		var thisFlags = flags[i];

		var lastIdx = blocks[i].length-1;
		var thisStart = blocks[i][0].referenceStart - fDisplay.leftBase;
		var thisEnd   = blocks[i][lastIdx].length + blocks[i][lastIdx].referenceStart - fDisplay.leftBase;

		if(lastStart == thisStart && lastEnd == thisEnd) {
			if(colour == '#32cd32') {
				// already drawn
				continue;
			}
			colour = '#32cd32';
		} else {
			if(thisFlags & 0x0001) {
				colour = '#0000FF';
			} else {
				colour = '#000000';
			}
		}

		if(i == 0 || thisStart > lastEndAtZero+2 || (fDisplay.marginTop-ypos) > maxBamHgt) {
			ypos=maxBamHgt-1;
			lastEndAtZero = thisEnd;
		} else {
			ypos=ypos-step;
		}

		var blockEnd;
		var lastBlockEnd = -1;
		for(j=0; j<thisBam.samRecords.alignmentBlocks[i].length; j++) {
			var blockStart = blocks[i][j].referenceStart-fDisplay.leftBase;
			blockEnd   = blocks[i][j].length+blockStart-1;	
			drawRead(blockStart, blockEnd, colour, ypos, basePerPixel, thisBam, i);
			
			if(lastBlockEnd > -1) {
				drawRead(lastBlockEnd, blockStart, '#808080', ypos, basePerPixel, thisBam, i);
			}
			lastBlockEnd = blockEnd;
		}
		
		lastStart = thisStart;
		lastEnd   = thisEnd;
	}	
}

function drawStrandView(fDisplay, thisBam) {
	baseInterval = (fDisplay.basesDisplayWidth/displayWidth)*screenInterval;
	var basePerPixel  = baseInterval/screenInterval;
	
	//var bamTop = $("#bam"+fDisplay.index).css('margin-top').replace("px", "");
	var midPt = Math.round(maxBamHgt/2);
	
	drawStrand(fDisplay, thisBam, -step, true, basePerPixel, midPt); // fwd
	drawStrand(fDisplay, thisBam, step, false, basePerPixel, midPt); // rev
	
	$("#bam"+thisBam.bamId).drawLine(0, midPt, displayWidth+margin, midPt,
			{color:'#800080', stroke:'1'});
}

function drawStrand(fDisplay, thisBam, thisStep, isNegStrand, basePerPixel, midPt) {
	var samRecords = thisBam.samRecords;
	var bamId = thisBam.bamId;
	
	var name  = thisBam.samRecords.readName;
	var flags = thisBam.samRecords.flags;

	var ypos  = midPt+thisStep;
    var lastEndAtZero = -100;
    var lastStart = -1;
    var lastEnd   = -1; 
    
    var colour = '#000000';
    
    for(var i=0; i<thisBam.samRecords.alignmentBlocks.length; i++ ) {
		if( (!isNegStrand && !(samRecords.flags[i] & 0x0010)) || //reverse strand
		    ( isNegStrand &&   samRecords.flags[i] & 0x0010) ) 
			continue;
		
		var thisName  = name[i];
		var thisFlags = flags[i];

		var lastIdx = thisBam.samRecords.alignmentBlocks[i].length-1;
		var thisStart = thisBam.samRecords.alignmentBlocks[i][0].referenceStart-fDisplay.leftBase;
		var thisEnd   = thisBam.samRecords.alignmentBlocks[i][lastIdx].length+thisStart-1;
		
		if(lastStart == thisStart && lastEnd == thisEnd) {
			if(colour == '#32cd32') {
				// already drawn
				continue;
			}
			colour = '#32cd32';
		} else {
			if(thisFlags & 0x0001) {
				colour = '#0000FF';
			} else {
				colour = '#000000';
			}
		}

		var blockEnd;
		var lastBlockEnd = -1;
		for(var j=0; j<thisBam.samRecords.alignmentBlocks[i].length; j++) {
			var blockStart = thisBam.samRecords.alignmentBlocks[i][j].referenceStart-fDisplay.leftBase;
			blockEnd   = thisBam.samRecords.alignmentBlocks[i][j].length+blockStart-1;	
			drawRead(blockStart, blockEnd, colour, ypos, basePerPixel, thisBam, i);
			
			if(lastBlockEnd > -1) {
				drawRead(lastBlockEnd, blockStart, '#808080', ypos, basePerPixel, thisBam, i);
			}
			lastBlockEnd = blockEnd;
		}

		lastStart = thisStart;
		lastEnd   = blockEnd;
		if(thisStart > lastEndAtZero+1 || (fDisplay.marginTop-ypos) > maxBamHgt) {
			ypos = midPt+thisStep;
			lastEndAtZero = blockEnd;
		} else {
			ypos=ypos+thisStep;
		}
	}	
}

function drawRead(thisStart, thisEnd, colour, ypos, basePerPixel, thisBam, idx) {
	thisStart = margin+Math.round(thisStart/basePerPixel);
	thisEnd   = margin+Math.round(thisEnd/basePerPixel);

	if(thisBam.click) {
		if(thisBam.samRecords.readName[idx] == thisBam.readName) {
			$("#bam"+thisBam.bamId).drawLine(thisStart, ypos, thisEnd, ypos,
					{color:colour, stroke:'3'});

			if($.inArray(idx, thisBam.idx) == -1) {
			// put the index of the clicked read at the start of this array
				if(thisBam.mouseOverY+2 > ypos      && thisBam.mouseOverY-2 < ypos &&
				   thisBam.mouseOverX   > thisStart && thisBam.mouseOverX   < thisEnd )
					thisBam.idx.unshift(idx);
				else
					thisBam.idx.push(idx);
			}
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

	var blocks = thisBam.samRecords.alignmentBlocks;
	if(!blocks || blocks.length < 1)
		return;
	var lastIdx   = blocks[thisBam.idx[0]].length-1;
	var thisStart = blocks[thisBam.idx[0]][0].referenceStart;
	var thisEnd   = blocks[thisBam.idx[0]][lastIdx].referenceStart+
	                blocks[thisBam.idx[0]][lastIdx].length-1;
	
	msg += "<table><tr><td>Position</td><td>"+thisStart+".."+thisEnd+"</td></tr>";
	if(thisBam.idx.length > 1) {
		lastIdx   = blocks[thisBam.idx[1]].length-1;
		thisStart = blocks[thisBam.idx[1]][0].referenceStart;
		thisEnd   = blocks[thisBam.idx[1]][lastIdx].referenceStart+
		            blocks[thisBam.idx[1]][lastIdx].length-1;
		msg += "<tr><td>Mate Position</td><td>"+thisStart+".."+thisEnd+"</td></tr>";
	}
	msg += "</table>";
	
	msg += printFlagHTML(thisBam.samRecords.flags[thisBam.idx[0]]);
	loadPopup(msg, event.pageX+10, event.pageY+10, 20000);
}

function handleBamClick(fDisplay, event, tgt) {
	if(fDisplay.basesDisplayWidth > maxDisplayWidth) {
		return;
	}
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
	if(fDisplay.basesDisplayWidth > maxDisplayWidth) {
		return;
	}
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

	$('#bam').append('<div id="bamscroll'+bamId+'" class="bamScroll" title="'+$(tgt).text()+'"></div></div>');
	$('#bam').append('<span id="bamClose'+bamId+'" class="ui-icon ui-icon-circle-close" title="close"></span>');
	
	$('#bamscroll'+bamId).append('<div id="bam'+bamId+'" class="canvas"></div>');
	
	var hgt = fDisplay.marginTop-5;
	$("#bam"+bamId).css( { 'height': maxBamHgt+'px', 'width': displayWidth+margin+'px' });
	$('#bamscroll'+bamId).css({ 
		'margin-top': hgt+'px', 
		'height': bamViewPortHgt+'px', 
		'width': displayWidth+margin+20+'px', 
		'border': '1px solid #666',
		'background-color': '#F0F0F0'});

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