Dissolve = require "dissolve"
fs = require "fs"

sectionTypes = 
	0x0001: "rwID_STRUCT"
	0x0002: "rwID_STRING"
	0x0003: "rwID_EXTENSION"
	0x0006: "rwID_TEXTURE"
	0x0007: "rwID_MATERIAL"
	0x0008: "rwID_MATLIST"
	0x0009: "rwID_ATOMICSECT"
	0x000A: "rwID_PLANESECT"
	0x000B: "rwID_WORLD"
	0x0014: "rwID_ATOMIC"
	0x0202: "eof"

worldFlags =
	rpWORLDTRISTRIP:				0x00000001 # This world's meshes can be rendered as tri strips
	rpWORLDPOSITIONS:				0x00000002 # This world has positions
	rpWORLDTEXTURED:				0x00000004 # This world has only one set of texture coordinates
	rpWORLDPRELIT:					0x00000008 # This world has luminance values
	rpWORLDNORMALS:					0x00000010 # This world has normals
	rpWORLDLIGHT:					0x00000020 # This world will be lit
	rpWORLDMODULATEMATERIALCOLOR:	0x00000040 # Modulate material color with vertex colors (pre-lit + lit)
	rpWORLDTEXTURED2:				0x00000080 # This world has 2 or more sets of texture coordinates
	rpWORLDNATIVE:					0x01000000
	rpWORLDNATIVEINSTANCE:			0x02000000
	rpWORLDSECTORSOVERLAP:			0x40000000 # Whether to store both vals, or only one

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
				when "rwID_WORLD"
					@unparse "size", "version"
					.tap "data", ->
						@header()
						.uint32le "rootIsWorldSector"
						.vector "invWorldOrigin"
						.tap "surfaceProps", ->
							@floatle "ambient"
							.floatle "specular"
							.floatle "diffuse"
						.uint32le "numTriangles"
						.uint32le "numVertices"
						.uint32le "numPlaneSectors"
						.uint32le "numWorldSectors"
						.uint32le "colSectorSize"
						.uint32le "format"
						.tap ->
							flags = @vars.format
							@vars.format = {}
							for flag, value of worldFlags
								@vars.format[flag] = !!(flags & value)
				when "rwID_MATLIST"
					@unparse "size", "version"
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
				when "rwID_MATERIAL"
					@unparse "size"
					.tap "data", ->
						@header() # rwID_STRUCT header
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
				when "rwID_TEXTURE"
					@header() # rwID_STRUCT header
					.uint8 "filterMode"
					.uint8 "addrModeU"
					.uint8 "addrModeV"
					.uint8 "padding"
					.unparse "padding"
					.section() # rwID_STRING expected
					.tap ->
						@vars.colorFile = @vars.string
						@unparse "string"
					.section() # rwID_STRING expected
					.tap ->
						@vars.maskFile = @vars.string
						@unparse "string"
					# Skip exactcly two rwID_EXTENSION sections
					.section()
					.section()
					# Clean up previous data from all the headers
					.unparse "type", "size", "version"
				when "rwID_PLANESECT"
					@tap "data", @header # rwID_STRUCT header
					.unparse "version", "data"
					.uint32le "sectorType"
					.floatle "value"
					.uint32le "leftIsWorldSector"
					.uint32le "rightIsWorldSector"
					.floatle "leftValue"
					.floatle "rightValue"
				when "rwID_ATOMICSECT"
					@tap "data", @header # rwID_STRUCT header
					.unparse "version", "data"
					.uint32le "materialIdBase"
					.uint32le "triangleCount"
					.uint32le "vertexCount"
					.vector "bbox1"
					.vector "bbox2"
					.uint32le "unused"
					.uint32le "unused"
					.unparse "unused"
					.tap ->
						flags = @vars_list[0].entries[0].data.format
						@exactlyCounted "vertices", @vars.vertexCount, ->
							@vector "position"
						.flatten "vertices", "position"
						if flags["rpWORLDNORMALS"]
							@exactlyCounted "normals", @vars.vertexCount, ->
								@uint8 "x"
								.uint8 "y"
								.uint8 "z"
								.int8 "p"
						if flags["rpWORLDPRELIT"]
							@exactlyCounted "colors", @vars.vertexCount, ->
								@icolor "color"
							.flatten "colors", "color"
						if flags["rpWORLDTEXTURED"]
							@exactlyCounted "textureCoords", @vars.vertexCount, ->
								@floatle "u"
								.floatle "v"
						else if flags["rpWORLDTEXTURED2"]
							@exactlyCounted "textureCoords1", @vars.vertexCount, ->
								@floatle "u"
								.floatle "v"
							.exactlyCounted "textureCoords2", @vars.vertexCount, ->
								@floatle "u"
								.floatle "v"
						@exactlyCounted "triangles", @vars.triangleCount, ->
							@uint16le "m"
							.uint16le "v1"
							.uint16le "v2"
							.uint16le "v3"
					.tap "extension", @section
					.unparse "extension"
				when "rwID_EXTENSION"
					@tap ->
						@buffer "data", @vars.size if @vars.size
					.unparse "size", "version"
				when "rwID_STRING"
					@string "string", @vars.size
					.tap ->
						# Throw out all the leading zeros
						@vars.string = @vars.string.replace /\u0000.*/g, ''
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