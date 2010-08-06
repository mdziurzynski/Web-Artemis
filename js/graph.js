
var datasets;
var graphId;
var winSize = -1;

function getValue(sequence, start, end, bases) {
	var gc = 0;
	for(var i=start; i<end && i<sequence.length; i++) {
		var base = sequence.charAt(i);
		if(base == bases[0] || base == bases[1]) {
			gc++;
		}
	}
	return (gc*100)/(end - start);
}

function getContentGraph(sequence, winSize, stepSize, leftBase, bases) {
	var gcPoints = new Array();
	var gc = 0;
	var count = 0;
	var stepSize2 = Math.round(stepSize/2);
	var winSize2  = Math.round(winSize/2);
	
	for(var istep=0; istep<sequence.length ; istep+=stepSize) { 
		
		var start = istep - winSize2;
		if(start < 0) {
			start = 0;
		}
		var end   = istep + winSize2;
		if(end > sequence.length) {
			end = sequence.length;
		}
		var gcValue = getValue(sequence, start, end, bases);
		
		gcPoints[count] = new Array(2);
		gcPoints[count][0] = istep+stepSize2+leftBase;
		gcPoints[count][1] = gcValue;
		
		count++;
	}
	return gcPoints;
}

function graphLoadData(datasets, leftBase, sequence) {
   	$.plot($("#graph"), datasets,
   			{ 	
			clickable: true,
			hoverable: true,
			selection: { mode: "x" },
			xaxis: { 
				min:leftBase, max:leftBase+sequence.length
			},
			yaxis: { 
				min:null, max:null,
				tickFormatter: function (val, axis) {
			    	return "";
			    }
			}
		});
}

var aGraph = function ajaxGetGraph(featureDisplay, returned, options) {
	var tracks = returned.response.tracks;
	var stepSize = featureDisplay.basesDisplayWidth/55;
	var stepSize2 = Math.round(stepSize/2);
	
	for(var i=0; i<tracks.length; i+=1) {
		var trackPoints = new Array();
		for(var j=0; j<tracks[i].data.length ; j+=1) { 
			
			trackPoints[j] = new Array(2);
			trackPoints[j][0] = (j*55)+featureDisplay.leftBase;
			trackPoints[j][1] = tracks[i].data[j]*10000;
		
			//debugLog("Number of graph tracks = "+tracks.length+"; x, y ="+trackPoints[j][0]+","+trackPoints[j][1]);
		}
	
		datasets.push(
		{
			label: "Track "+(i+1),
			data: trackPoints,
			color: "#FF00FF"
		});
	}
   	graphLoadData(datasets, featureDisplay.leftBase, featureDisplay.sequence);
};

var aGraphId = function ajaxGetGraphId(featureDisplay, returned, options) {
	var plots = returned.response.plots;
	var count = 0;
	graphId = new Array();
	
	for(var i=0; i<plots.length; i+=1) {
       if(plots[i].feature == featureDisplay.srcFeature) {
    	   graphId[count] = plots[i].id;
    	   count+=1;
       }
	}
	
   	var serviceName = '/graphs/fixed_scaled.json?';
	handleAjaxCalling(serviceName, aGraph,
			{ id:graphId[0], start:featureDisplay.leftBase, end:featureDisplay.leftBase+featureDisplay.basesDisplayWidth, step:winSize, span:winSize }, 
			featureDisplay, {});
};

function getGraphId(featureDisplay) {
   	var serviceName = '/graphs/list.json?';
   	handleAjaxCallingSync(serviceName, aGraphId,
   		{}, featureDisplay, {}, false);
}

function drawContentGraphs(featureDisplay, showAG, showGC, showOther) {
	$("#graph").css('height', 150+'px');

	var leftBase = featureDisplay.leftBase;
	var sequence = featureDisplay.sequence;

	if(winSize == -1) {
		winSize = featureDisplay.basesDisplayWidth/80;
	}
	
   	var stepSize = winSize/5;
   	datasets = new Array();
   	
   	if(showAG) {
   		datasets.push(
   				{
   	   	            label: "%AG",
   	   	            data: getContentGraph(sequence,winSize,stepSize,leftBase, ["A", "G"]),
   	   	            color: "#00FF00"
   	   	        });
   	}
   	
   	if(showGC) {
   		datasets.push(
   				{
   	   	            label: "%GC",
   	   	            data: getContentGraph(sequence,winSize,stepSize,leftBase, ["G", "C"]),
   	   	            color: "#FF0000"
   	   	        });
   	}
   	//
   	if(showOther) {
   	  getGraphId(featureDisplay);
   	}
   	
   	graphLoadData(datasets, leftBase, sequence);
   	$("#graph").bind("plotselected", function (event, ranges) {
   		debugLog("Graph selected range: "+ranges.xaxis.from.toFixed(1) + ".." + ranges.xaxis.to.toFixed(1));  		
   		
   		/*var Xpoints = new Array(lpos, mid, rpos) ;
   		var Ypoints = new Array(lastYpos+4, ymid, ypos+4);
   		$("#featureConnections").drawPolyline(Xpoints,Ypoints, {color: colour, stroke:'1'});*/
    });

}


function setGraphMenu(fDisplay) {
    $('#menuHeader').append('<div id="graphMenu'+this.index+'"></div>');
    $('#graphMenu'+this.index).append('<ul id="graphMenus'+this.index+'" class="contextMenu" style="width:145px">' +
    		'<li><a href="#winSize" id="winSize">Window size...</a></li>'+
    		'</ul>');
	
	$('#graph').contextMenu({
        menu: 'graphMenus'+self.index
    },
    function(action, el, pos) {
    	if(action.match(/winSize/)) {
    		debugLog("Change window size");
    		$("div#properties").html("<div id='graphProps'></div>");
    		$('div#graphProps').html('Window Size:<input id="graphWinSize" type="text" value="'+winSize+'"/><br />');
    		
    	    $("div#graphProps").dialog({ height: 150 ,
    			width:450, position: 'left', title:'Graph Properties', show:'fast',
    			close: function(event, ui) { $(this).remove(); },
    			buttons: {
    			'Set': function() {
    	    	
    	     		winSize = $(this).find('#graphWinSize').val();
    	     		$(this).dialog('close');
    	     		drawContentGraphs(fDisplay, showAG, showGC, showOther);
    	     	
    			},
    			Cancel: function() {
    				$(this).dialog('close');
    			}
    		}});
    	}
    });
}


function setGraphCss(displayWidth, marginTop, margin, frameLineHeight) {
	var cssObj = {
			 'width': displayWidth+'px',
			 'height':150+'px',
			 'top': marginTop+(frameLineHeight*19.5)+'px',
			 'position': 'absolute',
			 'margin-left': margin+'px'
		};
  	$("#graph").css(cssObj);
}

