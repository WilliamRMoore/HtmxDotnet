import { start } from './loops/local-main';

function GreetingsFromTs() {
  console.log('Greetings from ts!');
}

GreetingsFromTs();

const gamePadSelect = document.getElementById(
  'gamepad-select'
) as HTMLSelectElement;

const starBtn = document.getElementById('start-game') as HTMLButtonElement;

starBtn.addEventListener('click', () => {
  const selectedGamePadIndex = Number.parseInt(gamePadSelect.value);
  console.log(`Selected gamepad index: ${selectedGamePadIndex}`);
  start(selectedGamePadIndex);
});

//start();
