import os
import torch
from diffusers import AutoPipelineForText2Image

class ImageGenerator:
    def __init__(self, save_dir="Output", model_dir="Models", model_name="black-forest-labs/FLUX.1-schnell"):
        self.save_dir = save_dir
        self.model_dir = model_dir
        self.model_name = model_name
        self.image_folder = os.path.join(self.save_dir, "images")
        self.model_path = os.path.join(self.model_dir, self.model_name)
        
        self._setup_directories()
        self.pipeline = self._load_model()

    def _setup_directories(self):
        os.makedirs(self.save_dir, exist_ok=True)
        os.makedirs(self.model_dir, exist_ok=True)
        os.makedirs(self.image_folder, exist_ok=True)

    def _load_model(self):
        if not os.path.exists(self.model_path):
            return AutoPipelineForText2Image.from_pretrained(self.model_name, cache_dir=self.model_dir, torch_dtype=torch.bfloat16)
        else:
            return AutoPipelineForText2Image.from_pretrained(self.model_path, torch_dtype=torch.bfloat16)

    def generate_image_name(self):
        name = 1
        while True:
            image_name = f"generated_image_{name}.png"
            path = os.path.join(self.image_folder, image_name)
            if not os.path.exists(path):
                return image_name
            name += 1

    def generate_image(self, prompt, image_name="generated_image.png", num_inference_steps=20, guidance_scale=0.0):
        if torch.cuda.is_available():
            self.pipeline.to("cuda")
            print("CUDA")

        image = self.pipeline(prompt, num_inference_steps=num_inference_steps, guidance_scale=guidance_scale).images[0]
        image_save_path = os.path.join(self.image_folder, image_name)
        image.save(image_save_path)
        print(f"Image saved to {image_save_path}")

def main():
    generator = ImageGenerator()
    generator.generate_image("Ikea, ikea kitchen, american kitchen", "image_of_squirrel_painting.png")

if __name__ == "__main__":
    main()