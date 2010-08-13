function navigate(fDisplay) {
	$("div#properties").html("<div id='GO'></div>");
    $("div#GO").dialog({ height: 265 ,
		width:450, position: 'center', title:'Find', show:'fast',
		close: function(event, ui) { $(this).remove(); },
		buttons: {
		'Go': function() {
    	if ($(":radio[@name='rdio']:checked").val() == 'gene'){
     		var gotoFeature = $(this).find('#gotoFeature').val();
     		$(this).dialog('close');
     		centerOnFeature(fDisplay, undefined, gotoFeature);
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
     		
     		if($(":checkbox[name='qualRegEx']").is(':checked'))
       		  	var regex = true;
     		else
     			regex = false;
     		
     		handleAjaxCalling('/features/withproperty.json?', 
     				function (fDisplay, returned, options) {

     			var features = returned.response.features;
     			if(features.length == 0) {
     				alert('No matches.');
     				return;
     			}
    			$(options.goDialog).dialog('close');
    			
     			$("div#properties").html("<div id='searchResult'></div>");
     			$("div#searchResult").dialog({ height: 220 ,
     				width:500, position: 'center', title:'Search Result', show:'fast',
     				close: function(event, ui) { $(this).remove(); }});
     			var l = '';
     			for(var i=0; i<features.length; i++) {
     				var f = features[i];
     				l = l + '<a href="javascript:void(0)" onclick="centerOnFeatureByDisplayIndex('+
     					fDisplay.index+',\''+f.feature+'\');">'+
     		        	f.feature+"</a> "+f.term+'='+f.value+'<br />';
     			}
     			$("div#searchResult").html(l);
     		 }, { 'regex':regex, 'value':$(this).find('#getQual').val(), 'region':fDisplay.srcFeature }, 
     		 fDisplay, { 'goDialog':$(this) });
     	} else if($(":radio[@name='rdio']:checked").val() == 'cvs') {

     		if($(":checkbox[name='cvRegEx']").is(':checked'))
     			var regex = true;
       		else
       			regex = false;

     		handleAjaxCalling('/features/withterm.json?', 
     				function (fDisplay, returned, options) {
     			
     			var features = returned.response.features;
     			if(features.length == 0) {
     				alert('No matches.');
     				return;
     			}
     			
     			$(options.goDialog).dialog('close');
     			$("div#properties").html("<div id='searchResult'></div>");
     			$("div#searchResult").dialog({ height: 220 ,
     				width:500, position: 'center', title:'Search Result', show:'fast',
     				close: function(event, ui) { $(this).remove(); }});
     			var l = '';
     			for(var i=0; i<features.length; i++) {
     				var f = features[i];
     				l = l + '<a href="javascript:void(0)" onclick="centerOnFeatureByDisplayIndex('+
     					fDisplay.index+',\''+f.feature+'\');">'+
     		        	f.feature+"</a> "+f.term+' ('+f.cv+')<br />';
     			}
     			$("div#searchResult").html(l);
     		 }, {  'regex':regex, 'term':$(this).find('#getCv').val(), 'region':fDisplay.srcFeature }, 
     		 fDisplay, { 'goDialog':$(this) });
     	}
		},
		Cancel: function() {
			$(this).dialog('close');
		}
	}});
    
    var searchTable = 
    	'<table>'+
    	'<tr><td><input type="radio" name="rdio" value="gene" checked="checked" />Gene Name:</td>'+
    	    '<td><input id="gotoFeature" type="text" value="" onclick="$(\'input[value=gene]:radio\').attr(\'checked\', true);"/></td></tr>' +
    	'<tr><td><input type="radio" name="rdio" value="base" />Base Number:</td>'+
    		'<td><input id="gotoBase" type="text" value=""/ onclick="$(\'input[value=base]:radio\').attr(\'checked\', true);"></td><tr/>' +
    	'<tr><td><input type="radio" name="rdio" value="qual" />Qualifier Text:</td>'+
    		'<td><input id="getQual" type="text" value="" onclick="$(\'input[value=qual]:radio\').attr(\'checked\', true);"/></td><tr/>' +
    	'<tr><td></td>'+
    		'<td><input type="checkbox" name="qualRegEx" checked="true" />using wildcard</td><tr/>' +
    	'<tr><td><input type="radio" name="rdio" value="cvs" />Controlled Vocabulary Text:</td>'+
    		'<td><input id="getCv" type="text" value="" onclick="$(\'input[value=cvs]:radio\').attr(\'checked\', true);"/></td><tr/>' +
    		'<tr><td></td>'+
    		'<td><input type="checkbox" name="cvRegEx" checked="true" />using wildcard</td><tr/>' +
    	'</table>';
    
    $("div#GO").html(searchTable);

    $("#open").click(function(event){
    	$("div#GO").dialog( "close" );
    });
}