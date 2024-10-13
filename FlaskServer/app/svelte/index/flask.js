function uploadImage(image) {
    const formData = new FormData();


    formData.append('image', image);

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