import * as THREE from "three"
import gsap from "gsap"
import {webgl} from "./index"
import {model} from "./model"
class Stage {
    constructor(){
        this.scene = null
        this.camera = null
        this.renderer = null

        this.domElement = null
        this.domElementWidth = 0
        this.domElementHeight = 0
    }
    init(){
        console.log('init')
        this.domElement = document.querySelector('.webgl-canvas');
        this.domElementWidth = this.domElement.clientWidth;
        this.domElementHeight = this.domElement.clientHeight;
        this._setCanvasSize()
        this._setScene()
        this._setRenderer()
    }

    
    _setCanvasSize(){
        this.domElementWidth = this.domElement.clientWidth;
        this.domElementHeight = this.domElement.clientHeight;
    }

    _setScene(){
        this.scene = new THREE.Scene()
    }

    _setRenderer(){
        this.renderer = new THREE.WebGLRenderer({antialias:true,alpha:false})
        this.renderer.setClearColor(0x1A1A1A)
        // this.renderer.setClearColor(0xffffff)
        this.renderer.setSize(this.domElementWidth,this.domElementHeight)
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
        this.renderer.outputEncoding = THREE.sRGBEncoding
        this.renderer.toneMapping = THREE.ReinhardToneMapping
        this.domElement.appendChild(this.renderer.domElement)
    }

    _setCamera(){
        this.camera = model.cameraObject.children[0]

        this.camera.fov = this.domElementWidth >= 960 ? 20 * (1440 / this.domElementWidth) : 20
        
        this.camera.aspect = this.domElementWidth / this.domElementHeight
        this.camera.updateProjectionMatrix()
    }


    render() {
        if(this.camera){
            this.renderer.render(this.scene, this.camera)
        }
    }

    resize(){
        this._setCanvasSize()
        if(this.camera){
            this.camera.fov = this.domElementWidth >= 960 ? 20 * (1440 / this.domElementWidth) : 20
            this.camera.aspect = this.domElementWidth / this.domElementHeight
            this.camera.updateProjectionMatrix()
        }


        this.renderer.setSize(this.domElementWidth, this.domElementHeight)
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))

    }

}

export const stage = new Stage()