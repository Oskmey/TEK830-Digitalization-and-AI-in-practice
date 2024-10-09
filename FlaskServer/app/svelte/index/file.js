export function fileDrop(event, updateImage) {

    const files = event.target.files;
    
    try{
      if(files.length > 1){
        throw new Error("Upload only one file");
      }
      if(!files[0].type.startsWith('image/')){
        throw new Error("Upload only image files");
      }
      const reader = new FileReader();
      reader.onload = () => {
        var dataURL = reader.result;
        updateImage(dataURL);
      };
      reader.readAsDataURL(files[0]);
    }
    catch(err){
      console.error(err);
    }
  }