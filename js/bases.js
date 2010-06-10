
function complement(base) {
    switch (base) {
    case 'A': return 'T';
    case 'T': case 'u': case 'U': return 'A';
    case 'G': return 'C';
    case 'C': return 'G';
    case 'R': return 'Y';
    case 'Y': return 'R';
    case 'K': return 'M';
    case 'M': return 'K';
    case 'S': return 'S';
    case 'W': return 'W';
    case 'B': return 'V';
    case 'D': return 'H';
    case 'H': return 'D';
    case 'V': return 'B';
    case 'N': return 'N';
    case 'X': return 'X';
    default:
      return '@';
    }
}

function calculateStopCodons(featureDisplay, stops1, stops2, stops3, codon1, codon2, codon3, strand) {
	var leftBase = featureDisplay.leftBase;
	var sequence = featureDisplay.sequence;
	var basesDisplayWidth = featureDisplay.basesDisplayWidth;
	
    var index = sequence.indexOf(codon1, 0);
    var firstInd = index;
    
    while(index >= 0 && index < basesDisplayWidth)
    {
    	var frame;
    	if(strand == -1) {
    		var reversePos = featureDisplay.sequenceLength-(index+leftBase+1);
    		frame = 3 - ((reversePos+3)-1) % 3 -1;
    	}	
    	else {
    		frame = (index + leftBase -1 ) % 3;
    	}
    		
    	index++;
    	if(frame == 0)	
    	  stops1.push(index);
    	else if(frame == 1)
    	  stops2.push(index);
    	else
    	  stops3.push(index);
    	index = sequence.indexOf(codon1, index+1);
    }
    
    index = sequence.indexOf(codon2, 0);
    while(index >= 0 && index < basesDisplayWidth)
    {
    	var frame;
    	if(strand == -1) {
    		var reversePos = featureDisplay.sequenceLength-(index+leftBase+1);
    		frame = 3 - ((reversePos+3)-1) % 3 -1;
    	}	
    	else {
    		frame = (index + leftBase -1 ) % 3;
    	}
    	
    	index++;
    	if(frame == 0)	
      	  stops1.push(index);
      	else if(frame == 1)
      	  stops2.push(index);
      	else
      	  stops3.push(index);
    	index = sequence.indexOf(codon2, index+1);
    }

    index = sequence.indexOf(codon3, 0);
    while(index >= 0 && index < basesDisplayWidth)
    {
    	var frame;
    	if(strand == -1) {
    		var reversePos = featureDisplay.sequenceLength-(index+leftBase+1);
    		frame = 3 - ((reversePos+3)-1) % 3 -1;
    	}	
    	else {
    		frame = (index + leftBase -1 ) % 3;
    	}
    	
    	index++;
    	if(frame == 0)	
      	  stops1.push(index);
      	else if(frame == 1)
      	  stops2.push(index);
      	else
      	  stops3.push(index);
    	index = sequence.indexOf(codon3, index+1);
    }
}