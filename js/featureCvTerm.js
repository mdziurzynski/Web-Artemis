
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
		   var cvName = featurecvterms[j].cv.name;
		   if(cvName == product_cv) {
			   $("div#DISP_PRODUCT"+escapeId(featureSelected)).append(
				   "<strong>Product : </strong><br />"+featurecvterms[j].name+"<br /><br />");
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
		   $("div#DISP_CV"+escapeId(featureSelected)).append(
				   "<strong>Gene Ontology : </strong><br />");
	}

	for(var i=0; i<featureCvTerms.length; i++) {	
		var featurecvterms = featureCvTerms[i].terms;
		for(var j=0; j<featurecvterms.length; j++) {
		   var cvName = featurecvterms[j].cv.name;
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
			   $("div#DISP_CV"+escapeId(featureSelected)).append(
					   '<a href="javascript:void(0)" onclick="window.open(\'http://www.genedb.org/cgi-bin/amigo/term-details.cgi?term=GO:'+
							   featurecvterms[j].accession+'\');">GO:'+
					   featurecvterms[j].accession+'</a>'+aspect+'; '+featurecvterms[j].name+'; ');
			   showFeatureProps(featurecvterms[j], featureSelected, "DISP_CV");
			   showFeatureDbXRefs(featurecvterms[j].dbxrefs, featureSelected, "DISP_CV");
			   showFeaturePubs(featurecvterms[j].pubs, featureSelected, "DISP_CV");
			   $("div#DISP_CV"+escapeId(featureSelected)).append("<br />");
		   }
		}
	}
    
    // other
	var ccHead = false;
    for(var i=0; i<featureCvTerms.length; i++) {	
		var featurecvterms = featureCvTerms[i].terms;
		for(var j=0; j<featurecvterms.length; j++) {
		   var cvName = featurecvterms[j].cv.name;
		   if(cvName == 'genedb_products')
			   continue;
		   
		   for(var k=0; k<go.length; k++) {
			   if(go[k][0] == cvName) {
				   cvName = 'GO';
			   }
		   }

		   if(cvName != 'GO' && cvName != 'annotation_change') {
			   if(!ccHead) {
				   ccHead = true;
				   $("div#DISP_CV"+escapeId(featureSelected)).append(
				   "<br /><strong>Controlled Curation : </strong><br />");
			   }
			   $("div#DISP_CV"+escapeId(featureSelected)).append(
				   cvName+"="+featurecvterms[j].name+'; ');

			   showFeatureProps(featurecvterms[j], featureSelected, "DISP_CV");
			   showFeatureDbXRefs(featurecvterms[j].dbxrefs, featureSelected, "DISP_CV");
			   showFeaturePubs(featurecvterms[j].pubs, featureSelected, "DISP_CV");
			   $("div#DISP_CV"+escapeId(featureSelected)).append("<br />");
		   }
		}
    }
}

function showFeatureProps(featurecvterm, featureSelected, prefix) {
	var featureCvTermProps = featurecvterm.props;
	for(var k=0; k<featureCvTermProps.length; k++) {
		   $("div#"+prefix+escapeId(featureSelected)).append(
				   featureCvTermProps[k].type.cv.name+"="+featureCvTermProps[k].value+"; ");
	}	
}

function showFeatureDbXRefs(featuredbxrefs, featureSelected, prefix) {
	for(var k=0; k<featuredbxrefs.length; k++) {
		if(featuredbxrefs[k].database == 'PlasmoDB') {
			$("div#"+prefix+escapeId(featureSelected)).append(
				   '<a href="javascript:void(0)" onclick="window.open(\'http://plasmodb.org/plasmodb/servlet/sv?page=gene&source_id='+
				   featuredbxrefs[k].accession+'\');">'+
				   featuredbxrefs[k].database+":"+featuredbxrefs[k].accession+'</a>; ');
		} else
			$("div#"+prefix+escapeId(featureSelected)).append(
				featuredbxrefs[k].database+":"+featuredbxrefs[k].accession+'; ');
	}
}


function showFeaturePubs(pubs, featureSelected, prefix) {

	for(var k=0; k<pubs.length; k++) {
		   if(pubs[k].database == 'PMID') {
			   $("div#"+prefix+escapeId(featureSelected)).append(
				   '<a href="javascript:void(0)" onclick="window.open(\'http://www.ncbi.nlm.nih.gov/pubmed/'+
				   pubs[k].accession+'\');">'+
				   pubs[k].database+":"+pubs[k].accession+'</a>; ');
		   } else
			   $("div#"+prefix+escapeId(featureSelected)).append(
					   pubs[k].database+":"+pubs[k].accession+';');
	}
}
