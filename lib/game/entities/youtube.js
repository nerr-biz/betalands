ig.module(
	'game.entities.youtube'
)
.requires(
	'impact.entity'
)
.defines(function(){
EntityYoutube = ig.Entity.extend({
	size: {x: 56, y: 40},
	gravityFactor:0,

	zIndex: 10,	
	level:'',
	time:0,
	playlistIndex:0,
	interval:null,
	state:-1,

	animSheet: new ig.AnimationSheet( 'media/youtube.png', 56, 40 ),
	origImage: 'media/youtube.png',
		
	type: ig.Entity.TYPE.NONE,
	checkAgainst: ig.Entity.TYPE.A,
	collides: ig.Entity.COLLIDES.PASSIVE,
			
	init: function( x, y, settings ) {
		this.addAnim( 'idle', 1, [0] );
		this.parent( x, y, settings );

		//just link to yt video
		if(this.playlist.length > 0)
		{
			$("#youtube").attr('href','https://www.youtube.com/playlist?list='+this.playlist);
		}
		else if(this.video.length > 0)
		{
			$("#youtube").attr('href','https://www.youtube.com/watch?v='+this.video);
		}


		if(ytplayerready)
		{			
			ytplayer.stopVideo();
			if(this.playlist.length > 0)
			{
				ytplayer.loadPlaylist({
					list:this.playlist,
					index:this.playlistIndex,
					startSeconds:this.time
				});
				//var playListURL = 'http://gdata.youtube.com/feeds/api/playlists/'+this.playlist+'?v=2&alt=json';
				//$.getJSON(playListURL, this.parsePlaylist(this.playlistIndex, this.time));
			}
			else if(this.video.length > 0)
			{
				ytplayer.loadVideoById(this.video, this.time);
				//var videoURL = 'https://gdata.youtube.com/feeds/api/videos/'+this.video+'?v=2&alt=json';
				//$.getJSON(videoURL, this.parseVideo(this.video, this.playlistIndex, this.time));
			}

			if(this.state == 2)
				ytplayer.pauseVideo();
			if(this.state == 3)
    			ytplayer.pauseVideo();
			if(this.state == 0)
				ytplayer.stopVideo();
			if(this.state == 5)
			{
				ytplayer.stopVideo();
			}

			var split = ig.game.currentLevel.split("|");
			if(ig.game.currentLevel.indexOf('|') > -1 && split[1] == playerinfo.username )
			{
				this.interval = setInterval(
					(function(self) {
    					return function() {self.checkStatus(); } 
    				} )(this),
					5000 );
			}
		}
	},
	parsePlaylist: function(index, time){
		return function(data) {
			var videos = [];
		    $.each(data.feed.entry, function(i, item) {
		    	var feedURL = item.link[1].href;
				var fragments = feedURL.split("/");
		        var videoID = fragments[fragments.length - 2];
		    	videos.push(videoID);
		    });
		    ytplayer.loadPlaylist(videos, index, time, 'small');
			ytplayer.setLoop(1);
		}
	},
	parseVideo: function(videoID, index, time){
		return function(data) {
			var duration = data.entry['media$group']['yt$duration']['seconds'];
			if(time >= duration - 5)
			{
				time = 0;
			}
			var videos = [];
	    	videos.push(videoID);
		    ytplayer.loadPlaylist(videos, index, time, 'small');
		}
	},
    update: function(){
        this.parent();
    },
    draw: function(){
    	var x,y;
		x = (this.pos.x+8-ig.game._rscreen.x)*ig.system.scale;
		y = (this.pos.y+8-ig.game._rscreen.y)*ig.system.scale;
		if(ig.game.billboardMessage)
		{
			x = -10000;
			y = -10000;
		}
    	$("#youtube").css({
    		width:(this.size.x-16)*ig.system.scale,
    		height:(this.size.y-16)*ig.system.scale,
	        position: "absolute",
	        top: y + "px",
	        left: x + "px"
		});
		/*$("#youtubeplayer").css({
    		width:(this.size.x-16)*ig.system.scale,
    		height:(this.size.y-16)*ig.system.scale,
		});*/
    	this.parent();
    },
	kill : function() {
		clearInterval(this.interval);
		if(ytplayerready){
			ytplayer.stopVideo();
		}
		$("#youtube").css({
			width:"1px",
			height:"1px",
			top: "-10000px",
			left: "-10000px"
		});
		this.parent();
	},
    checkStatus: function(){
		ig.game.socketEmit('updateitem', 'youtube', 1, this.pos.x, this.pos.y, {video:this.video, playlist:this.playlist, time:ytplayer.getCurrentTime(),state:ytplayer.getPlayerState(), playlistIndex:ytplayer.getPlaylistIndex()});
    },
    playlistLoaded: function(){
    	//var duration = ytplayer.getDuration();
		//ytplayer.seekTo(this.time, true);
    },
    videoEnded: function(){
		ytplayer.seekTo(0, true);
    },
    updateItem: function(time, state, index){
    	if(state!=ytplayer.getPlayerState())
    	{
    		if(state == 0)
    			ytplayer.stopVideoA();
    		if(state == 1)
    			ytplayer.playVideoAt(index);
    		if(state == 2)
    			ytplayer.pauseVideo();
			if(state == 3)
    			ytplayer.pauseVideo();
    		if(state == 5)
    			ytplayer.stopVideo();
    	}
    	if(index != ytplayer.getPlaylistIndex())
    		ytplayer.playVideoAt(index);
    	else
    	{
    		if(Math.abs(ytplayer.getCurrentTime() - time) > 1)
    			ytplayer.seekTo(time, true);
    	}
    }

    });	
});