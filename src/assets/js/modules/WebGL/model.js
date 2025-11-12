import * as THREE from "three"
import gsap from "gsap"
import {webgl} from "./index"
import {stage} from "./stage"
import vertexShader from "./shaders/vertex.glsl"
import fragmentShader from "./shaders/fragment.glsl"
class Model{
    constructor(){
        this.gltf = null
        this.logo = {
            scene:null,
            obj:null
        }
        this.cameraObject = null
        
        this.mesh = null
        this.material = null
        this.geometry = null
        
        // スクロール制御用
        this.prevScroll = 0
        this.scrollVelocity = 0
        this.scrollProgress = 0
    }
    init(){
        stage.scene.add(this.gltf.scene)
        this.logo.scene = this.gltf.scene.getObjectByName("Logo")

        this.mesh = this.logo.scene.children[0]
        this.cameraObject = this.gltf.scene.getObjectByName("CameraData")
        // 回転の順序を設定（YXZ: まずY軸、次にX軸）
        this.mesh.rotation.order = 'YXZ'
        stage._setCamera()
        this.setMaterial()
    }

    setMaterial(){
        this.material = new THREE.ShaderMaterial({
            vertexShader:vertexShader,
            fragmentShader:fragmentShader,
            uniforms:{
                uTime:new THREE.Uniform(0),
                uScroll:new THREE.Uniform(0),
            }
        })
        this.mesh.material = this.material
    }

    scroll(){

    }

    render(){
        //常時yとz軸回転
        // this.mesh.rotation.y = Math.sin(webgl.time * 0.5) * 0.1
        this.mesh.rotation.z = Math.sin(webgl.time * 0.25) * 0.1
        this.mesh.rotation.y = webgl.time * 1
        // スクロール値に応じてX軸回転
        this.mesh.rotation.x = webgl.scroll * 0.008

        
        // スクロール速度を計算
        const scrollDelta = Math.abs(webgl.scroll - this.prevScroll)
        this.scrollVelocity = scrollDelta
        this.prevScroll = webgl.scroll
        
        // スクロール中は値を増やす（速度に応じて）
        // 速度が高いほど早く1に近づく。調整係数は0.01（変更可能）
        const velocityInfluence = Math.min(this.scrollVelocity * 0.01, 1)
        this.scrollProgress += velocityInfluence * 0.3
        
        // スクロールが止まったら徐々に0に戻る
        this.scrollProgress *= 0.95
        
        // 0-1の範囲にクランプ
        this.scrollProgress = Math.max(0, Math.min(1, this.scrollProgress))

        this.material.uniforms.uScroll.value = this.scrollProgress
    }

    resize(){

    }
}

export const model = new Model()