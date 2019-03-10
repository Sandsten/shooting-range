import gunSound from '../Sound/gun.mp3'

const gunShot = new Audio(gunSound);
gunShot.volume = 0.5;
gunShot.loop = false;

export const playGunSound = () => {
  gunShot.play();
}

export const setSoundEffectsVolume = value => {
  gunShot.volume = value;
}