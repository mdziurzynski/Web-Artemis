// set serviceType to:
// 0 - javascript on same server as webservices 
// 1 - javascript served from a seperate server accessed internally
// 2 - javascript served from a seperate server accessed anywhere
// 
// var serviceType = 0;
// var serviceTypeBam = 0;
// 
// var webService = [ "http://127.0.01:8080/services/",
//                    "http://t81-omixed.internal.sanger.ac.uk:8080/snapshot-services", // public ro snapshot
//                    "http://t81-omixed.internal.sanger.ac.uk:7667", // live pathogens
//                    "http://t81-omixed.internal.sanger.ac.uk:7668", // bigtest2
//                    "http://t81-omixed.internal.sanger.ac.uk:7000", // jython pathogens
//                    "http://t81-omixed.internal.sanger.ac.uk:8080/crawl/",  // java tomcat
//                    "http://www.genedb.org/services",
//                    "http://127.0.0.1:6666"]; 
// var dataType = [ "jsonp", "jsonp", "jsonp", "jsonp", "jsonp", "jsonp", "jsonp", "jsonp" ];

var webService;
var dataType;

//
// web-artemis/index.html?src=Pf3D7_04&base=200000&width=1000&height=10&bases=5000

var debug = false;
var margin = 5;
var initialTop = margin*6;
var displayWidth = 1000;

var screenInterval = 100;
var baseInterval;

var showBam = false;
var showGC = false;
var showAG = false;
var showOther = false;
var compare = false;
var showFeatureList = true;
var showChromosomeMap = false;

var clicks = 0;
var count = 0;
var featureDisplayObjs = new Array();
var returnedSequence;
var useCanvas = false;
var excludes = ['scaffold', 'mitochondrial_chromosome' ,  'chromosome', 'supercontig', 'contig', 'gene', 'pseudogene', 'sequence_feature', 'databank_entry', 'match_part', 'repeat_region', 'repeat_unit', 'direct_repeat', 'EST_match', 'region', 'polypeptide', 'mRNA', 'pseudogenic_transcript', 'nucleotide_match'];
var includes = ['exon', 'pseudogenic_exon', 'CDS', 'gap', 'ncRNA', 'tRNA', 'five_prime_UTR', 'three_prime_UTR', 'polypeptide_motif'];

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


function featureDisplayObj(basesDisplayWidth, marginTop, sequenceLength, 
		                   srcFeature, frameLnHgt, leftBase, showOrganismsList, draggable, mainMenu, zoomMaxRatio) {
	count++;
	this.index = count;
	this.firstTime = true;
	this.basesDisplayWidth = basesDisplayWidth;
	this.marginTop = marginTop;
	this.sequenceLength = sequenceLength;
	this.srcFeature = srcFeature;
	this.frameLnHgt = frameLnHgt;
	this.leftBase = leftBase;
	//this.sequence;
	this.minimumDisplay = false;
	this.showStopCodons = false;
	this.nodraw = false;
	this.observers = new Observable();
	this.oneLinePerEntry = false;
	this.zoomMaxRatio = zoomMaxRatio;
	
	this.highlightFeatures = new Array();
	this.hideFeatures = new Array();

	// add tracks
	this.tracks = new Array();
	this.trackIndex = "track1";
	this.tracks.push(this.trackIndex);
	this.showFeatureFn = new Object();
	this.showFeatureFn[this.trackIndex] = showFeature;
	this.showOrganismsList = showOrganismsList;

	if(showBam) {
	  this.marginTop = this.marginTop+maxBamHgt;
	}
	
	$('#featureDisplays').append('<div id="featureDisplay'+this.index+'" name="fDisplays" class="canvas"></div>');
	$('#stop_codons').append('<div id="stop_codons'+this.index+'"></div>');
	$('#sequence').append('<div id="sequence'+this.index+'" name="sequences" class="canvas"></div>');
	$('#translation').append('<div id="translation'+this.index+'"></div>');
	$("#slider_vertical_container").append('<div id="slider_vertical_container'+this.index+'"></div>');
	$("#slider_container").append('<div id="slider'+this.index+'"></div>');
	$('#features').append('<div id="features'+this.index+'_'+this.trackIndex+'"></div>');
	$('#ticks').append('<div id="ticks'+this.index+'"></div>');
	
	$('#buttons').append('<div id="left'+this.index+'" class="ui-state-default ui-corner-all" title="left scroll"><span class="ui-icon ui-icon-circle-triangle-w"></span></div>');
	$('#buttons').append('<div id="right'+this.index+'" class="ui-state-default ui-corner-all" title="right scroll"><span class="ui-icon ui-icon-circle-triangle-e"></span></div>');

	$('#buttons').append('<div id="plus'+this.index+'" class="ui-state-default ui-corner-all" title="zoom in"><span class="ui-icon ui-icon-circle-plus"></span></div>');
	$('#buttons').append('<div id="minus'+this.index+'" class="ui-state-default ui-corner-all" title="zoom out"><span class="ui-icon ui-icon-circle-minus"></span></div>');

	$('#rightDraggableEdge').append(
			   '<div id="rightDraggableEdge'+this.index+'" class="ui-resizable-se ui-icon ui-icon-gripsmall-diagonal-se"></div>');
	
   if (! draggable) 
       $('#rightDraggableEdge').hide();
    
    
	var self = this;
	adjustFeatureDisplayPosition(false, self);

	var scrollbar = $('#slider'+this.index).slider( {
		animate: true,
		min : 1,
		max : self.sequenceLength-100,
		step : 1,
		start: function(event, ui) {
			lastLeftBase = parseInt(ui.value);
	    },
		change : function(ev, ui) {
	    	if(self.firstTime || self.nodraw)
	    		return;

			self.leftBase = parseInt(ui.value);
			if(ev.originalEvent == undefined)
				drawAll(self, lastLeftBase);
			else
				drawAndScroll(self, lastLeftBase);
		}
	});

	$("#slider_vertical_container"+this.index).slider({
		orientation: "vertical",
		min: 0,
		max: (self.sequenceLength*zoomMaxRatio)-140,
		value: (self.sequenceLength*zoomMaxRatio)-self.basesDisplayWidth,
		step: 100,
		change: function(event, ui) {
    		if(self.firstTime || self.nodraw)
    			return;
			zoomOnce(self, scrollbar);
		}
	});
	this.lastLeftBase = leftBase;

	//
	$('#rightDraggableEdge'+this.index).draggable({
		stop: function(event, ui) {
			var xpos = parseInt(
					$('#rightDraggableEdge'+self.index).css('margin-left').replace("px", ""));
			
			self.frameLnHgt = (ui.offset.top-self.marginTop+8)/17;
			displayWidth = (xpos-margin)+ui.offset.left;
			
			// adjust feature display canvas
			var cssObj = {
					 'height': self.frameLnHgt*17+'px',
					 'width': displayWidth+'px'
			};
			$('#featureDisplay'+self.index).css(cssObj);
			setGraphCss(displayWidth, self.marginTop, margin, self.frameLnHgt);

			drawAll(self);
			adjustFeatureDisplayPosition(true, self);
			drawFrameAndStrand(self);
		}
	});

	drawFrameAndStrand(self);
	drawAll(self);
	getOrganismList(self);
	addEventHandlers(self);

	// feature display menu
	if (! mainMenu) {
	    $("#menuHeader").html("");
    }
	    $('#menuHeader').append('<ul id="fDispMenus'+this.index+'" class="contextMenu" style="width:290px;">' +
    		'<li><a href="#editFeat" id="editFeat">Show feature properties...</a></li>'+
    		'<li><a href="#gotoGene">Find... </a></li>'+
    		'<li><a href="#excludeFeature" id="excludeFeature">Features to show/hide... </a></li>'+
    		'<li><a href="#stopCodonToggle" id="stopCodonToggle">View stop codons</a></li>'+
    		'<li><a href="#oneLineToggle" id="oneLineToggle">View one-line-per-entry</a></li>'+
    		'<li><a href="#showBaseOfSelected" id="basesOfFeature">Bases of selected features...</a></li>'+
    		'<li><a href="#showAAOfSelected" id="aaOfFeature">Amino acids of selected features...</a></li>'+
    		'<li><a href="#hideSelected" id="hideSelectedFeature">Hide/Show seleceted features</a></li>'+
    		'</ul>');
    
    
    
    $('#sequence'+this.index).contextMenu({menu: 'fDispMenus'+self.index}, 
    		function(action, el, pos) { rightClickMenu(action, el, pos, self) });
    $('#features'+this.index+'_'+this.trackIndex).contextMenu({menu: 'fDispMenus'+self.index}, 
    		function(action, el, pos) { rightClickMenu(action, el, pos, self) });

    // graph menu   
    setGraphMenu(self);
    
    
}

var rightClickMenu = function(action, el, pos, self) {
	if(action.match(/editFeat/)) {
		var selectedFeatures = getSelectedFeatureElements();
		if(selectedFeatures.length == 0)
			alert("No features selected.");

		for(var i=0; i<selectedFeatures.length; i++) {
			var thisTrack = findTrackByElement(selectedFeatures[i]);
			self.showFeatureFn[thisTrack].call(null, selectedFeatures[i].id, self);
		}
		
	} else if(action.match(/gotoGene/)) {
		navigate(self);
	} else if(action.match(/stopCodonToggle/)) {
		self.showStopCodons = !self.showStopCodons;
		drawAll(self);
	} else if(action.match(/showBaseOfSelected/)) {
		showBasesOfSelectedFeatures(self);
	} else if(action.match(/showAAOfSelected/)) {
		showAminoAcidsOfSelectedFeatures(self);
	} else if(action.match(/oneLineToggle/)) {
		self.oneLinePerEntry = !self.oneLinePerEntry;
		$('.fwdFrames').html('');
		$('.bwdFrames').html('');
		$('.strands').html('');
		drawAll(self);
		drawFrameAndStrand(self);
	} else if(action.match(/hideSelected/)) {
		hideSelectedFeatures(self);
	} else if(action.match(/excludeFeature/)) {

		$("div#properties").html("<div id='exList'></div>");
	    $("div#exList").dialog({ height: 385 ,
			width:480, position: 'center', title:'Drag Features Between Show/Hide Lists',
			close: function(event, ui) { $(this).remove(); },
			buttons: {
			'Save': function() {
				excludes = [];

				$('ul#exclude').find('li').each(function() { 
					excludes.push(this.innerHTML); 
				})
				
				/*for(var i=0;i<excludes.length; i++)
					debugLog("EXCLUDE: "+excludes[i]);*/
				
				includes = [];

				$('ul#include').find('li').each(function() { 
					includes.push(this.innerHTML); 
				})
				
				/*for(var i=0;i<includes.length; i++)
					debugLog("INCLUDE: "+includes[i]);*/
				
				drawAll(self);
				$(this).dialog('close');
			},
			Cancel: function() {
				$(this).dialog('close');
			}
		}});

	    $("div#exList").append('<ul id="include" class="droptrue">');
	    $("ul#include").append('<lh>Show:</lh>');
	    for(var i=0; i<includes.length; i++)
	    	$("ul#include").append('<li class="ui-state-default">'+includes[i]+'</li>');

	    $("div#exList").append('</ul');
		
	    $("div#exList").append('<ul id="exclude" class="droptrue">');
	    $("ul#exclude").append('<lh>Hide:</lh>');
	    for(var i=0; i<excludes.length;i++)
	    	$("ul#exclude").append('<li class="ui-state-default">'+excludes[i]+'</li>');
	    $("div#exList").append('</ul');

	    
	    $("ul.droptrue").sortable({
			connectWith: 'ul'
		});

		$("ul.dropfalse").sortable({
			connectWith: 'ul',
			dropOnEmpty: false
		});
		$("#exclude, #include").disableSelection();
	}
};

function drawAndScroll(fDisplay, lastLeftBase) {
	var diff = fDisplay.leftBase - lastLeftBase;
	drawAll(fDisplay);
	scrollDisplay(fDisplay, diff, -1);
}

function scrollDisplay(fDisplay, diff, comparisonIndex) {
	if(fDisplay.comparison != undefined) {
	  for(var i = comparisonIndex+1; i<fDisplay.comparison.length; i++) {
		  var comparison = fDisplay.comparison[i];
		  if(comparison.lock && comparison.index != comparisonIndex) {
			  var fDisplay1 = comparison.featureDisplay1;
			  var fDisplay2 = comparison.featureDisplay2;
			  
			  if(fDisplay1.index != fDisplay.index) {
				  updateDisplay(fDisplay1, diff);
				  scrollDisplay(fDisplay1, diff, comparison.index);
			  }
			  if(fDisplay2.index != fDisplay.index) {
				  updateDisplay(fDisplay2, diff);
				  scrollDisplay(fDisplay2, diff, comparison.index);
			  }
		  }
	  }
	}
}

function updateDisplay(fDisplay, diff) {
	var ind = fDisplay.index;  
	var pos = $('#slider'+ind).slider('value')+diff;
	
	debugLog("diff= "+diff+" pos="+pos);
	if(pos > fDisplay.sequenceLength) {
		pos = fDisplay.sequenceLength - fDisplay.basesDisplayWidth;
	} else if(pos < 1) {
		pos = 1;
	}

	fDisplay.leftBase = pos;
	fDisplay.nodraw = true;
	$('#slider'+ind).slider('option', 'value', pos);
	drawAll(fDisplay);
	fDisplay.nodraw = false;
}

function comparisonObj(featureDisplay1, featureDisplay2, index) {
	this.featureDisplay1 = featureDisplay1;
	this.featureDisplay2 = featureDisplay2;
	this.index = index;
	this.lock = true;
	
	if(!featureDisplay1.comparison) {
		featureDisplay1.comparison = [];
	}
	
	if(!featureDisplay2.comparison) {
		featureDisplay2.comparison = [];
	}

	featureDisplay1.comparison[ featureDisplay1.comparison.length ] = this;
	featureDisplay2.comparison[ featureDisplay2.comparison.length ] = this;
	
	this.selectedMatches = [];
	
	var self = this;
	$('#comparisons').append('<div id="comp'+this.index+'" class="canvas"></div>');
	
	$('#comparisons').append('<div id="compMenu'+this.index+'"></div>');
    $('#compMenu'+this.index).append('<ul id="myMenu'+this.index+'" class="contextMenu">' +
     '<li><a href="#lock" id="lock'+this.index+'">UnLock</a></li>'+
     '<li><a href="#matches" id="matches'+this.index+'">Details</a></li>'+
     '</ul>');
    
    $('#comp'+this.index).contextMenu({
        menu: 'myMenu'+self.index
    },
    function(action, el, pos) {
    	
    	if(action == 'lock') {
    		if(self.lock) {
        		self.lock = false;
        		$('#lock'+self.index).html('Lock');
        	} else {
        		self.lock = true;
        		$('#lock'+self.index).html('UnLock');
        	}
    	} else if(action == 'matches') {
    		
    		var mId = self.selectedMatches[0].match.replace(/(:|\.)/g,'');
    		
    		$("div#matchProps").html("<div id=matchProps"+mId+"></div>");
    	    $("div#matchProps"+mId).dialog({ height: 450 ,
    			width:550, position: 'top', title: 'Selected Matches'});
    	    
    		for(var i=0; i<self.selectedMatches.length; i++) {
    			var match = self.selectedMatches[i];

    			var str1;
    			if(match.f1strand == "1") {
    				str1 = match.fmin1+".."+match.fmax1;
    			} else {
    				var s = parseInt(match.fmin1)+1;
    				str1 = "complement("+s+".."+match.fmax1+")";
    			}
    			
    			var str12
    			if(match.f2strand == "1") {
    				str2 = match.fmin2+".."+match.fmax2;
    			} else {
    				var s = parseInt(match.fmin2)+1;
    				str2 = "complement("+s+".."+match.fmax2+")";
    			}
    			
    			$("div#matchProps"+mId).append(str1+" " +str2+ "  "+ 
    					                   match.score + '<br />');
    		}
    	}
    });

	drawComparison(featureDisplay1);
}

function doubleClickComparison(featureDisplay) {
	if(!featureDisplay.comparison) {
		return;
	}
	
	for(var i=0;i<featureDisplay.comparison.length;i++) {
		var comparison = featureDisplay.comparison[i];
		var matches = comparison.selectedMatches;
		if(matches.length > 0) {
			var centerMatch = matches[0];
			var fDisplay1 = comparison.featureDisplay1;
			var fDisplay2 = comparison.featureDisplay2;

			var center1 = parseInt(centerMatch.fmin1)+((parseInt(centerMatch.fmax1) - parseInt(centerMatch.fmin1))/2);
			var center2 = parseInt(centerMatch.fmin2)+((parseInt(centerMatch.fmax2) - parseInt(centerMatch.fmin2))/2);
			
			if(fDisplay1.srcFeature == centerMatch.f1) {
				fDisplay1.leftBase = Math.round(center1 - (fDisplay1.basesDisplayWidth/2));
				//drawAll(fDisplay1);
				$('#slider'+fDisplay1.index).slider('option', 'value', fDisplay1.leftBase);
			}
			
			if(fDisplay2.srcFeature == centerMatch.f2) {
				fDisplay2.leftBase = Math.round(center2 - (fDisplay2.basesDisplayWidth/2));
				//drawAll(fDisplay2);
				$('#slider'+fDisplay2.index).slider('option', 'value', fDisplay2.leftBase);
			}
		}
	}
}

function drawComparison(featureDisplay, clickX, clickY, clearSelections) {

	if(!featureDisplay.comparison) {
		return;
	}
	
	for(var i=0;i<featureDisplay.comparison.length;i++) {
		var comparison = featureDisplay.comparison[i];
			
		var serviceName = '/features/blastpair.json?';
		//?subject=Pk_strainH_chr09.embl&target=Pf3D7_10&score=1e-05&start=1&end=1000
		//?blastpair.json?f2=Pk_strainH_chr09.embl&f1=Pf3D7_10&start1=1&end1=10000&start2=1&end2=10000&normscore=0.000000000001

		var fDisplay1 = comparison.featureDisplay1;
		var fDisplay2 = comparison.featureDisplay2;
		
		var start1 = Math.floor(fDisplay1.leftBase);
		var end1   = Math.ceil(start1 + fDisplay1.basesDisplayWidth);
		
		var start2 = Math.floor(fDisplay2.leftBase);
		var end2   = Math.ceil(start2 + fDisplay2.basesDisplayWidth);

		var f1 = fDisplay1.srcFeature;
		var f2 = fDisplay2.srcFeature;
		var normscore = '1e-07';
		var maxLength = 200;
		
		//debugLog(i+" CALL BLASTPAIR "+f1+" ("+start1+".."+end1+") "+f2+" ("+start2+".."+end2+")");
		handleAjaxCalling(serviceName, aComparison,
				{ f1:f1, start1:start1, end1:end1, start2:start2, end2:end2, f2:f2, normscore:normscore, length:maxLength }, featureDisplay, { comparison:comparison, clickX:clickX, clickY:clickY, clearSelections:clearSelections });
	}
}

function hideEndOfSequence(fDisplay) {
	baseInterval = (fDisplay.basesDisplayWidth/displayWidth)*screenInterval;
	var basePerPixel  = baseInterval/screenInterval;
	var xpos = margin+((fDisplay.sequenceLength - fDisplay.leftBase + 1 )/basePerPixel);
	var ypos = margin;
	var width = (margin+(fDisplay.basesDisplayWidth/basePerPixel))-xpos;
	var height = fDisplay.frameLnHgt*7;
	$("#featureDisplay"+fDisplay.index).fillRect(xpos,ypos,width,height, {color: "#FFFFFF"});
	ypos += fDisplay.frameLnHgt*9;
	$("#featureDisplay"+fDisplay.index).fillRect(xpos,ypos,width,height, {color: "#FFFFFF"});
}

//
function adjustFeatureDisplayPosition(drag, fDisplay) {
	var thisMarginTop = fDisplay.marginTop;
	var thisFLH = fDisplay.frameLnHgt;
	
	var cssObj = {
			 'margin-left': margin+'px',
			 'position':'absolute',
			 'top': thisMarginTop+(thisFLH*16.8)+'px'
	};
	$('#left'+fDisplay.index).css(cssObj);

	cssObj = {
			'margin-left': margin+displayWidth+'px',
			'position':'absolute',
			'top': thisMarginTop+(thisFLH*16.8)+'px'
	};
	$('#right'+fDisplay.index).css(cssObj);
	
	cssObj = {
			'margin-left': margin+margin+displayWidth+'px',
			'position':'absolute',
			'top': margin+thisMarginTop+'px'
	};
	$('#plus'+fDisplay.index).css(cssObj);
	
	cssObj = {
			'margin-left': margin+margin+displayWidth+'px',
			'position':'absolute',
			'top': margin+thisMarginTop+(thisFLH*11)+'px'
	};
	$('#minus'+fDisplay.index).css(cssObj);
	

	var buttonWidth = $('#left'+fDisplay.index).width()+5;
	cssObj = {
        'margin-left': margin+buttonWidth+'px',
        'width': displayWidth-buttonWidth-(2*margin)+'px',
        'position':'absolute',
        'top':thisMarginTop+(thisFLH*16.9)+'px'
	};
	$('#slider'+fDisplay.index).css(cssObj);

	var buttonHeight = $('#plus'+fDisplay.index).height()+5;
	cssObj = {
	     'margin-left': margin+margin+margin+displayWidth+'px',
	     'height': (thisFLH*11)-(buttonHeight*1.2)+'px',
	     'position':'absolute',
	     'top': margin+thisMarginTop+buttonHeight+'px'
	};
	$('#slider_vertical_container'+fDisplay.index).css(cssObj);
	
	cssObj = {
			'margin-top': thisMarginTop-margin+'px',
			'width': displayWidth+margin+'px',
			'height':  (thisFLH*16.9)+'px'
	};
	$('#featureDisplay'+fDisplay.index).css(cssObj);
	$('#sequence'+fDisplay.index).css(cssObj);

	var top = thisMarginTop+margin+(thisFLH*16)-$('#rightDraggableEdge'+fDisplay.index).height();
	var lft = margin+displayWidth-($('#rightDraggableEdge'+fDisplay.index).height()/2);
	if(!drag) {
		cssObj = {
			'position': 'absolute',
			'z-index' : '2',
			'border': '0px solid #FF0000',
		    'left': lft+'px',
		    'top': top+'px'
		};
		$('#rightDraggableEdge'+fDisplay.index).css(cssObj);
	} else {
		$('#rightDraggableEdge'+fDisplay.index).css({'top':top+'px', 'left': lft+'px'});
	}
}

//
function addEventHandlers(fDisplay) {
	// show/hide stop codons
	if(fDisplay.index == 1) {
	
		$('#stopCodonToggle').click(function(event){
			fDisplay.showStopCodons = !fDisplay.showStopCodons;
			drawAll(fDisplay);
		});
		
		$('#gotoGene').click(function(event){
		    navigate(fDisplay);
		});
		
		$('#bamFiles').click(function(event){
			var tgt = $(event.target);
			if($(tgt).attr('id') == "none")
				return;
	
			if(isBamVisible($(tgt).attr('name'))) {
				removeBamDisplay(fDisplay, $(tgt).attr('name'));
			} else {
				addBamDisplay(fDisplay, tgt);
			}
		});
		
		$('#vcfFiles').click(function(event){
			var tgt = $(event.target);
			if($(tgt).attr('id') == "none")
				return;
	
			//if(isBamVisible($(tgt).attr('name'))) {
			//	removeBamDisplay(fDisplay, $(tgt).attr('name'));
			//} else {
				addVcfDisplay(fDisplay, tgt);
			//}
		});
		
		$('#basesOfFeature').click(function(event){
			showBasesOfSelectedFeatures(fDisplay);
		});
		
		$('#aaOfFeature').click(function(event){
			showAminoAcidsOfSelectedFeatures(fDisplay);
		});
		
		$('#hideSelectedFeature').click(function(event){
			hideSelectedFeatures(fDisplay);
		});
		
		$('#fProperties').click(function(event){
			var selectedFeatures = getSelectedFeatureElements();
    		if(selectedFeatures.length == 0)
    			alert("No features selected.");
    		
    		for(var i=0; i<selectedFeatures.length; i++) {
    			var thisTrack = findTrackByElement(selectedFeatures[i]);
    			fDisplay.showFeatureFn[thisTrack].call(null, selectedFeatures[i].id, self);
    		}
		});

	// graphs
		$('#gcGraphToggle').click(function(event){
			if(showGC) {
				if(!showAG && !showOther) {
					$("#graph").css('height', 0+'px');
					$("#graph").html('');
				}
				showGC = false;
			} else {
				setGraphCss(displayWidth, fDisplay.marginTop, margin, fDisplay.frameLnHgt);
				showGC = true;	
			}
			drawAll(fDisplay);
		});
	
		$('#agGraphToggle').click(function(event){
			if(showAG) {
				if(!showGC && !showOther) {
					$("#graph").css('height', 0+'px');
					$("#graph").html('');
				}
				showAG = false;
			} else {
				setGraphCss(displayWidth, fDisplay.marginTop, margin, fDisplay.frameLnHgt);
				showAG = true;	
			}
			drawAll(fDisplay);
		});
	
		$('#otherGraphToggle').click(function(event){
			if(showOther) {
				if(!showGC && !showAG) {
					$("#graph").css('height', 0+'px');
					$("#graph").html('');
				}
				showOther = false;
			} else {
				setGraphCss(displayWidth, fDisplay.marginTop, margin, fDisplay.frameLnHgt);
				showOther = true;
			}
			drawAll(fDisplay);
		});
	}
	
	
	$('#features'+fDisplay.index+'_track1').single_double_click(handleFeatureClick, centerOnFeature, fDisplay, 500);
	$('#sequence'+fDisplay.index).click(function(event){
		deselectAllFeatures(fDisplay);
	});
	
	// popup
	$('#features'+fDisplay.index+'_track1').popup_enter_out(showPopupFeature, disablePopup);
	
	
	$('#translation'+fDisplay.index).click(function(event){
		var aminoacid = $(event.target).attr('id');
		var bgColour = $(event.target).css('background-color');
		$(event.target).css('background-color', '#FFFF00');
	 });
	
	if(count == 2) {
		
		// remove top menu
		$('.sf-menu').html('');
		//
		var last;
		$('#comparisons').click(function(event){
			var compId = $(event.target).parent().attr('id');
			var index = parseInt(compId.replace("comp",""));
			
			var clearSelections = true;
			if (event.shiftKey) {
				clearSelections = false;
			}
			
			// detect double clicks
			var diff = 4000;
			if(last) {
				diff = event.timeStamp - last;
			}
			last = event.timeStamp;
			
			if(!event.shiftKey && diff < 1000) {
				// double click
				debugLog("DOUBLE CLICK ");
				doubleClickComparison(featureDisplayObjs[index]);
				return;
			}

			debugLog("CLICK time between clicks = "+diff);
			drawComparison(featureDisplayObjs[index], event.pageX, event.pageY, clearSelections);
		});
	}
	
	addSelectionEventHandlers(fDisplay);
	//zoom
	addZoomEventHandlers(fDisplay);

	//scrolling
	addScrollEventHandlers(fDisplay);
}

function showPopupFeature(event) {
	var tgt = $(event.target);
	var x = event.pageX+10;
	var y = event.pageY+10;
	
	var msg = "<p><i>right click  - show options<br />";
	msg +=          "single click - select<br />";
	msg +=          "double click - center</i></p>";
	
	var currentId = $(tgt).attr('id');
	var txt = '';
	if(isPartial(tgt))
		txt = 'Partial ';

    if( $(tgt).is(".featCDS") ) { 
    	loadPopup(txt+"CDS<br />"+currentId+msg,x,y);
    } else if( $(tgt).is(".featPseudo") ) {
    	loadPopup(txt+"Pseudogene<br />"+currentId+msg,x,y);  
    } else if( $(tgt).is(".featGene") ) {
    	loadPopup(txt+"Gene<br />"+currentId+msg,x,y);  
    } else if( $(tgt).is(".feat") ) {	
    	loadPopup(txt+currentId+msg,x,y);
    }
}


function showFeature(featureSelected, featureDisplay) {
	debugLog(featureSelected+" SELECTED ");
    var serviceName = '/features/hierarchy.json';
	handleAjaxCalling(serviceName, aShowProperties,
			{ features:featureSelected, root_on_genes:true }, featureDisplay, { featureSelected:featureSelected });
}

//
function drawFrameAndStrand(fDisplay){
	var ntracks = getNTracks(fDisplay);
	var ypos = fDisplay.marginTop;
	var thisFLH = fDisplay.frameLnHgt;

	for(var i=0;i<ntracks; i++) {
	  var name = 'fwdFrame'+i+fDisplay.index;
	  addFrameLine('.fwdFrames',ypos,name, fDisplay);
	  ypos+=thisFLH*2;
	}
	
	addStrandLine('.strands', ypos, 'fwdStrand'+fDisplay.index, fDisplay);
	ypos+=thisFLH*3;
	addStrandLine('.strands', ypos, 'bwdStrand'+fDisplay.index, fDisplay);
	
	ypos+=thisFLH*2;
	for(var i=0;i<ntracks; i++) {
	  var name = 'bwdFrame'+i+fDisplay.index;
	  addFrameLine('.bwdFrames',ypos,name, fDisplay);
	  ypos+=thisFLH*2;
	}
}

function addStrandLine(selector, ypos, strand, fDisplay) {
	var thisFLH = fDisplay.frameLnHgt;
	var cssObj = {
		'height':thisFLH+'px',
		'line-height' : thisFLH+'px',
		'width':displayWidth+'px',
		'margin-left': margin+'px',
		'margin-top': ypos+'px',
		'background':  'rgb(200, 200, 200)',
		'position':'absolute'
	};

	$(selector).append('<div class='+strand+'>&nbsp;</div>');
	$('.'+strand).css(cssObj);
}

function addFrameLine(selector, ypos, frame, fDisplay) {
	var cssObj = {
		'height':fDisplay.frameLnHgt+'px',
		'line-height' : fDisplay.frameLnHgt+'px',
		'width':displayWidth+'px',
		'margin-left': margin+'px',
		'margin-top': ypos+'px',
		'background':  'rgb(240, 240, 240)',
		'position':'absolute'
	};

	$(selector).append('<div class='+frame+'>&nbsp;</div>');
	$('.'+frame).css(cssObj);
}

function drawAll(fDisplay) {
	  $('#featureDisplay'+fDisplay.index).html('');
      var showSequence = true;
      
      if(!fDisplay.minimumDisplay) {
          drawBam(fDisplay);
          drawVcf(fDisplay);
          fDisplay.observers.notify('redraw', fDisplay.leftBase, parseInt(fDisplay.leftBase)+parseInt(fDisplay.basesDisplayWidth));
      }
      
      if(fDisplay.minimumDisplay &&
    	$('#slider_vertical_container'+fDisplay.index).slider('option', 'value') <= fDisplay.sequenceLength-800) {
    	  showSequence = false;
      }
      
      if(showSequence && (fDisplay.firstTime || isZoomedIn(fDisplay) || fDisplay.showStopCodons || showGC || showAG || showOther)) {
        getSequence(fDisplay);
      } else {
    	$('#stop_codons'+fDisplay.index).html('');
        $('#sequence'+fDisplay.index).html('');
        $('#translation'+fDisplay.index).html('');
      }

      drawFeatures(fDisplay);
	  drawTicks(fDisplay);
	  
	  if(compare) {
		drawComparison(fDisplay);
	  }
	  
	  if(!fDisplay.firstTime && fDisplay.leftBase+fDisplay.basesDisplayWidth > fDisplay.sequenceLength) {
		  hideEndOfSequence(fDisplay);
	  }
      
	  if(fDisplay.firstTime && showChromosomeMap) {
		  
	        $.ajax({
	            url: webService + "/regions/sequenceLength.json",
	            dataType: 'jsonp',
	            data: { 'region' : fDisplay.srcFeature },
	            success: function(regions) { 
	                chromosomeMap(fDisplay, regions[0].length);
	            }
	        });

	  }

}

function chromosomeMap(fDisplay, sequenceLength) {

	$('#slider'+fDisplay.index).css('display', 'none');
	
	var buttonWidth = $('#left'+fDisplay.index).width()+5;
	cssObj = {
	    'margin-left': margin+buttonWidth+'px',  
	    'width': displayWidth-buttonWidth+'px',
	    'position':'absolute',
	    'top':fDisplay.marginTop+(fDisplay.frameLnHgt*16.9)+margin+'px'
	};
	
	cssObj2 = {
		'margin-top':-26+'px',
	    'z-index': '100'
	};
	
	var chr_container = "chr-container"+fDisplay.index;
	var chr_map = "chr-map"+fDisplay.index;
	var chr_map_slider = "chr-map-slider"+fDisplay.index;
	
	$('#slider_container').append('<div id="'+chr_container+'"><div id="'+chr_map+'" ></div><div id="'+chr_map_slider+'" ></div></div>');
	$('#'+chr_container).css(cssObj);
	$('#'+chr_map_slider).css(cssObj2);
	
    $('#'+chr_map).ChromosomeMap({
        region : fDisplay.srcFeature, 
        overideUseCanvas : false,
        bases_per_row: parseInt(sequenceLength),
        row_height : 10,
        row_width : $('#slider'+fDisplay.index).width(),
        overideUseCanvas : true,
        loading_interval : 100000,
        axisLabels : false,
        row_vertical_space_sep : 10,
        web_service_root : webService
    });

    $('#'+chr_map_slider).ChromosomeMapSlider({
        windowWidth : $('#slider'+fDisplay.index).width(),
        max : parseInt(sequenceLength), 
        observers : [new ChromosomeMapToWebArtemis()],
        pos : parseInt(fDisplay.leftBase),
        width : parseInt(fDisplay.basesDisplayWidth)
    });

    
    setTimeout(function() { 
        $('#web-artemis').WebArtemis('addObserver', 
            new WebArtemisToChromosomeMap('#'+chr_map_slider));
    }, 500);
}

function getSequence(fDisplay) {
	var start = fDisplay.leftBase-1;
	var end = parseInt(start)+parseInt(fDisplay.basesDisplayWidth);
	
	if(isZoomedIn(fDisplay)) {
	  if(returnedSequence) {
		  var seq = returnedSequence[0];

		  if(seq.start <= fDisplay.leftBase && seq.end >= end) {
			  aSequence(fDisplay, returnedSequence, {});
			  return;
		  }
	  }
	  end = end + (fDisplay.basesDisplayWidth*8);
	  start = start - (fDisplay.basesDisplayWidth*8);
	  if(start < 0)
		  start = 0;
	} else {
	  currentSeq = null;
	}

	var serviceName = '/regions/sequence.json?';
	handleAjaxCalling(serviceName, aSequence,
			{ region:fDisplay.srcFeature, start:start, end:end }, 
			fDisplay, {});
}

function drawStopCodons(fDisplay, basePerPixel) {
    var fwdStops1 = new Array();
    var fwdStops2 = new Array();
    var fwdStops3 = new Array();
    
    var bwdStops1 = new Array();
    var bwdStops2 = new Array();
    var bwdStops3 = new Array();

    //console.time('calculate stop codons');  
    calculateStopCodons(fDisplay, fwdStops1, fwdStops2, fwdStops3, 'TAG', 'TAA', 'TGA', 1);
    calculateStopCodons(fDisplay, bwdStops1, bwdStops2, bwdStops3, 'CTA', 'TTA', 'TCA', -1);
    //console.timeEnd('calculate stop codons');
	
	var nstops = fwdStops1.length + fwdStops2.length + fwdStops3.length +
				 bwdStops1.length + bwdStops2.length + bwdStops3.length; 
	if(nstops > 3000) {
		var canvasTop = $('#featureDisplay'+fDisplay.index).css('margin-top').replace("px", "");
		var mTop = fDisplay.marginTop;
		var flh  = fDisplay.frameLnHgt;
		
		drawStopOnCanvas(fwdStops1, mTop+((flh*2)*0+1)-canvasTop, flh, fDisplay, basePerPixel);
		drawStopOnCanvas(fwdStops2, mTop+((flh*2)*1+1)-canvasTop, flh, fDisplay, basePerPixel);
		drawStopOnCanvas(fwdStops3, mTop+((flh*2)*2+1)-canvasTop, flh, fDisplay, basePerPixel);
	
		drawStopOnCanvas(bwdStops1, mTop+(flh*10)+flh+((flh*2)*0+1)-canvasTop, flh, fDisplay, basePerPixel);
		drawStopOnCanvas(bwdStops2, mTop+(flh*10)+flh+((flh*2)*1+1)-canvasTop, flh, fDisplay, basePerPixel);
		drawStopOnCanvas(bwdStops3, mTop+(flh*10)+flh+((flh*2)*2+1)-canvasTop, flh, fDisplay, basePerPixel);
	} else {
		//console.time('draw fwd stop codons');
		drawFwdStop(fwdStops1, 0, fDisplay, basePerPixel);
		drawFwdStop(fwdStops2, 1, fDisplay, basePerPixel);
		drawFwdStop(fwdStops3, 2, fDisplay, basePerPixel);
		//console.timeEnd('draw fwd stop codons');
	
		//console.time('draw bwd stop codons');  
		drawBwdStop(bwdStops1, 0, fDisplay, basePerPixel);
		drawBwdStop(bwdStops2, 1, fDisplay, basePerPixel);
		drawBwdStop(bwdStops3, 2, fDisplay, basePerPixel);
		//console.timeEnd('draw bwd stop codons');
		
		if($('.bases').height() != fDisplay.frameLnHgt) {
		  $('.bases').css({'height' : fDisplay.frameLnHgt+'px'});
		}
	}
};


function drawStopOnCanvas(stop, ypos, frameLnHgt, fDisplay, basePerPixel) {
	var len=stop.length;
	var colour = '#000000';
	for(var i=0; i<len; i++ ) {
		var position1 = stop[i];
		var stopPosition1 = margin+Math.round(stop[i]/basePerPixel);
		$("#featureDisplay"+fDisplay.index).drawLine(stopPosition1, ypos, stopPosition1, ypos+frameLnHgt,
				{color: colour, stroke:'1'});
	}
}

function drawFwdStop(stop, frame, fDisplay, basePerPixel) {
  var len=stop.length;
  var ypos = fDisplay.marginTop+((fDisplay.frameLnHgt*2)*frame);

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
  
  $('#stop_codons'+fDisplay.index).append(fwdStopsStr);
}

function drawBwdStop(stop, frame, fDisplay, basePerPixel) {
  var len=stop.length;
  var ypos = fDisplay.marginTop+(fDisplay.frameLnHgt*10)+
  				fDisplay.frameLnHgt+((fDisplay.frameLnHgt*2)*frame);

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
  $('#stop_codons'+fDisplay.index).append(bwdStopsStr);
}

function getSequenceCanvasCtx(fDisplay, clearCanvas) {
	  var width = $('#featureDisplay'+fDisplay.index).css('width').replace("px", "");
	  var height = fDisplay.frameLnHgt*17;

	  if (!$('#featureDisplay'+fDisplay.index).find('canvas').get(0)) {
		  $('#featureDisplay'+fDisplay.index).append("<canvas  width='"+$('#featureDisplay'+fDisplay.index).css('width')+"' height='"+$('#featureDisplay'+fDisplay.index).css('height')+"' style='position: absolute; top: 0; left: 0;'></canvas>");
	  }
	  
	  var canvas = $('#featureDisplay'+fDisplay.index).find("canvas").get(0);
	  var ctx = canvas.getContext("2d");
	  if(clearCanvas) {
		  ctx.clearRect(0, 0, width, height);
	  }
	  return ctx;
}

function fwdStrandYpos(fDisplay, byCanvas) {
	var ntracks = getNTracks(fDisplay);
	var tm = (2*ntracks)+1;
	if(byCanvas) {
		return margin+7*fDisplay.frameLnHgt;
	} else {
		return fDisplay.marginTop+7*fDisplay.frameLnHgt;
	}
}

function bwdStrandYpos(fDisplay, byCanvas) {
	var ntracks = getNTracks(fDisplay);
	var tm = (2*ntracks)+4;
	if(byCanvas) {
		return margin+tm*fDisplay.frameLnHgt;
	} else {
		return fDisplay.marginTop+tm*fDisplay.frameLnHgt;
	}
}

function getNTracks(fDisplay) {
	if(!fDisplay.oneLinePerEntry) {
		return 3;
	} else {
		return fDisplay.tracks.length;
	}
}

function drawCodons(fDisplay, basePerPixel) {
  if(window.console) 
  		console.time('draw codons');

  //useCanvas = false;
  if(useCanvas) {
	  var ctx = getSequenceCanvasCtx(fDisplay, true);
  }
  var yposFwd = fwdStrandYpos(fDisplay, useCanvas)-fDisplay.frameLnHgt-2;
  var yposBwd = bwdStrandYpos(fDisplay, useCanvas)-fDisplay.frameLnHgt-2;
  
  var xpos = margin;
  var baseStr = '';
  for(var i=0;i<fDisplay.basesDisplayWidth; i++) {
	  if(i+fDisplay.leftBase > fDisplay.sequenceLength) {
		  break;
	  }
	  
	  var b = fDisplay.sequence.charAt(i);
	  if(useCanvas) {
		drawString(ctx, b, xpos, yposFwd+fDisplay.frameLnHgt, '#000000', 0,"Courier New",14);
	  	drawString(ctx, complement(b), xpos, yposBwd+fDisplay.frameLnHgt, '#000000', 0,"Courier New",14);
	  } else {
		baseStr = baseStr+
	  	  '<div class="base" style="margin-top:'+yposFwd+'px; margin-left:'+xpos+'px">'+b+'</div>'+
	  	  '<div class="base" style="margin-top:'+yposBwd+'px; margin-left:'+xpos+'px">'+complement(b)+'</div>';
	  }
	  xpos += (1/basePerPixel);
  }
  if(!useCanvas) {
	  $('#translation'+fDisplay.index).html(baseStr);
  }
  if(window.console)
	console.timeEnd('draw codons');
}

function drawAminoAcids(fDisplay, basePerPixel) {
  if(window.console)
	console.time('draw aas');
 
  var xpos = margin;
  if(useCanvas) {
	  var ctx = getSequenceCanvasCtx(fDisplay, false);
	  xpos += (1/basePerPixel);
  } 

  var aaStr = '';
  for(var i=0;i<fDisplay.basesDisplayWidth; i++) {
	  
	  if(i+fDisplay.leftBase > fDisplay.sequenceLength) {
		  break;
	  }
	  var frame = (fDisplay.leftBase-1+i) % 3;
	  
	  var aa = getCodonTranslation(fDisplay.sequence.charAt(i), 
  			  fDisplay.sequence.charAt(i+1), 
  			  fDisplay.sequence.charAt(i+2));

	  if(useCanvas) {
		  var yposFwd = margin+(frame*(fDisplay.frameLnHgt*2))+fDisplay.frameLnHgt-2;
		  drawString(ctx, aa, xpos, yposFwd, '#000000', 0,"Courier New",14);
	  } else {
		  yposFwd = fDisplay.marginTop+(frame*(fDisplay.frameLnHgt*2))-2;
		  aaStr = aaStr + '<div class="aminoacid" style="margin-top:'+yposFwd+'px; margin-left:'+
		  		xpos+'px; width:'+3/basePerPixel+'px">'+aa+'</div>';   
	  }
	  
  	  var reversePos = fDisplay.sequenceLength-(i+fDisplay.leftBase+1);
  	  frame = 3 - ((reversePos+3)-1) % 3 -1;

	  // reverse strand
	  aa = getCodonTranslation(complement(fDisplay.sequence.charAt(i+2)), 
              complement(fDisplay.sequence.charAt(i+1)), 
              complement(fDisplay.sequence.charAt(i)))
              
	  if(useCanvas) {
		  var yposBwd = margin+(fDisplay.frameLnHgt*11)+
			((fDisplay.frameLnHgt*2)*frame)+fDisplay.frameLnHgt-2;
		  drawString(ctx, aa, xpos, yposBwd, '#000000', 0,"Courier New",14);
	  } else {
		  yposBwd = fDisplay.marginTop+(fDisplay.frameLnHgt*11)+
			((fDisplay.frameLnHgt*2)*frame)-2;
		  aaStr = aaStr + '<div class="aminoacid" style="margin-top:'+
		  		yposBwd+'px; margin-left:'+xpos+'px; width:'+3/basePerPixel+'px">'+aa+'</div>';
	  }
	  xpos += (1/basePerPixel);
  }
  
  if(!useCanvas) {
	  $('#translation'+fDisplay.index).append(aaStr);
  }
  
  if(window.console)
	console.timeEnd('draw aas');
}

function drawFeatures(fDisplay) {
	var end = parseInt(fDisplay.leftBase)+parseInt(fDisplay.basesDisplayWidth);
	
	//debugLog("start..end = "+featureDisplay.leftBase+".."+end);
	if(end > fDisplay.sequenceLength && 
			fDisplay.leftBase < fDisplay.sequenceLength && !fDisplay.firstTime) {
		end = fDisplay.sequenceLength;
	}
	
	//var serviceName = '/regions/featureloc.json?';
	var serviceName = '/regions/locations.json?';
	var currentTime = new Date().getTime();
	
	handleAjaxCalling(serviceName, aFeatureFlatten,
			{ region:fDisplay.srcFeature, 
		      start:fDisplay.leftBase, end:end, 
		      types:excludes,
		      exclude: true}, 
		      fDisplay, { append:false, minDisplay:fDisplay.minimumDisplay, startTime:currentTime, track:'track1' });
}

function getFeatureExons(transcript) {
	var nkids = transcript.child.length;
	var exons = [];
	if(nkids > 0)
	{
	  for(var i=0; i<nkids; i++) {
		var kid = transcript.child[i];
		if(kid.type == "exon" || kid.type == 'pseudogenic_exon') {
	       exons.push(kid);
		}
      }	
	}
	
	if(exons.length > 0) {
	  exons.sort(sortFeatures);
	}
	return exons;
}

function getFeaturePeptide(transcript) {
	var nkids = transcript.child.length;
	if(nkids > 0)
	{
	  for(var i=0; i<nkids; i++) {
		var kid = transcript.child[i];	
		if(kid.type == "polypeptide") {
	       return kid;
		}
      }	
	}
	return -1;
}


function getSegmentFrameShift(exons, index, phase) {
  // find the number of bases in the segments before this one
  var base_count = 0;

  for(var i = 0; i < index; ++i) 
  {
    var exon = exons[i];
    base_count += exon.fmax-exon.fmin;
  }

  var mod_value = (base_count + 3 - phase) % 3;
  if (mod_value == 1) {
    return 2;
  } else if (mod_value == 2) {
    return 1;
  } 
  return 0;
}

function drawFeature(leftBase, feature, featureStr, ypos, className, basePerPixel) {

  var startFeature = margin+((feature.fmin - leftBase + 1)/basePerPixel);
  var endFeature   = margin+((feature.fmax - leftBase + 1)/basePerPixel);
  var extra = '';
  var bdrLft = true;
  var bdrRgt = true;
  
  if(startFeature < margin) {
    startFeature = margin;
    extra = 'border-left: none;';
    bdrLft = false;
  }
  
  if(endFeature > margin+displayWidth) {
	if(startFeature > margin+displayWidth)   
		return featureStr;
    endFeature = margin+displayWidth;
    extra += 'border-right: none;';
    bdrRgt = false;
  }

  var pos = 'margin-top:'+ypos+"px; margin-left:"+startFeature+"px";
  var width = endFeature-startFeature;

  // set border for partial features
  var sz = Math.ceil(width/10);
  if(feature.is_fmax_partial == "True") {
	  width -= sz;
	  if(feature.strand == 1 && bdrRgt)
		  extra += 'border-right-style:double; border-right-width: '+sz+'px;';
	  else if(feature.strand == -1 && bdrLft)
		  extra += 'border-left-style:double; border-left-width: '+sz+'px;';
	  else
		  width += sz;
  }

  if(feature.is_fmin_partial == "True") {
	  width -= sz;
	  if(feature.strand == 1 && bdrLft)
		  extra += 'border-left-style:double; border-left-width: '+sz+'px;';
	  else if(feature.strand == -1 && bdrRgt)
		  extra += 'border-right-style:double; border-right-width: '+sz+'px;';
	  else
		  width += sz;
  }

  var col = getColourProperty(feature);
  if(col != '') {
	  extra += 'background-color:rgb('+col+');';
  }
  
  featureStr = featureStr + 
	'<div id='+feature.uniqueName+' class="'+className+'" style="width:'+width+'px; '+pos+';'+extra+'"></div>';
  return featureStr;
}

function drawFeatureConnections(fDisplay, lastExon, exon, lastYpos, ypos, colour, basePerPixel) {
	if(fDisplay.minimumDisplay)
		return;
	
	var exonL,exonR;
	
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
	
	var lpos = margin+((exonL.fmax - fDisplay.leftBase + 1)/basePerPixel) + 1;
	if(lpos > displayWidth) {
	  return;
	}
	var rpos = margin+((exonR.fmin - fDisplay.leftBase + 1 )/basePerPixel) - 1;
	var mid  = lpos+(rpos-lpos)/2;
	
	var ymid = ypos-4;
	if(ypos > lastYpos) {
	  ymid = lastYpos-4;
	}
	var Xpts = new Array(lpos, mid, rpos) ;
	var Ypts = new Array(lastYpos+4, ymid, ypos+4);
	
	$("#featureDisplay"+fDisplay.index).drawPolyline(Xpts,Ypts, {color: colour, stroke:'1'});
}

function drawArrow(fDisplay, exon, ypos, basePerPixel) {
	if(fDisplay.minimumDisplay)
		return;
	
	var Xpts, Ypts;
	
	var flh2 = fDisplay.frameLnHgt/2;
	if(exon.strand == 1) {
	  var end = margin+((exon.fmax - fDisplay.leftBase + 1)/basePerPixel);
	  if(end > displayWidth) {
		  return;
	  }
	  Xpts = new Array(end, end+flh2, end) ;
	} else {
	  var start = margin+((exon.fmin - fDisplay.leftBase + 1)/basePerPixel);
	  if(start > displayWidth) {
		  return;
	  }
	  Xpts = new Array(start, start-flh2, start);
	}
	Ypts = new Array(ypos, ypos+flh2, ypos+fDisplay.frameLnHgt);

	$("#featureDisplay"+fDisplay.index).drawPolyline(Xpts,Ypts, {color:'#020202', stroke:'1'});
}


function drawTicks(fDisplay) {
	baseInterval = (fDisplay.basesDisplayWidth/displayWidth)*screenInterval;
	var basePerPixel  = baseInterval/screenInterval;
	if(baseInterval < 20) {
		baseInterval = 20;
	}
	var nticks = fDisplay.basesDisplayWidth/baseInterval;

	var baseRemainder = (fDisplay.leftBase-1) % baseInterval;
	var start = Math.round(Math.floor((fDisplay.leftBase-1)/baseInterval)*baseInterval);
	
	var xScreen = margin-(1/basePerPixel);

	if(start < 0) {
	  xScreen += (-fDisplay.leftBase/basePerPixel);
	  start = 1;
	} else if(baseRemainder > 0) {
	  xScreen -= ((fDisplay.leftBase-start-1)/basePerPixel);
	}
	
	var thisScreenInterval = baseInterval/basePerPixel;
	$('#ticks'+fDisplay.index).html('');
	
	var yp = bwdStrandYpos(fDisplay, false)-fDisplay.frameLnHgt-14;
	for(var i=1; i< nticks+1; i++) {
		xScreen+=thisScreenInterval;
		if(xScreen >= displayWidth) {
			break;
		} else if(xScreen < margin) {
			continue;
		}
		var pos = yp+"px "+xScreen+"px";
		var thisTick = 'tick'+fDisplay.index+i;

		var thisStart = Math.round(i*baseInterval)+(start);
		if(thisStart >= 0 && (fDisplay.firstTime || thisStart <= fDisplay.sequenceLength)) {
			$('#ticks'+fDisplay.index).append('<div class="tickClass" id='+thisTick+'></div>');
			setTickCSS(pos, thisStart, '#'+thisTick);
		}
	}
}

function setTickCSS(offset, number, selector) {
	$(selector).css('margin', offset);
	$(selector).html(number);
}


function getOrganismList(fDisplay) {
    if (fDisplay.showOrganismsList) {
        var serviceName = '/organisms/list.json';
    	handleAjaxCalling(serviceName, aOrganism,
    			{ }, fDisplay, {});
    }
	
}

function setTranslation(fDisplay, organism_id) {
	var serviceName = '/organisms/getByID.json';
	handleAjaxCalling(serviceName, function(fDisplay, organisms, options) { 
        
		for(var i=0; i<organisms.length; i++) {
			if(organism_id == organisms[i].organism_id)
				setTranslationTable(organisms[i].translation_table);
		}
	    }, { ID : organism_id }, fDisplay, {  });
}

function getSrcFeatureList(organism_id, fDisplay, translation_table){
	$('#srcFeatureSelector').html('');
	//var jsonUrl = webService[serviceType]+'/regions/inorganism.json?organism=org:'+organism_id;
	//debugLog(jsonUrl);
	
	var serviceName = '/regions/inorganism.json';
	$('body').css('cursor','wait');
	handleAjaxCalling(serviceName, aSrcFeature,
			{ organism:'org:'+organism_id }, fDisplay, { translation_table:translation_table });
}

function handleFeatureClick(fDisplay, event, featureSelected) {
	//debugLog(arguments);

	if (! event.shiftKey ) {
		fDisplay.highlightFeatures = [];
		deselectAllFeatures(fDisplay)
	}

	fDisplay.highlightFeatures.push(featureSelected);
	selectFeature(featureSelected, fDisplay);
	
	fDisplay.observers.notify('select', featureSelected, fDisplay);

	//showFeature(featureSelected, fDisplay);
}


function hideSelectedFeatures(fDisplay) {
	fDisplay.hideFeatures = getSelectedFeatureIds();
	drawAll(fDisplay);
}

function showAminoAcidsOfSelectedFeatures(fDisplay) {
    var selectedFeatures = getSelectedFeatureIds();
    if(selectedFeatures.length == 0)
            alert("No features selected.");

    for(var i=0; i<selectedFeatures.length; i++) {
    	var name = selectedFeatures[i];
        if(name.indexOf(":exon") > -1) {
        	var serviceName = '/features/hierarchy.json';
            handleAjaxCalling(serviceName, function (fDisplay, features, options) {
            	var exonsIds = new Array();

            	for(var i=0; i<features.length; i++ ) {
            		var nkids = features[i].child.length;
                    for(var j=0; j<nkids; j++ ) {
                    	var kid = features[i].child[j];
                        var exons = getFeatureExons(kid);
                        for(var k=0; k<exons.length; k++) {
                        	if(options.name == exons[k].uniqueName) {
                        		for(var l=0; l<exons.length; l++)
                        			exonsIds.push(exons[l].uniqueName);
                            }
                        }
                    }
                }
                displaySequence(exonsIds, fDisplay, false);
            },
            { features:name, root_on_genes:true }, fDisplay, { name:name });

        } else {
        	displaySequence([ name ], fDisplay, false);
        }
    }
}

function showBasesOfSelectedFeatures(fDisplay) {
    var selectedFeatures = getSelectedFeatureIds();
    if(selectedFeatures.length == 0)
            alert("No features selected.");

    for(var i=0; i<selectedFeatures.length; i++) {
    	var name = selectedFeatures[i];
    	if(name.indexOf(":exon") > -1) {
        	var serviceName = '/features/hierarchy.json';
            handleAjaxCalling(serviceName, function (fDisplay, features, options) {
            	var exonsIds = new Array();

            	for(var i=0; i<features.length; i++ ) {
            		var nkids = features[i].child.length;
            		for(var j=0; j<nkids; j++ ) {
            			var kid = features[i].child[j];
            			var exons = getFeatureExons(kid);
            			for(var k=0; k<exons.length; k++) {
            				if(options.name == exons[k].uniqueName) {
            					for(var l=0; l<exons.length; l++)
            						exonsIds.push(exons[l].uniqueName);
            				}
            			}
            		}
            	}
            	displaySequence(exonsIds, fDisplay, true);
            },
            { features:name, root_on_genes:true }, fDisplay, { name:name });

    	} else {
    		displaySequence([ name ], fDisplay, true);
    	}
    }
}

function centerOnFeatureByDisplayIndex(index, featureSelected) {
	centerOnFeature(featureDisplayObjs[index-1], undefined, featureSelected, undefined);
}

function centerOnFeature(fDisplay, event, featureSelected, region) {	
	//debugLog(arguments);
	if(event != undefined)
		handleFeatureClick(fDisplay, event, featureSelected);
	
	var inputObj = { features:featureSelected };
	if(region != undefined) {
		inputObj.region = region;
	}
	
	var serviceName = '/features/coordinates.json';
	handleAjaxCalling(serviceName, function (fDisplay, features, options) {
			var coords = features[0];
			if(coords == undefined) {
				alert(featureSelected+" not found.");
				return;
			}
			var base = coords.coordinates[0].fmin-Math.round(fDisplay.basesDisplayWidth/2);
			
			if(base < 1)
				base = 1;
			
			fDisplay.srcFeature = coords.coordinates[0].region;
			fDisplay.leftBase = base;
			fDisplay.firstTime = true;
			returnedSequence = undefined;
			fDisplay.highlightFeatures.push(featureSelected);
			document.title = fDisplay.srcFeature;
			drawAll(fDisplay);
	}, inputObj, fDisplay, {  });
}

//
// AJAX functions
//

var aShowProperties = function showProperties(fDisplay, features, options) {
    
    
    var featureSelected = options.featureSelected; 
    var featureStr = "&features="+options.featureSelected;
    var name = options.featureSelected;
    var primary_name;
	var featurePropertyList = new Array();
	featurePropertyList.push(options.featureSelected);

	for(var i=0; i<features.length; i++ ) {
		var feature = features[i];
		var nkids = feature.child.length;

		if(feature.name)
		  primary_name = feature.name;
	    
		if(nkids > 0) {
			for(var j=0; j<nkids; j++ ) { 
				var kid = feature.child[j];
				var exons = getFeatureExons(kid);
				var nexons = exons.length;
				
				for(var k=0; k<nexons; k++) {
					var exon = exons[k];
					if(exon.uniqueName == featureSelected ||
					   feature.uniqueName == featureSelected) {

						if(nkids == 1) {
							name = feature.uniqueName;
						} else {
							name = kid.uniqueName;
						}
						featurePropertyList.push(feature.uniqueName);
						featureStr += "&features="+feature.uniqueName;
						featureStr += "&features="+kid.uniqueName;
						var polypep = getFeaturePeptide(kid);
						if(polypep != -1) {
							featurePropertyList.push(polypep.uniqueName);
							featureStr += "&features="+polypep.uniqueName;
						}
						break;
					}
				}
			}
		}
	}

	$("div#properties").html(
			"<div id='DISP"+featureSelected+"'>"+
				"<div id='DISP_SYN"+featureSelected+"'></div>"+
				"<div id='DISP_PRODUCT"+featureSelected+"'></div>"+
				"<div id='DISP_PROP"+featureSelected+"'></div>"+
				"<div id='DISP_PUB"+featureSelected+"'></div>"+
				"<div id='DISP_DBX"+featureSelected+"'></div>"+
				"<div id='DISP_CV"+featureSelected+"'></div>"+
				"<div id='DISP_ORTHO"+featureSelected+"'></div>"+
			"</div>");
	handleAjaxCalling('/features/synonyms.json?', aFeatureSynonyms,
			featureStr, -1, {featureSelected: featureSelected});
	
	handleAjaxCalling('/features/properties.json?', aFeatureProps,
		'features='+featurePropertyList, -1, { featureSelected: featureSelected});
	
	handleAjaxCalling('/features/pubs.json?', aFeaturePubs,
			featureStr, -1, {featureSelected: featureSelected});
	
	handleAjaxCalling('/features/dbxrefs.json?', aFeatureDbXRefs,
			featureStr, -1, {featureSelected: featureSelected});

	handleAjaxCalling('/features/terms.json?', aFeatureCvTerms,
			featureStr, -1, {featureSelected: featureSelected});
	
	handleAjaxCalling('/features/orthologues.json?', aOrthologues,
			featureStr, fDisplay, {featureSelected: featureSelected});

    if(primary_name) {
		name += " :: "+primary_name;
    }
    
    $("div#DISP"+escapeId(featureSelected)).dialog({ height: 450 ,
		width:550, position: 'top', title:name, show:'fast',  close: function(event, ui) { $(this).remove(); } });
}

var aSrcFeature = function ajaxGetSrcFeatures(fDisplay, srcFeatures, options) {
	$('#srcFeatureSelector').html('<select id="srcFeatureList"></select>');
	$('#srcFeatureList').append('<option value="Sequence:">Sequence:</option>');
	
	
	for(var j=0; j<srcFeatures.length; j++) {
		var feat = srcFeatures[j];
		if(feat)
		  $('#srcFeatureList').append(
				  '<option value="'+feat.uniqueName+'">'+feat.uniqueName+'</option>');
	}
	
	positionLists();
	
	$('#srcFeatureSelector').change(function(event){
		fDisplay.srcFeature = $('#srcFeatureList option:selected')[0].value;
		fDisplay.firstTime = true;
		returnedSequence = undefined;
		
		// remove bam display
		if(showBam) {
			removeBamDisplay(fDisplay);
		}
		drawAll(fDisplay);
		document.title = fDisplay.srcFeature;
	});
	$('body').css('cursor','default');
};

var aOrganism = function ajaxGetOrganisms(fDisplay, organisms, options) {
    
	$('#organismSelector').html('<select id="organismList"></select>');
	$('#organismList').append('<option value="Organism:">Organism:</option>');
	for(var i=0; i<organisms.length; i++) {
		var organism = organisms[i];
		if(organism)
		  $('#organismList').append(
				  '<option value="'+organism.ID+'">'+organism.common_name+'</option>');
	}

	positionLists();
	
	$('#organismSelector').change(function(event){
		var organism_id = $('#organismList option:selected')[0].value;
	
		var translation_table = 1;
		for(var j=0; j<organisms.length; j++) {
			debugLog(j+" "+organism_id+" "+organisms[j].ID );
			if(organisms[j].ID == organism_id)
				translation_table = organisms[j].translation_table;
		}
		
		debugLog("Translation table = "+translation_table);
		getSrcFeatureList(organism_id, fDisplay, translation_table);
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

var aFeatureCvTerms = function ajaxGetFeatureCvTerms(fDisplay, features, options) {
	showFeatureCvTerm(features, options.featureSelected);
};

var aOrthologues = function ajaxGetOrthologues(fDisplay, orthologues, options) {
    
	var midDisplay = fDisplay.basesDisplayWidth/2;
	
	if(!orthologues || orthologues.length == 0)
		return;
	
	var featureSelected = options.featureSelected;
	var clusters = new Array();
	var count = 0;
	
	for(var i=0; i<orthologues.length; i++) {	
		var featureOrthologues = orthologues[i].orthologues;
		for(var j=0; j<featureOrthologues.length; j++) {
			   
		   if(featureOrthologues[j].orthologyType == 'polypeptide') {
			   
			 if(count == 0)
				$("div#DISP_ORTHO"+escapeId(featureSelected)).append(
				   "<br /><strong>Orthologues : </strong><br />");
				
			 count++;
		     var featureOrthologue = featureOrthologues[j].uniqueName;
		     $("div#DISP_ORTHO"+escapeId(featureSelected)).append(
				   '<a href="javascript:void(0)" onclick="openMe(\''+
				   featureOrthologue+'\','+midDisplay+');">'+
				   featureOrthologue+"</a> ("+featureOrthologues[j].products[0]+")<br />");
		   } else {
			 clusters.push(featureOrthologues[j].uniqueName);
		   }
		}
	}
	
	var serviceName = '/features/clusters.json?';
	handleAjaxCalling(serviceName, aCluster,
		'features='+clusters, 
		fDisplay, {featureSelected: featureSelected});
};

var aCluster = function ajaxGetClusters(fDisplay, clusters, options) {
    
	var midDisplay = fDisplay.basesDisplayWidth/2;
	
	if(!clusters || clusters.length == 0)
		return;
	
	debugLog(clusters);
	var featureSelected = options.featureSelected;
	$("div#DISP_ORTHO"+escapeId(featureSelected)).append(
			   "<br /><strong>Clusters : </strong><br />");
	for(var i=0; i<clusters.length; i++) {	
		var featureCluster = clusters[i].orthologues;
		for(var j=0; j<featureCluster.length; j++) {
			   
		   if(featureCluster[j].type.name == 'polypeptide') {
		     var subject = featureCluster[j].uniqueName;
		     $("div#DISP_ORTHO"+escapeId(featureSelected)).append(
				   '<a href="javascript:void(0)" onclick="openMe(\''+
				   subject+'\','+midDisplay+');">'+
				   subject+"</a><br />");
		   }
		}
	}
}

function openMe(gene, midDisplay) {
    handleAjaxCalling('/features/coordinates.json?',
                    function(featureDisplay, returned, options) {
                  var src  = returned[0].coordinates[0].region;
                  var base = Math.round(parseInt(returned[0].coordinates[0].fmin)-midDisplay);

                  debugLog(base + " " + midDisplay + "  "+ returned[0].coordinates[0].fmin);
                  window.open('?&src='+src+'&base='+base+'&bases='+midDisplay*2);
                },
                    { features: gene}, {}, {});
}

var propertyFilter = [ 'fasta_file', 'blastp_file', 'blastp+go_file', 'private', 'pepstats_file' ];
var aFeatureProps = function ajaxGetFeatureProps(fDisplay, featProps, options) {
	
	var featureSelected = options.featureSelected;
    
	if(!featProps || featProps.length == 0)
		return;
	
	$("div#DISP_PROP"+escapeId(featureSelected)).append(
	   "<strong>Notes : </strong><br />");
	
	var setColour = false;
    for(var i=0; i<featProps.length; i++) {	
		var featureprops = featProps[i].properties;
		for(var j=0; j<featureprops.length; j++) {
			if(!containsString(propertyFilter, featureprops[j].name)) {
				if( featureprops[j].name == 'colour' ) {
					if(setColour)
						continue;
					setColour = true;
				}
				$("div#DISP_PROP"+escapeId(featureSelected)).append(
						featureprops[j].name+"="+featureprops[j].value+"<br />");
			}
		}
	}
    $("div#DISP_PROP"+escapeId(featureSelected)).append("<br />");
};

var aFeatureSynonyms = function ajaxGetFeatureProps(fDisplay, featSyns, options) {
	var featureSelected = options.featureSelected;
    
	if(!featSyns || featSyns.length == 0)
		return;
	
	$("div#DISP_SYN"+escapeId(featureSelected)).append(
			   "<strong>Synonyms : </strong><br />");
	
    for(var i=0; i<featSyns.length; i++) {	
		var featuresyns= featSyns[i].synonyms;
		for(var j=0; j<featuresyns.length; j++) {
			$("div#DISP_SYN"+escapeId(featureSelected)).append(
					featuresyns[j].synonymtype+":"+featuresyns[j].synonym);
			if(featuresyns[j].is_current == 'False')
				$("div#DISP_SYN"+escapeId(featureSelected)).append(' (not current); ');
			else
				$("div#DISP_SYN"+escapeId(featureSelected)).append('; ');
		}
	}
    
	$("div#DISP_SYN"+escapeId(featureSelected)).append("<br /><br />");
};

var aFeaturePubs = function ajaxGetFeaturePubs(fDisplay, featPubs, options) {
	var featureSelected = options.featureSelected;
    
	if(!featPubs || featPubs.length == 0)
		return;
	
	$("div#DISP_PUB"+escapeId(featureSelected)).append(
			   "<strong>Literature : </strong><br />");
	
    for(var i=0; i<featPubs.length; i++) {	
		var featurepubs = featPubs[i].pubs;
		showFeaturePubs(featurepubs, featureSelected, "DISP_PUB");
	}
    
	$("div#DISP_PUB"+escapeId(featureSelected)).append("<br /><br />");
};


var aFeatureDbXRefs = function ajaxGetFeatureDbXRefs(fDisplay, featDbXRefs, options) {
	var featureSelected = options.featureSelected;
    
	if(!featDbXRefs || featDbXRefs.length == 0)
		return;
	
	$("div#DISP_DBX"+escapeId(featureSelected)).append(
			   "<strong>DbXRefs : </strong><br />");
	
    for(var i=0; i<featDbXRefs.length; i++) {	
		showFeatureDbXRefs(featDbXRefs[i].dbxrefs, featureSelected, "DISP_DBX");
	}
    
	$("div#DISP_DBX"+escapeId(featureSelected)).append("<br /><br />");
};

function containsString(anArray, aStr) {
	for(var i=0; i<anArray.length; i++) {
		if(aStr == anArray[i])
			return true;
	}
	return false;
}

var aFeaturePropColours = function ajaxGetFeaturePropColours(fDisplay, featProps, options) {
	
	for(var i=0; i<featProps.length; i++) {	
		var featureprops = featProps[i].properties;
		for(var j=0; j<featureprops.length; j++) {

			//if(featureprops[j].name == 'comment')
			//	$('#'+escapeId(featProps[i].feature+":PROPS")).append(
			//			featureprops[j].name+"="+featureprops[j].value+";<br />");

			if(featureprops[j].name == 'colour') {
				var featureId = escapeId(featProps[i].uniqueName);
				$('#'+featureId).css('background-color', 'rgb('+colour[featureprops[j].value]+')' );
				// colour feature list
				$('#'+escapeId(featProps[i].uniqueName+':LIST')).children(":first").css('background-color', 'rgb('+colour[featureprops[j].value]+')' );
			}
		}
	}
};

var aFeatureFlatten = function ajaxGetFeaturesFlatten(fDisplay, features, options) {
    
	var nfeatures = features.length;

	debugLog("No. of features "+ nfeatures+"  "+fDisplay.leftBase+".."+
			(parseInt(fDisplay.leftBase)+parseInt(fDisplay.basesDisplayWidth)));

	baseInterval = (fDisplay.basesDisplayWidth/displayWidth)*screenInterval;
	var basePerPixel  = baseInterval/screenInterval;
	  
	var ypos;
	var featureStr = '';
	var featureToColourList = new Array();
	var lastExonParent;
	var nexon = 0;

	var exonMap = new Object();
	var exonParent = new Array();
	
	for(var i=0; i<nfeatures; i++ ) {
	  var feature = features[i];

	  if(feature.isObsolete == true) {
		  continue;
	  }
	  
	  if(feature.type.name == "exon" || feature.type.name == "pseudogenic_exon" || feature.type.name == "CDS") {
		  
		  if(!feature.properties) {
			  featureToColourList.push(feature.uniqueName);
		  }

		  var exons = exonMap[feature.parent];
		  if(exons == undefined) {
			  exons = new Array();
			  if(!feature.parent) { // when no parent is defined in GFF
				  feature.parent = feature.uniqueName
			  }
			  exonParent.push(feature.parent);
			  exonMap[feature.parent] = exons;
		  }
		  if(feature.strand == 1) {
		     exons.push(feature);
		  } else {
			  exons.unshift(feature);
		  }
		  continue;
	  }

	  if(fDisplay.oneLinePerEntry) {
		ypos = getFeatureTrackPosition(fDisplay, feature, options.track);
	  } else {
	    if(feature.strand == 1) {
		  ypos = fwdStrandYpos(fDisplay, false)-fDisplay.frameLnHgt;
	    }
	    else {
		  ypos = bwdStrandYpos(fDisplay, false)-fDisplay.frameLnHgt;
	    }
	  }
	  
	  var className = "feat";
	  if(feature.type.name == "gene") {
		  className = "featGene";
	  } else if(feature.type.name == "pseudogene") {
		  className = "featPseudo";
	  }
	  
	  if(!isHiddenFeature(feature.uniqueName, fDisplay)) {
		  featureStr = drawFeature(fDisplay.leftBase, feature, featureStr, ypos, className, basePerPixel);
	  }
    }

	for(var i=0; i<exonParent.length; i++) {
		featureStr = 
			drawExons(fDisplay, exonMap[exonParent[i]], featureStr, basePerPixel, options.track);
	}
	
	$('#features'+fDisplay.index+'_'+options.track).html(featureStr);

	if($('.feat').height() != fDisplay.frameLnHgt-2 || (options != undefined && options.append) ) {
		var cssObj = {
			'height':fDisplay.frameLnHgt-2+'px',
			'line-height' : fDisplay.frameLnHgt-2+'px'
		};
		$('.feat, .featCDS, .featPseudo, .featGene, .featGreen').css(cssObj);
	}
	
	if(options != undefined && !options.minDisplay) {
		if(isZoomedIn(fDisplay)) {
			$('.feat, .featCDS, .featPseudo, .featGene, .featGreen').css('opacity','0.3');
		} else {
			$('.feat, .featCDS, .featPseudo, .featGene, .featGreen').css('opacity','0.9');
		}

		if( count < 2 && showFeatureList ) {
			if(options.append) {
				setTimeout(function() { setupFeatureList(features, exonMap, exonParent, fDisplay, options.append); }, 100);
			} else {
				setupFeatureList(features, exonMap, exonParent, fDisplay, options.append);
			}
		}
		
		if( featureToColourList.length > 0 && 
			featureToColourList.length < 500 ) {
			
			if(!options.append) {
				var serviceName = '/features/properties.json?';
				handleAjaxCalling(serviceName, aFeaturePropColours,
					'features='+featureToColourList, 
					fDisplay.leftBase, {});
			}
		}
	}
	
	if(fDisplay.highlightFeatures.length > 0) {
		for(var i=0; i<fDisplay.highlightFeatures.length; i++)
			selectFeature(fDisplay.highlightFeatures[i], fDisplay);
		//highlightFeatures = [];
	}
	
	if(options != undefined && options.startTime) {
	  var currentTime = new Date().getTime() - options.startTime;
	  
	  if(scrollTimeoutTime < currentTime-50 || scrollTimeoutTime > currentTime+50) {
		  scrollTimeoutTime = currentTime;	// scroll
		  ztimeoutTime = currentTime*2;  		// zoom
		  debugLog("ADJUST SCROLL TIMEOUT :: "+currentTime+"  ::  "+options.startTime+" zoom time="+ztimeoutTime);
	  }
	}
	
	return;
};

function drawExons(fDisplay, exons, featureStr, basePerPixel, trackName) {
	var sequenceLength = fDisplay.sequenceLength;
	if(exons != undefined) {
	
	  if(isHiddenFeature(exons[0].feature, fDisplay)) {
		  return featureStr;
	  }
	  
	  var lastExon = 0;
	  var lastYpos = -1;
	  var colour = '#666666';
	  var ypos = 0;
	  
	  // search the exons for colour property in case
	  // some exons do not have it set
	  var colProp = '';
	  for(var k=0; k<exons.length; k++) {
	    var col = getColourProperty(exons[k])
	    if(col != '') {
	      colProp = col;
	      break;
	    }
	  }
	  
	  if(colProp != '') {
	    for(var k=0; k<exons.length; k++) {
		  setColourProperty(exons[k], colProp)
	    }
	  }

	  for(var k=0; k<exons.length; k++) {
	    var exon = exons[k];

		var phase = 0;
		if ("phase" in exon) {
		    if(exon.phase != ".") {
    		   phase = exon.phase;
    	    }
		}

		if(fDisplay.oneLinePerEntry) {
			ypos = getFeatureTrackPosition(fDisplay, exon, trackName);
		} else {
			if(exon.strand == 1) {
				var frame = ( (exon.fmin+1)-1+getSegmentFrameShift(exons, k, phase) ) % 3;
				ypos = fDisplay.marginTop+((fDisplay.frameLnHgt*2)*frame);
			} else {
				var frame = 3 -
		           ((sequenceLength-exon.fmax+1)-1+getSegmentFrameShift(exons, k, phase)) % 3;
				ypos = fDisplay.marginTop+(fDisplay.frameLnHgt*9)+
				    		((fDisplay.frameLnHgt*2)*frame);
			}
		}

		var classType;
		if(exon.type == 'pseudogenic_exon')
			classType = "featPseudo";
		else
			classType = "featCDS";
		
		featureStr = drawFeature(fDisplay.leftBase, exon, featureStr, ypos, classType, basePerPixel) ;
		var canvasTop = $('#featureDisplay'+fDisplay.index).css('margin-top').replace("px", "");
		if(lastYpos > -1) {
		   drawFeatureConnections(fDisplay, lastExon, exon, 
		    	  lastYpos-canvasTop, ypos-canvasTop, colour, basePerPixel);
		}
		if(k == exons.length-1) {
		   drawArrow(fDisplay, exon, ypos-canvasTop, basePerPixel);
		}
  		lastExon = exon;
  		lastYpos = ypos;
	  }
	}
	return featureStr;
}

function getFeatureTrackPosition(fDisplay, feature, trackName) {
	var index = jQuery.inArray( trackName, fDisplay.tracks );
	var ntracks = fDisplay.tracks.length;
	
	if(feature.strand == 1) {
		return fDisplay.marginTop+((fDisplay.frameLnHgt*2)*(ntracks-index-1));
	} else {
		return fDisplay.marginTop+(fDisplay.frameLnHgt*((2*(ntracks+index+1))+3));
	}
}

var aComparison = function ajaxGetComparisons(featureDisplay, blastFeatures, options) {
	var cmp = options.comparison;
	
	var fDisplay1 = cmp.featureDisplay1;
	var fDisplay2 = cmp.featureDisplay2;
	var canvasTop = fDisplay1.marginTop+(fDisplay1.frameLnHgt*16.9);
	var canvasBtm = fDisplay2.marginTop;
	
	var baseInterval1 = (fDisplay1.basesDisplayWidth/displayWidth)*screenInterval;
	var basePerPixel1 = baseInterval1/screenInterval;
	
	var baseInterval2 = (fDisplay2.basesDisplayWidth/displayWidth)*screenInterval;
	var basePerPixel2 = baseInterval2/screenInterval;
	
	var canvasHgt = canvasBtm-canvasTop;
	$('#comp'+cmp.index).html('');
	// adjust comparison canvas
	var cssObj = {
			'margin-top': canvasTop+'px',
			'height': canvasHgt+'px',
			'width': displayWidth+'px'
	};
	$('#comp'+cmp.index).css(cssObj);
	
	if(options.clearSelections) {
		cmp.selectedMatches = [];
	}
	
	for(var i=0; i<blastFeatures.length; i++ ) {
		var match = blastFeatures[i];
		var fmin1 = parseInt(match.fmin1)+1;
		var fmax1 = match.fmax1;
		var fmin2 = parseInt(match.fmin2)+1;
		var fmax2 = match.fmax2;

		var lpos1; 
		var rpos1;
		if(match.f1strand == "1") {
		  lpos1 = margin+((fmin1 - fDisplay1.leftBase)/basePerPixel1);
		  rpos1 = margin+((fmax1 - fDisplay1.leftBase)/basePerPixel1);
		} else {
		  lpos1 = margin+((fmax1 - fDisplay1.leftBase)/basePerPixel1);
		  rpos1 = margin+((fmin1 - fDisplay1.leftBase)/basePerPixel1);
		}

		var lpos2;
		var rpos2;
		if(match.f2strand == "1") {
		  lpos2 = margin+((fmin2 - fDisplay2.leftBase)/basePerPixel2);
		  rpos2 = margin+((fmax2 - fDisplay2.leftBase)/basePerPixel2);
		} else {
		  lpos2 = margin+((fmax2 - fDisplay2.leftBase)/basePerPixel2);
		  rpos2 = margin+((fmin2 - fDisplay2.leftBase)/basePerPixel2);
		}
		
		var Xpts = new Array(lpos1, rpos1, rpos2, lpos2) ;
		var Ypts = new Array(0, 0, canvasBtm-canvasTop, canvasBtm-canvasTop);
		
		var clicked = false;
		if(options.clickX != undefined) {
			var match_left_x =
		        lpos1 + ((lpos2 - lpos1) * ((options.clickY-canvasTop-margin) / canvasHgt));

		    var match_right_x =
		    	rpos1 + ((rpos2 - rpos1) * ((options.clickY-canvasTop-margin) / canvasHgt));

			var clickX = options.clickX - margin;
		    if(clickX >= match_left_x - 1 &&
		       clickX <= match_right_x + 1 ||
		       clickX <= match_left_x + 1 &&
		       clickX >= match_right_x - 1) {
		    	clicked = true;
		    	cmp.selectedMatches.push(match);
		    	//debugLog('MATCH '+fmin1+'..'+fmax1+'  '+fmin2+'..'+fmax2+' '+match.score);
		    }
		} 

		if(!clicked && cmp.selectedMatches != undefined) {
			for(var j=0;j<cmp.selectedMatches.length ; j++) {
				if(cmp.selectedMatches[j].match == match.match) {
					clicked = true;
				}
			}
		}

		var colour;
		if(clicked) {
			colour = '#FFFF00';
		} else if( (match.f1strand == "-1" && match.f2strand == "-1") ||
			       (match.f1strand == "1"  && match.f2strand == "1") ) {
			colour = '#FF0000';
		} else {
			colour = '#0000FF';
		}
		$("#comp"+cmp.index).fillPolygon(Xpts,Ypts, {color: colour, stroke:'1'});
		/*colour = '#000000';
		if(rpos2-lpos2 > 1 && rpos1-lpos1 > 1) {
			$("#comp"+cmp.index).drawLine(lpos1, 0, lpos2, canvasBtm-canvasTop, {color: colour, stroke:'0.1'});
			$("#comp"+cmp.index).drawLine(rpos1, 0, rpos2, canvasBtm-canvasTop, {color: colour, stroke:'0.1'});
		}*/
	}
}

function isZoomedIn(fDisplay) {
	var seqLen = fDisplay.sequenceLength*fDisplay.zoomMaxRatio;
	
	if($('#slider_vertical_container'+fDisplay.index).slider('option', 'value') > seqLen-160) {
		return true;
	} 
	return false;
}

function displaySequence(names, fDisplay, asDNA) {

    handleAjaxCalling('/features/coordinates.json?',
                    function (featureDisplay, returned, options) {
    	var coords = [];
        for(var i=0; i<returned.length; i++)
           coords.push(returned[i].coordinates[0]);

        coords.sort( function sortfunction(a, b){
        	if(a.fmin > b.fmin)
        		return 1;
            if(a.fmin < b.fmin)
                return -1;
            return 0;
        } );

        var start = parseInt(coords[0].fmin);
        var end = parseInt(coords[coords.length-1].fmax);
        var name = options.names[0];

        for(var i=1; i<coords.length; i++) {
           if(options.names[i].indexOf("exon") > 0) {
             name += "-"+options.names[i].match(/\d+$/);
           } else {
                 name += "-"+options.names[i];
           }
        }

        var strand = returned[0].coordinates[0].strand;
        var serviceName = '/regions/sequence.json?';
        handleAjaxCalling(serviceName, aDisplaySequence,
                                    { region:featureDisplay.srcFeature, start:start, end:end },
                                    featureDisplay, { name:name, strand:strand, start:start+1, coords:coords, suff:options.names[0], asDNA:options.asDNA });
     }, { features: names }, fDisplay, { names:names, asDNA:asDNA });

}

var aDisplaySequence = function ajaxGetSequence2(fDisplay, returned, options) {
    var sequence = returned[0].dna.toUpperCase();

    var tag = "DISPAA";
    if(options.asDNA) {
            tag = "DISPDNA";
    }

    if($('[id*="'+tag+options.suff+'"]').get(0)) {
            // already displaying
            return;
    }

    debugLog("No. SEQUENCES "+options.coords.length);
    var coords = options.coords;
    if(coords.length > 1) {
    	var newSequence = "";
    	var start = options.start;
    	for(var i=0; i<coords.length; i++) {
            var thisStart = parseInt(coords[i].fmin)+1-start;
            var thisEnd = parseInt(coords[i].fmax)+1-start;
            newSequence += sequence.substring(thisStart, thisEnd);
    	}
    	sequence = newSequence;
    }

    if(options.strand == "-1") {
            sequence = reverseComplement(sequence);
    }

    if(!options.asDNA) {
            var phase = 0;
            var coordinate = coords[0];
            if ("phase" in coordinate) {
                if(coordinate.phase != ".") {
               phase = coordinate.phase;
        }
            }
            sequence = getTranslation(sequence, phase);
    }

    var name = tag+escapeId(options.name);
    $("div#properties").html("<div id='"+tag+options.name+"'></div>");
    for(var i=0; i<sequence.length; i+=59)
      $("#"+name).append(sequence.substring(i, i+59)+"<br />");

$("div#"+name).dialog({ height: 400 ,
            width:480, position: 'top',
            title:options.name,
            close: function(event, ui) { $("div#"+name).remove(); }});
}

var aSequence = function ajaxGetSequence(fDisplay, returned, options) {
	//sequence = returned.response.sequence[0].dna.replace(/\r|\n|\r\n/g,"").toUpperCase();
	//console.time('draw all');
	var seq = returned[0];
	fDisplay.sequenceLength = seq.length;
	var start = seq.start+1;
	
	// note substring used when zoomed in
	var sequence = seq.dna.substring(fDisplay.leftBase-start).toUpperCase();
	
	fDisplay.sequence = sequence;
	fDisplay.organism_id = seq.organism_id;

	baseInterval = (fDisplay.basesDisplayWidth/displayWidth)*screenInterval;
	var basePerPixel  = baseInterval/screenInterval;
	
	debugLog("getSequence() sequence length = "+fDisplay.sequenceLength);
	if((fDisplay.sequenceLength-fDisplay.sequenceLength) != 0) {
      $('#slider'+fDisplay.index).slider('option', 'max', seqLen-100);
	}

    //console.time('draw stop codons');
    $('#stop_codons'+fDisplay.index).html('');
    if (fDisplay.firstTime) {
    	$("#slider_vertical_container"+fDisplay.index).slider('option', 'max', ((fDisplay.sequenceLength*fDisplay.zoomMaxRatio)-140));
    	$("#slider_vertical_container"+fDisplay.index).slider('option', 'value', ((fDisplay.sequenceLength*fDisplay.zoomMaxRatio)-fDisplay.basesDisplayWidth));
    }
    
	if(isZoomedIn(fDisplay)) {
	  drawCodons(fDisplay, basePerPixel);
	  drawAminoAcids(fDisplay, basePerPixel);
	  returnedSequence = returned;
	} else if(fDisplay.showStopCodons && !fDisplay.oneLinePerEntry) {
	  $('#sequence'+fDisplay.index).html('');
	  $('#translation'+fDisplay.index).html('');
      drawStopCodons(fDisplay, basePerPixel);
	}
    //console.timeEnd('draw stop codons');  

    if (fDisplay.firstTime) {
    	$('#slider'+fDisplay.index).slider('option', 'max', fDisplay.sequenceLength-fDisplay.basesDisplayWidth/2);
    	$('#slider'+fDisplay.index).slider('option', 'step', fDisplay.basesDisplayWidth/10);
    	$('#slider'+fDisplay.index).slider('option', 'value', fDisplay.leftBase);
    	fDisplay.firstTime = false;
    	setTranslation(fDisplay, fDisplay.organism_id);
    	setBamAndVcfMenu(fDisplay);
	}

    if(showGC || showAG || showOther) {
    	drawContentGraphs(fDisplay, showAG, showGC, showOther);
    }

    positionFeatureList(fDisplay);
    //console.timeEnd('draw all');
    return;
};

function setBamAndVcfMenu(fDisplay) {
	// if(serviceTypeBam < 0)
	//         return;
	var serviceName = '/sams/listforsequence.json?';
	handleAjaxCalling(serviceName, function (fDisplay, bamFiles, options) {
		$('#bamFiles').html('<a href="#ab">BAM</a>');
		
		var bamStr = '<ul>';
		if(bamFiles == undefined || bamFiles.length == 0)
			bamStr += '<li class="current"><a href="#" id="none">None</a></li>';

		if(bamFiles != undefined) {
			for(var i=0; i<bamFiles.length; i++) {
				bamStr += '<li class="current"><a href="#" name="'+bamFiles[i].fileID+'">'+bamFiles[i].meta+'</a></li>';
			}
		}
		bamStr += '</ul>';
		$('#bamFiles').append(bamStr);
		
		// increase menu width
		$('#bamFiles').find('li').css('width', '20em');
	},
	{ sequence:fDisplay.srcFeature }, fDisplay, { });

	serviceName = '/variants/listforsequence.json?';
	handleAjaxCalling(serviceName, function (fDisplay, vcfFiles, options) {
        $('#vcfFiles').html('<a href="#ab">VCF</a>');
		
		var vcfStr = '<ul>';
		if(vcfFiles == undefined || vcfFiles.length == 0)
			vcfStr += '<li class="current"><a href="#" id="none">None</a></li>';

		if(vcfFiles != undefined) {
			for(var i=0; i<vcfFiles.length; i++) {
				vcfStr += '<li class="current"><a href="#" name="'+vcfFiles[i].fileID+'">'+vcfFiles[i].meta+'</a></li>';
			}
		}
		vcfStr += '</ul>';
		$('#vcfFiles').append(vcfStr);
		
		// increase menu width
		$('#vcfFiles').find('li').css('width', '20em');
	},
	{ sequence:fDisplay.srcFeature }, fDisplay, { });
}



//
//Test code: to test adding extra features and giving them
//a colour
//
function test(start, end, isolate) {

	var jsonUrl  = 'http://www.spatialepidemiology.net/snp/'; 
	var service1 = "getArtemisRegions.php?isolate=" + isolate + "&start=" + start + "&end=" + end; 
	var service2 = "getArtemisFeatures.php?isolate=" + isolate + "&start=" + start + "&end=" + end; 

	// Get features and their locations
	$.ajax({
		  url: jsonUrl+service1,
		  dataType: 'jsonp',
		  success: function(features) {
		
		var trackName = "NEW_TRACK_NAME";
		//var features  = returned1;
		var featureToColourList = new Array();
		for(var i=0; i<features.length; i++ ) {
		  if(features[i].type == "exon")
			  featureToColourList.push(features[i].feature);
		}
		moveTo1(features, trackName, 
				function (featureSelected, featureDisplay) {
	  		alert("Show feature properties for "+featureSelected)});
		
		// Get the feature colours
		$.ajax({
			  url: jsonUrl+service2,
			  data: 'us='+featureToColourList,
			  dataType: 'jsonp',
			  success: function(returned2) {
			moveTo2(returned2);
	  	} } );
	} } );
}

//
//
function addArtemisObserver(o) {
	for(i=0;i<featureDisplayObjs.length; i++) {
		featureDisplayObjs[i].observers.addObserver(o);
	}
}

//
// regions_location - coordinates in JSON format
// features_properties - properties in JSON format
function moveTo1(regions_location, trackName, showPropFn) {
	addFeatures(featureDisplayObjs[0].srcFeature, regions_location, trackName, showPropFn);
}

function moveTo2(features_properties) {
	aFeaturePropColours(featureDisplayObjs[0], features_properties, {});
}

//
//Add extra features on to the feature display and feature list
//
// seqName - name of chromosome/contig 
// jsonFeatureObj - json representation of features
// trackIndex - index/name of new track
// feature properties dialog callback
function addFeatures(seqName, jsonFeatureObj, trackIndex, fnFeatureProps) {
	for(index=0;index<featureDisplayObjs.length; index++) {
		if(featureDisplayObjs[index].srcFeature == seqName) {
			var fDisplay = featureDisplayObjs[index];
			if( $.inArray(trackIndex, fDisplay.tracks) == -1 ) {
				fDisplay.tracks.push(trackIndex);
				$('#features').append('<div id="features'+
						fDisplay.index+'_'+trackIndex+'"></div>');
			}
			
			var tmpTrack = fDisplay.trackIndex;
			fDisplay.trackIndex = trackIndex;
			aFeatureFlatten(fDisplay, jsonFeatureObj,
					{append:true, minDisplay:fDisplay.minimumDisplay, track:trackIndex});
			fDisplay.trackIndex = tmpTrack;
			
			var self = fDisplay;
			$('#features'+fDisplay.index+'_'+trackIndex).single_double_click(handleFeatureClick, centerOnFeature, fDisplay, 500);
			$('#features'+fDisplay.index+'_'+trackIndex).popup_enter_out(showPopupFeature, disablePopup);
		    $('#features'+fDisplay.index+'_'+trackIndex).contextMenu({menu: 'fDispMenus'+self.index}, 
		    		function(action, el, pos) { rightClickMenu(action, el, pos, self) });
		    
			fDisplay.showFeatureFn[trackIndex] = fnFeatureProps;
			break;
		}
	}
}

var methods = {
	init : function(options) {
        if(!options.directory) {
            options.directory = ".";
        }
		$(this).load(options.directory+"/js/WebArtemis.html", function(){
			//set the default values for the options
			var settings = $.extend({
				bases : 16000,				// number of bases shown
				start : 1,					// initial position
				showFeatureList : true,		// show feature list
				showChromosomeMap : false,      // use chromosoml
				source : 'BX571857',		// default sequence
				width : $(window).width(), 	// browser viewport width,
				showOrganismsList : true,	// show organism list
				//webService : 'http://127.0.0.1:8080/services/',
				webService : 'http://www.genedb.org/services/',
				dataType : 'jsonp',			// json/jsonp
				draggable : true,			// allow dragging to increase size
				mainMenu : true,			// show the main menu
				zoomMaxRatio : 1.0			// define max zoom as ratio of sequence length
			}, options);
            
            webService = settings.webService;
            dataType = settings.dataType;

			var arr = getUrlVars();
			var leftBase = arr["base"];
			if(!leftBase) {
				leftBase = settings.start;
			} else {
				leftBase = parseInt(leftBase);
				if(leftBase < 1)
					leftBase = 1;
			}
		
			var width = arr["width"];
			if(!width) {
				width = settings.width
			}
			displayWidth = parseInt(width) - (margin*12);
			
			var basesDisplayWidth = arr["bases"];
			if(!basesDisplayWidth) {
				basesDisplayWidth = settings.bases;
			} else {
				basesDisplayWidth = parseInt(basesDisplayWidth);
			}
		
			var excludeFeatures = arr["exclude"];
			if(excludeFeatures) {
				excludes = excludeFeatures.split(',');
			}
		
			var listSetting = arr["featureList"];
			if(listSetting) {
				if(listSetting == "true")
					showFeatureList = true;
				else
					showFeatureList = false;
			} else {
				showFeatureList = settings.showFeatureList;
			}
			
			showChromosomeMap = settings.showChromosomeMap;
		
			var debugSetting = arr["debug"];
			if(debugSetting) {
				if(debugSetting == "true")
					debug = true;
				else
					debug = false;
			}
		
			if(basesDisplayWidth > 50000) {
				showStopCodons = false;
			} else if(basesDisplayWidth < 1000) {
				showStopCodons = true;
			}
		  
			var hgt = arr["height"];
			if(!hgt) {
				hgt = 10;
			} else {
				hgt = parseInt(hgt);
			}
		
			var title = '';
		
			var lastObj;
			var compCount = 0;
			var slen = 30000;
			if(slen < leftBase) {
				slen = leftBase+basesDisplayWidth;
			}
			for(var i in arr) {
				var value = arr[i];
				if(i.indexOf("src") > -1) {
					title+=value+' ';

					var obj = new featureDisplayObj(basesDisplayWidth, initialTop, slen, value, hgt, leftBase, settings.showOrganismsList, settings.draggable, settings.mainMenu, settings.zoomMaxRatio);
					featureDisplayObjs[count - 1] = obj;
					initialTop+=250;
				
					if(count > 1) {
						compare = true;
						new comparisonObj(lastObj, obj, compCount);
						compCount++;
					}
					lastObj = obj;
				}
			}

			if(count == 0) {
				title = settings.source;
				var obj = new featureDisplayObj(basesDisplayWidth, initialTop, slen, title, hgt, leftBase, settings.showOrganismsList, settings.draggable, settings.mainMenu, settings.zoomMaxRatio);
				featureDisplayObjs[0] = obj;
			}

			if(showFeatureList)
				featureListEvents(featureDisplayObjs[0]);
		
			$('ul.sf-menu').superfish({ 
				animation: {height:'show'},   // slide-down effect without fade-in 
				delay:     1200               // 1.2 second delay on mouseout 
			});
			document.title = title;
		
			if (!$('#sequence'+1).find('canvas').get(0))
				$('#sequence'+1).append("<canvas width='1px' height ='1px'></canvas>");		
			var canvas = $('#sequence'+1).find("canvas").get(0);
			if(canvas && canvas.getContext) {
				useCanvas = true;
				debugLog('USE CANVAS');
			}
			$('#sequence'+1).html('');
		
			// Override the core hide() method
			var originalHideMethod = jQuery.fn.hide;
			jQuery.fn.extend({
				hide : function(args) { 
				if(this.selector == '.contextMenu') 
					disablePopup(); 
				return originalHideMethod.apply( this ); }
			});
		})
	},
	
	addData : function(start, end, isolate) {
		// TEST 
	    test(start, end, isolate);
		attachObserver(isolate);
	},
	addObserver : function (observer) {
	    addArtemisObserver(observer);
	}
};

function attachObserver(isolate) {
    if (featureDisplayObjs.length < 1) {
        setTimeout(function() { attachObserver(isolate); }, 100);
        return;
    } else {
		var obs = new function() {
			this.redraw = function redraw(start, end) {
				debugLog("REDRAW "+start+" "+end);
				test(start, end, isolate);
			}
		};
    	addArtemisObserver(obs);
    }
}

// we need to know the script directory for the svg library
var _genome_js_scripts = document.getElementsByTagName('script');
var _genome_js_path = _genome_js_scripts[_genome_js_scripts.length - 1].src.split('?')[0];
var _genome_js_current_directory = _genome_js_path.split('/').slice(0, -1).join('/') + '/';

// needed to put the WebArtemis plugin function inside the jquery scope so that it can pick up the svgManager 
(function($) { 

    // put at the end of the script for ie
    $.fn.WebArtemis = function(method) {
        
        // set the path to the svg files relative to the path of >this< file
        if (svgManager != null) {
            svgManager.baseSVGPath = _genome_js_current_directory + "jquery.drawinglibrary/";
        }
        
    	// remove square brackets
    	// &exclude[]=repeat_region&exclude[]=gene
    	jQuery.ajaxSettings.traditional = true; 
	
    	if ( methods[method] ) {
    	      return methods[method].apply( this, Array.prototype.slice.call( arguments, 1 ));
    	} else if ( typeof method === 'object' || ! method ) {
    	     return methods.init.apply( this, arguments );
    	} else {
    	      $.error( 'Method ' +  method + ' does not exist in WebArtemis' );
    	}
    };

})(jQuery);
