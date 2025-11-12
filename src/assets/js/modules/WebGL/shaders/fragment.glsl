varying vec3 vPosition;
uniform float uScroll;


void main(){
    vec3 color1 = vec3(0.157, 0.157, 0.157); // #282828
    vec3 color2 = vec3(0.047, 0.0, 0.573);    // #0C0092
    vec3 color3 = vec3(0.506, 0.0, 0.635);    // #8100A2
    vec3 color4 = vec3(1.0, 0.302, 0.302);    // #FF4D4D
    vec3 color5 = vec3(0.980, 0.561, 0.086);  // #FA8F16
    vec3 color6 = vec3(1.0, 0.918, 0.0);      // #FFEA00
    vec3 color7 = vec3(1.0, 1.0, 1.0);        // #FFFFFF

    // uScrollを0-6の範囲にスケール（6段階の変化）
    float scaledScroll = clamp(uScroll * 6.0, 0.0, 6.0);
    int colorIndex = int(floor(scaledScroll));
    float mixFactor = fract(scaledScroll);

    vec3 currentColor = color1;
    vec3 nextColor = color2;

    // 現在の色と次の色を決定
    if (colorIndex == 0) {
        currentColor = color1;
        nextColor = color2;
    } else if (colorIndex == 1) {
        currentColor = color2;
        nextColor = color3;
    } else if (colorIndex == 2) {
        currentColor = color3;
        nextColor = color4;
    } else if (colorIndex == 3) {
        currentColor = color4;
        nextColor = color5;
    } else if (colorIndex == 4) {
        currentColor = color5;
        nextColor = color6;
    } else if (colorIndex == 5) {
        currentColor = color6;
        nextColor = color7;
    } else {
        currentColor = color7;
        nextColor = color7;
    }

    // 2つの色を滑らかに補間
    vec3 finalColor = mix(currentColor, nextColor, mixFactor);

    gl_FragColor = vec4(finalColor, 1.0);
}