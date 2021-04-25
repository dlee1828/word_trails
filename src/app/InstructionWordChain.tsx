import './styles/style.scss';

type WordChainProps = {
	chainWords: string[],
	chainLiveValues: string[],
	selectedIndex: number,
	onWordClicked: (index: number) => void,
}

export default function InstructionWordChain(props: WordChainProps) {
	const values = props.chainLiveValues;

	function handleWordClicked(index: number) {
		props.onWordClicked(index);
	}

	return (
		<div className='instructionWordChain'>
			{
				values.map((item, index) => {
					return (
						<div className='chainItem' key={index}>
							<div onClick={() => handleWordClicked(index)} style={{ borderColor: index == props.selectedIndex ? 'purple' : 'black', }} className='chainWord' >
								{item}
							</div>
							<div style={{ display: index == values.length - 1 ? 'none' : 'block' }} className='link'>
							</div>
						</div>
					)
				})
			}
		</div>
	)
}








