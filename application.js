#!/usr/bin/node
//class definitions may be global, instances should not be, with the exception of some caching
GLOBAL.mysql = require("mysql");
GLOBAL.mongo = require("mongojs");
GLOBAL.amqp = require("amqp");
require('AsciiArt').apply(GLOBAL);
require('Protolus.Bootstrap').apply(GLOBAL);
//GLOBAL.threads = require("threads_a_gogo");
//var thread = threads.create();
//thread.load(__dirname +'/test.js');

//thread.on('test-return', function(result){
//    console.log('test', result);
//});

/*thread.eval('function meaning(){return 42}', function(err, val){
});

/*System.file.readFile(__dirname +'/test.js', 'utf8', function(err, data){
    console.log('file', data, err);
});
//*/

/*thread.eval('meaning()', function(err, val){
    console.log('blah', val, err);
});*/

//*
Protolus.resourceDirectory = __dirname+'/Resources';
Protolus.configurationDirectory = __dirname+'/Configuration';
Protolus.classDirectory = __dirname+'/Classes';

Protolus.appName = 'Demo    API';
Protolus.appPort = 800;

Protolus.bootstrap({
    console : true
});
Protolus.requestableFiletypes = [
    'jpeg','jpg',
    'gif',
    'png',
    'html',
    'js',
    'tpl',
    'css',
    'less',
    'txt'
];

Protolus.verbose = true;
var application;
var errorFunction = function(connection, message, code){
    if(!code) code = 400;
    System.file.readFile(code+'.html', 'utf8', function(err, data){
        var page;
        if(err){
            page = '<html><body><h1>'+message+'</h1></body></html>';
        }else{
            page = data.replace('{{message}}', message);
        }
        connection.error(page, code);
    });
};
Protolus.require(
    [ 'Extensions', 'Core', 'Web', 'Parsers', 'Templating'], function(){
        application = new Protolus.WebApplication({ data : true }, function(){
            Protolus.loadClass('APIKey');
            Protolus.loadClass('Session');
            Protolus.loadClass('User');
            application.serve(function(args, connection){
                connection.html();
                var path = connection.request.path.substring(1);
                var parts = path.split('/');
                if(parts.lastIndexOf('.') != -1){
                    var type = parts.substring(parts.lastIndexOf('.'));
                    console.log('Type:'+type);
                    if(!Protolus.requestableFiletypes.contains(type.toLowerCase())){
                        connection.htmlStatusToCode('error');
                    }
                }else{
                    Protolus.route(path, function(routedPath){
                        Protolus.Panel.exists(path, function(panelExists){
                            if(panelExists){
                                Protolus.PageRenderer.renderPage(path, {
                                    onSuccess : function(html){
                                        connection.respond(html);
                                    },
                                    resources : ['Main']
                                });
                            }else{
                                errorFunction(connection, 'This panel does not exist', 404);
                            }
                        });
                    });
                }
                
            });
        });
    }
);
//*/