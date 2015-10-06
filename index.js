var BrowserWindow = require('browser-window'),
    URL = require('url'),
    fs = require('fs'),
    path = require('path');

var Uglify = require('uglify-js');
var CleanCSS = require('clean-css');

var JsInjector = function() {
    var content = '',
        uglifyContent = '',
        pathRegex, param,
        params = Array.prototype.slice.call(arguments);

    param = params.shift();
    if (param && param.__proto__ === /(?:)/.__proto__) {
        pathRegex = param;
        param = params.shift();
    }

    if (typeof param === 'function') {
        content = '(' + param + ')()';
    }
    else if (typeof param === 'string' &&
        path.parse(param).ext === '.js')
    {
        if (fs.existsSync(param)) {
            content = fs.readFileSync(param, 'utf8');
        }
        else {
            console.error('[Js Injector] File "' + param + '" does not exist.');
        }
    }

    this.getPathRegex = function() {
        return pathRegex;
    };

    this.getContent = function() {
        return content;
    };

    this.getUglifyContent = function() {
        if (!uglifyContent) {
            uglifyContent = Uglify.minify(content, {fromString: true}).code;
        }

        return uglifyContent;
    };
};

var CssInjector = function() {
    var content = '',
        minifyContent = '',
        pathRegex, param,
        params = Array.prototype.slice.call(arguments);

    param = params.shift();
    if (param && param.__proto__ === /(?:)/.__proto__) {
        pathRegex = param;
        param = params.shift();
    }

    if (typeof param === 'string' &&
        path.parse(param).ext === '.css')
    {
        if (fs.existsSync(param)) {
            content = fs.readFileSync(param, 'utf8');
        }
        else {
            console.error('[Css Injector] File "' + param + '" does not exist.');
        }
    }

    this.getPathRegex = function() {
        return pathRegex;
    };

    this.getContent = function() {
        return content;
    };

    this.getMinifyContent = function() {
        if (!minifyContent) {
            minifyContent = new CleanCSS().minify(content).styles;
        }

        return minifyContent;
    };
};

var defaultJsInjectors = function(_config) {
    var injectors = [];

    if (_config && _config.requireMenu) {
        injectors.push(new JsInjector(__dirname +  '/scripts/menuInjector.js'));
    }

    return injectors;
};

var defaultCssInjectors = function(_config) {
    var injectors = [];

    if (_config && _config.requireMenu) {
        injectors.push(new CssInjector(__dirname + '/styles/menu.css'));
    }

    return injectors;
};

var Creator = function(_config) {
    var config = {}, newWindow, lockedOrigin;

    if (typeof _config === 'string') {
        config.url = _config;
    }
    else if (typeof _config === 'object' && _config) {
        config = _config;
    }

    // set default values
    config['min-width']     = config['min-width']   || 800;
    config['min-height']    = config['min-height']  || 600;
    config.width            = config.width          || 1080;
    config.height           = config.height         || 720;
    config.url              = config.url            || 'http://www.google.com';
    config.multiOrigin      = config.multiOrigin    || false;
    config.requireMenu      = config.requireMenu    || false;
    config.jsInjectors      = config.jsInjectors    || [];
    config.cssInjectors     = config.cssInjectors   || [];
    config.eventHandlers    = config.eventHandlers  || {};
    /*
        Available handlers:
            - domReady(webContent)
            - finishLoading(webContent)
            - willNavigate(webContent, url)
            - shouldNavigate(webContent, url)
    */

    config.jsInjectors = defaultJsInjectors(config).concat(config.jsInjectors);
    config.cssInjectors = defaultCssInjectors(config).concat(config.cssInjectors);

    newWindow = new BrowserWindow(config);
    newWindow.webContents.on('dom-ready', function(e) {
        var webContent = e.sender,
            urlObject = URL.parse(webContent.getUrl());

        console.log('[DOM ready]', webContent.getUrl());

        config.cssInjectors.forEach(function(perCssInjector) {
            var perPathRegex = perCssInjector.getPathRegex();

            if (perPathRegex && urlObject && perPathRegex.test(urlObject.pathname)) {
                webContent.insertCSS(perCssInjector.getMinifyContent());
            }
            else if (!perPathRegex) {
                webContent.insertCSS(perCssInjector.getMinifyContent());
            }
        });

        config.jsInjectors.forEach(function(perJsInjector) {
            var perPathRegex = perJsInjector.getPathRegex();

            if (perPathRegex && urlObject && perPathRegex.test(urlObject.pathname)) {
                webContent.executeJavaScript(perJsInjector.getUglifyContent());
            }
            else if (!perPathRegex) {
                webContent.executeJavaScript(perJsInjector.getUglifyContent());
            }
        });

        if (config.eventHandlers.domReady) {
            config.eventHandlers.domReady(webContent);
        }
    });

    newWindow.webContents.on('did-finish-load', function(e) {
        var webContent = e.sender,
            url = webContent.getUrl();

        console.log('[Finish loading]', url);

        // Lock origin
        if (config.multiOrigin !== true && url && !lockedOrigin) {
            lockedOrigin = URL.parse(url).hostname;
            console.log('[Set Locked Origin]', lockedOrigin);
        }

        if (config.eventHandlers.finishLoading) {
            config.eventHandlers.finishLoading(webContent);
        }
    });

    newWindow.webContents.on('new-window', function(e, url) {
        // TODO: handle multiple windows
        console.log('[Block new window]', url);
        e.preventDefault();
    });

    newWindow.webContents.on('will-navigate', function(e, url) {
        var isBlocked = false;
        console.log('[Will navigate]', url);

        if (config.multiOrigin !== true && URL.parse(url).hostname !== lockedOrigin) {
            isBlocked = true;
        }
        else if (config.eventHandlers.shouldNavigate) {
            isBlocked = (config.eventHandlers.shouldNavigate(e.sender, url) === true);
            console.log('[Should navigate]', !isBlocked, url);
        }

        if (isBlocked) {
            console.log('[Block navigation]', url);
            e.preventDefault();
        }
        else if (config.eventHandlers.willNavigate) {
            config.eventHandlers.willNavigate(e.sender, url);
        }
    });

    newWindow.webContents.on('request-home', function(e) {
        newWindow.loadUrl(config.url);
    });

    newWindow.loadUrl(config.url);
    return newWindow;
};

module.exports = {
    JsInjector: JsInjector,
    CssInjector: CssInjector,
    create: Creator
};
