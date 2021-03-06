import ComponentsLibrary from './interface/ComponentsLibrary.mjs';
import HashSlotNav from './slots/HashSlotNav.mjs';
import Interface from './interface/Interface.mjs';
import LocalStorage from './storage/LocalStorage.mjs';
import MultiLocalStorage from './storage/MultiLocalStorage.mjs';
import SequenceDiagram from '../../scripts/sequence/SequenceDiagram.mjs';
import SlotLocalStores from './slots/SlotLocalStores.mjs';
import requestSlot from './slots/requestSlot.mjs';
import {require} from './requireCDN.mjs';

const defaultCode = (
	'title Challenge\n' +
	'\n' +
	'begin A, B, C\n' +
	'A -> B : Login to Application\n' +
	'A -> B : Select Product & Payment\n' +
	'B -> C : Checking product eligible\n' +
	'B -> C : Submit Request\n' +
	'C --> B : Request Success\n' +
	'B --> A : Notification Success\n' +
	'\n' +
	'terminators box\n'
);

function migrateOldDocument(slotStorage) {
	const oldStorage = new LocalStorage('src');
	const doc = oldStorage.get();
	if(doc) {
		const newSlot = slotStorage.nextAvailableSlot();
		slotStorage.set(newSlot, doc);
		oldStorage.remove();
	}
}

function loadHashDocument(hashNav, slotStorage) {
	const editPrefix = 'edit:';
	const hash = hashNav.getRawHash();
	if(!hash.startsWith(editPrefix)) {
		return;
	}

	let doc = hash
		.substr(editPrefix.length)
		.split('/')
		.map(decodeURIComponent)
		.join('\n');

	if(!doc) {
		return;
	}

	if(!doc.endsWith('\n')) {
		doc += '\n';
	}

	const newSlot = slotStorage.nextAvailableSlot();
	slotStorage.set(newSlot, doc);
	hashNav.setSlot(newSlot);
}

window.addEventListener('load', () => {
	const loader = window.document.getElementById('loader');
	const [nav] = loader.getElementsByTagName('nav');
	const linkElements = nav.getElementsByTagName('a');
	const links = [];
	for(let i = 0; i < linkElements.length; ++ i) {
		const element = linkElements[i];
		links.push({
			href: element.getAttribute('href'),
			label: element.textContent,
			target: element.getAttribute('target'),
			touchLabel: element.dataset.touch,
		});
	}

	const slotStorage = new SlotLocalStores();
	migrateOldDocument(slotStorage);

	const hashNav = new HashSlotNav(() => {
		// If the slot is changed by the user, reload to force a document load
		window.location.reload();
	});
	loadHashDocument(hashNav, slotStorage);

	loader.parentNode.removeChild(loader);

	requestSlot(hashNav, slotStorage).then(() => {
		const ui = new Interface({
			defaultCode,
			library: ComponentsLibrary,
			links,
			require,
			sequenceDiagram: new SequenceDiagram(),
			storage: new MultiLocalStorage(hashNav, slotStorage),
			touchUI: ('ontouchstart' in window),
		});
		ui.build(window.document.body);
	});
});
