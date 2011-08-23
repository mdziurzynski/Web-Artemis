
$(function(){
	
	/*
	 * Declare views and models. This must be done once Backbone is loaded, best to do it when the document is ready. 
	 */
	
	window.FeatureModel = Backbone.Model.extend({});	
	window.FeatureProductModel = Backbone.Model.extend({});
	window.FeatureSeeAlsoModel = Backbone.Model.extend({});
	window.PropertyModel = Backbone.Model.extend({});
	window.TermModel = Backbone.Model.extend({});
	
	window.FeatureSummaryView = Backbone.View.extend({
		tagName:  "ul",
		template: _.template(window.FeatureSummaryTemplate),
	    initialize: function(){
	        _.bindAll(this, 'render'); // fixes loss of context for 'this' within methods 
	         this.render(); // not all views are self-rendering. This one is.
	         this.model.bind('change', this.render); // rerender when the view changes
	    },
		// Re-render the contents of the todo item.
	    render: function() {
	    	$.log("rendering");
	    	$(this.el).html(this.template(this.model.toJSON()));
	    	return this;
	    },
	    addProduct: function(product_model) {
	    	var view = new FeatureProductSummaryView({model: product_model});
	    	this.$("#ProductValue").append(view.render().el);
	    },
	    addSeeAlso: function(see_also_model) {
	    	var view = new FeatureSeeAlsoSummaryView({model: see_also_model});
	    	this.$("#SeeAlsoValue").append(view.render().el);
	    }
	});
	
	window.FeatureProductSummaryView = Backbone.View.extend({
		tagName:  "ul",
		template: _.template(window.FeatureProductSummaryTemplate),
	    initialize: function(){
	        _.bindAll(this, 'render'); // fixes loss of context for 'this' within methods 
	         this.render(); // not all views are self-rendering. This one is.
	    },
		// Re-render the contents of the todo item.
	    render: function() {
	    	$(this.el).html(this.template(this.model.toJSON()));
	    	return this;
	    }
	});
	
	window.FeatureSeeAlsoSummaryView = Backbone.View.extend({
		tagName:  "ul",
		template: _.template(window.FeatureSeeAlsoTemplate),
	    initialize: function(){
	        _.bindAll(this, 'render'); // fixes loss of context for 'this' within methods 
	         this.render(); // not all views are self-rendering. This one is.
	    },
	    render: function() {
	    	$(this.el).html(this.template(this.model.toJSON()));
	    	return this;
	    }
	});
	
	window.PropertyView = Backbone.View.extend({
		tagName:  "ul",
		template: _.template(window.PropertyTemplate),
	    initialize: function(){
	        _.bindAll(this, 'render'); // fixes loss of context for 'this' within methods 
	         this.render(); // not all views are self-rendering. This one is.
	    },
	    render: function() {
	    	$(this.el).html(this.template(this.model.toJSON()));
	    	$(this.el).show();
	    	return this;
	    }
	});
	
	window.GeneOntologyView = Backbone.View.extend({
		tagName:  "div",
		template: _.template(window.GeneOntologyTemplate),
	    initialize: function(){
	        _.bindAll(this, 'render'); // fixes loss of context for 'this' within methods 
	         this.render(); // not all views are self-rendering. This one is.
	    },
	    render: function() {
	    	$(this.el).html(this.template(this.model.toJSON()));
	    	$(this.el).show();
	    	$(".hideable", this.el).show();
	    	$(".evidence").tooltip();
	    	return this;
	    }
	});
	

	
	
	
});