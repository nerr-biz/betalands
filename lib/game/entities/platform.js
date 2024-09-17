ig.module(
	'game.entities.platform'
)
.requires(
	'game.entities.mover'
)
.defines(function(){
	
EntityPlatform = EntityMover.extend({
	className:'platform',
	size: {x: 40, y: 8},

	//animSheet: new ig.AnimationSheet( 'media/platform.png', 40, 8 ),

	origSprite: 'media/platform.png',
	//aFrameX:72,
	//aFrameY:8,
	reflectsLight:true,	

	init: function( x, y, settings ) {
		this.parent( x, y, settings );
	},
	allAnim: function()
	{
		this.addAnim( 'idle', 1, [0] );
	},
	update: function() {
		this.currentAnim = this.anims.idle;

		this.parent();
	},
    check: function( other ) 
	{
		this.parent(other);
		if(other instanceof EntityPlayerbase && other.pos.y + other.size.y - 8 <= this.pos.y)
		{
			other.standing = true;
			other.onPlatform = true;
			//if(this.vel.y <= 0)
				//other.pos.y = this.pos.y-other.size.y+1; //only works until you respaw, no idea why
		}
		if( other instanceof EntityGoomba ) {
            // resolve collision between player (this) and (other)
            ig.Entity.solveCollision( this, other );
        }
	}/*
	collideWith: function(other, axis) {
	    if (other.pos.y < this.pos.y) {
	        other.standing = true;
	        other.onPlatform = true;
	        if(this.vel.y > 0)
	        	other.vel.y = this.vel.y;
	    }
	}*/
});

});