precision mediump float;

uniform vec2  u_resolution;
uniform float u_time;
uniform float u_flow;
uniform float u_scroll;
uniform float u_height_content;
uniform float u_height_window;
uniform bool  u_debug;

/* Colors used for drawing the gradient */
const vec4 COLOR_TOP = vec4(4. / 255., 4. / 255., 4. / 255., 1.);
const vec4 COLOR_BOTTOM = vec4(50. / 255., 50. / 255., 50. / 255., 1.);

/* The viscosity of the liquid of the particles. A lower value means it will */
/* behave more like water. */
const float VISCOSITY = 1.0;

/* The opacity of a single particle. */
const float PARTICLE_OPACITY = 0.29;

/* Just a random magic number used the feed the pseudo random noise functions. */
const float MAGIC = 21.1238209348;

/**
 * Draw the gradient based on the total height, the viewport height and current
 * scroll position.
 */
vec4 mix_gradient(float uv_y, float scroll_y, float height_total, float height_view) {
  float mix_y = ((height_view - uv_y) + scroll_y) / height_total;
  return mix(COLOR_TOP, COLOR_BOTTOM, mix_y);
}

/**
 * Calculate a random float noise value given a position (0 to 1).
 */
float noise1(vec2 p) {
  p = fract(p * vec2(MAGIC, MAGIC * 3.7));
  p += dot(p, p + MAGIC / 7.2);
  return fract(p.x * p.y);
}

/**
 * Given a vec2, generate a vec2 of random noise values, using the computed
 * noise of the argument as the input for the returned y noise.
 */
vec2 noise2(vec2 p) {
  float n = noise1(p);
  return vec2(n, noise1(p + n));
}

/**
 * Get a random position inside the given grid cell (0 - 1) using a noise
 * function.
 */
vec2 get_particle_position(vec2 id) {
  vec2 noise = noise2(id);

  float x = sin(((u_time + 9.2) / VISCOSITY) * noise.x);
  float y = cos(((u_time + 3.7) / VISCOSITY) * noise.y);

  return vec2(x, y) * 0.4;
}

/**
 * Draws the particles.
 *
 * scale defines the number of cells per row. In every cell one particle is
 * drawn, using a random noise function with u_time as the step value.
 *
 * The columns are shifted based on the scroll flow in a pseudo random way, so
 * that a column next to another moves at a slightly different pace.
 *
 * In addition, the whole grid is moved on the x axis based on the scale, so
 * that no cell's bounds touch another one.
 */
vec3 particles(vec2 st, float scale, int index) {
  /* Scale the uv position. */
  vec2 uv = st * scale;

  /* Get the fractional value. This will result in a sawtooth wave _scale_ */
  /* times. With that the grid is defined. */
  vec2 f_uv = fract(uv);

  /* Create a pseudo random value. */
  float offset = scale / 0.6;

  /* Offset the whole grid on the x axis. */
  uv.x += offset / 9.0;

  /* Move every column of the grid at a slightly different speed, while making */
  /* sure no two columns that are next to each other have the same speed. */
  uv.y -= ((abs(sin(floor(uv.x)) + offset) + offset) * (u_flow / 1.)) / offset;
  /* uv.y -= floor(f_uv.x + u_flow * 30.); */
  /* uv.y -= abs(sin(cos(floor(uv.x)))) * (u_flow / 2.); */

  /* Calculcate the grid and cells once again as they've been shifted previously. */
  vec2 cell_id = floor(uv);
  vec2 grid_uv = fract(uv) - 0.5;

  /* Get the position of the particle. */
  vec2 particle_position = get_particle_position(cell_id);

  /* Calculate the distance of the particle to the current grid cell position. */
  float particle_distance = length(grid_uv - particle_position);

  /* The radius is based on the grid cell position, the scroll flow and current */
  /* time. That way the size is changing automatically, but is accelerated when */
  /* the user scrolls the page. */
  float radius = sin((u_time / 2.) + uv.y + uv.x + (u_flow / 4.)) / 70. + (scale / 250.);

  /* The smoothstep function makes sure to only get a value in the range passed */
  /* as the first two arguments. */
  float intensity = smoothstep(radius, radius - (radius / 3.), particle_distance);

  /* Calculate the output intensity. */
  float output_intensity = intensity * PARTICLE_OPACITY;

  /* Create the color output variable. */
  vec3 out_color = vec3(output_intensity);

  /* If debugging is enabled this will draw lines around the bounds of every */
  /* grid cell and change the color of the particle to red. */
  if (u_debug) {
    out_color = vec4(intensity).rgb;

    if (index == 0) {
      out_color.g = 0.;
      out_color.b = 0.;
      if (grid_uv.x > 0.48) {
        out_color.r = 1.;
      }
      if (grid_uv.y > 0.48) {
        out_color.r = 1.;
      }
    } else {
      out_color.r = 0.;
      out_color.g = 0.;
      if (grid_uv.x > 0.48) {
        out_color.b = 1.;
      }
      if (grid_uv.y > 0.48) {
        out_color.b = 1.;
      }
    }
  }

  return out_color;
}

/**
 * Main draw call.
 */
void main() {
  /* Draw the gradient. */
  vec4 gradient = mix_gradient(gl_FragCoord.y, u_scroll, u_height_content, u_height_window);

  /* Calculate the fragment position and transform it to a square space. */
  vec2 st = gl_FragCoord.xy / u_resolution.xy;
  st.x *= u_resolution.x / u_resolution.y;

  /* Draw the particles. */
  vec4 fluid = vec4(0.);
  fluid.rgb += particles(st, 7.3, 0);
  fluid.rgb += particles(st, 11.4, 1);

  /* Return the added gradient and particles. */
  gl_FragColor = gradient + fluid;
}
