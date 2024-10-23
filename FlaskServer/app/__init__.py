from flask import Flask, request, jsonify
from flask_svelte import render_template
from webuiapi import webuiapi, RemBGInterface, ControlNetUnit
from PIL import Image


app = Flask(__name__)


api = webuiapi.WebUIApi()
rembgInt = RemBGInterface(api)

@app.route("/")
def index():
    return render_template("index.html", name="Flask Svelte")

@app.route("/upload", methods=["POST"])
def generate_image():
    try:
        uploaded_image = Image.open(request.files['image'])
        prompt = request.form.get('prompt')
        sampler = request.form.get('sampler')
        steps = int(request.form.get('steps'))
        cfg_scale = float(request.form.get('cfg_scale'))
        denoising_strength = request.form.get('denoising_strength')
        width = int(request.form.get('width'))
        height = int(request.form.get('height'))

        controlNet0 = ControlNetUnit(
            image=uploaded_image,
            resize_mode="Crop and Resize",
            weight=0.3,
            processor_res=1024,
            model="diffusers_xl_depth_mid [39c49e13]",
            module="depth_midas",
            control_mode=0
        )

        resultMask = rembgInt.rembg(input_image=uploaded_image, return_mask=True)

        result = api.img2img(
            images=[uploaded_image],
            prompt=prompt,
            sampler_name=sampler,
            steps=steps,
            cfg_scale=cfg_scale,
            denoising_strength=denoising_strength,
            width=width,
            height=height,
            mask_image=resultMask.images[0],
            mask_blur=0,
            inpainting_mask_invert=1,
            inpainting_fill=1,
            controlnet_units=[controlNet0],
            alwayson_scripts={
                    "soft inpainting": {
                        "args": [
                            {
                                "Soft inpainting": True,
                                "Schedule bias": 1,
                                "Preservation strength": 0.5,
                                "Transition contrast boost": 4,
                                "Mask influence": 0,
                                "Difference threshold": 0.5,
                                "Difference contrast": 2,
                            },
                        ]
                    }
                })
        
        return jsonify({"message": "Image generated successfully", "result": result})

    except Exception as e:
        return jsonify({"message": "An error occurred", "error": str(e)})

if __name__ == "__main__":
    app.run(debug=True)
