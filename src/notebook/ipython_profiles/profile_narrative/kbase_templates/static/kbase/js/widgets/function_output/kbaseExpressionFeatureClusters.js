/**
 * Output widget to vizualize FeatureClusters object.
 * Pavel Novichkov <psnovichkov@lbl.gov>
 * @public
 */

define(['jquery', 
		'kbwidget', 
		'kbaseAuthenticatedWidget', 
		'kbaseTabs',
		'jquery-dataTables',
		'jquery-dataTables-bootstrap',
		'kbaseTreechart',
		'knhx'
//        ,'jquery-dataScroller'
		], function($) {
	$.KBWidget({
		name: 'kbaseExpressionFeatureClusters',
		parent: 'kbaseAuthenticatedWidget',
		version: '1.0.0',
		options: {
			clusterSetID: null,
			workspaceID: null,
			workspaceURL: window.kbconfig.urls.workspace,
			loadingImage: "static/kbase/images/ajax-loader.gif",
		},

		// Extracted data for vizualization
		clusterSet: null,
		expMatrixRef: null,
		expMatrixName: null,
		genomeRef: null,
		featureMapping: null,
		matrixRowIds: null,
		matrixColIds: null,
		genomeID: null,
		genomeName: null,
		features: null,
		globalNodeUniqueId: 0,
		$tabPane: null,
					
		init: function(options) {
			this._super(options);
			// Create a message pane
            this.$messagePane = $("<div/>").addClass("kbwidget-message-pane kbwidget-hide-message");
            this.$elem.append(this.$messagePane);		
			return this;
		},

		loggedInCallback: function(event, auth) {

			
			// error if not properly initialized
			if (this.options.clusterSetID == null) {
				this.showMessage("[Error] Couldn't retrieve clusters");
				return this;
			}

			// Create a new workspace client
			this.ws = new Workspace(this.options.workspaceURL, auth);
		   
			// Let's go...
			this.loadAndRender();           
		   
			return this;
		},

		loggedOutCallback: function(event, auth) {
			this.ws = null;
			this.isLoggedIn = false;
			return this;
		},

		loadAndRender: function(){

			var self = this;

			self.loading(true);

			var kbws = this.ws;
			var clusterSetRef = self.buildObjectIdentity(this.options.workspaceID, this.options.clusterSetID);

			kbws.get_objects([clusterSetRef], 
				function(data) {
					self.clusterSet = data[0].data;
					self.expMatrixRef = self.clusterSet.original_data;

					kbws.get_object_subset([					
							{ 'ref':self.expMatrixRef, 'included':
							    ['/genome_ref', '/feature_mapping', '/data/row_ids', '/data/col_ids'] }
						], 
						function(data) {
							self.expMatrixName = data[0].info[1];
							self.genomeRef = data[0].data.genome_ref;
                            self.featureMapping = data[0].data.feature_mapping;
							self.matrixRowIds = data[0].data.data.row_ids;
							self.matrixColIds = data[0].data.data.col_ids;	

							if (self.genomeRef) {
							    kbws.get_object_subset(
							            [{ 'ref':self.genomeRef, 'included':
							                ['/id', '/scientific_name', '/features/[*]/id', 'features/[*]/type', 
							                 'features/[*]/function', 'features/[*]/aliases'] }								
							            ], 
							            function(data){									
							                self.genomeID = data[0].info[1];
							                self.genomeName = data[0].data.scientific_name;
							                self.features = data[0].data.features;
							                // Now we are ready to visualize it
							                self.render();
							            }, 
							            function(error){
							                console.error(error);
			                                self.render();
							            }
							    );
							} else {
							    self.render();
							}
						}, 
						function(error){
							self.clientError(error);
						}
					);
				}, function(error){
					self.clientError(error);
				}
			);	
		},

		render: function(){
			var self = this;
            var $container = this.$elem;
			var pref = this.uuid();
			self.pref = pref;


			self.loading(false);

			///////////////////////////////////// Instantiating Tabs ////////////////////////////////////////////
			$container.empty();
			var tabPane = $('<div id="'+pref+'tab-content">');
			self.$tabPane = tabPane;
			$container.append(tabPane);

			tabPane.kbaseTabs({canDelete : true, tabs : []});                    
			///////////////////////////////////// Overview table ////////////////////////////////////////////           
			var tabOverview = $("<div/>");
			tabPane.kbaseTabs('addTab', {tab: 'Overview', content: tabOverview, canDelete : false, show: true});
			var tableOver = $('<table class="table table-striped table-bordered" '+
				'style="width: 100%; margin-left: 0px; margin-right: 0px;" id="'+pref+'overview-table"/>');
			tabOverview.append(tableOver);
			tableOver
				.append( self.makeRow( 
					'Feature clusters', 
					self.clusterSet.feature_clusters.length ) ) 
				// .append( self.makeRow( 
				// 	'Condition clusters', 
				// 	self.clusterSet.condition_clusters.length ) )
				.append( self.makeRow( 
					'Genome', 
					$('<span />').append(self.genomeName).css('font-style', 'italic') ) )
				.append( self.makeRow( 
					'Expression matrix', 
					self.expMatrixName ) )
				.append( self.makeRow( 
					'Expression matrix: #conditions', 
					self.matrixColIds.length ) )
				.append( self.makeRow( 
					'Expression matrix: #genes', 
					self.matrixRowIds.length ) )
				;

			///////////////////////////////////// Clusters tab ////////////////////////////////////////////          

			var $tabClusters = $("<div/>");
			tabPane.kbaseTabs('addTab', {tab: 'Clusters', content: $tabClusters, canDelete : false, show: false});

			///////////////////////////////////// Clusters table ////////////////////////////////////////////          

			self.buildActionMenu($container);
			$(document).mousedown( function(e){
				// Hide menu on mousedown only if we are not inside the menu
				if(e.target.getAttribute('methodInput') == null){
					self.$menu.hide();
				}
			});			

			var tableClusters = $('<table id="'+pref+'clusters-table" \
				class="table table-bordered table-striped" style="width: 100%; margin-left: 0px; margin-right: 0px;">\
				</table>')
			.appendTo($tabClusters)
			.dataTable( {
			   "sDom": 'lftip',
				"aaData": self.buildClustersTableData(),
				 "aoColumns": [
				    { sTitle: "Pos.", mData:"pos" },
					{ sTitle: "Cluster", mData:"clusterId" },
					{ sTitle: "Number of genes", mData:"size" },
					{ sTitle: "Mean correlation", mData:"meancor" },
                    { sTitle: "", mData: "rowIndex",
                        mRender: function ( rowIndex ) {
                        	return '<button class="btn btn-default ' + pref + 'action_button" rowIndex="' + rowIndex +'" >Explore Cluster  <span class="caret"></span></button>';
                        }
                    }
				],
				'fnDrawCallback': events
			} );
			
            function events() {
				self.registerActionButtonClick();
				updateClusterLinks("clusters");
            }
            
            function updateClusterLinks(showClass) {
                $('.show-'+showClass+'_'+self.pref).unbind('click');
                $('.show-'+showClass+'_'+self.pref).click(function() {
                    var pos = $(this).data('pos');
                    self.openClusterTab(pos);
                })
            }

            ///////////////////////////////////// Features tab ////////////////////////////////////////////          
            var featureTabDiv = $("<div/>");
            tabPane.kbaseTabs('addTab', {tab: "Features", content: featureTabDiv, canDelete : false, show: false});
            self.buildClusterFeaturesTable(featureTabDiv, null, function() {
                updateClusterLinks("clusters2");
            });

            ///////////////////////////////////// Hierarchical dendrogram tab ////////////////////////////////////////////  
            var numOfSteps = this.clusterSet.feature_clusters.length;
            var newick = self.clusterSet.feature_dendrogram;
            if (newick) {
                var tree = kn_parse(newick);
                var clusterLabels = self.getClusterPosArray();
                var root = self.transformKnhxTree(tree.root, 5, clusterLabels);
                //root = root.children[0].children[0].children[0];
                //console.log(JSON.stringify(root));
                var tabDendro = $("<div style='max-height: 600px;'/>");
                tabPane.kbaseTabs('addTab', {tab: 'Dendrogram', content: tabDendro, canDelete : false, show: false});
                var dendroPanel = $("<div style='width: 800px;'/>");
                tabDendro.append(dendroPanel);
                dendroPanel.kbaseTreechart({ 
                    lineStyle: 'square',
                    dataset: root,
                    displayStyle:'NTnt',
                    layout : 'cluster',
                    circleRadius : 3,
                    nodeDblClick : function(d) {
                        self.openClusterTab(d.clusterPos);
                    }
                });
            }
		},
		
		openClusterTab: function(pos) {
		    var self = this;
            var tabName = "Cluster " + pos;
            if (self.$tabPane.kbaseTabs('hasTab', tabName)) {
                self.$tabPane.kbaseTabs('showTab', tabName);
                return;
            }
            var tabDiv = $("<div/>");
            self.$tabPane.kbaseTabs('addTab', {tab: tabName, content: tabDiv, canDelete : true, show: true, deleteCallback: function(name) {
                self.$tabPane.kbaseTabs('removeTab', name);
            }});
            self.buildClusterFeaturesTable(tabDiv, pos);
            self.$tabPane.kbaseTabs('showTab', tabName);
		},
		
		getClusterPosArray: function() {
		    var ret = [];
		    for (var i = 0; i < this.matrixRowIds.length; i++)
		        ret.push(0);
		    for (var clusterPos = 0; clusterPos < this.clusterSet.feature_clusters.length; clusterPos++) {
		        var cluster = this.clusterSet.feature_clusters[clusterPos].id_to_pos;
		        for (var rowId in cluster) {
		            var rowPos = cluster[rowId];
		            ret[rowPos] = clusterPos;
		        }
		    }
		    return ret;
		},
		
		transformKnhxTree: function(node, scale, clusterLabels) {
		    var ret = {};
		    if (node.d > 0) {
		        ret.distance = node.d * scale;
		    } else {
		        ret.distance = 0;
		    }
            this.globalNodeUniqueId++;
            ret.id = "node_" + this.globalNodeUniqueId;
		    if (node.child && node.child.length > 0) {
		        var children = [];
		        ret.children = children;
		        var differentClusterPosNumber = 0;
		        var clusterPosToTrueMap = {};
		        for (var i = 0; i < node.child.length; i++) {
		            var subnode = this.transformKnhxTree(node.child[i], scale, clusterLabels);
		            children.push(subnode);
		            var clusterPos = subnode.clusterPos;
		            if (clusterPos == null) {
		                differentClusterPosNumber += 2;
		            } else if (!clusterPosToTrueMap[clusterPos]) {
		                clusterPosToTrueMap[clusterPos] = true;
		                differentClusterPosNumber++;
		            }
		        }
		        ret.clusterPos = null;
                if (differentClusterPosNumber == 1)
                    for (var clusterPos in clusterPosToTrueMap)
                        if (clusterPosToTrueMap.hasOwnProperty(clusterPos))
                            ret.clusterPos = clusterPos;
		        for (var i = 0; i < children.length; i++) {
		            var subnode = children[i];
		            if (subnode.clusterPos != null) {
		                if (differentClusterPosNumber == 1) {
                            subnode.weight = 3;
                            subnode.lineStroke = this.generateColor(subnode.clusterPos);
		                } else if (subnode.name === "") {
                            subnode.name = "cluster_" + subnode.clusterPos;
                            subnode.tooltip = "Click to expand/collapse<br>Double click to open in new tab";
                            subnode.open = false;
		                }
		            }
		        }
		        ret.name = "";
                ret.tooltip = "Click to expand/collapse";
                ret.open = true;
		    } else {
		        var pos = parseInt(node.name);
		        ret.rowPos = pos;
		        var rowId = this.matrixRowIds[pos];
                ret.name = rowId;
		        ret.rowId = rowId;
		        if (this.featureMapping && this.featureMapping[rowId] && 
		                rowId !== this.featureMapping[rowId]) {
		            var featureId = this.featureMapping[rowId];
		            ret.featureId = featureId;
		            ret.name += " (" + featureId + ")";
		        }
                var clusterPos = clusterLabels[pos];
                ret.clusterPos = clusterPos;
		    }
		    return ret;
		},

		generateColor: function(clusterPos) {
		    var numOfSteps = this.clusterSet.feature_clusters.length;
		    var step = (1114111 * clusterPos) % numOfSteps;
            // This function generates vibrant, "evenly spaced" colours (i.e. no clustering). This is ideal 
            // for creating easily distinguishable vibrant markers in Google Maps and other apps.
            // Adam Cole, 2011-Sept-14
            // HSV to RBG adapted from: 
            // http://mjijackson.com/2008/02/rgb-to-hsl-and-rgb-to-hsv-color-model-conversion-algorithms-in-javascript
            var r, g, b;
            var h = (step + 0.0) / numOfSteps;
            var i = Math.floor(h * 6);
            var f = h * 6 - i;
            var q = 1 - f;
            switch(i % 6){
                case 0: r = 1, g = f, b = 0; break;
                case 1: r = q, g = 1, b = 0; break;
                case 2: r = 0, g = 1, b = f; break;
                case 3: r = 0, g = q, b = 1; break;
                case 4: r = f, g = 0, b = 1; break;
                case 5: r = 1, g = 0, b = q; break;
            }
            return "#" + ("00" + (~ ~(r * 255)).toString(16)).slice(-2) + 
                ("00" + (~ ~(g * 255)).toString(16)).slice(-2) + ("00" + (~ ~(b * 255)).toString(16)).slice(-2);
		},
		
		registerActionButtonClick : function(){
			var self = this;
			var pref = self.pref;
			$('.' + pref + 'action_button').on('click', function(e){
				var $actionButton = $(e.target);
				var x = $actionButton.offset().left - $('#notebook-container').offset().left + e.target.offsetLeft;
				var y = $actionButton.offset().top - $('#notebook-container').offset().top + e.target.offsetHeight + e.target.offsetTop;
				self.$menu
                    .data("invokedOn", $(e.target))
                    .css({
                        position: "absolute",                        
                        left: x,
                        top: y
                    })
                    .show()
                    .off('click')
                    .on('click', 'a', function (e) {
                        self.$menu.hide();
                
                        var $invokedOn = self.$menu.data("invokedOn");
                        var $selectedMenu = $(e.target);
                        var rowIndex = $invokedOn[0].getAttribute('rowIndex');
                        var methodInput = $selectedMenu[0].getAttribute('methodInput');

                        var geneIds = self.getClusterGeneIds(rowIndex);

                        if(methodInput==='build_feature_set') {
                            var featureIds = [];
                            for (var i in geneIds) {
                                var rowId = geneIds[i];
                                var fId = self.featureMapping ? self.featureMapping[rowId] : null;
                                featureIds.push(fId ? fId : rowId);
                            }
							IPython.narrative.createAndRunMethod(methodInput, 
								{
									'input_genome':self.genomeID, 
									'input_feature_ids': featureIds.join(","),
									'output_feature_set': self.options.clusterSetID + "_Cluster"+rowIndex+"_Features",
									'description': 'Features were selected from Cluster ' + rowIndex + ' of a FeatureClusters data object '+
													'named ' + self.options.clusterSetID + '.'
								}
							);
						} else {
							IPython.narrative.createAndRunMethod(methodInput, 
								{
									'input_expression_matrix':self.expMatrixName, 
									'input_gene_ids': geneIds.join(",")
								}
							);
						}
                    });                
			});
		},

		getClusterGeneIds: function(rowIndex){
			var geneIds = [];
			for(var geneId in this.clusterSet.feature_clusters[rowIndex].id_to_pos){
				geneIds.push(geneId);
			}
			return geneIds;
		},


		buildClustersTableData: function(){
			var self = this;
			// var row_ids = self.expressionMatrix.data.row_ids;
			// var col_ids = self.expressionMatrix.data.col_ids;
			var feature_clusters  = self.clusterSet.feature_clusters;

			var tableData = [];

			for(var i = 0; i < feature_clusters.length; i++){
				cluster = feature_clusters[i];
				tableData.push({
					pos: i,
					clusterId: "<a class='show-clusters_" + self.pref + "' data-pos='"+i+"'>cluster_" + i + "</a>",
					size: Object.keys(cluster.id_to_pos).length,
					meancor : cluster.meancor != null? cluster.meancor.toFixed(3) : 'N/A',
					rowIndex : i
				})
			}

			return tableData;
		},

		buildActionMenu: function($container){
			var $menu = $(' \
				<ul id="contextMenu" class="dropdown-menu" role="menu" style="display:none" > \
				    <li><a tabindex="-1" href="#" methodInput="view_expression_profile">View expression profile</a></li> \
				    <li><a tabindex="-1" href="#" methodInput="view_expression_pairwise_correlation">View pairwise correlation</a></li> \
				    <li><a tabindex="-1" href="#" methodInput="view_expression_heatmap">View in sortable condition heatmap</a></li> \
				    <li class="divider"></li> \
				    <li><a tabindex="-1" href="#" methodInput="build_feature_set">Save as a FeatureSet</a></li> \
				</ul> \
			');

				    // <li class="divider"></li> \
				    // <li><a tabindex="-1" href="#" methodInput="build_feature_set">Create a FeatureSet</a></li> \

			$container.append($menu);	
			this.$menu = $menu;
		},

		buildClusterFeaturesTable: function(tabDiv, pos, events) {
            var self = this;
		    var tableData = [];
		    var table = $('<table class="table table-bordered table-striped" '+
		            'style="width: 100%; margin-left: 0px; margin-right: 0px;"></table>');
		    tabDiv.append(table);

		    var id2features = self.buildFeatureId2FeatureHash();
		    var min_cluster_pos = 0;
		    var max_cluster_pos = self.clusterSet.feature_clusters.length - 1;
		    if (pos != null) {
		        min_cluster_pos = pos;
		        max_cluster_pos = pos;
		    }
		    for (var cluster_pos = min_cluster_pos; cluster_pos <= max_cluster_pos; cluster_pos++)
		    for (var rowId in self.clusterSet.feature_clusters[cluster_pos].id_to_pos) {
		        var fid = rowId;
		        if (self.featureMapping) {
		            fid = self.featureMapping[rowId];
		            if (!fid)
		                fid = rowId;
		        }
		        var gid = "-";
		        var genomeRef = null;
		        if (self.genomeRef) {
		            genomeRef = self.genomeRef.split('/')[0] + "/" + self.genomeID;
		            gid = '<a href="/functional-site/#/dataview/'+genomeRef+'" target="_blank">'+
		            self.genomeName+"</a>";
		        }
                var aliases = "-";
                var type = "-";
                var func = "-";
		        var feature = id2features[fid];
		        if (feature) {
		            if(feature.aliases && feature.aliases.length > 0)
		                aliases= feature.aliases.join(', '); 
		            type = feature.type;
                    func = feature['function'];
		        }
                if (genomeRef) {
                    fid = '<a href="/functional-site/#/dataview/'+genomeRef+'?sub=Feature&subid='+fid + 
                    '" target="_blank">'+fid+'</a>';
                }
		        tableData.push(
		                {
		                    fid: fid,
		                    cid: "<a class='show-clusters2_" + self.pref + "' data-pos='"+cluster_pos+"'>cluster_" + cluster_pos + "</a>",
		                    gid: gid,
		                    ali: aliases,
		                    type: type,
		                    func: func
		                }
		        );
            }
		    var columns = [];
		    columns.push({sTitle: "Feature ID", mData: "fid"});
		    if (pos == null)
		        columns.push({ sTitle: "Cluster", mData:"cid" });
            columns.push({sTitle: "Aliases", mData: "ali"});
            columns.push({sTitle: "Genome", mData: "gid"});
            columns.push({sTitle: "Type", mData: "type"});
            columns.push({sTitle: "Function", mData: "func"});
		    table.dataTable( {
		        "sDom": 'lftip',
		        "aaData": tableData,
		        "aoColumns": columns,
                "fnDrawCallback": events
		    });

		    return tabDiv;
		},
	
		buildFeatureId2FeatureHash: function(){
			var self = this;
			var features = self.features;
			var id2features = {};
			if (features)
			    for(var i in features)
			        id2features[features[i].id] = features[i];
			return id2features;
		},

		makeRow: function(name, value) {
			var $row = $("<tr/>")
					   .append($("<th />").css('width','20%').append(name))
					   .append($("<td />").append(value));
			return $row;
		},

		getData: function() {
			return {
				type: 'ExpressionMatrix',
				id: this.options.expressionMatrixID,
				workspace: this.options.workspaceID,
				title: 'Expression Matrix'
			};
		},

		loading: function(isLoading) {
			if (isLoading)
				this.showMessage("<img src='" + this.options.loadingImage + "'/>");
			else
				this.hideMessage();                
		},

		showMessage: function(message) {
			var span = $("<span/>").append(message);

			this.$messagePane.append(span);
			this.$messagePane.show();
		},

		hideMessage: function() {
			this.$messagePane.hide();
			this.$messagePane.empty();
		},

		uuid: function() {
			return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, 
				function(c) {
					var r = Math.random()*16|0, v = c == 'x' ? r : (r&0x3|0x8);
					return v.toString(16);
				});
		},

		buildObjectIdentity: function(workspaceID, objectID, objectVer, wsRef) {
			var obj = {};
			if (wsRef) {
				obj['ref'] = wsRef;
			} else {
				if (/^\d+$/.exec(workspaceID))
					obj['wsid'] = workspaceID;
				else
					obj['workspace'] = workspaceID;

				// same for the id
				if (/^\d+$/.exec(objectID))
					obj['objid'] = objectID;
				else
					obj['name'] = objectID;
				
				if (objectVer)
					obj['ver'] = objectVer;
			}
			return obj;
		},        

		clientError: function(error){
			this.loading(false);
			this.showMessage(error.error.error);
		}        

	});
});
