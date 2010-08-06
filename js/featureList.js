
function handleFeatureListClick(fDisplay, event) {
	if (! event.shiftKey ) {
		deselectAllFeatures(fDisplay)
	}
	
	var name = $(event.target).attr('id').replace(/:LIST$/,'');
	selectFeature(name, fDisplay);
}

function handleFeatureListDoubleClick(fDisplay, id) {
	var name = id.replace(/:LIST$/,'');
	centerOnFeature(fDisplay, name);
}

function featureListEvents(fDisplay) {
	$('#featureList').single_double_click(handleFeatureListClick, handleFeatureListDoubleClick, fDisplay, 500);
}


function positionFeatureList(featureDisplay) {
	var ghgt = $('#graph').height();
	var top = featureDisplay.marginTop+(featureDisplay.frameLineHeight*19.5)+ghgt; 
	
    var cssObj = {
			 'margin-left': margin+'px',
			 'margin-right': margin+'px',
			 'position':'absolute',
			 'width': displayWidth+'px',
			 'top': top+'px'
	};
	
	$('#featureList').css(cssObj);
}

function setupFeatureList(features, exonMap, exonParent, featureDisplay, append) {
	positionFeatureList(featureDisplay);
	if(!append) {
		$('#featureList').html('<table id="featureListTable" class="tablesorter" cellspacing="1"></table>');
		$('#featureListTable').append('<thead><tr><th>Name</th><th>Type</th><th>Feature Start</th><th>Feature End</th></tr></thead>');
		$('#featureListTable').append('<tbody>');
	}
	
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
		
		$('#featureListTable').append('<tr>'+
				'<td id="'+exons[0].feature+':LIST">'+name+'</td>'+
				'<td>'+type+'</td>'+
				'<td>'+fmin+'</td>'+
				'<td>'+fmax+'</td>'+
				//'<td id="'+feature.feature+':PROPS"></td>'+
				'</tr>');
	}
}

function appendFeatureToList(feature) {
	var s = parseInt(feature.start)+1;
	$('#featureListTable').append('<tr>'+
			'<td id="'+feature.feature+':LIST">'+feature.feature+'</td>'+
			'<td>'+feature.type+'</td>'+
			'<td>'+s+'</td>'+
			'<td>'+feature.end+'</td>'+
			//'<td id="'+feature.feature+':PROPS"></td>'+
			'</tr>');
}