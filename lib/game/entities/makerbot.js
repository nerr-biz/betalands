ig.module(
	'game.entities.makerbot'
)
.requires(
	'impact.entity'
)
.defines(function(){
EntityMakerbot = ig.Entity.extend({
	size: {x: 40, y: 40},
	gravityFactor:0,

	zIndex: -1,	
	level:'',

	animSheet: new ig.AnimationSheet( 'media/makerbot.png', 40, 40 ),
		
	type: ig.Entity.TYPE.NONE,
	checkAgainst: ig.Entity.TYPE.A,
	collides: ig.Entity.COLLIDES.PASSIVE,
			
	init: function( x, y, settings ) {
		this.addAnim( 'idle', 1, [0] );
		this.parent( x, y, settings );
	},
    update: function(){
        this.parent();
    },
    checkComplete: function(item, itemval, itemx, itemy) {
        
		//x = ig.game._rscreen.x + ig.input.mouse.x;
		//y = ig.game._rscreen.y + ig.input.mouse.y;
		x = this.pos.x+8;
		y = this.pos.y+8;
		vals = [];
		for(i=0;i<3;i++)
		{
			vals.push([]);
			for(j=0;j<3;j++)
			{
				vals[i].push(ig.game.bitsMap.getTile(x+i*8,y+j*8));
			}
		}

    var results = [
    /*
    ['block', [
      [1,[
        [1,1,1],
        [1,1,1],
        [1,1,1]
      ],3],
      [2,[
        [3,3,3],
        [3,3,3],
        [3,3,3]
      ],3],
      [3,[
        [3,3,3],
        [1,1,1],
        [1,1,1]
      ],3],
      [4,[
        [4,4,4],
        [4,4,4],
        [4,4,4]
      ],3]
      ]
    ],*/
	['bit', [
      [5,[
        [2,3,4],
        [2,3,4],
        [2,3,4]
      ],9],
      [6,[
        [7,8,9],
        [7,8,9],
        [7,8,9]
      ],9],
      [7,[
        [1,3,4],
        [1,3,4],
        [1,3,4]
      ],6],
      [8,[
        [2,1,4],
        [2,1,4],
        [2,1,4]
      ],6],
      [9,[
        [2,3,1],
        [2,3,1],
        [2,3,1]
      ],6]
      ]
    ],
    ['sign', [
		[1,[
			[1,1,1],
			[1,1,1],
			[3,1,3]
		],1]
    	]
    ],
	['door', [
		[1,[
			[2,2,1],
			[2,2,1],
			[2,2,1]
		],1],
    	[2,[
			[3,3,1],
			[3,3,1],
			[3,3,1]
		],1],
		[3,[
			[4,4,1],
			[4,4,1],
			[4,4,1]
		],1]
    	]
    ],
	['lantern', [
		[1,[
			[1,3,1],
			[3,9,3],
			[3,3,3]
		],1]
    	]
    ],
	['bomb', [
		[1,[
			[2,6,2],
			[6,2,6],
			[2,6,2]
		],1]
    	]
    ],
    ['youtube', [
		[1,[
			[6,6,6],
			[6,6,6],
			[2,2,2]
		],1]
    	]
    ],
    ['switchblock', [
		[1,[
			[1,6,1],
			[1,6,1],
			[1,5,1]
		],2]
    	]
    ]
    ];

		var match = false;
		var matchname = '';
		var matchval = 0;
		var matchcount = 0;
		foundmatch:
		for(r=0;r<results.length;r++){
			matchname = results[r][0];
			for(s=0;s<results[r][1].length;s++){
				match = true;
		        matchval  = results[r][1][s][0];
		        matchslots = results[r][1][s][1];
		        matchcount = results[r][1][s][2];
				breakout:
				for(i=0;i<3;i++)
				{
				  for(j=0;j<3;j++)
				  {
					if(vals[i][j]!=matchslots[j][i])
					{
				        match = false;
				        break breakout;
				  	}
				  }
				}
				if(match)
					break foundmatch;
			}
		}
		if(match)
		{
			//award
			console.log('MATCH!');
			ig.game.billboardMessage = 'You got a '+matchname+' !';
			/*if()
			{
				if(typeof ig.game.inventory[matchname] === 'undefined')
					ig.game.inventory[matchname] = [];
				if(typeof ig.game.inventory[matchname][matchval] === 'undefined')
					ig.game.inventory[matchname][matchval] = 0;
				if(ig.game.inventory[matchname][matchval] == 0)
				{
					for(var i=0;i<matchcount;i++)
					{
						socket.emit('giveitem', playerinfo.username, matchname, matchval, 0, 0, {});
						ig.game.inventory[matchname][matchval]++;
						ig.game.addInventory(matchname, matchval);
					}
				}
			}
			else*/
				ig.game.socketEmit('itemuse', 'makerbot', this.pos.x, this.pos.y, {item:item, itemval:itemval, itemx:itemx, itemy:itemy});
		}

    }
    });	
});