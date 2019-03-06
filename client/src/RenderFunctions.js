export const renderCrosshairs = (state) => {
  const { players, crosshairIMG, canvasContext, myID } = state;
  const { width, height } = crosshairIMG;

  players.map((player, i) => {
    if (!player.position) return null;
    var { x, y } = player.position;
    // Show local position of your own cursor
    if (player.id === myID) {
      x = state.myCursorPos.x;
      y = state.myCursorPos.y;
    }
    canvasContext.drawImage(crosshairIMG, x - width / 2, y - height / 2);
  })
}

export const renderBulletHoles = (state) => {
  const { bulletHoles, canvasContext, bulletHoleIMG } = state;
  const { width, height } = bulletHoleIMG;

  bulletHoles.map((bulletHole, i) => {
    const { x, y } = bulletHole.position;
    canvasContext.drawImage(bulletHoleIMG, x - width / 2, y - height / 2);
  })
}

export const renderTarget = (state) => {
  const { canvasContext, target } = state;

  if (target && canvasContext) {
    const { position, radius } = target;
    // Draw a filled red circle at target location
    canvasContext.fillStyle = '#FF0000';
    canvasContext.beginPath();
    canvasContext.arc(position.x, position.y, radius, 0, 2 * Math.PI);
    canvasContext.stroke();
    canvasContext.fill();
  }
}