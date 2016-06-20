module.exports = function(grunt) {
    'use strict';

    var path = require('path');
    
    var wrapper = grunt.file.read('build-utils/index.js', {encoding: 'utf8'}).split('/*{split}*/');
    var settings = grunt.file.exists('build-settings.json') ?
            grunt.file.readJSON('build-settings.json') :
            {};
    
    //console.log(settings);
    
    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),
        settings: settings,
        concat: {

            css: {
                src: [
                    'src/core.css',
                ],
                dest: 'build/<%= pkg.name %>.css'
            },
            js: {
                options: {
                    banner: wrapper[1],
                    footer: wrapper[2]
                },
                src: [
                    'src/lib/*.js',
                    'src/graph/*.js',
                    'src/utils/*.js',
                    'src/dom/objects.js',
                    'src/dom/*.js',
                    'src/commands.js',
                    'src/cmd-runner.js',
                    'src/tools/basetool.js',
                    'src/tools/*.js',
                    'src/filters/basefilter.js',
                    'src/filters/*.js',
                    'src/config.js',
                    'src/index.js'
                ],
                dest: 'build/<%= pkg.name %>.src.js'
            }
        },
        uglify: {
            options: {
                banner: wrapper[0]
            },
            build: {
                src: 'build/<%= pkg.name %>.src.js',
                dest: 'build/<%= pkg.name %>.js'
            }
        },
        copy: {
            main: {
                files: [{
                    src: 'build/<%= pkg.name %><%= settings.js %>.js',
                    dest: '<%= settings.demoFolder %>/js/lib/<%= pkg.name %>.js'
                }, {
                    expand: true,
                    cwd: 'build',
                    src: '<%= pkg.name %>.css',
                    dest: '<%= settings.demoFolder %>/css/'
                }]
            }
        }
    });

    grunt.loadNpmTasks('grunt-contrib-concat');
    grunt.loadNpmTasks('grunt-contrib-uglify');
    
    var tasks = ['concat', 'uglify'];

    if (settings.demoFolder) {
        grunt.loadNpmTasks('grunt-contrib-copy');
        tasks.push('copy');
    }
    
    grunt.registerTask('default', tasks);
};