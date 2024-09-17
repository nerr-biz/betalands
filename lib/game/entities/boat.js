ig.module(
	'game.entities.boat'
)
.requires(
	'impact.entity'
)
.defines(function(){
	
EntityBoat = ig.Entity.extend({
	size: {x: 44, y: 1},
	offset: {x: 2, y: 15},
	maxVel: {x: 25, y: 100},
	friction: {x: 10, y: 0},
	zIndex:10,
	
	type: ig.Entity.TYPE.B, // Evil enemy group
	checkAgainst: ig.Entity.TYPE.A, // Check against friendly
	collides: ig.Entity.COLLIDES.FIXED,
	
	gravityFactor: 1,

	leftside:null,
	rightside:null,
	bottomside:null,
	
	animSheet: new ig.AnimationSheet( 'media/boat.png', 48, 16 ),

	origSprite: 'media/boat.png',
	aFrameX:48,
	aFrameY:16,
	reflectsLight:true,	
	
	init: function( x, y, settings ) {
		this.parent( x, y, settings );
		if( !ig.global.wm ) { // not in wm?
		this.leftside = ig.game.spawnEntity( EntityBoatside, x, y, {boat:this} );
		this.rightside = ig.game.spawnEntity( EntityBoatside, x, y, {boat:this} );
		this.leftside.zIndex = this.zIndex - 1;
		this.rightside.zIndex = this.zIndex - 1;
		}		
	},

	allAnim: function()
	{
		this.addAnim( 'idle', 1, [0] );
	},
	
	
	update: function() {

		if(this.pos.x < 0)
		{
			this.pos.x = 1;
			this.vel.x = 0;
		}
		if(this.pos.x + this.size.x > ig.game.mainMap.width * ig.game.mainMap.tilesize)
		{
			this.vel.x = 0;
			this.pos.x = ig.game.mainMap.width * ig.game.mainMap.tilesize - this.size.x - 1;
		}

		// underwater? go up
		var waterval = ig.game.waterMap.getTile(this.pos.x+(this.size.x/2),this.pos.y-2)
		var waterval2 = ig.game.waterMap.getTile(this.pos.x+(this.size.x/2)+8,this.pos.y-2)
		if(waterval || waterval2)
		{
			this.maxVel.x = 25;
			this.friction.x = 5;
			this.gravityFactor = 0;
			if(ig.game.waterMap.getTile(this.pos.x+(this.size.x/2),this.pos.y-2-1) || ig.game.waterMap.getTile(this.pos.x+(this.size.x/2)+8,this.pos.y-2-1))
			{
				this.vel.y = -10;
			}
			else
			{
				this.vel.y = 0;
				if(waterval == 1 || waterval2 == 1)
					this.vel.x = -25;
				else if(waterval == 2 || waterval2 == 2)
					this.vel.x = 25;
			}
		}
		else
		{
			this.friction.x = 100;
			this.maxVel.x = 10;
			this.gravityFactor = 1;
		}
		this.currentAnim = this.anims.idle;
		this.parent();
		if(this.leftside)
		{
			this.leftside.pos.x = this.pos.x-2;
			this.leftside.pos.y = this.pos.y-15;
			//this.leftside.accel.x = this.accel.x;
			//this.leftside.accel.y = this.accel.y;
			//this.leftside.vel.x = this.vel.x;
			//this.leftside.vel.y = this.vel.y
		}
		if(this.rightside)
		{
			this.rightside.pos.x = this.pos.x+this.size.x-6;
			this.rightside.pos.y = this.pos.y-15;
			//this.rightside.accel.x = this.accel.x;
			//this.rightside.accel.y = this.accel.y;
			//this.rightside.vel.x = this.vel.x;
			//this.rightside.vel.y = this.vel.y
		}
	},
	
	collideWith: function( other, axis ) {
		if(other instanceof EntityPlayerbase)
		{
			if(axis == 'y' && !other.standing)
			{
				if(this.pos.y > other.pos.y)
				{
					this.pos.y+=2;
					this.vel.y = 50;				
				}
				else
				{
					this.pos.y-=2;
					this.vel.y = -100;
				}
			}
		}
	}
});

EntityBoatside = ig.Entity.extend({

	boat:null,
	gravityFactor: 0,	
	size: {x: 8, y:8},		
	type: ig.Entity.TYPE.B, // Evil enemy group
	checkAgainst: ig.Entity.TYPE.A, // Check against friendly
	collides: ig.Entity.COLLIDES.FIXED,

	init: function( x, y, settings ) {

		this.parent( x, y, settings );
	},
	
	
	update: function() {
		this.parent();
	},
	/*
	draw: function() {
        var ctx = ig.system.context;
        var s = ig.system.scale;
        var x = this.pos.x * s - ig.game.screen.x * s;
        var y = this.pos.y * s - ig.game.screen.y * s;
        var sizeX = this.size.x * s;
        var sizeY = this.size.y * s;
        ctx.save();
        ctx.fillStyle = 'green';
        ctx.fillRect(x,y,sizeX,sizeY);
        this.parent();
        ctx.restore();
    },*/
    collideWith: function( other, axis ) {
    	if(other instanceof EntityPlayerbase)
    	{
			if(axis == 'x')
			{
				this.boat.vel.x = (other.flip ? -this.boat.maxVel.x : this.boat.maxVel.x);
			}
		}
	}
});

});