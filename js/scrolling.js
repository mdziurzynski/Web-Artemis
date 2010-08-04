//
// SCROLLING
//
var scrolling = 0;
var scrollTimeoutTime = 160; // ms
var lastLeftBase = -1;

function scroll(direction, fDisplay) {
    if (scrolling == 1) {
    	
    	var leftBase = $('#slider'+fDisplay.index).slider('option', 'value');
            if(direction == 1) {
            	// scroll right
            	leftBase = Math.round(Math.floor(
            			leftBase + $('#slider'+fDisplay.index).slider('option', 'step')/4));
            }
            else {
            	// scroll left
            	leftBase = Math.round(Math.floor(
            			leftBase - $('#slider'+fDisplay.index).slider('option', 'step')/4));
            	if(leftBase < 1) {
            		leftBase = 1;
            	}
            }
            
        	if(leftBase < 1 || leftBase > fDisplay.sequenceLength-fDisplay.basesDisplayWidth/2) {
        		return false;
        	}
        	
        	fDisplay.leftBase = leftBase;
        	drawAll(fDisplay);
        	$('#slider'+fDisplay.index).slider('option', 'value', leftBase);

        	//var code2run = "scroll("+direction+"," +"featureDisplay)";
            setTimeout(function() { scroll(direction, fDisplay); }, scrollTimeoutTime);

    }
    return false;
}

function addScrollEventHandlers(fDisplay) {
	$('#left'+fDisplay.index).mousedown(function(event){
		if(scrolling != 1) {
			lastLeftBase = $('#slider'+fDisplay.index).slider('option', 'value');
		}
		scrolling = 1;
		fDisplay.minimumDisplay = true
		scroll(-1, fDisplay);
	});

	$('#left'+fDisplay.index).mouseup(function(event){
		scrolling = 0;
		fDisplay.minimumDisplay = false
		var leftBase = $('#slider'+fDisplay.index).slider('option', 'value');
		fDisplay.leftBase = leftBase;
    	drawAndScroll(fDisplay, lastLeftBase);
	});
	
	$('#right'+fDisplay.index).mousedown(function(event){
		if(scrolling != 1) {
			lastLeftBase = $('#slider'+fDisplay.index).slider('option', 'value');
		}
		scrolling = 1;
		fDisplay.minimumDisplay = true
		scroll(1, fDisplay);
	});
	
	$('#right'+fDisplay.index).mouseup(function(event){
		scrolling = 0;
		fDisplay.minimumDisplay = false;
		var leftBase = $('#slider'+fDisplay.index).slider('option', 'value');
		fDisplay.leftBase = leftBase;
		drawAndScroll(fDisplay, lastLeftBase);
	});
}