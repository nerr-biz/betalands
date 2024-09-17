ig.module(
	'game.entities.bat'
)
.requires(
	'game.entities.sync'
)
.defines(function(){
	
EntityBat = EntitySync.extend({
	className:'bat',
	size: {x: 16, y: 16},
	maxVel: {x: 100, y: 100},
	friction: {x: 150, y: 0},
	
	//type: ig.Entity.TYPE.B, // Evil enemy group
	//checkAgainst: ig.Entity.TYPE.A, // Check against friendly
	//collides: ig.Entity.COLLIDES.NEVER,
	
	health: 1,	
	speed: 20,
	flip: false,
	gravityFactor: 0,
	origSprite: 'media/fish.png',
	reflectsLight:true,	
	moveup:false,
	
	init: function( x, y, settings ) {
		this.parent( x, y, settings );
	},
	allAnim: function()
	{
		this.addAnim( 'up', 1, [0,1] );
		this.addAnim( 'down', 1, [0,1] );
	},	
	
	update: function() {
		if(this.currentAnim.loopCount > 0)
		{
			this.moveup = (Math.random() < .5)
		}

		if(this.pos.x < 0)
		{
			this.pos.x = 1;
			this.vel.x = 0;
			this.flip = !this.flip;
		}
		if(this.pos.x + this.size.x > ig.game.mainMap.width * ig.game.mainMap.tilesize)
		{
			this.flip = !this.flip;
			this.vel.x = 0;
			this.pos.x = ig.game.mainMap.width * ig.game.mainMap.tilesize - this.size.x - 1;
		}
		// near an edge? return!
		if( !ig.game.collisionMap.getTile(
				this.pos.x + (this.flip ? this.size.x +4:-4),
				this.pos.y// + this.size.y+1
			) 
		) {
			this.flip = !this.flip;
			this.vel.x = 0;
		}

		var xdir = this.flip ? 1 : -1;
		var ydir = this.moveup ? 1 : -1;
		this.vel.x = (Math.abs(this.vel.x) < this.speed) ? this.speed * xdir : this.vel.x;
		this.vel.y = (Math.abs(this.vel.y) < this.speed) ? this.speed * ydir : this.vel.y;

		this.currentAnim = this.moveup ? this.anims.up : this.anims.down;
		this.currentAnim.flip.x = this.flip;
		
		this.parent();
	},

	handleMovementTrace: function( res ) {
		//ignore collision
		res.collision.x = false;
		res.pos.x = this.pos.x + this.vel.x * ig.system.tick;
		res.collision.y = false;
		res.pos.y = this.pos.y + this.vel.y * ig.system.tick;
		this.parent( res );
	},
	
	check: function( other ) {
		if(other instanceof EntityPlayer)
		{
			if(ig.game.inLevel)
			{
				//dead
				other.respawn();
			}
			else{
				this.flip = (other.pos.x < this.pos.x);

				var xdir = this.flip ? 1 : -1;
				this.vel.x = this.speed * xdir * 10;
			}
		}
		this.parent(other);
	}
});

});