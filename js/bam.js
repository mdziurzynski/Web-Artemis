
var maxBamHgt = 150;

var aSamCoverage = function ajaxGetSamCoverage(fDisplay, returned, options) {
	var coverage = returned.response.coverage;
	var max = returned.response.max;
	var window = options.window;
	baseInterval = (fDisplay.basesDisplayWidth/displayWidth)*screenInterval;
	var basePerPixel  = baseInterval/screenInterval;
	
	for(i=0; i<coverage.length-1; i++ ) {
		var xpos1 = margin+Math.round( ((i*window)+(window/2)) /basePerPixel);
		var ypos1 = fDisplay.marginTop-((coverage[i]/max)*maxBamHgt);
		var xpos2 = margin+Math.round( (((i+1)*window)+(window/2)) /basePerPixel);
		var ypos2 = fDisplay.marginTop-((coverage[i+1]/max)*maxBamHgt);

		$("#bam"+fDisplay.index).drawLine(xpos1, ypos1, xpos2, ypos2,
				{color:colour, stroke:'1'});
	}
};

var aSamCall = function ajaxGetSamRecords(fDisplay, returned, options) {
	var samRecords  = returned.response.records;
	baseInterval = (fDisplay.basesDisplayWidth/displayWidth)*screenInterval;
	var basePerPixel  = baseInterval/screenInterval;
	
	var alignmentEnd   = samRecords.alignmentEnd;
	var alignmentStart = samRecords.alignmentStart;
	var name  = samRecords.readName;
	var flags = samRecords.flags;
	var ypos  = fDisplay.marginTop-10;
	
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
				ypos=fDisplay.marginTop-10;
				lastEndAtZero = thisEnd;
			} else {
				ypos=ypos-1.5;
			}
		}
			
		thisStart = margin+Math.round(thisStart/basePerPixel);
		thisEnd   = margin+Math.round(thisEnd/basePerPixel);	
		$("#bam"+fDisplay.index).drawLine(thisStart, ypos, thisEnd, ypos,
				{color:colour, stroke:'1'});
	}
};

var aSamSeqs = function ajaxGetSamSeqs(fDisplay, returned, options) {
    $("#bam"+fDisplay.index).html('');
	var samSeqs  = returned.response.sequences;
	
	var sequenceName = samSeqs[0].name.replace(/(\|\.)/g,'\\$1');
	debugLog(sequenceName);
	
	var start = fDisplay.leftBase;
	var end = start + fDisplay.basesDisplayWidth;
	
	if(fDisplay.basesDisplayWidth > 4000) {
		var window = Math.round(fDisplay.basesDisplayWidth/100);
		var serviceName = '/sams/coverage.json?';
		handleAjaxCalling(serviceName, aSamCoverage,
			{ fileID:fDisplay.bamId, sequence:sequenceName, start:start, end:end, window:window }, fDisplay, { window:window });
	} else {
		serviceName = '/sams/query.json?';
		handleAjaxCalling(serviceName, aSamCall,
			{ fileID:fDisplay.bamId, sequence:sequenceName, start:start, end:end }, fDisplay, { });
	}
};

function drawBam(fDisplay) {
	var serviceName = '/sams/sequences.json?';
	
	handleAjaxCalling(serviceName, aSamSeqs,
			{ fileID:fDisplay.bamId }, fDisplay, { });
}