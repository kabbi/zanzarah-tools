Component = requireComponent "base"
logger = requireLogger module

module.exports = class SimpleModel extends Component
	attach: (entity) ->
		super entity
		material = new entity.THREE.LineBasicMaterial color: 0xffffff
		switch entity.type
			when "file"
				loader = new entity.THREE.JSONLoader()
				data = require @client.baseDir + "/" + entity.file
				{geometry} = loader.parse data
			when "sphere"
				geometry = new entity.THREE.SphereGeometry @size or 1, 32, 32
			when "box"
				geometry = new entity.THREE.BoxGeometry 1, 1, 1
		entity.model = new entity.THREE.Mesh geometry, material
		entity.model.position.copy @position or x: 0, y: 0, z: 0
		entity.scene.add entity.model