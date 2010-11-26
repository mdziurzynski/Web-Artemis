var BAMFLAGS = [["Read paired", 0x1],
			    ["Read mapped in proper pair", 0x2],
			    ["Read unmapped", 0x4],
			    ["Mate unmapped", 0x8],
			    ["Read reverse strand", 0x10],
			    ["Mate reverse strand", 0x20],
			    ["First in pair", 0x40],
			    ["Second in pair", 0x80],
			    ["Not primary alignment", 0x100],
			    ["Read fails platform/vendor quality checks", 0x200],
			    ["Read is PCR or optical duplicate", 0x400]];

function printFlagHTML(flags) {
	var flagHTML = "<table>";
	for(i=0; i<BAMFLAGS.length; i++) {
		flagHTML += '<tr><td>'+BAMFLAGS[i][0]+'</td>';
    	if(BAMFLAGS[i][1] & flags)
    		flagHTML += '<td>true<td/></tr>';
    	else
    		flagHTML += '<td>false<td/></tr>';
    }
	flagHTML += "</table>";
	return flagHTML;
}

function filterFlagsDisplay(fDisplay, thisBam) {
	$("div#properties").html("<div id='bamFiler"+thisBam.bamId+"'></div>");

    var filterTable = '<table>';
    for(i=0; i<BAMFLAGS.length; i++) {
    	if(BAMFLAGS[i][1] & thisBam.flag) {
    		filterTable += 
    			'<tr><td><input type="checkbox" name="cbFilter'+i+'" checked="checked" value="'+
    			BAMFLAGS[i][1]+'"/>'+BAMFLAGS[i][0]+'</td></tr>';
    	} else {
    		filterTable += 
    			'<tr><td><input type="checkbox" name="cbFilter'+i+'" value="'+
    			BAMFLAGS[i][1]+'"/>'+BAMFLAGS[i][0]+'</td></tr>';
    	}
    }
    filterTable +='</table>';
    $("div#bamFiler"+thisBam.bamId).html(filterTable);

    $("div#bamFiler"+thisBam.bamId).dialog({ height: 385 ,
		width:450, position: 'center', title:'Filter',
		close: function(event, ui) { $(this).remove(); },
		buttons: {
		'Filter': function() {
			var cbs = $('input[name*=cbFilter]')
			  .map(function() { return this; }) // get element
			  .get(); // convert to instance of Array (optional)
			var newFlagValue = 0;
			for(i=0; i<cbs.length; i++) {
				if($(cbs[i]).is(':checked')) {
					newFlagValue |= BAMFLAGS[i][1];
				}
			}
			thisBam.flag = newFlagValue;
			drawBam(fDisplay, thisBam.bamId);
		},
		Close: function() {
			$(this).dialog('close');
		}
	}});
}
