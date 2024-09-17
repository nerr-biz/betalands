ig.module(
	'game.entities.goomba'
)
.requires(
	'impact.entity'
)
.defines(function(){
	
EntityGoomba = ig.Entity.extend({
	size: {x: 16, y: 16},
	maxVel: {x: 100, y: 100},
	friction: {x: 150, y: 0},
	
	type: ig.Entity.TYPE.B, // Evil enemy group
	checkAgainst: ig.Entity.TYPE.A, // Check against friendly
	collides: ig.Entity.COLLIDES.NEVER,
	
	health: 1,	
	speed: 20,
	flip: true,
	spawn: {x:0,y:0},
	
	origSprite: 'media/goomba.png',
	reflectsLight: true,
	currSprite: '',
	aFrameX:16,
	aFrameY:16,
	
	
	init: function( x, y, settings ) {
		this.parent( x, y, settings );
		this.spawn.x = x;
		this.spawn.y = y;
	},
	allAnim: function()
	{
		this.addAnim( 'crawl', 0.08, [0,1] );
	},
	
	
	update: function() {
		// near an edge? return!
		if( !ig.game.collisionMap.getTile(
				this.pos.x + (this.flip ? +4 : this.size.x -4),
				this.pos.y + this.size.y+1
			)
		) {
			this.flip = !this.flip;
		}
		
		var xdir = this.flip ? -1 : 1;
		this.vel.x = this.speed * xdir;

		this.currentAnim = this.anims.crawl;
		this.parent();
	},
	
	
	handleMovementTrace: function( res ) {
		this.parent( res );
		
		// collision with a wall? return!
		if( res.collision.x ) {
			this.flip = !this.flip;
		}
	},	
	
	check: function( other ) {
		if(other instanceof EntityPlayer)
		{
			if(other.pos.y + other.size.y < this.pos.y + this.size.y/2)
			{
				this.kill();
				other.friction.x = 0;
				other.vel.y = -other.jump;
			}
			else{
				if(ig.game.inLevel)
				{
					//dead
					other.respawn();
					//ig.game.resetLevel(other);				
				}
				else{
					other.hit = (this.flip ? 2 : -2);
					if(ig.game.inArena)
						ig.game.socketEmit('playerhit',playerinfo.username,playerinfo.username);
				}
			}
		}
		if( other instanceof EntityMover ) {
            // resolve collision between player (this) and (other)
            ig.Entity.solveCollision( this, other );
        }
        if(other instanceof EntityFirework){
        	this.kill();
        	other.explode();
        }

	}
});

});