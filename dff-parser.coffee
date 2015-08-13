Dissolve = require "dissolve"
fs = require "fs"

sectionTypes =
	1: "rwDATA"
	2: "rwSTRING"
	3: "rwEXTENSION"
	6: "rwTEXTURE"
	7: "rwMATERIAL"
	8: "rwMATERIALLIST"
	14: "rwFRAMELIST"
	15: "rwGEOMETRY"
	16: "rwCLUMP"
	20: "rwATOMIC"
	26: "rwGEOMETRYLIST"
	278: "rwSKINPLUGIN"
	1294: "rwMATERIALSPLIT"
	0x108: "rwANIMPLUGIN"
	39056126: "rwFRAME"

geometryFlags =
	rwTRISTRIP: 				0x00000001
	rwPOSITIONS: 				0x00000002
	# One and only one set of 	texcoords
	rwTEXTURED: 				0x00000004
	rwPRELIT: 					0x00000008
	rwNORMALS: 					0x00000010
	rwLIGHT: 					0x00000020
	rwMODULATE_MATERIAL_COLOR: 	0x00000040
	# At least 2 sets of 	texcoords
	rwTEXTURED2: 				0x00000080
	rwNATIVE: 					0x01000000
	rwNATIVE_INSTANCE: 			0x02000000
	rwFLAGS_MASK: 				0x000000FF
	rwNATIVE_FLAGS_MASK: 		0x0F000000

addressModes =
	0: "rwDEFAULT"
	1: "rwWRAP"
	2: "rwMIRROR"
	3: "rwCLAMP"
	4: "rwBORDER"

filterModes =
	0: "rwNA_FILTER_MODE"
	1: "rwNEAREST"
	2: "rwLINEAR"
	3: "rwMIP_NEAREST"
	4: "rwMIP_LINEAR"
	5: "rwLINEAR_MIP_NEAREST"
	6: "rwLINEAR_MIP_LINEAR"

dataSections = ["rwDATA", "rwSTRING", "rwFRAME", "rwMATERIALSPLIT"]

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

class StreamParser extends Dissolve

	constructor: ->
		Dissolve.call @
		# Main parser loop
		@sectionList().tap ->
			@push @vars

	# Utility methods

	unparse: (names...) ->
		@tap -> delete @vars[name] for name in names
		return @

	break: ->
		@tap -> @stopParsing = true
		return @

	counted: (name, countVar, cb) ->
		currentCount = 0
		@uint32le countVar
		.loop name, (end) ->
			return end true if currentCount++ is @vars[countVar]
			cb.call @

	exactlyCounted: (name, count, cb) ->
		currentCount = 0
		@loop name, (end) ->
			return end true if currentCount++ is count
			cb.call @

	flatten: (item, prop) ->
		@tap ->
			for i in [0...@vars[item].length]
				@vars[item][i] = @vars[item][i][prop]

	# Renderware specific item parsers

	section: ->
		@header()
		.tap ->
			switch @vars.type
				when "rwCLUMP"
					@unparse "size"
					.tap "data", ->
						@header()
						.uint32le "count"
					.tap ->
						@vars.count = @vars.data.count
						delete @vars.data
				when "rwFRAMELIST"
					@unparse "size"
					.tap "data", ->
						@header()
						.unparse "size", "type", "version"
						.counted "frames", "count", @frame
						.unparse "count"
					.tap ->
						@exactlyCounted "animations", @vars.data.frames.length, ->
							@header() # One rwEXTENSION header
							# And then exact extension data
							.header()
							.unparse "size", "type", "version"
							.int32le "i1"
							.uint32le "someFlag"
							.tap ->
								return unless @vars.someFlag
								@uint32le "ii1"
								.uint32le "count1"
								.uint32le "count2"
								.tap ->
									@exactlyCounted "items1", @vars.count1, @strangeAnimData
									.exactlyCounted "items2", @vars.count2, @strangeAnimData
									.unparse "count1", "count2"
				when "rwGEOMETRYLIST"
					@unparse "size"
					.tap "data", ->
						@header()
						.uint32le "count"
					.tap ->
						@vars.count = @vars.data.count
						delete @vars.data
				when "rwMATERIALLIST"
					@unparse "size"
					.tap "data", ->
						@header()
						.counted "someValues", "count", ->
							@int32le "dummy"
						.flatten "someValues", "dummy"
					.tap ->
						@vars.count = @vars.data.count
						@vars.someValues = @vars.data.someValues
						delete @vars.data
						@exactlyCounted "materials", @vars.count, @section
						.flatten "materials", "data"
						.unparse "count"
						# Destroy one rwEXTENSION section after that
						.tap "ext", @section
						.unparse "ext"
				when "rwMATERIALSPLIT"
					return @break()
					@unparse "size"
					.header() # rwDATA header
					# Just ignore the complete data section
					@buffer "dummy", "size"
					.unparse "dummy", "type", "size"
					# Continue parsing material split
					.uint32le "triangleStrip"
					.uint32le "splitCount"
					.uint32le "faceCount"
					.tap ->
						@exactlyCounted "splits", @vars.splitCount, ->
							@uint32le "faceIndex"
							.uint32le "materialIndex"
							.tap ->
								@exactlyCounted "vertexes", @vars.faceIndex, ->
									@uint32le "vertex"
				when "rwGEOMETRY"
					@unparse "size"
					.tap "data", ->
						@header()
						.unparse "size", "type"
						.uint32le "flags"
						.uint32le "triangleCount"
						.uint32le "vertexCount"
						.uint32le "morphTargetCount"
						.tap ->
							# TODO: check flag before parsing
							@tap "lighting", ->
								@floatle "ambient"
								.floatle "diffuse"
								.floatle "specular"
							if @vars.flags & geometryFlags.rwPRELIT
								@exactlyCounted "vertexColors", @vars.vertexCount, ->
									@icolor "vertexColor"
								.flatten "vertexColors", "vertexColor"
							if @vars.flags & geometryFlags.rwTEXTURED
								@exactlyCounted "textureCoords", @vars.vertexCount, ->
									@floatle "u"
									.floatle "v"
							@exactlyCounted "faces", @vars.triangleCount, ->
								@uint16le "vertex2"
								.uint16le "vertex1"
								.uint16le "materialIdx"
								.uint16le "vertex3"
							.tap "boundingSphere", ->
								@vector "position"
								.floatle "radius"
							.tap "extraInfo", ->
								@uint32le "hasPosition"
								.uint32le "hasNormals"
							.exactlyCounted "vertices", @vars.vertexCount, ->
								@vector "position"
							.flatten "vertices", "position"
							if @vars.flags & geometryFlags.rwNORMALS
								@exactlyCounted "normals", @vars.vertexCount, ->
									@vector "normal"
								.flatten "normals", "normal"
						.unparse "version"
				when "rwMATERIAL"
					@unparse "size"
					.tap "data", ->
						@header() # rwDATA header
						.unparse "type", "size", "version"
						.uint32le "unk1"
						.icolor "color"
						.icolor "unk2"
						.int32le "textured"
						.floatle "ambient"
						.floatle "specular"
						.floatle "diffuse"
						.tap ->
							# rwTEXTURE expected here, exactcly one if needed
							@tap "texture", @section if @vars.textured
				when "rwTEXTURE"
					@header() # rwDATA header
					.uint8 "filterMode"
					.uint8 "addrModeU"
					.uint8 "addrModeV"
					.uint8 "padding"
					.unparse "padding"
					.section() # rwSTRING expected
					.tap ->
						@vars.colorFile = @vars.string
						@unparse "string"
					.section() # rwSTRING expected
					.tap ->
						@vars.maskFile = @vars.string
						@unparse "string"
					# Skip exactcly two rwEXTENSION sections
					.section()
					.section()
					# Clean up previous data from all the headers
					.unparse "type", "size", "version"
				when "rwEXTENSION" or "rwANIMPLUGIN"
					@tap ->
						@buffer "data", @vars.size if @vars.size
					.unparse "size", "version"
				when "rwSTRING"
					@string "string", @vars.size
					.tap ->
						# Throw out all the leading zeros
						@vars.string = @vars.string.replace /\u0000.*/g, ''
				when "rwATOMIC"
					@tap "data", ->
						@header() # rwDATA header
						.unparse "type", "size"
						.uint32le "frameIndex"
						.uint32le "geometryIndex"
						.uint32le "unk1"
						.uint32le "unk2"
					.tap ->
						return if @vars.size is 40 # Nothing more is expected
						@tap "skin", ->
							@header() # rwEXTENSION header
							.header() # rwSKINPLUGIN header
							.unparse "type", "size"
							.uint32le "boneCount"
							.uint32le "vertexCount"
							.tap ->
								@exactlyCounted "vertexIndices", @vars.vertexCount, ->
									@uint8 "b1"
									.uint8 "b2"
									.uint8 "b3"
									.uint8 "b4"
								.exactlyCounted  "vertexWeights", @vars.vertexCount, ->
									@floatle "w1"
									.floatle "w2"
									.floatle "w3"
									.floatle "w4"
								.exactlyCounted "bones", @vars.boneCount, ->
									@uint32le "i1"
									.uint32le "idx"
									.uint32le "i3"
									.rwMatrix "matrix"
				else
					@break()

	header: ->
		@uint32le "type"
		.uint32le "size"
		.uint16le "dummy"
		.uint16le "version"
		.tap ->
			@vars.type = sectionTypes[@vars.type] or "rwERROR-#{@vars.type}"
			@unparse "dummy", "version"

	sectionList: ->
		@loop "entries", (end) ->
			return end true if @stopParsing
			@section()

	matrix: (name) ->
		currentCount = 0
		@loop name, (end) ->
			return end true if currentCount++ is 9
			@floatle "val"
		.flatten name, "val"

	rwMatrix: (name) ->
		@tap name, ->
			@vector "right"
			.uint32le "flags"
			.vector "up"
			.uint32le "padding"
			.vector "at"
			.uint32le "padding"
			.vector "pos"
			.uint32le "padding"
			.unparse "padding"

	vector: (name) ->
		@tap name, ->
			@floatle "x"
			.floatle "y"
			.floatle "z"

	frame: ->
		@matrix "matrix"
		.vector "offset"
		.int32le "parentFrame"
		.int32le "reserved"
		.unparse "reserved"

	strangeAnimData: ->
		@zstring "name"
		.uint32le "type"
		.uint32le "count1"
		.uint32le "count2"
		.tap ->
			switch @vars.type
				when 1
					@exactlyCounted "innerItems1", @vars.count1, ->
						@floatle "f1"
						.floatle "f2"
						.floatle "f3"
				when 2
					@exactlyCounted "innerItems1", @vars.count1, ->
						@floatle "i1"
						.floatle "i2"
						.floatle "i3"
						.floatle "i4"
			@exactlyCounted "innerItems2", @vars.count2, ->
				@uint32le "i1"
				.uint32le "i2"
				.floatle "f"

	zstring: (name) ->
		lenProp = "#{name}_len"
		@uint32le lenProp
		.string name, lenProp
		.tap ->
			delete @vars[lenProp]
			# Throw out all the leading zeros
			@vars[name] = @vars[name].replace /\u0000.*/g, ''

	icolor: (name) ->
		@tap name, ->
			@uint8 "r"
			.uint8 "g"
			.uint8 "b"
			.uint8 "a"
		.tap ->
			@vars[name] = intColorToStr @vars[name]

	fcolor: (name) ->
		@tap name, ->
			@floatle "r"
			.floatle "g"
			.floatle "b"
			.floatle "a"
		.tap ->
			@vars[name] = floatColorToStr @vars[name]

exports.StreamParser = StreamParser

# Handle utility call directly from console
if require.main is module
	parser = new StreamParser()
	parser.on "data", (model) ->
		console.log JSON.stringify model, null, 4
	process.stdin.pipe parser