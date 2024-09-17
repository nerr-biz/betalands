ig.module(
	'impact.map'
)
.defines(function(){ "use strict";

ig.Map = ig.Class.extend({
	tilesize: 8,
	width: 1,
	height: 1,
	data: [[]],
	name: null,
	flip: [[]],
	
	
	init: function( tilesize, data ) {
		this.tilesize = tilesize;
		this.data = data;
		this.height = data.length;
		this.width = data[0].length;
		for (var y = 0; y < this.height; y++){
			this.flip[y] = [];
			for (var x = 0; x < this.width; x++)
				this.flip[y][x] = {x:false,y:false};
		}
	},
	
	
	getTile: function( x, y ) {
		var tx = Math.floor( x / this.tilesize );
		var ty = Math.floor( y / this.tilesize );
		if( 
			(tx >= 0 && tx <  this.width) &&
			(ty >= 0 && ty < this.height)
		) {
			return this.data[ty][tx];
		} 
		else {
			return 0;
		}
	},
	
	
	setTile: function( x, y, tile, flip) {
		var tx = Math.floor( x / this.tilesize );
		var ty = Math.floor( y / this.tilesize );
		if( 
			(tx >= 0 && tx < this.width) &&
			(ty >= 0 && ty < this.height)
		) {
			this.data[ty][tx] = tile;
			if(flip)
				this.flip[ty][tx] = flip;
			else
				this.flip[ty][tx] = {x:false,y:false};
		}
	}
});

});