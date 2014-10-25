module.exports = function (grunt) {

    // Project configuration.
    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),
        build:{
            'all':{
                base:'src',
                name:'vomit',
                dst:'target/vomit.js',
                wrapper:grunt.file.read('src/wrapper.js')
            }
        }
    });

    grunt.loadTasks('../build-js/src/task');

    grunt.registerTask('default', ['build']);
};