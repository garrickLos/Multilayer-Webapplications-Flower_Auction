export function scrollSlider(id: string, direction: number): void {
    const slider = document.getElementById(id) as HTMLElement | null; 

    if (!slider) {
        console.error(`Slider met ID "${id}" niet gevonden.`);
        return;
    }

    const scrollAmount = 300;
    const maxScroll = slider.scrollWidth - slider.clientWidth;

    if (direction > 0 && slider.scrollLeft + slider.clientWidth >= slider.scrollWidth - 5) {
        slider.scrollTo({ left: 0, behavior: 'smooth' });
    } else if (direction < 0 && slider.scrollLeft <= 5) {
        slider.scrollTo({ left: maxScroll, behavior: 'smooth' });
    } else {
        slider.scrollBy({ left: direction * scrollAmount, behavior: 'smooth' });
    }
}