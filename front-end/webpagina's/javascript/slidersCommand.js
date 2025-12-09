
function scrollSlider(id, direction) {
    const slider = document.getElementById(id);
    const scrollAmount = 300;
    const maxScroll = slider.scrollWidth - slider.clientWidth; // Noodzakelijk voor de logica

    if (direction > 0 && slider.scrollLeft + slider.clientWidth >= slider.scrollWidth - 5) {
    // aan einde, ga terug naar begin
    slider.scrollTo({ left: 0, behavior: 'smooth' });
    } else if (direction < 0 && slider.scrollLeft <= 5) {
    // aan begin, ga naar einde
    slider.scrollTo({ left: maxScroll, behavior: 'smooth' });
    } else {
    // normale scroll
    slider.scrollBy({ left: direction * scrollAmount, behavior: 'smooth' });
    }
}