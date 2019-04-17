const Discord = require('discord.js');
const client = new Discord.Client();
const queue = new Map();
const prefix = "1"
/////////////////////////////////////////////////////////////////////////////////////////////////////////

 
var Util = require('discord.js');
 
var getYoutubeID = require('get-youtube-id'); // npm i get-youtube-id
 
var fetchVideoInfo = require('youtube-info'); // npm i youtube-info
 
var YouTube = require('simple-youtube-api'); // npm i dsimple-youtube-api
 
var youtube = new YouTube("AIzaSyAdORXg7UZUo7sePv97JyoDqtQVi3Ll0b8");

 
var ytdl = require('ytdl-core'); // npm i ytdl-core
 
var fs = require('fs'); // npm i fs
 
var gif = require("gif-search"); // npm i gif-search
 

/////////////////////////
////////////////////////
/////////////////////////
////////////////////////
//////////////////////
/////////////////////////
////////////////////////
//////////////////////
/////////////////////////
////////////////////////
//////////////////////
 
/////////////////////////
////////////////////////
//////////////////////
/////////////////////////
////////////////////////
//////////////////////
client.on('message', async msg => {
    if (msg.author.bot) return undefined;
    if (!msg.content.startsWith(prefix)) return undefined;
   
    const args = msg.content.split(' ');
    const searchString = args.slice(1).join(' ');
   
    const url = args[1] ? args[1].replace(/<(.+)>/g, '$1') : '';
    const serverQueue = queue.get(msg.guild.id);
 
    let command = msg.content.toLowerCase().split(" ")[0];
    command = command.slice(prefix.length)
 
    if (command === `play`) {
        const voiceChannel = msg.member.voiceChannel;
       
        if (!voiceChannel) return msg.channel.send("انت لم تدخل روم صوتي");
       
        const permissions = voiceChannel.permissionsFor(msg.client.user);
       
        if (!permissions.has('CONNECT')) {
 
            return msg.channel.send("ليست لدي صلاحيات للدخول الى الروم");
        }
       
        if (!permissions.has('SPEAK')) {
 
            return msg.channel.send("انا لا يمكنني التكلم في هاذه الروم");
        }
 
        if (!permissions.has('EMBED_LINKS')) {
 
            return msg.channel.sendMessage("انا لا املك صلاحيات ارسال روابط")
        }
 
        if (url.match(/^https?:\/\/(www.youtube.com|youtube.com)\/playlist(.*)$/)) {
 
            const playlist = await youtube.getPlaylist(url);
            const videos = await playlist.getVideos();
           
 
            for (const video of Object.values(videos)) {
               
                const video2 = await youtube.getVideoByID(video.id);
                await handleVideo(video2, msg, voiceChannel, true);
            }
            return msg.channel.send(`**${playlist.title}**, Just added to the queue!`);
        } else {
 
            try {
 
                var video = await youtube.getVideo(url);
               
            } catch (error) {
                try {
 
                    var videos = await youtube.searchVideos(searchString, 5);
                    let index = 0;
                    const embed1 = new Discord.RichEmbed()
                    .setTitle(":mag_right:  YouTube Search Results :")
                    .setDescription(`
                    ${videos.map(video2 => `${++index}. **${video2.title}**`).join('\n')}`)
                   
                    .setColor("#f7abab")
                    msg.channel.sendEmbed(embed1).then(message =>{message.delete(20000)})
                   
/////////////////                  
                    try {
 
                        var response = await msg.channel.awaitMessages(msg2 => msg2.content > 0 && msg2.content < 11, {
                            maxMatches: 1,
                            time: 15000,
                            errors: ['time']
                        });
                    } catch (err) {
                        console.error(err);
                        return msg.channel.send('لم يتم اختيار الاغنية');
                    }
                   
                    const videoIndex = parseInt(response.first().content);
                    var video = await youtube.getVideoByID(videos[videoIndex - 1].id);
                   
                } catch (err) {
 
                    console.error(err);
                    return msg.channel.send("I didn't find any results!");
                }
            }
 
            return handleVideo(video, msg, voiceChannel);
           
        }
       
    } else if (command === `skip`) {
 
        if (!msg.member.voiceChannel) return msg.channel.send("يجب ان تكون في روم صوتي");
        if (!serverQueue) return msg.channel.send("ليست هناك اغاني ليتم التخطي");
 
        serverQueue.connection.dispatcher.end('تم تخطي الاغنية');
        return undefined;
       
    } else if (command === `stop`) {
 
        if (!msg.member.voiceChannel) return msg.channel.send("يجب ان تكون في روم صوتي");
        if (!serverQueue) return msg.channel.send("There is no Queue to stop!!");
       
        serverQueue.songs = [];
        serverQueue.connection.dispatcher.end('تم ايقاف الاغنية لقد خرجت من الروم الصوتي');
        return undefined;
       
    } else if (command === `vol`) {
 
        if (!msg.member.voiceChannel) return msg.channel.send("يجب ان تكون في روم صوتي");
        if (!serverQueue) return msg.channel.send('يعمل الامر فقط عند تشغيل مقطع صوتي');
        if (!args[1]) return msg.channel.send(`لقد تم تغير درجة الصوت الى**${serverQueue.volume}**`);
       
        serverQueue.volume = args[1];
        serverQueue.connection.dispatcher.setVolumeLogarithmic(args[1] / 50);
       
        return msg.channel.send(`درجة الصوت الان**${args[1]}**`);
 
    } else if (command === `np`) {
 
        if (!serverQueue) return msg.channel.send('There is no Queue!');
        const embedNP = new Discord.RichEmbed()
        .setDescription(`Now playing **${serverQueue.songs[0].title}**`)
        return msg.channel.sendEmbed(embedNP);
       
    } else if (command === `queue`) {
       
        if (!serverQueue) return msg.channel.send('There is no Queue!!');
        let index = 0;
//  //  //
        const embedqu = new Discord.RichEmbed()
        .setTitle("The Queue Songs :")
        .setDescription(`
        ${serverQueue.songs.map(song => `${++index}. **${song.title}**`).join('\n')}
**Now playing :** **${serverQueue.songs[0].title}**`)
        .setColor("#f7abab")
        return msg.channel.sendEmbed(embedqu);
    } else if (command === `pause`) {
        if (serverQueue && serverQueue.playing) {
            serverQueue.playing = false;
            serverQueue.connection.dispatcher.pause();
            return msg.channel.send('تم الايقاف');
        }
        return msg.channel.send('في انتظار تشغيل المقطع');
    } else if (command === "resume") {
 
        if (serverQueue && !serverQueue.playing) {
            serverQueue.playing = true;
            serverQueue.connection.dispatcher.resume();
            return msg.channel.send('تم التشغيل');
           
        }
        return msg.channel.send('Queue is empty!');
    }
 
    return undefined;
});
 
async function handleVideo(video, msg, voiceChannel, playlist = false) {
    const serverQueue = queue.get(msg.guild.id);
    console.log(video);
   
 
    const song = {
        id: video.id,
        title: Util.escapeMarkdown(video.title),
        url: `https://www.youtube.com/watch?v=${video.id}`
    };
    if (!serverQueue) {
        const queueConstruct = {
            textChannel: msg.channel,
            voiceChannel: voiceChannel,
            connection: null,
            songs: [],
            volume: 5,
            playing: true
        };
        queue.set(msg.guild.id, queueConstruct);
 
        queueConstruct.songs.push(song);
 
        try {
            var connection = await voiceChannel.join();
            queueConstruct.connection = connection;
            play(msg.guild, queueConstruct.songs[0]);
        } catch (error) {
            console.error(`I could not join the voice channel: ${error}!`);
            queue.delete(msg.guild.id);
            return msg.channel.send(`Can't join this channel: ${error}!`);
        }
    } else {
        serverQueue.songs.push(song);
        console.log(serverQueue.songs);
        if (playlist) return undefined;
        else return msg.channel.send(`**${song.title}**, تمت اضافة المقطع الى قائمة الانتظار `);
    }
    return undefined;
}
 
function play(guild, song) {
    const serverQueue = queue.get(guild.id);
 
    if (!song) {
        serverQueue.voiceChannel.leave();
        queue.delete(guild.id);
        return;
    }
    console.log(serverQueue.songs);
 
    const dispatcher = serverQueue.connection.playStream(ytdl(song.url))
        .on('end', reason => {
            if (reason === 'Stream is not generating quickly enough.') console.log('Song ended.');
            else console.log(reason);
            serverQueue.songs.shift();
            play(guild, serverQueue.songs[0]);
        })
        .on('error', error => console.error(error));
    dispatcher.setVolumeLogarithmic(serverQueue.volume / 5);
 
    serverQueue.textChannel.send(`**${song.title}**, is now playing!`);
}
 
const devs = ["530062292969062412","508574921010577409"]
client.on('message', message => {

	var command = message.content.toLowerCase().split(" ")[0];
	
	if(message.author.bot) return;
	if(message.channel.type === 'dm') return;
	
// كود تغيير الاسم والافتار وحالة اللعب
	if(command == prefix + 'setname') {
		let timecooldown = '1hour';
		if(!devs.includes(message.author.id)) return;
		if(cooldownSetName.has(message.author.id)) return message.reply(`**${ms(ms(timecooldown))}** يجب عليك الانتظار`);
		if(!args1) return message.channel.send(`**➥ Useage:** ${prefix}setname \`\`FlixBot\`\``).then(msg => msg.delete(7000));
		if(args1 == client.user.username) return message.reply('**البوت مسمى من قبل بهذا الاسم**').then(msg => msg.delete(5000));
		
		cooldownSetName.add(message.author.id);
		client.user.setUsername(args1);
		message.reply(`\`\`${args1}\`\` **تم تغيير اسم البوت الى**`);
		
		setTimeout(function() {
			cooldownSetName.delete(message.author.id);
		}, ms(timecooldown));
	}
		if(command == prefix + 'setavatar') {
			if(!devs.includes(message.author.id)) return;
			if(!args1) return message.channel.send(`**➥ Useage:** ${prefix}setavatar \`\`Link\`\``).then(msg => msg.delete(7000));
			
			client.user.setAvatar(args1).catch(err => console.log(err)).then
			return message.reply('**حاول مرة اخرى في وقت لاحق**').then(msg => msg.delete(5000));
			
			let avatarbot = new Discord.RichEmbed()
			.setTitle(`:white_check_mark: **تم تغيير صورة البوت الى**`)
			.setImage(args1)
			.setTimestamp()
			.setFooter(`by: ${message.author.username}#${message.author.discriminator}`, message.author.avatarURL)
			message.channel.send(avatarbot).then(msg => msg.delete(7000));
			message.delete();
		}
		if(command == prefix + 'setplay') {
			if(!devs.includes(message.author.id)) return;
			if(!args1) return message.channel.send(`**➥ Useage:** ${prefix}setplay \`\`www.Flix-Host.com\`\``).then(msg => msg.delete(7000));
			client.user.setActivity(args1);
			message.reply(`\`\`${args1}\`\` **تم تغيير حالة اللعب الى**`).then(msg => msg.delete(5000));
			message.delete();
		};
		if(command == prefix + 'setwatch') {
			if(!devs.includes(message.author.id)) return;
			if(!args1) return message.channel.send(`**➥ Useage:** ${prefix}setwatch \`\`www.Flix-Host.com\`\``).then(msg => msg.delete(7000));
			client.user.setActivity(args1, { type: 'WATCHING' });
			message.reply(`\`\`${args1}\`\` **تم تغيير حالة المشاهدة الى**`).then(msg => msg.delete(5000));
			message.delete();
		};
		if(command == prefix + 'setlisten') {
			if(!devs.includes(message.author.id)) return;
			if(!args1) return message.channel.send(`**➥ Useage:** ${prefix}setlisten \`\`www.Flix-Host.com\`\``).then(msg => msg.delete(7000));
			client.user.setActivity(args1, { type: 'LISTENING' });
			message.reply(`\`\`${args1}\`\` **تم تغيير حالة السماع الى**`).then(msg => msg.delete(5000));
			message.delete();
		};
	    if(command == prefix + 'setstream') {
			if(!devs.includes(message.author.id)) return;
			if(!args1) return message.channel.send(`**➥ Useage:** ${prefix}setstream \`\`www.Flix-Host.com\`\``).then(msg => msg.delete(7000));
			client.user.setActivity(args1, 'https://www.twitch.tv/xiaboodz_');
			message.reply(`\`\`${args1}\`\` **تم تغيير حالة البث الى**`).then(msg => msg.delete(5000));
			message.delete();
		};


});


client.login(process.env.BOT_TOKEN);







