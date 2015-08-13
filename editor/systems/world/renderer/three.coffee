System = requireSystem "base"
logger = requireLogger module

module.exports = class ThreeRenderer extends System
	constructor: (client) ->
		super client

		logger.info "Starting three.js"
		@THREE = require "node.three.js"

		@windowSize =
			width: 800
			height: 600
		@renderer = new @THREE.WebGLRenderer @windowSize

		@prevTime = 0
		@boundOnAnimationFrame = @onAnimationFrame.bind @
		@boundOnAnimationFrame()

		@scene = null
		@camera = null

	destroy: ->
		logger.error "TODO: destroy THREE instance here"

	prepare: (entity) ->
		entity.THREE = @THREE
		entity.renderer = @renderer
		entity.windowSize = @windowSize
		Object.defineProperties entity,
			camera:
				get: => @camera
				set: (camera) => @camera = camera
			scene:
				get: => @scene
				set: (scene) => @scene = scene

	onAnimationFrame: (currentTime) ->
		@client.emit "render:before"

		@client.emit "render"
		if @scene and @camera
			@renderer.render @scene, @camera

		currentTime ?= 0
		delta = currentTime - @prevTime
		@prevTime = currentTime

		@client.emit "render:after", delta / 10
		@THREE.requestAnimationFrame @boundOnAnimationFrame, 32