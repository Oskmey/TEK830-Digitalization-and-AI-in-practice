export function uploadImage(image, prompt="cozy, autumn, low lighting", sampler = "Euler a", steps = 15, cfg_scale=7, denoising_strength=0.7) {
    const formData = new FormData();

    formData.append('image', image);
    formData.append('prompt', prompt);
    formData.append('sampler', sampler);
    formData.append('steps', steps);
    formData.append('cfg_scale', cfg_scale);
    formData.append('denoising_strength', denoising_strength);

    fetch('/upload', {
        method: 'POST',
        body: formData
    })
    .then(response => {
        if(!response.ok){
            throw new Error('Network response was not ok');
        }
    })
}
