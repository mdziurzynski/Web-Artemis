
var maxBamHgt = 220;

function bamObj(fDisplay) {
	drawBam(fDisplay);
}

function drawBam(fDisplay) {
	var serviceName = '/sams/sequences.json?';
	handleAjaxCalling(serviceName, aSamSeqs,
			{ fileID:1 }, fDisplay, { });
}

var aSamSeqs = function ajaxGetSamSeqs(fDisplay, returned, options) {
    $("#bam"+fDisplay.index).html('');
	var samSeqs  = returned.response.sequences;
	
	var sequenceName = samSeqs[0].name.replace(/(\|\.)/g,'\\$1');
	debugLog(sequenceName);
	
	var start = fDisplay.leftBase;
	var end = start + fDisplay.basesDisplayWidth;
	
	var serviceName = '/sams/query.json?';
	handleAjaxCalling(serviceName, aSamCall,
			{ fileID:1, sequence:sequenceName, start:start, end:end }, fDisplay, { });
};

var aSamCall = function ajaxGetSamRecords(fDisplay, returned, options) {
	var samRecords  = returned.response.records;
	baseInterval = (fDisplay.basesDisplayWidth/displayWidth)*screenInterval;
	var basePerPixel  = baseInterval/screenInterval;
	
	var alignmentEnd   = samRecords.alignmentEnd;
	var alignmentStart = samRecords.alignmentStart;
	var name  = samRecords.readNames;
	var flags = samRecords.flags;
	var ypos  = fDisplay.marginTop-10;
	
    var lastEndAtZero = -100;
    var properPair = true;
    
	for(var i=0; i<samRecords.alignmentStart.length; i++ ) {

		var thisStart = alignmentStart[i]-fDisplay.leftBase;
		var thisEnd   = alignmentEnd[i]-fDisplay.leftBase;
		var thisName  = name[i];
		var thisFlags = flags[i];
		
		var colour = '#000000';
		// proper pair
		if(thisFlags & 0x0002) {
			colour = '#0000FF';
		} else if(properPair && !(thisFlags & 0x0002)) {
			continue;
		}
		
		thisStart = margin+Math.round(thisStart/basePerPixel);
		thisEnd   = margin+Math.round(thisEnd/basePerPixel);
		
		if(thisStart > lastEndAtZero+1 || (fDisplay.marginTop-ypos) > maxBamHgt) {
			ypos=fDisplay.marginTop-10;
			lastEndAtZero = thisEnd;
		} else {
			ypos=ypos-1;
		}
		
		$("#bam"+fDisplay.index).drawLine(thisStart, ypos, thisEnd, ypos,
				{color:colour, stroke:'1'});
	}
};
