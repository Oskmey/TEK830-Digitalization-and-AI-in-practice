from datetime import datetime
import urllib.request
import base64
import json
import time
import os

## code taken from: 
# https://gist.github.com/w-e-w/0f37c04c18e14e4ee1482df5c4eb9f53

## add your local server url here:
webui_server_url = 'http://127.0.0.1:7860'

out_dir = 'api_out'
os.makedirs(out_dir, exist_ok=True)

def timestamp():
    return datetime.fromtimestamp(time.time()).strftime("%Y%m%d-%H%M%S")


def encode_file_to_base64(path):
    with open(path, 'rb') as file:
        return base64.b64encode(file.read()).decode('utf-8')


def decode_and_save_base64(base64_str, save_path):
    with open(save_path, "wb") as file:
        file.write(base64.b64decode(base64_str))


def call_api(api_endpoint, **payload):
    data = json.dumps(payload).encode('utf-8')
    request = urllib.request.Request(
        f'{webui_server_url}/{api_endpoint}',
        headers={'Content-Type': 'application/json'},
        data=data,
    )
    response = urllib.request.urlopen(request)
    return json.loads(response.read().decode('utf-8'))


def call_img2img_api(**payload):
    response = call_api('sdapi/v1/img2img', **payload)
    for index, image in enumerate(response.get('images')):
        save_path = os.path.join(out_dir, f'img2img-{timestamp()}-{index}.png')
        decode_and_save_base64(image, save_path)
    