
// these templates need to know the script directory for the images
var scripts= document.getElementsByTagName('script');
var path= scripts[scripts.length-1].src.split('?')[0];      
var current_directory = path.split('/').slice(0, -1).join('/')+'/';

function mungeKey (key) {
	return key.split(" ").join("");
}



/*
 * Default templates for rendering the views. 
 */

window.FeatureSummaryTemplate = 
	"<% _.each( this.model.attributes, function( obj, key){ %> \
		<tr id='<%= mungeKey(key) %>Row' > \
		    <th><%= key %></th> \
		    <td class='erasable' id='<%= mungeKey(key) %>Value' ><%= obj %></td> \
		</tr> \
	<% }); %> ";


window.FeatureSeeAlsoTemplate = 
	"<% _.each( this.model.attributes, function( dbxref, key){ %> \
			<li> <a href='<%= dbxref.urlprefix + dbxref.accession %>'><%= dbxref.accession %></a> (<%= (dbxref.description) ? dbxref.description : dbxref.database %>) </li> \
		<% }); %> ";

window.FeatureProductSummaryTemplate = 
	"<% _.each( this.model.attributes, function( obj, key){ %> \
		<li><%= obj.name %> \
		<% _.each( obj.props, function( prop, pkey){ %> \
			<% if (prop.type.name == 'qualifier') { %> \
				<%= prop.value %> <% if (pkey >0) { %> | <% } %>  \
			<% } %> \
		<% }); %> \
		<% _.each( obj.props, function( prop, pkey){ %> \
			<% if (prop.type.name == 'evidence') { %> \
				<%= prop.value %>\
			<% } %> \
		<% }); %> \
		<% _.each( obj.pubs, function( pub, pkey){ %> \
			<a href='http://www.ncbi.nlm.nih.gov/entrez/query.fcgi?cmd=Retrieve&db=PubMed&dopt=Abstract&list_uids=<%= pub.uniqueName %>'><%= pub.uniqueName %></a> \
		<% }); %> \
		<% _.each( obj.dbxrefs, function( dbxref, pkey){ %> \
			<%= dbxref.uniqueName %>\
		<% }); %> \
			(<%= obj.count %> other<% if (obj.count >1) { %>s<% } %>) \
		</li> \
	<% }); %> ";


window.PropertyTemplate = 
	"   <div class='full-light-grey-top'></div>\
		<div class='light-grey'> \
			<h2>Comments</h2> \
			<div  > \
				<ul id='NotesValue'> \
					<% _.each( notes, function( obj, key){ %>  <li> <%= obj %> </li>  <% }); %>  \
				</ul> \
			</div> \
			<div >\
				<ul id='CommentsValue'> \
					<% _.each( comments, function( obj, key){ %>  <li> <%= obj %> </li>  <% }); %>  \
				</ul>\
			</div> \
			<div > \
				<ul class='erasable' id='CurationValue'> \
					<% _.each( curations, function( obj, key){ %>  <li> <%= obj %> </li>  <% }); %>  \
			</ul></div> \
			<br /> \
			<div >Key information on this gene is available from\
				<span class='erasable' id='PublicationsValue'>\
					 <% _.each( publications, function( obj, key){ %>   <%= obj %>  <% }); %>  \
				</span>\
			</div> \
		</div> \
		<div class='full-light-grey-bot'></div><br>";


window.GeneOntologyTemplate = 
	'<tr><th>Biological Process</th></tr>\
		<% _.each( biological_process, function( term, key){ %>\
			<tr><td ><a class="evidence" href="<%= go_link %>&term=<%= term.accession %>" ><img height="24" src="<%=current_directory %>/img/<%= term.evidence_category %>.png">  <%= term.name %></a> \
				<div class="tooltip">  <img src="<%=current_directory %><%= term.evidence_category %>.png"> \
						<b>Evidence : <%= term.evidence %> </b> <br>\
						<% _.each( term.dbxrefs, function( dbxref, dkey){ %> to <a href="<%= dbxref.urlprefix %><%= dbxref.accession %>" ><%= dbxref.accession %> (<%= dbxref.database %>)</a>  <% }); %>  \
						<% _.each( term.pubs, function( pub, pkey){ %> based on  <a href="<%= pub_link %><%= pub.accession %>" ><%= pub.uniqueName %></a>  <% }); %>\
				</div>  \
			</tr>   \
		<% }); %> \
	<tr><th>Molecular Function</th></tr>\
		<% _.each( molecular_function, function( term, key){ %>\
			<tr><td ><a class="evidence" href="<%= go_link %>&term=<%= term.accession %>" ><img height="24" src="<%=current_directory %>/img/<%= term.evidence_category %>.png">  <%= term.name %></a> \
				<div class="tooltip">  <img src="<%=current_directory %><%= term.evidence_category %>.png"> \
						<b>Evidence : <%= term.evidence %> </b> <br>\
						<% _.each( term.dbxrefs, function( dbxref, dkey){ %> to <a href="<%= dbxref.urlprefix %><%= dbxref.accession %>" ><%= dbxref.accession %> (<%= dbxref.database %>)</a>  <% }); %>  \
						<% _.each( term.pubs, function( pub, pkey){ %> based on  <a href="<%= pub_link %><%= pub.accession %>" ><%= pub.uniqueName %></a>  <% }); %>\
				</div>  \
			</tr>   \
		<% }); %> \
	<tr><th>Cellular Component</th></tr>\
		<% _.each( cellular_component, function( term, key){ %>\
			<tr><td ><a class="evidence" href="<%= go_link %>&term=<%= term.accession %>" ><img height="24" src="<%=current_directory %>/img/<%= term.evidence_category %>.png">  <%= term.name %></a> \
				<div class="tooltip">  <img src="<%=current_directory %><%= term.evidence_category %>.png"> \
						<b>Evidence : <%= term.evidence %> </b> <br>\
						<% _.each( term.dbxrefs, function( dbxref, dkey){ %> to <a href="<%= dbxref.urlprefix %><%= dbxref.accession %>" ><%= dbxref.accession %> (<%= dbxref.database %>)</a>  <% }); %>  \
						<% _.each( term.pubs, function( pub, pkey){ %> based on  <a href="<%= pub_link %><%= pub.accession %>" ><%= pub.uniqueName %></a>  <% }); %>\
				</div>  \
			</tr>   \
		<% }); %> ';
	

