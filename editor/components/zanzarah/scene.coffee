ZanzarahComponent = requireComponent "zanzarah.base"
logger = requireLogger module

module.exports = class Scene extends ZanzarahComponent
	attach: (entity) ->
		super entity
		entity.windowEntries ?= []

		entity.windowEntries.push
			control: "var"
			name: "scenePath"
			type: entity.ATB.TYPE_CDSTRING
			cbs:
				getter: ->
					entity.loader.loadedScene
				setter: (str) ->
					entity.loader.loadedScene = str
			def: "group='Scene' label='Scene path'"

		entity.windowEntries.push
			control: "var"
			name: "sceneName"
			type: entity.ATB.TYPE_CDSTRING
			cbs:
				getter: ->
					entity.data.Misc.sceneFile
				setter: (str) ->
					entity.data.Misc.sceneFile = str
			def: "group='Scene' label='Scene name'"

		entity.windowEntries.push
			control: "button"
			name: "saveScene"
			cb: ->
				entity.loader.saveScene()
			def: "group='Scene' label='[Save scene]'"

		entity.windowEntries.push
			control: "button"
			name: "reloadScene"
			cb: ->
				entity.loader.reloadScene()
			def: "group='Scene' label='[Reload scene]'"

		entity.visibility =
			light: true
			trigger: true
			model: true
			fomodel: true
			dymodel: true
			world: true
			backdrop: true

		generalGetterSetterPair = (param) ->
			getter: ->
				entity.visibility[param]
			setter: (x) ->
				entity.visibility[param] = x
				entity.setVisibility param, x

		for param of entity.visibility
			entity.windowEntries.push
				control: "var"
				name: "display#{param.toTitleCase()}"
				type: entity.ATB.TYPE_BOOLCPP,
				cbs: generalGetterSetterPair param
				def: "group='Display params' label='Display #{param}s' help='Display scene #{param}s.'"

	setVisibility: (param, flag) ->
		for id, entity of @client.entities when entity.type is param
			entity.object.visible = flag