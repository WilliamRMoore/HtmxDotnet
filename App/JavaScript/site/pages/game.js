import { populateControllerList } from "../utils/controller_detect";

export function InitGamePage()
{    
    //populateControllerList("p1-gamepad-select");
    setUpListeners();
}

let gameMode = -1;

function setUpListeners()
{
    const modeSelect = document.getElementById('mode-select');
    modeSelect.addEventListener('change', (event) => {
        const selectedValue = event.target.value;
        if(selectedValue == 1 || 2){
            document.getElementById("p1-gamepad-select").disabled = false;
        }
        if(selectedValue == 2){
            document.getElementById('p2-gamepad-select').disabled = false;
        }

        if(selectedValue > 0) {
            document.getElementById('refresh-gamepad-select').disabled = false;
        }else {
            document.getElementById('refresh-gamepad-select').disabled = true;
        }

        gameMode = selectedValue;
    });
    /**
     * Controller refresh button
     *
     * @type {HTMLButtonElement}
     */
    const refreshBtn = document.getElementById('refresh-gamepad-select');

    refreshBtn.addEventListener('click', refreshGamePadList);

    window.addEventListener("gamepadconnected", (event) => {
        console.log("Gamepad connected:", event.gamepad);
      });
    
      
    /**
     * Description placeholder
     *
     * @type {HTMLSelectElement}
     */
    const p1Select = document.getElementById("p1-gamepad-select");
    const p2Select = document.getElementById('p2-gamepad-select');


    p1Select.addEventListener("change", (event) => {

        const selectedValue = event.target.value;

        console.log("Selected gamepad:", selectedValue);

        
        /**
         * button to start game
         *
         * @type {HTMLButtonElement}
         */
        const btn = document.getElementById('start-game');

        if(canStart()){
            btn.disabled = false;
        }
    });
    
    p2Select.addEventListener("change", (event) => {

        const selectedValue = event.target.value;

        console.log("Selected gamepad:", selectedValue);

        
        /**
         * button to start game
         *
         * @type {HTMLButtonElement}
         */
        const btn = document.getElementById('start-game');

        if(canStart()){
            btn.disabled = false;
        }
    });
}

function canStart(){
    if(gameMode == 1){
        let p1Val = document.getElementById('p1-gamepad-select').value;

        if(p1Val != undefined){
            return true;
        }
    }

    if(gameMode == 2){
        let p1Val = document.getElementById('p1-gamepad-select').value;
        let p2Val = document.getElementById('p2-gamepad-select').value;

        if(p1Val != undefined && p2Val != undefined){
            return true;
        }
    }

    return false;
}

function refreshGamePadList()
{
    populateControllerList("p1-gamepad-select");
    populateControllerList("p2-gamepad-select");
}

