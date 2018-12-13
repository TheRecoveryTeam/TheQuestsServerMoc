const Koa = require('koa');
const bodyParser = require('koa-bodyparser');
const bearerToken = require('koa-bearer-token');
const requester = require('request-promise');
const fs = require('fs');

const credentials = {
	client: {
		id: '6779621',
		secret: 'ZVMCxkWRolVxKWAUaAjk'
	},
	auth: {
		tokenHost: 'https://oauth.vk.com/access_token'
	}
};

const oauth2 = require('simple-oauth2').create(credentials);



const cardsMoc = {
	'card_one_id': {
		id: 'card_one_id',
		questId: 'quest_one_id',
		title: 'The first card title из сети',
		description: 'The first card description из сети. И картинка тоже из сети',
		type: 'choose',
		links: [ 'Answer 2', 'Answer 3' ],
		imagePath: 'http://s3.party.pl/newsy/zespol-queen-318346-article.jpg',
	},
	'card_two_id': {
		id: 'card_two_id',
		questId: 'quest_one_id',
		title: 'The second card title',
		description: 'The second card description',
		type: 'choose',
		links: [ 'Answer 1', 'Answer 3' ],
		imagePath: 'http://www.nebeep.com/wp-content/uploads/2015/04/queen.png',
	},
	'card_three_id': {
		id: 'card_three_id',
		questId: 'quest_one_id',
		title: 'The third card title',
		description: 'The third card description',
		type: 'finish',
		links: [ 'Answer 1', 'Answer 2' ],
		imagePath: 'http://rock-history.ru/upload/000/u1/011/da639e95.jpg',
	}
};

const cardAnswersMoc = {
	'Answer 1': {
		nextCardId:	'card_one_id',
		resources: [
			{
				name: 'Health',
				value: 20,
			},
			{
				name: 'Sward',
				value: 50,
			},
			{
				name: 'Power',
				value: 70,
			},
			{
				name: 'Money',
				value: 40,
			}
		]
	},
	'Answer 2': {
		nextCardId: 'card_two_id',
		resources: [
			{
				name: 'Health',
				value: 30,
			},
			{
				name: 'Sward',
				value: 45,
			},
			{
				name: 'Power',
				value: 60,
			},
			{
				name: 'Money',
				value: 45,
			}
		],
	},
	'Answer 3': {
		nextCardId: 'card_three_id',
		resources: [
			{
				name: 'Health',
				value: 70,
			},
			{
				name: 'Sward',
				value: 60,
			},
			{
				name: 'Power',
				value: 50,
			},
			{
				name: 'Money',
				value: 60,
			}
		],
	},
}

const errors = {
	INCORRECT: 'INCORRECT',
	ALREADY_TAKEN: 'ALREADY_TAKEN',
	INCORRECT_CREDENTIALS: 'INCORRECT_CREDENTIALS',
}

class Users { 
	constructor() {
		this.users = {
			'vv-ch@bk.ru': {
				id: 'vitalyid',
				email: 'vv-ch@bk.ru',
				nickname: 'VitalyCherkov',
				password: '12345678',
				token: '',
			}
		};	
	}

	findEmail(email) {
		return Object.keys(this.users).findIndex(e => e == email) >= 0;
	}

	findNickname(nickname) {
		return Object.keys(this.users).findIndex(email => this.users[email].nickname === nickname) >= 0;
	}

	register({ email = '', password = '', nickname = '' } = {}) {
		const resp = {
			error: false,
			data: {}
		}
		if (email === '') {
			resp.error = true;
			resp.data.emailError = errors.INCORRECT;
		}
		else if (this.findEmail(email)) {
			resp.error = true;
			resp.data.emailError = errors.ALREADY_TAKEN; 
		}

		if (nickname === '') {
			resp.error = true;
			resp.data.nicknameError = errors.INCORRECT;
		}
		else if (this.findEmail(nickname)) {
			resp.error = true;
			resp.data.nicknameError = errors.ALREADY_TAKEN; 
		}

		if (password.length < 8) {
			resp.error = true;
			resp.data.passwordError = errors.INCORRECT;
		}

		if (resp.error) {
			return resp;
		}

		this.users[email] = {
			id: `${email}${nickname}${Math.round(Math.random() * 1000)}`,
			email,
			password,
			nickname,
			token: `${email}${nickname}${Math.round(Math.random() * 1000)}`
		};

		return {
			error: false,
			data: {
				id: this.users[email].id,
				token: this.users[email].id,
			}
		}
	}

	getCurUser(token) {
		console.log('token', token);
		if (!token || token.length === 0) {
			return null;
		}
		for (let email of Object.keys(this.users)) {
			console.log(email, ": ", this.users[email].token === token);
			if (this.users[email].token === token) {
				return email;
			}
		}
		return null;
	}

	logout(token) {
		const curUser = this.getCurUser(token);
		if (curUser !== null) {
			this.users[curUser].token = '';
		}
	}

	checkAuth(token) {
		return !!this.getCurUser(token);
	}

	login({ email, password } = {}) {
		if (!this.users[email] || this.users[email].password !== password) {
			return {
				error: true,
				data: {
					passwordError: errors.INCORRECT_CREDENTIALS,
				}
			};
		}
		this.users[email].token = `${email}${this.users[email].nickname}${Math.round(Math.random() * 1000)}`;
		return {
			error: false,
			data: this.users[email],
		};
	}
}

const USERS = new Users();

const app = new Koa();
app.use(bodyParser({
	extendTypes: {
	  json: ['application/json'] // will parse application/x-javascript type body as a JSON string
	}
  }));

app.use(bearerToken({
	headerKey: 'Bearer',
}));

app.use(async (ctx, next) => {
	const { method, path, request } = ctx;
	console.log(method, path, ctx.request.body);
	let wasAsync = false;

	if (path.startsWith('/api/card.get')) {
		const { cardId } = ctx.query;
		if (cardsMoc[cardId]) {
			ctx.body = cardsMoc[cardId]
			ctx.status = 200;
		}
	}
	else if (method === 'POST' && path.startsWith('/api/card.do_answer')) {
		const { cardId, answer } = ctx.request.body;
		if (answer && cardAnswersMoc[answer]) {
			ctx.body = cardAnswersMoc[answer];
			ctx.status = 200;
		}
	}
	else if (method === 'POST' && path.startsWith('/api/user.logout')) {
		USERS.logout(ctx.request.token);
		ctx.status = 201;
	}
	else if (method === 'POST' && path.startsWith('/api/user.login')) {
		const resp = USERS.login(ctx.request.body);
		ctx.status = resp.error ? 401 : 200;
		console.log('LOGIN: ', resp.data);
		ctx.body = {
			id: resp.data.id,
			nickname: resp.data.nickname,
			email: resp.data.email,
			token: resp.data.token,
		};
	}
	else if (method === 'POST' && path.startsWith('/api/user.create')) {
		const resp = USERS.register(ctx.request.body);
		ctx.status = resp.error ? 400 : 200;
		ctx.body = resp.data;
	}
	else if (method === 'GET' && path.startsWith('/api/user.find_email')) {
		ctx.status = USERS.findEmail(ctx.query.email) ? 201 : 404;
	}
	else if (method === 'GET' && path.startsWith('/api/user.find_nickname')) {
		ctx.status = USERS.findNickname(ctx.query.nickname) ? 201 : 404;
	}
	else if (method === 'GET' && path.startsWith('/api/quest.get')) {
		ctx.status = 200;
		ctx.body = {
			id: 'quest_one_id',
			title: 'The Quest title from network',
			description: 'Лучший квест из тех, в которые я когда-либо играл. Реально, попробуйте это топ, отвечаю!',
			imagePath: 'http://2d.by/wallpapers/v/vodopad_4.jpg',
			currCardId: 'card_one_id',
			authorNickname: 'SaneevIlya',
			playerCount: '437',
			stage: 'end',
			resources: [
				{
					name: 'Health',
					value: 50,
				},
				{
					name: 'Sward',
					value: 30,
				},
				{
					name: 'Power',
					value: 75,
				},
				{
					name: 'Money',
					value: 60,
				}
			]
		};
	}
	else if (method === 'GET' && path.startsWith('/api/user.check_auth')) {
		if (USERS.checkAuth(ctx.request.token)) {
			ctx.status = 201;
		}
		else {
			ctx.status = 401;
		}
	}
	else if (method === 'GET' && path.startsWith('/api/vk_oauth')) {
		wasAsync = true;

		const SECRET = 'ZVMCxkWRolVxKWAUaAjk';
		const CLIENT_ID = '6779621';
		const REDIRECT_URI = 'http://127.0.0.1:8008/api/vk_oauth';
		const { code } = ctx.query;

		const handleGet = async (body) => {
			const { access_token, user_id } = JSON.parse(body);
			
			const resp = await requester({
				url: 'https://api.vk.com/method/users.get',
				qs: {
					user_ids: user_id,
					v: '5.92',
					access_token
				}
			});

			const { first_name, last_name } = JSON.parse(resp).response[0];

			USERS.users[`${user_id}`] = {
				id: `${user_id}`,
				email: `${user_id}`,
				nickname: `${first_name} ${last_name}`,
				password: '12345678',
				token: access_token,
			};
			const { id, email, nickname, token } = USERS.users[user_id];

			ctx.status = 200;
			ctx.body = {
				id, email, nickname, token
			};
			console.log(ctx.status, ctx.body);
		};

		try {
			const res = await requester({
				url: 'https://oauth.vk.com/access_token',
				qs: {
					client_id: CLIENT_ID,
					redirect_uri: REDIRECT_URI,
					client_secret: SECRET,
					code,
				},
			});

			await handleGet(res);
		}
		catch (e) {
			console.log(e);
			ctx.status = 401;
		}
	}
	
	if (!wasAsync) {
		await next();
	}
});

app.listen(8008, () => console.log('Server is listening at 8008 port'));

