export function uploadImage(image, promptList, sampler = "Euler a", steps = 20, cfg_scale=7.0, denoising_strength = 0.6) {
    const formData = new FormData();
    const promptListAdj = new Array();
    formData.append('image', image);
    
    for (let category of promptList) {
        for (let [key, value] of Object.entries(category)) {
            if (value) {
                promptListAdj.push(key);
            }
        }
    }
    
    console.log(promptListAdj)
    formData.append('prompt', promptListAdj);
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
