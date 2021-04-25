import { useEffect, useState } from 'react'
import './styles/style.scss'

type InputSpaceProps = {
	onInput: (word: string) => boolean,
}

export default function InputSpace(props: InputSpaceProps) {

	const [inputValue, setInputValue] = useState("");
	const [borderColor, setBorderColor] = useState("grey");

	function handleChange(e: any) {
		setInputValue(e.target.value);
	}

	useEffect(() => {
		document.querySelector("#inputspace")!.addEventListener('keydown', handleKeyPress as any);
		return () => {
			document.querySelector("#inputspace")!.removeEventListener('keydown', handleKeyPress as any);
		}
	}, [inputValue])

	function handleKeyPress(e: KeyboardEvent) {
		if (e.key == 'Enter') {
			handleEnterPressed();
		}
	}

	function flashBorderColor(color: string) {
		setBorderColor(color);
		setTimeout(() => {
			setBorderColor('grey');
		}, 1500);
	}

	function handleEnterPressed() {
		let response = props.onInput(inputValue);
		if (response) {
			flashBorderColor('rgb(2, 218, 2)');
		}
		else {
			flashBorderColor('red');
		}
		setInputValue('');
	}

	return (
		<input style={{ borderBottomColor: borderColor }} type="text" id="inputspace" onChange={(e) => handleChange(e)} value={inputValue} placeholder="enter a word"></input>
	)
}