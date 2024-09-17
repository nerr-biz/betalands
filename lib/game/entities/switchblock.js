ig.module(
	'game.entities.switchblock'
)
.requires(
	'game.entities.mover'
)
.defines(function(){
	
EntitySwitchblock = EntityMover.extend({
	size: {x: 16, y: 16},
	//maxVel: {x: 0, y: 100},
		
	animSheet: new ig.AnimationSheet( 'media/switch.png', 16, 16 ),

	origSprite: 'media/switch.png',
	aFrameX:16,
	aFrameY:16,
	reflectsLight:true,	
	origPos:{x:0,y:0},
	switchState:0,
	collides: ig.Entity.COLLIDES.LITE,
	
	init: function( x, y, settings ) {
		this.parent( x, y, settings );
		this.origPos.x = x;
		this.origPos.y = y;
	},

	allAnim: function()
	{
		this.addAnim( 'idle1', 1, [0] );
		this.addAnim( 'idle2', 1, [1] );
	},
	
	
	update: function() {

		if(this.firstTarget == null)
		{
			if(this.pos.y < this.origPos.y)
			{
				this.gravityFactor = 1;
			}
			else
			{
				this.gravityFactor = 0;
				this.vel.y = 0;
				this.pos.y = this.origPos.y;
			}
		}

		if(!this.switchState)
			this.currentAnim = this.anims.idle1;
		else
			this.currentAnim = this.anims.idle2;
		this.parent();
	},

	hitSwitch: function(){

		this.origPos.x = this.pos.x;
		this.origPos.y = this.pos.y;

		ig.game.darkLevel = 0; //recalculate light

		if(ig.game.stillWater && ig.game.waterMap)
			ig.game.convertWater = true;
		
		if(this.firstTarget == null)
		{
			this.pos.y -= 2;
			this.vel.y = -50;
		}

		var newState = this.switchState ? 0:1;

		var items = ig.game.getEntitiesByType( EntitySwitchblock );
		for(var i=0;i<items.length;i++)
		{
			var item = items[i];
			item.switchState = newState;
		}

		for(var i=0;i<ig.game.bitsMap.height;i++) //left to right
		{
			for(var j=0;j<ig.game.bitsMap.width;j++)
			{
				var x = j*8;
				var y = i*8;
				if(ig.game.bitsMap.data[i][j] == 5) //white
				{
					ig.game.bitsMap.data[i][j] = 6;
					ig.game.collisionMap.data[i][j] = 1;
				}
				else if(ig.game.bitsMap.data[i][j] == 6) //white
				{
					ig.game.bitsMap.data[i][j] = 5;
					ig.game.collisionMap.data[i][j] = 0;
				}
				if(ig.game.bitsBGMap.data[i][j] == 5)
				{
					ig.game.bitsBGMap.data[i][j] = 6;
					ig.game.collisionMap.data[i][j] = 1;
				}
				else if(ig.game.bitsBGMap.data[i][j] == 6)
				{
					ig.game.bitsBGMap.data[i][j] = 5;
					ig.game.collisionMap.data[i][j] = 0;
				}

			}
		}
	},

	check: function( other ) 
	{
		this.parent(other);
		if(other instanceof EntityPlayerbase && other.pos.y + other.size.y - 8 <= this.pos.y)
		{
			other.standing = true;
			other.onPlatform = true;
			//other.pos.y = this.pos.y-other.size.y;
			//other.vel.y = this.vel.y;
		}
		if( other instanceof EntityGoomba ) {
			if(Math.round(other.pos.y) >= this.pos.y)
				this.hitSwitch();
			other.flip = !other.flip;
            // resolve collision between player (this) and (other)
            this.collides = ig.Entity.COLLIDES.FIXED;
            ig.Entity.solveCollision( this, other );
            this.collides = ig.Entity.COLLIDES.PASSIVE;
        }
	},
	
	collideWith: function( other, axis ) {
		if(other instanceof EntityPlayer)
		{
			if(axis == 'y' && (this.vel.y == 0 || !other.standing))
			{
				if(this.pos.y < other.pos.y)
				{
					this.hitSwitch();
				}
			}
		}
	}
});

});