export function uploadImage(image, promt="cute squirrel", sampler = "Euler a", steps = 20, cfg_scale=7) {
    const formData = new FormData();

    formData.append('image', image);
    formData.append('promt', promt);
    formData.append('sampler', sampler);
    formData.append('steps', steps);

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
