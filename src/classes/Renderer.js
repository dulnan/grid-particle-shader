/* eslint-disable no-console */
import * as twgl from 'twgl.js'
import Lerp from './Lerp'

import vsQuad from './../shader/quad.vert'
import fsMain from './../shader/main.frag'

export default class Renderer {
  constructor(canvas, debug) {
    this.canvas = null
    this.gl = null

    this.progGradient = null
    this.bufferInfo = null
    this.arrays = {
      position: [-1, -1, 0, 1, -1, 0, -1, 1, 0, -1, 1, 0, 1, -1, 0, 1, 1, 0]
    }

    this.rafToken = null

    this.contentHeight = new Lerp(0.05, document.documentElement.offsetHeight)
    this.scrollY = new Lerp(0.1, 0)
    this.flow = new Lerp(0.13, 10)

    this.lastScrollY = window.scrollY

    this.uniformElements = {}
    this.debugEnabled = false

    this.setCanvas(canvas)
    this.init(debug)
  }

  init(debug) {
    try {
      this.progGradient = twgl.createProgramInfo(this.gl, [vsQuad, fsMain])
      this.bufferInfo = twgl.createBufferInfoFromArrays(this.gl, this.arrays)

      const uniforms = this.getUniforms(0)

      Object.keys(uniforms).forEach(key => {
        const container = document.createElement('div')

        const label = document.createElement('div')
        label.innerText = key
        label.classList.add('label')

        const value = document.createElement('div')
        value.classList.add('value')

        this.uniformElements[key] = value

        container.appendChild(label)
        container.appendChild(value)

        debug.appendChild(container)
      })
    } catch (e) {
      console.log(e)
    }
  }

  setCanvas(canvas) {
    this.canvas = canvas

    this.gl = canvas.getContext('webgl')
  }

  start() {
    this.render()
  }

  stop() {
    window.cancelAnimationFrame(this.rafToken)
  }

  setDebug(isEnabled) {
    this.debugEnabled = isEnabled
  }

  getUniforms(time) {
    const contentHeight = this.contentHeight.getValue()

    return {
      u_time: time / 1000,
      u_flow: this.flow.getValue(),
      u_scroll: this.scrollY.getValue(),
      u_height_content: contentHeight,
      u_height_window: window.innerHeight,
      u_resolution: [window.innerWidth, window.innerHeight],
      u_debug: this.debugEnabled
    }
  }

  render(time) {
    twgl.resizeCanvasToDisplaySize(this.canvas)
    this.gl.viewport(0, 0, window.innerWidth, window.innerHeight)

    this.contentHeight.setTarget(document.documentElement.offsetHeight)
    this.contentHeight.step()

    this.scrollY.setTarget(window.scrollY)
    this.scrollY.step()

    let delta = (window.scrollY - this.lastScrollY) / 300
    delta = Math.min(Math.max(delta, -0.5), 0.5)

    this.flow.move(delta)
    this.flow.step()
    this.lastScrollY = window.scrollY

    const uniforms = this.getUniforms(time)

    Object.keys(uniforms).forEach(key => {
      let value = uniforms[key]

      if (typeof value === 'number') {
        value = value.toFixed(4)
      } else if (Array.isArray(value)) {
        value = value.map(v => v.toFixed(4)).join(', ')
      }
      this.uniformElements[key].innerText = value
    })

    this.gl.useProgram(this.progGradient.program)
    twgl.setBuffersAndAttributes(this.gl, this.progGradient, this.bufferInfo)
    twgl.setUniforms(this.progGradient, uniforms)
    twgl.drawBufferInfo(this.gl, this.bufferInfo)

    this.rafToken = window.requestAnimationFrame(this.render.bind(this))
  }
}
