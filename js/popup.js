//SETTING UP OUR POPUP  
//0 means disabled; 1 means enabled;  
var popupStatus = 0;

//loading popup with jQuery magic!  
function loadPopup(txt,x,y){
 positionPopup(x,y);
//loads popup only if it is disabled  
 $("#popupTxt").html(txt);
 $("#popupContact").fadeIn("slow");
}

//disabling popup with jQuery magic!  
function disablePopup(){  
  //disables popup only if it is enabled  
  $("#backgroundPopup").fadeOut("slow");  
  $("#popupContact").fadeOut("slow");  
}  

//centering popup  
function positionPopup(x,y){  
	$("#popupContact").css({  
		 "position": "absolute",  
		 "top": y,  
		 "left": x  
		 });
}

//CLOSING POPUP
//Press Escape event!
$(document).keypress(function(e){
  if(e.keyCode==27){
    disablePopup();
  }
});