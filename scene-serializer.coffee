Concentrate = require "concentrate"
JSONStream = require "JSONStream"
fs = require "fs"

con = require "./constants"

log = (msg) ->
	process.stderr.write "#{msg}\n"

class SceneSerializer extends Concentrate
	constructor: ->
		Concentrate.call @

	fcolor: (color) ->
		color = +color
		# Extract compoments
		[a, r, g, b] = [(color >> 24) & 0xFF, (color >> 16) & 0xFF, (color >> 8) & 0xFF, color & 0xFF]
		# Convert each component to float
		[a, r, g, b] = [a / 255, r / 255, g / 255, b / 255]
		# And write them down as floats
		@floatle r
		.floatle g
		.floatle b
		.floatle a

	icolor: (color) ->
		color = +color
		# Extract compoments
		[a, r, g, b] = [(color >> 24) & 0xFF, (color >> 16) & 0xFF, (color >> 8) & 0xFF, color & 0xFF]
		# And write them down as floats
		@uint8 r
		.uint8 g
		.uint8 b
		.uint8 a

	vector: (v) ->
		@floatle v.x
		.floatle v.y
		.floatle v.z

	zstring: (str) ->
		@uint32le str.length
		.string str

	section: (name) ->
		@zstring "[#{name}]"

	version: (v) ->
		@section "Version"
		.zstring v.author
		.uint32le v.v1
		.uint32le v.v2
		.uint32le v.v3
		.uint32le v.buildVersion
		.zstring v.date
		.zstring v.time
		.uint32le v.year
		.uint32le v.vv2

	misc: (m) ->
		@section "Misc"
		.zstring m.sceneFile
		.zstring m.scenePath
		.zstring m.texturePath
		.fcolor m.someColor
		.vector m.v1
		.vector m.v2
		.uint8 m.b1
		.uint8 m.b2
		.uint8 m.b3
		.uint8 m.b4
		.uint8 m.someFlag
		return unless m.someFlag
		@uint8 m.bb1
		.uint8 m.bb2
		.uint8 m.bb3
		.uint8 m.bb4
		.floatle m.someFloat
		.floatle m.f1
		.floatle m.f2

	lights: (lights) ->
		@section "Lights"
		.uint32le lights.count
		for l in lights.lights
			@uint32le l.idx
			.uint32le con.lightTypeInverse[l.type]
			.fcolor l.color
			.uint32le l.param
			switch l.type
				when "lUNKNOWN1"
					@vector l.v1
					.vector l.v2
				when "lUNKNOWN128"
					@floatle l.arg
					.vector l.v
				when "lUNKNOWN129"
					@uint32le l.someAnotherInt
					.vector l.v1
					.vector l.v2
		return @

	foModelsV4: (models) ->
		return @ unless models
		@section "FOModels_v4"
		.uint32le models.count
		for m in models.models
			@uint32le m.idx
			.zstring m.fileName
			.vector m.v1
			.vector m.v2
			.floatle m.f1
			.floatle m.f2
			.floatle m.f3
			.floatle m.f4
			.floatle m.f5
			.icolor m.someColor
			.uint8 m.ff1
			.uint8 m.ff2
			.uint32le m.i6
			.uint8 m.ff3
			.int32le m.i7
		return @

	modelsV3: (models) ->
		return @ unless models
		@section "Models_v3"
		.uint32le models.count
		for m in models.models
			@uint32le m.idx
			.zstring m.fileName
			.vector m.position
			.vector m.rotation
			.floatle m.scaleX
			.floatle m.scaleY
			.floatle m.scaleZ
			.icolor m.someColor
			.uint8 m.i1
			.int32le m["i1.5"]
			.uint8 m.i2
		return @

	dynamicModels: (models) ->
		return @ unless models
		@section "DynamicModels"
		.uint32le models.count
		for m in models.models
			@uint32le m.idx
			.uint32le m.c1
			.uint32le m.c2
			.vector m.position
			.vector m.rotation
			.floatle m.f1
			.floatle m.f2
			.vector m.v1
			.uint32le m.ii1
			.uint32le m.ii2
			for s in m.someThing
				@floatle s.a1
				.floatle s.a2
				.floatle s.a3
				.floatle s.a4
				.floatle s.a5
				.floatle s.a6
				.floatle s.a7
				.uint8 s.someFlag
				.icolor s.someColor
				.uint32le s.cc
				.zstring s.s1
				.zstring s.s2
		return @

	triggers: (triggers) ->
		return @ unless triggers
		@section "Triggers"
		.uint32le triggers.count
		for t in triggers.triggers
			@uint32le t.idx
			.uint32le t.type
			.uint32le t.someFlag
			.vector t.v
			.uint32le t.ii
			.uint32le t.ii1
			.uint32le t.ii2
			.uint32le t.ii3
			.uint32le t.ii4
			.zstring t.s
			switch t.type
				when 0
					@vector t.vv
					.vector t.vv2
				when 1
					@vector t.vv
					.floatle t.int
				when 2
					@vector t.vv
		return @


	samples3D: (samples) ->
		return @ unless samples
		@section "3DSamples_v2"
		.uint32le samples.count
		for s in samples.samples
			@uint32le s.idx
			.zstring s.fileName
			.vector s.v1
			.vector s.v2
			.vector s.v3
			.uint32le s.i1
			.uint32le s.i2
			.uint32le s.i3
			.uint32le s.i4
			.uint32le s.i5
		return @

	samples2D: (samples) ->
		return @ unless samples
		@section "2DSamples_v2"
		.uint32le samples.count
		for s in samples.samples
			@uint32le s.idx
			.zstring s.fileName
			.uint32le s.i1
			.uint32le s.i2
			.uint8 s.c
		return @

	ambientSound: (sound) ->
		@section "AmbientSound"
		.uint32le sound.count

	music: (music) ->
		@section "Music"
		.uint32le music.count

	effectsV2: (effects) ->
		return @ unless effects
		@section "Effects_v2"
		.uint32le effects.count
		for e in effects.effects
			@uint32le e.idx
			.uint32le con.effectType2Inverse[e.type]
			.uint32le e.i1
			.uint32le e.i2
			.uint32le e.i3
			.uint32le e.i4
			.uint32le e.i5
			switch e.type
				when "ef2UNKNOWN1", "ef2UNKNOWN6", "ef2UNKNOWN10"
					@uint32le e.ii
					.vector e.v1
					.vector e.v2
				when "ef2SNOWFLAKES"
					@uint32le e.ii
				when "ef2UNKNOWN5"
					@zstring e.s
					.vector e.v1
					.vector e.v2
					.vector e.v3
					.uint32le e.ii
		return @

	sceneData: (data) ->
		return @ unless data
		@section "Scene"
		.uint32le data.count
		for i in data.items
			@zstring i.s
			.uint32le i.i1
			.uint32le i.i2
		return @

	vertexModifiers: (data) ->
		return @ unless data
		@section "VertexModifiers"
		.uint32le data.count
		for m in data.modifiers
			@uint32le m.idx
			.uint32le m.type
			.vector m.v
			.icolor m.color
			if m.type is 1
				@vector m.vv
			@uint32le m.ii
			.uint8 m.c
		return @

	behaviours: (beh) ->
		return @ unless beh
		@section "Behaviours"
		.uint32le beh.count
		for b in beh.items
			@uint32le con.behaviourTypeInverse[b.type]
			.uint32le b.modelId
		return @

	dataset: (dataset) ->
		@section "Dataset"
		.uint32le dataset.size
		.buffer new Buffer dataset.data
		.zstring dataset.s1
		.zstring dataset.s2

	sceneOrigin: (origin) ->
		@section "SceneOrigin"
		.vector origin.origin

	textureProperties: (texProps) ->
		return @ unless texProps
		@section "TextureProperties"
		.uint32le texProps.count
		for t in texProps.properties
			@zstring t.fileName
			.int32le t.ii
		return @

	waypointSystem: (ws) ->
		@section "WaypointSystem"
		.uint32le ws.version
		.uint32le ws.mustBeZero
		return unless ws.mustBeZero is 0
		@buffer new Buffer ws.data if ws.version >= 5
		@uint32le ws.count1
		for i in ws.v5
			@uint32le i.ii1
			@uint32le i.ii1ext if ws.version >= 4
			@vector i.v1

			@uint32le i.ci1
			for j in i.innerdata1
				@uint32le j.x
			@uint32le i.ci2
			for j in i.innerdata2
				@uint32le j.x
		if ws.version >= 2
			@uint32le ws.count2
			for i in ws.v2
				@uint32le i.iiv2
				.uint32le i.ci3
				for j in i.inner2data1
					@uint32le j.y
		if ws.version >= 3 and ws.v5.length > 0
			for i in ws.v3
				@uint32le i.ci4
				for j in i.inner3data1
					@uint32le j.y
		@uint32le ws.mustBe0xFFFF
		return @

	serialize: (scene) ->
		@section "Scenefile"
		.version scene.Version
		.misc scene.Misc
		.lights scene.Lights
		.foModelsV4 scene.FOModels_v4
		.modelsV3 scene.Models_v3
		.dynamicModels scene.DynamicModels
		.triggers scene.Triggers
		.samples3D scene["3DSamples_v2"]
		.samples2D scene["2DSamples_v2"]
		.ambientSound scene.AmbientSound
		.music scene.Music
		.effectsV2 scene.Effects_v2
		.sceneData scene.Scene
		.vertexModifiers scene.VertexModifiers
		.behaviours scene.Behaviours
		.dataset scene.Dataset
		.sceneOrigin scene.SceneOrigin
		.textureProperties scene.TextureProperties
		.waypointSystem scene.WaypointSystem
		.section "EOS"
		.result()

exports.SceneSerializer = SceneSerializer

# Handle utility call directly from console
if require.main is module
	jsonParser = JSONStream.parse()
	jsonParser.on "data", (scene) ->
		serializer = new SceneSerializer()
		data = serializer.serialize scene
		process.stdout.write data
	process.stdin.pipe jsonParser