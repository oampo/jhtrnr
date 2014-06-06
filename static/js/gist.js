var Gist = function(app, data) {
    this.app = app;
    this.data = data;
    this.content = null;
    this.generateMetadata();

    this.contentFiles = this.findFilesWithLanguage(["HTML", "Markdown"]);
    this.templateFiles = this.findFilesWithLanguage(["Handlebars"]);
    this.javascriptFiles = this.findFilesWithLanguage(["JavaScript"]);
    this.cssFiles = this.findFilesWithLanguage(["CSS"]);
};

Gist.prototype.generateMetadata = function() {
    this.parseDescription();
    this.generatePath();
};

Gist.prototype.load = function() {
    var files = [];
    files = files.concat(this.contentFiles);
    files = files.concat(this.templateFiles);
    files = files.concat(this.javascriptFiles);
    files = files.concat(this.cssFiles);
    return this.getFiles(files);
};

Gist.prototype.getFile = function(file) {
    return this.getFiles([file]);
};

Gist.prototype.getFiles = function(files) {
    var deferreds = [];
    for (var i=0; i<files.length; i++) {
        var file = files[i];
        var deferred = this.getDeferred(file);
        deferreds.push(deferred);
    }

    var deferred = $.when.apply(this, deferreds).done(
        this.setContent.bind(this, files)
    );

    return deferred;
};

Gist.prototype.getDeferred = function(file) {
    if (file == null) {
        return null;
    }

    if (!("content" in file) || file.truncated) {
        var url = Util.cdnURL(file.raw_url);
        var ajax = $.ajax({
            url: url
        });
        return ajax;
    }

    if (file.language == "JSON") {
        file.content = JSON.parse(file.content);
    }

    return file.content;
};

Gist.prototype.setContent = function() {
    var files = arguments[0];
    for (var i=0; i<files.length; i++) {
        var file = files[i];
        if (file == null) {
            continue;
        }

        var content = arguments[i + 1];
        if (content instanceof Array) {
            content = content[0];
        }
        file.content = content;
        file.truncated = false;
    }
};

Gist.prototype.compile = function() {
    if (this.content != null) {
        return;
    }

    var context = {};
    if (this.app.onCompileStart) {
        this.app.onCompileStart(this, context);
    }

    this.content = "";
    if (this.contentFiles.length && "content" in this.contentFiles[0]) {
        this.content = marked(this.contentFiles[0].content);
    }

    if (this.templateFiles.length && "content" in this.templateFiles[0]) {
        // Compile Handlebars template
        template = Handlebars.compile(this.templateFiles[0].content);

        // Construct context
        context.gist = this;
        context.content = this.content;
        this.content = template(context);
    }

    if (this.app.onCompileEnd) {
        this.app.onCompileEnd(this);
    }
};

Gist.prototype.render = function() {
    if (this.app.onRenderStart) {
        this.app.onRenderStart(this);
    }

    this.app.mainDiv.empty().html(this.content);

    if (this.hasNext()) {
        var next = this.app.gistList[this.data.index - 1];
        this.app.nextLink.attr("href", next.data.path);
        this.app.nextLink.removeAttr("disabled");
    }
    else {
        this.app.nextLink.attr("href", "#");
        this.app.nextLink.attr("disabled", "");
    }

    if (this.hasPrev()) {
        var prev = this.app.gistList[this.data.index + 1];
        this.app.prevLink.attr("href", prev.data.path);
        this.app.prevLink.removeAttr("disabled");
    }
    else {
        this.app.prevLink.attr("href", "#");
        this.app.prevLink.attr("disabled", "");
    }

    if (this.app.onRenderEnd) {
        this.app.onRenderEnd(this);
    }
};


Gist.prototype.shouldShow = function() {
    return this.data.tags.indexOf("crumbs") != -1;
};

Gist.prototype.shouldIndex = function() {
    return (this.shouldShow() &&
            this.data.tags.indexOf("draft") == -1 &&
            this.data.tags.indexOf("no-index") == -1);
};

Gist.prototype.parseDescription = function() {
    var split = this.data.description.split("#");
    title = split[0].trim();
    var tags = split.slice(1);
    for (var i=0; i<tags.length; i++) {
        tags[i] = tags[i].trim();
    }
    this.data.title = title;
    this.data.tags = tags;
};

Gist.prototype.generatePath = function(gist) {
    this.data.path = "/pages/" + Util.slugify(this.data.title) + "/" + this.data.id;
};

Gist.prototype.findFilesWithLanguage = function(languages) {
    var files = [];
    for (var fileName in this.data.files) {
        var file = this.data.files[fileName];
        if (languages.indexOf(file.language) != -1) {
            files.push(file);
        }
    }
    return files;
};

Gist.prototype.insertJavascript = function() {
    for (var i=0; i<this.javascriptFiles.length; i++) {
        var file = this.javascriptFiles[i];
        var script   = document.createElement("script");
        script.text  = file.content;
        document.head.appendChild(script);
    }
};

Gist.prototype.insertCSS = function() {
    for (var i=0; i<this.cssFiles.length; i++) {
        var file = this.cssFiles[i];
        var style = document.createElement("style");
        style.type = "text/css";
        style.className = "gist-style";
        if (style.styleSheet) {
            style.styleSheet.cssText = file.content;
        }
        else {
            style.appendChild(document.createTextNode(file.content));
        }
        document.head.appendChild(style);
    }
};

Gist.prototype.hasNext = function() {
    return this.data.index != null && this.data.index > 0;
};

Gist.prototype.hasPrev = function() {
    return (this.data.index != null &&
            this.data.index < this.app.gistList.length - 1);
};



