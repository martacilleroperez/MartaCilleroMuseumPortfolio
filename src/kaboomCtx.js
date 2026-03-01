import kaboom from "kaboom";
import { scaleFactor } from "./constants";
// this is importing Kaboom library (a game engine).

export const k = kaboom({
  global: false,
  touchToMouse: true,
  canvas: document.getElementById("game"),
  debug: false, // set to false once ready for production
});

