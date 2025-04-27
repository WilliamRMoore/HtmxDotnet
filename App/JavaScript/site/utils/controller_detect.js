/**
 * Retrieves a map of connected gamepads, where the key is the gamepad ID and the value is its index.
 *
 * @returns {Map<string, number>|false} A map of gamepad IDs to their indices if gamepads are connected, or `false` if no gamepads are detected.
 */
function GetConnectedGamePads() {
    const gamePads = navigator.getGamepads();

    let anyGps = false;
    gamePads.values().forEach(
    /**
     * Description placeholder
     *
     * @param {Gamepad | null} gp
     */
    gp => {
        if(gp)
        {
            anyGps = true;
        }
    });

    if(!anyGps)
    {
        console.log("no controller detected");
        return false;
    }

    /** 
     * A map storing gamepad options with string keys and numeric values.
     * 
     * @type {Map<string, number>}
     */
    const gpOptions = new Map();

    let i = 0;
    for (const gp of gamePads)
    {
        i++;
        if(gp)
        {
            gpOptions.set(`${gp.id} -${i}`, gp.index);
        }
    }

    return gpOptions
}


/**
 * Populates the controller select list with a list of available controllers
 *
 * @param {string} selectId
 */
export function populateControllerList(selectId)
{
    /**
     * Description placeholder
     *
     * @type {HTMLSelectElement}
     */
    const elem = document.getElementById(selectId);

    if (!elem || !(elem instanceof HTMLSelectElement)) {
        console.error(`Element with ID '${selectId}' is not a valid <select> element.`);
        return;
    }

    elem.innerHTML = "";

    const gamePads = GetConnectedGamePads();

    if (gamePads === false) {
        //Add a default option if no gamepads are detected
        const option = document.createElement("option");
        option.value = "";
        option.textContent = "No controllers connected";
        option.selected = true;
        elem.appendChild(option);
        return;
   }else {
    const option = document.createElement("option");
    option.value = "";
    option.textContent = "No controllers connected";
    option.selected = true;
    elem.appendChild(option);
   }

       // Populate the select element with gamepad options
    gamePads.forEach((index, id) => {
        const option = document.createElement("option");
        option.value = index;
        option.textContent = id;
        elem.appendChild(option);
    });
}