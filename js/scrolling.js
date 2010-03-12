//
// SCROLLING
//
var scrolling = 0;
var display;

function scroll(direction) {
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
        	
        	display.leftBase = leftBase;
        	drawAll(display);
        	$(".slider").slider('option', 'value', leftBase);
            
            var code2run = 'scroll('+ direction +')';
            setTimeout(code2run,80);
    }
    return false;
}

function addScrollEventHandlers(featureDisplay) {
	display = featureDisplay;
	$('#left').mousedown(function(event){
		scrolling = 1;
    	minimumDisplay = true
		scroll(-1);
	});
	
	$('#left').mouseup(function(event){
		scrolling = 0;
    	minimumDisplay = false
		var leftBase = $(".slider").slider('option', 'value');
    	featureDisplay.leftBase = leftBase;
    	drawAll(featureDisplay);
	});
	
	$('#right').mousedown(function(event){
		scrolling = 1;
    	minimumDisplay = true
		scroll(1);
	});
	
	$('#right').mouseup(function(event){
		scrolling = 0;
    	minimumDisplay = false;
		var leftBase = $(".slider").slider('option', 'value');
		featureDisplay.leftBase = leftBase;
		drawAll(featureDisplay);
	});
}