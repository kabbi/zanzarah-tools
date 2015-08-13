JSONStream = require "JSONStream"
yargs = require "yargs"
fs = require "fs"

argv = yargs.demand(1).argv

outFile = argv._[0]
mtlFile = fs.createWriteStream "#{outFile}.mtl"
objFile = fs.createWriteStream "#{outFile}.obj"

# Parsing methods
parse =
	rwCLUMP: ->
		return # Just ignore, empty section
	rwFRAMELIST: ->
		return # Ignore for now, nothing interesting there
	rwGEOMETRYLIST: ->
		return # Not used here
	rwGEOMETRY: (data) ->
		data = data.data
		objFile.write "mtllib #{outFile}.mtl\n"
		for v in data.vertices
			objFile.write "v #{v.x} #{v.y} #{v.z}\n"
		for uv in data.textureCoords
			objFile.write "vt #{uv.u} #{uv.v}\n"
		for n in data.normals
			objFile.write "vn #{n.x} #{n.y} #{n.z}\n"
		lastMat = -1
		for f in data.faces

			if lastMat != f.materialIdx
				objFile.write "usemtl mtl#{f.materialIdx}\n"
			lastMat = f.materialIdx

			a = f.vertex1 + 1
			b = f.vertex2 + 1
			c = f.vertex3 + 1
			objFile.write "f #{a}/#{a}/#{a} #{b}/#{b}/#{b} #{c}/#{c}/#{c}\n"
	rwMATERIALLIST: (data) ->
		tPath = "../TEXTURES/MODELS/"
		tExt = ".BMP"
		idx = 0
		for m in data.materials
			mtlFile.write "newmtl mtl#{idx++}\n"
			mtlFile.write "Ka #{m.ambient} #{m.ambient} #{m.ambient}\n"
			mtlFile.write "Kd #{m.diffuse} #{m.diffuse} #{m.diffuse}\n"
			mtlFile.write "Ks #{m.specular} #{m.specular} #{m.specular}\n"
			mtlFile.write "map_Ka #{tPath}#{m.texture.colorFile}#{tExt}\n"
			if m.texture.maskFile
				mtlFile.write "map_d #{tPath}#{m.texture.maskFile}#{tExt}\n"
			mtlFile.write "\n"

# Parse data
modelStream = JSONStream.parse "entries.*"
process.stdin.pipe modelStream

modelStream.on "data", (data) ->
	return unless data.type and parse[data.type]?
	parse[data.type] data