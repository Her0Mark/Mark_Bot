// Load up the discord.js library
const Discord = require("discord.js");

// This is your client. Some people call it `bot`, some people call it `self`, 
// some might call it `cootchie`. Either way, when you see `client.something`, or `bot.something`,
// this is what we're refering to. Your client.
const client = new Discord.Client();

// Here we load the config.json file that contains our token and our prefix values. 
const config = require("./config.json");
// config.token contains the bot's token
// config.prefix contains the message prefix.

client.on("ready", () => {
  // This event will run if the bot starts, and logs in, successfully.
  console.log(`Bot has started, with ${client.users.size} users, in ${client.channels.size} channels of ${client.guilds.size} guilds.`); 
  // Example of changing the bot's playing game to something useful. `client.user` is what the
  // docs refer to as the "ClientUser".
  client.user.setActivity(`Serving ${client.guilds.size} servers`);
});

client.on("guildCreate", guild => {
  // This event triggers when the bot joins a guild.
  console.log(`New guild joined: ${guild.name} (id: ${guild.id}). This guild has ${guild.memberCount} members!`);
  client.user.setActivity(`Serving ${client.guilds.size} servers`);
});

client.on("guildDelete", guild => {
  // this event triggers when the bot is removed from a guild.
  console.log(`I have been removed from: ${guild.name} (id: ${guild.id})`);
  client.user.setActivity(`Serving ${client.guilds.size} servers`);
});

client.on('guildMemberAdd', member => {
    member.send(
      `Welcome on the server! I'll message Mark to come online and meet you. Have a look around in the mean time 😀`
    )
  })



const bossIDs = ['319457567728205824', '537030589555933202'] // only these can command the bot
const bossNames = [] // only these can command the bot

const moment = require('moment')

const Agenda = require('agenda')
const agenda = new Agenda({
  db: {address: process.env.MONGO_CONNECTION_STRING},
  processEvery: '30 minutes'
});

const Discord = require('discord.io');
const bot = new Discord.Client({
    autorun: true,
    token: process.env.BOT_TOKEN
});

let getAGreeting = function(user) {
  let greetings = [
    "Wohoo!! Happy Birthday!!",
    "Wish You Many Happy Returns of this Day...",
    "Best Wishes for your Birthday! Now where's that Cake, buddy?",
    "May this be Yet Another Happy & Prosperous Year!",
    "Wish You a Great Year Ahead! Have a Blast!"
  ]
  return `@${user} ${greetings[Math.floor(Math.random()*greetings.length)]}`
}

let sendBirthdayMsg = function(user, channelID) {
    bot.sendMessage({
      to: channelID,
      message: getAGreeting(user)
  });
}

let scheduleWish = function(whoseBirthday, whenBirthday, channelID) {
  agenda
  .create('send birthday wish', {whoseBirthday, channelID})
  .schedule(whenBirthday)
  .repeatEvery('1 year')
  .save()
}

agenda.define('send birthday wish', function(job, done) {
  let data = job.attrs.data;
  sendBirthdayMsg(data.whoseBirthday, data.channelID)
  done()
});

agenda.on('ready', function() {
  console.log("Agenda Started...............")
  // agenda.every('1 minutes', 'send birthday wish');
  agenda.start();
});

function graceful() {
  agenda.stop(function() {
    process.exit(0);
  });
}
process.on('SIGTERM', graceful);
process.on('SIGINT' , graceful);


bot.on('ready', function(event) {
    console.log('Logged in as %s - %s\n', bot.username, bot.id);
});

bot.on('message', function(user, userID, channelID, message, event) {
  // console.log(user)
  // console.log(userID)
  // console.log(channelID)
  // console.log(message)
  // console.log(event)

  if (!message.includes(`<@${bot.id}>`)) return // ignore msgs not aimed at the bot

  let botSays = ''
  if (bossIDs.indexOf(userID) >= 0 || bossNames.indexOf(user)) { // user can command bot

    let cleanedMsg = message.replace(`<@${bot.id}>`,'').replace(/ +(?= )/g,'').trim()
    // parse the msg for command
    // Format expected: <username> <birthday as YYYY-MM-DD>
    let whoseBirthday = cleanedMsg.split(' ')[0]
    let whenBirthday = cleanedMsg.split(' ')[1]
    let whenBirthdayMoment = moment(whenBirthday, ['MM-DD','DD/MM'])
    if ( !whenBirthdayMoment.isValid() ) {
      botSays = `@${user} Sorry Boss, I dint get what you just said!`
    } else {
      if ( whenBirthdayMoment.isBefore(moment(), 'days') ) { // b'day is in past, except Today
        whenBirthdayMoment.add(1, 'year') // no belated wishes; see you next year
      }
      scheduleWish(whoseBirthday, whenBirthdayMoment.toDate(), channelID)
      botSays = `@${user} OK Boss! I'll wish "${whoseBirthday}" every year on ${whenBirthdayMoment.format("Do MMMM")}!`
    }

  } else {
    botSays = `@${user}  You Ain't My Master!`
  }

  bot.sendMessage({
    to: userID,
    message: botSays
  })  
});






client.on("message", async message => {
  // This event will run on every single message received, from any channel or DM.
  
  // It's good practice to ignore other bots. This also makes your bot ignore itself
  // and not get into a spam loop (we call that "botception").
  if(message.author.bot) return;
  
  // Also good practice to ignore any message that does not start with our prefix, 
  // which is set in the configuration file.
  if(message.content.indexOf(config.prefix) !== 0) return;
  
  // Here we separate our "command" name, and our "arguments" for the command. 
  // e.g. if we have the message "+say Is this the real life?" , we'll get the following:
  // command = say
  // args = ["Is", "this", "the", "real", "life?"]
  const args = message.content.slice(config.prefix.length).trim().split(/ +/g);
  const command = args.shift().toLowerCase();
  
  // Let's go with a few common example commands! Feel free to delete or change those.
  
  if(command === "ping") {
    // Calculates ping between sending a message and editing it, giving a nice round-trip latency.
    // The second ping is an average latency between the bot and the websocket server (one-way, not round-trip)
    const m = await message.channel.send("Ping?");
    m.edit(`Pong! Latency is ${m.createdTimestamp - message.createdTimestamp}ms. API Latency is ${Math.round(client.ping)}ms`);
  }
  
  if(command === "say") {
    // makes the bot say something and delete the message. As an example, it's open to anyone to use. 
    // To get the "message" itself we join the `args` back into a string with spaces: 
    const sayMessage = args.join(" ");
    // Then we delete the command message (sneaky, right?). The catch just ignores the error with a cute smiley thing.
    message.delete().catch(O_o=>{}); 
    // And we get the bot to say the thing: 
    message.channel.send(sayMessage);
  }
  
  if(command === "kick") {
    // This command must be limited to mods and admins. In this example we just hardcode the role names.
    // Please read on Array.some() to understand this bit: 
    // https://developer.mozilla.org/en/docs/Web/JavaScript/Reference/Global_Objects/Array/some?
    if(!message.member.roles.some(r=>["Administrator", "Moderator"].includes(r.name)) )
      return message.reply("Sorry, you don't have permissions to use this!");
    
    // Let's first check if we have a member and if we can kick them!
    // message.mentions.members is a collection of people that have been mentioned, as GuildMembers.
    // We can also support getting the member by ID, which would be args[0]
    let member = message.mentions.members.first() || message.guild.members.get(args[0]);
    if(!member)
      return message.reply("Please mention a valid member of this server");
    if(!member.kickable) 
      return message.reply("I cannot kick this user! Do they have a higher role? Do I have kick permissions?");
    
    // slice(1) removes the first part, which here should be the user mention or ID
    // join(' ') takes all the various parts to make it a single string.
    let reason = args.slice(1).join(' ');
    if(!reason) reason = "No reason provided";
    
    // Now, time for a swift kick in the nuts!
    await member.kick(reason)
      .catch(error => message.reply(`Sorry ${message.author} I couldn't kick because of : ${error}`));
    message.reply(`${member.user.tag} has been kicked by ${message.author.tag} because: ${reason}`);

  }
  
  if(command === "ban") {
    // Most of this command is identical to kick, except that here we'll only let admins do it.
    // In the real world mods could ban too, but this is just an example, right? ;)
    if(!message.member.roles.some(r=>["Administrator"].includes(r.name)) )
      return message.reply("Sorry, you don't have permissions to use this!");
    
    let member = message.mentions.members.first();
    if(!member)
      return message.reply("Please mention a valid member of this server");
    if(!member.bannable) 
      return message.reply("I cannot ban this user! Do they have a higher role? Do I have ban permissions?");

    let reason = args.slice(1).join(' ');
    if(!reason) reason = "No reason provided";
    
    await member.ban(reason)
      .catch(error => message.reply(`Sorry ${message.author} I couldn't ban because of : ${error}`));
    message.reply(`${member.user.tag} has been banned by ${message.author.tag} because: ${reason}`);
  }
  if(command === "clear") {
    // This command removes all messages from all users in the channel, up to 100.
    
    // get the delete count, as an actual number.
    const deleteCount = parseInt(args[0], 10);
    
    // Ooooh nice, combined conditions. <3
    if(!deleteCount || deleteCount < 2 || deleteCount > 100)
      return message.reply("Please provide a number between 2 and 100 for the number of messages to delete");
    
    // So we get our messages, and delete them. Simple enough, right?
    const fetched = await message.channel.fetchMessages({limit: deleteCount});
    message.channel.bulkDelete(fetched)
      .catch(error => message.reply(`Couldn't delete messages because of: ${error}`));
  }
});

//client.login(config.json);

client.login(process.env.BOT_TOKEN);

//client.login(config.token);
