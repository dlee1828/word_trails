import { useEffect, useState } from 'react'
import InputSpace from './InputSpace';
import InstructionWordChain from './InstructionWordChain';
import './styles/style.scss'
import WordChain from './WordChain';

type WordResponse = {
	word: string,
	score: number,
	numSyllables: number,
}[]


export default function App() {

	const apiEndpoint = "https://api.datamuse.com/words?md=s&max=20";
	const [wordList, setWordList] = useState([] as string[]);


	async function getWordList() {
		const response = await fetch("https://raw.githubusercontent.com/dlee1828/short_words/main/shortwords.txt");
		const responseText = await response.text();
		const arr = responseText.split('\n');
		setWordList(arr);
	}

	useEffect(() => {
		getWordList();
	}, [])

	function getRandomWord(): string {
		let word = wordList[Math.floor(Math.random() * wordList.length)];
		if (word.length < 3) return getRandomWord();
		return word;
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
			chain = await tryGenerateWordChain(length);
			if (chain[length - 1] != '*') break;
		}
		return chain;
	}

	function randomValuesInRange(numValues: number, min: number, max: number) {
		let len = max - min;
		let arr = [];
		for (let i = min; i < max; i++) {
			arr.push(i);
		}
		let arr2 = [];
		for (let i = 0; i < numValues; i++) {
			let random = Math.floor(Math.random() * arr.length);
			arr2.push(arr[random]);
			arr.splice(random, 1);
		}
		return arr2;
	}

	// Hide most of the letters in a word
	function hideWord(word: string) {
		// Random from 2 to 3
		let numToShow = Math.floor(Math.random() * 2 + 2);
		if (word.length > 5) {
			numToShow = 4;
		}
		let newWord = "";
		let indices = randomValuesInRange(numToShow, 0, word.length);
		for (let i = 0; i < word.length; i++) {
			if (indices.includes(i)) newWord += word[i];
			else newWord += '_';
		}
		return newWord;
	}

	const minChainLength = 5;
	const maxChainLength = 8;
	const fractionToHide = 0.66;
	async function setGameValues() {
		// Creating word chain
		const chainLength = Math.floor(Math.random() * (maxChainLength - minChainLength) + minChainLength);
		let chain = await generateWordChain(chainLength);
		setWordChain(chain);
		// Setting hidden indices
		let copy = JSON.parse(JSON.stringify(chain));
		const numToHide = Math.ceil(fractionToHide * (chainLength - 2));
		const newHiddenIndices = randomValuesInRange(numToHide, 1, chainLength - 1);
		setHiddenIndices(newHiddenIndices);
		// Setting liveWordChain
		for (let num of newHiddenIndices) copy[num] = hideWord(chain[num]);
		setLiveWordChain(copy);
		for (let i = 0; i < chainLength; i++) {
			if (newHiddenIndices.includes(i)) {
				setSelectedIndex(i)
				break;
			}
		}
	}

	// WORD CHAIN HANDLING

	const [wordChain, setWordChain] = useState([] as string[]);
	const [liveWordChain, setLiveWordChain] = useState([] as string[]);
	const [selectedIndex, setSelectedIndex] = useState(0);
	const [hiddenIndices, setHiddenIndices] = useState([] as number[]);

	function handleWordClicked(index: number) {
		if (hiddenIndices.includes(index)) {
			setSelectedIndex(index);
		}
	}

	function handleInputSubmitted(word: string): boolean {
		if (word == wordChain[selectedIndex]) {
			// Update hiddenIndices
			let newHiddenIndices = [];
			for (let i = 0; i < hiddenIndices.length; i++) {
				if (hiddenIndices[i] != selectedIndex) {
					newHiddenIndices.push(hiddenIndices[i]);
				}
			}
			setHiddenIndices(newHiddenIndices);
			// Update liveWordChain
			let newLiveWordChain = JSON.parse(JSON.stringify(liveWordChain)) as string[];
			newLiveWordChain[selectedIndex] = wordChain[selectedIndex];
			setLiveWordChain(newLiveWordChain);
			// Move on to next, or call handleWon
			for (let i = 0; i < wordChain.length; i++) {
				if (newHiddenIndices.includes(i)) {
					setSelectedIndex(i);
					return true;
				}
			}
			// If got here, game has been won
			setSelectedIndex(-1);
			setGameState('won');
			return true;
		}
		else {
			return false;
		}
	}

	// GAME STATES, BUTTONS

	const [gameState, setGameState] = useState("home" as "home" | "inGame" | "won" | "gaveUp" | "loading");

	function handleShowAnswersClicked() {
		setHiddenIndices([]);
		let newLiveWordChain = liveWordChain;
		for (let i = 0; i < newLiveWordChain.length; i++) {
			newLiveWordChain[i] = wordChain[i];
		}
		setLiveWordChain(newLiveWordChain);
		setSelectedIndex(-1);
		setGameState('gaveUp');
	}

	async function handleAnotherClicked() {
		setGameState('loading');
		await setGameValues();
		setGameState('inGame');
	}

	async function handleStartClicked() {
		setGameState('loading');
		await setGameValues();
		setGameState('inGame');
	}

	function displayCorrectButtons() {
		switch (gameState) {
			case "home":
				return (
					<button onClick={handleStartClicked}>Start</button>
				)
			case "inGame":
				return (
					<button onClick={handleShowAnswersClicked}>Show Answers</button>
				)
			case "won":
				return (
					<div style={{ display: 'flex', flexFlow: 'column nowrap', alignItems: 'center' }}>
						<div>Nice Work!</div>
						<button onClick={handleAnotherClicked}>Another</button>
					</div>
				)
			case "gaveUp":
				return (
					<button onClick={handleAnotherClicked}>Another</button>
				)
		}
	}

	const instructionsChain2 = [
		"clearing",
		"sneering",
		"snide",
		"slide",
		"chute",
		"boot",
	]
	const instructionsChain1 = [
		"[starting word]",
		"[rhyme]",
		"[synonym]",
		"[rhyme]",
		"[synonym]",
		"[rhyme]",
	]

	return (
		<div className="root">
			<div style={{ marginTop: '50px', display: gameState == 'home' ? 'flex' : 'none', flexFlow: 'column nowrap', alignItems: 'flex-start' }}>
				<div style={{ fontSize: '25px' }}>How it works:</div>
				<InstructionWordChain onWordClicked={(index) => { }} selectedIndex={-1} chainLiveValues={instructionsChain1} chainWords={instructionsChain1}></InstructionWordChain>
				<div style={{ fontSize: '25px' }}>For example,</div>
				<InstructionWordChain onWordClicked={(index) => { }} selectedIndex={-1} chainLiveValues={instructionsChain2} chainWords={instructionsChain2}></InstructionWordChain>
				<div style={{ fontSize: '20px' }}>Warning: synonyms can be tricky!</div>
			</div>
			<div className="buttonsArea">
				{
					displayCorrectButtons()
				}
			</div>
			<div style={{ display: gameState == 'home' || gameState == 'loading' ? 'none' : 'flex', flexFlow: 'column nowrap', alignItems: 'center' }}>
				<WordChain onWordClicked={(index) => handleWordClicked(index)} selectedIndex={selectedIndex} chainLiveValues={liveWordChain} chainWords={wordChain}></WordChain>
				<InputSpace onInput={(word) => handleInputSubmitted(word)}></InputSpace>
			</div>
			<div className="loadingOuter">
				<div className='loading' style={{ display: gameState == 'loading' ? 'flex' : 'none', flexFlow: 'column nowrap', alignItems: 'center' }}>
					Loading...
				</div>
			</div>
		</div>
	)
}