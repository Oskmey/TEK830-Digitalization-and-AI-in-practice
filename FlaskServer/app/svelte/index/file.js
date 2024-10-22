
export function fileDrop(event, updateImage) {
  const files = event.target.files;

  try {
      const file = files[0]; 
      updateImage(file);

      const reader = new FileReader();
      reader.onload = () => {
          var dataURL = reader.result;
          updateImage(dataURL, file);
      };
      reader.readAsDataURL(file);
  } catch (err) {
      console.error(err);
  }
}
