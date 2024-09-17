ig.module(
	'game.entities.ghost'
)
.requires(
	'impact.entity'
)
.defines(function(){
	
EntityGhost = ig.Entity.extend({
	className:'ghost',
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
	origSprite: 'media/ghost.png',
	reflectsLight:false,
	moveup:false,
	
	init: function( x, y, settings ) {
		this.currentAnim = this.moveup ? this.anims.up : this.anims.down;
		this.parent( x, y, settings );
	},
	allAnim: function()
	{
		this.addAnim( 'up', 2, [0] );
		this.addAnim( 'down', 2, [0] );
	},	
	
	update: function() {
		if(this.currentAnim.loopCount > 0)
		{
			this.moveup = (Math.random() < .5)
			this.flip = (Math.random() < .5)
			this.currentAnim = this.moveup ? this.anims.up : this.anims.down;
			this.currentAnim = this.anims.up.rewind();
			this.currentAnim = this.anims.down.rewind();
			this.vel.y = 0;
			this.vel.x = 0;
		}

		if(this.pos.x < 0)
		{
			this.pos.x = 1;
			this.vel.x = 0;
			this.flip = !this.flip;
		}
		if(this.pos.y < 0)
		{
			this.pos.y = 1;
			this.vel.y = 0;
			this.currentAnim = this.anims.down.rewind();
			this.moveup = false;
		}
		if(this.pos.x + this.size.x > ig.game.mainMap.width * ig.game.mainMap.tilesize)
		{
			this.flip = !this.flip;
			this.vel.x = 0;
			this.pos.x = ig.game.mainMap.width * ig.game.mainMap.tilesize - this.size.x - 1;
		}
		if(this.pos.y + this.size.y > ig.game.mainMap.height * ig.game.mainMap.tilesize)
		{
			this.vel.y = 0;
			this.pos.y = ig.game.mainMap.height * ig.game.mainMap.tilesize - this.size.y - 1;
			this.currentAnim = this.anims.up.rewind();
			this.moveup = true;
		}

		var xdir = this.flip ? 1 : -1;
		var ydir = this.moveup ? -1 : 1;
		this.vel.x = (Math.abs(this.vel.x) < this.speed) ? this.speed * xdir : this.vel.x;
		this.vel.y = (Math.abs(this.vel.y) < this.speed) ? this.speed * ydir : this.vel.y;

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
	draw: function(){
        ig.system.context.globalAlpha = 0.6;
        this.parent();
        ig.system.context.globalAlpha = 1;
	}
});

});