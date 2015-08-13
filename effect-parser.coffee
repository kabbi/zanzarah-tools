Dissolve = require "dissolve"
fs = require "fs"

con = require "./constants"

fatal = (msg) ->
	process.stderr.write "Fail: #{msg}\n"
	# process.exit 0

clump = (fval) ->
	val = if fval >= 1 then 255 else fval * 255
	val = Math.round val
	clumpInt val
clumpInt = (val) ->
	val = val.toString 16
	val = "0#{val}" if val.length < 2
	val
floatColorToStr = (c) ->
	"0x#{clump c.a}#{clump c.r}#{clump c.g}#{clump c.b}"
intColorToStr = (c) ->
	"0x#{clumpInt c.a}#{clumpInt c.r}#{clumpInt c.g}#{clumpInt c.b}"

class EffectParser extends Dissolve
	constructor: ->
		Dissolve.call @
		@loop (end) ->
			@scene()
			if @stopParsing
				@push @vars
				end()

	zstring: (name) ->
		lenProp = "#{name}_len"
		@uint32le lenProp
		.string name, lenProp
		.tap -> delete @vars[lenProp]

	fcolor: (name) ->
		@tap name, ->
			@floatle "r"
			.floatle "g"
			.floatle "b"
			.floatle "a"
		.tap ->
			@vars[name] = floatColorToStr @vars[name]

	icolor: (name) ->
		@tap name, ->
			@uint8 "r"
			.uint8 "g"
			.uint8 "b"
			.uint8 "a"
		.tap ->
			@vars[name] = intColorToStr @vars[name]

	vector: (name) ->
		@tap name, ->
			@floatle "x"
			.floatle "y"
			.floatle "z"

	light: ->
		@uint32le "idx"
		.uint32le "type"
		.fcolor "color"
		.uint32le "param"
		.tap ->
			@vars.type = lightTypes[@vars.type] or "lUNKNOWN"
			switch @vars.type
				when "lUNKNOWN1"
					@vector "v1"
					.vector "v2"
				when "lUNKNOWN128"
					@float "arg"
					.vector "v"
				when "lUNKNOWN129"
					@uint32le "someAnotherInt"
					.vector "v1"
					.vector "v2"

	foModelV4: ->
		@uint32le "idx"
		# .tap -> delete @vars.idx
		.zstring "fileName"
		.vector "v1"
		.vector "v2"
		.floatle "f1"
		.floatle "f2"
		.floatle "f3"
		.floatle "f4"
		.floatle "f5"
		.icolor "someColor"
		.uint8 "ff1"
		.uint8 "ff2"
		.uint32le "i6"
		.uint8 "ff3"
		.int32le "i7"

	model: ->
		@uint32le "idx"
		# .tap -> delete @vars.idx
		.zstring "fileName"
		.vector "position"
		.vector "rotation"
		.floatle "scaleX"
		.floatle "scaleY"
		.floatle "scaleZ"
		.icolor "someColor"
		.uint8 "i1"
		.int32le "i1.5"
		.uint8 "i2"

	dynamicModel: ->
		currentCount = 0
		@uint32le "idx"
		# .tap -> delete @vars.idx
		.uint32le "c1"
		.uint32le "c2"
		.vector "position"
		.vector "rotation"
		.floatle "f1"
		.floatle "f2"
		.vector "v1"
		.uint32le "ii1"
		.uint32le "ii2"
		.loop "someThing", (end) ->
			return end true if currentCount++ is 3
			@floatle "a1"
			.floatle "a2"
			.floatle "a3"
			.floatle "a4"
			.floatle "a5"
			.floatle "a6"
			.floatle "a7"
			.uint8 "someFlag"
			.icolor "someColor"
			.uint32le "cc"
			.zstring "s1"
			.zstring "s2"

	trigger: ->
		@uint32le "idx"
		.uint32le "type"
		.uint32le "someFlag"
		.vector "v"
		.uint32le "ii"
		.int32le "ii1"
		.uint32le "ii2"
		.uint32le "ii3"
		.uint32le "ii4"
		.zstring "s"
		.tap ->
			switch @vars.type
				when 0
					@vector "vv"
					.vector "vv2"
				when 1
					@vector "vv"
					.floatle "int"
				when 2
					@vector "vv"

	effect: ->
		@uint32le "idx"
		.uint32le "type"
		.tap ->
			@vars.type = effectTypes[@vars.type] or "efUNKNOWN"
			switch @vars.type
				when "efUNKNOWN1", "efUNKNOWN5", "efUNKNOWN6", "efUNKNOWN10"
					@uint32le "param"
					.vector "v1"
					.vector "v2"
				when "efUNKNOWN4"
					@uint32le "param"
					.vector "v"
				when "efUNKNOWN7"
					@zstring "effectFile"
					.vector "v"
				when "efUNKNOWN13"
					@zstring "effectFile"
					.vector "v1"
					.vector "v2"
					.vector "v3"
					.uint32le "ii"

	effectV2: ->
		@uint32le "idx"
		.uint32le "type"
		.uint32le "i1"
		.uint32le "i2"
		.uint32le "i3"
		.uint32le "i4"
		.uint32le "i5"
		.tap ->
			@vars.type = effectTypes2[@vars.type] or "ef2UNKNOWN"
			switch @vars.type
				when "ef2UNKNOWN1", "ef2UNKNOWN6", "ef2UNKNOWN10"
					@uint32le "ii"
					.vector "v1"
					.vector "v2"
				when "ef2SNOWFLAKES"
					@uint32le "ii"
				when "ef2UNKNOWN5"
					@zstring "s"
					.vector "v1"
					.vector "v2"
					.vector "v3"
					.uint32le "ii"

	vertexModifier: ->
		@uint32le "idx"
		.uint32le "type"
		.vector "v"
		.icolor "color"
		.tap ->
			if @vars.type is 1
				@vector "vv"
			@uint32le "ii"
			.uint8 "c"

	sample3D: ->
		@uint32le "idx"
		.zstring "fileName"
		.vector "v1"
		.vector "v2"
		.vector "v3"
		.uint32le "i1"
		.uint32le "i2"
		.uint32le "i3"
		.uint32le "i4"
		.uint32le "i5"

	sample2D: ->
		@uint32le "idx"
		.zstring "fileName"
		.uint32le "i1"
		.uint32le "i2"
		.uint8 "c"

	waypoint: ->
		@uint32le "iii"
		.uint8 "a"

	sceneItem: ->
		@zstring "s"
		.uint32le "i1"
		.uint32le "i2"

	textureProperty: ->
		@zstring "fileName"
		.int32le "ii"

	behaviour: ->
		@uint32le "type"
		.uint32le "modelId"
		.tap ->
			@vars.type = con.behaviourType[@vars.type] or "zBEH_UNKNOWN_#{@vars.type}"

	counted: (name, countVar, cb) ->
		currentCount = 0
		@uint32le countVar
		# .tap -> process.stderr.write "Parsing #{@vars[countVar]} items #{name}\n"
		.loop name, (end) ->
			# TODO: remove stopParsing check here, it's only for debug
			return end true if currentCount++ is @vars[countVar] or @stopParsing
			cb.call @

	exactlyCounted: (name, count, cb) ->
		currentCount = 0
		@loop name, (end) ->
			return end true if currentCount++ is count
			cb.call @

	scene: ->
		@zstring "section"
		.tap ->
			sectionName = @vars.section
			delete @vars.section
			@tap sectionName[1..-2], ->
				@sceneSection sectionName

	sceneSection: (sectionName) ->
		switch sectionName
			when "[Effect Combiner]"
				return
			when "[Effect_Combiner_Description]"
				@buffer "description", 0x20
			when "[Effect_Combiner_Parameter]"
				@uint32le "param1"
				.uint8 "param2"
			when "[Effect_Combiner_Position]"
				@vector "v1"
				.vector "v2"
			when "[Effect_Combiner_Form]"
				@vector "m1"
				.vector "m2"
				.vector "m3"
			when "[MovingPlanes]"
				return # TODO: implement
			when "[RandomPlanes]"
				return # TODO: implement
			when "[Models]"
				return # TODO: implement
			when "[BeamStar]"
				return # TODO: implement
			when "[ElectricBolt]"
				return # TODO: implement
			when "[ParticleCollector]"
				return # TODO: implement
			when "[ParticleEmitter]"
				@uint32le "count"
				.tap ->
					if @vars.count is 0x120
						@buffer "emitterData", "count"
					else
						fatal "bad emitter data size" 
						@buffer "unparsedData", "count"
			when "[ParticleBeam]"
				return # Seems deprecated and ignored
			when "[Particle Beam]"
				return # TODO: implement
			when "[PlaneBeam]"
				return # TODO: implement
			when "[Sparks]"
				return # TODO: implement
			when "[Sounds]"
				return # TODO: implement
			when "[EOF]"
				@stopParsing = true
			else
				fatal "Section #{sectionName} is not supported yet"

exports.EffectParser = EffectParser

# Handle utility call directly from console
if require.main is module
	parser = new EffectParser()
	parser.on "data", (model) ->
		console.log JSON.stringify model, null, 4
	process.stdin.pipe parser