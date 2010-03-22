//
// SCROLLING
//
var scrolling = 0;
var timeoutTime = 160; // ms

function scroll(direction, featureDisplay) {
    if (scrolling == 1) {
    	
    	var leftBase = $(".slider").slider('option', 'value');
            if(direction == 1) {
            	// scroll right
            	leftBase = Math.round(Math.floor(
            			leftBase + $(".slider").slider('option', 'step')/4));
            }
            else {
            	// scroll left
            	leftBase = Math.round(Math.floor(
            			leftBase - $(".slider").slider('option', 'step')/4));
            	if(leftBase == 0) {
            		leftBase = 1;
            	}
            }
            
        	if(leftBase < 1 || leftBase > sequenceLength) {
        		return false;
        	}
        	
        	featureDisplay.leftBase = leftBase;
        	drawAll(featureDisplay);
        	$(".slider").slider('option', 'value', leftBase);

        	//var code2run = "scroll("+direction+"," +"featureDisplay)";
            setTimeout(function() { scroll(direction, featureDisplay); }, timeoutTime);

    }
    return false;
}

function addScrollEventHandlers(featureDisplay) {

	$('#left').mousedown(function(event){
		scrolling = 1;
		featureDisplay.minimumDisplay = true
		scroll(-1, featureDisplay);
	});

	$('#left').mouseup(function(event){
		scrolling = 0;
		featureDisplay.minimumDisplay = false
		var leftBase = $(".slider").slider('option', 'value');
    	featureDisplay.leftBase = leftBase;
    	drawAll(featureDisplay);
	});
	
	$('#right').mousedown(function(event){
		scrolling = 1;
		featureDisplay.minimumDisplay = true
		scroll(1, featureDisplay);
	});
	
	$('#right').mouseup(function(event){
		scrolling = 0;
		featureDisplay.minimumDisplay = false;
		var leftBase = $(".slider").slider('option', 'value');
		featureDisplay.leftBase = leftBase;
		drawAll(featureDisplay);
	});
}