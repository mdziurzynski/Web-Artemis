
function complement(base) {
    switch (base) {
    case 'a': case 'A': return 'T';
    case 't': case 'T': case 'u': case 'U': return 'A';
    case 'g': case 'G': return 'C';
    case 'c': case 'C': return 'G';
    case 'r': case 'R': return 'Y';
    case 'y': case 'Y': return 'R';
    case 'k': case 'K': return 'M';
    case 'm': case 'M': return 'K';
    case 's': case 'S': return 'S';
    case 'w': case 'W': return 'W';
    case 'b': case 'B': return 'V';
    case 'd': case 'D': return 'H';
    case 'h': case 'H': return 'D';
    case 'v': case 'V': return 'B';
    case 'n': case 'N': return 'N';
    case 'x': case 'X': return 'X';
    default:
      return '@';
    }
}

function calculateStopCodons(leftBase, stops1, stops2, stops3, codon1, codon2, codon3, strand) {
    var index = sequence.indexOf(codon1, 0);
    var firstInd = index;
    
    while(index >= 0 && index < basesDisplayWidth)
    {
    	var frame;
    	if(strand == -1) {
    		var reversePos = sequenceLength-(index+leftBase+1);
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
    		var reversePos = sequenceLength-(index+leftBase+1);
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
    		var reversePos = sequenceLength-(index+leftBase+1);
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