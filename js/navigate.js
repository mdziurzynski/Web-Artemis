function navigate(fDisplay) {
	$("div#properties").html("<div id='GO'></div>");
    $("div#GO").dialog({ height: 285 ,
		width:450, position: 'center', title:'Find',
		close: function(event, ui) { $(this).remove(); },
		open: function(event, ui) { setCheckBoxStatus(); },
		buttons: {
		'Go': function() {
    	if ($(":radio[@name='rdio']:checked").val() == 'gene'){
     		var gotoFeature = $(this).find('#gotoFeature').val();   		
     		if( $(":checkbox[name='region']").is(':checked') )
     			centerOnFeature(fDisplay, undefined, gotoFeature, fDisplay.srcFeature);
     		else
     			centerOnFeature(fDisplay, undefined, gotoFeature);
     		$(this).dialog('close');
    	} else if($(":radio[@name='rdio']:checked").val() == 'syn') {
    		
    		$(this).css('cursor','wait');
    		
     		var regex = $(":checkbox[name='regex']").is(':checked'); 
     		var inputObj = { 'regex':regex, 'term':$(this).find('#getSyn').val() };
     		setRegion(fDisplay, inputObj);
     		
     		handleAjaxCalling('/features/withnamelike.json?', 
     				function (fDisplay, features, options) {
     			$(options.goDialog).css('cursor','default');
     			//var features = returned.response.features;
     			if(features.length == 0) {
     				alert('No matches.');
     				return;
     			}
    			$(options.goDialog).dialog('close');
    			
     			var l = '';
     			for(var i=0; i<features.length; i++) {
     				var f = features[i];
     				l = l + '<a href="javascript:void(0)" onclick="centerOnFeatureByDisplayIndex('+
     					fDisplay.index+',\''+f.uniqueName+'\');">'+
     		        	f.uniqueName+'</a> '+f.name+'<br />';
     			}
     			setSearchResultWindow(l);
     		 }, inputObj, fDisplay, { 'goDialog':$(this) });

     	} else if($(":radio[@name='rdio']:checked").val() == 'base') {
     		// goto base 
     		var gotoBase = $(this).find('#gotoBase').val();
     		if(gotoBase > fDisplay.sequenceLength)
     			gotoBase = fDisplay.sequenceLength;
     		gotoBase = parseInt(gotoBase)-(fDisplay.basesDisplayWidth/2);

     		if(gotoBase < 1)
     			gotoBase = 1;
     		
     		$(this).dialog('close');
     		
     		fDisplay.leftBase = gotoBase;
     		$('#slider'+fDisplay.index).slider('option', 'value', fDisplay.leftBase);
     		drawAll(fDisplay);
     	} else if($(":radio[@name='rdio']:checked").val() == 'qual'){
     		
     		var regex = $(":checkbox[name='regex']").is(':checked'); 
     		var inputObj = { 'regex':regex, 'value':$(this).find('#getQual').val() };
     		setRegion(fDisplay, inputObj);
     		
     		handleAjaxCalling('/features/withproperty.json?', 
     				function (fDisplay, features, options) {

     			//var features = returned.response.results.features;
     			if(features.length == 0) {
     				alert('No matches.');
     				return;
     			}
    			$(options.goDialog).dialog('close');
    			
     			var l = '';
     			for(var i=0; i<features.length; i++) {
     				var f = features[i];
     				l = l + '<a href="javascript:void(0)" onclick="centerOnFeatureByDisplayIndex('+
     					fDisplay.index+',\''+f.uniqueName+'\');">'+
     		        	f.uniqueName+"</a> "+f.properties[0].type.name+'='+f.properties[0].value+'<br />';
     			}
     			setSearchResultWindow(l);
     		 }, inputObj, fDisplay, { 'goDialog':$(this) });
     	} else if($(":radio[@name='rdio']:checked").val() == 'cvs') {

     		var regex = $(":checkbox[name='regex']").is(':checked');
     		var inputObj = {  'regex':regex, 'term':$(this).find('#getCv').val() };
     		setRegion(fDisplay, inputObj);
     		
     		handleAjaxCalling('/features/withterm.json?', 
     				function (fDisplay, features, options) {
     			//var features = returned.response.results.features;
     			if(features.length == 0) {
     				alert('No matches.');
     				return;
     			}
     			
     			$(options.goDialog).dialog('close');
     			var l = '';
     			for(var i=0; i<features.length; i++) {
     				var f = features[i];
     				debugLog(f);
     				l = l + '<a href="javascript:void(0)" onclick="centerOnFeatureByDisplayIndex('+
     					fDisplay.index+',\''+f.uniqueName+'\');">'+
     		        	f.uniqueName+"</a> "+f.terms[0].name+' ('+f.terms[0].cv.name+')<br />';
     			}
     			setSearchResultWindow(l);
     		 }, inputObj, fDisplay, { 'goDialog':$(this) });
     	}
		},
		Cancel: function() {
			$(this).dialog('close');
		}
	}});
    
    var searchTable = 
    	'<table>'+
		'<tr><td><input type="radio" name="rdio" value="gene" checked="checked" />Gene Name:</td>'+
	    '<td><input id="gotoFeature" type="text" value="" onclick="$(\'input[value=gene]:radio\').attr(\'checked\', true); setCheckBoxStatus();"/></td></tr>' +
	    
    	'<tr><td><input type="radio" name="rdio" value="base" />Base Number:</td>'+
    		'<td><input id="gotoBase" type="text" value=""/ onclick="$(\'input[value=base]:radio\').attr(\'checked\', true); setCheckBoxStatus();"></td><tr/>' +
        
	    '<tr><td><input type="radio" name="rdio" value="syn" />Synonym:</td>'+
	    '<td><input id="getSyn" type="text" value="" onclick="$(\'input[value=syn]:radio\').attr(\'checked\', true); setCheckBoxStatus()"/></td></tr>' +

    	'<tr><td><input type="radio" name="rdio" value="qual" />Qualifier Text:</td>'+
    		'<td><input id="getQual" type="text" value="" onclick="$(\'input[value=qual]:radio\').attr(\'checked\', true); setCheckBoxStatus()"/></td><tr/>' +

    	'<tr><td><input type="radio" name="rdio" value="cvs" />Controlled Vocabulary Text:</td>'+
    		'<td><input id="getCv" type="text" value="" onclick="$(\'input[value=cvs]:radio\').attr(\'checked\', true); setCheckBoxStatus()"/></td><tr/>' +

        '<tr></tr>'+
            
        '<tr><td><input type="checkbox" name="region" checked="true" />only within '+fDisplay.srcFeature+'</td>'+
    		'<td><input type="checkbox" name="regex" checked="true" />using wildcard</td><tr/>' +
    		
    	'</table>';
    
    $("div#GO").html(searchTable);

    $("#open").click(function(event){
    	$("div#GO").dialog( "close" );
    });
}

function setRegion(fDisplay, inputObj) {
 	if( $(":checkbox[name='region']").is(':checked') )
 		inputObj.region = fDisplay.srcFeature;
}

function setCheckBoxStatus() {
    if ($('input[value=gene]:radio').is(':checked') || $('input[value=base]:radio').is(':checked') ) {
    	 $(":checkbox[name='regex']").attr('disabled', true);
    } else {
    	$(":checkbox[name='regex']").removeAttr('disabled');
    }
    
    if ($('input[value=base]:radio').is(':checked') ) {
   	 	$(":checkbox[name='region']").attr('disabled', true);
    } else {
   		$(":checkbox[name='region']").removeAttr('disabled');
    }
}

function setSearchResultWindow (res) {
		$("div#properties").html("<div id='searchResult'></div>");
		$("div#searchResult").dialog({ height: 220 ,
				width:500, position: 'center', title:'Search Result(s)', show:'fast',
				close: function(event, ui) { $(this).remove(); }});
		$("div#searchResult").html(res);
}