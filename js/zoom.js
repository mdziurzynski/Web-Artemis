//
// ZOOMING
//
var zooming = 0;
var zoomtimeoutTime = 450; // ms

function setScrollHandle(scrollbar, fDisplay) {	
	var slider = $('#slider'+fDisplay.index);
	slider.slider('option', 'step', fDisplay.basesDisplayWidth/2);

	// TODO slider scaling
	// http://groups.google.com/group/jquery-ui/browse_thread/thread/1605420a9af60ab2
	//
	/*var handleSize = fDisplay.basesDisplayWidth/fDisplay.sequenceLength*100;
	
	if(handleSize > 5) {
		handleSize = 5;
	}
	//debugLog("SLIDER WIDTH: "+scrollbar.find('.ui-slider-handle').css('width'));
	scrollbar.find('.ui-slider-handle').css({ width: handleSize+'%' });*/
}

function zoom(fDisplay, scrollbar, direction) {
    if (zooming > 0) {
    	var step = Math.round(fDisplay.basesDisplayWidth/3)*direction;
    	var value = $('#slider_vertical_container'+fDisplay.index).slider('option', 'value')+step;
		if(value > fDisplay.sequenceLength-140) {
			value = fDisplay.sequenceLength-140;
		}

	    $('#slider_vertical_container'+fDisplay.index).slider( "option", "value", value );
	    
    	zoomOnce(fDisplay, scrollbar);	
    	setTimeout(function() { zoom(fDisplay, step, direction); }, zoomtimeoutTime);  
    }
    return false;
}

function zoomOnce(fDisplay, scrollbar) {
    var value = $('#slider_vertical_container'+fDisplay.index).slider('option', 'value');
    var basesInView = fDisplay.sequenceLength-value;
    if(basesInView > 50000) {
    	  showStopCodons = false;
    } else if(basesInView < 1000) {
    	  showStopCodons = true;
    }
    	  
    fDisplay.basesDisplayWidth = basesInView;
    drawAll(fDisplay);
    	  
    // update .ui-slider-horizontal .ui-slider-handle
    setScrollHandle(scrollbar, fDisplay);	
}

function addZoomEventHandlers(fDisplay) {
	$('#plus'+fDisplay.index).mousedown(function(event){
		fDisplay.minimumDisplay = true;
	    zooming = 1;
		zoom(fDisplay, $('#slider'+fDisplay.index), 1);	
	});
	
	$('#plus'+fDisplay.index).mouseup(function(event){
		fDisplay.minimumDisplay = false;
		zooming = 0;
		drawAll(fDisplay);
	});

	$('#minus'+fDisplay.index).mousedown(function(event){
		fDisplay.minimumDisplay = true;
	    zooming = 1;
		zoom(fDisplay, $('#slider'+fDisplay.index), -1);	
	});
	
	$('#minus'+fDisplay.index).mouseup(function(event){
		fDisplay.minimumDisplay = false;
		zooming = 0;
		drawAll(fDisplay);
	});	
}