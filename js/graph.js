
function drawContentGraphs(basesDisplayWidth, leftBase, sequence, showAG, showGC) {
	$("#graph").css('height', 150+'px');

   	var winSize = 500;
   	var stepSize = basesDisplayWidth/500;
   	
   	var datasets = new Array();
   	
   	if(showAG)
   		datasets.push(
   				{
   	   	            label: "%AG",
   	   	            data: getContentGraph(sequence,winSize,stepSize,leftBase, ["A", "G"]),
   	   	            color: "#00FF00"
   	   	        });
   	
   	if(showGC)
   		datasets.push(
   				{
   	   	            label: "%GC",
   	   	            data: getContentGraph(sequence,winSize,stepSize,leftBase, ["G", "C"]),
   	   	            color: "#FF0000"
   	   	        });

   	
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
   	$("#graph").bind("plotselected", function (event, ranges) {
   		debugLog("Graph selected range: "+ranges.xaxis.from.toFixed(1) + ".." + ranges.xaxis.to.toFixed(1));
   		
   		
   		/*var Xpoints = new Array(lpos, mid, rpos) ;
   		var Ypoints = new Array(lastYpos+4, ymid, ypos+4);
   		$("#featureConnections").drawPolyline(Xpoints,Ypoints, {color: colour, stroke:'1'});*/
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

function getContentGraph(sequence, winSize, stepSize, leftBase, bases) {
	var gcPoints = new Array();
	var gc = 0;
	var count = 0;
	var stepSize2 = Math.round(stepSize/2);
	var winSize2  = Math.round(winSize/2);
	
	for(var istep=0; istep<sequence.length ; istep+=stepSize) { 
		
		var start = istep - winSize2;
		if(start < 0)
			start = 0;
		var end   = istep + winSize2;
		if(end > sequence.length)
			end = sequence.length;
		var gcValue = getValue(sequence, start, end, bases);
		
		gcPoints[count] = new Array(2);
		gcPoints[count][0] = istep+stepSize2+leftBase;
		gcPoints[count][1] = gcValue;
		
		count++;
	}
	return gcPoints;
}

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