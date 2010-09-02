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
function loadPopup(txt,x,y){
 positionPopup(x,y);
//loads popup only if it is disabled  
 $("#popupContact").html(txt);
 $("#popupContact").fadeIn("fast");
 
 setTimeout(function(){ 
	 disablePopup(); 
  }, 8000 ); 
}

function disablePopup(){  
  //disables popup only if it is enabled  
  $("#popupContact").fadeOut("fast");  
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

