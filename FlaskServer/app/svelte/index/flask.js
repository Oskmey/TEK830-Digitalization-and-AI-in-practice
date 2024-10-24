export async function uploadImage(image, promptList, steps=20, cfg_scale=7.0, denoising_strength=0.7, width=1024, height=1024, negativePromtList, sampler = "Euler a") {
    const formData = new FormData();
    formData.append('image', image);
    formData.append('prompt', promptList);
    formData.append('negativePrompt', negativePromtList);
    formData.append('sampler', sampler);
    formData.append('steps', steps);
    formData.append('cfg_scale', cfg_scale);
    formData.append('denoising_strength', denoising_strength);
    formData.append('width', width);
    formData.append('height', height);
   

    let response = await fetch('/upload', {
        method: 'POST',
        body: formData
    })

    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
  
      let data = await response.json();
  
      if (data.image) {
        return data.image;
      } else {
        throw new Error('No image returned from the server');
      }
}
