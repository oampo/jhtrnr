import os
import os.path
import json

from flask import Flask, Response, send_from_directory

app = Flask(__name__)
app.debug = True

@app.route("/")
@app.route("/<path:path>")
def index(path=None):
    return send_from_directory(app.root_path, "index.html")

@app.route("/<path>/files")
def local_files(path):
    files = []
    for file in os.listdir(os.path.join("content", path)):
        file = os.path.join("content", path, file)
        if not os.path.isfile(file):
            continue
        files.append("/{}".format(file))
    return Response(json.dumps(files), 200, mimetype="application/json")

@app.route("/content/<path:path>")
def content(path):
    return send_from_directory(os.path.join(app.root_path, "content"),
                               path)

if __name__ == "__main__":
    app.run()


