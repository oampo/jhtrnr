var Util = {};

Util.slugify = function(string) {
    string = string.toLowerCase();
    // Remove disallowed characters
    string = string.replace(/[^a-z0-9-_ ]/, '');
    // Replace spaces with dashes
    string = string.replace(/\s+/, '-');
    // Collapse multiple dashes to a single dash
    string = string.replace(/-+/, '-');
    return string;
};

Util.cdnURL = function(rawURL) {
    var rawLink = document.createElement('a');
    rawLink.href = rawURL;

    return "https://cdn.rawgit.com" + rawLink.pathname;
};

Util.pathToGistID = function(path) {
    var splitPath = path.split("/");
    return splitPath[splitPath.length - 1];
};
