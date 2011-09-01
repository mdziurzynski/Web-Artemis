
$(function(){
	
	/**
	 * A namespace for Web-Artemis MVC classes.
	 */
	window.wa = {};
	
	wa.Feature = Spine.Class.create({
		uniqueName : "",
		name : "",
		coordinates : [],
		properties : [],
		dbxrefs : [],
		synonyms: [],
		terms : []
	});
	
	wa.LocatedFeature = wa.Feature.create({
		fmin : 0,
		fmax : 0,
		region : "",
		parent : "",
		parentRelationshipType : "part_of",
		phase : 0,
		strand : -1,
		fmin_partial : false,
		fmax_partial : false
	});
	
	wa.Coordinates = Spine.Class.create({
		fmin : 0,
		fmax : 0,
		region : "",
		phase : 0,
		strand : 0,
		toplevel : true
	});
	
	wa.Property = Spine.Class.create({
		name: "", 
		value : ""
	});
	
	wa.Cv = Spine.Class.create({
		name:""
	});
	
	wa.CvTerm = Spine.Class.create({
		name:"", 
		cv : null
	});
	
	wa.Synonym = Spine.Class.create({
		synonym : "",
		synonymtype : "synonym",
		is_current : true
	});
	
	wa.Dbxref = Spine.Class.create({
		database : "",
		accession : "",
		urlprefix : "",
		description : ""
	});
	
	
	
	
	
	/**
	 * Models. 
	 */
    // wa.FeatureLocationModel = Spine.Model.setup("FeatureLocationModel", [ "feature", "region"]);
    // wa.FeatureProductModel = Spine.Model.setup("FeatureProductModel", [ "name", "props", "pubs", "dbxrefs", "count"]);
    // wa.FeatureSummaryItem = Spine.Model.setup("FeatureSummaryItem", [ "key", "name", "value" ]);
    // 
    // 
    // wa.DbxrefModel= Spine.Model.setup("FeatureSummaryDbxref", [ "dbxref" ]);
    // 
    // wa.FeatureSummarySpecialDbxrefModel= Spine.Model.setup("FeatureSummarySpecialDbxref", [ "name", "dbxref" ]);
	
	
	
	
	/**
	 * A generic controller that expects a the model to be passed in as a model attribute.
	 */
    // wa.FeatureSummaryItemController= Spine.Controller.create({
    //  tag : "tr",
    //  proxied : [ "render", "remove" ], 
    //  init : function() {
    //      this.model.bind("update", this.render);
    //      this.model.bind("destroy", this.remove);
    //  },
    //  render : function() {
    //      var elements = $.tmpl(this.template_name, this.model);
    //      this.el.html(elements);
    //      this.refreshElements();
    //      this.model.save();
    //      return this;
    //  },
    //  destroy : function() {
    //      this.model.destroy();
    //  },
    //  remove : function() {
    //      this.el.remove();
    //  }
    // });
    // 
    // wa.FeatureDbxrefController = Spine.Controller.create({
    //  tag : "tr",
    //  proxied : [ "render", "remove", "addDbxref" ], 
    //  elements : {
    //      ".dbxrefs" : "dbxrefs"
    //  },
    //  init : function(){
    //      this.el.append($.tmpl(this.template_name, {name:"See Also"}));
    //  },
    //  render : function() {
    //      $.log("RENDERBENDER");
    //             //          var elements = $.tmpl(this.template_name, {name:"See Also"});
    //             // this.el.html(elements);
    //             // this.refreshElements();
    //      return this;
    //  },
    //  addDbxref : function(dbxrefModel) {
    //      $.log(dbxrefModel);
    //      var view = wa.FeatureSummaryItemController.init({
    //          model : dbxrefModel,
    //          template_name : "FeatureSingleDbxrefTemplate",
    //          tag : "li"
    //      });
    //      // TODO - not sure why this doesn't work - the elements hais set above
    //      //$(this.dbxrefs).append(view.render().el);
    //      this.$(".dbxrefs").append(view.render().el)
    //  }
    // });
    // 
    // wa.FeatureSummary = Spine.Controller.create({
    //  tag : "div",
    //  init : function() {
    // 
    //      // FeatureSummaryItem.bind("create", this.add);
    //      // FeatureSummaryItem.bind("refresh", this.addAll);
    //  },
    //  add : function(item) {
    //      var view = wa.FeatureSummaryItemController.init({
    //          model : item, 
    //          template_name : "FeatureSummaryTemplate"
    //      });
    //      $(this.items).append(view.render().el);
    //  },
    //  addLocation: function (locationModel) {
    //      var view = wa.FeatureSummaryItemController.init({
    //          model : locationModel,
    //          template_name : "FeatureSummaryLocationTemplate"
    //      });
    //      $(this.items).append(view.render().el);
    //  },
    //  addProduct: function (productModel) {
    //      var view = wa.FeatureSummaryItemController.init({
    //          model : productModel,
    //          template_name : "FeatureProductSummaryTemplate"
    //      });
    //      $(this.items).append(view.render().el);
    //  },
    //  addDbxref: function(dbxrefModel) {
    //      if (this.dbxrefView == null) {
    //          this.dbxrefView = wa.FeatureDbxrefController.init({
    //              template_name : "FeatureDbxrefsTemplate"
    //              //, el : "#gene_summary_dbxrefs" 
    //          });
    //      }
    //      this.dbxrefView.addDbxref(dbxrefModel);
    //      $(this.items).append(this.dbxrefView.render().el);
    //  }
    // });
		    
	
	
	
	
	
	
	
	
//	
//	
//	window.FeatureModel = Backbone.Model.extend({});	
//	window.FeatureProductModel = Backbone.Model.extend({});
//	window.FeatureSeeAlsoModel = Backbone.Model.extend({});
//	window.PropertyModel = Backbone.Model.extend({});
//	window.TermModel = Backbone.Model.extend({});
//	
//	window.FeatureSummaryView = Backbone.View.extend({
//		tagName:  "ul",
//		//template: _.template(window.FeatureSummaryTemplate),
//		template: $.template( "FeatureSummaryTemplate", window.FeatureSummaryTemplate ),
//	    initialize: function(){
//	        _.bindAll(this, 'render'); // fixes loss of context for 'this' within methods 
//	         this.render(); // not all views are self-rendering. This one is.
//	         this.model.bind('change', this.render); // rerender when the view changes
//	    },
//		// Re-render the contents of the todo item.
//	    render: function() {
//	    	$.log("rendering");
//	    	//$(this.el).html(this.template(this.model.toJSON()));
//	    	//$.template( "FeatureSummaryTemplate", window.FeatureSummaryTemplate );
//		    
//	    	$.log(this.model.get("summary"));
//		    $.tmpl( "FeatureSummaryTemplate", this.model.get("summary")).appendTo(this.el);
//	    	
//	    	
//	    	return this;
//	    },
//	    addProduct: function(product_model) {
//	    	var view = new FeatureProductSummaryView({model: product_model});
//	    	this.$("#ProductValue").append(view.render().el);
//	    },
//	    addSeeAlso: function(see_also_model) {
//	    	var view = new FeatureSeeAlsoSummaryView({model: see_also_model});
//	    	this.$("#SeeAlsoValue").append(view.render().el);
//	    }
//	});
//	
//	window.FeatureProductSummaryView = Backbone.View.extend({
//		tagName:  "ul",
//		template: _.template(window.FeatureProductSummaryTemplate),
//	    initialize: function(){
//	        _.bindAll(this, 'render'); // fixes loss of context for 'this' within methods 
//	         this.render(); // not all views are self-rendering. This one is.
//	    },
//		// Re-render the contents of the todo item.
//	    render: function() {
//	    	$(this.el).html(this.template(this.model.toJSON()));
//	    	return this;
//	    }
//	});
//	
//	window.FeatureSeeAlsoSummaryView = Backbone.View.extend({
//		tagName:  "ul",
//		template: _.template(window.FeatureSeeAlsoTemplate),
//	    initialize: function(){
//	        _.bindAll(this, 'render'); // fixes loss of context for 'this' within methods 
//	         this.render(); // not all views are self-rendering. This one is.
//	    },
//	    render: function() {
//	    	$(this.el).html(this.template(this.model.toJSON()));
//	    	return this;
//	    }
//	});
//	
//	window.PropertyView = Backbone.View.extend({
//		tagName:  "ul",
//		template: _.template(window.PropertyTemplate),
//	    initialize: function(){
//	        _.bindAll(this, 'render'); // fixes loss of context for 'this' within methods 
//	         this.render(); // not all views are self-rendering. This one is.
//	    },
//	    render: function() {
//	    	$(this.el).html(this.template(this.model.toJSON()));
//	    	$(this.el).show();
//	    	return this;
//	    }
//	});
//	
//	window.GeneOntologyView = Backbone.View.extend({
//		tagName:  "div",
//		template: _.template(window.GeneOntologyTemplate),
//	    initialize: function(){
//	        _.bindAll(this, 'render'); // fixes loss of context for 'this' within methods 
//	         this.render(); // not all views are self-rendering. This one is.
//	    },
//	    render: function() {
//	    	$(this.el).html(this.template(this.model.toJSON()));
//	    	$(this.el).show();
//	    	$(".hideable", this.el).show();
//	    	$(".evidence").tooltip();
//	    	return this;
//	    }
//	});
//	

	
	
	
});