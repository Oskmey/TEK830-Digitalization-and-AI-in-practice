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
  
      console.log(data); // Log the response to inspect its structure

    // Accessing the image
    if (data.result && data.result.image) {
    // Assuming it's a base64 string, you can directly set it to an image element
    let imageSrc = `data:image/png;base64,${data.result.image}`;
    return imageSrc;
    } else {
    throw new Error('No image returned from the server');
}
}
