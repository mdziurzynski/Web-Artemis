
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
					   featurecvterms[j].accession+'</a>'+aspect+'; '+featurecvterms[j].cvterm);
			   showFeatureProps(featurecvterms[j], featureSelected);
			   showFeatureCvTermDbXRefs(featurecvterms[j], featureSelected);
			   showFeatureCvTermPubs(featurecvterms[j], featureSelected);
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
				   cvName+"="+featurecvterms[j].cvterm);

			   showFeatureProps(featurecvterms[j], featureSelected);
			   showFeatureCvTermDbXRefs(featurecvterms[j], featureSelected);
			   showFeatureCvTermPubs(featurecvterms[j], featureSelected);
			   $("div#DISP"+escapeId(featureSelected)).append("<br />");
		   }
		}
    }
}

function showFeatureProps(featurecvterm, featureSelected) {
	var featureCvTermProps = featurecvterm.props;
	for(var k=0; k<featureCvTermProps.length; k++) {
		   $("div#DISP"+escapeId(featureSelected)).append(
				   "; "+featureCvTermProps[k].proptype+"="+featureCvTermProps[k].prop);
	}	
}

function showFeatureCvTermDbXRefs(featurecvterm, featureSelected) {
	var featureCvTermDbXRefs = featurecvterm.dbxrefs;
	for(var k=0; k<featureCvTermDbXRefs.length; k++) {
		$("div#DISP"+escapeId(featureSelected)).append(
			   "; "+featureCvTermDbXRefs[k].database+"="+featureCvTermDbXRefs[k].accession);
	}
}


function showFeatureCvTermPubs(featurecvterm, featureSelected) {
	var featureCvTermPubs = featurecvterm.pubs;
	for(var k=0; k<featureCvTermPubs.length; k++) {
		   if(featureCvTermPubs[k].database == 'PMID') {
			   $("div#DISP"+escapeId(featureSelected)).append(
				   '; <a href="javascript:void(0)" onclick="window.open(\'http://www.ncbi.nlm.nih.gov/pubmed/'+
				   featureCvTermPubs[k].accession+'\');">'+
				   featureCvTermPubs[k].database+"="+featureCvTermPubs[k].accession);
		   } else
			   $("div#DISP"+escapeId(featureSelected)).append(
					   "; "+featureCvTermPubs[k].database+"="+featureCvTermPubs[k].accession);
	}
}
