from flask import Flask
from flask_svelte import render_template
from webuiapi import webuiapi
from flask import request, jsonify
from PIL import Image
import io
import base64
import requests
from io import BytesIO
app = Flask(__name__)

api = webuiapi.WebUIApi()

@app.route("/")
def index():
    return render_template("index.html", name="Flask Svelte")

@app.route("/upload", methods=["POST"])
def generate_image():

    image = Image.open(request.files['image'])
    image.save("input_image.png")
    prompt = request.form.get('prompt')
    sampler = request.form.get('sampler')
    steps = int(request.form.get('steps'))
    cfg_scale = float(request.form.get('cfg_scale'))
    denoising_strength = float(request.form.get('denoising_strength'))

    
    #print(cfg_scale)

    result = api.img2img(images=[image], prompt=prompt, sampler_name=sampler, steps=steps, cfg_scale=cfg_scale, denoising_strength=denoising_strength, width=1000, height=1000)

    print(result)

    result.images[0].save("output_image.png")

    # url = "http://127.0.0.1:7860"

    # payload = {
    #     "prompt": "puppy dog",
    #     "steps": 5
    # }

    # response = requests.post(url=f'{url}/sdapi/v1/img2img', json=payload)
    # r = response.json()


    
    
    # image_data = base64.b64decode(result.images[0])

    # with open('output_image.png', 'wb') as file:
    #     file.write(image_data)


    # def decode_and_save_base64(base64_str, save_path):
    # with open(save_path, "wb") as file:
    #     file.write(base64.b64decode(base64_str))

    return result

# def encode_file_to_base64(path):
#     with open(path, 'rb') as file:
#         return base64.b64encode(file.read()).decode('utf-8')