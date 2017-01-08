System = requireSystem "base"
logger = requireLogger module
path = require "path"
fs = require "fs"

utils = requireRoot "lib/utils"

module.exports = class BaseUI extends System
	constructor: (client) ->
		super client

		@renderer = client.getSystem "world.renderer.three"

		@selectables = []
		@selectedEntity = null
		@mousePos = x: 0, y: 0
		@raycaster = new @renderer.THREE.Raycaster()
		@ATB = @renderer.THREE.document.AntTweakBar
		@ATB.Init()
		@ATB.Define """
					GLOBAL help='
					Zanzarah scene file editor

					Contains lots of cool features. Try pressing some buttons and moving the mouse.'
					"""
		@ATB.WindowSize @renderer.windowSize.width,
			@renderer.windowSize.height

		@renderer.THREE.document.on "mousemove", (event) =>
			@mousePos.x = (event.pageX / @renderer.windowSize.width) * 2 - 1
			@mousePos.y = - (event.pageY / @renderer.windowSize.height) * 2 + 1
			@wasNoMovement = false
		@renderer.THREE.document.on "mousedown", (event) =>
			@wasNoMovement = true
		@renderer.THREE.document.on "mouseup", (event) =>
			return unless @wasNoMovement

			loader = client.getSystem("world.loaders.scene") || client.getSystem("world.loaders.model")

			# return if @selectedEntity and @selectedEntity.selectable
			@selectedEntity?.click? event
			if @selectedEntity?.editable and event.button is 0
				loader.sceneEntity.transformControls.attach @selectedEntity.object
			else if not @selectedEntity
				loader.sceneEntity.transformControls.detach()

		@renderer.THREE.document.on "keydown", (event) =>
			loader = client.getSystem("world.loaders.scene") || client.getSystem("world.loaders.model")
			controls = loader.sceneEntity.transformControls
			switch event.keyCode
				when 'Q'.charCodeAt 0
					controls.setSpace if controls.space is "local" then "world" else "local"
				when 'W'.charCodeAt 0
					controls.setMode "translate"
				when 'E'.charCodeAt 0
					controls.setMode "rotate"
				when 'R'.charCodeAt 0
					controls.setMode "scale"

		client.on "render:before", @onRender.bind @
		client.on "render:after", @onPostRender.bind @

	destroy: ->
		logger.error "TODO: destroy UI system"

	prepare: (entity) ->
		entity.ATB = @ATB

	attach: (entity) ->
		if entity.hasComponent "ui.selectable"
			@selectables.push entity

	detach: (entity) ->
		idx = @selectables.indexOf entity
		@selectables.splice idx unless idx is -1

	onRender: ->
		@raycaster.setFromCamera @mousePos, @renderer.camera
		intersects = @raycaster.intersectObjects @renderer.scene.children, true
		if intersects.length
			selectable = null
			for intersect in intersects when intersect.object.userData.id?
				# logger.info "selected #{intersect.object.type}"
				selectable = intersect.object.userData
				break
			@select selectable
		else
			@select null

	onPostRender: ->
		@ATB.Draw()

	select: (entity) ->
		return if entity is @selectedEntity
		@selectedEntity.setSelected? false if @selectedEntity
		@selectedEntity = entity
		@selectedEntity.setSelected? true if @selectedEntity