from flask import Flask
from flask_svelte import render_template
from webuiapi import webuiapi
from flask import request, jsonify
from pprint import pprint
app = Flask(__name__)

api = webuiapi.WebUIApi()

@app.route("/")
def index():
    return render_template("index.html", name="Flask Svelte")

@app.route("/upload", methods=["POST"])
def generate_image():

    image = request.files['image']
    prompt = request.form.get('prompt')
    sampler = request.form.get('sampler')
    steps = int(request.form.get('steps'))
    cfg_scale = float(request.form.get('cfg_scale'))

    result = api.generate_image(image, prompt, sampler, steps, cfg_scale)

    return jsonify(result)