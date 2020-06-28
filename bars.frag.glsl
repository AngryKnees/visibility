uniform float u_time;
uniform vec2 u_resolution;
uniform float u_column_size;
uniform float u_stroke_size;


const float PI = 3.14159;
const float SPEED_MULTIPLIER = 20.0;


void main() {
    // Is the current fragment in the stroke part of the column?
    bool isPartOfStroke = mod(gl_FragCoord.x + u_time * SPEED_MULTIPLIER, u_column_size) < u_stroke_size;

    // If it is part of the stroke, give it black, else white
    vec3 color = isPartOfStroke ? vec3(0) : vec3(1);

    gl_FragColor = vec4(color, 1.0);
}