/*global define*/
/*jslint white:true,browser:true*/

define([
    'bluebird',
    // CDN
    'kb_common/html',
    // LOCAL
    'common/ui',
    'common/events',
    'common/props',
    // Wrapper for inputs
    './inputWrapperWidget',
    'widgets/appWidgets2/fieldWidgetCompact',
    'widgets/appWidgets2/inputParamResolver',

    'common/runtime'
        // All the input widgets

], function (
    Promise,
    html,
    UI,
    Events,
    Props,
    //Wrappers
    RowWidget,
    FieldWidget,
    ParamResolver,
    Runtime

    // Input widgets
    ) {
    'use strict';

    var t = html.tag,
        form = t('form'), span = t('span'), div = t('div');

    function factory(config) {
        var runtime = Runtime.make(),
            parentBus = config.bus,
            workspaceInfo = config.workspaceInfo,
            container,
            ui,
            bus,
            places,
            model = Props.make(),
            inputBusses = [],
            paramResolver = ParamResolver.make(),
            settings = {
                showAdvanced: null
            },
            widgets = [];


        // DATA
        /*
         *
         * Evaluates the parameter spec to determine which input widget needs to be
         * invoked, but doesn't know what the widget does.
         * Provides the communication bus for each input to route info to the widget
         * and out of it.
         *
         *  In terms of widgets it looks like this:
         *
         *  InputCellWidget
         *    inputWidgets
         *      FieldWidget
         *        textInputWidget
         *      FieldWidget
         *        objectInputWidget
         *      FieldWidget
         *        newObjectInputWidget
         *      FieldWidget
         *        integerInputWidget
         *      FieldWidget
         *        floatInputWidget
         */

        /*
         * The input control widget is selected based on these parameters:
         * - data type - (text, int, float, workspaceObject (ref, name)
         * - input app - input, select
         */


        // RENDERING
        function makeFieldWidget(appSpec, parameterSpec, value) {
            console.log('make field widget', appSpec, parameterSpec, value);
            return paramResolver.getInputWidgetFactory(parameterSpec)
                .then(function (inputWidget) {

                    var fieldBus = runtime.bus().makeChannelBus(null, 'A field widget');

                    inputBusses.push(fieldBus);

                    // Forward all changed parameters to the controller. That is our main job!
                    fieldBus.on('changed', function (message) {
                        parentBus.emit('parameter-changed', {
                            parameter: parameterSpec.id,
                            newValue: message.newValue
                        });
                    });

                    fieldBus.on('touched', function () {
                        parentBus.emit('parameter-touched', {
                            parameter: parameterSpec.id
                        });
                    });


                    // An input widget may ask for the current model value at any time.
                    fieldBus.on('sync', function () {
                        parentBus.emit('parameter-sync', {
                            parameter: parameterSpec.id
                        });
                    });

                    fieldBus.on('sync-params', function (message) {
                        console.log('request sync params', message);
                        parentBus.emit('sync-params', {
                            parameters: message.parameters,
                            replyToChannel: fieldBus.channelName
                        });
                    });


                    /*
                     * Or in fact any parameter value at any time...
                     */
                    fieldBus.on('get-parameter-value', function (message) {
                        parentBus.request({
                            parameter: message.parameter
                        }, {
                            key: 'get-parameter-value'
                        })
                            .then(function (message) {
                                bus.emit('parameter-value', {
                                    parameter: message.parameter
                                });
                            });
                    });

                    //bus.on('parameter-value', function (message) {
                    //    bus.emit('parameter-value', message);
                    //});

                    fieldBus.respond({
                        key: {
                            type: 'get-parameter'
                        },
                        handle: function (message) {
                            if (message.parameterName) {
                                return parentBus.request(message, {
                                    key: {
                                        type: 'get-parameter'
                                    }
                                });
                            } else {
                                return null;
                            }
                        }
                    });

                    // Just pass the update along to the input widget.
                    parentBus.listen({
                        key: {
                            type: 'update',
                            parameter: parameterSpec.id
                        },
                        handle: function (message) {
                            fieldBus.emit('update', {
                                value: message.value
                            });
                        }
                    });


                    // just forward...
                    //bus.on('newstate', function (message) {
                    //    inputWidgetBus.send(message);
                    //});
                    return {
                        bus: bus,
                        widget: FieldWidget.make({
                            inputControlFactory: inputWidget,
                            showHint: true,
                            useRowHighight: true,
                            initialValue: value,
                            appSpec: appSpec,
                            parameterSpec: parameterSpec,
                            bus: fieldBus,
                            workspaceId: workspaceInfo.id,
                            referenceType: 'ref'
                        })
                    };
                });
        }
        function makeFieldWidgetx(appSpec, parameterSpec, value) {
            console.log('MAKE FIELD WIDGET')
            var fieldBus = runtime.bus().makeChannelBus(null, 'A field widget'),
                inputWidget = paramResolver.getInputWidgetFactory(parameterSpec);

            inputBusses.push(fieldBus);

            // Forward all changed parameters to the controller. That is our main job!
            fieldBus.on('changed', function (message) {
                parentBus.emit('parameter-changed', {
                    parameter: parameterSpec.id,
                    newValue: message.newValue
                });
            });


            // An input widget may ask for the current model value at any time.
            fieldBus.on('sync', function () {
                parentBus.emit('parameter-sync', {
                    parameter: parameterSpec.id
                });
            });

            fieldBus.on('sync-params', function (message) {
                console.log('request sync params', message);
                parentBus.emit('sync-params', {
                    parameters: message.parameters
                });
            });

            /*
             * Or in fact any parameter value at any time...
             */
            fieldBus.on('get-parameter-value', function (message) {
                parentBus.request({
                    parameter: message.parameter
                }, {
                    key: 'get-parameter-value'
                })
                    .then(function (message) {
                        bus.emit('parameter-value', {
                            parameter: message.parameter
                        });
                    });
            });

            //bus.on('parameter-value', function (message) {
            //    bus.emit('parameter-value', message);
            //});

            fieldBus.respond({
                key: {
                    type: 'get-parameter'
                },
                handle: function (message) {
                    console.log('GOT?', message);
                    if (message.parameterName) {
                        return parentBus.request(message, {
                            key: {
                                type: 'get-parameter'
                            }
                        });
                    } else {
                        return null;
                    }
                }
            });

            // Just pass the update along to the input widget.
            parentBus.listen({
                key: {
                    type: 'update',
                    parameter: parameterSpec.id
                },
                handle: function (message) {
                    fieldBus.emit('update', {
                        value: message.value
                    });
                }
            });


            // just forward...
            //bus.on('newstate', function (message) {
            //    inputWidgetBus.send(message);
            //});
            return {
                bus: bus,
                widget: FieldWidget.make({
                    inputControlFactory: inputWidget,
                    showHint: true,
                    useRowHighight: true,
                    initialValue: value,
                    appSpec: appSpec,
                    parameterSpec: parameterSpec,
                    bus: fieldBus,
                    workspaceId: workspaceInfo.id
                })
            };
        }

        function renderAdvanced(area) {

            // area is either "input" or "parameter"

            var areaElement = area + '-area',
                areaSelector = '[data-element="' + areaElement + '"]',
                advancedInputs = container.querySelectorAll(areaSelector + ' [data-advanced-parameter]');
            if (advancedInputs.length === 0) {
                ui.setContent([areaElement, 'advanced-hidden-message'], '');
                // ui.disableButton('toggle-advanced');
                return;
            }

//            ui.enableButton('toggle-advanced');

            var removeClass = (settings.showAdvanced ? 'advanced-parameter-hidden' : 'advanced-parameter-showing'),
                addClass = (settings.showAdvanced ? 'advanced-parameter-showing' : 'advanced-parameter-hidden');
            for (var i = 0; i < advancedInputs.length; i += 1) {
                var input = advancedInputs[i];
                input.classList.remove(removeClass);
                input.classList.add(addClass);
            }
//
//            // How many advanaced?
//
//            // Also update the button
//            var button = container.querySelector('[data-button="toggle-advanced"]');
//            button.innerHTML = (settings.showAdvanced ? 'Hide Advanced' : 'Show Advanced (' + advancedInputs.length + ' hidden)');

            // Also update the count in the paramters.
            var events = Events.make({node: container});

            var message;
            if (settings.showAdvanced) {
                if (advancedInputs.length > 1) {
                    message = String(advancedInputs.length) + ' advanced parameters showing';
                } else {
                    message = String(advancedInputs.length) + ' advanced parameter showing';
                }
                var showAdvancedButton = ui.buildButton({
                    label: 'hide advanced',
                    type: 'link',
                    name: 'advanced-parameters-toggler',
                    event: {
                        type: 'toggle-advanced'
                    },
                    events: events
                });

                ui.setContent([areaElement, 'advanced-hidden-message'], '(' + message + ') ' + showAdvancedButton);
            } else {
                if (advancedInputs.length > 1) {
                    message = String(advancedInputs.length) + ' advanced parameters hidden';
                } else {
                    message = String(advancedInputs.length) + ' advanced parameter hidden';
                }
                var showAdvancedButton = ui.buildButton({
                    label: 'show advanced',
                    type: 'link',
                    name: 'advanced-parameters-toggler',
                    event: {
                        type: 'toggle-advanced'
                    },
                    events: events
                });

                ui.setContent([areaElement, 'advanced-hidden-message'], '(' + message + ') ' + showAdvancedButton);
            }

            events.attachEvents();
        }

        function renderLayout() {
            var events = Events.make(),
                content = form({dataElement: 'input-widget-form'}, [
                    ui.buildPanel({
                        type: 'default',
                        body: [
                            // ui.makeButton('Show Advanced', 'toggle-advanced', {events: events}),
                            div({
                                class: 'btn-toolbar pull-right'
                            }, [
                                ui.buildButton({
                                    events: events,
                                    name: 'reset-to-defaults',
                                    icon: {
                                        name: 'recycle'
                                    },
                                    label: 'Reset'
                                })
                                    // ui.makeButton('Reset to Defaults', 'reset-to-defaults', {events: events})
                            ])
                        ],
                        classes: ['kb-panel-light']
                    }),
                    ui.buildPanel({
                        title: span(['Input Objects', span({dataElement: 'advanced-hidden-message', style: {marginLeft: '6px', fontStyle: 'italic'}})]),
                        name: 'input-objects-area',
                        body: div({dataElement: 'input-fields'}),
                        classes: ['kb-panel-light']
                    }),
                    // ui.makePanel('Input Objects', 'input-fields'),
                    ui.buildPanel({
                        title: span(['Parameters', span({dataElement: 'advanced-hidden-message', style: {marginLeft: '6px', fontStyle: 'italic'}})]),
                        name: 'parameters-area',
                        body: div({dataElement: 'parameter-fields'}),
                        classes: ['kb-panel-light']
                    }),
                    ui.buildPanel({
                        title: 'Output Objects',
                        name: 'output-objects-area',
                        body: div({dataElement: 'output-fields'}),
                        classes: ['kb-panel-light']
                    })
                        // ui.makePanel('Output Report', 'output-report')
                ]);

            return {
                content: content,
                events: events
            };
        }

        // MESSAGE HANDLERS

        function doAttach(node) {
            container = node;
            ui = UI.make({
                node: container,
                bus: bus
            });
            var layout = renderLayout();
            container.innerHTML = layout.content;
            layout.events.attachEvents(container);
            places = {
                inputFields: ui.getElement('input-fields'),
                outputFields: ui.getElement('output-fields'),
                parameterFields: ui.getElement('parameter-fields'),
                advancedParameterFields: ui.getElement('advanced-parameter-fields')
            };
        }

        // EVENTS

        function attachEvents() {
            bus.on('reset-to-defaults', function () {
                inputBusses.forEach(function (inputBus) {
                    inputBus.emit('reset-to-defaults');
                });
            });
            bus.on('toggle-advanced', function () {
                // we can just do that here? Or defer to the inputs?
                // I don't know ...
                //inputBusses.forEach(function (bus) {
                //    bus.send({
                //        type: 'toggle-advanced'
                //    });
                //});
                settings.showAdvanced = !settings.showAdvanced;
                renderAdvanced('input-objects');
                renderAdvanced('parameters');
            });
            runtime.bus().on('workspace-changed', function () {
                // tell each input widget about this amazing event!
                widgets.forEach(function (widget) {
                    widget.bus.emit('workspace-changed');
                });
            });
        }

        // Maybe
        function validateParameterSpec(spec) {
            // ensure that inputs are consistent with inputs

            // and outputs with output

            // and params with param

            // validate type

            return spec;
        }

        function validateParameterSpecs(params) {
            return params.map(function (spec) {
                return validateParameterSpec(spec);
            });
        }

        function makeParamsLayout(params) {
            var view = {};
            var paramMap = {};
            var orderedParams = params.map(function (param) {
                paramMap[param.id] = param;
                return param.id;
            });
            var layout = orderedParams.map(function (parameterId) {
                var id = html.genId();
                view[parameterId] = {
                    id: id
                };

                return div({
                    id: id,
                    dataParameter: parameterId
                });
            }).join('\n');

            return {
                content: layout,
                layout: orderedParams,
                params: params,
                view: view,
                paramMap: paramMap
            };
        }

        // LIFECYCLE API

        function renderParameters() {
            // First get the app specs, which is stashed in the model,
            // with the parameters returned.
            // Separate out the params into the primary groups.
            var appSpec = model.getItem('appSpec');
            
            return Promise.try(function () {
                var params = model.getItem('parameters'),
                    inputParams = makeParamsLayout(
                        params.layout.filter(function (id) {
                            return (params.specs[id].ui.class === 'input');
                        })
                        .map(function (id) {
                            return params.specs[id];
                        })),
                    outputParams = makeParamsLayout(
                        params.layout.filter(function (id) {
                            return (params.specs[id].ui.class === 'output');
                        })
                        .map(function (id) {
                            return params.specs[id];
                        })),
                    parameterParams = makeParamsLayout(
                        params.layout.filter(function (id) {
                            return (params.specs[id].ui.class === 'parameter');
                        })
                        .map(function (id) {
                            return params.specs[id];
                        }));

                // new params format is a map with an accompanying ordering layout

                // here is what we do:

                // based on the param ordering (layout), render the html layout, 
                // with an id mapped per parameter in this set


                return Promise.resolve()
                    .then(function () {
                        if (inputParams.layout.length === 0) {
                            places.inputFields.innerHTML = span({style: {fontStyle: 'italic'}}, 'This app does not have input objects');
                        } else {
                            places.inputFields.innerHTML = inputParams.content;
                            return Promise.all(inputParams.layout.map(function (parameterId) {
                                var spec = inputParams.paramMap[parameterId];
                                try {
                                    return makeFieldWidget(appSpec, spec, model.getItem(['params', spec.id]))
                                        .then(function (result) {
                                            widgets.push(result);

                                            return result.widget.start({
                                                node: document.getElementById(inputParams.view[parameterId].id)
                                            });
                                        });
                                } catch (ex) {
                                    console.error('Error making input field widget', ex);
                                    var errorDisplay = div({style: {border: '1px red solid'}}, [
                                        ex.message
                                    ]);
                                    document.getElementById(inputParams.view[parameterId].id).innerHTML = errorDisplay;
                                }
                            }));
                        }
                    })
                    .then(function () {
                        if (outputParams.layout.length === 0) {
                            places.outputFields.innerHTML = span({style: {fontStyle: 'italic'}}, 'This app does not create any named output objects');
                        } else {
                            places.outputFields.innerHTML = outputParams.content;
                            return Promise.all(outputParams.layout.map(function (parameterId) {
                                var spec = outputParams.paramMap[parameterId];
                                try {
                                    return makeFieldWidget(appSpec, spec, model.getItem(['params', spec.id]))
                                        .then(function (result) {
                                            widgets.push(result);

                                            return result.widget.start({
                                                node: document.getElementById(outputParams.view[parameterId].id)
                                            });
                                        });
                                } catch (ex) {
                                    console.error('Error making input field widget', ex);
                                    var errorDisplay = div({style: {border: '1px red solid'}}, [
                                        ex.message
                                    ]);
                                    document.getElementById(outputParams.view[parameterId].id).innerHTML = errorDisplay;
                                }
                            }));
                        }
                    })
                    .then(function () {
                        if (parameterParams.layout.length === 0) {
                            // TODO: should be own node
                            places.parameterFields.innerHTML = span({style: {fontStyle: 'italic'}}, 'No parameters for this app');
                        } else {
                            places.parameterFields.innerHTML = parameterParams.content;
                            return Promise.all(parameterParams.layout.map(function (parameterId) {
                                var spec = parameterParams.paramMap[parameterId];
                                try {
                                    console.log('PARAM---', parameterParams);
                                    return makeFieldWidget(appSpec, spec, model.getItem(['params', spec.id]))
                                        .then(function (result) {
                                            widgets.push(result);

                                            return result.widget.start({
                                                node: document.getElementById(parameterParams.view[spec.id].id)
                                            });
                                        });
                                } catch (ex) {
                                    console.error('Error making input field widget', ex);
                                    var errorDisplay = div({style: {border: '1px red solid'}}, [
                                        ex.message
                                    ]);
                                    document.getElementById(parameterParams.view[spec.id].id).innerHTML = errorDisplay;
                                }
                            }));
                        }
                    })
                    .then(function () {
                        return Promise.all(widgets.map(function (widget) {
                            return widget.widget.start();
                        }));
                    })
                    .then(function () {
                        return Promise.all(widgets.map(function (widget) {
                            return widget.widget.run(params);
                        }));
                    })
                    .then(function () {
                        renderAdvanced('input-objects');
                        renderAdvanced('parameters');
                    });
            });
        }

        function start() {
            return Promise.try(function () {
                // send parent the ready message
                parentBus.emit('ready');

                // parent will send us our initial parameters
                parentBus.on('run', function (message) {
                    doAttach(message.node);
                    
                    console.log('running app params widget', message.parameters);

                    model.setItem('appSpec', message.appSpec);
                    model.setItem('parameters', message.parameters);
                    model.setItem('converted', message.converted);

                    // we then create our widgets
                    renderParameters()
                        .then(function () {
                            // do something after success
                            attachEvents();
                        })
                        .catch(function (err) {
                            // do somethig with the error.
                            console.error('ERROR in start', err);
                        });
                });

                parentBus.on('parameter-changed', function (message) {
                    // Also, tell each of our inputs that a param has changed.
                    // TODO: use the new key address and subscription
                    // mechanism to make this more efficient.
                    inputBusses.forEach(function (bus) {
                        bus.send(message, {
                            key: {
                                type: 'parameter-changed',
                                parameter: message.parameter
                            }
                        });
                        // bus.emit('parameter-changed', message);
                    });
                });
            });
        }

        function stop() {
            return Promise.try(function () {
                // really unhook things here.
            });
        }

        // CONSTRUCTION

        bus = runtime.bus().makeChannelBus(null, 'A app params widget');


        return {
            start: start,
            stop: stop,
            bus: function () {
                return bus;
            }
        };
    }

    return {
        make: function (config) {
            return factory(config);
        }
    };
});
