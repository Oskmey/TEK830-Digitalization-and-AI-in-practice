from flask import Flask
from flask_svelte import render_template
from webuiapi import webuiapi, RemBGInterface, ControlNetUnit
from flask import request, jsonify
from PIL import Image
import io
import base64
import requests
from io import BytesIO
app = Flask(__name__)

api = webuiapi.WebUIApi()

rembgInt = RemBGInterface(api)


@app.route("/")
def index():
    return render_template("index.html", name="Flask Svelte")

@app.route("/upload", methods=["POST"])
def generate_image():
    try:
        controlNet0 = ControlNetUnit(image = Image.open(request.files['image']),resize_mode="Crop and Resize",weight=0.3, processor_res=1024, model="diffusers_xl_depth_mid [39c49e13]", module="depth_midas", control_mode=0)
    #detailer =  
        resultMask = rembgInt.rembg(input_image = Image.open(request.files['image']), return_mask = True)
        resultMask.images[0].save("output_maskTest.png")
        image = Image.open(request.files['image'])
        prompt = request.form.get('prompt')
        print(prompt)
        sampler = request.form.get('sampler')
        steps = int(request.form.get('steps'))
        cfg_scale = float(request.form.get('cfg_scale'))
        denoising_strength = request.form.get('denoising_strength')
        #mask_image = Image.open(["output_mask.png"])

        result = api.img2img(images=[image], 
                             prompt=prompt, 
                             sampler_name=sampler, 
                             steps=steps, 
                             cfg_scale=cfg_scale, 
                             denoising_strength=denoising_strength, 
                             width=1024, 
                             height=1024,
                             mask_image=resultMask.images[0],
                             mask_blur=0,
                             inpainting_mask_invert=1, 
                             inpainting_fill=1, controlnet_units=[controlNet0],
                             alwayson_scripts={"args":[{"Soft inpainting": True}]})
        
        result.images[0].save("output_image.png")
        return jsonify({"message": "Image generated successfully", "result": result})
    except Exception as e:
        return jsonify({"message": "An error occurred", "error": str(e)})
    
