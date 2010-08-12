

function addSelectionEventHandlers(fDisplay) {
	$('#sequence'+fDisplay.index).mousedown(function(e) {
	    var start_x = e.pageX;
	    var start_y = e.pageY;

	    $(this).mousemove(function(e) {
	        setFdispaySelection(fDisplay, start_x, e.pageX, start_y);
	        return false;
	    });

	    $(this).one('mouseup', function() {
	        $(this).unbind('mouseup, mousemove');
	    });

	    // Using return false prevents browser's default,
	    // often unwanted mousemove actions (drag & drop)
	    return false;
	});
	
	$('#sequence'+fDisplay.index).single_double_click(sClick, dClick, fDisplay, 500);
}

function sClick(fDisplay, event, tgt) {
	$(this).unbind('mouseup, mousemove');
}

function dClick(fDisplay, event, tgt) {
	$(this).unbind('mouseup, mousemove');
	$('#selection'+fDisplay.index).remove();
	$('#selectionFrame'+fDisplay.index).remove();
}

function setFdispaySelection(fDisplay, start_x, end_x, start_y) {

    var flh = fDisplay.frameLineHeight;
    
    if($('#selection'+fDisplay.index).length == 0) {
    	$('#features').append('<div id="selection'+fDisplay.index+'"></div>');
    	$('#features').append('<div id="selectionFrame'+fDisplay.index+'"></div>');
    	var cssObj = {
    	    	'height':flh+'px',
    			'line-height' : flh+'px',
    	    	'opacity':'0.5',
    			'position':'absolute'
    	    };
    	$('#selection'+fDisplay.index).css(cssObj);
    	$('#selection'+fDisplay.index).css('background','#ffff00');
    	$('#selectionFrame'+fDisplay.index).css(cssObj);
    	$('#selectionFrame'+fDisplay.index).css('background','#FFB5C5');
    }
    
	var width = end_x - start_x;
    if(width < 0) {
    	width = -width;
    	start_x = end_x - margin;
    } else {
    	start_x = start_x - margin;
    }

    var pixPerBase  = (displayWidth/fDisplay.basesDisplayWidth);
    var basePos = Math.round(start_x/pixPerBase);
    var realBasePos = basePos + fDisplay.leftBase - 1;

    var baseWidth = Math.round(width/pixPerBase);
    if(start_y < fDisplay.marginTop+(flh*6) ||
       start_y > fDisplay.marginTop+(flh*11)) {
    	baseWidth += 3-baseWidth%3;
    }
    var realEndBasePos = basePos + baseWidth + fDisplay.leftBase - 2;
    
    if(start_y < fDisplay.marginTop+(flh*2)) {
    	basePos = basePos - (realBasePos%3);
    	var frame = 0;
    } else if(start_y < fDisplay.marginTop+(flh*4)) {
    	basePos = basePos - ((realBasePos+2)%3);
    	if(basePos < 1)
    		basePos = 1;
    	frame = 1;
    } else if(start_y < fDisplay.marginTop+(flh*6)) {
    	basePos = basePos - ((realBasePos+1)%3);
    	if(basePos < 2)
    		basePos = 2;
    	frame = 2;
    } else if(start_y < fDisplay.marginTop+(flh*11)) {
    	basePos = basePos - 1;
    	if(start_y < fDisplay.marginTop+(flh*8)) {
    		frame = (realBasePos+2) % 3;
    	}
    	else {
    		frame = 2 - ((fDisplay.sequenceLength-realEndBasePos) % 3);
    	}
    } else if(start_y < fDisplay.marginTop+(flh*13)) {
    	basePos = basePos - (3-(fDisplay.sequenceLength - realBasePos - 1)%3) -1;
    	frame = 0;
    } else if(start_y < fDisplay.marginTop+(flh*15)) {
    	basePos = basePos - (3-(fDisplay.sequenceLength - realBasePos)%3) -1;
    	frame = 1;
    } else if(start_y < fDisplay.marginTop+(flh*17)) {
    	basePos = basePos - (3-(fDisplay.sequenceLength - realBasePos + 1)%3) -1;
    	frame = 2;
    }
    
    width = baseWidth*pixPerBase;
    start_x = (basePos*pixPerBase) + margin;

    
    if(start_y < fDisplay.marginTop+(flh*8)) {
    	var ypos = fDisplay.marginTop+(6*flh);
        var yposFrame = fDisplay.marginTop+((flh*2)*frame);
    } else {
    	ypos = fDisplay.marginTop+(9*flh);
    	yposFrame = fDisplay.marginTop+(flh*10)+((flh*2)*frame)+flh;
    }
    
    $('#selection'+fDisplay.index).css({
		'margin-left': start_x+'px',
		'margin-top': ypos+'px',
    	'width':width+'px',
    });
    
    $('#selectionFrame'+fDisplay.index).css({
		'margin-left': start_x+'px',
		'margin-top': yposFrame+'px',
    	'width':width+'px',
    });
}
