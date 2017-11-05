define(['./BaseComponent'], (BaseComponent) => {
	'use strict';

	function findExtremes(agentInfos, agentNames) {
		let min = null;
		let max = null;
		agentNames.forEach((name) => {
			const info = agentInfos.get(name);
			if(min === null || info.index < min.index) {
				min = info;
			}
			if(max === null || info.index > max.index) {
				max = info;
			}
		});
		return {
			left: min.label,
			right: max.label,
		};
	}

	class NoteComponent extends BaseComponent {
		renderPre({agentNames}) {
			return {agentNames};
		}

		renderNote({
			xMid = null,
			x0 = null,
			x1 = null,
			anchor,
			mode,
			label,
		}, env) {
			const config = env.theme.note[mode];

			const y = env.topY + config.margin.top + config.padding.top;
			const labelNode = new env.SVGTextBlockClass(env.labelLayer, {
				attrs: config.labelAttrs,
				text: label,
				y,
			});

			const fullW = (
				labelNode.width +
				config.padding.left +
				config.padding.right
			);
			const fullH = (
				config.padding.top +
				labelNode.height +
				config.padding.bottom
			);
			if(x0 === null && xMid !== null) {
				x0 = xMid - fullW / 2;
			}
			if(x1 === null && x0 !== null) {
				x1 = x0 + fullW;
			} else if(x0 === null) {
				x0 = x1 - fullW;
			}
			switch(config.labelAttrs['text-anchor']) {
			case 'middle':
				labelNode.set({
					x: (
						x0 + config.padding.left +
						x1 - config.padding.right
					) / 2,
					y,
				});
				break;
			case 'end':
				labelNode.set({x: x1 - config.padding.right, y});
				break;
			default:
				labelNode.set({x: x0 + config.padding.left, y});
				break;
			}

			env.shapeLayer.appendChild(config.boxRenderer({
				x: x0,
				y: env.topY + config.margin.top,
				width: x1 - x0,
				height: fullH,
			}));

			return (
				env.topY +
				config.margin.top +
				fullH +
				config.margin.bottom +
				env.theme.actionMargin
			);
		}
	}

	class NoteOver extends NoteComponent {
		separation({agentNames, mode, label}, env) {
			const config = env.theme.note[mode];
			const width = (
				env.textSizer.measure(config.labelAttrs, label).width +
				config.padding.left +
				config.padding.right
			);

			const {left, right} = findExtremes(env.agentInfos, agentNames);
			const infoL = env.agentInfos.get(left);
			const infoR = env.agentInfos.get(right);
			if(infoL !== infoR) {
				const hangL = infoL.currentMaxRad + config.overlap.left;
				const hangR = infoR.currentMaxRad + config.overlap.right;

				env.addSeparation(left, right, width - hangL - hangR);

				env.addSpacing(left, {left: hangL, right: 0});
				env.addSpacing(right, {left: 0, right: hangR});
			} else {
				env.addSpacing(left, {
					left: width / 2,
					right: width / 2,
				});
			}
		}

		render({agentNames, mode, label}, env) {
			const config = env.theme.note[mode];

			const {left, right} = findExtremes(env.agentInfos, agentNames);
			const infoL = env.agentInfos.get(left);
			const infoR = env.agentInfos.get(right);
			if(infoL !== infoR) {
				return this.renderNote({
					x0: infoL.x - infoL.currentMaxRad - config.overlap.left,
					x1: infoR.x + infoR.currentMaxRad + config.overlap.right,
					anchor: 'middle',
					mode,
					label,
				}, env);
			} else {
				const xMid = infoL.x;
				return this.renderNote({
					xMid,
					anchor: 'middle',
					mode,
					label,
				}, env);
			}
		}
	}

	class NoteSide extends NoteComponent {
		constructor(isRight) {
			super();
			this.isRight = isRight;
		}

		separation({agentNames, mode, label}, env) {
			const config = env.theme.note[mode];
			const {left, right} = findExtremes(env.agentInfos, agentNames);
			const width = (
				env.textSizer.measure(config.labelAttrs, label).width +
				config.padding.left +
				config.padding.right +
				config.margin.left +
				config.margin.right
			);

			if(this.isRight) {
				const info = env.agentInfos.get(right);
				env.addSpacing(right, {
					left: 0,
					right: width + info.currentMaxRad,
				});
			} else {
				const info = env.agentInfos.get(left);
				env.addSpacing(left, {
					left: width + info.currentMaxRad,
					right: 0,
				});
			}
		}

		render({agentNames, mode, label}, env) {
			const config = env.theme.note[mode];
			const {left, right} = findExtremes(env.agentInfos, agentNames);
			if(this.isRight) {
				const info = env.agentInfos.get(right);
				const x0 = info.x + info.currentMaxRad + config.margin.left;
				return this.renderNote({
					x0,
					anchor: 'start',
					mode,
					label,
				}, env);
			} else {
				const info = env.agentInfos.get(left);
				const x1 = info.x - info.currentMaxRad - config.margin.right;
				return this.renderNote({
					x1,
					anchor: 'end',
					mode,
					label,
				}, env);
			}
		}
	}

	class NoteBetween extends NoteComponent {
		separation({agentNames, mode, label}, env) {
			const config = env.theme.note[mode];
			const {left, right} = findExtremes(env.agentInfos, agentNames);
			const infoL = env.agentInfos.get(left);
			const infoR = env.agentInfos.get(right);

			env.addSeparation(
				left,
				right,

				env.textSizer.measure(config.labelAttrs, label).width +
				config.padding.left +
				config.padding.right +
				config.margin.left +
				config.margin.right +
				infoL.currentMaxRad +
				infoR.currentMaxRad
			);
		}

		render({agentNames, mode, label}, env) {
			const {left, right} = findExtremes(env.agentInfos, agentNames);
			const infoL = env.agentInfos.get(left);
			const infoR = env.agentInfos.get(right);
			const xMid = (
				infoL.x + infoL.currentMaxRad +
				infoR.x - infoR.currentMaxRad
			) / 2;

			return this.renderNote({
				xMid,
				anchor: 'middle',
				mode,
				label,
			}, env);
		}
	}

	NoteComponent.NoteOver = NoteOver;
	NoteComponent.NoteSide = NoteSide;
	NoteComponent.NoteBetween = NoteBetween;

	BaseComponent.register('note over', new NoteOver());
	BaseComponent.register('note left', new NoteSide(false));
	BaseComponent.register('note right', new NoteSide(true));
	BaseComponent.register('note between', new NoteBetween());

	return NoteComponent;
});