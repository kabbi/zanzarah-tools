ZanzarahComponent = requireComponent "zanzarah.base"
logger = requireLogger module

utils = requireRoot "lib/utils"

module.exports = class Trigger extends ZanzarahComponent
	attach: (entity) ->
		super entity
		entity.windowEntries ?= []

		actionType = entity.ATB.DefineEnum "actionType", [
			"portal"
			"camera"
			"unknown2"
			"interactable"
			"unknown4"
			"look at"
		]

		entity.windowEntries.push
			control: "var"
			name: "triggerIdx"
			type: entity.ATB.TYPE_INT32,
			cbs:
				getter: -> entity.data.idx
			def: "group='Trigger' label='Index' help='Trigger index in scene array of triggers, cannot be changed.'"

		entity.windowEntries.push
			control: "var"
			name: "triggerType"
			type: entity.ATB.TYPE_INT32,
			cbs:
				getter: -> entity.data.type + 1
			def: "group='Trigger' label='Type' min=0 max=2 help='Trigger type number, will be enum in future.'"

		entity.windowEntries.push
			control: "var"
			name: "triggerFlag"
			type: entity.ATB.TYPE_BOOLCPP,
			cbs:
				getter: -> entity.data.someFlag
			def: "group='Trigger' label='Some flag'"

		entity.windowEntries.push
			control: "var"
			name: "triggerAction"
			type: actionType,
			cbs:
				getter: -> entity.data.ii
			def: "group='Trigger' label='Action'"

		entity.windowEntries.push
			control: "var"
			name: "triggerUnk1"
			type: entity.ATB.TYPE_UINT32,
			property: [entity.data, "ii1"]
			def: "group='Trigger' label='Unknown field 1'"

		entity.windowEntries.push
			control: "var"
			name: "triggerUnk2"
			type: entity.ATB.TYPE_UINT32,
			property: [entity.data, "ii2"]
			def: "group='Trigger' label='Unknown field 2'"

		entity.windowEntries.push
			control: "var"
			name: "triggerUnk3"
			type: entity.ATB.TYPE_UINT32,
			property: [entity.data, "ii3"]
			def: "group='Trigger' label='Unknown field 3'"

		entity.windowEntries.push
			control: "var"
			name: "triggerUnk4"
			type: entity.ATB.TYPE_UINT32,
			property: [entity.data, "ii4"]
			def: "group='Trigger' label='Unknown field 4'"

		if entity.data.ii is 0
			entity.windowEntries.push
				control: "button"
				name: "gotoButton"
				def: "group='Trigger' label='[Open scene]'"
				cb: ->
					paddedSceneName = ("0000" + entity.data.ii3).substr -4, 4
					entity.loader.loadScene "#{utils.resourcesPath}Worlds/sc_#{paddedSceneName}.scn"
					console.log "#{utils.resourcesPath}Worlds/sc_#{paddedSceneName}.scn"

		switch entity.data.type
			when 0
				entity.windowEntries.push
					control: "button"
					name: "comment1"
					def: "group='Trigger type 1' label='We know nothing about this trigger type, sorry' help='Not info for now.'"
			when 1
				entity.windowEntries.push
					control: "var"
					name: "radius"
					type: entity.ATB.TYPE_FLOAT,
					cbs:
						setter: (x) ->
							entity.data.int = x
							entity.object.scale.set x, x, x
						getter: -> entity.data.int
					def: "group='Trigger type 2' label='Radius' min=0.0001 step=0.1 precision=3 help='Trigger radius in game.'"
			when 2
				entity.windowEntries.push
					control: "button"
					name: "comment3"
					def: "group='Trigger type 3' label='We know nothing about this trigger type, sorry' help='Not info for now.'"
