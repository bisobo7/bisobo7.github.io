// Intersection Observer for animations
document.addEventListener('DOMContentLoaded', function() {
  // Select all elements that should be animated on scroll
  const animatedElements = document.querySelectorAll('.animate-on-scroll');
  
  // Set up Intersection Observer with options
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      // When element is in viewport
      if (entry.isIntersecting) {
        // Add animated class for CSS animations
        entry.target.classList.add('animated');
        
        // Stop observing after animation is added
        observer.unobserve(entry.target);
      }
    });
  }, {
    root: null, // Use viewport as root
    threshold: 0.15, // Trigger when 15% of element is visible
    rootMargin: '0px 0px -50px 0px' // Adjust trigger point 50px from bottom
  });
  
  // Add staggered delay to elements in card collections
  const addStaggeredDelay = () => {
    // Vehicle cards
    const vehicleCards = document.querySelectorAll('.vehicle-card');
    vehicleCards.forEach((card, index) => {
      card.style.transitionDelay = `${index * 0.15}s`;
    });
    
    // Service cards
    const serviceCards = document.querySelectorAll('.service-card');
    serviceCards.forEach((card, index) => {
      card.style.transitionDelay = `${index * 0.15}s`;
    });
    
    // Testimonial cards
    const testimonialCards = document.querySelectorAll('.testimonial-card');
    testimonialCards.forEach((card, index) => {
      card.style.transitionDelay = `${index * 0.15}s`;
    });
    
    // Footer elements
    const footerElements = document.querySelectorAll('.footer-content > *');
    footerElements.forEach((element, index) => {
      element.style.transitionDelay = `${index * 0.1}s`;
    });
  };
  
  // Initialize staggered animations
  addStaggeredDelay();
  
  // Start observing all elements
  animatedElements.forEach(element => {
    observer.observe(element);
  });
  
  // Smooth scrolling for navigation links
  const navLinks = document.querySelectorAll('a[href^="#"]');
  navLinks.forEach(link => {
    link.addEventListener('click', function(e) {
      e.preventDefault();
      const targetId = this.getAttribute('href');
      const targetElement = document.querySelector(targetId);
      
      if (targetElement) {
        window.scrollTo({
          top: targetElement.offsetTop - 80, // Offset for fixed header
          behavior: 'smooth'
        });
      }
    });
  });
}); 