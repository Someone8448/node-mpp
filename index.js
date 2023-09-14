require("dotenv").config();
const rl = new (require("readline").Interface)({
    input: process.stdin,
    output: process.stdout,
    prompt: ""
});
const fs = require("fs");
const d = require("./db.js");
var db = d("data.json", { mutes: [], volume: {} });
db.read();
var getVolume = id => {
    if (db.data.volume[id] === undefined) return 1;
    return db.data.volume[id];
};
const config = require("./config.json");
const convert = require("color-convert");
var message = "";
var output = "Type 'help' to begin.";
process.stdin.setRawMode(true);
process.stdin.on("keypress", (key, info) => {
    if (info.name === "return") {
        var cmd = message.split(" ")[0];
        var args = message.substr(cmd.length).trim();
        var argsplit = args.split(" ");
        message = "";
        if (cmd === "test") output = "hi there";
        if (cmd === "help")
            output = "Commands: test, help, channel, mute, volume, say";
        if (cmd === "channel") client.setChannel(args);
        if (cmd === "mute") {
            if (args.length == 0)
                return (output = "Usage: mute [id] (boolean)");
            if (!["true", "false"].includes(argsplit[1]))
                return (output = "Invalid Boolean: true or false.");
            if (argsplit[1] === "false") {
                output = `Unmuted ${argsplit[0]}`;
                if (db.data.mutes.includes(argsplit[0]))
                    db.data.mutes.splice(db.data.mutes.indexOf(argsplit[0], 1));
            }
            if (argsplit[1] === "true") {
                output = `Muted ${argsplit[0]}`;
                db.data.mutes.push(argsplit[0]);
            }
            db.write();
        }
        if (cmd === "volume") {
            if (args.length == 0)
                return (output = "Usage: volume [id] [percent]");
            var volume = Math.floor(Number(argsplit[1]));
            if (isNaN(volume)) return (output = "Invalid Number");
            if (volume > 100) volume = 100;
            if (volume < 0) volume = 0;
            db.data.volume[argsplit[0]] = volume / 100;
            db.write();
            output = `Set ${argsplit[0]}'s volume to ${volume}%`;
        }
        if (cmd === "say") client.sendArray([{ m: "a", message: args }]);
    } else if (info.name === "backspace") {
        message = message.substr(0, message.length - 1);
    } else message += info.sequence;
});
const client = new (require("mppclone-client"))(
    config.uri,
    process.env.MPPCLONE_TOKEN
);
var test = true;
client.start();
client.setChannel("lobby");
const midikeys = [
    "a-1",
    "as-1",
    "b-1",
    "c0",
    "cs0",
    "d0",
    "ds0",
    "e0",
    "f0",
    "fs0",
    "g0",
    "gs0",
    "a0",
    "as0",
    "b0",
    "c1",
    "cs1",
    "d1",
    "ds1",
    "e1",
    "f1",
    "fs1",
    "g1",
    "gs1",
    "a1",
    "as1",
    "b1",
    "c2",
    "cs2",
    "d2",
    "ds2",
    "e2",
    "f2",
    "fs2",
    "g2",
    "gs2",
    "a2",
    "as2",
    "b2",
    "c3",
    "cs3",
    "d3",
    "ds3",
    "e3",
    "f3",
    "fs3",
    "g3",
    "gs3",
    "a3",
    "as3",
    "b3",
    "c4",
    "cs4",
    "d4",
    "ds4",
    "e4",
    "f4",
    "fs4",
    "g4",
    "gs4",
    "a4",
    "as4",
    "b4",
    "c5",
    "cs5",
    "d5",
    "ds5",
    "e5",
    "f5",
    "fs5",
    "g5",
    "gs5",
    "a5",
    "as5",
    "b5",
    "c6",
    "cs6",
    "d6",
    "ds6",
    "e6",
    "f6",
    "fs6",
    "g6",
    "gs6",
    "a6",
    "as6",
    "b6",
    "c7"
];
const easymidi = require("easymidi");
const midi = new easymidi.Output(config.output);
client.on("n", n => {
    if (db.data.mutes.includes(n.p)) return;
    if (test) {
        var mapped = {};
        n.n.forEach(a => {
            if (!mapped[a.d]) mapped[a.d] = [];
            mapped[a.d].push(a);
        });
        Object.keys(mapped).forEach(t => {
            setTimeout(() => {
                mapped[t].forEach(a => {
                    if (a.s)
                        return midi.send("noteoff", {
                            note: midikeys.indexOf(a.n) + 21,
                            velocity: 0,
                            channel: 1
                        });
                    midi.send("noteon", {
                        note: midikeys.indexOf(a.n) + 21,
                        velocity: Math.floor(a.v * 128) * getVolume(n.p),
                        channel: 1
                    });
                });
            }, Number(t));
        });
        // if (a.s) return setTimeout(() => midi.send('noteoff', {note: midikeys.indexOf(a.n) + 21, velocity: 0, channel: 1}),a.d)
        //        setTimeout(() => midi.send('noteon', {note: midikeys.indexOf(a.n) + 21, velocity: Math.floor(a.v * 128), channel: 1}),a.d)
    } else {
        n.n.forEach(a => {
            if (a.s)
                return setTimeout(
                    () =>
                        midi.send("noteoff", {
                            note: midikeys.indexOf(a.n) + 21,
                            velocity: 0,
                            channel: 1
                        }),
                    a.d
                );
            setTimeout(
                () =>
                    midi.send("noteon", {
                        note: midikeys.indexOf(a.n) + 21,
                        velocity: Math.floor(a.v * 128) * getVolume(n.p),
                        channel: 1
                    }),
                a.d
            );
        });
    }
});
var nps = { nps: {} };
var keypresses = {};
midikeys.forEach(key => (keypresses[key] = false));
client.on("n", msg => {
    var date = Date.now();
    if (!nps.nps[msg.p]) nps.nps[msg.p] = {};
    Object.keys(nps.nps[msg.p])
        .filter(a => date - 1000 > a)
        .forEach(a => delete nps.nps[msg.p][a]);
    nps.nps[msg.p][date] = msg.n.filter(n => n.s != 1).length;
});
nps.getNps = id => {
    if (!nps.nps[id]) return 0;
    var date = Date.now();
    Object.keys(nps.nps[id])
        .filter(a => date - 1000 > a)
        .forEach(a => delete nps.nps[id][a]);
    var n = 0;
    Object.values(nps.nps[id]).forEach(a => (n += a));
    return n;
};
(async () => {
    var chalk = await import("chalk");
    var chalk = new chalk.Chalk();
    setInterval(() => {
        console.clear();
        process.stdout.write(
            (message.length == 0
                ? chalk.hex("#666666")("You can type here.")
                : chalk.hex("#008800")(message)) +
                `\n\nChannel: ${client.desiredChannelId}\n\n` +
                Object.values(client.ppl)
                    .map(
                        p =>
                            `[` +
                            (db.data.mutes.includes(p._id)
                                ? chalk.hex("#ff0000")(p._id)
                                : p._id) +
                            `] ${chalk.bgHex(p.color)(p.name)} - ` +
                            chalk.hex(
                                convert.rgb.hex(
                                    Math.floor(getVolume(p._id) * -255) + 255,
                                    Math.floor(getVolume(p._id) * 255),
                                    0
                                )
                            )(`${nps.getNps(p._id)} NPS`)
                    )
                    .join("\n") +
                "\n\n" +
                chat.join("\n") +
                "\n\n" +
                output +
                "\n"
        );
    }, 500);
    var chat = [];

    client.on("a", msg => {
        chat.push(
            `[${msg.p._id}] ${chalk.bgHex(msg.p.color)(msg.p.name)}: ${msg.a}`
        );
        if (chat.length > 10) chat.splice(0, 1);
    });
    client.on("c", c => {
        chat = [];
        c.c
            .filter(a => a.m === "a")
            .forEach(msg => {
                chat.push(
                    `[${msg.p._id}] ${chalk.bgHex(msg.p.color)(msg.p.name)}: ${
                        msg.a
                    }`
                );
                if (chat.length > 10) chat.splice(0, 1);
            });
    });
})();
