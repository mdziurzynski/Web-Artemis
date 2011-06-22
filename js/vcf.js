
var maxVcfHgt = 650;
var vcfViewPortHgt = 150;
var vcfObjs = new Array();

function vcfObj(vcfId) {
	this.vcfId = vcfId;
}

function getVcfObj(vcfId) {
	for(i=0; i<vcfObjs.length; i++) {
		if(vcfObjs[i].vcfId == vcfId)
			return vcfObjs[i];
	}
	return null;
}

function removeVcfObj(vcfId) {
	var tmp = new Array();
	for(i=0; i<vcfObjs.length; i++) {
		if(vcfObjs[i].vcfId != vcfId) {
			tmp.push(vcfObjs[i]);
		}
	}
	vcfObjs = tmp;
}

function addVcfDisplay(fDisplay, tgt) {
	var vcfId = $(tgt).attr('name');
	//addDragEdge(fDisplay);

	if( $('#vcfCanvas').length == 0 ) {
		$('#vcf').append('<div id="vcfscroll" class="vcfScroll"></div></div>');
		$('#vcf').append('<span id="vcfClose" class="ui-icon ui-icon-circle-close" title="close"></span>');
		$('#vcfscroll').append('<div id="vcfCanvas" class="canvas"></div>');
		
		var hgt = fDisplay.marginTop-5;
		$("#vcfCanvas").css( { 'height': maxVcfHgt+'px', 'width': displayWidth+margin+'px' });
		$('#vcfscroll').css({ 
			'margin-top': hgt+'px', 
			'height': vcfViewPortHgt+'px', 
			'width': displayWidth+margin+20+'px', 
			'border': '1px solid #666',
			'background-color': '#F0F0F0'});

		$('#vcfClose').css({
			'margin-left': '0px', 
			'position':'absolute', 
			'margin-top': hgt+'px', 
			'border': '1px solid #666'});

		fDisplay.marginTop = fDisplay.marginTop+vcfViewPortHgt;
		
		adjustFeatureDisplayPosition(false, fDisplay);
		drawFrameAndStrand(fDisplay);
	    adjustHeight(fDisplay, $('#vcfscroll').height());
	}
	
	$('#vcfClose').click(function() {
		var hgt = $('#vcfscroll').height();
		$("#vcf").empty();
		vcfObjs = new Array();
		
		fDisplay.marginTop = fDisplay.marginTop-hgt;
		adjustFeatureDisplayPosition(false, fDisplay);
		drawFrameAndStrand(fDisplay);
	    adjustHeight(fDisplay, -hgt);
	});
	
	drawVcf(fDisplay, vcfId); 
	$("#vcfscroll").scrollTop(maxVcfHgt);
}

function drawVcf(fDisplay, vcfId) {
	var serviceName = '/variants/sequences.json?';

	var thisVcf = getVcfObj(vcfId);
	if(thisVcf == null) {
		thisVcf = new vcfObj(vcfId);
		thisVcf.ypos = maxBamHgt-1-(vcfObjs.length*14);
		vcfObjs.push(thisVcf);
	}
	
	if(vcfId == undefined) {
		$("#vcfCanvas").html('');
		for(i=0; i<vcfObjs.length; i++) {
			if(vcfObjs[i].vcfId == undefined)
				continue;
			
			if(i ==  1) {
				$('body').css('cursor','wait');
			}
			handleAjaxCalling(serviceName, aVcfSeqs,
					{ fileID:vcfObjs[i].vcfId }, fDisplay, { vcfId : vcfObjs[i].vcfId });
		}
	} else {
		$('body').css('cursor','wait');
		handleAjaxCalling(serviceName, aVcfSeqs,
				{ fileID:vcfId }, fDisplay, { vcfId : vcfId });
	}
}


var aVcfSeqs = function ajaxGetVcfSeqs(fDisplay, vcfSeqs, options) {
	var sequenceName = fDisplay.srcFeature;
	var thisVcf = getVcfObj(options.vcfId);
	
	var start = fDisplay.leftBase;
	var end = parseInt(start) + parseInt(fDisplay.basesDisplayWidth);
	
	serviceName = '/variants/query.json?';
	
	handleAjaxCalling(serviceName, aVcfCall,
		{ fileID:options.vcfId, sequence:sequenceName, start:start, end:end }, fDisplay, { vcfId:options.vcfId });
};

var aVcfCall = function ajaxGetVcfRecords(fDisplay, records, options) {
	var thisVcf = getVcfObj(options.vcfId);
	baseInterval = (fDisplay.basesDisplayWidth/displayWidth)*screenInterval;
	var basePerPixel  = baseInterval/screenInterval;
	var ypos  = thisVcf.ypos;
    var i;
    for(i=0; i<records.length; i++) {
    	debugLog(records[i]);
		var thisPos = margin+Math.round((records[i].pos - fDisplay.leftBase)/basePerPixel);	
		var col = '#707070';
		
		if(records[i].alt.isInsertion) {
			col = '#CD00CD';  // magenta
		} else if(records[i].alt.isDeletion) {
			col = '#6C7B8B';  // slate grey
		} else if(records[i].alt.alternateBase.toUpperCase() == 'C') {
			col = '#FF0000';
		} else if(records[i].alt.alternateBase.toUpperCase() == 'A') {
			col = '#00FF00';
		} else if(records[i].alt.alternateBase.toUpperCase() == 'G') {
			col = '#0000FF';
		} else if(records[i].alt.alternateBase.toUpperCase() == 'T') {
			col = '#000000';
		}
		
		$("#vcfCanvas").drawLine(thisPos, ypos, thisPos, ypos-11, {color:col, stroke:'1'});
    }
    $('body').css('cursor','default');
}

