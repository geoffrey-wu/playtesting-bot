import { Message, TextChannel } from "discord.js";
import { SECRET_ROLE } from "src/constants";
import { saveAsyncServerChannelsFromMessage, saveBulkServerChannelsFromMessage, deleteServerChannelsCommand, deleteServerSettingsCommand, insertServerSettingCommand } from "src/utils";

export default async function handleConfig(message: Message<boolean>) {
    const msgChannel = (await message.channel.fetch() as TextChannel);

    await msgChannel.send("List the channels used for **internal, asynchronous playtesting** - where the results should be saved to a separate channel.\nList channels in the form: `#testing-channel-1/#results-channel-1 #testing-channel-2/#results-channel-2`.");
    await msgChannel.send("To bypass asynchronous playtesting channels, type `#/#`.\nMake sure to add _exactly one space_ between each set of testing and results channels.\nNote that multiple playtesting channels can share a `results-channel`.");

    try {
        let filter = (m: Message<boolean>) => m.author.id === message.author.id
        let collected = await msgChannel.awaitMessages({
            filter,
            max: 1
        });

        deleteServerChannelsCommand.run(message.guild!.id);
        deleteServerSettingsCommand.run(message.guild!.id);

        let async_channels = saveAsyncServerChannelsFromMessage(collected, message.guild!);

        if (async_channels.length > 0) {
            await msgChannel.send(`Successfully saved ${async_channels.join(", ")} as asynchronous playtesting channels.`);

            await msgChannel.send(`**Note**: If you would like question answers and player notes to be encrypted in the bot's database, create a role called \`${SECRET_ROLE}\`.`);
        } else {
            await msgChannel.send(`No asynchronous channels configured.`);
        }

        await msgChannel.send("List the channels used for **bulk playtesting** - where playtesters will use reacts to indicate their performance.\nUse the form: `#testing-channel-1 #testing-channel-2`.");
        await msgChannel.send("To bypass bulk playtesting channels, type `#`.\nMake sure to add _exactly one space_ between each channel.\nAsynchronous playtesting channels cannot be bulk playtesting channels.");

        try {
            let filter = (m: Message<boolean>) => m.author.id === message.author.id
            let collected = await msgChannel.awaitMessages({
                filter,
                max: 1
            });

            let bulk_channels = saveBulkServerChannelsFromMessage(collected, message.guild!, 2);

            if (bulk_channels.length > 0) {
                await msgChannel.send(`Successfully saved ${bulk_channels.join(", ")} as bulk playtesting channels.`);
                await msgChannel.send("It is strongly recommended to have the questions for bulk playtesting echoed into another channel for convenient perusal afterwards.\nList the echo channel in the form: `#echo-channel`.");
                await msgChannel.send("To bypass the echo channel, type `#`.\nAsynchronous and bulk playtesting channels cannot be echo channels.");

                try {
                    let filter = (m: Message<boolean>) => m.author.id === message.author.id
                    let collected = await msgChannel.awaitMessages({
                        filter,
                        max: 1
                    });

                    let echo_channel = saveBulkServerChannelsFromMessage(collected, message.guild!, 3);

                    await msgChannel.send(`Successfully saved ${echo_channel.join(", ")} as the echo channel.`);

                    insertServerSettingCommand.run(message.guildId!, "");
                } catch {
                    await msgChannel.send("An error occurred, please try again.");
                }

                await msgChannel.send("Configuration finished.");
            } else {
                await msgChannel.send("Configuration finished.");
            }
        } catch {
            await msgChannel.send("An error occurred, please try again.");
        }
    } catch {
        await msgChannel.send("An error occurred, please try again.");
    }
}
