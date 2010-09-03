$.fn.single_double_click = function(single_click_callback, double_click_callback, fDisplay, timeout) {
return this.each(function() {
    var clicks = 0, self = this;
    if ($.browser.msie) { // ie triggers dblclick instead of click if they are fast
        $(this).bind("dblclick", function(event) {
            clicks = 2;
            double_click_callback.call(null, fDisplay, event, $(event.target).attr('id'), fDisplay.srcFeature);
        });
        $(this).bind("click", function(event) {
            setTimeout(function() {
                if (clicks != 2) {
                    single_click_callback.call(null, fDisplay, event, $(event.target).attr('id'));
                }
                clicks = 0;
            }, timeout || 300);
        });
    } else {
        $(this).bind("click", function(event) {
            clicks++;
            if (clicks == 1) {
                setTimeout(function() {
                    if (clicks == 1) {
                        single_click_callback.call(null, fDisplay, event, $(event.target).attr('id'));
                    } else {
                        double_click_callback.call(null, fDisplay, event, $(event.target).attr('id'), fDisplay.srcFeature);
                    }
                    clicks = 0;
                }, timeout || 300);
            }
        });
    }
});
}



function drawString(ctx, text, posX, posY, textColor, rotation, font, fontSize) {
	var lines = text.split("\n");
	if (!rotation) rotation = 0;
	if (!font) font = "'serif'";
	if (!fontSize) fontSize = 16;
	if (!textColor) textColor = '#000000';
	ctx.save();
	ctx.font = fontSize + "px " + font;
	ctx.fillStyle = textColor;
	ctx.translate(posX, posY);
	ctx.rotate(rotation * Math.PI / 180);
	for (i = 0; i < lines.length; i++) {
	  ctx.fillText(lines[i],0, i*fontSize);
	}
	ctx.restore();
}

//Read a page's GET URL variables and return them as an associative array
function getUrlVars() {
    var vars = [], hash;
    var hashes = window.location.href.slice(window.location.href.indexOf('?') + 1).split("#")[0].split('&');
    for(var i = 0; i < hashes.length; i++)
    {
        hash = hashes[i].split('=');
        vars.push(hash[0]);
        vars[hash[0]] = hash[1];
    }
    return vars;
}

function getSelectedFeatureElements() {
	var elmts = $('.feat, .featCDS, .featGene, .featGreen, .featPseudo')  // find ID's
	  .map(function() { return this; }) // get element
	  .get(); // convert to instance of Array (optional)
	
	var selectedElmts = new Array();
	for(var i=0; i<elmts.length; i++) {

		if( $(elmts[i]).css('borderLeftWidth') == '2px') {

			if( $(elmts[i]).attr('class') == 'featCDS' ||
				$(elmts[i]).attr('class') == 'featPseudo' ) {
				// if CDS of same gene ignore
				if(elmts[i].id.match(/exon:\d+$/)) {
					var wildcardSearchString = elmts[i].id.replace(/:\d+$/g,'');
					if(containsElement(selectedElmts, wildcardSearchString)) {
						debugLog(wildcardSearchString+" FOUND ALREADY");
						continue;
					}
				}
			}

			selectedElmts.push(elmts[i]);
		}
	}
	return selectedElmts;
}

function findTrackByElement(elem) {
	var parent = $(elem).parent();
	return parent.attr('id').replace(/^features\d+_/,'');
}

function deselectAllFeatures(fDisplay) {
	for(var i=0;i<fDisplay.tracks.length; i++) {
		$('#features'+fDisplay.index+'_'+fDisplay.tracks[i]).find('.feat, .featCDS, .featPseudo, .featGene, .featGreen').each(function( intIndex ){ setBorder(this, '1px'); });
  	}
	deSelectAllInList();
}

function selectFeature(featureSelected, fDisplay) {
	if(featureSelected.match(/\d+$/g)) {
		// select exons of same gene
		var wildcardSearchString = featureSelected.replace(/:\d+$/g,'');
    	var selId = "[id*=" + wildcardSearchString +"]";
    	
    	for(var i=0;i<fDisplay.tracks.length; i++) {
    	  $('#features'+fDisplay.index+'_'+fDisplay.tracks[i]).find(selId).each(
    			function( intIndex ){ setBorder(this, '2px'); });
    	}
	} else {
		selectFeatureExact(featureSelected, fDisplay);
	}

	selectInList(featureSelected);
}

function isPartial(el) {
	if($(el).css('border-right-style') == 'double' || $(el).css('border-left-style') == 'double' )
		return true;
	return false;
}

function setBorder(el, size) {
	// check for partial
	if(isPartial(el)) {
		$(el).css('border-top-width', size);
		$(el).css('border-bottom-width', size);
	} else
		$(el).css('border-width', size);
}

function selectFeatureExact(featureSelected, fDisplay) {	
	for(var i=0;i<fDisplay.tracks.length; i++) {
		setBorder( $('#features'+fDisplay.index+'_'+fDisplay.tracks[i]).find( "#"+escapeId(featureSelected) ), '2px' );
  	}
}

function getSelectedFeatureIds() {
	var IDs = $('.feat, .featCDS, .featGene, .featGreen, .featPseudo')  // find ID's
	  .map(function() { return this.id; }) // convert to set of IDs
	  .get(); // convert to instance of Array (optional)
	
	var selectedFeatureIds = new Array();
	for(var i=0; i<IDs.length; i++) {
		if($("#"+escapeId(IDs[i])).css('borderLeftWidth') == '2px') {

			if( $("#"+escapeId(IDs[i])).attr('class') == 'featCDS' ||
				$("#"+escapeId(IDs[i])).attr('class') == 'featPseudo' ) {
				// if CDS of same gene ignore
				if(IDs[i].match(/exon:\d+$/)) {
					var wildcardSearchString = IDs[i].replace(/:\d+$/g,'');
					
					if(containsId(selectedFeatureIds, wildcardSearchString)) {
						debugLog(wildcardSearchString+" FOUND ALREADY");
						continue;
					}
				}
			}

			selectedFeatureIds.push(IDs[i]);
		}
	}
	return selectedFeatureIds;
}

function containsId(arr, obj){
	for(var i = 0; i < arr.length; i++) {
	  
	  if(arr[i].indexOf(obj) > -1){
	     return true;
	  }
	}
	return false;
}

function containsElement(arr, obj){
	for(var i = 0; i < arr.length; i++) {
	  
	  if(arr[i].id.indexOf(obj) > -1){
	     return true;
	  }
	}
	return false;
}


function sortFeatures(a, b){
	//Compare "a" and "b" in some fashion, and return -1, 0, or 1
	if( (a.start - b.start) > 0) {
	  if(a.strand == 1) {
		return 1;
	  } else {
		return -1;
	  }
	}
	else if( (b.start - a.start) > 0) {
	  if(a.strand == 1) {
		return -1;
	  } else {
		return 1;
	  }
	}
	return 0;
}


function handleAjaxCalling(serviceName, ajaxFunction, dataArray, featureDisplay, options) {
	handleAjaxCallingSync(serviceName, ajaxFunction, dataArray, featureDisplay, options, true);
}

function handleAjaxCallingSync(serviceName, ajaxFunction, dataArray, featureDisplay, options, async) {
	
	if(serviceName.indexOf("sams") > 0 ) {
		var jsonUrl = webService[serviceTypeBam]+serviceName;
	} else {
		var jsonUrl = webService[serviceType]+serviceName;
	}
	
	
    debugLog(serviceName+" "+jsonUrl+ " async "+async);
    
    $.ajax({
		  url: jsonUrl,
		  data: dataArray,
		  dataType: dataType[serviceType],
		  success: function(returned) {

    	ajaxFunction(featureDisplay, returned, options);

  },
  async: async,
  beforeSend: function(XMLHttpRequest) {
      //XMLHttpRequest.setRequestHeader("Connection", "keep-alive");
  }, 
  error: function(xhr, ajaxOptions, thrownError) {
  	
  	if(xhr.status == "408") {
  		//
  		// timeout repeat call
  		handleAjaxCalling(serviceName, ajaxFunction, dataArray, featureDisplay);
  	} else {
  		alert(xhr.status+"\n"+thrownError);
  	}
  }
  });

  logJsonp(serviceName);
}

function escapeId(myid) { 
	   return myid.replace(/(:|\.|\|)/g,'\\$1');
}


function debugLog(txt) {
	if(!debug)
		return;
	
	if(window.console) {
		console.log(txt);
	} else {
        var ghgt = $('#graph').height();
		var fhgt = $('#featureList').height(); 
		var top = (50+275)+ghgt+fhgt;

		$('#logger').css('top', top+'px');
		$('#logger').append("<br />"+txt);
	}
}

function logJsonp(serviceName) {
	if(dataType[serviceType] != "jsonp") {
		return;
	}
	var $jsonScript = $('head script[src*='+serviceName+']');

    for(var i=0; i<$jsonScript.length; i++) {
    	var src = $jsonScript[i].src;
    	$jsonScript[i].onerror = function(e) {
            debugLog("ERROR :: "+src);
        }; 
        
        $jsonScript[i].onload = function(e) {
            debugLog("LOAD :: "+src);
        };
    }
}
