import { Bot, CommandContext, Context, webhookCallback } from 'grammy';

const startCommandReply = `
Welcome to the Anne Frank Museum Appointment Notification Bot! 🚑

This bot helps you stay updated with the latest available appointments. Get notifications directly in Telegram as soon as new appointments become available.

Simply use the command /register to start receiving notifications about new appointment slots. If you wish to stop receiving notifications at any time, you can use the /unregister command.

For more information on how to use this bot, type /help.
`;

const helpCommandReply = `
Doctor Appointment Notification Bot - Command Help 📘

/start - Start interacting with the bot and see this welcome message again.
/register - Register to receive notifications about new appointments.
/unregister - Stop receiving notifications about new appointments.
/help - Get detailed information about the available bot commands and how to use them.

Just follow the instructions, and I'll handle the rest for you!`;

export default {
	async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
		try {
			console.log("Received request, starting");
			const botInfo = JSON.parse(env.BOT_INFO);
			const bot = new Bot(env.TELEGRAM_BOT_TOKEN, { botInfo });

			bot.command('start', (ctx) => ctx.reply(startCommandReply));
			bot.command('help', (ctx) => ctx.reply(helpCommandReply));
			bot.command('register', async (ctx) => ctx.reply(await handleRegister(ctx, env)));
			bot.command('unregister', async (ctx) => ctx.reply(await handleUnregister(ctx, env)))

			const cb = webhookCallback(bot, 'cloudflare-mod');
			return await cb(request);
		} catch (e) {
			if (e instanceof Error) return new Response(e.message);
			return new Response(`(${typeof e} - ${e}`);
		}
	},
};

async function handleRegister(ctx: CommandContext<Context>, env: Env): Promise<string> {
	console.log("Received /register command, handling");
	const chatId = ctx.chat.id;
	const activeChatIds = await getChatIds(env);
	if (!activeChatIds.includes(chatId)) {
		activeChatIds.push(chatId);
		await saveChatIds(activeChatIds, env);
		return 'You are now registered for updates!';
	} else {
		return 'You are already registered for updates!';
	}
}

async function handleUnregister(ctx: CommandContext<Context>, env: Env): Promise<string> {
	console.log("Received /unregister command, handling");
	const chatId = ctx.chat.id;
	const activeChatIds = await getChatIds(env);
	if (activeChatIds.includes(chatId)) {
		const index = activeChatIds.indexOf(chatId);
		activeChatIds.splice(index, 1);
		await saveChatIds(activeChatIds, env);
		return 'You are now unregistered from updates!';
	} else {
		return 'You are not registered for updates!';
	}
}

async function getChatIds(env: Env): Promise<number[]> {
	try {
		const data = await env.STORAGE.get("active_chat_ids");
		return data ? JSON.parse(data) : [];
	} catch (e) {
		if (e instanceof Error)
			console.error(`Error getting chat IDs - ${e.message}`);
		return [];
	}
}

async function saveChatIds(chatIds: number[], env: Env) {
	try {
		await env.STORAGE.put("active_chat_ids", JSON.stringify(chatIds));
	} catch (e) {
		if (e instanceof Error)
			console.error(`Error saving chat IDs - ${e.message}`);
	}
}
