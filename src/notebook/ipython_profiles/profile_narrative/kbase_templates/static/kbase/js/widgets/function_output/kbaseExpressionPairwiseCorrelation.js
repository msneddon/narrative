/**
 * Pairwise correlation of gene expression profiles.
 *
 * Pavel Novichkov <psnovichkov@lbl.gov>
 * @public
 */

 define([
        'jquery', 
        'kbaseExpressionGenesetBaseWidget',      
        'kbaseHeatmap'
        ], function($) {
    $.KBWidget({
        name: 'kbaseExpressionPairwiseCorrelation',
        parent: 'kbaseExpressionGenesetBaseWidget',
        version: '1.0.0',

        maxRange: null,
        minRange: null,
        heatmap: null,
        $heatmapDiv: null,

        warningLimit: 50,
        trimLimit: 500,
        wasTrimLimitReached: false,
        
        
        // To be overriden to specify additional parameters
        getSubmtrixParams: function(){
            var self = this;

            var features = [];
            if(self.options.geneIds) { features = $.map(self.options.geneIds.split(","), $.trim); }

            if (features.length > self.trimLimit) {
                features = features.slice(0, self.trimLimit);
                self.wasTrimLimitReached = true;
            }

            self.minRange = -1; self.maxRange = 1;
            if(self.options.minRange) {
                self.minRange = self.options.minRange;
            }
            if(self.options.maxRange) {
                self.maxRange = self.options.maxRange;
            }
            if(self.minRange>self.maxRange) {
                self.minRange = self.maxRange;
            }

            return{
                input_data: self.options.workspaceID + "/" + self.options.expressionMatrixID,
                row_ids: features,
                fl_row_pairwise_correlation: 1,
                fl_row_set_stats: 1
            };
        },

        buildWidget : function($containerDiv){
            var self = this;
            var submatrixStat = this.submatrixStat;
            var rowDescriptors = submatrixStat.row_descriptors;
            var values = submatrixStat.row_pairwise_correlation.comparison_values;

            //Build row ids
            var rowIds = [];
            for(var i = 0 ; i < rowDescriptors.length; i++){
                rowIds.push(rowDescriptors[i].id);
            }

            // Build data
            var data = [];
            for(var i = 0 ; i < rowDescriptors.length; i++){
                var row = [];
                for(var j = 0 ; j < rowDescriptors.length; j++){
                    row.push(values[i][j].toFixed(3));
                }                
                data.push(row);
            }            
            self.heatmap =
                {
                    row_ids : rowIds,
                    row_labels : rowIds,
                    column_ids : rowIds,
                    column_labels : rowIds,
                    data : data,
                };

            var size = rowIds.length;
            var rowH = 35;
            var hmH = 80 + 20 + size * rowH;
            if (hmH > 700)
                hmH = 700;
            if (hmH < 210) {
                hmH = 210;
                rowH = Math.round((hmH - 100) / size);
            }
            var colW = rowH;
            var hmW = 150 + 110 + size * colW;
            if (hmW > 700)
                hmW = 700;
            self.$heatmapDiv = $("<div style = 'width : "+hmW+"px; height : "+hmH+"px'></div>");
            if (self.wasTrimLimitReached) {
                var $warningDiv = $("<div>")
                        .addClass("alert alert-danger")
                        .append("<b>Warning:</b>")
                        .append("<br>Correlation matrix was trimmed by "+self.trimLimit+" by "+self.trimLimit+" in order to avoid browser crash.");
                $containerDiv.append($warningDiv);
            }
            $containerDiv.append(self.$heatmapDiv);
            $containerDiv.append("<div style = 'width : 5px; height : 5px'></div>");

            // TODO: heatmap values out of range still scale color instead of just the max/min color
            if (data.length > self.warningLimit) {
                var $warningDiv = $("<div>")
                        .addClass("alert alert-danger")
                        .append("<b>Warning:</b>")
                        .append("<br>Correlation matrix is larger than "+self.warningLimit+" by "+self.warningLimit+" and may freeze your browser. Do you want to continue?");
                self.$heatmapDiv.append($warningDiv);
                var $btn = $('<button>')
                        .attr('type', 'button')
                        .attr('value', 'Next')
                        .addClass('kb-primary-btn')
                        .append('Show heatmap despite warnings');
                self.$heatmapDiv.append($btn);
                $btn.click($.proxy(function(event) {
                    self.showHeatmap();
                }, this));
            } else {
                self.showHeatmap();
            }
        },

        showHeatmap: function() {
            var self = this;
            self.$heatmapDiv.empty();
            self.$heatmapDiv.kbaseHeatmap(
                    {
                        dataset : self.heatmap,
                        // ulIcon : '../img/labs_icon.png',
                        colors : ['#FFA500', '#FFFFFF', '#0066AA'],
                        //ulIcon : '/functional-site/assets/navbar/images/kbase_logo.png',
                        minValue : self.minRange,
                        maxValue : self.maxRange
                    }
            );
        }
        
        // buildWidget: function($containerDiv){
        //     var submatrixStat = this.submatrixStat;
        //     var rowDescriptors = submatrixStat.row_descriptors;
        //     var values = submatrixStat.row_pairwise_correlation.comparison_values;

        //     //Build row ids
        //     var rowIds = [];
        //     for(var i = 0 ; i < rowDescriptors.length; i++){
        //         rowIds.push(rowDescriptors[i].id);
        //     }

        //     // Build data
        //     var data = [];
        //     for(var i = 0 ; i < rowDescriptors.length; i++){
        //         for(var j = 0 ; j < rowDescriptors.length; j++){
        //             data.push([i, j, values[i][j] ]);
        //         }                
        //     }

        //     // Build heatmap
        //     $containerDiv.highcharts({

        //         chart: {
        //             type: 'heatmap',
        //             marginTop: 40,
        //             marginBottom: 80
        //         },
        //         title: {
        //             text: 'Pairwise correlation'
        //         },
        //         xAxis: {
        //             categories: rowIds
        //         },
        //         yAxis: {
        //             categories: rowIds,
        //             title: null
        //         },
        //         colorAxis: {
        //             min: -1,
        //             max: 1,
        //             stops: [
        //                 [0, '#3060cf'],
        //                 // [0.5, '#fffbbc'],
        //                 [0.5, '#ffffff'],
        //                 [1, '#c4463a']
        //             ]
        //         },
        //         legend: {
        //             align: 'right',
        //             layout: 'vertical',
        //             margin: 0,
        //             verticalAlign: 'top',
        //             y: 25,
        //             symbolHeight: 280
        //         },
        //         credits: {
        //             enabled: false
        //         },                
        //         tooltip: {
        //             formatter: function () {
        //                 return 'Pearson correlation: ' + this.point.value.toFixed(2) 
        //                     + '<br><b>' + this.series.xAxis.categories[this.point.x] + '</b>' 
        //                     + '<br><b>' + this.series.yAxis.categories[this.point.y] + '</b>';
        //             }
        //         },

        //         series: [{
        //             name: 'Sales per employee',
        //             borderWidth: 1,
        //             data: data,
        //             dataLabels: {
        //                 enabled: false,
        //                 color: '#000000'
        //             }
        //         }]

        //     });
        // }     

    });
});