from diffusers import DiffusionPipeline
import os



def main():
    save_dir = "Output" 
    model_dir = "Models"
    
    os.makedirs(save_dir, exist_ok=True)
    os.makedirs(model_dir, exist_ok=True)


    model_path = os.path.join(model_dir, "runwayml/stable-diffusion-v1-5")
    if not os.path.exists(model_path):
        pipeline = DiffusionPipeline.from_pretrained("runwayml/stable-diffusion-v1-5", cache_dir=model_dir)
    else:
        pipeline = DiffusionPipeline.from_pretrained(model_path)
    
    
    image = pipeline("An image of a squirrel in Picasso style").images[0]
    
    image.save(image_save_path)





if __name__ == "__main__":
    main()