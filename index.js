const Koa = require('koa');
const bodyParser = require('koa-bodyparser');
const bearerToken = require('koa-bearer-token')

const cardsMoc = {
	'card_one_id': {
		id: 'card_one_id',
		questId: 'quest_one_id',
		title: 'The first card title из сети',
		description: 'The first card description из сети. И картинка тоже из сети',
		type: 'choose',
		links: [
			{
				answer: 'Answer 2',
				resources: [],
			},
			{
				answer: 'Answer 3',
				resources: [],
			},
		],
		imagePath: 'http://s3.party.pl/newsy/zespol-queen-318346-article.jpg',
	},
	'card_two_id': {
		id: 'card_two_id',
		questId: 'quest_one_id',
		title: 'The second card title',
		description: 'The second card description',
		type: 'choose',
		links: [
			{
				answer: 'Answer 1',
				resources: [],
			},
			{
				answer: 'Answer 3',
				resources: [],
			},
		],
		imagePath: 'http://www.nebeep.com/wp-content/uploads/2015/04/queen.png',
	},
	'card_three_id': {
		id: 'card_three_id',
		questId: 'quest_one_id',
		title: 'The third card title',
		description: 'The third card description',
		type: 'choose',
		links: [
			{
				answer: 'Answer 1',
				resources: [],
			},
			{
				answer: 'Answer 2',
				resources: [],
			},
		],
		imagePath: 'http://rock-history.ru/upload/000/u1/011/da639e95.jpg',
	}
};

const cardAnswersMoc = {
	'Answer 1': {
		nextCardId:	'card_one_id',
		resources: []
	},
	'Answer 2': {
		nextCardId: 'card_two_id',
		resources: []
	},
	'Answer 3': {
		nextCardId: 'card_three_id',
		resources: []
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
				token: 'vitalytoken',
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
		for (let email of Object.keys(this.users)) {
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

	login({ email, password } = {}) {
		if (!this.users[email] || this.users[email].password !== password) {
			return {
				error: true,
				data: {
					passwordError: errors.INCORRECT_CREDENTIALS,
				}
			};
		}
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
			stage: 'end'
		};
	}

	await next();
});

app.listen(6000, () => console.log('Server is listening at 5000 port'));

