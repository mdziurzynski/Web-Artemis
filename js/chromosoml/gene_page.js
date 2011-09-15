if (!Object.create) {  
    Object.create = function (o) {  
        if (arguments.length > 1) {  
            throw new Error('Object.create implementation only accepts the first parameter.');  
        }  
        function F() {}  
        F.prototype = o;  
        return new F();  
    };  
}




// we need to know the script directory for templates and images
var scripts= document.getElementsByTagName('script');
var path= scripts[scripts.length-1].src.split('?')[0];      
var current_directory = path.split('/').slice(0, -1).join('/')+'/';


(function($) {
	
	
	$.fn.AbsoluteToolTips = function(options) {
    	
		$.log("AbsoluteToolTips");
		
		var defaults = {
			"tooltip_element_id" : "reltool",
			"sub_element_class" : "relative_block_tooltip"
		}
		
		// the tooltip is shared by all elements bound to this plugin
		var tooltip = null;
		var toolout = true;
		var elout = false;
		
		return this.each(function() {
			
			$.log(this);
			
			var self=this;
			$.extend(self, defaults, options);
			
    		self.hideTool = function () {
    			$.log(toolout, elout);
    			setTimeout(function() {
    				if (toolout == true && elout == true)
    					tooltip.fadeOut('slow');
    			}, 500);
    		}
    		
    		self.showTool = function (html, e) {
    			
    			if (tooltip == null) {
    				
    				var div = $("<div />", {id: self.tooltip_element_id}).appendTo($("body"));
    				
    				tooltip = $("#"+self.tooltip_element_id);
    				
    				tooltip.bind("mouseenter", function(e){
    					$.log("enter tool");
    					toolout = false;
        			});
    				
        			tooltip.bind("mouseleave", function(e){
        				$.log("exit tool");
        				toolout = true;
        				self.hideTool();
        			});
        			
        			$.log(tooltip);
    				
    			}
    			
    			tooltip.html(html)
    				.css('left', e.pageX  + 10 )
    				.css('top', e.pageY -5)
    				.show();
    			
    		}
    		
    		$(this).bind("mouseenter mouseover", function(e) {
    			var html = $("." + self.sub_element_class, self).html();
    			elout = false;
    			$.log("enter el");
    			$.log(toolout, elout);
    			self.showTool(html,e);
    		});
    		
    		$(this).bind("mouseleave", function(e) {
    			$.log("exit el");
    			elout = true;
    			self.hideTool();
    		});
    		
	    	
			
		});
		
    }
	
})(jQuery);

$(function(){
    
    // we create a window wide web artemis namespace
    window.wa = {}
    
    /*
        A crawl client, that specialises in recursing hierarchy results, to enable the view of a gene to be constructed.
    */
    wa.GeneInfo = function(options) {
        
        var defaults = {
            service : ["/services/"],
            uniqueName : "flash",
            types : {
    		    "gene" : ["gene", "pseudogene"],
    		    "special_transcript" : ["ncRNA", "snoRNA", "snRNA", "tRNA", "miscRNA", "rRNA"],
    		    "transcript" : ["mRNA", "ncRNA", "snoRNA", "snRNA", "tRNA", "miscRNA", "rRNA"]
    		}
        }
        
        var self=this;
        $.extend(self, defaults, options);
        
		self.get_hierarchy = function(success) {
		    $.ajax({
    	        url: self.service + "/feature/hierarchy.json",
    	        type: 'GET',
    	        dataType: 'json',
    	        data: {
    	            'uniqueName' : self.uniqueName
    	        },
    	        success: function(hierarchy) {
    	            $.log("received hierarchy for " + self.uniqueName);
    	            self.hierarchy = hierarchy;
    	            if (success != null) success();
	            }
            });
		}
		self.get_sequence_length = function(region, success) {
		    $.ajax({
    	        url: self.service + "/regions/sequenceLength.json",
    	        type: 'GET',
    	        dataType: 'json',
    	        data: {
    	            'region' : region
    	        },
    	        success: function(regions) {
    	        	self.sequenceLength = regions[0].length; 
    	            success(self.sequenceLength);
	            }
            });
		}
		/*
		    This function is used by many others to fetch information out of the hierarchy. It will apply the callback
		    to each feature in the hiearchy. 
		*/
		self.recurse_hierarchy = function(feature, callback) {
		    for (c in feature.children) {
		        var child = feature.children[c];
		        self.recurse_hierarchy(child, callback);
		    }
		    return callback(feature);
		}
		self.gene_name = function() {
		    var types = self.types;
		    return self.recurse_hierarchy(self.hierarchy, function(feature) {
		        if (types.gene.indexOf(feature.type.name) > -1)
		            return feature.uniqueName;
		    });
		}
		self.transcripts = function() {
		    var types = self.types;
		    var transcripts = [];
		    self.recurse_hierarchy(self.hierarchy, function(feature) {
		        if (types.transcript.indexOf(feature.type.name) > -1) {
		            transcripts.push(feature);
		        }
		    });
		    return transcripts;
		}
		self.type = function() {
		    var type = "feature";
		    var types = self.types;
		    self.recurse_hierarchy(self.hierarchy, function(feature) {
	            if (types.special_transcript.indexOf(feature.type.name) > -1) 
                    type = feature.type.name;
                else if (feature.type.name == "polypeptide")
                    type = "Protein coding gene";
                else if (feature.type.name.contains("pseudo"))
                    type = "Pseudogene";
		    });
		    return type;
		}
		self.synonyms = function(type) {
		    var synonyms = {};
		    self.recurse_hierarchy(self.hierarchy, function(feature) {
		        var feature_synonyms = []
		        if (feature.synonyms != null && feature.synonyms.length > 0) {
		            for (s in feature.synonyms) {
		                var synonym = feature.synonyms[s];
		                if (type == null || synonym.synonymtype == type)
		                    feature_synonyms.push(synonym);
		            }
		        }
		        if (feature_synonyms.length > 0)
		            synonyms[feature.uniqueName] = feature_synonyms;
	        });
	        return synonyms;
		}
		self.systematic_name = function() {
		    
		    var systematicName = self.uniqueName;
		    var geneName = self.gene_name();
		    
		    var transcript_count = self.transcripts().length;
		    
		    if (geneName != null) {
		        if (transcript_count < 2) {
		            systematicName = geneName;
		        } else if (transcript_count >= 2 && info.feature.type=="mRNA") {
		            systematicName += " (one splice form of " + info.geneUniqueName;
	            }
		    }
		    
		    return systematicName;
		}
		self.get_attribute_map = function(name) {
		    var map = {};
		    self.recurse_hierarchy(self.hierarchy, function(feature) {
		        var attribute = feature[name];
		        if (attribute != null && attribute.length > 0)
		            map[feature.uniqueName] = attribute
	        });
	        return map;
		}
		self.dbxrefs = function() {
		    return self.get_attribute_map("dbxrefs");
		}
		self.coordinates = function() {
		    return self.hierarchy.coordinates;
		}
		self.terms = function(cv) {
		    var terms_map = {}
		    self.recurse_hierarchy(self.hierarchy, function(feature) {
		        var terms = feature.terms
		        var matched = []
		        if (terms != null && terms.length > 0) {
		            for (var t in terms) {
		                var term = terms[t];
		                if (cv == null || term.cv.name == cv) {
		                    matched.push(term)
		                }
		            }
		        }
		        if (matched.length > 0)
		            terms_map[feature.uniqueName] = matched;
	        });
	        return terms_map;
		},
		self.properties = function(property_name) {
		    var prop_map = {}
		    self.recurse_hierarchy(self.hierarchy, function(feature) {
		        var matched = [];
		        var properties = feature.properties;
		        if (properties != null && properties.length > 0) {
		            for (var p in properties) {
		                var property = properties[p];
		                if (property_name == null || property.name == property_name)
		                    matched.push(property);
		            }
		        }
		        if (matched.length > 0) 
		            prop_map[feature.uniqueName] = matched;
		    });
		    return prop_map;
		},
    	self.pubs = function() {
    	    return self.get_attribute_map("pubs");
    	}
    	self.organism = function() {
    	    return self.hierarchy.organism;
    	}
    	self.order_terms = function(terms) {
            var new_terms = {}
            for (f in terms) {
                ordered = terms[f].sort(function(t1,t2) {
                    return t1.name > t2.name;
                });
                new_terms[f] = ordered;
            }
            return new_terms;
        }
        self.domains = function() {
    	    
    	    // compound hash of feature_uniqueName.category_dbxref_accession.domain_list
    	    var categorized_domains = {}
    	    
    	    // we must walk through each domain, and categorize by checking the presence of an Interpro dbxref
    	    self.recurse_hierarchy(self.hierarchy, function(feature) {
    	        
    	        for (d in feature.domains) {
    	            
                    var domain = feature.domains[d];
                    var key = "Other Matches";

                    for (dx in domain.dbxrefs) {
                        var dbxref = domain.dbxrefs[dx];
                        if (dbxref.db.name == "InterPro") {
                            var key = dbxref.accession;
                            break;
                        }
                    }

                    if ((feature in categorized_domains) != true) 
                       categorized_domains[feature] = {}

                    if ((key in categorized_domains[feature]) != true)
                       categorized_domains[feature][key] = []  

                    categorized_domains[feature][key].push(domain)
    	           
    	        }
    	    });
    	    
    	    $.log("categorized_domains");
    	    $.log(categorized_domains);
        	return categorized_domains;
    	}
    	self.getBounds = function(domains) {
    	    var coordinates = self.coordinates()[0];
    	    var bounds = {
    	        fmin : coordinates.fmin,
    	        fmax : coordinates.fmax,
    	    }
    	    for (feature in domains) {
    	        
    	    }
    	}
	};
	
	
	
	
	/*
	    Provides functions that can be called from within templates, usually generating links.
	*/
	wa.ViewHelper = function (options) {
	    
	    var defaults = {
	        links : {
    			go : "http://www.genedb.org/cgi-bin/amigo/term-details.cgi",
    			pub : "http://www.ncbi.nlm.nih.gov/entrez/query.fcgi?cmd=Retrieve&amp;db=PubMed&amp;dopt=Abstract&amp;list_uids=",
    			others : "http://www.genedb.org/Query/controlledCuration"
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
		    img : {
		        prefix : current_directory + "/img/",
		        suffix : ".png"
	        },
	        colours : {
	        	"default" : "rgb(125, 125, 125)",
	        	"Pfam" : "rgb(248, 57, 217)",
	            "PIRSF" : "rgb(52, 33, 135)",
	            "Prosite" : "rgb(130, 68, 225)",
	            "SMART" : "rgb(247, 65, 66)",
	            "PRINTS" : "rgb(57, 45, 209)",
	            "ProDom" : "rgb(0, 160, 9)",
	            "Superfamily" : "rgb(0, 199, 127)",
	            "TIGR_TIGRFAMS" : "rgb(0, 255, 255)"
	        }
		};
		
		var self = this;
	    $.extend(self, defaults, options);
		self.organism = null;
		
		self.evidence_category = function (supplied_evidence) {
    		for (c in self.evidence) 
    		    for (e in self.evidence[c]) 
    		        if (supplied_evidence == self.evidence[c][e]) 
    		            return c;
    	}
    	self.go_link = function(accession) {
            return self.links.go + "?species=GeneDB_" + self.organism.common_name + "&term=" + accession;
        }
        self.img = function(props) {
            for (p in props) {
                var prop = props[p];
                if (prop.type.name == "evidence") {
                    var evidence = prop.value;
                    return self.img.prefix + self.evidence_category(evidence) + self.img.suffix;
                }
            }
        }
        
        
        
        
	}
	
	// this is a singleton, for now
	wa.viewHelper = new wa.ViewHelper();
	
	wa.ProteinMap = function(options, hierarchy, domains, sequenceLength) {
	    
	    var defaults = {
	        step_number : 10,
	        pixel_width : 700
	    }
	    
	    var self = this;
	    $.extend(self, defaults, options);
	    
	    self.hierarchy = hierarchy;
	    self.domains = domains;
	    self.sequenceLength = sequenceLength;
	    
//	    self.init = function() {
//	        //var coordinates = self.coordinates()[0];
//    	    self.bounds = {
//    	        fmin : sequenceLength,
//    	        fmax : 1
//    	    }
//    	    self.positions = {}
//    	    for (var feature in domains) {
//    	        for (var category in domains[feature]) {
//    	            var domain = domains[feature][category];
//    	            self.positions [feature+"::"+category] = {
//    	                fmin : domain.fmin,
//    	                fmax : domain.fmax
//    	            }
//        	        if (domain.fmin < self.bounds.fmin) 
//        	            self.bounds.fmin = domain.fmin;
//        	        if (domain.fmin > self.bounds.fmax)
//        	            self.bounds.fmax = domain.fmax;
//    	        }
//    	        
//    	    }
//    	    return bounds;
//	    }
	    
	    self.isOverlap= function(bounds) {
	        for (var feature in self.domains) {
	        	
    	        for (var category in self.domains[feature]) {
    	        	
    	            var domains = self.domains[feature][category];
    	            
    	            for (var d in domains) {
    	            	var domain = domains[d];
    	            	$.log(category, domain.uniqueName, bounds.fmin, domain.fmin, domain.fmax, bounds.fmax,
    	            			bounds.fmin <= domain.fmin && domain.fmin <= bounds.fmax,
    	            			bounds.fmin <= domain.fmax && domain.fmax <= bounds.fmax);
        	            if ((bounds.fmin <= domain.fmin && domain.fmin <= bounds.fmax) || 
    	            		(bounds.fmin <= domain.fmax && domain.fmax <= bounds.fmax)) {
        	            	$.log("!");
        	            	return true;
        	            }
    	            }
    	            
    	            
	            }
            }
            return false;
	    }
	    
	    // adapted from http://gamedev.stackexchange.com/questions/586/what-is-the-fastest-way-to-work-out-2d-bounding-box-intersection
	    self.boxesOverlap = function(box1, box2) {
	    	return (Math.abs(box1.x - box2.x) * 2 < (box1.width + box2.width) &&
	    			Math.abs(box1.y - box2.y) * 2 < (box1.height + box2.height));
	    }
	    
	    self.showSection = function (base_position) {
	    	for (var b in self.shown) {
	    		var bounds = self.shown[b];
	    		if (bounds.fmin <= base_position && bounds.fmax >= base_position)
	    			return true;
	    	}
	    	return false;
	    }
	    
	    self.totalGapLength = function() {
	    	var gapLength = 0;
	        for (g in self.gaps) {
	            var gap = self.gaps[g];
	            gapLength += (gap.fmax - gap.fmin);
	        }
	        return gapLength;
	    }
	    
	    self.getDivPosition = function (base_position) {
	        var subtract = 0;
	        for (g in self.gaps) {
	            var gap = self.gaps[g];
	            if (gap.fmax < base_position) 
	                subtract += (gap.fmax - gap.fmin);
	            if (gap.fmin > base_position) 
	                break;
	        }
	        return base_position - subtract;
	    }
	    
	    self.scaleX = function (base_position) {
	    	var coordinates = self.hierarchy.coordinates[0];
	    	var base_length = coordinates.fmax - coordinates.fmin;
	    	
	    	var totalGapLength = self.totalGapLength();
	    	
	    	var max = base_length - totalGapLength;
	    	
	    	var div_position = self.getDivPosition(base_position);
	    	
	    	var pos = (self.pixel_width / max ) * div_position 
	    	
	    	$.log("scaleX", base_length, totalGapLength, max, base_position, div_position, self.pixel_width,  pos);
	    	
	    	return  pos;
	    }
	    
	    self.determine_step = function(max) {
	    	
	    	function log10(val) {
	    		return Math.log(val) / Math.log(10);
	    	}

	    	
			//diff = max; // divide by 3 for amino acids
	    	
			var stepsUncorrected = max / self.step_number;
			var log = log10(stepsUncorrected);
			var round = Math.floor(log);
			var step = Math.pow(10, round);
	        return step;
	    }
	    
	    self.init = function() {
	        self.gaps = [];
	        self.shown = [];
	        var coordinates = self.hierarchy.coordinates[0];
	        var max = coordinates.fmax - coordinates.fmin;
	        
	        var step = self.determine_step(max);
	        self.step = step;
	        
	        var pos = 0;
	        // var pos2 = pos + step;
	        for (var i = 0; pos <= max; i++) {
	        	
	        	pos = (i*step) ;
	        	
	        	if (pos > max)
	        		break;
	        	
	            var pos2 = pos + step;
	            
	            if (pos2 > max)
	            	pos2 = max;
	            
	            $.log(i, "pos", pos, "pos2", pos2);
	            
	            var bounds = {
            		fmin:pos,
            		fmax:pos2
	            };
	            if (self.isOverlap(bounds)) {
	            	self.shown.push(bounds);
	            } else {
	            	self.gaps.push(bounds);
	            }
	        }
	        $.log("shown");
	        for (var b in self.shown) {
	        	var box = self.shown[b];
	        	box.x = self.scaleX(box.fmin);
	        	box.x2 = self.scaleX(box.fmax);
	        }
	        $.log("gaps");
	        for (var b in self.gaps) {
	        	var box = self.gaps[b];
	        	box.x = self.scaleX(box.fmin);
	        	box.x2 = self.scaleX(box.fmax);
	        }
	        
	        
	        self.domain_graph = [];
	        var y =0;
	        
	        for (var feature in self.domains) {
    	        for (var category in self.domains[feature]) {
    	            var domains = self.domains[feature][category];
    	            for (var d in domains) {
    	            	var domain = domains[d];
    	            	var x = self.scaleX(domain.fmin);
    	            	
    	            	
    	            	y=10;
    	            	
    	            	
    	            	
    	            	
    	            	
    	            	var width = self.scaleX(domain.fmax) - x;
    	            	var height = 10;
    	            	
    	            	var dbname = "";
    	            	
    	            	var dbxref = null;
    	            	for (dx in domain.dbxrefs) {
    	            		// we don't break, we want the last value
    	            		dbxref = domain.dbxrefs[dx];
    	            		dbname = dbxref.db.name; 
    	            	}
    	            	
    	            	var colour = null;
    	            	if (dbname != null)
    	            		colour = wa.viewHelper.colours[dbname];
    	            	if (colour == null) // if still null 
    	            		colour = wa.viewHelper.colours.default;
    	            	
    	            	var box = {
    	            		dbxref : dbxref,
    	            		category : category,
    	            		feature : feature,
    	            		x : x,
    	            		y : y,
    	            		fmin:domain.fmin,
    	            		fmax:domain.fmax,
    	            		width : width,
    	            		height : height,
    	            		colour : colour
    	            	}
    	            	
    	            	
    	            	for (p in self.domain_graph) {
    	            		var previous = self.domain_graph[p];
    	            		
    	            		if (self.boxesOverlap(box,previous)) {
    	            			box.y += 15;
    	            		}
    	            		
    	            	}
    	            	
    	            	
    	            	//$.log("draw domain", domain.fmin, domain.fmax, box);
    	            	self.domain_graph.push(box);
    	            	
    	            }
    	        }
	        }
	        
	    }
	    
	    self.init ();
	}
	
	
	/*
	    Initiates a gene page, including web artemis and 
	*/
	wa.GenePage = function(options) {
	    
	    var defaults = {
	        uniqueName : "fred",
	        webArtemisPath : "wa",
	        template_options : {
	            templateUrl: current_directory + "/tpl",
                templateSuffix: ".html"
	        }
	    }
	    
	    var self = this;
	    $.extend(self, defaults, options);
	    
        ko.externaljQueryTemplateEngine.setOptions(self.template_options);
	    
	    self.init = function () {
		    self.geneInfo = new wa.GeneInfo();
        	self.info(self.geneInfo, self.uniqueName, self.on_init);
		}
		
		self.info = function (geneInfo, uniqueName, onComplete) {
		    geneInfo.uniqueName = uniqueName;
		    
        	geneInfo.get_hierarchy(function() {
                var geneName = geneInfo.gene_name();
                $.log("gene name is " + geneName);
                
                var transcripts = geneInfo.transcripts();
                $.log(transcripts);
                
                $.log("transcripts count is " + transcripts.length);
                var type = geneInfo.type();
                $.log("type is " + type);
                var synonyms = geneInfo.synonyms("synonym");
                $.log(synonyms);
                
                var product_synonyms = geneInfo.synonyms("product_synonym");
                $.log(product_synonyms);
                
                var previous_systematic_ids = geneInfo.synonyms("previous_systematic_id");
                $.log(previous_systematic_ids);

                var systematicName = geneInfo.systematic_name();
                $.log(systematicName);
                
                var dbxrefs = geneInfo.dbxrefs();
                $.log(dbxrefs);
                
                var coordinates = geneInfo.coordinates();
                $.log("coordinates");
                $.log(coordinates);
                
                //wa.initialize_templates(wa.templates);
                
                var products = geneInfo.terms("genedb_products");
                $.log(products);
                
                var organism = geneInfo.organism();
                wa.viewHelper.organism = organism;
                
                $.log("curation")
                $.log(geneInfo.properties("curation"));
                
                var controlled_curation = geneInfo.order_terms(geneInfo.terms("CC_genedb_controlledcuration"));
                $.log(controlled_curation);
                
                var domains = geneInfo.domains();
                
                wa.viewModel = {
                    systematicName : systematicName,
                    type: type,
                    dbxrefs : dbxrefs,
                    geneName : geneName,
                    products : products,
                    synonyms : synonyms,
                    product_synonyms : product_synonyms,
                    previous_systematic_ids : previous_systematic_ids,
                    len : function(maps) { // returns the combined size of a list of maps
                        var count = 0
                        for (m in maps) 
                            for (mm in maps[m]) count++;
                        return count;
                    },
                    pubs: geneInfo.pubs(),
                    notes : geneInfo.properties("note"),
                    comments : geneInfo.properties("comment"),
                    curations : geneInfo.properties("curation"),
                    cellular_component : geneInfo.terms("cellular_component"),
                    molecular_function : geneInfo.terms("molecular_function"),
                    biological_process : geneInfo.terms("biological_process"),
                    organism : organism,
                    controlled_curation : controlled_curation,
                    domains : domains,
                    coordinates : coordinates
                }
                
                
                var proteinMap = new wa.ProteinMap ({}, geneInfo.hierarchy, domains, geneInfo.sequenceLength); 
                $.log(proteinMap.gaps);
                $.log(proteinMap.shown);
                $.log(proteinMap.domain_graph);
                wa.viewModel.domain_graph = proteinMap.domain_graph;
                wa.viewModel.domain_graph_shown = proteinMap.shown;
                
                ko.applyBindings(wa.viewModel);
                
                $.log(["onComplete?", onComplete]);
                
                //self.embed_web_artemis(coordinates[0]);
                wa.webArtemisLinker.link(coordinates[0]);
                
                $(".absolute_tool").AbsoluteToolTips();
                
                
                $( "#tabs" ).tabs();
                
                
                
                $(".evidence").tooltip();
                
                if (onComplete != null)
                    onComplete(geneInfo.hierarchy);
                
        	});
		}
		
		self.on_init = function(feature) {
		    self.geneInfo.get_sequence_length(feature.coordinates[0].region, function(sequenceLength) {
		        self.embedded_web_artemis = new wa.EmbeddedWebArtemis({
    		        coordinates : feature.coordinates[0], 
    		        webArtemisPath: self.webArtemisPath, 
    		        sequenceLength : sequenceLength,
    		        observers : [self]
    		    });
		    });
		}
        
        self.redraw = function redraw(start, end) {
        	$.log("REDRAW DETECTED " + start + " " + end);
        };
        
        self.select = function(uniqueName, fDisplay) {
        	$.log("SELECT DETECTED " + uniqueName + " ON DISPLAY ");
        	self.info(self.geneInfo,uniqueName);
    	};
		
		self.init();
		
	}
	
	/*
	    
	*/
	wa.EmbeddedWebArtemis = function(options) {
	    
	    var defaults = {
	        chromosome_map_element : "#chromosome-map",
	        chromosome_map_slider_element : "#chromosome-map-slider",
	        web_artemis_element : "#webartemis",
	        sequenceLength : 1,
	        coordinates : {
	            fmin : 1,
	            fmax : 1000,
	            region : "some_region"
            },
            webArtemisPath : "path",
	        max_residues : 1000000,
	        service : "/services/", 
	        observers : [function () {
	            $.log("default change");
	        }]
	    }
	    
	    var self = this;
	    $.extend(self, defaults, options);
	    
		var topLevelFeatureLength = parseInt(self.sequenceLength);
        var max = self.max_residues;
        var needsSlider = true;
        if (max > topLevelFeatureLength) {
            max = topLevelFeatureLength;
            //needsSlider = false;
        }
        var zoomMaxRatio = max / parseInt(self.sequenceLength);
        
        $.log("zooom " + zoomMaxRatio);
        
        $(self.chromosome_map_element).ChromosomeMap({
            region : self.coordinates.region, 
            overideUseCanvas : false,
            bases_per_row: parseInt(self.sequenceLength),
            row_height : 10,
            row_width : 870,
            overideUseCanvas : true,
            loading_interval : 100000,
            axisLabels : false,
            row_vertical_space_sep : 10,
            web_service_root : self.service
        });
        
        $.log(self.coordinates);
        
        $(self.web_artemis_element).WebArtemis({
            source : self.coordinates.region,
            start : self.coordinates.fmin-1000,
            bases : self.coordinates.fmax-self.coordinates.fmin +2000,
            showFeatureList : false,
            width : 950,
            directory : self.webArtemisPath,
            showOrganismsList : false,
            webService : self.service,
            draggable : false,
            mainMenu : false, 
            zoomMaxRatio : zoomMaxRatio
        });
        
        if (needsSlider) {
            
            $(self.chromosome_map_slider_element).ChromosomeMapSlider({
                windowWidth : 870,
                max : parseInt(self.sequenceLength), 
                observers : [new ChromosomeMapToWebArtemis()],
                pos : self.coordinates.fmin-1000,
                width : self.coordinates.fmax-self.coordinates.fmin +2000
            });
            
            setTimeout(function() { 
                for (o in self.observers)
                    $(self.web_artemis_element).WebArtemis('addObserver', self.observers[o]);
                $(self.web_artemis_element).WebArtemis('addObserver', 
                    new WebArtemisToChromosomeMap(self.chromosome_map_slider_element));
            }, 500);
        }
        
                
	}
	
	wa.WebArtemisLinker = function (options) {
	    var defaults = {
	        baseURL : "http://www.genedb.org/web-artemis/?src=",
	        web_artemis_link : "#web-artemis-link",
	        web_artemis_link_container : "#web-artemis-link-container",
	        web_artemis_container : ".wacontainer"
	    }
	    var self = this;
	    $.extend(self, defaults, options);
	    
	    
	    $(self.web_artemis_container).hover(
            function(e) {
                $(self.web_artemis_link_container).show();                    
            }, function(e) {
                $(self.web_artemis_link_container).hide();
            }
        );
        
        self.link = function (coordinates) {
            var href = self.baseURL + coordinates.region + "&base=" 
        	    	+ (coordinates.fmin-1000) + "&bases=" + (coordinates.fmax-coordinates.fmin +2000);
        	$(self.web_artemis_link).attr("href", href);
        }
	    
	}
	
	// also a singleton
	wa.webArtemisLinker = new wa.WebArtemisLinker();
	
    
    /*
    wa.EmbeddedWebArtemisObserver = function (source,start,bases, doReload) {

    	var loading = false;
    	var loadedFeatureName = "";

    	function changeLink(topLevelFeatureUniqueName, leftBase, basesDisplayWidth) {
    	    var href = "http://www.genedb.org/web-artemis/?src=" + topLevelFeatureUniqueName + "&base=" 
    	    	+ leftBase + "&bases=" + basesDisplayWidth;
    	    $("#web-artemis-link").attr("href", href);
    	}

    	function reloadDetails(name) {

    		$.log("reloadDetails :" , [loading, name, loadedFeatureName, doReload]);

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

    	function onReload(feature) {
    	    $.log(["EmbeddedWebArtemisObserver.onReload", feature.uniqueName]);
            loading = false;
            document.title = "Gene element " + feature.uniqueName + " - GeneDB";
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
    
    */
    
});


/*

function GenePage(uniqueName, webArtemisPath, options) { 
	
	var defaults = {
		services : ["/services/"],
		hideable : ".hideable",
		erasable :
		 ".erasable",
		links : {
			go : "http://www.genedb.org/cgi-bin/amigo/term-details.cgi",
			pub : "http://www.ncbi.nlm.nih.gov/entrez/query.fcgi?cmd=Retrieve&amp;db=PubMed&amp;dopt=Abstract&amp;list_uids=",
			others : "http://www.genedb.org/Query/controlledCuration"
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
			gene_summary : {
				id : "#gene_summary",
				elements : {
					".gene_summary_items" : "items"
				}
			},
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
	
	function othersLink(species,cv,term) {
	    return settings.links.others + "?taxons=" + species + "&cvTermName="+term+"&cv="+cv ;
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
		
//		$.log($(settings.erasable));
//		$.log($(settings.hideable));
//		
		//$(settings.erasable).html("");
		//$(settings.hideable).hide();
		
		getInfo(name, function(info) {
			setPage(info);
			onComplete(info);
		});
		
		
	}
	
	function clearModels() {
		wa.FeatureSummaryItem.destroyAll();
		wa.FeatureLocationModel.destroyAll();
		wa.FeatureProductModel.destroyAll();
		wa.DbxrefModel.destroyAll();
	}
	
	function setupSummary() {
		self.featureSummary = wa.FeatureSummary.init({ 
			el: $(settings.elements.gene_summary.id), 
			elements : settings.elements.gene_summary.elements 
		});
	}
	
	function add_item(key,name,value) {
		self.featureSummary.add(wa.FeatureSummaryItem.init({
    		key:key, 
    		name:name, 
    		value:value}));
	}
	
	function generateSummary(info) {
		
		clearModels();
		setupSummary();
		
		
		var usedUniqueName = info.uniqueName;
		
		if (info.transcript_count < 2 && info.geneUniqueName != null) {
			usedUniqueName = info.geneUniqueName;
		}
		
		var systematicName = usedUniqueName;
		
	    if (info.transcript_count > 2 && info.feature.type=="mRNA") {
	    	systematicName += " (one splice form of " + info.geneUniqueName;
	    }
	    
	    add_item("systematicName", "Systematic Name", systematicName);
	    
	    if (info.geneUniqueName != null && info.geneUniqueName != usedUniqueName) {
	    	add_item('geneName', "Gene Name", geneUniqueName);
	    }
	    
	    add_item('featureType', "Feature Type", ( info.hierarchyType != null ) ? info.hierarchyType : info.feature.type.name);
	    
	    
	    
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
	    		add_item("previous_systematic_id", "Previous Systematic ID", previous_systematic_ids.join (", "));
	    	
	    	if (synonyms.length > 0)
	    		add_item("synonym", "Synonym", synonyms.join (", "));
	    		
	    	if (product_synonyms.length > 0)
	    		add_item("product_synonym", "Product Synonym", product_synonyms.join (", "));
	    	
	    }
	    
	    //add_item("location", "Location", info.regionInfo.type.name + " " + info.regionInfo.uniqueName + "; " + info.feature.fmin + "-" + info.feature.fmax);
	    
	    //self.featureSummary.addLocation(info.feature,info.regionInfo);
	    self.featureSummary.addLocation(wa.FeatureLocationModel.init({feature : info.feature, region : info.regionInfo}));
	    
	    
	    if (info.organism.common_name == "Pchabaudi" || info.organism.common_name == "Pberghei" ) {
	    	
	    	var dbxref = wa.Dbxref.create({
	    		database : "PlasmoDB", 
	    		accession : info.geneUniqueName,
	    		urlprefix : "http://plasmodb.org/gene/"
	    	}) ;
	    	
	    	
	    	
	    	add_item("plasmodb", "PlasmoDB", "<a href=\"http://plasmodb.org/gene/"+info.geneUniqueName+ "\" >"+info.geneUniqueName+"</a>");
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
			add_item("tritrypdb", "TriTrypDB", "<a href=\"http://tritrypdb.org/gene/"+info.geneUniqueName+ "\" >"+info.geneUniqueName+"</a>");
		}
	    
		
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
        				dbxrefs: term.dbxrefs,
        				count: term.count,
        				others_link : othersLink(info.organism.common_name, term.cv.name, term.name)
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
        		
        		//var d = [];
        		
        		$.each(features, function(n,feature) {
        			
        			$.each(feature.dbxrefs, function(m,dbxref){
        				
        				var dbxref_model = wa.DbxrefModel.fromJSON(dbxref);
        				
        				$.log("dbxref_model");
        				$.log((dbxref_model));
        				
        				self.featureSummary.addDbxref(dbxref_model);
        				
        				
        				
        			});
        		});
        		
//        		if (d.length > 0) {
//        			window.featureSeeAlsotModel = new FeatureSeeAlsoModel(d);
//        			window.featureSummary.addSeeAlso(featureSeeAlsotModel);
//        		}
        		
        	});
        	
        	
        	poly_info.getProducts(function(features){
        		$.log(features);
        		
        		//var p = []
        		
        		$.each(features, function(n,feature) {
        			$.each(feature.terms, function(t,term) {
        				//p.push(term);
        				
        				var product_model = wa.FeatureProductModel.fromJSON(term);
        				//product_model.fromJSON(term);
        				
            			//product_model.setProduct(term); 
            			
            			self.featureSummary.addProduct(product_model);
            			
        			});
        		});
        		
//        		if (p.length > 0) {
//        			//window.featureProductModel = new FeatureProductModel(p);
//        			//window.featureSummary.addProduct(featureProductModel);
//        			
//        			
//        			
//        			
//        			
//        		}
        		
        	});
        	
		}
		
//		generateProperties(info);
//		
//		generateGo(info);
//			
        	
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

*/