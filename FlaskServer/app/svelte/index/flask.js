export function uploadImage(image, promt="cute squirrel", sampler = "Euler a", steps = 20, cfg_scale=7.0, denoising_strength = 0.6) {
    const formData = new FormData();

    formData.append('image', image);
    formData.append('promt', promt);
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
