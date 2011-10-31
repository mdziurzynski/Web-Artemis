
if (!Object.create) {
    Object.create = function(o) {
        if (arguments.length > 1) {
            throw new Error('Object.create implementation only accepts the first parameter.');
        }
        function F() {
        }
        F.prototype = o;
        return new F();
    };
}

// we need to know the script directory for templates and images
var scripts = document.getElementsByTagName('script');
var path = scripts[scripts.length - 1].src.split('?')[0];
var current_directory = path.split('/').slice(0, -1).join('/') + '/';

(function($) {
    
    var tooltipCount = 0;
    
    /*
     * A tooltip implementation that copes with absolutely posisitioned divs
     * inside relative divs. This should really be moved into a plugins folder.
     */
    $.fn.AbsoluteToolTips = function(options) {
        
        var defaults = {
            "tooltip_element_id" : "reltool",
            "sub_element_class" : "relative_block_tooltip"
        }
        
        return this.each(function() {
            
            var self = this;
            $.extend(self, defaults, options);
            
            var toolID = self.tooltip_element_id + tooltipCount++;
            
            $("<div />", {
                id : toolID
            }).appendTo($("body")).css("position", "absolute").addClass("tooltip");
            
            var tooltip = $("#" + toolID);
            
            var toolout = true;
            var elout = false;
            
            self.hideTool = function() {
                setTimeout(function() {
                    if (toolout == true && elout == true)
                        tooltip.fadeOut('slow');
                }, 100);
            };
            
            self.showTool = function(html, e) {
                tooltip.html(html).css('left', e.pageX + 10).css('top', e.pageY - 5).fadeIn("fast");
            };
            
            tooltip.bind("mouseenter", function(e) {
                toolout = false;
            }).bind("mouseleave", function(e) {
                toolout = true;
                self.hideTool();
            });
            
            $(self).bind("mouseenter mouseover", function(e) {
                var html = $("." + self.sub_element_class, self).html();
                if (html != null) {
                    elout = false;
                    self.showTool(html, e);
                }
            }).bind("mouseleave", function(e) {
                elout = true;
                self.hideTool();
            }).css("cursor", "pointer");

        });

    };

})(jQuery);

$(function() {

    // we create a window wide web artemis namespace
    window.wa = {}

    /*
     * A crawl client, that specialises in recursing feature/hierarchy results,
     * to enable the view of a gene to be constructed.
     */
    wa.GeneInfo = function(options) {

        var defaults = {
            service : [ "/services/" ],
            uniqueName : "flash",
            types : {
                "gene" : [ "gene", "pseudogene" ],
                "special_transcript" : [ "ncRNA", "snoRNA", "snRNA", "tRNA", "miscRNA", "rRNA" ],
                "transcript" : [ "mRNA", "ncRNA", "snoRNA", "snRNA", "tRNA", "miscRNA", "rRNA" ]
            },
            membrs : [ "non_cytoplasmic_polypeptide_region", "cytoplasmic_polypeptide_region", "transmembrane_polypeptide_region" ]
        }

        var self = this;

        /*
         * The feature that was requested.
         */
        self.requestedFeature = null;

        /*
         * The feature relating to the correct isoform, which is either - the
         * transcript most closely related to the requested feature - the first
         * transcript if the feature is not part of a transcript - the gene if
         * the feature is in a gene model - the feature if none of the above are
         * true.
         * 
         */
        self.isoform = null;

        /*
         * The entire gene hierarchy.
         */
        self.hierarchy = null;

        /*
         * The length of the gene sequence.
         */
        self.sequenceLength = null;

        /*
         * A list of properties derived from the isoform's polypeptide.
         */
        self.polypeptide_properties = null;

        $.extend(self, defaults, options);

        /*
         * Fetch the gene hierarchy for this freature.
         * 
         * @param trim_for_transcripts - for a gene page view where the only the
         * children of a specific transcript should be shown, remove the others
         * @param success, a callback
         * 
         */
        self.get_hierarchy = function(trim_for_transcripts, success) {

            $.ajax({
                url : self.service + "/feature/hierarchy.json",
                type : 'GET',
                dataType : 'jsonp',
                data : {
                    'uniqueName' : self.uniqueName
                },
                success : function(hierarchy) {
                    // $.log("received hierarchy for " +
                    // self.uniqueName);
                    self.hierarchy = hierarchy;
                    // $.log(self.hierarchy);

                    // let's detemine the requested feature, must reset
                    // this property it first
                    self.requestedFeature = null;
                    self.recurse_hierarchy(self.hierarchy, function(feature) {
                        if (self.requestedFeature != null)
                            return;
                        if (feature.uniqueName == self.uniqueName)
                            self.requestedFeature = feature;
                    });

                    // let's get the number of transcripts
                    var transcripts = self.transcripts();
                    self.transcript_count = transcripts.length;

                    if (trim_for_transcripts) {

                        // if trimming, we want to look for a default
                        // transcript if a gene has been requested
                        // essentially requesting the first transcript
                        if ($.inArray(self.requestedFeature.type.name, self.types.gene) > -1
                                && self.transcript_count > 0 ) {
                            self.requestedFeature = transcripts[0];
                        }

                        self.trim_hierarchy();

                    }

                    // now we get the isoform information.
                    self.get_isoform(self.uniqueName, function(isoform) {
                        self.isoform = isoform;

                        if (success != null)
                            success();
                    });

                    // $.log(self.hierarchy);

                }
            });
        }

        /*
         * This function is used by many others to fetch information out of the
         * hierarchy. It will apply the callback to each feature in the
         * hiearchy.
         */
        self.recurse_hierarchy = function(feature, callback) {
            for (var c in feature.children) {
                var child = feature.children[c];
                self.recurse_hierarchy(child, callback);
            }
            return callback(feature);
        }

        self.trim_hierarchy = function() {

            var requestedFeature = self.requestedFeature;
            var transcript_count = self.transcript_count;

            var children_of_original_feature = true;

            // we don't use recurse_hierarchy(callback) method for this
            // particular case, because we want to walk through the parents
            // before the children.
            // so, instead we use a standard recursion approach
            function trim(feature) {
                var featureIsRequested = (feature.uniqueName == requestedFeature.uniqueName);
                // $.log(feature.uniqueName, feature.type.name,
                // featureIsRequested, requestedFeature.type.name );

                // none of the checks below apply for single transcript genes
                if (transcript_count <= 1) {
                    children_of_original_feature = true;
                } else if ($.inArray(feature.type.name, self.types.gene) > -1 && featureIsRequested) {
                    children_of_original_feature = true; // if the requested
                    // type is a gene
                    // then show
                } else if (feature.type.name == "mRNA") {

                    // simple case of where we asked for an mRNA, that's what we
                    // whould guess
                    if (featureIsRequested) {
                        children_of_original_feature = true;
                    }
                    // complex case of where we ask for an exon or polypeptide,
                    // then we have to check this mRNA's children
                    else if (requestedFeature.type.name == "exon" || requestedFeature.type.name == "polypeptide") {
                        children_of_original_feature = false;
                        for (var c in feature.children) {
                            var child = feature.children[c];
                            if (child.uniqueName == requestedFeature.uniqueName) {
                                children_of_original_feature = true;
                                break;
                            }
                        }
                    } else {
                        children_of_original_feature = false;
                    }
                } else {
                    // if it's none of the above, then we always show
                    children_of_original_feature = true;
                }

                if (children_of_original_feature == false) {
                    feature.children = [];
                }

                for (var ch in feature.children) {
                    trim(feature.children[ch]);
                }

            }

            trim(self.hierarchy);

        }

        self.get_sequence_length = function(region, success) {
            $.ajax({
                url : self.service + "/regions/sequenceLength.json",
                type : 'GET',
                dataType : 'jsonp',
                data : {
                    'region' : region
                },
                success : function(regions) {
                    self.sequenceLength = regions[0].length;
                    success(self.sequenceLength);
                }
            });
        }

        self.get_polypeptide_properties = function(success) {
            $.ajax({
                url : self.service + "/feature/polypeptide_properties.json",
                type : 'GET',
                dataType : 'jsonp',
                data : {
                    'uniqueName' : self.uniqueName
                },
                success : function(polypeptide_properties) {
                    self.polypeptide_properties = polypeptide_properties;
                    success();
                },
                error : function() {
                    self.polypeptide_properties = [ {
                        name : "Peptide Data",
                        value : "No predicted polypeptide data are available"
                    } ]
                    success();
                }
            });
        }

        self.get_isoform = function(uniqueName, success) {
            $.ajax({
                url : self.service + "/feature/isoform.json",
                type : 'GET',
                dataType : 'jsonp',
                data : {
                    'uniqueName' : uniqueName
                },
                success : function(isoform) {
                    success(isoform);
                }
            });
        }

        self.gene_name = function() {
            var types = self.types;
            return self.recurse_hierarchy(self.hierarchy, function(feature) {
                if ($.inArray(feature.type.name, types.gene) > -1)
                    return feature.uniqueName;
            });
        }

        self.transcripts = function() {
            var types = self.types;
            var transcripts = [];
            self.recurse_hierarchy(self.hierarchy, function(feature) {
                if (feature.type == null)
                    return;
                if (feature.type.name == null)
                    return;
                if ($.inArray(feature.type.name, types.transcript) > -1) {
                    transcripts.push(feature);
                }
            });

            transcripts.sort(function(t1, t2) {
                return (t1.uniqueName > t2.uniqueName);
            });

            return transcripts;
        }

        self.type = function() {
            var type = self.hierarchy.type.name;
            var types = self.types;
            self.recurse_hierarchy(self.hierarchy, function(feature) {
                if (feature.type == null)
                    return;
                if (feature.type.name == null)
                    return;
                if ($.inArray(feature.type.name, types.special_transcript) > -1)
                    type = feature.type.name;
                else if (feature.type.name == "polypeptide")
                    type = "Protein coding gene";
                else if (feature.type.name.contains("pseudo"))
                    type = "Pseudogene";
            });
            return type;
        }

        self.synonyms = function(type, feature_type, current) {
            var synonyms = {};
            
            self.recurse_hierarchy(self.hierarchy, function(feature) {

                if (feature_type != null) {
                    if (feature_type != feature.type.name) {
                        return;
                    }
                }

                var feature_synonyms = [];
                if (feature.synonyms != null && feature.synonyms.length > 0) {
                    for (var s in feature.synonyms) {
                        var synonym = feature.synonyms[s];
                        
                        if (current != null) {
                            if (current != synonym.is_current) {
                                continue;
                            }
                        }
                        
                        if (type == null || synonym.synonymtype == type)
                            feature_synonyms.push(synonym);
                    }
                }
                if (feature_synonyms.length > 0)
                    synonyms[feature.uniqueName] = feature_synonyms;
            });
            return synonyms;
        }

        self.gene_name = function() {
            return self.hierarchy.name;
        }

        self.systematic_name = function() {

            var systematicName = self.isoform.uniqueName;

            var transcripts = self.transcripts();
            var transcript_count = transcripts.length;

            if (transcript_count > 1) {
                systematicName += " (one splice form of " + self.hierarchy.uniqueName + ")";
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
            var terms_map = {};
            self.recurse_hierarchy(self.hierarchy, function(feature) {
                var terms = feature.terms;
                var matched = [];
                if (terms != null && terms.length > 0) {
                    for ( var t in terms) {
                        var term = terms[t];
                        if (cv == null || (term.cv != null && term.cv.name == cv)) {
                            matched.push(term)
                        }
                    }
                }
                if (matched.length > 0)
                    terms_map[feature.uniqueName] = matched;
            });
            return terms_map;
        }
        self.properties = function(property_names) {
            var prop_map = {}
            self.recurse_hierarchy(self.hierarchy, function(feature) {
                var matched = [];
                var properties = feature.properties;
                if (properties != null && properties.length > 0) {
                    for ( var p in properties) {
                        var property = properties[p];

                        var push = false;

                        if (property_names == null) {
                            push = true
                        } else if (property_names instanceof Array) {
                            for ( var pp in property_names) {
                                if (property_names[pp] == property.name) {
                                    push = true;
                                    break;
                                }
                            }
                        } else if (property.name == property_names) {
                            push = true;
                        }

                        if (push)
                            matched.push(property);
                    }
                }
                if (matched.length > 0)
                    prop_map[feature.uniqueName] = matched;
            });
            return prop_map;
        }
        self.pubs = function() {
            return self.get_attribute_map("pubs");
        }
        self.organism = function() {
            return self.hierarchy.organism;
        }
        self.order_terms = function(terms) {
            var new_terms = {}
            for (var f in terms) {
                var ordered = terms[f].sort(function(t1, t2) {
                    return t1.name.toLowerCase() > t2.name.toLowerCase();
                });
                new_terms[f] = ordered;
            }
            return new_terms;
        }
        self.domains = function() {

            // compound hash of
            // feature_uniqueName.category_dbxref_accession.domain_list
            var categorized_domains = {}

            // we must walk through each domain, and categorize by checking the
            // presence of an Interpro dbxref
            self.recurse_hierarchy(self.hierarchy, function(feature) {

                for (var d in feature.domains) {

                    var domain = feature.domains[d];
                    var key = "Other Matches";

                    for (var dx in domain.dbxrefs) {
                        var dbxref = domain.dbxrefs[dx];
                        if (dbxref.db == null)
                            continue;
                        if (dbxref.db.name == "InterPro") {
                            key = dbxref.accession;
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

            return categorized_domains;
        }
        
        self.domain_list = function() {
            
            var domains = [];

            // we must walk through each domain, and categorize by checking the
            // presence of an Interpro dbxref
            self.recurse_hierarchy(self.hierarchy, function(feature) {

                for (var d in feature.domains) {

                    var domain = feature.domains[d];
                    var key = "Other Matches";

                    for (var dx in domain.dbxrefs) {
                        var dbxref = domain.dbxrefs[dx];
                        if (dbxref.db == null)
                            continue;
                        if (dbxref.db.name == "InterPro") {
                            key = dbxref.accession;
                            break;
                        }
                    }
                    
                    if (domain.type != null && $.inArray(domain.type.name, self.membrs) > -1)
                        key = "Transmembrane";
                    
                    domain.key = key;
                    domains.push(domain);
                }
            });
            
            domains.sort(function(d1, d2) {
                return (d1.key > d2.key);
            });

            return domains;
        }
        
        // self.getBounds = function(domains) {
        //             var coordinates = self.coordinates()[0];
        //             var bounds = {
        //                 fmin : coordinates.fmin,
        //                 fmax : coordinates.fmax,
        //             }
        //             for (feature in domains) {
        // 
        //             }
        //         }

        self.orthologues = function() {
            return self.get_attribute_map("orthologues");
        }

        self.algorithm = function() {

            // $.log("ALLLLLLLLLL");

            // these are the names of algorithmic properies
            var algorithm = {
                SignalP_prediction : null,
                signal_peptide_probability : null,
                signal_anchor_probability : null,
                GPI_anchored : null,
                plasmoAP_score : null
            }

            self.recurse_hierarchy(self.hierarchy, function(feature) {
                var properties = feature.properties;
                if (properties != null && properties.length > 0) {
                    for ( var p in properties) {
                        var property = properties[p];
                        // $.log([property.name, property.value]);
                        if (property.name in algorithm) {
                            algorithm[property.name] = property.value;
                        }
                    }
                }
            });

            algorithm.tms = [];
            algorithm.cleavages = [];
            algorithm.signals = [];

            // we use a synchronous call here... tutut.
            function summary(domain) {
                var summary = $.ajax({
                    url : self.service + "/feature/info.json",
                    async : false,
                    data : {
                        uniqueName : domain.uniqueName
                    },
                    success : function(summary) {
                        domain.properties = summary.properties
                    }
                });
            }

            self.recurse_hierarchy(self.hierarchy, function(feature) {
                for (var d in feature.domains) {
                    var domain = feature.domains[d];
                    if (domain.type == null)
                        continue;
                    if (domain.type.name == "GPI_anchor_cleavage_site") {
                        summary(domain);
                        algorithm.cleavages.push(domain);
                    }
                    if (domain.type.name == "transmembrane_polypeptide_region") {
                        algorithm.tms.push(domain);
                    }
                    if (domain.type.name == "signal_peptide") {
                        summary(domain);
                        algorithm.signals.push(domain);
                    }
                }
            });

            return algorithm;
        }
    };

    /*
     * Provides functions that can be called from within templates, usually
     * generating links. An instance of this is created by the GenePage if one
     * isn't supplied in the options.
     */
    wa.ViewHelper = function(options) {

        var defaults = {
            baseLinkURL : "http://www.genedb.org/",
            links : {
                go : "cgi-bin/amigo/term-details.cgi",
                pub : "http://www.ncbi.nlm.nih.gov/entrez/query.fcgi?cmd=Retrieve&amp;db=PubMed&amp;dopt=Abstract&amp;list_uids=",
                product_others : "Query/controlledCuration",
                go_others : "Query/controlledCuration",
                cc_others : "Query/controlledCuration"
            },
            evidence : {
                'lab' : {
                    // Experimental Evidence
                    'EXP' : 'Inferred from Experiment',
                    'IDA' : 'Inferred from Direct Assay',
                    'IPI' : 'Inferred from Physical Interaction',
                    'IMP' : 'Inferred from Mutant Phenotype',
                    'IGI' : 'Inferred from Genetic Interaction',
                    'IEP' : 'Inferred from Expression Pattern'
                },
                'auto' : {
                    // Computational Analysis Evidence
                    'ISS' : 'Inferred from Sequence or Structural Similarity',
                    'ISO' : 'Inferred from Sequence Orthology',
                    'ISA' : 'Inferred from Sequence Alignment',
                    'ISM' : 'Inferred from Sequence Model',
                    'IGC' : 'Inferred from Genomic Context',
                    'IBA' : 'Inferred from Biological aspect of Ancestor',
                    'IBD' : 'Inferred from Biological aspect of Descendant',
                    'IKR' : 'Inferred from Key Residues',
                    'IRD' : 'Inferred from Rapid Divergence',
                    'RCA' : 'Inferred from Reviewed Computational Analysis',
                    // Automatically-assigned Evidence
                    'IEA' : 'Inferred from Electronic Annotation'
                },
                'journal' : {
                    // Author Statement Evidence
                    'TAS' : 'Traceable Author Statement',
                    'NAS' : 'Non-traceable Author Statement',
                    // Curator Statement Evidence
                    'IC' : 'Inferred by Curator',
                    'ND' : 'No biological Data available'
                }
            },
            image : {
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
                "TIGR_TIGRFAMS" : "rgb(0, 255, 255)",
                "CATEGORY" : "rgb(255, 0, 0)",
                "TM" : 'blue'
            }
        };

        var self = this;
        $.extend(self, defaults, options);
        self.organism = null;

        self.evidence_category = function(supplied_evidence) {
            for (var c in self.evidence) {
                for (var e in self.evidence[c]) {
                    if (supplied_evidence == self.evidence[c][e]) {
                        return c;
                    }
                }
            }
            return null;
        }

        self.go_link = function(accession) {
            return self.baseLinkURL + self.links.go + "?species=GeneDB_" + self.organism.common_name + "&term=" + accession;
        }

        self.go_others_link = function(term, cv, suppress) {
            var link = self.baseLinkURL + self.links.go_others + "?taxons=" + self.organism.common_name + "&cvTermName=" + term + "&cv=" + cv;
            if (suppress != null)
                link += "&suppress=" + suppress;
            return link;
        }

        self.others_product_link = function(product_name, suppress) {
            var link = self.baseLinkURL + self.links.product_others + "?taxons=" + self.organism.common_name + "&cvTermName=" + product_name + "&cv=genedb_products";
            if (suppress != null)
                link += "&suppress=" + suppress;
            return link;
        }

        // http://www.genedb.org/Query/controlledCuration?taxons=Tbruceibrucei927&cvTermName=RIT-Seq+phenotype%3A+Normal+cell+proliferation+in+bloodstream+trypomastigote+stage+6+days&cv=ControlledCuration&suppress=
        self.others_cc_link = function(term, suppress) {
            var link = self.baseLinkURL + self.links.cc_others + "?taxons=" + self.organism.common_name + "&cvTermName=" + term + "&cv=ControlledCuration";
            if (suppress != null)
                link += "&suppress=" + suppress;
            return link;
        }

        self.img = function(props) {
            for (var p in props) {
                var prop = props[p];
                if (prop.type != null && prop.type.name == "evidence") {
                    var evidence = prop.value;
                    return self.image.prefix + self.evidence_category(evidence) + self.image.suffix;
                }
            }
            return null;
        }

    }

    wa.ProteinMap = function(options, hierarchy, domains, sequenceLength) {

        var defaults = {
            step_number : 10,
            pixel_width : 850
        }

        var self = this;
        $.extend(self, defaults, options);

        self.hierarchy = hierarchy;
        self.domains = domains;
        self.sequenceLength = sequenceLength;

        // self.init = function() {
        // //var coordinates = self.coordinates()[0];
        // self.bounds = {
        // fmin : sequenceLength,
        // fmax : 1
        // }
        // self.positions = {}
        // for (var feature in domains) {
        // for (var category in domains[feature]) {
        // var domain = domains[feature][category];
        // self.positions [feature+"::"+category] = {
        // fmin : domain.fmin,
        // fmax : domain.fmax
        // }
        // if (domain.fmin < self.bounds.fmin)
        // self.bounds.fmin = domain.fmin;
        // if (domain.fmin > self.bounds.fmax)
        // self.bounds.fmax = domain.fmax;
        // }
        //    	        
        // }
        // return bounds;
        // }

        self.isOverlap = function(bounds) {
//            for ( var feature in self.domains) {
//
//                for ( var category in self.domains[feature]) {
//
//                    var domains = self.domains[feature][category];

                    for ( var d in self.domains) {
                        var domain = domains[d];

                        var domain_box = {
                            x : domain.fmin,
                            width : domain.fmax - domain.fmin
                        }

                        var bounds_box = {
                            x : bounds.fmin,
                            width : bounds.fmax - bounds.fmin
                        }

                        var d1 = self.pointInBox(domain.fmin, bounds_box);
                        var d2 = self.pointInBox(domain.fmax, bounds_box);
                        var b1 = self.pointInBox(bounds.fmin, domain_box);
                        var b2 = self.pointInBox(bounds.fmax, domain_box);

                        if (d1 || d2 || b1 || b2) {
                            return true;
                        }

                        // $.log(category, domain.uniqueName, bounds.fmin,
                        // domain.fmin, domain.fmax, bounds.fmax,
                        // bounds.fmin <= domain.fmin && domain.fmin <=
                        // bounds.fmax,
                        // bounds.fmin <= domain.fmax && domain.fmax <=
                        // bounds.fmax);
                        // if ((bounds.fmin <= domain.fmin && domain.fmin <=
                        // bounds.fmax) ||
                        // (bounds.fmin <= domain.fmax && domain.fmax <=
                        // bounds.fmax)) {
                        // //$.log("!");
                        // return true;
                        // }
                    }

//                }
//            }
            return false;
        }

        self.pointInBox = function(point, box) {
            var pointOverX = box.x < point;
            var pointUnderX2 = (box.x + box.width) > point;
            return (pointOverX && pointUnderX2);
        }
        
        self.pointInBoxVertical = function(point, box) {
            var pointOverY = box.y < point;
            var pointUnderY2 = (box.y + box.height) > point;
            return (pointOverY && pointUnderY2);
        }

        self.boxesOverlap = function(box1, box2, debug) {

            // the y property is what we are adjusting in the box1
            // the base_y of box2 is what we are comparing against
            var boxes_same_height = (box1.y == box2.y);

            if (debug)
                $.log(box1.y, box2.y, boxes_same_height);

            if (!boxes_same_height)
                return false;

            var box1x_in_box2 = self.pointInBox(box1.x, box2);
            var box1x2_in_box2 = self.pointInBox(box1.x + box1.width, box2);

            var box2x_in_box1 = self.pointInBox(box2.x, box1);
            var box2x2_in_box1 = self.pointInBox(box2.x + box2.width, box1);
            
            
            var box1y_in_box2 = self.pointInBoxVertical(box1.y, box2);
            var box1y2_in_box2 = self.pointInBox(box1.y + box1.height, box2);

            var box2y_in_box1 = self.pointInBox(box2.y, box1);
            var box2y2_in_box1 = self.pointInBox(box2.y + box2.height, box1);

            // $.log(box1.uniqueName, box1x_in_box2,box1x2_in_box2,
            // box2.uniqueName, box2x_in_box1, box2x2_in_box1);

            if (debug)
                $.log([ box1.fmin, box1.fmax, box2.fmin, box2.fmax, box1x_in_box2, box1x2_in_box2, box2x_in_box1, box2x2_in_box1 ]);

            if (box1x_in_box2 || box1x2_in_box2 || box2x_in_box1 || box2x2_in_box1 ||
                    box1y_in_box2 || box1y2_in_box2 || box2y_in_box1 || box2y2_in_box1
            ) {
                return true;
            }
            
            
            
            
            

            return false;
        }

        self.showSection = function(base_position) {
            for ( var b in self.shown) {
                var bounds = self.shown[b];
                if (bounds.fmin <= base_position && bounds.fmax >= base_position)
                    return true;
            }
            return false;
        }

        self.totalGapLength = function() {
            var gapLength = 0;
            for (var g in self.gaps) {
                var gap = self.gaps[g];
                gapLength += (gap.fmax - gap.fmin);
            }
            return gapLength;
        }

        self.getDivPosition = function(base_position) {
            var subtract = 0;
            for (var g in self.gaps) {
                var gap = self.gaps[g];
                var gap_length = gap.fmax - gap.fmin;

                if (gap.fmax < base_position) {
                    subtract += gap_length;
                } else {
                    break;
                }
            }
            // $.log(g, self.gaps[g -1], base_position, subtract, base_position
            // - subtract);
            return base_position - subtract;
        }

        self.scaleX = function(base_position) {
            var coordinates = self.hierarchy.coordinates[0];
            var base_length = coordinates.fmax - coordinates.fmin;

            var totalGapLength = self.totalGapLength();

            var max = base_length - totalGapLength;

            var div_position = self.getDivPosition(base_position);

            var pos = (self.pixel_width / max) * div_position

            // $.log("scaleX", base_length, totalGapLength, max, base_position,
            // "div:", div_position, self.pixel_width, pos);

            return pos;
        }

        self.determine_step = function(max) {

            function log10(val) {
                return Math.log(val) / Math.log(10);
            }

            // diff = max; // divide by 3 for amino acids

            var stepsUncorrected = max / self.step_number;
            var log = log10(stepsUncorrected);
            var round = Math.floor(log);
            var step = Math.pow(10, round);
            return step;
        }
        
        self.re_max = function (box) {
            var box_max_y = box.y + box.dy;
            if (box_max_y > self.max_y)
                self.max_y = box_max_y;
        }
        
        self.determine_domain_positions = function() {
            var categories = [];
            var domains_hash = {};
            var category_boxes_hash = {};
            var category_boxes_list = [];
            var subcategory_boxes_list = [];
            
            var _gap = 5;
            var _height = 5;
            var _y = 0;
            var _start_y = 20;
            
            for ( var d in self.domains) {
                var domain = domains[d];
                var category = domain.key;
                
                if ($.inArray(category, categories) == -1) {
                    categories.push(category);
                    domains_hash[category] = [];
                    
                    var coordinates = self.hierarchy.coordinates[0];
                    
                    var _fmin = 1;
                    var _fmax = (coordinates.fmax - coordinates.fmin) / 3;
                    
                    var _x = self.scaleX(_fmin);
                    var _width = self.pixel_width;
                                        
                    var _colour = wa.viewHelper.colours["CATEGORY"];
                    
                    var description = category;
                    
                    if (domain.dbxrefs != null && domain.dbxrefs.length > 0) {
                        description += " - " + domain.dbxrefs[0].description;
                    }
                    
                    var category_box = {
                        type : "CATEGORY",
                        dbxref : null,
                        category : category,
                        uniqueName : category,
                        text: description,
                        x : _x,
                        y : _y,
                        dy : 0,
                        fmin : _fmin,
                        fmax : _fmax,
                        width : _width,
                        height : _height,
                        colour : '',
                        bordercolour : 'rgb(200,200,200)',
                        is_category_box : true
                    }
                    
                    category_boxes_hash[category] = category_box;
                    category_boxes_list.push(category_box)
                    
                    _y = category_box.y + category_box.height + _gap;
                    
                }
                
                domains_hash[category].push(domain);
            }
            
            
            
            for ( var c in categories) {
                var category = categories[c];
                
                var category_box = category_boxes_hash[category];
                
                var this_subcategory_boxes_list = [];
                
                for (var d in domains_hash[category]) {
                    var domain = domains_hash[category][d];
                    
                    var x = self.scaleX(domain.fmin);
                    var width = self.scaleX(domain.fmax) - x;
                    
                    var dbname = "";
                    var dbxref = null; 
                    
                    for (var dx in domain.dbxrefs) {
                        // we don't break, we want the last value
                        dbxref = domain.dbxrefs[dx];
                        if (dbxref.db != null)
                            dbname = dbxref.db.name;
                    }
                    
                    var colour = null;
                    if (dbname != null) {
                        colour = wa.viewHelper.colours[dbname];
                    }

                    // if still null
                    if (colour == null) {
                        colour = wa.viewHelper.colours["default"];
                    }
                    var type = "";
                    if (domain.type != null)
                        type = domain.type.name;
                    
                    var box = {
                        type : type,
                        dbxref : dbxref,
                        category : category,
                        //feature : feature,
                        uniqueName : domain.uniqueName,
                        x : x,
                        y : _start_y,
                        dy : 0,
                        fmin : domain.fmin,
                        fmax : domain.fmax,
                        width : width,
                        height : _height,
                        colour : colour,
                        bordercolour : colour
                    }
                    
                    var is_membr = false;
                    if (domain.type != null) {
                        is_membr = ($.inArray(domain.type.name,self.membrs) > -1);
                    }
                    
                    if (is_membr) {
                        
                        box.colour =  wa.viewHelper.colours['TM'];
                        box.bordercolour = wa.viewHelper.colours['TM'];
                        
                        if (domain.type.name == "non_cytoplasmic_polypeptide_region") {
                            box.height = _height / 2;
                            box.dy += _height / 2;
                        } else if (domain.type.name == "cytoplasmic_polypeptide_region") {
                            box.height = _height / 2;
                        } //else if (domain.type.name == "transmembrane_polypeptide_region") {
                            // not sure if this is necessary
                        //}
                        
                    } else {
                        var overlaps = true;
                        while (overlaps == true) {
                            overlaps = false;
                            for (var p in this_subcategory_boxes_list) {
                                var previous = this_subcategory_boxes_list[p];
                                //$.log([box.uniqueName, previous.uniqueName, self.boxesOverlap(box, previous)]);
                                if (self.boxesOverlap(box, previous)) {
                                    box.y = previous.y + previous.height + _gap;
                                    overlaps = true;
                                }
                            }
                        }
                    }
                    
                    var new_category_box_height = (box.height + box.y + _gap);
                    
                    if (new_category_box_height > category_box.height) {
                        category_box.height = new_category_box_height;
                    }
                    
                    this_subcategory_boxes_list.push(box);
                    subcategory_boxes_list.push(box);
                }
                
                
            }
            
            
            // assemble the domain graph now
            for (var c in category_boxes_list) {
                var category_box = category_boxes_list[c];
                
                var previous = category_boxes_list[c-1];
                if (previous != null) {
                    var previous_max_y = previous.y + previous.height + _gap;
                    if (category_box.y < previous_max_y) {
                        category_box.y = previous_max_y;
                    }
                }
                
                
                self.re_max(category_box);
                self.domain_graph.push(category_box);
                
            }
            
            
            for (var s in subcategory_boxes_list) {
                var box = subcategory_boxes_list[s];
                var category = box.category;
                var category_box = category_boxes_hash[category];
                
                if (category_box != null)
                    box.y += category_box.y;
                
                self.re_max(box);
                self.domain_graph.push(box);
            }
            
        }
        

        self.init = function() {
            self.gaps = [];
            self.shown = [];
            var coordinates = self.hierarchy.coordinates[0];
            var max = coordinates.fmax - coordinates.fmin;

            var step = self.determine_step(max); // 50;
            self.step = step;

            var pos = 0;
            // var pos2 = pos + step;
            for ( var i = 0; pos <= max; i++) {

                pos = (i * step);

                if (pos > max)
                    break;

                var pos2 = pos + step;

                if (pos2 > max)
                    pos2 = max;

                // $.log(i, "pos", pos, "pos2", pos2);

                var bounds = {
                    fmin : pos,
                    fmax : pos2
                };
                if (self.isOverlap(bounds)) {
                    self.shown.push(bounds);
                } else {
                    self.gaps.push(bounds);
                }
            }
            // $.log("shown");
            for ( var b in self.shown) {
                var box = self.shown[b];
                box.x = self.scaleX(box.fmin);
                // box.x2 = self.scaleX(box.fmax);
                // $.log(box.fmin, box.x);
            }
            // $.log("gaps");

            var merged_gaps = [];

            for ( var b in self.gaps) {
                var box = self.gaps[b];
                box.x = self.scaleX(box.fmin);
                box.x2 = self.scaleX(box.fmax);
                // $.log(box.fmin, box.x);

                var merging = false;
                for (var m in merged_gaps) {
                    var merged_gap = merged_gaps[m];
                    if (merged_gap.x2 == box.x) {
                        merged_gap.x2 = box.x2;
                        merged_gap.fmax = box.fmax;
                        merging = true;
                        break;
                    }
                }
                if (!merging) {
                    merged_gaps.push({
                        fmin : box.fmin,
                        fmax : box.fmax,
                        x : box.x,
                        x2 : box.x2
                    });
                }
            }

            // $.log(merged_gaps);

            self.gaps = merged_gaps;

            self.domain_graph = [];

            // self.y = 0;
            self.membrs = [ "non_cytoplasmic_polypeptide_region", "cytoplasmic_polypeptide_region", "transmembrane_polypeptide_region" ];
            self.max_y = 0;

            self.determine_domain_positions();

        }

        self.init();
    }

    /*
     * Initiates a gene page
     */
    wa.GenePage = function(options) {

        var defaults = {
            uniqueName : "fred",
            webArtemisPath : "wa",
            trim_for_transcripts : true,
            template_options : {
                templateUrl : current_directory + "/tpl",
                templateSuffix : ".html"
            },
            baseLinkURL : "http://www.genedb.org/",
            extraDbxrefs : function(uniqueName, organism) {
                var dbxrefs = [];
                if (organism.genus == "Plasmodium") {
                    dbxrefs.push({
                        db : {
                            name : "PlasmoDB",
                            urlprefix : "http://plasmodb.org/gene/"
                        },
                        accession : uniqueName
                    });
                } else if (organism.common_name == "Lmajor" || organism.common_name == "Linfantum" || organism.common_name == "Lbraziliensis" || organism.common_name == 'Tbruceibrucei927' || organism.common_name == 'Tbruceibrucei427' || organism.common_name == 'Tbruceigambiense' || organism.common_name == 'Tvivax' || organism.common_name == 'Tcruzi') {
                    dbxrefs.push({
                        db : {
                            name : "TriTrypDB",
                            urlprefix : "http://tritrypdb.org/gene/"
                        },
                        accession : uniqueName
                    });
                }
                return dbxrefs;
            },
            spinner : ".spinner",
            observers : [],
            months : ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"]
        }

        var self = this;
        $.extend(self, defaults, options);

        $(self.spinner).CallStatusSpinner();

        // if no viewHelper was passed in the options, instanciate one
        if (self.viewHelper == null)
            self.viewHelper = new wa.ViewHelper({
                baseLinkURL : self.baseLinkURL
            });

        // we attach the instance of the view helper to the wa namespace,
        // effectively treating it as a singleton
        wa.viewHelper = self.viewHelper;

        ko.externaljQueryTemplateEngine.setOptions(self.template_options);

        self.init = function() {
            self.geneInfo = new wa.GeneInfo();
            self.info(self.geneInfo, self.uniqueName, self.on_init);
        }

        self.info = function(geneInfo, uniqueName, onComplete) {
            geneInfo.uniqueName = uniqueName;

            $(self.spinner).CallStatusSpinner("addCall");
            $(".gene_page").fadeTo(500, 0.25);

            geneInfo.get_polypeptide_properties(function() {

                geneInfo.get_hierarchy(self.trim_for_transcripts, function() {

                    var geneName = geneInfo.gene_name();
                    var transcripts = geneInfo.transcripts();
                    var type = geneInfo.type();
                    
                    var synonyms = geneInfo.synonyms("synonym");
                    var product_synonyms = geneInfo.synonyms("product_synonym");
                    var previous_systematic_ids = geneInfo.synonyms("previous_systematic_id", null, true);
                    
                    
                    var systematicName = geneInfo.systematic_name();
                    
                    var organism = geneInfo.organism();
                    wa.viewHelper.organism = organism;

                    var dbxrefs = geneInfo.dbxrefs();
                    var extra_dbxrefs = self.extraDbxrefs(self.uniqueName, organism);

                    var coordinates = geneInfo.coordinates();
                    var products = geneInfo.terms("genedb_products");
                    var controlled_curation = geneInfo.order_terms(geneInfo.terms("CC_genedb_controlledcuration"));
                    var domains = geneInfo.domains();
                    
                    var domain_list = geneInfo.domain_list();
                    //$.log(domain_graph);
//                    for (var d in domain_list) {
//                        var dg = domain_list[d];
//                        $.log(dg.key, dg.uniqueName);
//                    }
                    
                    var orthologues = geneInfo.orthologues();
                    var algorithm = geneInfo.algorithm();

                    wa.viewModel = {
                        systematicName : systematicName,
                        type : type,
                        dbxrefs : dbxrefs,
                        extra_dbxrefs : extra_dbxrefs,
                        geneName : geneName,
                        products : products,
                        synonyms : synonyms,
                        product_synonyms : product_synonyms,
                        previous_systematic_ids : previous_systematic_ids,
                        len : function(maps) { // returns the combined size of
                            // a list of maps
                            var count = 0
                            for (var m in maps) {
                                for (mm in maps[m]) {
                                    count++;
                                }
                            }
                            return count;
                        },
                        pubs : geneInfo.pubs(),
                        notes : geneInfo.properties("note"),
                        comments : geneInfo.properties("comment"),
                        curations : geneInfo.properties("curation"),
                        cellular_component : geneInfo.terms("cellular_component"),
                        molecular_function : geneInfo.terms("molecular_function"),
                        biological_process : geneInfo.terms("biological_process"),
                        organism : organism,
                        controlled_curation : controlled_curation,
                        domains : domains,
                        coordinates : coordinates,
                        orthologues : orthologues,
                        algorithm : algorithm,
                        /*
                         * This is a replacement of the first_element() appraoch below. The context of the function (this) is usually the data that's passed into a template
                         * for example :
                         * 
                         *  data-bind="template: {name: 'synonyms', data: {synonyms:previous_systematic_ids,separate:separate,name:'previous_systematic'} }"
                         *  
                         *  so the internal this.elements hashtable that is created will only be visible within that scope. Makes it useful therefore for separating elements
                         *  of a list within a template's scope. Should not be used therefore for templates that do not have a data pasesed into them directly, and which
                         *  are therefore relying on the wa.viewModel scope.
                         *  
                         */
                        separate : function (name, separator) {
                            if (this.elements == null)
                                this.elements = {};
                            if (this.elements[name] == null)
                                this.elements[name] = 0;
                            else
                                this.elements[name]++;
                            if (this.elements[name] > 0)
                                return separator;
                            return '';
                        },
                        /*
                         * TODO All uses of first_element should eventually be replaced with the above separate function. first_element itself works, but for some reason
                         * jquery.template {{if}} statements are called more than expected - probably due to knockout binding.  
                         */
                        first_element : function(name, x) {
                            
                            //$.log("first_element",name,wa.viewModel.first_element[name]);
                            if (wa.viewModel.first_element[name] == null) {
                                wa.viewModel.first_element[name] = true;
                                // $.log("first_element",name, true, x, this);
                                return true;
                            }
                            // $.log("first_element",name, false, x, this);
                            return false;
                        },
                        camel_to_title : function(camel) {
                            var tokens = camel.split("_");
                            var title = [];
                            for (var t in tokens) {
                                var token = tokens[t];
                                if (token != null && token.length > 0) {
                                    if (token.hasOwnProperty("charAt")) {
                                        var first_char = token.charAt(0);
                                        var first_char_uppercased = first_char.toUpperCase();
                                        var the_rest = token.slice(1);
                                        var uppercased = first_char_uppercased + the_rest;
                                        title.push(uppercased);
                                    } else {
                                        title.push(token);
                                    }
                                    
                                }
                            }
                            return title.join(" ");
                        },
                        baseLinkURL : self.baseLinkURL,
                        polypeptide_properties : geneInfo.polypeptide_properties
                    }

                    var proteinMap = new wa.ProteinMap({}, geneInfo.hierarchy, domain_list, geneInfo.sequenceLength);
                    wa.viewModel.domain_graph = proteinMap.domain_graph;
                    wa.viewModel.domain_graph_shown = proteinMap.shown;
                    wa.viewModel.domain_graph_hidden = proteinMap.gaps;
                    wa.viewModel.domain_graph_max_y = proteinMap.max_y;
                    
                    if (geneInfo.hierarchy.timelastmodified != null) {
                        var lastmodifiedSplit = geneInfo.hierarchy.timelastmodified.split(" ")[0].split("."); 
                        
                        var day = lastmodifiedSplit[0];
                        if (day.length == 1)
                            day += "0";
                        
                        // var month = lastmodifiedSplit[1];
                        //                         if (month.startsWith("0"))
                        //                             month = month.substr(1);
                        //                         month = self.months[parseInt(month) - 1];
                        
                        // parseInt needs to be told the raddix is base 10 for strings that start with "0" (e.g. "01")
                        var month = self.months[parseInt(lastmodifiedSplit[1], 10) - 1];
                        
                        var year = lastmodifiedSplit[2];
                        
                        wa.viewModel.lastmodified = day + " " + month + " " + year;
                    } 
                    

                    ko.applyBindings(wa.viewModel);

                    // $.log(["onComplete?",
                    // onComplete]);

                    // self.embed_web_artemis(coordinates[0]);
                    $(".absolute_tool").AbsoluteToolTips();
//                    $(".absolute_tool").AbsoluteToolTips().hover(function(e){
//                        $(this).css('borderColor','red');
//                    }, function(e){
//                        $(this).css('borderColor', 'black')
//                    });
                    
                    
                    
                    // $(".evidence").AbsoluteToolTips();

                    $("#tabs").tabs();

                    $(self.spinner).CallStatusSpinner("removeCall");
                    $(".gene_page").stop().fadeTo(100, 1);

                    if (onComplete != null)
                        onComplete(geneInfo.hierarchy);

                    // if (self.embedded_web_artemis != null) {
                    // self.embedded_web_artemis.recoordinate(coordinates[0]);
                    // }

                });
            });
        }

        self.on_init = function(feature) {
            self.geneInfo.get_sequence_length(feature.coordinates[0].region, function(sequenceLength) {
                self.embedded_web_artemis = new wa.EmbeddedWebArtemis({
                    coordinates : feature.coordinates[0],
                    webArtemisPath : self.webArtemisPath,
                    sequenceLength : sequenceLength,
                    observers : [ self ]
                });
            });

            // to determine the isoform, we need to known the requested feature
            // (or else we might get the wrong isoform)
            self.geneInfo.get_isoform(self.geneInfo.requestedFeature.uniqueName, function(isoform) {
                self.notify(isoform);
            });
        }

        self.redraw = function redraw(start, end) {
            // $.log("REDRAW DETECTED " + start + " " + end);
            wa.webArtemisLinker.link(start, end);
        };

        self.select = function(uniqueName, fDisplay) {
            // $.log("SELECT DETECTED " + uniqueName + " ON DISPLAY " +
            // fDisplay);
            self.geneInfo.get_isoform(uniqueName, function(isoform) {
                $.history.load(isoform.uniqueName);
                self.notify(isoform);
            });
        };

        self.notify = function(isoform) {
            for ( var o in self.observers) {
                var observer = self.observers[o];
                var uniqueName = isoform.uniqueName;
                if (observer != null && uniqueName != null) {
                    if (observer.hasOwnProperty("select")) {
                        observer.select(uniqueName);
                    }
                }
            }
        }

        /*
         * Used to store the original uniquename. And to know if the object has
         * already been initialised.
         */
        self.original_uniquename = null;

        $.history.init(function(hash) {
            if (self.original_uniquename == null) {
                if (hash != "") {
                    self.uniqueName = hash;
                }
                self.original_uniquename = self.uniqueName;
                self.init();
            } else {
                if (hash == "") {
                    self.info(self.geneInfo, self.original_uniquename);
                } else {
                    self.info(self.geneInfo, hash);
                }
            }
        }, {
            unescape : ",/"
        });

    }

    wa.WebArtemisLinker = function(options) {
        var defaults = {
            baseURL : "http://www.genedb.org/web-artemis/?src=",
            web_artemis_link : "#web-artemis-link",
            web_artemis_link_container : "#web-artemis-link-container",
            web_artemis_container : ".wacontainer",
            region : "some_contig"
        }
        var self = this;
        $.extend(self, defaults, options);

        $(self.web_artemis_container).hover(function(e) {
            $(self.web_artemis_link_container).show();
        }, function(e) {
            $(self.web_artemis_link_container).hide();
        });

        self.link = function(fmin, fmax) {
            var href = self.baseURL + self.region + "&base=" + fmin + "&bases=" + (fmax - fmin);
            $(self.web_artemis_link).attr("href", href);
        }

    }

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
            observers : [ function() {
                $.log("default change");
            } ],
            leftpadding : 1000,
            rightpadding : 1000
        }

        var self = this;
        $.extend(self, defaults, options);

        wa.webArtemisLinker = new wa.WebArtemisLinker({
            leftpadding : self.leftpadding,
            rightpadding : self.rightpadding,
            region : self.coordinates.region
        });

        var topLevelFeatureLength = parseInt(self.sequenceLength, 10);
        var max = self.max_residues;
        var needsSlider = true;
        if (max > topLevelFeatureLength) {
            max = topLevelFeatureLength;
            // needsSlider = false;
        }
        var zoomMaxRatio = max / parseInt(self.sequenceLength, 10);

        // $.log("zooom " + zoomMaxRatio);

        $(self.chromosome_map_element).ChromosomeMap({
            region : self.coordinates.region,
            overideUseCanvas : false,
            bases_per_row : parseInt(self.sequenceLength, 10),
            row_height : 10,
            row_width : 870,
            overideUseCanvas : true,
            loading_interval : 100000,
            axisLabels : false,
            row_vertical_space_sep : 10,
            web_service_root : self.service
        });

        // $.log(self.coordinates);

        var real_fmin = self.coordinates.fmin - self.leftpadding;
        if (real_fmin < 1)
            real_fmin = 1;

        var real_fmax = self.coordinates.fmax + self.rightpadding;

        wa.webArtemisLinker.link(real_fmin, real_fmax);

        var initial_window_size = real_fmax - real_fmin;

        $(self.web_artemis_element).WebArtemis({
            source : self.coordinates.region,
            start : real_fmin,
            bases : initial_window_size,
            showFeatureList : false,
            width : 950,
            directory : self.webArtemisPath,
            showOrganismsList : false,
            webService : self.service,
            draggable : false,
            mainMenu : false,
            zoomMaxRatio : zoomMaxRatio
        });

        var chromosomeMapToWebArtemis = new ChromosomeMapToWebArtemis();

        if (needsSlider) {
            
            
            
            
            
            // added spaces to see if this is it.
            $(self.chromosome_map_slider_element).ChromosomeMapSlider({
                windowWidth : 870,
                max : parseInt(self.sequenceLength, 10),
                observers : [ chromosomeMapToWebArtemis ],
                pos : real_fmin,
                width : initial_window_size
            });
            
            // the timeout is needed to initialize Web-Artemis
            setTimeout(function() {
                for (var o in self.observers) {
                    $(self.web_artemis_element).WebArtemis('addObserver', self.observers[o]);
                }
                $(self.web_artemis_element).WebArtemis('addObserver', new WebArtemisToChromosomeMap(self.chromosome_map_slider_element));
            }, 500);
        }

//        self.recoordinate = function(coordinates) {
//            var fDisplay = featureDisplayObjs[0];
//            var p = parseInt(coordinates.fmin - (fDisplay.basesDisplayWidth / 2), 10);
//            chromosomeMapToWebArtemis.move(p);
//            wa.webArtemisLinker.link(p, fDisplay.basesDisplayWidth);
//        }

    }

});
