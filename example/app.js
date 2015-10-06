'use strict';

var app = require('app'),
    dialog = require('dialog'),
    WebWindow = require('web-window'),
    JsInjector = WebWindow.JsInjector;

var mainWindow;

app.on('window-all-closed', function () {
    app.quit();
});

app.on('ready', function () {
    mainWindow = WebWindow.create({
        url: 'https://github.com',
        multiOrigin: false,
        requireMenu: true,
        jsInjectors: [
            // new JsInjector(/someRegex/, 'file-path')
        ],
        eventHandlers: {
            domReady: function(webContent) {
                // TODO: do something
            },
            finishLoading: function(webContent) {
                // TODO: do something
            },
            willNavigate: function(webContent, url) {
                // TODO: do something
            },
            shouldNavigate: function(webContent, url) {
                // TODO: do some checking
                return Math.random() > 0.5;
            }
        }
    });

    mainWindow.on('closed', function() {
        mainWindow = null;
    });
});
