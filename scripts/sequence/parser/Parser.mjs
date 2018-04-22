/* eslint-disable max-lines */
/* eslint-disable sort-keys */ // Maybe later
/* eslint-disable complexity */ // Temporary ignore while switching linter
/* eslint-disable no-param-reassign */ // Also temporary

import {combine, last} from '../../core/ArrayUtilities.mjs';
import Tokeniser from './Tokeniser.mjs';
import labelPatternParser from './LabelPatternParser.mjs';
import markdownParser from './MarkdownParser.mjs';

const BLOCK_TYPES = {
	'if': {
		type: 'block begin',
		blockType: 'if',
		tag: 'if',
		skip: [],
	},
	'else': {
		type: 'block split',
		blockType: 'else',
		tag: 'else',
		skip: ['if'],
	},
	'repeat': {
		type: 'block begin',
		blockType: 'repeat',
		tag: 'repeat',
		skip: [],
	},
	'group': {
		type: 'block begin',
		blockType: 'group',
		tag: '',
		skip: [],
	},
};

const CONNECT = {
	types: ((() => {
		const lTypes = [
			{tok: '', type: 0},
			{tok: '<', type: 1},
			{tok: '<<', type: 2},
		];
		const mTypes = [
			{tok: '-', type: 'solid'},
			{tok: '--', type: 'dash'},
			{tok: '~', type: 'wave'},
		];
		const rTypes = [
			{tok: '', type: 0},
			{tok: '>', type: 1},
			{tok: '>>', type: 2},
			{tok: 'x', type: 3},
		];
		const arrows = (combine([lTypes, mTypes, rTypes])
			.filter((arrow) => (arrow[0].type !== 0 || arrow[2].type !== 0))
		);

		const types = new Map();

		arrows.forEach((arrow) => {
			types.set(arrow.map((part) => part.tok).join(''), {
				line: arrow[1].type,
				left: arrow[0].type,
				right: arrow[2].type,
			});
		});

		return types;
	})()),

	agentFlags: {
		'*': {flag: 'begin', allowBlankName: true, blankNameFlag: 'source'},
		'+': {flag: 'start'},
		'-': {flag: 'stop'},
		'!': {flag: 'end'},
	},
};

const TERMINATOR_TYPES = [
	'none',
	'box',
	'cross',
	'fade',
	'bar',
];

const NOTE_TYPES = {
	'text': {
		mode: 'text',
		types: {
			'left': {type: 'note left', skip: ['of'], min: 0, max: null},
			'right': {type: 'note right', skip: ['of'], min: 0, max: null},
		},
	},
	'note': {
		mode: 'note',
		types: {
			'over': {type: 'note over', skip: [], min: 0, max: null},
			'left': {type: 'note left', skip: ['of'], min: 0, max: null},
			'right': {type: 'note right', skip: ['of'], min: 0, max: null},
			'between': {type: 'note between', skip: [], min: 2, max: null},
		},
	},
	'state': {
		mode: 'state',
		types: {
			'over': {type: 'note over', skip: [], min: 1, max: 1},
		},
	},
};

const DIVIDER_TYPES = {
	'line': {defaultHeight: 6},
	'space': {defaultHeight: 6},
	'delay': {defaultHeight: 30},
	'tear': {defaultHeight: 6},
};

const AGENT_MANIPULATION_TYPES = {
	'define': {type: 'agent define'},
	'begin': {type: 'agent begin', mode: 'box'},
	'end': {type: 'agent end', mode: 'cross'},
};

function makeError(message, token = null) {
	let suffix = '';
	if(token) {
		suffix = (
			' at line ' + (token.b.ln + 1) +
			', character ' + token.b.ch
		);
	}
	return new Error(message + suffix);
}

function joinLabel(line, begin = 0, end = null) {
	if(end === null) {
		end = line.length;
	}
	if(end <= begin) {
		return '';
	}
	let result = line[begin].v;
	for(let i = begin + 1; i < end; ++ i) {
		result += line[i].s + line[i].v;
	}
	return result;
}

function readNumber(line, begin = 0, end = null, def = Number.NAN) {
	const text = joinLabel(line, begin, end);
	return Number(text || def);
}

function tokenKeyword(token) {
	if(!token || token.q) {
		return null;
	}
	return token.v;
}

function skipOver(line, start, skip, error = null) {
	for(let i = 0; i < skip.length; ++ i) {
		const expected = skip[i];
		const token = line[start + i];
		if(tokenKeyword(token) !== expected) {
			if(error) {
				throw makeError(
					error + '; expected "' + expected + '"',
					token
				);
			} else {
				return start;
			}
		}
	}
	return start + skip.length;
}

function findToken(line, tokens, {
	start = 0,
	limit = null,
	orEnd = false,
} = {}) {
	if(limit === null) {
		limit = line.length;
	}
	if(!Array.isArray(tokens)) {
		tokens = [tokens];
	}
	for(let i = start; i <= limit - tokens.length; ++ i) {
		if(skipOver(line, i, tokens) !== i) {
			return i;
		}
	}
	return orEnd ? limit : -1;
}

function findFirstToken(line, tokenMap, {start = 0, limit = null} = {}) {
	if(limit === null) {
		limit = line.length;
	}
	for(let pos = start; pos < limit; ++ pos) {
		const value = tokenMap.get(tokenKeyword(line[pos]));
		if(value) {
			return {pos, value};
		}
	}
	return null;
}

function readAgentAlias(line, start, end, {enableAlias, allowBlankName}) {
	let aliasSep = -1;
	if(enableAlias) {
		aliasSep = findToken(line, 'as', {start});
	}
	if(aliasSep === -1 || aliasSep >= end) {
		aliasSep = end;
	}
	if(start >= aliasSep && !allowBlankName) {
		let errPosToken = line[start];
		if(!errPosToken) {
			errPosToken = {b: last(line).e};
		}
		throw makeError('Missing agent name', errPosToken);
	}
	return {
		name: joinLabel(line, start, aliasSep),
		alias: joinLabel(line, aliasSep + 1, end),
	};
}

function readAgent(line, start, end, {
	flagTypes = {},
	aliases = false,
} = {}) {
	const flags = [];
	const blankNameFlags = [];
	let p = start;
	let allowBlankName = false;
	for(; p < end; ++ p) {
		const token = line[p];
		const rawFlag = tokenKeyword(token);
		const flag = flagTypes[rawFlag];
		if(!flag) {
			break;
		}
		if(flags.includes(flag.flag)) {
			throw makeError('Duplicate agent flag: ' + rawFlag, token);
		}
		allowBlankName = allowBlankName || Boolean(flag.allowBlankName);
		flags.push(flag.flag);
		blankNameFlags.push(flag.blankNameFlag);
	}
	const {name, alias} = readAgentAlias(line, p, end, {
		enableAlias: aliases,
		allowBlankName,
	});
	return {
		name,
		alias,
		flags: name ? flags : blankNameFlags,
	};
}

function readAgentList(line, start, end, readAgentOpts) {
	const list = [];
	let currentStart = -1;
	for(let i = start; i < end; ++ i) {
		const token = line[i];
		if(tokenKeyword(token) === ',') {
			if(currentStart !== -1) {
				list.push(readAgent(line, currentStart, i, readAgentOpts));
				currentStart = -1;
			}
		} else if(currentStart === -1) {
			currentStart = i;
		}
	}
	if(currentStart !== -1) {
		list.push(readAgent(line, currentStart, end, readAgentOpts));
	}
	return list;
}

const PARSERS = [
	(line, meta) => { // Title
		if(tokenKeyword(line[0]) !== 'title') {
			return null;
		}

		meta.title = joinLabel(line, 1);
		return true;
	},

	(line, meta) => { // Theme
		if(tokenKeyword(line[0]) !== 'theme') {
			return null;
		}

		meta.theme = joinLabel(line, 1);
		return true;
	},

	(line, meta) => { // Terminators
		if(tokenKeyword(line[0]) !== 'terminators') {
			return null;
		}

		const type = tokenKeyword(line[1]);
		if(!type) {
			throw makeError('Unspecified termination', line[0]);
		}
		if(TERMINATOR_TYPES.indexOf(type) === -1) {
			throw makeError('Unknown termination "' + type + '"', line[1]);
		}
		meta.terminators = type;
		return true;
	},

	(line, meta) => { // Headers
		if(tokenKeyword(line[0]) !== 'headers') {
			return null;
		}

		const type = tokenKeyword(line[1]);
		if(!type) {
			throw makeError('Unspecified header', line[0]);
		}
		if(TERMINATOR_TYPES.indexOf(type) === -1) {
			throw makeError('Unknown header "' + type + '"', line[1]);
		}
		meta.headers = type;
		return true;
	},

	(line) => { // Divider
		if(tokenKeyword(line[0]) !== 'divider') {
			return null;
		}

		const labelSep = findToken(line, ':', {orEnd: true});
		const heightSep = findToken(line, ['with', 'height'], {
			limit: labelSep,
			orEnd: true,
		});

		const mode = joinLabel(line, 1, heightSep) || 'line';
		if(!DIVIDER_TYPES[mode]) {
			throw makeError('Unknown divider type', line[1]);
		}

		const height = readNumber(
			line,
			heightSep + 2,
			labelSep,
			DIVIDER_TYPES[mode].defaultHeight
		);
		if(Number.isNaN(height) || height < 0) {
			throw makeError('Invalid divider height', line[heightSep + 2]);
		}

		return {
			type: 'divider',
			mode,
			height,
			label: joinLabel(line, labelSep + 1),
		};
	},

	(line) => { // Autolabel
		if(tokenKeyword(line[0]) !== 'autolabel') {
			return null;
		}

		let raw = null;
		if(tokenKeyword(line[1]) === 'off') {
			raw = '<label>';
		} else {
			raw = joinLabel(line, 1);
		}
		return {
			type: 'label pattern',
			pattern: labelPatternParser(raw),
		};
	},

	(line) => { // Block
		if(tokenKeyword(line[0]) === 'end' && line.length === 1) {
			return {type: 'block end'};
		}

		const type = BLOCK_TYPES[tokenKeyword(line[0])];
		if(!type) {
			return null;
		}
		let skip = 1;
		if(line.length > skip) {
			skip = skipOver(line, skip, type.skip, 'Invalid block command');
		}
		skip = skipOver(line, skip, [':']);
		return {
			type: type.type,
			blockType: type.blockType,
			tag: type.tag,
			label: joinLabel(line, skip),
		};
	},

	(line) => { // Begin reference
		if(
			tokenKeyword(line[0]) !== 'begin' ||
			tokenKeyword(line[1]) !== 'reference'
		) {
			return null;
		}
		let agents = [];
		const labelSep = findToken(line, ':');
		if(tokenKeyword(line[2]) === 'over' && labelSep > 3) {
			agents = readAgentList(line, 3, labelSep);
		} else if(labelSep !== 2) {
			throw makeError('Expected ":" or "over"', line[2]);
		}
		const def = readAgent(
			line,
			labelSep + 1,
			line.length,
			{aliases: true}
		);
		if(!def.alias) {
			throw makeError('Reference must have an alias', line[labelSep]);
		}
		return {
			type: 'group begin',
			agents,
			blockType: 'ref',
			tag: 'ref',
			label: def.name,
			alias: def.alias,
		};
	},

	(line) => { // Agent
		const type = AGENT_MANIPULATION_TYPES[tokenKeyword(line[0])];
		if(!type || line.length <= 1) {
			return null;
		}
		return Object.assign({
			agents: readAgentList(line, 1, line.length, {aliases: true}),
		}, type);
	},

	(line) => { // Async
		if(tokenKeyword(line[0]) !== 'simultaneously') {
			return null;
		}
		if(tokenKeyword(last(line)) !== ':') {
			return null;
		}
		let target = '';
		if(line.length > 2) {
			if(tokenKeyword(line[1]) !== 'with') {
				return null;
			}
			target = joinLabel(line, 2, line.length - 1);
		}
		return {
			type: 'async',
			target,
		};
	},

	(line) => { // Note
		const mode = NOTE_TYPES[tokenKeyword(line[0])];
		const labelSep = findToken(line, ':');
		if(!mode || labelSep === -1) {
			return null;
		}
		const type = mode.types[tokenKeyword(line[1])];
		if(!type) {
			return null;
		}
		let skip = 2;
		skip = skipOver(line, skip, type.skip);
		const agents = readAgentList(line, skip, labelSep);
		if(agents.length < type.min) {
			throw makeError('Too few agents for ' + mode.mode, line[0]);
		}
		if(type.max !== null && agents.length > type.max) {
			throw makeError('Too many agents for ' + mode.mode, line[0]);
		}
		return {
			type: type.type,
			agents,
			mode: mode.mode,
			label: joinLabel(line, labelSep + 1),
		};
	},

	(line) => { // Connect
		const labelSep = findToken(line, ':', {orEnd: true});
		const connectionToken = findFirstToken(
			line,
			CONNECT.types,
			{start: 0, limit: labelSep - 1}
		);
		if(!connectionToken) {
			return null;
		}

		const connectPos = connectionToken.pos;

		const readOpts = {
			flagTypes: CONNECT.agentFlags,
		};

		if(tokenKeyword(line[0]) === '...') {
			return {
				type: 'connect-delay-end',
				tag: joinLabel(line, 1, connectPos),
				agent: readAgent(line, connectPos + 1, labelSep, readOpts),
				label: joinLabel(line, labelSep + 1),
				options: connectionToken.value,
			};
		} else if(tokenKeyword(line[connectPos + 1]) === '...') {
			if(labelSep !== line.length) {
				throw makeError(
					'Cannot label beginning of delayed connection',
					line[labelSep]
				);
			}
			return {
				type: 'connect-delay-begin',
				tag: joinLabel(line, connectPos + 2, labelSep),
				agent: readAgent(line, 0, connectPos, readOpts),
				options: connectionToken.value,
			};
		} else {
			return {
				type: 'connect',
				agents: [
					readAgent(line, 0, connectPos, readOpts),
					readAgent(line, connectPos + 1, labelSep, readOpts),
				],
				label: joinLabel(line, labelSep + 1),
				options: connectionToken.value,
			};
		}
	},

	(line) => { // Marker
		if(line.length < 2 || tokenKeyword(last(line)) !== ':') {
			return null;
		}
		return {
			type: 'mark',
			name: joinLabel(line, 0, line.length - 1),
		};
	},

	(line) => { // Options
		const sepPos = findToken(line, 'is');
		if(sepPos < 1) {
			return null;
		}
		const indefiniteArticles = ['a', 'an'];
		let optionsBegin = sepPos + 1;
		if(indefiniteArticles.includes(tokenKeyword(line[optionsBegin]))) {
			++ optionsBegin;
		}
		if(optionsBegin === line.length) {
			throw makeError('Empty agent options', {b: last(line).e});
		}
		const agent = readAgent(line, 0, sepPos);
		const options = [];
		for(let i = optionsBegin; i < line.length; ++ i) {
			options.push(line[i].v);
		}
		return {
			type: 'agent options',
			agent,
			options,
		};
	},
];

function parseLine(line, {meta, stages}) {
	let stage = null;
	for(let i = 0; i < PARSERS.length; ++ i) {
		stage = PARSERS[i](line, meta);
		if(stage) {
			break;
		}
	}
	if(!stage) {
		throw makeError(
			'Unrecognised command: ' + joinLabel(line),
			line[0]
		);
	}
	if(typeof stage === 'object') {
		stage.ln = line[0].b.ln;
		stages.push(stage);
	}
}

const SHARED_TOKENISER = new Tokeniser();

export default class Parser {
	getCodeMirrorMode() {
		return SHARED_TOKENISER.getCodeMirrorMode(
			Array.from(CONNECT.types.keys())
		);
	}

	parseLines(lines, src) {
		const result = {
			meta: {
				title: '',
				theme: '',
				code: src,
				terminators: 'none',
				headers: 'box',
				textFormatter: markdownParser,
			},
			stages: [],
		};

		lines.forEach((line) => parseLine(line, result));

		return result;
	}

	parse(src) {
		const tokens = SHARED_TOKENISER.tokenise(src);
		const lines = SHARED_TOKENISER.splitLines(tokens);
		return this.parseLines(lines, src);
	}
}