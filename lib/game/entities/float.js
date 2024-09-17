ig.module(
	'game.entities.float'
)
.requires(
	'impact.entity'
)
.defines(function(){
	
EntityFloat = ig.Entity.extend({
	size: {x: 16, y: 16},
	maxVel: {x: 100, y: 100},
	friction: {x: 10, y: 0},
	
	type: ig.Entity.TYPE.B, // Evil enemy group
	checkAgainst: ig.Entity.TYPE.A, // Check against friendly
	collides: ig.Entity.COLLIDES.ACTIVE,
	
	gravityFactor: 1,
	
	animSheet: new ig.AnimationSheet( 'media/building.png', 16, 16 ),
	
	
	init: function( x, y, settings ) {
		this.parent( x, y, settings );
		
		this.addAnim( 'idle', 1, [0] );
	},
	
	
	update: function() {
		// underwater? go up
		if( ig.game.waterMap.getTile(this.pos.x,this.pos.y+this.size.y/2))
		{
			this.vel.y = -10;
		}
		else
			this.vel.y
		this.parent();
	},
	
	check: function( other ) {
		if(other instanceof EntityPlayer)
		{
			if(other.vel.x == 0)
				other.vel.x = this.vel.x;
		}
	}
});

});