// set serviceType to:
// 0 - javascript on same server as webservices 
// 1 - javascript served from a seperate server accessed internally
// 2 - javascript served from a seperate server accessed anywhere
// 
var serviceType = 3;

var webService = [ "http://127.0.0.1/testservice/",
                   "http://t81-omixed.internal.sanger.ac.uk:6666",
                   "http://www.genedb.org/testservice",
                   "http://127.0.0.1:6666"]; 
var dataType = [ "json", "jsonp", "jsonp", "jsonp" ];

//
//

var marginTop = 40;
var margin = 5;

var basesDisplayWidth = 10000;
var displayWidth = 1000;
var sequenceLength = 16000;
var sequence;
var screenInterval = 100;
var baseInterval;
var basePerPixel;
var frameLineHeight = 12;
var featureSelected = -1;
var showStopCodons = true;
var showGC = false;
var showAG = false;

var srcFeature = 'Pf3D7_01';

var colour = [ 
    '255,255,255',
    '100,100,100',
    '255,0,0',
    '0,255,0',
    '0,0,255',
    '0,255,255',
    '255,0,255',
    '245,245,0',
    '152,251,152',
    '135,206,250',
    '255,165,0',
    '200,150,100',
    '255,200,200',
    '170,170,170',
    '0,0,0',
    '255,63,63',
    '255,127,127',
    '255,191,191'
];

$(document).ready(function() {
	
	adjustFeatureDisplayPosition(false);
	
	$("#slider_vertical_container").slider({
		orientation: "vertical",
		min: 140,
		max: sequenceLength,
		value: basesDisplayWidth,
		step: 10000,
		change: function(event, ui) {
		  var basesInView = $('#slider_vertical_container').slider('option', 'value');
		
		  if(basesInView > 50000) {
			  showStopCodons = false;
		  } else if(basesInView < 1000) {
			  showStopCodons = true;
		  }
		  
		  basesDisplayWidth = ui.value;
		  drawAll($(".slider").slider("value"), 0);
		  $(".slider").slider('option', 'step', basesDisplayWidth/2);
		}
	});

	$(".slider").slider( {
		animate: true,
		min : 1,
		max : sequenceLength,
		step : basesDisplayWidth/2,
		change : function(ev, ui) {
			drawAll(ui.value, 0);
		}
	});
	
	$('ul.sf-menu').superfish();
	
	$('#rightDraggableEdge').draggable({
		stop: function(event, ui) {
			var xpos = parseInt(
					$('#rightDraggableEdge').css('margin-left').replace("px", ""));
			//var ypos = parseInt(
			//		$('#rightDraggableEdge').css('top').replace("px", ""));
			
			frameLineHeight = (ui.offset.top-marginTop+8)/17;
			displayWidth = (xpos-margin)+ui.offset.left;
			drawAll($(".slider").slider("value"), 0);
			adjustFeatureDisplayPosition(true);
			drawFrameAndStrand();
		}
	});

    drawFrameAndStrand();
	drawAll(1, 1);
	getOrganismList();
	addEventHandlers();
});

//
function adjustFeatureDisplayPosition(drag) {
	
	var cssObj = {
			 'margin-left': margin+'px',
			 'position':'absolute',
			 'top': marginTop+(frameLineHeight*17.5)+'px'
	};
	$('#left').css(cssObj);
		
	cssObj = {
			'margin-left': margin+displayWidth+'px',
			'position':'absolute',
			'top': marginTop+(frameLineHeight*17.5)+'px'
	};
	$('#right').css(cssObj);
	
	var buttonWidth = $('#left').width()+5;
	cssObj = {
        'margin-left': margin+buttonWidth+'px',
        'width': displayWidth-buttonWidth+'px',
        'position':'absolute',
        'top':marginTop+(frameLineHeight*16.5)+'px'
	};
	$('#slider_container').css(cssObj);
	
	cssObj = {
	     'margin-left': margin+margin+displayWidth+'px',
	     'height': (frameLineHeight*16)+'px',
	     'position':'absolute',
	     'top': marginTop+7+'px'
	};
	$('#slider_vertical_container').css(cssObj);
	$('#featureDisplay').css('margin-top', marginTop-5+'px');
	
	if(!drag) {
		cssObj = {
		     'margin-left': margin+displayWidth-7+'px',
		     'height': 8+'px',
		     'position':'absolute',
		     'top': marginTop+(frameLineHeight*16)+'px',
		     'opacity':0.4
		};
		$('#rightDraggableEdge').css(cssObj);
	} else {
		$('#rightDraggableEdge').css('top',marginTop+(frameLineHeight*16)+'px');
	}
}

//
function addEventHandlers() {
	// show/hide stop codons
	$('#stopCodonToggle').click(function(event){
		showStopCodons = !showStopCodons;
		drawAll($(".slider").slider("value"), 0);
	});
	
	// graphs
	$('#gcGraphToggle').click(function(event){
		if(showGC) {
			if(!showAG) {
				$("#graph").css('height', 0+'px');
				$("#graph").html('');
			}
			showGC = false;
		} else {
			setGraphCss(displayWidth, marginTop, margin, frameLineHeight);
			showGC = true;	
		}
		
		drawAll($(".slider").slider("value"), 0);
	});
	
	$('#agGraphToggle').click(function(event){
		if(showAG) {
			if(!showGC) {
				$("#graph").css('height', 0+'px');
				$("#graph").html('');
			}
			showAG = false;
		} else {
			setGraphCss(displayWidth, marginTop, margin, frameLineHeight);
			showAG = true;	
		}
		
		drawAll($(".slider").slider("value"), 0);
	});
	
	// popup
	$('#features').mouseenter(function(event){
		var tgt = $(event.target);
	    var x = event.pageX+10;
		var y = event.pageY+10;

	    if( $(tgt).is(".featCDS") ) {
	    	var currentId = $(tgt).attr('id');  
	    	loadPopup("CDS<br />"+currentId,x,y);  
	    } else if( $(tgt).is(".featGene") ) {
	    	var currentId = $(tgt).attr('id');  
	    	loadPopup("Gene<br />"+currentId,x,y);  
	    } else if( $(event.target).is(".feat") ) {
	    	var currentId = $(tgt).attr('id'); 
	    	loadPopup(currentId,x,y);
	    }
	 });
	
	$('#features').click(function(event){
		handleFeatureClick($(event.target));
	 });
	
	$('#features').mouseout(function(event){
		disablePopup();
	 });
	
	$('#translation').click(function(event){
		var aminoacid = $(event.target).attr('id');
		var bgColour = $(event.target).css('background-color');
		$(event.target).css('background-color', '#FFFF00');
	 });
	
	//scrolling
	addScrollEventHandlers();
}

//
//

function drawFrameAndStrand(){
	var ypos = marginTop;
	for(var i=0;i<3; i++)
	{
	  $('.fwdFrame'+i).html('');
	  addFrameLine('.fwdFrames',ypos,'fwdFrame'+i);
	  ypos+=frameLineHeight*2;
	}
	
	addStrandLine('.strands', ypos, 'fwdStrand');
	ypos+=frameLineHeight*3;
	addStrandLine('.strands', ypos, 'bwdStrand');
	
	ypos+=frameLineHeight*2;
	for(var i=0;i<3; i++)
	{
	  $('.bwdFrame'+i).html('');
	  addFrameLine('.bwdFrames',ypos,'bwdFrame'+i);
	  ypos+=frameLineHeight*2;
	}
}

function addStrandLine(selector, ypos, strand) {
	var cssObj = {
		'height':frameLineHeight+'px',
		'width':displayWidth+'px',
		'margin-left': margin+'px',
		'margin-top': ypos+'px',
		'background':  'rgb(200, 200, 200)',
		'position':'absolute'
	};

	$(selector).append('<div class='+strand+'>&nbsp;</div>');
	$('.'+strand).css(cssObj);
}

function addFrameLine(selector, ypos, frame) {
	var cssObj = {
		'height':frameLineHeight+'px',
		'width':displayWidth+'px',
		'margin-left': margin+'px',
		'margin-top': ypos+'px',
		'background':  'rgb(240, 240, 240)',
		'position':'absolute'
	};

	$(selector).append('<div class='+frame+'>&nbsp;</div>');
	$('.'+frame).css(cssObj);
}

function drawAll(leftBase, firstTime) {
	  baseInterval = (basesDisplayWidth/displayWidth)*screenInterval;
	  basePerPixel  = baseInterval/screenInterval;

      $('#featureDisplay').html('');

      if(firstTime == 1 || showStopCodons || showGC || showAG) {
        getSequence(leftBase, firstTime);
      } else {
    	$('#stop_codons').html('');
        $('#sequence').html('');
        $('#translation').html('');
      }

	  drawFeatures(leftBase, firstTime);
	  drawTicks(leftBase, firstTime);
}

function getSequence(leftBase, firstTime) {
	var end = leftBase+basesDisplayWidth;
/*	if(end > sequenceLength) {
		end = sequenceLength;
	}*/
	
	if($('#slider_vertical_container').slider('option', 'value') < 5000) {
	  end+=2;
	}

	var serviceName = '/sourcefeatures/sequence.json?';
	handleAjaxCalling(serviceName, aSequence,
			{ uniqueName:srcFeature, start:leftBase, end:end }, 
			leftBase, 1,firstTime);
}

function drawStopCodons(leftBase) {
    var fwdStops1 = new Array();
    var fwdStops2 = new Array();
    var fwdStops3 = new Array();
    
    var bwdStops1 = new Array();
    var bwdStops2 = new Array();
    var bwdStops3 = new Array();

    //console.time('calculate stop codons');  
    calculateStopCodons(leftBase, fwdStops1, fwdStops2, fwdStops3, 'TAG', 'TAA', 'TGA', 1);
    calculateStopCodons(leftBase, bwdStops1, bwdStops2, bwdStops3, 'CTA', 'TTA', 'TCA', -1);
    //console.timeEnd('calculate stop codons');
	
	var nstops = fwdStops1.length + fwdStops2.length + fwdStops3.length +
				 bwdStops1.length + bwdStops2.length + bwdStops3.length; 
	if(nstops > 3000) {
		var canvasTop = $('#featureDisplay').css('margin-top').replace("px", "");
		drawStopOnCanvas(fwdStops1, marginTop+((frameLineHeight*2)*0+1)-canvasTop);
		drawStopOnCanvas(fwdStops2, marginTop+((frameLineHeight*2)*1+1)-canvasTop);
		drawStopOnCanvas(fwdStops3, marginTop+((frameLineHeight*2)*2+1)-canvasTop);
	
		drawStopOnCanvas(bwdStops1, marginTop+(frameLineHeight*10)+frameLineHeight+((frameLineHeight*2)*0+1)-canvasTop);
		drawStopOnCanvas(bwdStops2, marginTop+(frameLineHeight*10)+frameLineHeight+((frameLineHeight*2)*1+1)-canvasTop);
		drawStopOnCanvas(bwdStops3, marginTop+(frameLineHeight*10)+frameLineHeight+((frameLineHeight*2)*2+1)-canvasTop);
	} else {
		//console.time('draw fwd stop codons');
		drawFwdStop(fwdStops1, 0);
		drawFwdStop(fwdStops2, 1);
		drawFwdStop(fwdStops3, 2);
		//console.timeEnd('draw fwd stop codons');
	
		//console.time('draw bwd stop codons');  
		drawBwdStop(bwdStops1, 0);
		drawBwdStop(bwdStops2, 1);
		drawBwdStop(bwdStops3, 2);
		//console.timeEnd('draw bwd stop codons');
		
		if($('.bases').height() != frameLineHeight) {
		  $('.bases').css({'height' : frameLineHeight+'px'});
		}
	}
};


function drawStopOnCanvas(stop, ypos) {
	var len=stop.length;
	var colour = '#000000';
	for(var i=0; i<len; i++ ) {
		var position1 = stop[i];
		var stopPosition1 = margin+Math.round(stop[i]/basePerPixel);
		$("#featureDisplay").drawLine(stopPosition1, ypos, stopPosition1, ypos+frameLineHeight,
				{color: colour, stroke:'1'});
	}
}


function drawFwdStop(stop, frame) {
	
  var len=stop.length;
  var ypos = marginTop+((frameLineHeight*2)*frame);

  var fwdStopsStr = '';
  for(var i=0; i<len; i+=2 )
  {
	var position1 = stop[i];
	var stopPosition1 = margin+((position1 )/basePerPixel);
	var stopPosition2;
	if(i < len-2)
	  stopPosition2 = margin+((stop[i+1] )/basePerPixel);
	else
	  stopPosition2 = stopPosition1+1;

	var pos = ypos+"px "+stopPosition1+"px";
	var width = (stopPosition2-stopPosition1)+"px";

	fwdStopsStr = fwdStopsStr + '<div id=fs'+position1+' class="bases" style="width:'+width+'; margin:'+pos+'"></div>';
  }
  
  $('#stop_codons').append(fwdStopsStr);
}

function drawBwdStop(stop, frame) {
  var len=stop.length;
  var ypos = marginTop+(frameLineHeight*10)+frameLineHeight+((frameLineHeight*2)*frame);

  var bwdStopsStr = '';
  for(var i=0; i<len; i+=2 )
  {
	var position1 = stop[i];
	var stopPosition1 = margin+((position1 )/basePerPixel);
	var stopPosition2;
	if(i < len-2)
	  stopPosition2 = margin+((stop[i+1] )/basePerPixel);
	else
	  stopPosition2 = stopPosition1+1;

	var pos = ypos+"px "+stopPosition1+"px";
	var width = (stopPosition2-stopPosition1)+"px";
	
	bwdStopsStr = bwdStopsStr + '<div id=bs'+position1+' class="bases" style="width:'+width+'; margin:'+pos+'"></div>';
  }
  //return bwdStopsStr;
  $('#stop_codons').append(bwdStopsStr);
}

function drawCodons(leftBasePosition) {
  var yposFwd = marginTop+(6*frameLineHeight);
  var yposBwd = yposFwd+(frameLineHeight*3);
  var xpos = margin;
  for(var i=0;i<basesDisplayWidth; i++) {
	  
	  if(i+leftBasePosition > sequenceLength)
		  break;
	  
	  var fwdid = 'fwdbase'+i;
	  var bwdid = 'bwdbase'+i;
	  $('#sequence').append('<div class="base" id="'+fwdid+'" >'+sequence[i]+'</div>');
	  $('#sequence').append('<div class="base" id="'+bwdid+'" >'+complement(sequence[i])+'</div>');

	  var cssObj = {
			  'margin-top': yposFwd+'px',
			  'margin-left': xpos+'px'
	  };		  
	  $('#'+fwdid).css(cssObj);
	  
	  cssObj = {
			  'margin-top': yposBwd+'px',
			  'margin-left': xpos+'px'
	  };
	  $('#'+bwdid).css(cssObj); 
	  xpos += (1/basePerPixel);
  }
}

function drawAminoAcids(leftBasePosition) {
  var xpos = margin;
  for(var i=0;i<basesDisplayWidth; i++) {
	  
	  if(i+leftBasePosition > sequenceLength)
		  break;
	  
	  var frame = (leftBasePosition-1+i) % 3;
	  
	  var yposFwd = marginTop+(frame*(frameLineHeight*2));
	  var fwdid = 'fwdAA1'+i;
	  $('#translation').append('<div class="aminoacid" id="'+fwdid+'" >'+
			  getCodonTranslation(sequence[i], sequence[i+1], sequence[i+2])+'</div>');
	  
	  var cssObj = {
			  'width': 3/basePerPixel+'px',
			  'margin-top': yposFwd+'px',
			  'margin-left': xpos+'px'
	  };		  
	  $('#'+fwdid).css(cssObj);	   

	  
  	  var reversePos = sequenceLength-(i+leftBasePosition+1);
  	  frame = 3 - ((reversePos+3)-1) % 3 -1;

	  var yposBwd = marginTop+(frameLineHeight*11)+((frameLineHeight*2)*frame);
	  var bwdid = 'bwdAA1'+i;
	  $('#translation').append('<div class="aminoacid" id="'+bwdid+'" >'+
			  getCodonTranslation(complement(sequence[i+2]), 
					              complement(sequence[i+1]), 
					              complement(sequence[i]))+'</div>');

	  var cssObj = {
			  'width': 3/basePerPixel+'px',
			  'margin-top': yposBwd+'px',
			  'margin-left': xpos+'px'
	  };		  
	  $('#'+bwdid).css(cssObj);	 
	  
	  xpos += (1/basePerPixel);
  }
}


function complement(base) {
    switch (base) {
    case 'a': case 'A': return 'T';
    case 't': case 'T': case 'u': case 'U': return 'A';
    case 'g': case 'G': return 'C';
    case 'c': case 'C': return 'G';
    case 'r': case 'R': return 'Y';
    case 'y': case 'Y': return 'R';
    case 'k': case 'K': return 'M';
    case 'm': case 'M': return 'K';
    case 's': case 'S': return 'S';
    case 'w': case 'W': return 'W';
    case 'b': case 'B': return 'V';
    case 'd': case 'D': return 'H';
    case 'h': case 'H': return 'D';
    case 'v': case 'V': return 'B';
    case 'n': case 'N': return 'N';
    case 'x': case 'X': return 'X';
    default:
      return '@';
    }
}

function calculateStopCodons(leftBase, stops1, stops2, stops3, codon1, codon2, codon3, strand) {
    var index = sequence.indexOf(codon1, 0);
    var firstInd = index;
    
    while(index >= 0 && index < basesDisplayWidth)
    {
    	var frame;
    	if(strand == -1) {
    		var reversePos = sequenceLength-(index+leftBase+1);
    		frame = 3 - ((reversePos+3)-1) % 3 -1;
    	}	
    	else {
    		frame = (index + leftBase -1 ) % 3;
    	}
    		
    	index++;
    	if(frame == 0)	
    	  stops1.push(index);
    	else if(frame == 1)
    	  stops2.push(index);
    	else
    	  stops3.push(index);
    	index = sequence.indexOf(codon1, index+1);
    }
    
    index = sequence.indexOf(codon2, 0);
    while(index >= 0 && index < basesDisplayWidth)
    {
    	var frame;
    	if(strand == -1) {
    		var reversePos = sequenceLength-(index+leftBase+1);
    		frame = 3 - ((reversePos+3)-1) % 3 -1;
    	}	
    	else {
    		frame = (index + leftBase -1 ) % 3;
    	}
    	
    	index++;
    	if(frame == 0)	
      	  stops1.push(index);
      	else if(frame == 1)
      	  stops2.push(index);
      	else
      	  stops3.push(index);
    	index = sequence.indexOf(codon2, index+1);
    }

    index = sequence.indexOf(codon3, 0);
    while(index >= 0 && index < basesDisplayWidth)
    {
    	var frame;
    	if(strand == -1) {
    		var reversePos = sequenceLength-(index+leftBase+1);
    		frame = 3 - ((reversePos+3)-1) % 3 -1;
    	}	
    	else {
    		frame = (index + leftBase -1 ) % 3;
    	}
    	
    	index++;
    	if(frame == 0)	
      	  stops1.push(index);
      	else if(frame == 1)
      	  stops2.push(index);
      	else
      	  stops3.push(index);
    	index = sequence.indexOf(codon3, index+1);
    }
}


function drawFeatures(leftBase, firstTime) {
	var end = leftBase+basesDisplayWidth;
	if(end > sequenceLength) {
		end = sequenceLength;
	}
	
	var serviceName = '/sourcefeatures/featureloc.json?';

	var relationshipsList = new Array();
	relationshipsList.push('part_of');
	relationshipsList.push('derives_from');
	
	handleAjaxCalling(serviceName, aFeature,
			{ uniqueName:srcFeature, start:leftBase, end:end, relationships:['part_of','derives_from'] }, 
			leftBase, end, 11);
}



function getFeatureExons(transcript) {
	var nkids = transcript.features.length;
	var exons = [];
	if(nkids > 0)
	{
	  for(var i=0; i<nkids; i++)
	  {
		var kid = transcript.features[i];
			
		if(kid.type == "exon") {
	       exons.push(kid);
		}
      }	
	}
	
	if(exons.length > 0) {
	  exons.sort(sortFeatures);
	}
	return exons;
}

function sortFeatures(a, b){
	//Compare "a" and "b" in some fashion, and return -1, 0, or 1
	if( (a.start - b.start) > 0) {
	  if(a.strand == 1) {
		return 1;
	  } else {
		return -1;
	  }
	}
	else if( (b.start - a.start) > 0) {
	  if(a.strand == 1) {
		return -1;
	  } else {
		return 1;
	  }
	}
	return 0;
}

function getSegmentFrameShift(exons, index, phase) {
  // find the number of bases in the segments before this one
  var base_count = 0;

  for(var i = 0; i < index; ++i) 
  {
    var exon = exons[i];
    base_count += exon.end-exon.start;
  }

  var mod_value = (base_count + 3 - phase) % 3;
  if (mod_value == 1) {
    return 2;
  } else if (mod_value == 2) {
    return 1;
  } 
  return 0;
}

function drawFeature(leftBase, feature, featureStr, ypos, className) {

  var startFeature = margin+((feature.start - leftBase + 1)/basePerPixel);
  var endFeature   = margin+((feature.end - leftBase + 1)/basePerPixel);
  var extra = '';
  
  if(startFeature < margin) {
    startFeature = margin;
    extra = 'border-left: none;';
  }
  
  if(endFeature > margin+displayWidth) {
	if(startFeature > margin+displayWidth)   
		return featureStr;
    endFeature = margin+displayWidth;
    extra += 'border-right: none';
  }

  var pos = 'margin-top:'+ypos+"px; margin-left:"+startFeature+"px";
  var width = (endFeature-startFeature)+"px";

  featureStr = featureStr + 
	'<div id='+feature.uniquename+' class="'+className+'" style="width:'+width+'; '+pos+';'+extra+'"></div>';
  return featureStr;
}

function drawFeatureConnections(leftBase, lastExon, exon, lastYpos, ypos, colour) {
	var exonL;
	var exonR;
	
	if(exon.strand == 1) {
	 exonL = lastExon;
	 exonR = exon;
	} else {
	 exonL = exon;
	 exonR = lastExon;
	 var tmpPos = ypos;
	 ypos = lastYpos;
	 lastYpos = tmpPos;
	}
	
	var lpos = margin+((exonL.end   - leftBase )/basePerPixel) + 1;
	var rpos = margin+((exonR.start - leftBase +1 )/basePerPixel) - 1;
	var mid  = lpos+(rpos-lpos)/2;
	
	var ymid = ypos-4;
	if(ypos > lastYpos) {
	  ymid = lastYpos-4;
	}
	var Xpoints = new Array(lpos, mid, rpos) ;
	var Ypoints = new Array(lastYpos+4, ymid, ypos+4);
	
	$("#featureDisplay").drawPolyline(Xpoints,Ypoints, {color: colour, stroke:'1'});
}

function drawArrow(leftBase, exon, ypos) {
	var Xpoints;
	var Ypoints;
	ypos++;
	
	var frameLineHeight2 = frameLineHeight/2;
	if(exon.strand == 1) {
	  var end = margin+((exon.end - leftBase )/basePerPixel) + 1;
	  Xpoints = new Array(end, end+frameLineHeight2, end) ;
	  Ypoints = new Array(ypos, ypos+frameLineHeight2, ypos+frameLineHeight);
	} else {
	  var start = margin+((exon.start - leftBase )/basePerPixel) - 1;
	  Xpoints = new Array(start, start-frameLineHeight2, start) ;
	  Ypoints = new Array(ypos, ypos+frameLineHeight2, ypos+frameLineHeight);
	}

	$("#featureDisplay").drawPolyline(Xpoints,Ypoints, {color:'#020202', stroke:'1'});
}


function drawTicks(leftBasePosition, firstTime) {
	var nticks = basesDisplayWidth/baseInterval;

	var baseRemainder = (leftBasePosition-1) % baseInterval;
	var start = Math.round(Math.floor((leftBasePosition-1)/baseInterval)*baseInterval);
	
	var xScreen = margin-(1/basePerPixel);
	if(baseRemainder > 0) {
	  xScreen -= ((leftBasePosition-start-1)/basePerPixel);
	}
 
	$('#ticks').html('');
	/*console.log('nticks='+nticks+' '+basePerPixel+
			" basesDisplayWidth="+basesDisplayWidth+" displayWidth="+displayWidth+ 
			" leftBasePosition="+leftBasePosition+
			" baseRemainder="+baseRemainder+" xScreen="+xScreen+
			" baseInterval="+baseInterval+"  1200%500="+1200%500+" start"+start);*/

	for(var i=1; i< nticks+1; i++) {
		xScreen+=screenInterval;
		
		if(xScreen >= displayWidth) {
			break;
		}
		else if(xScreen < margin) {
			continue;
		}
		var pos = marginTop+(frameLineHeight*9)-14+"px "+xScreen+"px";
		var thisTick = 'tick'+i;
		
		$('#ticks').append('<div class="tickClass" id='+thisTick+'></div>');
		setTickCSS(pos, Math.round(i*baseInterval)+(start), '#'+thisTick);
	}
}

function setTickCSS(offset, number, selector) {
	$(selector).css('margin', offset);
	$(selector).html(number);
}


function getOrganismList() {
	var serviceName = '/organisms/list.json';
	handleAjaxCalling(serviceName, aOrganism,
			{ }, 1, 1, 1);
}

function getSrcFeatureList(taxonomyid)
{
	$('#srcFeatureSelector').html('');
	var jsonUrl = webService[serviceType]+'/genes/top.json?taxonID='+taxonomyid;

	debugLog(jsonUrl);
	
	var serviceName = '/genes/top.json';
	handleAjaxCalling(serviceName, aSrcFeature,
			{ taxonID:taxonomyid }, 1, 1, 1);
}

function handleFeatureClick(tgt) {
	featureSelected = $(tgt).attr('id');
	
	var width = $(tgt).css('borderLeftWidth');
    if(width == '1px') {
	  $(tgt).css('border-width', '2px');
    } else {
      $(tgt).css('border-width', '1px');
    }
}

function positionFeatureList() {
	var ghgt = $('#graph').height();
	var top = marginTop+(frameLineHeight*19.5)+ghgt; 
	
    var cssObj = {
			 'margin-left': margin+'px',
			 'margin-right': margin+'px',
			 'position':'absolute',
			 'width': displayWidth+'px',
			 'top': top+'px'
	};
	
	$('#featureList').css(cssObj);
}

function setupFeatureList(features) {
	positionFeatureList();
	$('#featureList').html('<table id="featureListTable" class="tablesorter" cellspacing="1"></table>');
	$('#featureListTable').append('<thead><tr><th>Name</th><th>Type</th><th>Feature Start</th><th>Feature End</th><th>Properties</th></tr></thead>');
	$('#featureListTable').append('<tbody>');
	
	for(var i=0; i<features.length; i++) {
		var feature = features[i];
		
		appendFeatureToList(feature);
		
		for(var j=0; j<feature.features.length; j++) {
			var kid = feature.features[j];
			appendFeatureToList(kid);

			for(var k=0; k<kid.features.length; k++) {
				var kid2 = kid.features[k];
				appendFeatureToList(kid2);
			}
		}
	}
	
	$('#featureListTable').append('</tbody>');
	$('#featureListTable').tablesorter(); 
}

function appendFeatureToList(feature) {
	$('#featureListTable').append('<tr>'+
			'<td>'+feature.uniquename+'</td>'+
			'<td>'+feature.type+'</td>'+
			'<td>'+feature.start+'</td>'+
			'<td>'+feature.end+'</td>'+
			'<td id="'+feature.uniquename+':PROPS"></td>'+
			'</tr>');
}

//
// AJAX functions
//
var aSrcFeature = function ajaxGetSrcFeatures(leftBase, end, firstTime, returned) {
	$('#srcFeatureSelector').html('<select id="srcFeatureList"></select>');
	$('#srcFeatureList').append('<option value="Sequence:">Sequence:</option>');
	
	var srcFeatures  = returned.response.features;
	for(var j=0; j<srcFeatures.length; j++) {
		var feat = srcFeatures[j];
		if(feat)
		  $('#srcFeatureList').append(
				  '<option value="'+feat+'">'+feat+'</option>');
	}
	
	positionLists();
	
	$('#srcFeatureSelector').change(function(event){
		srcFeature = $('#srcFeatureList option:selected')[0].value;
		drawAll($(".slider").slider("value"), 0);
	});
};

var aOrganism = function ajaxGetOrganisms(leftBase, end, firstTime, returned) {
	var organisms  = returned.response.organisms;
	$('#organismSelector').html('<select id="organismList"></select>');
	$('#organismList').append('<option value="Organism:">Organism:</option>');
	for(var i=0; i<organisms.length; i++) {
		var organism = organisms[i];
		if(organism)
		  $('#organismList').append(
				  '<option value="'+organism.taxonomyid+'">'+organism.name+'</option>');
	}
	
	positionLists();
	
	$('#organismSelector').change(function(event){
		var taxonomyid = $('#organismList option:selected')[0].value;
		getSrcFeatureList(taxonomyid);
	});
};

function positionLists() {
	// top position
    //var organismWidth = $('#organismSelector').css('width').replace("px", "");
    //var srcFeatureWidth = $('#srcFeatureSelector').css('width').replace("px", "");
    var organismWidth = $('#organismSelector').width();
    var srcFeatureWidth = $('#srcFeatureSelector').width();

	$('#organismSelector').css('margin-left', 
			margin+margin+displayWidth-organismWidth-srcFeatureWidth-10+'px');
	$('#srcFeatureSelector').css('margin-left', 
			margin+margin+displayWidth-srcFeatureWidth+'px');
}

var aFeatureProps = function ajaxGetFeatureProp(leftBase, end, firstTime, returned) {
	var features  = returned.response.features;
	for(var i=0; i<features.length; i++) {	
		var featureprops = features[i].props;
		for(var j=0; j<featureprops.length; j++) {

			$('#'+escapeId(features[i].uniquename+":PROPS")).append(featureprops[j].name+"="+featureprops[j].value+";");
			
			if(featureprops[j].name == 'colour') {
				var featureId = escapeId(features[i].uniquename);
				$('#'+featureId).css('background-color', 'rgb('+colour[featureprops[j].value]+')' );
			}
		}
	}
};

var aFeature = function ajaxGetFeatures(leftBase, end, firstTime, returned) {
	
	var features  = returned.response.features;
	var nfeatures = features.length;

	debugLog("No. of features "+ nfeatures+"  "+leftBase+".."+end);

	var ypos;
	var featureStr = '';
	//var featureToColourArray = '';
	var featureToColourList = new Array();
	
	for(var i=0; i<nfeatures; i++ ) {
	  var feature = features[i];
	  var nkids = feature.features.length;
	  
	  if(nkids > 0) {
		for(var j=0; j<nkids; j++ ) { 
		  var kid = feature.features[j];
		  
		  if(kid.type == "mRNA") {  
			var exons = getFeatureExons(kid);
			var nexons = exons.length;
			var lastExon = 0;
			var lastYpos = -1;
			var colour = '#666666';
			for(var k=0; k<nexons; k++) {
			  var exon = exons[k];

			  var phase = 0;
		      if(exon.phase != "None") {
			    phase = exon.phase;
		      }

		      if(exon.strand == 1) {
		    	var frame = ( (exon.start+1)-1+getSegmentFrameShift(exons, k, phase) ) % 3;
			  	ypos = marginTop+((frameLineHeight*2)*frame);
		      }
		      else {
			    var frame = 3 -
			          ((sequenceLength-exon.end+1)-1+getSegmentFrameShift(exons, k, phase)) % 3;
			    ypos = marginTop+(frameLineHeight*9)+((frameLineHeight*2)*frame);
		      }

		      //featureToColourArray += '&uniqueName='+exon.uniquename;
		      featureToColourList.push(exon.uniquename);
		      featureStr = drawFeature(leftBase, exon, featureStr, ypos, "featCDS") ;
		      
		      var canvasTop = $('#featureDisplay').css('margin-top').replace("px", "");
		      if(lastYpos > -1) {
		      	  drawFeatureConnections(leftBase, lastExon, exon, 
		      			  lastYpos-canvasTop, ypos-canvasTop, colour);
		      }
		      if(k == nexons-1) {
		      	  drawArrow(leftBase, exon, ypos-canvasTop);
		      }
  			  lastExon = exon;
  			  lastYpos = ypos;
			}
	      }  
		}
	  }
	  
	  if(feature.strand == 1) {
			ypos = marginTop+(frameLineHeight*6);
		  }
		  else {
			ypos = marginTop+(frameLineHeight*9);
		  }	
	  
	  var className = "feat";
	  if(feature.type == "gene") {
		  className = "featGene";
	  }
	  featureStr = drawFeature(leftBase, feature, featureStr, ypos, className) ;
	  
	}
	
	$('#features').html(featureStr);
	
	if($('.feat').height() != frameLineHeight) {
		$('.feat, .featCDS, .featGene, .featGreen').css({'height' : frameLineHeight+'px'});
	}
	
	setupFeatureList(features);
	if(featureToColourList.length > 0) {
		var serviceName = '/genes/featureproperties.json?';
		handleAjaxCalling(serviceName, aFeatureProps,
			'us='+featureToColourList, 
			//featureToColourArray, 
			leftBase, 1, 0);
	}
	return;
};


var aSequence = function ajaxGetSequence(leftBase, end, firstTime, returned) {

	sequence = returned.response.sequence[0].dna.replace(/\r|\n|\r\n/g,"").toUpperCase();
	var seqLen = returned.response.sequence[0].length;

	debugLog("getSequence() sequence length = "+seqLen);
	if((seqLen-sequenceLength) != 0) {
      $(".slider").slider('option', 'max', seqLen);
	}

    sequenceLength = seqLen;
    
    //console.time('draw stop codons');
    $('#stop_codons').html('');
    $('#sequence').html('');
    $('#translation').html('');
	if($('#slider_vertical_container').slider('option', 'value') < 5000) {
	  drawCodons(leftBase);
	  drawAminoAcids(leftBase);
	} else if(showStopCodons) {
      drawStopCodons(leftBase);
	}
    //console.timeEnd('draw stop codons');  

    if (firstTime == 1) {
    	$("#slider_vertical_container").slider('option', 'max', sequenceLength);
    	$("#slider_vertical_container").slider('option', 'value', basesDisplayWidth);
    			
    	$(".slider").slider('option', 'max', sequenceLength);
    	$(".slider").slider('option', 'step', basesDisplayWidth/2);
	}
    
    if(showGC || showAG) {
    	drawContentGraphs(basesDisplayWidth, leftBase, sequence, showAG, showGC);
    }
    
    positionFeatureList();
    
    return;
};


//
// Utilities
//
function handleAjaxCalling(serviceName, ajaxFunction, dataArray, leftBase, end, firstTime) {

	var jsonUrl = webService[serviceType]+serviceName;
    debugLog(serviceName+" "+jsonUrl);
    $.ajax({
		  url: jsonUrl,
		  data: dataArray,
		  dataType: dataType[serviceType],
		  global: false,
		  success: function(returned) {

    	ajaxFunction(leftBase, end, firstTime, returned);

  },
  beforeSend: function(XMLHttpRequest) {
      //XMLHttpRequest.setRequestHeader("Connection", "keep-alive");
  }, 
  error: function(xhr, ajaxOptions, thrownError) {
  	
  	if(xhr.status == "408") {
  		//
  		// timeout repeat call
  		handleAjaxCalling(serviceName, ajaxFunction, dataArray, leftBase, end, firstTime);
  	} else {
  		alert(xhr.status+"\n"+thrownError);
  	}
  }
  });

  logJsonp(serviceName);
}

function escapeId(myid) { 
	   return myid.replace(/(:|\.)/g,'\\$1');
}

function debugLog(txt) {
	if(window.console) {
		console.log(txt);
	} else {
        var ghgt = $('#graph').height();
		var fhgt = $('#featureList').height(); 
		var top = (marginTop+275)+ghgt+fhgt;

		$('#logger').css('top', top+'px');
		$('#logger').append("<br />"+txt);
	}
}

function logJsonp(serviceName) {
	if(dataType[serviceType] != "jsonp") {
		return;
	}
	var $jsonScript = $('head script[src*='+serviceName+']');

    for(var i=0; i<$jsonScript.length; i++) {
    	var src = $jsonScript[i].src;
    	$jsonScript[i].onerror = function(e) {
            debugLog("ERROR :: "+src);
        }; 
        
        $jsonScript[i].onload = function(e) {
            debugLog("LOAD :: "+src);
        };
    }
}
