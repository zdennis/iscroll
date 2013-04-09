module.exports = function (grunt) {
	grunt.initConfig({
		pkg: grunt.file.readJSON('package.json'),

		concat: {
			options: {
				banner: '/*! iScroll v<%= pkg.version %> ~ (c) 2008-<%= grunt.template.today("yyyy") %> Matteo Spinelli, http://cubiq.org ~ cubiq.org/license */\n'
			},

			build: {
				dest: 'build/iscroll.js',
				src: [
						'src/open.js',
						'src/utils.js',
						'src/core.js',
						'src/default/*.js',
						'src/close.js'
					]
			},
			lite: {
				dest: 'build/iscroll-lite.js',
				src: [
						'src/open.js',
						'src/utils.js',
						'src/core.js',
						'src/lite/_initEvents.js',
						'src/default/_translate.js',
						'src/default/getComputedPosition.js',
						'src/close.js'
					]
			},
			iphone: {
				dest: 'build/iscroll-iphone.js',
				src: [
						'src/open.js',
						'src/utils.js',
						'src/core.js',
						'src/iphone/*.js',
						'src/close.js'
					]
			}
		},

		jshint: {
			dist: ['build/*.js']
		},

		uglify: {
			dist: {
				files: [
					{
						expand: true,
						cwd: 'build',
						src: '*.js',
						dest: 'dist/',
						ext: '.min.js'
					}
				]
			}
		},

		watch: {
			files: [ '<%= concat.build.src %>' ],
			tasks: 'default'
		}
	});

	grunt.loadNpmTasks('grunt-contrib-concat');
	grunt.loadNpmTasks('grunt-contrib-jshint');
	grunt.loadNpmTasks('grunt-contrib-uglify');
	grunt.loadNpmTasks('grunt-contrib-watch');

	grunt.registerTask('default', ['concat:build']);
	grunt.registerTask('iphone', ['concat:iphone']);
	grunt.registerTask('dist', ['concat', 'jshint', 'uglify']);
};