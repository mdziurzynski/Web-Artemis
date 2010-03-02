
var codon_translation_array = new Array (
		'F', 'F', 'L', 'L',
	    'S', 'S', 'S', 'S',
	    'Y', 'Y', '#', '+',
	    'C', 'C', '*', 'W',

	    'L', 'L', 'L', 'L',
	    'P', 'P', 'P', 'P',
	    'H', 'H', 'Q', 'Q',
	    'R', 'R', 'R', 'R',

	    'I', 'I', 'I', 'M',
	    'T', 'T', 'T', 'T',
	    'N', 'N', 'K', 'K',
	    'S', 'S', 'R', 'R',

	    'V', 'V', 'V', 'V',
	    'A', 'A', 'A', 'A',
	    'D', 'D', 'E', 'E',
	    'G', 'G', 'G', 'G'
	  );

function getCodonTranslation(first_letter, second_letter, third_letter) {
  var first_index = getIndexOfBase(first_letter);
  if(first_index >= 4)
    return '.';

  var second_index = getIndexOfBase(second_letter);
  if(second_index >= 4) 
    return '.';

  var third_index = getIndexOfBase(third_letter);
  if(third_index >= 4) 
    return '.';

  var codon_index = first_index * 16 + second_index * 4 + third_index;
  return codon_translation_array[codon_index];
}

function getIndexOfBase(base) { 
  switch(base) 
  {
    case 'C':
      return 1;
    case 'A':
      return 2;
    case 'G':
      return 3;
    case 'T':
    case 'U': 
      return 0;
  }  
  return 4;
}


