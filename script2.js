const slides = document.querySelectorAll('.slide');
const next = document.querySelector('.next');
const prev = document.querySelector('.prev');

let index = 0;

function showSlide(i) {
    slides.forEach(slide => slide.classList.remove('active'));
    slides[i].classList.add('active');
}

function nextSlide() {
    index = (index + 1) % slides.length;
    showSlide(index);
}

function prevSlide() {
    index = (index - 1 + slides.length) % slides.length;
    showSlide(index);
}

next.addEventListener('click', nextSlide);
prev.addEventListener('click', prevSlide);

setInterval(nextSlide, 5000);
let currentIndex = 0;
const totalSlides = 7;

function updateActiveSlide() {
  document.querySelectorAll(".c-title").forEach((el, index) => {
    el.classList.toggle("active", index === currentIndex);
  });
}

function handleCarousel() {
  currentIndex = (currentIndex + 1) % totalSlides;

  gsap.to(".carousel-titles", {
    x: `-${currentIndex * (100 / totalSlides)}%`,
    duration: 1.5,
    ease: "power4.out",
    onStart: () => {
      updateActiveSlide();
      updateImages(currentIndex + 1);
    }
  });
}

gsap.registerPlugin(ScrollTrigger);

gsap.utils.toArray(".impact-block").forEach((block) => {

  const direction = block.classList.contains("left") ? -100 : 100;

  gsap.fromTo(block,
    { x: direction, opacity: 0 },
    {
      x: 0,
      opacity: 1,
      duration: 1,
      ease: "power3.out",
      scrollTrigger: {
        trigger: block,
        start: "top 80%",
      }
    }
  );
});