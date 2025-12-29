let currentPage: number = 1; // huidige pagina
let maxPage: number = 0; // maximale pagina's die er zijn

let OutPutClass: string = '';

function updatePageCount(){
    // zoekt de destination element op basis van de class
    const destinationEl = document.getElementsByClassName(OutPutClass)[0];

    // als de destination element gevonde is dan print hij het
    if (destinationEl){
        destinationEl.textContent = 'Pagina ' + currentPage + ' van ' + maxPage;
    }
}

export function scrollSlider(id: string, direction: number): void {
    const slider = document.getElementById(id);

    if (!slider) return;

    const pageWidth = slider.clientWidth;

    // bereken nieuwe pagina en wrap/clamp
    let newPage = currentPage + direction;
    if (newPage > maxPage) newPage = 1;
    if (newPage < 1) newPage = maxPage;
    
    const targetLeft = (newPage - 1) * pageWidth;
    slider.scrollTo({ left: targetLeft, behavior: 'smooth' });

    currentPage = newPage;
    updatePageCount();
}

export function CountPages(countClass: string, DestinationClass: string) {
    OutPutClass = DestinationClass;

    const elementsToCount = document.getElementsByClassName(countClass);
    maxPage = elementsToCount.length || 0;

    if (maxPage === 0) {
        currentPage = 0;
    } else {
        currentPage = Math.min(Math.max(1, currentPage), maxPage);
    }

    updatePageCount();

    console.log("Totaal aantal pagina's gemeten: " + maxPage);
}