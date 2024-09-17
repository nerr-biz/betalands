ig.module(
	'game.entities.mover'
)
.requires(
	'impact.entity'
)
.defines(function(){
	
EntityMover = ig.Entity.extend({
	type: ig.Entity.TYPE.B, // Evil enemy group
	checkAgainst: ig.Entity.TYPE.BOTH, // Check against friendly
	collides: ig.Entity.COLLIDES.PASSIVE,
	
	gravityFactor: 0,
	
	spawn: {x:0,y:0},

	currentTarget:null,
	lastTarget:null,
	firstTarget:null,
	speed:40, //pixels per second.
	waitingForPlayer:false,
	targetsPos:[],

	init: function( x, y, settings ) {
		this.parent( x, y, settings );
		this.spawn.x = x;
		this.spawn.y = y;
	},
	update: function() {

		var oldDistance = 0;
		var target = this.currentTarget;
		if( target ) {
			oldDistance = this.distanceTo(target);
			
			var angle = this.angleTo( target );
			this.vel.x = Math.cos(angle) * this.speed;
			this.vel.y = Math.sin(angle) * this.speed;
		}
		else {
			//this.vel.x = 0;
			//this.vel.y = 0;
		}		
		
		this.parent();

		if(!target)
			return;
		
		// Are we close to the target or has the distance actually increased?
		// -> Set new target
		var newDistance = this.distanceTo(target);
		if( target && (newDistance > oldDistance || newDistance < 0.5) ) {
			//arrived
			this.pos.x = target.pos.x + target.size.x/2 - this.size.x/2;
			this.pos.y = target.pos.y + target.size.y/2 - this.size.y/2;
			//this.vel = {x:0,y:0};
			//find next target?

			if(!this.checkTarget(target, target.val))
				this.vel = {x:0,y:0};

		}
	},
    check: function( other ) 
	{
		if( other instanceof EntityTarget && this.currentTarget == null && other.val != 4 && (other.val != 5 || !this.waitingForPlayer)) {
			this.checkTarget(other, other.val);
		}
	},
	addTargetPos: function(pos){
		this.targetsPos.push(pos.x+'-'+pos.y);
	},
	targetsPosContains: function(pos){
		return ($.inArray(pos.x+'-'+pos.y, this.targetsPos) > -1);
	},
	checkTarget: function(other, val)
	{
		this.gravityFactor = 0;
		this.collides = ig.Entity.COLLIDES.PASSIVE;
		var tempTarget = this.currentTarget;
		if(tempTarget == null)
			tempTarget = other;
		if(this.currentTarget == this.firstTarget && this.currentTarget != null)
		{
			this.currentTarget = null;
			this.firstTarget = null;
			this.targetsPos = [];
			return null;
		}

		if(val == 1)
		{
			//find the closest target and move to it
			var targets = ig.game.getEntitiesByType(EntityTarget);
			var closestTarget = null
			var distance = 999999999;
			for(var i=0;i<targets.length;i++)
			{
				var target = targets[i];
				if(target == other)
					continue;
				var td = this.distanceTo(target);					
				if(td < distance)
				{
					closestTarget = target;
					distance = td;
				}
			}
			this.currentTarget = closestTarget;
		}
		if(val == 2)
		{
			//find the closest target that's not the last
			var targets = ig.game.getEntitiesByType(EntityTarget);
			var closestTarget = null
			var distance = 999999999;
			for(var i=0;i<targets.length;i++)
			{
				var target = targets[i];
				if(target == other || this.targetsPosContains(target.pos))
					continue;
				var td = this.distanceTo(target);					
				if(td < distance)
				{
					closestTarget = target;
					distance = td;
				}
			}
			this.currentTarget = closestTarget;
		}
		if(val == 3)
		{
			this.currentTarget = this.firstTarget;
		}
		if(val == 4)
		{
			this.currentTarget = null;
		}
		if(val == 5 && !this.waitingForPlayer)
		{
			this.currentTarget = null;
			this.waitingForPlayer = true;
		}
		this.lastTarget = tempTarget;
		this.addTargetPos(tempTarget.pos);
		if(this.firstTarget == null)
			this.firstTarget = other;
		if(this.currentTarget == null)
			this.targetsPos = [];
		return this.currentTarget;
	},
	handleMovementTrace: function( res ) {
		//ignore collision
		if(this.gravityFactor == 0){
		res.collision.x = false;
		res.pos.x = this.pos.x + this.vel.x * ig.system.tick;
		res.collision.y = false;
		res.pos.y = this.pos.y + this.vel.y * ig.system.tick;
		}
		this.parent( res );
	}
});

});