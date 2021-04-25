import { workerData } from 'node:worker_threads';
import { useEffect, useState } from 'react'
import './styles/style.scss'

export default function App() {

	const [text, setText] = useState("");
	const [desc, setDesc] = useState("");
	const apiEndpoint = "https://api.datamuse.com/";

	function getRhymeApiSuffx(word: string) {
		return "/words?md=s&rel_rhy=" + word;
	}
	function getRelatedApiSuffx(word: string) {
		return "/words?md=s&rel_trg=" + word;
	}

	async function process(word: string) {
		const url = apiEndpoint + getRelatedApiSuffx(word);
		let response = await fetch(url);
		setDesc(await response.text());
	}

	useEffect(() => {
		document.querySelector('input')!.addEventListener('keypress', function (e) {
			if (e.key === 'Enter') {
				process(text);
			}
		});
	}, [text])

	return (
		<div className="root">
			<input type="text" onChange={(e) => setText(e.target.value)} value={text}></input>
			<div style={{ marginTop: '50px', color: 'white' }}>{desc}</div>
		</div>
	)
}