var translation_table = new Array();

var translation_table_default = new Array (
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

var start_codons_1 = new Array ('ATG');

// For the following Genetic Code tables the differences
// from the Standard Code are given.

//2. Vertebrate Mitochondrial Code
translation_table[1] = new Array(2);
translation_table[1][0] = new Array('AGA', 'AGG','ATA', 'TGA');
translation_table[1][1] = new Array('*',   '*',  'M',   'W');
var start_codons_2 = new Array ('ATG');

// 3. Yeast Mitochondrial Code
translation_table[2] = new Array(2);
translation_table[2][0] = new Array('ATA', 'CTT', 'CTC', 'CTA', 'CTG', 'TGA');
translation_table[2][1] = new Array('M',   'T',   'T',   'T',   'T',   'W');
var start_codons_3 = new Array('ATA', 'ATG');

// 4. Mold, Protozoan, and Coelenterate Mitochondrial Code and the
//    Mycoplasma/Spiroplasma Code
translation_table[3] = new Array(2);
translation_table[3][0] = new Array('TGA');
translation_table[3][1] = new Array('W');
var start_codons_4 =  new Array('ATG');

// 5. Invertebrate Mitochondrial Code
translation_table[4] = new Array(2);
translation_table[4][0] = new Array('AGA', 'AGG', 'ATA', 'TGA');
translation_table[4][1] = new Array('S',   'S',   'M',   'W');
var start_codons_5 = new Array('ATG', 'ATA', 'ATT');

// 6. Ciliate, Dasycladacean and Hexamita Nuclear Code
translation_table[5] = new Array(2);
translation_table[5][0] = new Array('TAA', 'TAG');
translation_table[5][1] = new Array('Q',   'Q');
var start_codons_6 = new Array('ATG');

// 9. Echinoderm and Flatworm Mitochondrial Code
translation_table[8] = new Array(2);
translation_table[8][0] = new Array('AAA', 'AGA', 'AGG', 'TGA');
translation_table[8][1] = new Array('N',   'S',   'S',   'W');
var start_codons_9 = new Array('ATG', 'GTG');

// 10. Euplotid Nuclear Code
translation_table[9] = new Array(2);
translation_table[9][0] = new Array('TGA');
translation_table[9][1] = new Array('C');
var start_codons_10 = new Array('ATG');

// 11. Bacterial and Plant Plastid 
translation_table[10] = new Array(2);
translation_table[10][0] = new Array();
var start_codons_11 = new Array('ATG', 'GTG', 'TTG');

// 12. Alternative Yeast Nuclear Code
translation_table[11] = new Array(2);
translation_table[11][0] = new Array('CTG');
translation_table[11][1] = new Array('S');
var start_codons_12 = new Array('CTG', 'ATG');

// 13.  Ascidian Mitochondrial Code
translation_table[12] = new Array(2);
translation_table[12][0] = new Array('AGA', 'AGG', 'ATA', 'TGA');
translation_table[12][1] = new Array('G',   'G',   'M',   'W');
var start_codons_13 = new Array('ATG');

// 14. Alternative Flatworm Mitochondrial Code
translation_table[13] = new Array(2);
translation_table[13][0] = new Array('AAA', 'AGA', 'AGG', 'TAA', 'TGA');
translation_table[13][1] = new Array('N',   'S',   'S',   'Y',   'W');
var start_codons_14 = new Array('ATG');

// 15. Blepharisma
translation_table[14] = new Array(2);
translation_table[14][0] = new Array('TAG');
translation_table[14][1] = new Array('Q');
var start_codons_15 = new Array('ATG');

// 16. Chlorophycean Mitochondrial
translation_table[15] = new Array(2);
translation_table[15][0] = new Array('TAG');
translation_table[15][1] = new Array('L');
var start_codons_16 = new Array('ATG');

// 21. Trematode Mitochondrial
translation_table[20] = new Array(2);
translation_table[20][0] = new Array('TGA', 'ATA', 'AAA', 'AGA', 'AGG');
translation_table[20][1] = new Array('W',   'M',   'N',   'S',   'S');
var start_codons_21 = new Array('ATG', 'GTG');

// 22. Scenedesmus obliquus mitochondrial
translation_table[21] = new Array(2);
translation_table[21][0] = new Array('TCA', 'TAG');
translation_table[21][1] = new Array('*',   'L');
var start_codons_22 = new Array('ATG');

// 23. Thraustochytrium Mitochondrial
translation_table[21] = new Array(2);
translation_table[21][0] = new Array('TTA');
translation_table[21][1] = new Array('*');
var start_codons_23 = new Array('ATT', 'ATG', 'GTG');

var codon_translation_array = translation_table_default;

function setTranslationTable(tableIndex) {
	debugLog("setTranslationTable "+tableIndex);
	tableIndex--;
	codon_translation_array = translation_table_default;
	if(tableIndex == 0)
	  return;
	
    for(var i = 0; i < translation_table[tableIndex][0].length; ++i) {
      var cod_plus_aa = translation_table[tableIndex][0][i];
      var codon_index = getIndexOfBase(cod_plus_aa.charAt(0)) * 16 +
                        getIndexOfBase(cod_plus_aa.charAt(1)) * 4 +
                        getIndexOfBase(cod_plus_aa.charAt(2));

      debugLog(cod_plus_aa+" "+translation_table[tableIndex][1][i]+"  "+codon_index+"  "+
    		  codon_translation_array[codon_index]);

      codon_translation_array[codon_index] = translation_table[tableIndex][1][i];
    }
}

function getIndexOfBase(base) {
  switch(base) {
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
  switch(base) {
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

function getTranslation(sequence, phase) {
	var aa = "";
	for(var i=phase;i<sequence.length; i+=3) {  
		  var this_aa = getCodonTranslation(sequence.charAt(i), 
	  			  sequence[i+1], 
	  			  sequence[i+2]);
		  if(i == sequence.length-3 && isStopCodon(this_aa))
			  break;
		  aa += this_aa;
	}

    // a very short feature
    if(aa.length == 0) 
      return amino_acids;

    // handle /transl_except
    //final AminoAcidSequence fixed_amino_acids =
    //  fixTranslationExceptions();

    //if(isCDS() && !isPartialCDS() && hasValidStartCodon()) {
    //  // translation should always start with M
    //  if(aa[0] != 'M')
    //    final String aa = 'M' + aa.substring(1);
    //}
 
  return aa;
}

function isStopCodon(aa) {
  if(aa == '#' || aa == '*' || aa == '+') 
    return true;
  else 
    return false;
}


