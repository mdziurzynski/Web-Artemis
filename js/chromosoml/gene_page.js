
/*
 * Gene pages should be instantiated only when the document is ready. 
 * */
function GenePage(uniqueName, webArtemisPath, options) { 
	
	var defaults = {
		services : ["/services/"],
		hideable : ".hideable",
		erasable : ".erasable",
		links : {
			go : "http://www.genedb.org/cgi-bin/amigo/term-details.cgi",
			pub : "http://www.ncbi.nlm.nih.gov/entrez/query.fcgi?cmd=Retrieve&amp;db=PubMed&amp;dopt=Abstract&amp;list_uids="
		}, 
		evidence : {
		    'lab' : { 
		    	// Experimental Evidence
		        'EXP': 'Inferred from Experiment',
		        'IDA': 'Inferred from Direct Assay',
		        'IPI': 'Inferred from Physical Interaction',
		        'IMP': 'Inferred from Mutant Phenotype',
		        'IGI': 'Inferred from Genetic Interaction',
		        'IEP': 'Inferred from Expression Pattern'
		    }, 
		    'auto' : {
		    	// Computational Analysis Evidence
		        'ISS': 'Inferred from Sequence or Structural Similarity',
		        'ISO': 'Inferred from Sequence Orthology',
		        'ISA': 'Inferred from Sequence Alignment',
		        'ISM': 'Inferred from Sequence Model',
		        'IGC': 'Inferred from Genomic Context',
		        'IBA': 'Inferred from Biological aspect of Ancestor',
		        'IBD': 'Inferred from Biological aspect of Descendant',
		        'IKR': 'Inferred from Key Residues',
		        'IRD': 'Inferred from Rapid Divergence',
		        'RCA': 'Inferred from Reviewed Computational Analysis',
		        // Automatically-assigned Evidence
		        'IEA': 'Inferred from Electronic Annotation'
		    },
		    'journal' : {
		    	// Author Statement Evidence
		        'TAS': 'Traceable Author Statement',
		        'NAS': 'Non-traceable Author Statement',
		        // Curator Statement Evidence
		        'IC': 'Inferred by Curator',
		        'ND': 'No biological Data available'
		    }
		},
		elements : {
			gene_summary : "#gene_summary",
			properties : "#feature_properties",
			go : "#gene_ontology"
		}
	};
	
	var settings = $.extend({}, defaults, options);
	
	var self = this;
	self.usedUniqueName = uniqueName;
	
	getInfo(uniqueName, initInfo);
	
	function goLink(species) {
		return settings.links.go + "?species=GeneDB_" + species;  
	}
	
	function evidenceCategory(supplied_evidence) {
		var cat = null;
		$.each(settings.evidence, function(c, category) {
			if (cat != null)
				return;
			$.each(category, function(e, evidence) {
				if (supplied_evidence == evidence) {
					$.log("supplied_evidence == evidence");
					cat = c;
					return;
				}
			});
		});
		return cat;
	}
	
	function getInfo(uniqueName, onResult) {
		$.log("getInfo");
		var info = new FeatureInfo(uniqueName, {services : ["/services/"]}, function(){
			$.log("getInfo onResult...");
			onResult(info);
		});
	}
	
	function resetPage(name, onComplete) {
		$.log("resetPage");
		$.log("resetPage", name, settings.erasable, settings.hideable);
		
		$.log($(settings.erasable));
		$.log($(settings.hideable));
		
		$(settings.erasable).html("");
		$(settings.hideable).hide();
		
		getInfo(name, function(info) {
			setPage(info);
			onComplete(info);
		});
		
		
	}
	
	function generateSummary(info) {
		
		var hash = {};
		
		var usedUniqueName = info.uniqueName;
		
		if (info.transcript_count < 2 && info.geneUniqueName != null) {
			usedUniqueName = info.geneUniqueName;
		}
		
		var systematicName = usedUniqueName;
		
	    if (info.transcript_count > 2 && info.feature.type=="mRNA") {
	    	systematicName += " (one splice form of " + info.geneUniqueName;
	    }
	    
	    hash ["Systematic Name"] = systematicName;
	    
	    if (info.geneUniqueName != null && info.geneUniqueName != usedUniqueName) {
	    	hash["Gene Name"] = info.geneUniqueName;
	    }
	    
	    hash ["Feature Type"] = ( info.hierarchyType != null ) ? info.hierarchyType : info.feature.type.name;
	    
	    hash ["Product"] = "";
	    
	    
	    if (info.synonyms != null) {
			
			var previous_systematic_ids = [];
			var synonyms = [];
			var product_synonyms = [];
			
	    	$.each(info.synonyms, function(n,synonym) {
	    		
	    		var syn = synonym.synonym;
	    		
	    		if (synonym.synonymtype == "previous_systematic_id") {
	    			previous_systematic_ids.push(syn);
	    		} else if (synonym.synonymtype == "synonym") {
	    			synonyms.push(syn);
	    		} else if (synonym.synonymtype == "product_synonym") {
	    			product_synonyms.push(syn);
	    		}
	    		
	    		$.log(synonym.synonym, synonym.synonymtype, synonym.is_current);
	    	});
	    	
	    	if (previous_systematic_ids.length > 0)
	    		hash["Previous Systematic ID"] = previous_systematic_ids.join (", ");
	    	
	    	if (synonyms.length > 0)
	    		hash["Synonym"] = synonyms.join (", ");
	    	
	    	if (product_synonyms.length > 0)
	    		hash["Product Synonym"] = product_synonyms.join (", ");
	    	
	    }
	    
	    hash["Location"] = info.regionInfo.type.name + " " + info.regionInfo.uniqueName + "; " + info.feature.fmin + "-" + info.feature.fmax;
	    
	    hash ["See Also"] = "";
	    
	    if (info.organism.common_name == "Pchabaudi" || info.organism.common_name == "Pberghei" ) {
			hash["PlasmoDB"] = "<a href=\"http://plasmodb.org/gene/"+info.geneUniqueName+ "\" >"+info.geneUniqueName+"</a>";
			
		} else if (
			info.organism.common_name == "Lmajor" ||
			info.organism.common_name == "Linfantum" ||
			info.organism.common_name == "Lbraziliensis" ||
			info.organism.common_name == 'Tbruceibrucei927' || 
			info.organism.common_name =='Tbruceibrucei427' || 
			info.organism.common_name =='Tbruceigambiense' || 
			info.organism.common_name =='Tvivax' || 
			info.organism.common_name =='Tcruzi'
		) {
			hash["TriTrypDB"] = "<a href=\"http://tritrypdb.org/gene/"+info.geneUniqueName+ "\" >"+info.geneUniqueName+"</a>";
		}
	    
	    window.featureModel = new FeatureModel(hash);
	    window.featureSummary = new FeatureSummaryView({model : window.featureModel, el: settings.elements.gene_summary });
	    
	    
		$.log(window.featureSummary);
		
	}
	
	function generateProperties(info) {
		properties = {
				"comments" : [],
				"notes" : [],
				"curations" : [],
				"publications" : []
			};
			
			if (info.properties != null) {
	        	
	        	$.each(info.properties, function(n, feature) {
	        		$.log("prop " + feature.uniqueName);
	        		
	        		// if we have a peptide, just use that
	        		if (info.peptideName != null && info.peptideName != feature.uniqueName) {
	    				return;
	    			}
	        		
	        		$.each(feature.properties, function(p, property) {
	        			$.log(property);
	        			
	        			if (property.name == "comment") {
	        				properties.comments.push(property.value);
	        			}
	        			
	        			else if (property.name == "note") {
	        				properties.notes.push(property.value);
	        			}
	        			
	        			else if (property.name == "curation") {
	        				properties.curations.push(property.value);
	        			}
	        			
	        			propsShown=true;
	        		});
	        	});
	        	
	        }
			
			if (info.pubs != null) {
	        	
	        	$.each(info.pubs, function(n, feature) {
	        		$.log("pub? " + feature.uniqueName);
	        		// if we have a peptide, just use that
	        		if (info.peptideName != null && info.peptideName != feature.uniqueName) {
	    				return;
	    			}
	        		$.each(feature.pubs, function(p, pub) {
	        			properties.publications.push(pub.database+ ":" + pub.accession);
	        		});
	        	});
	        		
	        }
			
			$.log(properties);
			
			
			
			var propertyModel = new window.PropertyModel(properties)
			
			$.log("prepared model");
			$.log(propertyModel);
			
			window.propertySummary = new PropertyView({model : propertyModel , el: settings.elements.properties });
	}
	
	function generateGo(info) {

		
		if (info.terms != null) {
        	
			//var t = [];
			
			var terms_hash = {
					biological_process : [],
					cellular_component : [],
					molecular_function : [],
					CC_genedb_controlledcuration : [],
					pub_link : settings.links.pub,
					go_link : goLink(info.organism.common_name)
			};
			
        	$.each(info.terms, function(n, feature) {
        		$.log("term? " + feature.uniqueName);
        		
        		// if we have a peptide, just use that
        		if (info.peptideName != null && info.peptideName != feature.uniqueName) {
    				return;
    			}
        		
        		
        		
        		$.each(feature.terms, function(p, term) {
        			
        			//t.push(term);
        			
//        			$.log("term: ");
//        			
        			if (! terms_hash.hasOwnProperty(term.cv.name))
        				terms_hash[term.cv.name] = [];
        			
        			var t = {
        				name : term.name,
        				accession : term.accession,
        				pubs: term.pubs,
        				dbxrefs: term.dbxrefs
        			};
        			
        			$.each(term.props, function(pp, prop) {
    					if (prop.type.name == "evidence") {
    						t.evidence = prop.value;
    						t.evidence_category = evidenceCategory(prop.value);
    						$.log("!!!" + t.evidence_category);
    					}
    				});
        			
        			terms_hash[term.cv.name].push(t);
        			
        		});
        		
        		///cgi-bin/amigo/term-details.cgi?term=GO%3A0048015&amp;speciesdb=GeneDB_Tbruceibrucei927
        		///Query/controlledCuration?taxons=Tbruceibrucei927&amp;cvTermName=phosphatidylinositol-mediated+signaling&amp;cv=biological_process&amp;suppress=Tb927.2.2260%3AmRNA
        		
        		
        		
        		
        	});
        	
			window.termModel = new TermModel(terms_hash);
			
			//if (! terms_hash.hasOwnProperty("biological_process"))
			window.go = new GeneOntologyView({model : window.termModel, el: settings.elements.go });
				
		}
	}
	
	
	function setPage(info) {
		
		$.log("setPage");
		
		generateSummary(info);
		
		if (info.peptideName != null) {
        	var poly_info = new PolypeptideInfo(info.peptideName, {service:info.service});
        	
        	poly_info.getDbxrefs(function(features){
        		$.log(features);
        		
        		var d = [];
        		
        		$.each(features, function(n,feature) {
        			
        			$.each(feature.dbxrefs, function(m,dbxref){
        				d.push(dbxref);
        			});
        		});
        		
        		if (d.length > 0) {
        			window.featureSeeAlsotModel = new FeatureSeeAlsoModel(d);
        			window.featureSummary.addSeeAlso(featureSeeAlsotModel);
        		}
        		
        	});
        	
        	
        	poly_info.getProducts(function(features){
        		$.log(features);
        		
        		var p = []
        		
        		$.each(features, function(n,feature) {
        			$.each(feature.terms, function(t,term) {
        				p.push(term);
        			});
        		});
        		
        		if (p.length > 0) {
        			window.featureProductModel = new FeatureProductModel(p);
        			window.featureSummary.addProduct(featureProductModel);
        		}
        		
        	});
        	
		}
		
		generateProperties(info);
		
		generateGo(info);
			
        	
	}
	
	function initInfo(info) {
		
		$.log("initInfo");
		
		$.log(info.feature.uniqueName, info.feature.fmin, info.feature.fmax, info.feature.region, info.sequenceLength, info.geneUniqueName, info.feature.type, info.transcript_count);
		$.log(info.peptideName);
		
		$.log(info.feature.type, info.geneType);
		
		setPage(info);
		
		
		
		var topLevelFeatureLength = parseInt(info.sequenceLength);
        var max = 100000;
        var needsSlider = true;
        if (max > topLevelFeatureLength) {
            max = topLevelFeatureLength;
            //needsSlider = false;
        }
        var zoomMaxRatio = max / parseInt(info.sequenceLength);
        
        $("#chromosome-map").ChromosomeMap({
            region : info.feature.region, 
            overideUseCanvas : false,
            bases_per_row: parseInt(info.sequenceLength),
            row_height : 10,
            row_width : 870,
            overideUseCanvas : true,
            loading_interval : 100000,
            axisLabels : false,
            row_vertical_space_sep : 10,
            web_service_root : info.service
        });
        
        $('#webartemis').WebArtemis({
            source : info.feature.region,
            start : info.feature.fmin-1000,
            bases : info.feature.fmax-info.feature.fmin +2000,
            showFeatureList : false,
            width : 950,
            directory : webArtemisPath,
            showOrganismsList : false,
            webService : info.service,
            draggable : false,
            mainMenu : false, 
            zoomMaxRatio : zoomMaxRatio
        });
        
        if (needsSlider) {
            
            $('#chromosome-map-slider').ChromosomeMapSlider({
                windowWidth : 870,
                max : parseInt(info.sequenceLength), 
                observers : [new ChromosomeMapToWebArtemis()],
                pos : info.feature.fmin-1000,
                width : info.feature.fmax-info.feature.fmin +2000
            });
            
            setTimeout(function() { 
                $('#webartemis').WebArtemis('addObserver', new GeneDBPageWebArtemisObserver(info.feature.region, info.feature.fmin-1000, info.feature.fmin +2000, resetPage));
                $('#webartemis').WebArtemis('addObserver', new WebArtemisToChromosomeMap('#chromosome-map-slider'));
            }, 500);
        }
        
        $('.wacontainer').hover(
            function(e) {
                $("#web-artemis-link-container").show();                    
            }, function(e) {
                $("#web-artemis-link-container").hide();
            }
        );
        
		
	}
    
}




function GeneDBPageWebArtemisObserver(source,start,bases, doReload) {
	
	var loading = false;
	var loadedFeatureName = "";
	
	function changeLink(topLevelFeatureUniqueName, leftBase, basesDisplayWidth) {
	    var href = "http://www.genedb.org/web-artemis/?src=" + topLevelFeatureUniqueName + "&base=" 
	    	+ leftBase + "&bases=" + basesDisplayWidth;
	    $("#web-artemis-link").attr("href", href);
	}

	function reloadDetails(name) {
	    
		$.log("reloadDetails :" , [loading, name, loadedFeatureName]);
		
	    if (loading || name ==  null || name == loadedFeatureName) {
	    	return;
	    }
	    
	    loading = true;
	    
	    $.log("reload " + name);
	    
	    doReload(name, onReload);
//	    
//	    $("#geneDetails").fadeTo("slow", 0.4).load(encodeURIComponent(name)+"?detailsOnly=true", null, function () {
//	    	loadedFeatureName = name;
//	    	document.title = "Gene element "+name+" - GeneDB";
//	    	$("#geneDetails").stop().fadeTo("fast", 1);
//	        loading = false;
//	   }); 
	   
	} 
	
	function onReload(info) {
		loading = false;
		document.title = "Gene element " + info.uniqueName + " - GeneDB";
		$.log("reload complete, must show now");
	}
	
    this.redraw = function redraw(start, end) {
    	$.log("REDRAW DETECTED " + start + " " + end);
    	changeLink(source, start, end - start);
    };
    this.select = function(feature, fDisplay) {
    	if (feature == loadedFeatureName) {
    		return;
    	}
    	$.log("SELECT DETECTED " + feature + " ON DISPLAY ");
    	//$.historyLoad(feature);
    	reloadDetails(feature);
	};
	
	//$.historyInit(reloadDetails);
    changeLink(source,start,bases);
};

