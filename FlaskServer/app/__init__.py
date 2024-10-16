from flask import Flask
from flask_svelte import render_template
from webuiapi import webuiapi
from flask import request, jsonify
from PIL import Image
import io

app = Flask(__name__)

api = webuiapi.WebUIApi()

@app.route("/")
def index():
    return render_template("index.html", name="Flask Svelte")

@app.route("/upload", methods=["POST"])
def generate_image():
    try:
        image = Image.open(request.files['image'])
        prompt = request.form.get('prompt')
        print(prompt)
        sampler = request.form.get('sampler')
        steps = int(request.form.get('steps'))
        cfg_scale = float(request.form.get('cfg_scale'))
        denoising_strength = request.form.get('denoising_strength')

        result = api.img2img(images=[image], prompt=prompt, sampler_name=sampler, steps=steps, cfg_scale=cfg_scale, denoising_strength=denoising_strength)
        
        return jsonify({"message": "Image generated successfully", "result": result})
    except Exception as e:
        return jsonify({"message": "An error occurred", "error": str(e)})