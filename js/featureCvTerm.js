
var go = [ ['cellular_component', 'C'], 
	       ['biological_process', 'P'], 
	       ['molecular_function', 'F'] ];
var product_cv = 'genedb_products';
	
function showFeatureCvTerm(featureCvTerms, featureSelected) {
	var goHead = false;
	
	// product
	for(var i=0; i<featureCvTerms.length; i++) {	
		var featurecvterms = featureCvTerms[i].terms;
		for(var j=0; j<featurecvterms.length; j++) {
		   var cvName = featurecvterms[j].cv;
		   if(cvName == product_cv) {
			   $("div#DISP"+escapeId(featureSelected)).append(
				   "<br /><strong>Product : </strong><br />"+featurecvterms[j].cvterm+"<br />");
		   }
		   
		   for(var k=0; k<go.length; k++) {
			   if(go[k][0] == cvName) {
				   goHead = true;
			   }
		   }
		}
	}
	
	// GO
	if(goHead) {
		   $("div#DISP"+escapeId(featureSelected)).append(
				   "<br /><strong>Gene Ontology : </strong><br />");
	}

	for(var i=0; i<featureCvTerms.length; i++) {	
		var featurecvterms = featureCvTerms[i].terms;
		for(var j=0; j<featurecvterms.length; j++) {
		   var cvName = featurecvterms[j].cv;
		   if(cvName == 'genedb_products')
			   continue;

		   var aspect = '';
		   for(var k=0; k<go.length; k++) {
			   if(go[k][0] == cvName) {
				   aspect = '; aspect='+go[k][1];
				   cvName = 'GO';
			   }
		   }

		   if(cvName == 'GO') {
			   $("div#DISP"+escapeId(featureSelected)).append(
					   '<a href="javascript:void(0)" onclick="window.open(\'http://www.genedb.org/cgi-bin/amigo/term-details.cgi?term=GO:'+
							   featurecvterms[j].accession+'\');">GO:'+
					   featurecvterms[j].accession+'</a>'+aspect+'; '+featurecvterms[j].cvterm+'; ');
			   showFeatureProps(featurecvterms[j], featureSelected);
			   showFeatureDbXRefs(featurecvterms[j].dbxrefs, featureSelected);
			   showFeaturePubs(featurecvterms[j].pubs, featureSelected);
			   $("div#DISP"+escapeId(featureSelected)).append("<br />");
		   }
		}
	}
    
    // other
	var ccHead = false;
    for(var i=0; i<featureCvTerms.length; i++) {	
		var featurecvterms = featureCvTerms[i].terms;
		for(var j=0; j<featurecvterms.length; j++) {
		   var cvName = featurecvterms[j].cv;
		   if(cvName == 'genedb_products')
			   continue;
		   
		   for(var k=0; k<go.length; k++) {
			   if(go[k][0] == cvName) {
				   cvName = 'GO';
			   }
		   }
		   
		   if(cvName != 'GO') {
			   if(!ccHead) {
				   ccHead = true;
				   $("div#DISP"+escapeId(featureSelected)).append(
				   "<br /><strong>Controlled Curation : </strong><br />");
			   }
			   $("div#DISP"+escapeId(featureSelected)).append(
				   cvName+"="+featurecvterms[j].cvterm+'; ');

			   showFeatureProps(featurecvterms[j], featureSelected);
			   showFeatureDbXRefs(featurecvterms[j].dbxrefs, featureSelected);
			   showFeaturePubs(featurecvterms[j].pubs, featureSelected);
			   $("div#DISP"+escapeId(featureSelected)).append("<br />");
		   }
		}
    }
}

function showFeatureProps(featurecvterm, featureSelected) {
	var featureCvTermProps = featurecvterm.props;
	for(var k=0; k<featureCvTermProps.length; k++) {
		   $("div#DISP"+escapeId(featureSelected)).append(
				   featureCvTermProps[k].proptype+"="+featureCvTermProps[k].prop+"; ");
	}	
}

function showFeatureDbXRefs(featuredbxrefs, featureSelected) {
	for(var k=0; k<featuredbxrefs.length; k++) {
		$("div#DISP"+escapeId(featureSelected)).append(
				featuredbxrefs[k].database+":"+featuredbxrefs[k].accession+'; ');
	}
}


function showFeaturePubs(pubs, featureSelected) {

	for(var k=0; k<pubs.length; k++) {
		   if(pubs[k].database == 'PMID') {
			   $("div#DISP"+escapeId(featureSelected)).append(
				   '<a href="javascript:void(0)" onclick="window.open(\'http://www.ncbi.nlm.nih.gov/pubmed/'+
				   pubs[k].accession+'\');">'+
				   pubs[k].database+":"+pubs[k].accession+'</a>; ');
		   } else
			   $("div#DISP"+escapeId(featureSelected)).append(
					   pubs[k].database+":"+pubs[k].accession+';');
	}
}
