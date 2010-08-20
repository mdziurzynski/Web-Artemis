//
// ZOOMING
//
var zooming = 0;
var ztimeoutTime = 450; // ms

function setScrollHandle(scrollbar, fDisplay) {	
	var slider = $('#slider'+fDisplay.index);

	// TODO slider scaling
	// http://groups.google.com/group/jquery-ui/browse_thread/thread/1605420a9af60ab2
	//
    /*var remainder = fDisplay.sequenceLength - (fDisplay.basesDisplayWidth/2);
	var proportion = remainder / (parseInt(fDisplay.sequenceLength) + parseInt(fDisplay.basesDisplayWidth/2));
	var sliderWidth = $('#slider'+fDisplay.index).width();
	var handleSize = sliderWidth - (proportion * sliderWidth);
	$('#slider'+fDisplay.index).find('.ui-slider-handle').css({ width: handleSize });*/
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
    	setTimeout(function() { zoom(fDisplay, step, direction); }, ztimeoutTime);  
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
    
    var centerBase = fDisplay.leftBase + (fDisplay.basesDisplayWidth/2); 
    fDisplay.basesDisplayWidth = basesInView;
    var newLeftBase = Math.round(centerBase - (basesInView/2));

      
    if(newLeftBase > 1 && fDisplay.leftBase > 1) {
    	fDisplay.leftBase = newLeftBase;
    } else if( newLeftBase > fDisplay.sequenceLength-basesInView/2 ) {
    	newLeftBase = Math.round(fDisplay.sequenceLength-basesInView/2);
    	fDisplay.leftBase = newLeftBase;
    }

	$('#slider'+fDisplay.index).slider('option', { 
		'max': fDisplay.sequenceLength-fDisplay.basesDisplayWidth/2,
		'step': fDisplay.basesDisplayWidth/4,
		'value': fDisplay.leftBase});
	
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