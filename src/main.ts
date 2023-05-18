import experiment1 from "./experiments/001-clear"
import experiment2 from "./experiments/002-triangle"
import experiment3 from "./experiments/003-cube"
import experiment4 from "./experiments/004-light"
import experiment5 from "./experiments/005-material"
import experiment6 from "./experiments/006-scene"
import experiment7 from "./experiments/007-renderer"
import experiment8 from "./experiments/008-instanced"
import experiment9 from "./experiments/009-texture"
import experiment10 from "./experiments/010-skybox"
import experiment11 from "./experiments/011-shadowmap"

const canvas = document.getElementById("mycanvas") as HTMLCanvasElement;
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;
experiment11(canvas);