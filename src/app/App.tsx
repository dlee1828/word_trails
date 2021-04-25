import { workerData } from 'node:worker_threads';
import { useEffect, useState } from 'react'
import InputSpace from './InputSpace';
import './styles/style.scss'

type WordResponse = {
	word: string,
	score: number,
	numSyllables: number,
}[]


export default function App() {

	const apiEndpoint = "https://api.datamuse.com/words?md=s&max=20";
	const [wordList, setWordList] = useState([] as string[]);
	const [chain, setChain] = useState([] as string[]);

	async function getWordList() {
		const response = await fetch("https://raw.githubusercontent.com/dlee1828/short_words/main/shortwords.txt");
		const responseText = await response.text();
		const arr = responseText.split('\n');
		setWordList(arr);
	}

	useEffect(() => {
		getWordList();
	}, [])

	function getRandomWord() {
		return wordList[Math.floor(Math.random() * wordList.length)];
	}

	function getRhymeApiSuffx(word: string) {
		return "&rel_rhy=" + word;
	}
	function getRelatedApiSuffx(word: string) {
		return "&rel_syn=" + word;
	}

	function randomizeElements(arr: any[]) {
		let len = arr.length;
		// Deep copy
		let copy: any[] = JSON.parse(JSON.stringify(arr));
		for (let i = 0; i < len; i++) {
			let random = Math.floor(Math.random() * copy.length);
			arr[i] = copy[random];
			// remove from copy
			copy.splice(random, 1);
		}
		return arr;
	}

	async function getRhymes(word: string): Promise<WordResponse> {
		const response = await fetch(apiEndpoint + getRhymeApiSuffx(word));
		return randomizeElements((await response.json()) as WordResponse);
	}

	async function getRelated(word: string): Promise<WordResponse> {
		const response = await fetch(apiEndpoint + getRelatedApiSuffx(word));
		return randomizeElements((await response.json()) as WordResponse);
	}

	const fitNum = 5; // # of rhymes/related items a word must have to satisfy "good"
	async function getGoodRhyme(word: string): Promise<string> {
		const rhymes = await getRhymes(word);
		let rhyme = "*"; // * is returned if none are found
		for (let item of rhymes) {
			if (item.numSyllables > 2) continue;
			if ((await getRelated(item.word)).length < fitNum) continue;
			rhyme = item.word;
		}
		return rhyme;
	}

	async function getGoodRelated(word: string): Promise<string> {
		const related = await getRelated(word);
		let ans = "*"; // * is returned if none are found
		let count = 0;
		for (let item of related) {
			if (item.numSyllables > 2) continue;
			if ((await getRhymes(item.word)).length < fitNum) continue;
			ans = item.word;
		}
		return ans;
	}

	async function tryGenerateWordChain(length: number): Promise<string[]> {
		// related, rhyme, related, rhyme, ...
		let currWord = getRandomWord();
		let chain: string[] = [currWord];
		let nextType: 'related' | 'rhyme' = 'related';
		let nextWord: string;
		for (let i = 0; i < length - 1; i++) {
			if (nextType == 'related') {
				nextType = 'rhyme';
				nextWord = await getGoodRhyme(currWord);
				currWord = nextWord;
			}
			else {
				nextType = 'related';
				nextWord = await getGoodRelated(currWord);
				currWord = nextWord;
			}
			chain.push(currWord);
		}
		return chain;
	}

	async function generateWordChain(length: number): Promise<string[]> {
		let chain;
		while (true) {
			console.log("called");
			chain = await tryGenerateWordChain(length);
			if (chain[length - 1] != '*') break;
		}
		return chain;
	}

	function handleInput(word: string): boolean {
		// returns if input was right or wrong
		return true;
	}



	return (
		<div className="root">
			<InputSpace onInput={(word) => handleInput(word)}></InputSpace>
		</div>
	)
}