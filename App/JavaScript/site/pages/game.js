import { populateControllerList } from "../utils/controller_detect";

export function InitGamePage()
{    
    populateControllerList("gamepad-select");
    setUpListeners();
}

function setUpListeners()
{
    debugger;
    /**
     * Controller refresh button
     *
     * @type {HTMLButtonElement}
     */
    const btn = document.getElementById('refresh-gamepad-select');

    btn.addEventListener('click', refreshGamePadList);

    window.addEventListener("gamepadconnected", (event) => {
        console.log("Gamepad connected:", event.gamepad);
      });
    
      
    /**
     * Description placeholder
     *
     * @type {HTMLSelectElement}
     */
    const select = document.getElementById("gamepad-select");


    select.addEventListener("change", (event) => {

        const selectedValue = event.target.value;

        console.log("Selected gamepad:", selectedValue);

        
        /**
         * button to start game
         *
         * @type {HTMLButtonElement}
         */
        const btn = document.getElementById('start-game');

        btn.disabled = false;
    });
}

function refreshGamePadList()
{
    populateControllerList("gamepad-select");
}

