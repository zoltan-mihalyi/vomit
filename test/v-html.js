(function () {
    var vomit = require('../target/vomit');
    var fs = require('fs');
    var html = fs.readFileSync('v-html.html');
    var template = vomit(html);

    var result = template({
        todos: [{
            name:'Valami',
            date:'123'
        }, {
            name:'Bármi',
            date:'123'
        }]
    });
    console.log(result);
    if (result.indexOf('1234') === -1) {
        //throw new Error('HIBA');
    } //todo test framework
})();