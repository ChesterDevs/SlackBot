var fs = require('fs');

var config = null;

config = JSON.parse(fs.readFileSync('../bot_config/config.json', 'utf8'));

var Bot = require('slackbots');
var settings = {
	token: config.slack.token,
	name: config.slack.name
};

var meetup = require('meetup-api')({key: config.meetup.key});

var FB = require('fb');

var bot = new Bot(settings);

var body = {
	appID: config.facebook.appId,
	secret: config.facebook.appSecret
};

function bot_facebook(channel) {
	console.log("Fetching Facebook Post");

	FB.api('/991180877618552/feed?access_token=' + config.facebook.appId + "|" + config.facebook.appSecret, 'get', body, function (res) {
		
		if(res.data == undefined || res.data == null) {
			bot.postMessage(channel, "Sorry, I can't do that right now, Dave");
			console.log(res);
			return;
		}

		var post = res.data[0];
		console.log(res);

		bot.postMessage(channel, post.message, {
			attachments: [
				{
					text: "https://www.facebook.com/" + post.id,
					image_url: post.picture
				}
			]
		});
	});
}

function bot_social(channel) {
	var facebook = "<https://www.facebook.com/groups/chesterdevs/|Facebook>";
	var twitter = "<https://twitter.com/ChesterDevs|Twitter>";
	var linkedin = "<https://www.linkedin.com/groups/5160543/profile|LinkedIn>";
	var meetup = "<http://www.meetup.com/Chester-Devs/|Meetup>";

	bot.postMessage(channel, "Links to ChesterDevs Social Media Accounts",
	{
		attachments: [
			{text: facebook},
			{text: twitter},
			{text: linkedin},
			{text: meetup},
		]
		, unfurl_links: true
	})
}

function bot_next_event(channel) {
	meetup.getGroup({
		urlname: 'Chester-Devs'
	}, function(err, resp) {	
		if(err) {
			bot.postMessage(channel, "Sorry, I can't do that right now, Dave");
			return;
		}

		var next_event = resp.next_event;
		var response = "Next Event " + new Date(next_event.time).toString() + ": [" + next_event.name + "] with " + next_event.yes_rsvp_count + " members ";

		bot.postMessage(channel, response, {attachments: [{text: resp.link + "events/" + next_event.id, image_url: resp.group_photo.photo_link}], unfurl_links: true});
	});
}

function bot_say(words, channel) {
	try {
		var response = "";

		for(var i = 3; i < words.length; i++) {
			response += (" "  + words[i]);
		}

		bot.postMessage(words[2], response);
	} catch (e) {

	}	
}

function processMessage(message) {
	if(message.type != "message") {
		return;
	}

	if(message.text == undefined) {		
		return;
	}

	var words = message.text.split(" ");

	if(words && words.length > 1) {
		if(words[0] == "!chesterdev") {
			var command = words[1];
			switch(command) {
				case "say":				
					bot_say(words, message.channel);
					break;

				case "event":
					bot_next_event(message.channel);
					break;

				case "social":
					bot_social(message.channel);
					break;

				case "facebook":
					bot_facebook(message.channel);
					break;

				default:
					bot.postMessage(message.channel, "Sorry, I can't do that right now, Dave");
					break;
			}
		}
	}	
}

bot.on('start', function () {
	console.log("SlackBot Started");
	bot.on('message', processMessage);
});