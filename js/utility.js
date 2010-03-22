//Read a page's GET URL variables and return them as an associative array
function getUrlVars() {
    var vars = [], hash;
    var hashes = window.location.href.slice(window.location.href.indexOf('?') + 1).split('&');
    for(var i = 0; i < hashes.length; i++)
    {
        hash = hashes[i].split('=');
        vars.push(hash[0]);
        vars[hash[0]] = hash[1];
    }
    return vars;
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

	var jsonUrl = webService[serviceType]+serviceName;
    debugLog(serviceName+" "+jsonUrl);
    $.ajax({
		  url: jsonUrl,
		  data: dataArray,
		  dataType: dataType[serviceType],
		  success: function(returned) {

    	ajaxFunction(featureDisplay, returned, options);

  },
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
	   return myid.replace(/(:|\.)/g,'\\$1');
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
