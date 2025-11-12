import * as THREE from "three"
import gsap from "gsap"
import Utility from "./utility"
import {stage} from "./stage"
import {model} from "./model"
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js'

class WebGL{

    constructor(){
        this.lenis = null

        this.scroll = 0
        this.mouse = {
            x:0,
            y:0
        }
        this.prevMouse = { x: 0, y: 0 };
        this.velocity = 0;
        this.maxVelocity = 10.0
        this.friction = 0.9
        this.mouseEase = {
            x:0,
            y:0
        }
        this.mouseDiff = {
            x:0,
            y:0
        }
        this.clock = null
        this.time = 0
    }


    init(){
        this.lenis = window.App.components.get('lenis').lenis
        this.loadingManager = new THREE.LoadingManager()
        const dracoLoader = new DRACOLoader(this.loadingManager)
        dracoLoader.setDecoderPath('/draco/')
        const gltfLoader = new GLTFLoader(this.loadingManager)
        gltfLoader.setDRACOLoader(dracoLoader)


        gltfLoader.load(
            '/common/glb/about/logo.glb',
            (gltf)=>{
                model.gltf = gltf
                console.log(model.gltf)
            }
        )
        
        this.clock = new THREE.Clock()
        stage.init()

        this.loadingManager.onLoad = () => {
            model.init()
            this.raf()
            this.mousemove = this.mousemove.bind(this)
            window.addEventListener("mousemove",this.mousemove)
            window.addEventListener("resize",this.resize.bind(this))
        }
    }


    mousemove(e){

        const newMouse = {
            x: e.clientX / window.innerWidth * 2 - 1,
            y: - (e.clientY / window.innerHeight) * 2 + 1
        }
        const deltaX = newMouse.x - this.prevMouse.x
        const deltaY = newMouse.y - this.prevMouse.y

        const rawSpeed = Math.sqrt(deltaX * deltaX + deltaY * deltaY) * 100
        const smoothedSpeed = THREE.MathUtils.lerp(this.velocity, rawSpeed, 0.01)

        this.velocity = THREE.MathUtils.lerp(this.velocity, THREE.MathUtils.clamp(smoothedSpeed, 0, this.maxVelocity), 0.01)

        this.prevMouse = newMouse

        this.mouse.x = e.clientX / window.innerWidth * 2 - 1
        this.mouse.y = - (e.clientY / window.innerHeight) * 2 + 1
    }

    render(){
        console.log('render',this.scroll)
        this.scroll = this.lenis.scroll

        this.mouseEase.x = Utility.lerp( this.mouseEase.x, this.mouse.x, 0.025 )
        this.mouseEase.y = Utility.lerp( this.mouseEase.y, this.mouse.y, 0.025 )
        this.mouseDiff.x = Utility.lerp( this.mouseDiff.x, this.mouse.x - this.mouseEase.x, 0.1 )
        this.mouseDiff.y = Utility.lerp( this.mouseDiff.y, this.mouse.y - this.mouseEase.y, 0.1 )
        this.velocity *= this.friction
        const elapsedTime = this.clock.getElapsedTime()
        this.time = elapsedTime
        stage.render()
        model.render()
    }

    raf(){
        this.render()
        requestAnimationFrame(this.raf.bind(this))
    }


    resize(){
        stage.resize()
        model.resize()
    }
}

export const webgl = new WebGL()