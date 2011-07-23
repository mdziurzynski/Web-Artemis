//SETTING UP OUR POPUP  
//0 means disabled; 1 means enabled;  
var popupStatus = 0;

$.fn.popup_enter_out = function(enter_callback, out_callback) {
	    $(this).bind("mouseenter", function(event) {
	    	enter_callback.call(null, event);
        });
	    
	    $(this).bind("mouseout", function(event) {
	    	out_callback.call(null, event);
	    });
}

//loading popup
function loadPopup(txt,x,y, time){
 if(time == undefined)
	 time = 8000;
 positionPopup(x,y);
 
 $(document).appendTo('<div id="popupContact"><div id="popupTxt"></div></div>');
 
//loads popup only if it is disabled  
 $("#popupContact").html(txt);
 $("#popupContact").fadeIn("fast");
 
 setTimeout(function(){ 
	 disablePopup(); 
  }, time ); 
}

function disablePopup(){  
  //disables popup only if it is enabled  
  $("#popupContact").fadeOut("fast", function(e) {
	  $("#popupContact").remove();
  });
}  

//centering popup  
function positionPopup(x,y){  
	$("#popupContact").css({ "top": y,  "left": x });
}

//CLOSING POPUP
//Press Escape event!
$(document).keypress(function(e){
  if(e.keyCode==27){
    disablePopup();
  }
});

