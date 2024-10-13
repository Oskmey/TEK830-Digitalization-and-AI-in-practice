from flask import Flask
from flask_svelte import render_template
from FlaskServer.app.imageHandler import ImageHandler
app = Flask(__name__)

@app.route("/")
def index():
    return render_template("index.html", name="Flask Svelte")

@app.route("/upload")
def upload():
    pass