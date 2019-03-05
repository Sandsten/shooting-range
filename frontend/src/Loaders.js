export const LoadImage = (path, cb) => {
  var image = new Image();
  image.src = path;
  image.onload = () => {
    cb(image);
  }
}