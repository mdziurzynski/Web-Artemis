

function addSelectionEventHandlers(fDisplay) {
	$('#sequence'+fDisplay.index).mousedown(function(e) {
	    var start_x = e.pageX;
	    var start_y = e.pageY;

	    $(this).mousemove(function(e) {
	        setFdispaySelection(fDisplay, start_x, e.pageX);
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
}

function setFdispaySelection(fDisplay, start_x, end_x) {
	var offset_x = end_x - start_x;
    var flh = fDisplay.frameLineHeight;
    
    if($('#selection'+fDisplay.index).length == 0)
    	$('#features').append('<div id="selection'+fDisplay.index+'"></div>');
    
    if(offset_x < 0) {
    	offset_x = -offset_x;
    	var xpos = end_x - margin;
    } else {
    	xpos = start_x - margin;
    }

    var pixPerBase  = (displayWidth/fDisplay.basesDisplayWidth);
    xpos = ((Math.round(xpos/pixPerBase)-1)*pixPerBase) + margin;
    offset_x = Math.round(offset_x/pixPerBase)*pixPerBase;
    
    $('#selection'+fDisplay.index).css({
    	'height':flh+'px',
		'line-height' : flh+'px',
		'margin-left': xpos+'px',
		'margin-top': fDisplay.marginTop+(flh*6)+'px',
    	'background':'#ffff00',
    	'width':offset_x+'px',
    	'opacity':'0.5',
		'position':'absolute'
    });
}
