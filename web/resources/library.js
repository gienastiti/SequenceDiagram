/* globals SequenceDiagram CodeMirror */

document.addEventListener('DOMContentLoaded', () => {
	const diagrams = [];

	// Example 1:
	(() => {
		const diagram = new SequenceDiagram();
		diagram.set('A -> B\nB -> A', {render: false});
		diagram.dom().setAttribute('class', 'sequence-diagram');
		document.getElementById('hold1').appendChild(diagram.dom());
		diagram.setHighlight(1);
		diagrams.push(diagram);
	})();

	// Snippets:
	const elements = document.getElementsByClassName('example');
	for(let i = 0; i < elements.length; ++ i) {
		const el = elements[i];
		const diagram = new SequenceDiagram(el.textContent, {render: false});
		diagram.dom().setAttribute('class', 'example-diagram');
		el.parentNode.insertBefore(diagram.dom(), el);
		diagrams.push(diagram);
	}

	SequenceDiagram.renderAll(diagrams);

	if(CodeMirror && CodeMirror.colorize) {
		CodeMirror.colorize();
	}
}, {once: true});
