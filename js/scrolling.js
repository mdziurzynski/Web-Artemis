//
// SCROLLING
//
var scrolling = 0;
var timeoutTime = 60; // ms
var lastLeftBase = -1;

function scroll(direction, featureDisplay) {
    if (scrolling == 1) {
    	
    	var leftBase = $('#slider'+featureDisplay.index).slider('option', 'value');
            if(direction == 1) {
            	// scroll right
            	leftBase = Math.round(Math.floor(
            			leftBase + $('#slider'+featureDisplay.index).slider('option', 'step')/4));
            }
            else {
            	// scroll left
            	leftBase = Math.round(Math.floor(
            			leftBase - $('#slider'+featureDisplay.index).slider('option', 'step')/4));
            	if(leftBase == 0) {
            		leftBase = 1;
            	}
            }
            
        	if(leftBase < 1 || leftBase > sequenceLength) {
        		return false;
        	}
        	
        	featureDisplay.leftBase = leftBase;
        	drawAll(featureDisplay);
        	$('#slider'+featureDisplay.index).slider('option', 'value', leftBase);

        	//var code2run = "scroll("+direction+"," +"featureDisplay)";
            setTimeout(function() { scroll(direction, featureDisplay); }, timeoutTime);

    }
    return false;
}

function addScrollEventHandlers(featureDisplay) {

	$('#left'+featureDisplay.index).mousedown(function(event){
		if(scrolling != 1) {
			lastLeftBase = $('#slider'+featureDisplay.index).slider('option', 'value');
		}
		scrolling = 1;
		featureDisplay.minimumDisplay = true
		scroll(-1, featureDisplay);
	});

	$('#left'+featureDisplay.index).mouseup(function(event){
		scrolling = 0;
		featureDisplay.minimumDisplay = false
		var leftBase = $('#slider'+featureDisplay.index).slider('option', 'value');
    	featureDisplay.leftBase = leftBase;
    	drawAndScroll(featureDisplay, lastLeftBase);
	});
	
	$('#right'+featureDisplay.index).mousedown(function(event){
		if(scrolling != 1) {
			lastLeftBase = $('#slider'+featureDisplay.index).slider('option', 'value');
		}
		scrolling = 1;
		featureDisplay.minimumDisplay = true
		scroll(1, featureDisplay);
	});
	
	$('#right'+featureDisplay.index).mouseup(function(event){
		scrolling = 0;
		featureDisplay.minimumDisplay = false;
		var leftBase = $('#slider'+featureDisplay.index).slider('option', 'value');
		featureDisplay.leftBase = leftBase;
		drawAndScroll(featureDisplay, lastLeftBase);
	});
}