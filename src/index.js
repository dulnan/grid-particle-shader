import hljs from 'highlight.js/lib/highlight'
import glsl from 'highlight.js/lib/languages/glsl'
hljs.registerLanguage('glsl', glsl)

import 'highlight.js/styles/gruvbox-dark.css'

import 'reset-css'
import './style.scss'

import fsMain from './shader/main.frag'

console.log(fsMain)

import Renderer from './classes/Renderer'

document.addEventListener('DOMContentLoaded', event => {
  const code = document.getElementById('code')

  const source = fsMain.replace('#define GLSLIFY 1', '')
  code.innerText = source
  hljs.highlightBlock(code)

  const debug = document.getElementById('debug')

  const canvas = document.getElementById('canvas')
  const renderer = new Renderer(canvas, debug)
  renderer.start()

  const checkDebug = document.getElementById('checkbox-debug')

  checkDebug.addEventListener('click', function(e) {
    renderer.setDebug(this.checked)
  })
})
