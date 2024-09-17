ig.module(
	'game.entities.player'
)
.requires(
	'game.entities.playerbase'
)
.defines(function(){

EntityPlayer = EntityPlayerbase.extend({
    _wmScalable: false,
    _wmDrawBox: true,
    _wmBoxColor: 'rgba(196, 255, 0, 0.7)',
	screenShouldBe:0,
	moveTo:{x:0,y:0},
	autoMove:{x:0,y:0},

	//type: ig.Entity.TYPE.A, // Player friendly group
	//checkAgainst: ig.Entity.TYPE.B,

	init: function( x, y, settings ) {
		this.parent( x, y, settings );
		this.respawnTimer = new ig.Timer(0);
	},
	respawn: function(){
		if(this.isDead)
			return;
		this.isDead = true;
		this.respawnTimer.set(1);
	},	
    update: function(){
		if (this.respawnTimer.delta() > 0 && this.isDead){
			this.isDead = false;
			ig.game.spectator = false;
			ig.game.levelDeaths++;
			ig.game.resetLevel(false);
		}
		if(this.isDead)
			return;
		//touch movement
    	if(this.moveTo.x != 0)
    	{
			if(this.pos.x == this.moveTo.x || this.moveTo.x == 0
				|| (this.pos.x > this.moveTo.x && this.autoMove.x == 1)
				|| (this.pos.x < this.moveTo.x && this.autoMove.x == -1))
			{
				this.moveTo.x = 0;
				this.autoMove.x = 'stop';
			}
    		else if(this.pos.x > this.moveTo.x)
    		{
    			this.autoMove.x = -1;
			}
			else if(this.pos.x < this.moveTo.x)
    		{
				this.autoMove.x = 1;
			}
		}
		if(this.moveTo.y != 0)
		{
			if(this.pos.y <= this.moveTo.y || this.moveTo.y == 0 || this.vel.y > 0)
			{
				this.moveTo.y = 0;
				this.autoMove.y = 'stop';
			}
			else if(this.pos.y > this.moveTo.y)
			{
				this.autoMove.y = -1;
			}
    	}

		if((ig.game.currentLevel == 'LevelUnderground' || ig.game.currentLevel == 'LevelHell') && ig.game.lanternOn)
			this.reflectsLight = false;
		else
			this.reflectsLight = true;

        this.parent();

		if((ig.game.currentLevel == 'LevelUnderground' || ig.game.currentLevel == 'LevelHell') && ig.game.lanternOn)
		{
			this.setLight(0);
		}

			var xbuf = 128;
			var ybuf = 16;//ig.system.height/2;//48;
			var ybufbot = 32;

			var maxheight = ig.game.mainMap.height * ig.game.mainMap.tilesize - ig.system.height;			

			var player = this;
 

			if ((player.pos.x - ig.game.screen.x) > (ig.system.width - xbuf - player.size.x) && ig.game.screen.x < ig.game.mainMap.width * ig.game.mainMap.tilesize - ig.system.width) 
				ig.game.screen.x = ig.game.screen.x + (player.pos.x - ig.game.screen.x) - (ig.system.width - xbuf - player.size.x);
			if ((player.pos.x - ig.game.screen.x) < xbuf && ig.game.screen.x > 1) //moving left
				ig.game.screen.x = ig.game.screen.x + (player.pos.x - ig.game.screen.x) - xbuf;

			var skyfactor = 1;
			var scrollupline = ((ig.system.height-player.size.y*2)/2);
			if(ig.game.currentLevel.indexOf('*3') !== -1)
				scrollupline = ((ig.system.height-player.size.y*2)/1.5);
			//scroll up?
			if((this.standing || this.swimming || this.wasOnPlatform) && (player.pos.y + player.size.y - ig.game.screen.y) < scrollupline )//)(ig.game.mainMap.height * ig.game.mainMap.tilesize - ig.game.screen.y > ig.system.height - 32))
			{
				this.screenShouldBe = player.pos.y + player.size.y - ig.system.height+ybufbot;
				ig.game.screen.y += ((this.screenShouldBe-ig.game.screen.y)) * ig.system.tick;
			}//keep scrolling?
			else if(ig.game.screen.y > 0 && this.screenShouldBe != 0 && Math.abs(this.screenShouldBe-ig.game.screen.y) > 2)
			{
				ig.game.screen.y += ((this.screenShouldBe-ig.game.screen.y)) * ig.system.tick;
			}
			else //stop scrolling
			{
				this.screenShouldBe = 0;
			}
				//push down
				if ((player.pos.y + player.size.y - ig.game.screen.y) > (ig.system.height - ybufbot*skyfactor)) 
				{
					this.screenShouldBe = 0;
					ig.game.screen.y = player.pos.y + player.size.y - ig.system.height + ybufbot*skyfactor;
				}//push up
				if ((player.pos.y - ig.game.screen.y) < ybuf)
				{
					this.screenShouldBe = 0;
					ig.game.screen.y = ig.game.screen.y + (player.pos.y - ig.game.screen.y) - ybuf;// + player.size.y;
				}
			
//			if((ig.game.bigArea && ig.game.currentLevel != 'LevelUnderground') || ig.game.inArena)
//				skyfactor = ig.game.mainMap.height*ig.game.mainMap.tilesize/player.pos.y/2;
//			else if(ig.game.currentLevel != 'LevelUnderground')
//				ybuf = ig.game.mainMap.tilesize;
			//if(player.standing)
				//ybuf = 0;
/*
[ ]
---
[ ]
[x]
[x]
[ ]
---
[ ]
*/
			if(ig.game.screen.x > ig.game.mainMap.width * ig.game.mainMap.tilesize - ig.system.width)
				ig.game.screen.x = ig.game.mainMap.width * ig.game.mainMap.tilesize - ig.system.width;
			if(ig.game.screen.x < 0)
				ig.game.screen.x = 0;
			if(ig.game.screen.y < 0)
				ig.game.screen.y = 0;
			if(ig.game.screen.y > ig.game.mainMap.height * ig.game.mainMap.tilesize - ig.system.height - 0)
				ig.game.screen.y = ig.game.mainMap.height * ig.game.mainMap.tilesize - ig.system.height - 0;
    },
    check: function(other){
    	if( other instanceof EntityMover ) {
        	if(other.currentTarget == null && other.waitingForPlayer && !this.wasOnPlatform)
        	{
        		if(other instanceof EntityPlatform && this.pos.y > other.pos.y - this.size.y+2)
        		{
        			this.parent(other);
        			return;
        		}

        		other.waitingForPlayer = false;
        		other.checkTarget(other.lastTarget,1);
        	}
        }
    	this.parent(other);
    },
	handleMovementTrace: function(res){
		if(ig.game.inLevel)
		{
			if(res.tile.y == 46 || res.tile.x == 46)
			{
				this.respawn();
				return;
			}
		}
		this.parent(res);
    }
});


});