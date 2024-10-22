export function uploadImage(image, promptList, sampler = "Euler a", steps = 20, cfg_scale=7.0, denoising_strength = 0.7) {
    const formData = new FormData();
    const promptListAdj = new Array();
    const resultPrompt = [];
    formData.append('image', image);
    
    for (let category of promptList) {
        for (let [key, value] of Object.entries(category)) {
            if (value) {
                promptListAdj.push(key);
            }
        }
    }
    

    promptListAdj.forEach(element => {
        switch (element) {
          case "spring":
            resultPrompt.push("fresh, good lighting, clean");
            break;

            case "fall":
            resultPrompt.push("product image, cozy, autumn, low lighting, brown hue, warm, soft, dim, golden, rustic, peaceful, inviting, intimate, quiet, serene, earthy, amber, glowing, tranquil, comforting, gentle, nostalgic.");
            break;
          // Add other cases if necessary
          default:
            break; // No action for other elements
        }
      });
    
    formData.append('prompt', resultPrompt);
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
