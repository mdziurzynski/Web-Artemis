
function handleFeatureListClick(fDisplay, event) {
	if (! event.shiftKey ) {
		deselectAllFeatures(fDisplay);
	}

	var name = getSelectedId(event);
	selectFeature(name, fDisplay);
}

function handleFeatureListDoubleClick(fDisplay, event, featureSelected) {
	var name = getSelectedId(event);
	centerOnFeature(fDisplay, event, name);
}

function getSelectedId(event) {
	var name;
	if($(event.target).attr('id') == "") {
		name = getFirstTd(event).attr('id').replace(/:LIST$/,'');
	} else {
		name = $(event.target).attr('id').replace(/:LIST$/,'');
	}
	return name;
}

function getFirstTd(event) {
	return $(event.target.parentNode);
}

function featureListEvents(fDisplay) {
	$('#featureList').single_double_click(handleFeatureListClick, handleFeatureListDoubleClick, fDisplay, 500);
	
	$(document).keydown(function (e) {
		    if(e.which == $.ui.keyCode.DOWN) {
		    	selectNextRow(fDisplay);
		        return false;
		    } else if(e.which == $.ui.keyCode.UP) {
		    	selectPrevRow(fDisplay);
		        return false;
		    }
	});
}


function positionFeatureList(featureDisplay) {
	var ghgt = 0;
	if($('#graph').children().length > 0)
		ghgt = $('#graph').height();

	var top = featureDisplay.marginTop+(featureDisplay.frameLineHeight*19.5)+ghgt;
	var hgt = $(document).height() - top;
    var cssObj = {
			 'margin-left': margin+'px',
			 'margin-right': margin+'px',
			 'position':'absolute',
			 'width': displayWidth+'px',
			 'top': top+'px',
			 'overflow': 'auto', 'height': hgt+'px'
	};
	
	$('#featureList').css(cssObj);
}

function setupFeatureList(features, exonMap, exonParent, featureDisplay, append) {
	
	if(!append) {
		$('#featureList').html('<table id="featureListTable" class="tablesorter" cellspacing="1"></table>');
		$('#featureListTable').append('<thead><tr><th>Name</th><th>Type</th><th>Feature Start</th><th>Feature End</th></tr></thead>');
		$('#featureListTable').append('<tbody>');
	}
	positionFeatureList(featureDisplay);
	
	for(var i=0; i<features.length; i++) {
		var feature = features[i];
		if(feature.type != 'exon' && feature.type != 'pseudogenic_exon')
		  appendFeatureToList(feature);
		else {
		  appendExonsToList(exonMap[feature.part_of]);
		  exonMap[feature.part_of] = undefined;
		}
	}

	if(!append) {
		$('#featureListTable').append('</tbody>');
		$('#featureListTable').tablesorter(); 
	}
}

function appendExonsToList(exons) {
	if(exons != undefined) {
		var fmin = parseInt(exons[0].start)+1;
		var fmax = parseInt(exons[0].end);
		var name = exons[0].feature;
		
		for(var j=1; j<exons.length; j++) {
			var thisFmin = parseInt(exons[j].start)+1;
			var thisFmax = parseInt(exons[j].end);
			if(thisFmin < fmin)
				fmin = thisFmin;
			if(thisFmax > fmax)
				fmax = thisFmax;

			name += ','+exons[j].feature.match(/\d+$/);
		}
		
		var type;
		if(exons[0].type == 'exon')
			type = "CDS";
		else
			type = "pseudogene";
		
		$('#featureListTable').append('<tr id="'+exons[0].feature+':LIST">'+
				'<td>'+name+'</td>'+
				'<td>'+type+'</td>'+
				'<td>'+fmin+'</td>'+
				'<td>'+fmax+'</td>'+
				//'<td id="'+feature.feature+':PROPS"></td>'+
				'</tr>');
	}
}

function appendFeatureToList(feature) {
	var s = parseInt(feature.start)+1;
	$('#featureListTable').append('<tr id="'+feature.feature+':LIST">'+
			'<td>'+feature.feature+'</td>'+
			'<td>'+feature.type+'</td>'+
			'<td>'+s+'</td>'+
			'<td>'+feature.end+'</td>'+
			//'<td id="'+feature.feature+':PROPS"></td>'+
			'</tr>');
}

function selectNextRow(fDisplay) {
	var rows = $('table.#featureListTable > tbody > tr');
	for(var i=0; i<rows.length-1; i++) {
		var cell = $(rows[i]).children()[1];
	    if( $(cell).css('background-color') == 'rgb(200, 200, 200)' ) {
	    	deselectAllFeatures(fDisplay);
	    	selectFromList($(rows[i]).next(), fDisplay);
	    	return;
	    }
	}
}

function selectPrevRow(fDisplay) {
	var rows = $('table.#featureListTable > tbody > tr');
	for(var i=0; i<rows.length; i++) {
		var cell = $(rows[i]).children()[1];
	    if( $(cell).css('background-color') == 'rgb(200, 200, 200)' ) {
	    	if(i == 0)
	    		return;
	    	deselectAllFeatures(fDisplay);
	    	selectFromList($(rows[i]).prev(), fDisplay);
	    	return;
	    }
	}
}

// select the given table row and associated feature
function selectFromList(tr, fDisplay) {
	var td = $(tr).children()[0];
	var name = $(tr).attr('id').replace(/:LIST$/,'');

	if($(td).text().match(/(\d+,)+\d+$/))
		selectFeature(name, fDisplay);
	else {
		selectFeatureExact(name, fDisplay);
		selectInListExact(name);
	}
}

function selectInList(featureSelected) {
	if(featureSelected.match(/\d+$/g)) {
		// select exons of same gene
		var wildcardSearchString = featureSelected.replace(/:\d+$/g,'');
    	var selId = "[id*=" + wildcardSearchString +"]";
    	$('table.#featureListTable > tbody').find(selId).children().each(function(index) {
    	    if(index == 0)
    	    	return;
    	    $(this).css('background-color', 'rgb(200, 200, 200)' );
    	});	
    	
	} else {
		selectInListExact(featureSelected);		
	}
}

function selectInListExact(featureSelected) {
	$('table.#featureListTable > tbody > tr#'+escapeId(featureSelected+':LIST')).children().each(function(index) {
	    if(index == 0)
	    	return;
	    $(this).css('background-color', 'rgb(200, 200, 200)' );
	});	
}

function deSelectAllInList() {
	$('table.#featureListTable > tbody > tr').each(function(index) {
	    $(this).children().each(function(index) {
		    if(index == 0)
		    	return;
		    $(this).css('background-color', '#FFFFFF' );
		});	
	});	
}