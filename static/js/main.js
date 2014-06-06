var Main = function() {
    this.gistList = [];
    this.gistDict = {};
    this.aliases = {};
    this.gist = null;

    this.mainDiv = $("div#main");
    this.nextLink = $("a#next");
    this.prevLink = $("a#prev");

    this.clearListeners();

    $(window).on('load', function() {
        setTimeout(function() {
            addEventListener("popstate", this.onPopState.bind(this));
        }.bind(this))
    }.bind(this));

    $("body").on("click", "a", this.onLinkClicked.bind(this));

    this.getGists(this.onGetGists.bind(this));
};

Main.ALIASES_ID = "6cbcf33c992b662b9558";

Main.prototype.onPopState = function(event) {
    this.move();
};

Main.prototype.onLinkClicked = function(event) {
    var link = event.target;
    if (link.host == document.location.host) {
        history.pushState(null, null, link.href);
        this.move();
        event.preventDefault();
    }
};

Main.prototype.move = function(shouldFadeOut) {
    if (shouldFadeOut == null) {
        shouldFadeOut = true;
    }

    var gist = this.routeToGist();
    if (gist == this.gist) {
        return;
    }

    if (gist == null) {
        // 40WHAT
        return;
    }

    this.gist = gist;

    var deferreds = [];
    var load = this.gist.load();
    deferreds.push(load);

    if (shouldFadeOut) {
        if (this.onFadeOutStart) {
            this.onFadeOutStart(this);
        }

        var fadeOut = this.mainDiv.fadeOut(500).promise();
        deferreds.push(fadeOut);
    }
    else {
        this.mainDiv.hide();
    }

    $.when.apply(this, deferreds).done(
        this.onMoveOutDone.bind(this, shouldFadeOut)
    );
};

Main.prototype.onMoveOutDone = function(shouldFadeOut) {
    if (shouldFadeOut && this.onFadeOutEnd) {
        this.onFadeOutEnd(this);
    }

    $("title").text(this.gist.data.title);
    this.clearListeners();
    $("style.gist-style").remove();
    this.gist.insertJavascript();
    this.gist.insertCSS();
    this.gist.compile();
    this.gist.render();

    if (this.onFadeInStart) {
        this.onFadeInStart(this);
    }
    var fadeIn = this.mainDiv.fadeIn(500).css("display", "table").promise();
    fadeIn.done(this.onMoveInDone.bind(this));
}

Main.prototype.onMoveInDone = function() {
    if (this.onFadeInEnd) {
        this.onFadeInEnd(this);
    }
};

Main.prototype.routeToGist = function() {
    var path = document.location.pathname;
    var gist = null;
    if (path == "/") {
        var i = 0;
        for (var i=0; i<this.gistList.length; i++) {
            gist = this.gistList[i];
            if (gist.shouldIndex()) {
                break;
            }
        }
    }
    else if (path in this.aliases) {
        gist = this.gistDict[this.aliases[path]];
    }
    else {
        var splitPath = path.split("/");
        gist = this.gistDict[splitPath[splitPath.length - 1]];
    }
    return gist;
};

Main.prototype.getGists = function(callback, page, per_page) {
    page = page || 1;
    per_page = per_page || 100;

    var url = "https://api.github.com/users/oampo/gists?per_page=100&page=";
    url += page;
    var ajax = $.ajax({
        url: url
    });
    ajax.done(this.storeGists.bind(this, callback, page, per_page));
};

Main.prototype.storeGists = function(callback, page, per_page, gists) {
    for (var i=0; i<gists.length; i++) {
        var gist = new Gist(this, gists[i]);
        if (!gist.shouldShow()) {
            continue;
        }

        this.gistDict[gist.data.id] = gist;
        gist.data.index = null;

        if (!gist.shouldIndex()) {
            continue;
        }

        this.gistList.push(gist);
        gist.data.index = this.gistList.length - 1;
    }

    if (gists.length == 0 || gists.length < per_page) {
        if (callback) {
            callback(this.gistList);
        }
        return;
    }

    this.getGists(callback, page + 1, per_page);
};

Main.prototype.onGetGists = function() {
    var gist = this.gistDict[Main.ALIASES_ID];
    var file = gist.findFilesWithLanguage("JSON")[0];
    var deferred = gist.getFile(file);
    deferred.done(this.onGetAliasFile.bind(this));
};

Main.prototype.onGetAliasFile = function(aliases) {
    this.aliases = aliases;
    this.move(false);
};

Main.prototype.clearListeners = function() {
    this.onFadeOutStart = null;
    this.onFadeOutEnd = null;
    this.onFadeInStart = null;
    this.onFadeInEnd = null;

    this.onLoadStart = null;
    this.onLoadEnd = null;

    this.onCompileStart = null;
    this.onCompileEnd = null;

    this.onRenderStart = null;
    this.onRenderEnd = null;
};

Handlebars.registerHelper('contains', function(itemA, itemB, options) {
    if(itemA.indexOf(itemB) != -1) {
        return options.fn(this);
    }
    else {
         return options.inverse(this);
    }
});

$(document).ready(function() {
    main = new Main();
});
