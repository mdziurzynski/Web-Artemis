//
// SCROLLING
//
var scrolling = 0;

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
        	
            drawAll(leftBase, 0);
        	$(".slider").slider('option', 'value', leftBase);
            
            var code2run = 'scroll('+ direction + ')';
            setTimeout(code2run,500);
    }
    return false;
}

function addScrollEventHandlers() {
	$('#left').mousedown(function(event){
		scrolling = 1;
		scroll(-1);
	});
	
	$('#left').mouseup(function(event){
		scrolling = 0;
	});
	
	$('#right').mousedown(function(event){
		scrolling = 1;
		scroll(1);
	});
	
	$('#right').mouseup(function(event){
		scrolling = 0;
	});
}