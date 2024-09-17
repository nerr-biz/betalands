ig.module(
	'game.entities.firework'
)
.requires(
	'impact.entity'
)
.defines(function(){

EntityProjectile = ig.Entity.extend({
});
EntityFirework = EntityProjectile.extend({
	size: {x: 8, y: 8},
    friction: {x: 0, y: 0},
    gravityFactor:1,
    speed: 500,
    owner:'',
    hitVel:200,
	
	type: ig.Entity.TYPE.B, // Evil enemy group
	checkAgainst: ig.Entity.TYPE.BOTH, // Check against friendly
	collides: ig.Entity.COLLIDES.NEVER,
	sound: new ig.Sound('media/sounds/explosion.ogg'),
			
	init: function( x, y, settings ) {
		this.parent( x, y, settings );

		this.idleTimer = new ig.Timer();

		this.maxVel.x = this.maxVel.y = this.speed; // allow full speed
		this.setVelocityByAngle(this.angle, this.speed);

	},
	setVelocityByAngle: function(angle, velocity) {
	    this.vel.x = Math.cos(angle) * velocity;
	    this.vel.y = Math.sin(angle) * velocity;
	},
	
	update: function() {
		if(this.idleTimer.delta() > 3){
			this.explode();
			return;
	    }
		this.parent();
	},
		
	handleMovementTrace: function( res ) {
		this.parent( res );
		
		// collision with a wall? return!
		if( res.collision.x || res.collision.y) {
			this.explode();
		}
	},	
	explode: function(){
		this.sound.play();
		for (var i = 0; i <= 100; i++){
			//var randPos = {x: Math.random()*450 + 10, y: Math.random()*230 + 20};
			ig.game.spawnEntity( EntitySpark, this.pos.x, this.pos.y );
			ig.game.goDark(0);
		}
		this.kill();
	},
	
	check: function( other ) {
		if(other instanceof EntityPlayerbase && !(other.name == this.owner))
		{
			if(ig.game.inArena)
			{
				if(other.name == playerinfo.username)
					ig.game.lasthit = this.owner;
				ig.game.socketEmit('playerhit',this.owner,other.name);
			}
			//hit other player
			if(this.vel.x > 0)
				other.hit = -2;
			else
				other.hit = 2;

			this.explode();
			//other.friction.x = 0;
			//other.vel.y = -other.jump;
		}
		if(other instanceof EntityPlayerhead)
		{
			if(this.vel.x > 0)
				other.vel.x = -this.hitVel;
			else
				other.vel.x = this.hitVel;
			other.vel.y = -this.hitVel;
		}
        if(this.owner == playerinfo.username && other instanceof EntityGoomba){
        	other.kill();
        	this.explode();
        }
        if(other instanceof EntityFirework){
        	other.explode();
        	this.explode();
        }
	},
	draw: function() {
        var ctx = ig.system.context;
        var s = ig.system.scale;
        var x = this.pos.x * s - ig.game.screen.x * s;
        var y = this.pos.y * s - ig.game.screen.y * s;
        var sizeX = this.size.x * s;
        var sizeY = this.size.y * s;
        ctx.save();
        ctx.fillStyle = 'yellow';
        ctx.fillRect(x,y,sizeX,sizeY);
        this.parent();
        ctx.restore();
    }
});

EntitySpark = ig.Entity.extend({
	
	size: {x: 2, y:2},		
	type: ig.Entity.TYPE.NONE, // Player friendly group
	checkAgainst: ig.Entity.TYPE.NONE,
	collides: ig.Entity.COLLIDES.NEVER,
	bounciness: 0.6,
	lifetime: 1.0,
    fadetime: 0.75,
    gravityFactor:0,
    colors:['255, 0, 0','0,255,0','0,0,255','255,255,0','255,0,255','0,255,255','255,255,255'],
    color:'255,0,0',
    alpha:255,
	
	init: function( x, y, settings ) {
		// update random velocity to create starburst effect
	    this.vel = { x: (Math.random() < 0.5 ? -1 : 1)*Math.random()*100,
			 		 y: (Math.random() < 0.5 ? -1 : 1)*Math.random()*100 };

	    // send to parent
	    this.parent( x, y, settings );

	    this.idleTimer = new ig.Timer();
	    this.color = this.colors[Math.floor(Math.random()*6)];
	},
	update: function() {
		if(this.idleTimer.delta() > this.lifetime){
			this.kill();
			return;
	    }
	    this.alpha = this.idleTimer.delta().map( this.lifetime - this.fadetime, this.lifetime, 1, 0 );
        this.parent();
	},
	draw: function() {
        var ctx = ig.system.context;
        var s = ig.system.scale;
        var x = this.pos.x * s - ig.game.screen.x * s;
        var y = this.pos.y * s - ig.game.screen.y * s;
        var sizeX = this.size.x * s;
        var sizeY = this.size.y * s;
        ctx.save();
        ctx.fillStyle = 'rgba('+this.color+','+this.alpha+')';
        ctx.fillRect(x,y,sizeX,sizeY);
        this.parent();
        ctx.restore();
    }
});

EntityBullet = EntityProjectile.extend({
    size: {x: 8, y: 8},
    friction: {x: 0, y: 0},
    gravityFactor:0,
    speed: 500,
    owner:'',
    hitVel:200,
    
    type: ig.Entity.TYPE.B, // Evil enemy group
    checkAgainst: ig.Entity.TYPE.BOTH, // Check against friendly
    collides: ig.Entity.COLLIDES.NEVER,
            
    init: function( x, y, settings ) {
        this.parent( x, y, settings );

        this.idleTimer = new ig.Timer();

        this.maxVel.x = this.maxVel.y = this.speed; // allow full speed
        this.setVelocityByAngle(this.angle, this.speed);

    },
    setVelocityByAngle: function(angle, velocity) {
        this.vel.x = Math.cos(angle) * velocity;
        this.vel.y = Math.sin(angle) * velocity;
    },
    
    update: function() {
        if(this.idleTimer.delta() > 1){
            this.explode();
            return;
        }
        this.parent();
    },
        
    handleMovementTrace: function( res ) {
        this.parent( res );
        
        // collision with a wall? return!
        if( res.collision.x || res.collision.y) {
            this.explode();
        }
    },  
    explode: function(){
        //this.sound.play();
        this.kill();
    },
    
    check: function( other ) {
        if(other instanceof EntityPlayerbase && !(other.name == this.owner))
        {
            if(ig.game.inArena)
            {
                if(other.name == playerinfo.username)
                    ig.game.lasthit = this.owner;
                ig.game.socketEmit('playerhitprojectile',this.owner,other.name);
            }
            //hit other player
            if(this.vel.x > 0)
                other.hit = -2;
            else
                other.hit = 2;

            this.explode();
            //other.friction.x = 0;
            //other.vel.y = -other.jump;
        }
        if(other instanceof EntityPlayerhead)
        {
            if(this.vel.x > 0)
                other.vel.x = -this.hitVel;
            else
                other.vel.x = this.hitVel;
            other.vel.y = -this.hitVel;
        }
        if(this.owner == playerinfo.username && other instanceof EntityGoomba){
            other.kill();
            this.explode();
        }
        if(other instanceof EntityProjectile){
            other.explode();
            this.explode();
        }
    },
    draw: function() {
        var ctx = ig.system.context;
        var s = ig.system.scale;
        var x = this.pos.x * s - ig.game.screen.x * s;
        var y = this.pos.y * s - ig.game.screen.y * s;
        var sizeX = this.size.x * s;
        var sizeY = this.size.y * s;
        ctx.save();
        ctx.fillStyle = 'white';
        ctx.fillRect(x,y,sizeX,sizeY);
        this.parent();
        ctx.restore();
    }
});

});