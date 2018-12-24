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
	},

	'new_card_1': {
		id: 'new_card_1',
		questId: 'quest_one_id',
		title: 'Рыцарь',
		description: 'Храбрый, молодой рыцарь, который пока не знает, чего хочет от жизни',
		type: 'choose',
		links: ['Отправиться в замок'],
		imagePath: 'http://46.101.176.63/static/img/1.png',
	},


	'new_card_2': {
		id: 'new_card_2',
		questId: 'quest_one_id',
		title: 'Замок',
		description: 'У короля дракон украл прекрасную жену, правитель просит вас о помощи',
		type: 'choose',
		links: ['Согласиться и уйти', 'Отказаться и уйти'],
		imagePath: 'http://46.101.176.63/static/img/4.png',
	},

	'new_card_3': {
		id: 'new_card_3',
		questId: 'quest_one_id',
		title: 'Гостиная',
		description: 'Вы заходите в роскошный зал',
		type: 'choose',
		links: ['Найти место для отдыха', 'Осмотреть комнату'],
		imagePath: 'http://46.101.176.63/static/img/17.png',
	},

	'new_card_4': {
		id: 'new_card_4',
		questId: 'quest_one_id',
		title: 'Комната со знаменем',
		description: 'Вы осматриваете знамя',
		type: 'choose',
		links: ['Заглянуть за знамя'],
		imagePath: 'http://46.101.176.63/static/img/15.png',
	},

	'new_card_5': {
		id: 'new_card_5',
		questId: 'quest_one_id',
		title: 'Меч',
		description: 'Вы обнаруживаете старый меч',
		type: 'choose',
		links: ['Выйти в коридор', 'Продолжить поиски'],
		imagePath: 'http://46.101.176.63/static/img/7.png',
	},

	'new_card_6': {
		id: 'new_card_6',
		questId: 'quest_one_id',
		title: 'Сверкающий меч',
		description: 'На выходе вы нашли сверкающий меч',
		type: 'choose',
		links: ['Выйти из замка'],
		imagePath: 'http://46.101.176.63/static/img/10.png',
	},

	'new_card_7': {
		id: 'new_card_7',
		questId: 'quest_one_id',
		title: 'Конь',
		description: 'Около входа в замок стоит великолепный конь, владелец предлагает его в обмен на сверкающий меч',
		type: 'choose',
		links: ['Обменять', 'Пройти мимо'],
		imagePath: 'http://46.101.176.63/static/img/5.png',
	},

	'new_card_8': {
		id: 'new_card_8',
		questId: 'quest_one_id',
		title: 'Летящий дракон',
		description: 'Продолжив путь, вы замечаете пролетающего рядом дракона, в лапах которого видите королеву',
		type: 'choose',
		links: ['На поединок!', 'На переговоры'],
		imagePath: 'http://46.101.176.63/static/img/3.png',
	},

	'new_card_9': {
		id: 'new_card_9',
		questId: 'quest_one_id',
		title: 'Прекрасная королева',
		description: 'Вы обменяли королеву на коня',
		type: 'choose',
		links: ['Очаровать харизмой', 'Увезти в королевство'],
		imagePath: 'http://46.101.176.63/static/img/2.png',
	},

	'new_card_10': {
		id: 'new_card_10',
		questId: 'quest_one_id',
		title: 'Королевство',
		description: `Вы доставили королеву обратно к королю, король безумно счастлив!`,
		type: 'choose',
		links: ['Завершить'],
		imagePath: 'http://46.101.176.63/static/img/4.png',
	},

	'new_card_11': {
		id: 'new_card_11',
		questId: 'quest_one_id',
		title: 'Конец!',
		description: 'Поздравляю вы получили щедрый подарок и уважение короля',
		type: 'end',
		imagePath: 'http://46.101.176.63/static/img/1.png',
	},
};

const cardAnswersMoc = {
	'Отправиться в замок': {
		nextCardId: 'new_card_2',
		resources: [
			{
				name: 'усталость',
				value: 5,
			},
		],
	},
	'Согласиться и уйти': {
		nextCardId: 'new_card_3',
		resources: [
			{
				name: 'усталость',
				value: 5,
			},
		],
	},
	'Осмотреть комнату': {
		nextCardId: 'new_card_4',
		resources: [
			{
				name: 'усталость',
				value: 2,
			},
		],
	},
	'Заглянуть за знамя': {
		nextCardId: 'new_card_5',
		resources: [
			{
				name: 'урон',
				value: 10,
			}
		]
	},
	'Выйти в коридор': {
		nextCardId: 'new_card_6',
		resources: [
			{
				name: 'урон',
				value: 30,
			},
			{
				name: 'усталость',
				value: 2
			}
		]
	},
	'Выйти из замка': {
		nextCardId: 'new_card_7',
		resources: [
			{
				name: 'усталость',
				value: 2
			},
		],
	},
	'Пройти мимо': {
		nextCardId: 'new_card_8',
		resources: [
			{
				name: 'усталость',
				value: 2
			},
		],
	},
	'На переговоры': {
		nextCardId: 'new_card_9',
		resources: [],
	},
	'Увезти в королевство': {
		nextCardId: 'new_card_10',
		resources: [],

	},
	'Завершить': {
		nextCardId: 'new_card_11',
		resources: [],
	},

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

class Quest {
	constructor () {
		this.id = 'quest_one_id';
		this.title = "Путешествие рыцаря";
		this.description = "В этом квесте вы узнаете, что такое рыцарская жизнь!";
		this.authorNickname = "Isaev_and_Belov";
		this.playerCount = "3";
		this.currCardId = 'new_card_1';
		this.stage = 'end';
		this.imagePath = 'http://46.101.176.63/static/img/1.png';
		this.resources = [
			{
				"name": "здровье",
				"value": 50,
			},
			{
				"name": "усталость",
				"value": 50,
			},
			{
				"name": "урон",
				"value": 50,
			},
		]
	}

	updateResources(delta) {
		this.resources = this.resources.map(({ name, value }) => {
			let newValue = value;
			delta.map(cur => {
				if (cur.name === name) {
					newValue += cur.value;
				}
			});
			return {
				name,
				value: newValue,
			};
		});
	}

	doAnswer(answer) {
		const link = cardAnswersMoc[answer];
		this.currCardId = link.nextCardId;
		this.updateResources(link.resources);
	}

	getCard() {
		return {
			id: this.id,
			title: this.title,
			description: this.description,
			authorNickname: this.authorNickname,
			playerCount: this.playerCount,
			currCardId: this.currCardId,
			stage: this.stage,
			resources: this.resources,
			imagePath: this.imagePath,
		}
	}

	getNextCard() {
		return {
			nextCardId: this.currCardId,
			resources: this.resources,
		};
	}
}

const USERS = new Users();
const QUEST = new Quest();

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
			QUEST.doAnswer(answer);
			ctx.body = QUEST.getNextCard();
			// ctx.body = cardAnswersMoc[answer];
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
		ctx.body = QUEST.getCard();
		// ctx.body = {
		// 	id: 'quest_one_id',
		// 	title: 'The Quest title from network',
		// 	description: 'Лучший квест из тех, в которые я когда-либо играл. Реально, попробуйте это топ, отвечаю!',
		// 	authorNickname: 'SaneevIlya',
		// 	playerCount: '437',
		// 	currCardId: 'card_one_id',
		// 	imagePath: 'http://2d.by/wallpapers/v/vodopad_4.jpg',
		// 	stage: 'end',
		// 	resources: [
		// 		{
		// 			name: 'Health',
		// 			value: 50,
		// 		},
		// 		{
		// 			name: 'Sward',
		// 			value: 30,
		// 		},
		// 		{
		// 			name: 'Power',
		// 			value: 75,
		// 		},
		// 		{
		// 			name: 'Money',
		// 			value: 60,
		// 		}
		// 	]
		// };
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

