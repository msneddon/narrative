/*global define*/
/*jslint white:true,browser:true*/
define([
    'jquery',
    'kb_common/html',
    'kb_common/domEvent',
    'base/js/namespace',
    'common/utils'
], function ($, html, DomEvent, Jupyter, utils) {
    'use strict';

    var t = html.tag,
        div = t('div'), a = t('a'),
        button = t('button'), ul = t('ul'), li = t('li'),
        span = t('span');

    function getMeta(cell, group, name) {
        if (!cell.metadata.kbase) {
            return;
        }
        if (name === undefined) {
            return cell.metadata.kbase[group];
        }
        if (!cell.metadata.kbase[group]) {
            return;
        }
        return cell.metadata.kbase[group][name];
    }
    function factory(config) {
        var container,
            cell;

        function attachEvent(event, fun) {
            var id = html.genId(),
                selector = '#' + id + ', ' + '#' + id + ' *';
            container.addEventListener(event, function (e) {
                if (e.target.matches(selector)) {
                    fun(e);
                }
            }, true);
            return id;
        }

        function doViewJobSubmission(e) {
            var metadata = this.options.cell.metadata,
                stackTrace = [],
                newCell = Jupyter.narrative.insertAndSelectCell('code', 'below', Jupyter.notebook.find_cell_index(this.options.cell));
            if (metadata['kb-cell'] && metadata['kb-cell'].stackTrace) {
                stackTrace = metadata['kb-cell'].stackTrace;
            }
            console.log(stackTrace);
            if (stackTrace instanceof Array) {
                newCell.set_text('job_info=' + stackTrace[stackTrace.length - 1] + '\njob_info');
                newCell.execute();
            } else {
                newCell.set_text('job_info=' + stackTrace);
            }
        }

        function doMoveCellUp(e) {
            Jupyter.notebook.move_cell_up();
        }
        function doMoveCellDown(e) {
            Jupyter.notebook.move_cell_down();
        }
        function doInsertCellAbove(e) {
            Jupyter.narrative.insertAndSelectCellAbove('markdown');
        }
        function doInsertCellBelow(e) {
            Jupyter.narrative.insertAndSelectCellBelow('markdown');
        }
        function doToggleCellType(e) {
            if (this.options.cell.cell_type === "markdown") {
                Jupyter.notebook.to_code();
            } else {
                Jupyter.notebook.to_markdown();
            }
        }
        function doToggleCell(e) {
            // Tell the associated cell to toggle.
            // the toolbar should be re-rendered when the cell metadata changes,
            // so it will naturally pick up the toggle state...
            $(e.target).trigger('toggle.cell');
        }

        function renderToggleState() {
            var toggleState = utils.getMeta(cell, 'cellState', 'toggleState'),
                toggleIcon = container.querySelector('[data-button="toggle"] > span'),
                openIcon = 'fa-chevron-down',
                closedIcon = 'fa-chevron-right';
            
            switch (toggleState) {
                case 'open':
                    toggleIcon.classList.remove(closedIcon);
                    toggleIcon.classList.add(openIcon);
                    break;
                case 'closed':
                    toggleIcon.classList.remove(openIcon);
                    toggleIcon.classList.add(closedIcon);
                    break;
                default:
                    toggleIcon.classList.remove(closedIcon);
                    toggleIcon.classList.add(openIcon);
                    console.warn('INVALID TOGGLE STATE, ASSUMING OPEN', toggleState);
            }
        }

        function doDeleteCell(e) {
            var i = Jupyter.notebook.find_cell_index(cell);
            $(cell.element).trigger('deleteCell.Narrative', Jupyter.notebook.find_cell_index(cell));
        }
        
        function getCellTitle(cell) {
            var attributeTitle = getMeta(cell, 'attributes', 'title'),
                cellStateTitle = getMeta(cell, 'cellState', 'title');
            
            return cellStateTitle || attributeTitle;
        }
        
        function getIconClass(cell) {
            var iconClass = getMeta(cell, 'cellState', 'icon') || getMeta(cell, 'attributes', 'icon') || 'file';
            return iconClass
        }

        function render() {
            var events = DomEvent.make(),
                content = div({class: 'kb-cell-toolbar container-fluid'}, [
                    div({class: 'row'}, [
                        div({class: 'col-sm-8'}, [
                            div({
                                class: 'buttons pull-left',
                                id: attachEvent('click', doToggleCell)
                            }, [
                                span({
                                    style: {padding: '4px'}
                                }, [
                                    span({
                                        class: ['fa', 'fa-' + getIconClass(cell), 'fa-2x'].join(' ')
                                    })
                                ]),
                                button({
                                    type: 'button',
                                    class: 'btn btn-default btn-xs',
                                    role: 'button',
                                    dataButton: 'toggle',
                                    style: {width: '20%'}
                                }, [
                                    span({class: 'fa fa-chevron-down', style: {width: '25px'}})
                                ])
                            ]),
                            div({class: 'title', style: {display: 'inline-block'}}, [
                                div({dataElement: 'title', class: 'title'}, [getCellTitle(cell)]),
                                div({dataElement: 'subtitle', class: 'subtitle', style: {display: 'none'}})
                            ])
                        ]),
                        div({class: 'col-sm-4'}, [
                            div({class: 'buttons pull-right'}, [
                                span({class: 'kb-func-timestamp'}),
                                span({class: 'fa fa-circle-o-notch fa-spin', style: {color: 'rgb(42, 121, 191)', display: 'none'}}),
                                span({class: 'fa fa-exclamation-triangle', style: {color: 'rgb(255, 0, 0)', display: 'none'}}),
                                button({
                                    type: 'button',
                                    class: 'btn btn-default btn-xs',
                                    dataToggle: 'tooltip',
                                    dataPlacement: 'left',
                                    title: true,
                                    dataOriginalTitle: 'Delete Cell',
                                    id: attachEvent('click', doDeleteCell)
                                }, [
                                    span({class: 'fa fa-trash-o', style: 'font-size: 14pt'})
                                ]),
                                span({class: 'btn-group'}, [
                                    button({type: 'button', class: 'btn btn-default btn-xs', dataToggle: 'dropdown', ariaHaspopup: 'true'}, [
                                        span({class: 'fa fa-cog', style: {fontSize: '14pt'}})
                                    ]),
                                    // TODO: spacing on menu items is .. funky .. need a gap between the icon and the text. Rather the
                                    // icon should take up a fixed width so that the menu item text aligns left.
                                    ul({class: 'dropdown-menu dropdown-menu-right'}, [
                                        li(a({id: attachEvent('click', doViewJobSubmission)}, [span({class: 'fa fa-code'}), ' View Job Submission'])),
                                        li(a({id: attachEvent('click', doMoveCellUp)}, [span({class: 'fa fa-arrow-up'}), ' Move Cell Up'])),
                                        li(a({id: attachEvent('click', doMoveCellDown)}, [span({class: 'fa fa-arrow-down'}), ' Move Cell Down'])),
                                        li(a({id: attachEvent('click', doInsertCellAbove)}, [span({class: 'fa fa-caret-square-o-up'}), ' Insert Cell Above'])),
                                        li(a({id: attachEvent('click', doInsertCellBelow)}, [span({class: 'fa fa-caret-square-o-down'}), ' Insert Cell Below']))
                                            // li(a({id: attachEvent('click', doToggleCellType)}, [span({class: 'fa fa-terminal'}), ' Toggle Cell Type']))
                                    ])
                                ])
                            ])
                        ])
                    ])
                ]);
            return {
                events: events,
                content: content
            };
        }

        function callback(toolbarDiv, parentCell) {
            try {
                container = toolbarDiv[0];
                cell = parentCell;
                var rendered = render();
                container.innerHTML = rendered.content;
                rendered.events.attachEvents(container);
                renderToggleState();
            } catch (ex) {
                console.error('ERROR in cell toolbar callback', ex);
            }
        }

        //function info(toolbarDiv, cell) {
        //    var id = cell.cell_id,
        //        content = span({style: {fontStyle: 'italic'}}, id);
        //    $(toolbarDiv).append(span({style: {padding: '4px'}}, content));
        // }

        return {
            register_callback: callback
        };
    }


    return {
        make: function (config) {
            return factory(config);
        }
    };
});