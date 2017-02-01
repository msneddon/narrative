'use strict';
var path = require('path');

// the actual "static" directory path, relative to this Gruntfile.
// should be updated as necessary, if this moves
var staticDir = 'static';

module.exports = function(grunt) {
    // Project configuration
    grunt.loadNpmTasks('grunt-contrib-requirejs');
    grunt.loadNpmTasks('grunt-filerev');
    grunt.loadNpmTasks('grunt-regex-replace');
    grunt.loadNpmTasks('grunt-karma');
    grunt.loadNpmTasks('grunt-coveralls');

    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),

        // Compile the requirejs stuff into a single, uglified file.
        // the options below are taken verbatim from a standard build.js file
        // used for r.js (if we were doing this outside of a grunt build)
        requirejs: {
            compile: {
                options: {
                    name: 'narrative_paths',
                    baseUrl: 'kbase-extension/static',
                    include: ['narrativeMain'],
                    // baseUrl: "./static",
                    mainConfigFile: 'kbase-extension/static/narrative_paths.js',
                    findNestedDependencies: true,
                    // optimize: 'uglify2',
                    generateSourceMaps: false,
                    preserveLicenseComments: false,
                    out: 'kbase-extension/static/kbase-narrative-min.js',
                    paths: {
                        // jquery: 'empty:',
                        jqueryui: 'empty:',
                        bootstrap: 'empty:',
                        'jquery-ui': 'empty:',
                        narrativeConfig: 'empty:',
                        'base/js/utils': 'empty:',
                        'base/js/namespace': 'empty:',
                        // 'kbase/js/widgets/narrative_core/upload/fileUploadWidget': 'empty:',
                        bootstraptour: 'empty:',
                        // 'kbase/js/widgets/narrative_core/upload/uploadTour': 'empty:',
                        'services/kernels/comm': 'empty:',
                        'common/ui': 'empty:',
                        'notebook/js/celltoolbar': 'empty:',
                        'base/js/events': 'empty:',
                        'base/js/keyboard': 'empty:',
                        'notebook/js/notebook': 'empty:',
                        // narrativeTour: 'empty:',
                        'notebook/js/main': 'empty:'
                    },
                    inlineText: false,
                    // exclude: [
                    //     'jqueryui',
                    //     'bootstrap',
                    //     'jquery-ui'
                    // ],
                    // onBuildWrite: function (moduleName, path, contents) {
                    //     if (moduleName.lastIndexOf('text!', 0) === 0 ||
                    //         moduleName.lastIndexOf('css!', 0) === 0 ||
                    //         moduleName.lastIndexOf('json!', 0) === 0) {
                    //         return '';
                    //     }
                    //     return contents;
                    // },
                    buildCSS: false,
                    // pragmasOnSave: {
                    //     excludeRequireCss: true,
                    // },
                    optimizeAllPluginResources: false,
                    // wrapShim: true,
                    done: function(done, output) {
                        console.log(output);
                        done();
                    }
                }
            }
        },

        // Once we have a revved file, this inserts that reference into page.html at
        // the right spot (near the top, the narrative_paths reference)
        'regex-replace': {
            dist: {
                src: ['kbase-extension/kbase_templates/notebook.html'],
                actions: [
                    {
                        name: 'requirejs-onefile',
                        // search: 'narrativeMain',
                        search: 'narrativeMain.js',

                        replace: function(match) {
                            return 'kbase-narrative-min.js'
                        },

                        //     // do a little sneakiness here. we just did the filerev thing, so get that mapping
                        //     // and return that (minus the .js on the end)
                        //     var revvedFile = 'kbase-narrative-min.js';
                        //     // starts with 'static/' and ends with '.js' so return all but the first 7 and last 3 characters
                        //     return revvedFile.substr(7, revvedFile.length - 10);
                        // },
                        flags: ''
                    }
                ]
            }
        },

        // Testing with Karma!
        'karma': {
            unit: {
                configFile: 'test/unit/karma.conf.js',
                reporters: ['progress', 'coverage'],
                coverageReporter: {
                    dir: 'build/test-coverage/',
                    reporters: [
                        {
                            type: 'html', subdir: 'html'
                        }
                    ]
                }
            },
            dev: {
                // to do - add watch here
                configFile: 'test/unit/karma.conf.js',
                reporters: ['progress', 'coverage'],
                coverageReporter: {
                    dir: 'build/test-coverage/',
                    reporters: [
                        { type: 'html', subdir: 'html' },
                    ],
                },

                autoWatch: true,
                singleRun: false,

            }
        },

        // Run coveralls and send the info.
        'coveralls': {
            options: {
                force: true,
            },
            'ui-common': {
                src: 'build/test-coverage/lcov/**/*.info',
            },
        },

    });

    grunt.registerTask('minify', [
        'requirejs',
        'regex-replace'
    ]);

    grunt.registerTask('build', [
        'requirejs',
        'filerev',
        'regex-replace'
    ]);

    grunt.registerTask('test', [
        'karma:unit',
    ]);

    // Does a single unit test run, then sends
    // the lcov results to coveralls. Intended for running
    // from travis-ci.
    grunt.registerTask('test-travis', [
        'karma:unit',
        'coveralls'
    ]);

    // Does an ongoing test run in a watching development
    // mode.
    grunt.registerTask('develop', [
        'karma:dev',
    ]);
};
