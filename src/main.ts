import './style.css';
import * as chroma from 'chroma.ts'

//* Global Variables
const colorDivs = document.querySelectorAll<HTMLDivElement>(".color");
const colorHexes = document.querySelectorAll<HTMLHeadElement>(".color h2");
const sliders = document.querySelectorAll<HTMLInputElement>('input[type="range"]');
const generateBtn = document.querySelector(".generate") as HTMLButtonElement;
const adjustBtn = document.querySelectorAll<HTMLButtonElement>(".adjust-btn");
const lockBtn = document.querySelectorAll<HTMLButtonElement>(".lock-btn");
const sliderContainer = document.querySelectorAll<HTMLDivElement>(".sliders");
const closeSlidersBtn = document.querySelectorAll<HTMLButtonElement>(".close-sliders");
const copyPopup = document.querySelector<HTMLDivElement>(".copy-container");
let initialColors: any | string [];


//* For Local Storage
let savedPalettes: any[] = [];

//* Event Listeners
// document.addEventListener("DOMContentLoaded", colorizeSliders);
generateBtn.addEventListener("click", randomColors);
// 
sliders.forEach(slider => {
    slider.addEventListener("input", hslControls);
}); 
// 
colorDivs.forEach((div: Element, index: number) => {
    div.addEventListener("change", () => {
        updateTextUI(index);
    });
});
// 
adjustBtn.forEach((btn: Element, index:number) => {
    btn.addEventListener("click", () => {
        openSliders(index);
    });
});
// 
closeSlidersBtn.forEach((btn: Element, index: number) => {
    btn.addEventListener("click", () => {
        closeSliders(index);
    });
});
// 
lockBtn.forEach((btn: Element, index: number) => {
    btn.addEventListener("click", (e: Event) =>{
        toggleLockBtn(index, e);
    });
});
// 
colorHexes.forEach(hex =>{
    hex.addEventListener("click", () => {
        copyToClipboard(hex);
    });
});

copyPopup?.addEventListener("transitionend", () => {
    const popup = copyPopup?.children[0];
    popup?.classList.remove("active");
    copyPopup?.classList.remove("active");
})

//* Functions
const generateHexes = () => {
    const colorHex = chroma.random();
    return colorHex;
};

function randomColors () {
    initialColors = [];
    colorDivs.forEach((div, _index) => {
        //* Declaring the color and hex variables
        const randomColor = generateHexes();
        const hexText  = div.children[0];

        //* Add it to the initialColors array
        if (div.classList.contains('locked')) {
            initialColors.push(hexText.innerHTML);
            return;
        } else {
           initialColors.push(randomColor.hex()); 
        };

        //* Add the colors to the background
        div.style.backgroundColor = randomColor.hex();
        hexText.innerHTML = randomColor.hex();
        
        //* Check Contrast
        checkContrast(randomColor, hexText);

        // //* Colorize the sliders
        const color: string = randomColor.hex();
        const sliders: NodeListOf<Element> = div.querySelectorAll('.sliders input');
        const hue: Element = sliders[0];
        const brightness: Element = sliders[1];
        const saturation: Element = sliders[2];
        colorizeSliders(color, hue, brightness, saturation);
    });

    //* Check Contrast for Adjust & Lock btn
    adjustBtn.forEach((btn: Element, index: number) => {
        checkContrast(initialColors[index], btn);
        checkContrast(initialColors[index], lockBtn[index]);
    });
    //* Reset Inputs
    resetInputs();
};


const checkContrast = (colors: chroma.Color, text: any) => {
    const luminance :number = chroma.color(colors).luminance();
    if (luminance > 0.5) {
        text.style.color = "black";
    } else {
        text.style.color = "white";
    };
};

const colorizeSliders = (colors: any, hue: any, brightness: any, saturation: any) => {
    //* Scale Saturation
    const noSat: chroma.Color = chroma.color(colors).set('hsl.s', 0);
    const fullSat: chroma.Color = chroma.color(colors).set('hsl.s', 0);
    const scaleSat: chroma.Scale<chroma.Color> = chroma.scale([noSat, colors, fullSat]);

    //* Scale Brightness
    const midBright: chroma.Color = chroma.color(colors).set('hsl.l', 0);
    const scaleBright: chroma.Scale<chroma.Color> = chroma.scale(['black', midBright, 'white']);

    //* Add the sliders color
    saturation.style.backgroundImage = `linear-gradient(to right, ${scaleSat(0)}, ${scaleSat(1)})`;
    brightness.style.backgroundImage = `linear-gradient(to right, ${scaleBright(0)}, ${scaleBright(0.5)}, ${scaleBright(1)})`;
    hue.style.backgroundImage = `linear-gradient(to right, rgb(204, 75, 75), rgb(204, 204, 75), rgb(75, 204, 75), rgb(75, 204, 204), rgb(75, 75, 204), rgb(204, 75, 204), rgb(204, 75, 75))`;
};

function hslControls (e: Event) {
    const target = e.target as HTMLInputElement;
    const index: any =
    target.getAttribute('data-hue') ??
    target.getAttribute('data-bright') ??
    target.getAttribute('data-sat');
    // 
    const sliders: any = target.parentElement?.querySelectorAll('.sliders input');
    const hue: number = sliders[0].valueAsNumber;
    const brightness: number = sliders[1].valueAsNumber;
    const saturation: number = sliders[2].valueAsNumber;
    // 
    const bgColor: string = initialColors[index];
    const colors: chroma.Color = chroma.color(bgColor)
    .set('hsl.h', hue)
    .set('hsl.s', saturation)
    .set('hsl.l', brightness);
    //
    colorDivs[index].style.backgroundColor = colors.hex();

    //* Changes the color whenever you move the sliders
    colorizeSliders(colors, sliders[0], sliders[1], sliders[2]);
};

function updateTextUI(index: number) {
    const activeDiv: any = colorDivs[index];
    const colors: chroma.Color  = chroma.color(activeDiv.style.backgroundColor);
    const hexText = activeDiv.querySelector("h2");
    const icons = activeDiv.querySelectorAll("controls button");
    hexText.innerText = colors.hex();

    //* Check Contrast
    checkContrast(colors, hexText);
    for (const icon of icons) {
        checkContrast(colors, icon)
    };
};

// * This function makes the sliders to the excat position of how the color is displayed.... 
const resetInputs = () => {

    const sliders = document.querySelectorAll(".sliders input") as NodeListOf<HTMLInputElement>;
    sliders.forEach(slider => {
        if (slider.name === 'hue') {
            const hueAttr = slider.getAttribute('data-hue');
            if (hueAttr !== null) {
                const hueColor = initialColors[hueAttr];
                const hueValue = chroma.color(hueColor).hsl()[0];
                slider.value = Math.floor(hueValue).toString();
            }
        };
        // 
        if (slider.name === 'saturation') {
            const satAttr = slider.getAttribute('data-sat');
            if (satAttr !== null) {
                const satColor = initialColors[satAttr];
                const satValue = chroma.color(satColor).hsl()[0];
                slider.value = Math.floor(satValue).toString();
            }
        }; 
        // 
        if (slider.name === 'brightness') {
            const brightAttr = slider.getAttribute('data-bright');
            if (brightAttr !== null) {
                const hueColor = initialColors[brightAttr];
                const hueValue = chroma.color(hueColor).hsl()[0];
                slider.value = Math.floor(hueValue).toString();
            }
        };
    })  
};

function openSliders(index: number) {
    sliderContainer[index].classList.toggle("active");
};

function closeSliders(index: number) {
    sliderContainer[index].classList.remove("active");
};

function toggleLockBtn(index: number, e:Event) {
    const target = e.target as Element;
    const lockSVG = target.children[0];
    const activeDiv = colorDivs[index];
    activeDiv.classList.toggle("locked");
    // 
    if (lockSVG.classList.contains('fa-lock-open')) {
        target.innerHTML = '<i class="fas fa-lock"></i>';
    } else {
        target.innerHTML = '<i class="fas fa-lock-open"></i>';
    };
};

function copyToClipboard(hex: Element) {
    const element: HTMLTextAreaElement = document.createElement("textarea");
    element.value = hex.innerHTML;
    document.body.appendChild(element);
    element.select();
    document.execCommand('copy');
    document.body.removeChild(element);
    console.log(element.value);
    //* For the transition
    const popup = copyPopup?.children[0];
    popup?.classList.add("active");
    copyPopup?.classList.add("active");
};

//? Implement Sve, Library & Local Storage
const saveContainer = document.querySelector<HTMLDivElement>(".save-container");
const saveBtn = document.querySelector<HTMLButtonElement>(".save");
const submitSaveBtn = document.querySelector<HTMLButtonElement>(".submit-save");
const saveInput = document.querySelector(".save-input") as HTMLInputElement ;
const closeSaveBtn = document.querySelector<HTMLButtonElement>(".close-save");
const libraryContainer = document.querySelector<HTMLDivElement>(".library-container");
const libraryBtn = document.querySelector<HTMLButtonElement>(".library");
const closeLibraryBtn = document.querySelector<HTMLButtonElement>(".close-library");
const clearLibraryBtn = document.querySelector<HTMLButtonElement>(".clear-library");
const paletteContainer = document.querySelector<HTMLDivElement>(".palette-container");

//? Event Listeners 
saveBtn?.addEventListener("click", openSave);
closeSaveBtn?.addEventListener("click", closeSave);
submitSaveBtn?.addEventListener("click", submitSave);
libraryBtn?.addEventListener("click", openLibrary);
closeLibraryBtn?.addEventListener("click", closeLibrary);
clearLibraryBtn?.addEventListener("click", clearLibrary)

//? Functions
function openSave() {
    const popup = saveContainer?.children[0];
    saveContainer?.classList.add("active");
    popup?.classList.add("active");
};

function closeSave() {
    const popup = saveContainer?.children[0];
    saveContainer?.classList.remove("active");
    popup?.classList.remove("active");
};

function submitSave() {
    if (saveInput?.value === "") {
        alert("Input A Name")
    } else {
        const name: any = saveInput?.value;
        const colors: any[] = [];
        colorHexes.forEach(hex => {
            colors.push(hex.innerText);
        });     
        let paletteNo: any;
        const paletteObjects: any = JSON.stringify(localStorage.getItem("palettes") || "[]");
        if (paletteObjects) {
            paletteNo = paletteObjects.length;
        } else {
            paletteNo = savedPalettes.length;
        };
        //* Generating the object
        const paletteObj = {name, colors, no: paletteNo};
        savedPalettes.push(paletteObj);
        saveToLocal(paletteObj);
        saveInput.value = "";
        //* Create the palette in the library
        const palette: Element = document.createElement('div');
        palette.classList.add("custom-palette");
        // 
        const paletteName: Element = document.createElement("h4");
        paletteName.innerHTML = paletteObj.name;
        // 
        const smallPreview: Element =  document.createElement('div');
        smallPreview.classList.add("small-preview");
        paletteObj.colors.forEach(smallcolor => {
            const smallDiv = document.createElement("div");
            smallDiv.style.backgroundColor = smallcolor;
            smallPreview.append(smallDiv);
        });
        // 
        const selectLibrary = document.createElement("button");
        selectLibrary.classList.add("pick-palette-btn");
        selectLibrary.classList.add(paletteObj.no);
        selectLibrary.innerText = "Select";
        // 
        const deleteLibrary = document.createElement("button");
        deleteLibrary.classList.add("delete-palette-btn");
        deleteLibrary.classList.add(paletteObj.no);
        deleteLibrary.innerText = "Delete";

        //* Event Listeners for buttons
        selectLibrary.addEventListener("click", () => {
            closeLibrary();
            // console.log(colors);
            paletteObj.colors.forEach((color: any, index: number) => {
               initialColors.push(color);
               colorDivs[index].style.backgroundColor = color;
               const text: Element = colorDivs[index].children[0];
               checkContrast(color, text);
               updateTextUI(index);
            });
            resetInputs();
        });
        // 
        deleteLibrary.addEventListener("click", () => {
            //* Remove from DOM
            palette.remove();
            //* Remove from storage
            const updatePalettes = JSON.parse(localStorage.getItem("palettes") || "[]").filter(
                (p: any) => p.no !== paletteObj.no
            );
            localStorage.setItem("palettes", JSON.stringify(updatePalettes));
            //* Remove from savedPalettes array
            const index = savedPalettes.findIndex(p => p.no === paletteObj.no);
            if (index !== -1 ) {
                savedPalettes.splice(index, 1);
            };  
        });

        //* Append the childrens
        palette.appendChild(paletteName);
        palette.appendChild(smallPreview);
        palette.appendChild(selectLibrary);
        // 
        paletteContainer?.appendChild(palette);
        closeSave();
    };

    
};

const saveToLocal = (paletteObj:any) => {
    let localPalettes: any[];
    if (localStorage.getItem('palettes') === null) {
        localPalettes = [];
    } else {
        localPalettes = JSON.parse(localStorage.getItem("palettes") || "[]"); 
    };

    localPalettes.push(paletteObj);
    localStorage.setItem("palettes", JSON.stringify(localPalettes));
};

function openLibrary() {
    const popup = libraryContainer?.children[0];
    libraryContainer?.classList.add("active");
    popup?.classList.add("active");
};

function closeLibrary() {
    const popup = libraryContainer?.children[0];
    libraryContainer?.classList.remove("active");
    popup?.classList.remove("active");
};

function clearLibrary() {
    while (paletteContainer?.firstChild) {
        paletteContainer.removeChild(paletteContainer.firstChild);
    };
    localStorage.clear();
};

const getLocal = () => {
    if (localStorage.getItem("palettes") === null) {
    } else {
        const paletteObjects: any = JSON.parse(localStorage.getItem("palettes") || "[]");
        // console.log(paletteObjects);
        savedPalettes.push(paletteObjects);
        // savedPalettes[paletteObjects];
        // 
        paletteObjects.forEach((paletteObj: { name: string; colors: any[]; no: string; }) => {
            //* Create the palette in the library
            const palette: Element = document.createElement('div');
            palette.classList.add("custom-palette");
            // 
            const paletteName: Element = document.createElement("h4");
            paletteName.innerHTML = paletteObj.name;
            // 
            const smallPreview: Element =  document.createElement('div');
            smallPreview.classList.add("small-preview");
            paletteObj.colors.forEach((smallcolor: string) => {
                const smallDiv = document.createElement("div");
                smallDiv.style.backgroundColor = smallcolor;
                smallPreview.append(smallDiv);
            });
            // 
            const selectLibrary = document.createElement("button");
            selectLibrary.classList.add("pick-palette-btn");
            selectLibrary.classList.add(paletteObj.no);
            selectLibrary.innerText = "Select";
            // 
            const deleteLibrary = document.createElement("button");
            deleteLibrary.classList.add("delete-palette-btn");
            deleteLibrary.classList.add(paletteObj.no);
            deleteLibrary.innerText = "Delete";

            //* Event Listeners for buttons
            selectLibrary.addEventListener("click", () => {
                closeLibrary();
                // console.log(colors);
                paletteObj.colors.forEach((color: any, index: number) => {
                initialColors.push(color);
                colorDivs[index].style.backgroundColor = color;
                const text: Element = colorDivs[index].children[0];
                checkContrast(color, text);
                updateTextUI(index);
                });
                resetInputs();
            });

            deleteLibrary.addEventListener("click", () => {
                //* Remove from DOM
                palette.remove();
                //* Remove from storage
                const updatePalettes = JSON.parse(localStorage.getItem("palettes") || "[]").filter(
                    (p: any) => p.no !== paletteObj.no
                );
                localStorage.setItem("palettes", JSON.stringify(updatePalettes));
                //* Remove from savedPalettes array
                const index = savedPalettes.findIndex(p => p.no === paletteObj.no);
                if (index !== -1 ) {
                    savedPalettes.splice(index, 1);
                };  
            });

            //* Append the childrens
            palette.appendChild(paletteName);
            palette.appendChild(smallPreview);
            palette.appendChild(selectLibrary);
            palette.appendChild(deleteLibrary);
            // 
            paletteContainer?.appendChild(palette);
            closeSave();
        });

    };
};

getLocal();
randomColors();