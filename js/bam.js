
var maxBamHgt = 550;
var bamViewPortHgt = 150;
var step = 3;
var isStack  = true;
var isStrand = false;
var samRecords;

var aSamCoverage = function ajaxGetSamCoverage(fDisplay, returned, options) {
	var coverage = returned.response.coverage;
	var max = returned.response.max;
	var window = options.window;
	baseInterval = (fDisplay.basesDisplayWidth/displayWidth)*screenInterval;
	var basePerPixel  = baseInterval/screenInterval;
	
	for(i=0; i<coverage.length-1; i++ ) {
		var xpos1 = margin+Math.round( ((i*window)+(window/2)) /basePerPixel);
		var ypos1 = maxBamHgt-((coverage[i]/max)*bamViewPortHgt);
		var xpos2 = margin+Math.round( (((i+1)*window)+(window/2)) /basePerPixel);
		var ypos2 = maxBamHgt-((coverage[i+1]/max)*bamViewPortHgt);

		$("#bam"+options.bamId).drawLine(xpos1, ypos1, xpos2, ypos2,
				{color:colour, stroke:'1'});
	}
	$('body').css('cursor','default');
};

var aSamCall = function ajaxGetSamRecords(fDisplay, returned, options) {
	samRecords  = returned.response.records;

	if(isStack) {
		drawStack(fDisplay, samRecords, options.bamId);
	}
	else if(isStrand) {
		drawStrandView(fDisplay, samRecords, options.bamId);
	}

	$('body').css('cursor','default');
};

var aSamSeqs = function ajaxGetSamSeqs(fDisplay, returned, options) {
    $("#bam"+options.bamId).html('');
	var samSeqs  = returned.response.sequences;
	
	var sequenceName = samSeqs[0].name.replace(/(\|\.)/g,'\\$1');
	
	var start = fDisplay.leftBase;
	var end = start + fDisplay.basesDisplayWidth;
	
	if(fDisplay.basesDisplayWidth > 4000) {
		var window = Math.round(fDisplay.basesDisplayWidth/100);
		var serviceName = '/sams/coverage.json?';
		handleAjaxCalling(serviceName, aSamCoverage,
			{ fileID:options.bamId, sequence:sequenceName, start:start, end:end, window:window }, fDisplay, { window:window, bamId:options.bamId });
	} else {
		serviceName = '/sams/query.json?';
		handleAjaxCalling(serviceName, aSamCall,
			{ fileID:options.bamId, sequence:sequenceName, start:start, end:end }, fDisplay, { bamId:options.bamId });
	}
};

function drawStack(fDisplay, samRecords, bamId) {
	baseInterval = (fDisplay.basesDisplayWidth/displayWidth)*screenInterval;
	var basePerPixel  = baseInterval/screenInterval;
	
	var alignmentEnd   = samRecords.alignmentEnd;
	var alignmentStart = samRecords.alignmentStart;
	var name  = samRecords.readName;
	var flags = samRecords.flags;
	var ypos  = maxBamHgt-1;

    var lastEndAtZero = -100;
    var lastStart = -1;
    var lastEnd   = -1; 
    var properPair = true;
    
    var colour = '#000000';
	for(var i=0; i<samRecords.alignmentStart.length; i++ ) {
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
			
		thisStart = margin+Math.round(thisStart/basePerPixel);
		thisEnd   = margin+Math.round(thisEnd/basePerPixel);	
		$("#bam"+bamId).drawLine(thisStart, ypos, thisEnd, ypos,
				{color:colour, stroke:'1'});
	}	
}


function drawStrandView(fDisplay, samRecords, bamId) {
	baseInterval = (fDisplay.basesDisplayWidth/displayWidth)*screenInterval;
	var basePerPixel  = baseInterval/screenInterval;
	
	//var bamTop = $("#bam"+fDisplay.index).css('margin-top').replace("px", "");
	var midPt = Math.round(maxBamHgt/2);
	
	drawStrand(fDisplay, samRecords, -step, true, basePerPixel, midPt, bamId); // fwd
	drawStrand(fDisplay, samRecords, step, false, basePerPixel, midPt, bamId); // rev
}

function drawStrand(fDisplay, samRecords, thisStep, isNegStrand, basePerPixel, midPt, bamId) {
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
		if( (!isNegStrand &&   samRecords.flags[i] & 0x0010) || //reverse strand
		    ( isNegStrand && !(samRecords.flags[i] & 0x0010)) ) 
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
			
		thisStart = margin+Math.round(thisStart/basePerPixel);
		thisEnd   = margin+Math.round(thisEnd/basePerPixel);	
		$("#bam"+bamId).drawLine(thisStart, ypos, thisEnd, ypos,
				{color:colour, stroke:'1'});
	}	
}

function drawBam(fDisplay) {
	var serviceName = '/sams/sequences.json?';
	
	for(i=0; i<fDisplay.bamIdArr.length; i++) {
		if(i ==  1) {
			$('body').css('cursor','wait');
		}
		handleAjaxCalling(serviceName, aSamSeqs,
			{ fileID:fDisplay.bamIdArr[i] }, fDisplay, { bamId : fDisplay.bamIdArr[i] });
	}
}

function addBamMenu(fDisplay, bamId) {
	$('#menuHeader').append('<ul id="bamMenus'+bamId+'" class="contextMenu" style="width:290px;">' +
    		'<li><a href="#stack">Stack View</a></li>'+
    		'<li><a href="#strand">Strand Stack View</a></li>'+
   		'</ul>');

    $('#bam'+bamId).contextMenu({menu: 'bamMenus'+bamId}, 
    		function(action, el, pos) { rightClickBamMenu(action, el, pos, fDisplay, bamId) });
}

var rightClickBamMenu = function(action, el, pos, self, bamId) {
	if(action.match(/stack/)) {
		isStrand = false;
		isStack = true;
		$("#bam"+bamId).html('');
		$("#bamscroll"+bamId).scrollTop(maxBamHgt);
		drawStack(self, samRecords, bamId);
	} else if(action.match(/strand/)) {
		isStrand = true;
		isStack = false;
		$("#bam"+bamId).html('');	
		$("#bamscroll"+bamId).scrollTop( (maxBamHgt-bamViewPortHgt)/2 );
		drawStrandView(self, samRecords, bamId);
	} 
};


