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

  // Interactive Map Enhancement
  function enhanceMap() {
    const mapDots = document.querySelectorAll('.map-dot');
    const mapContainer = document.querySelector('.usa-map-container');
    
    if (!mapDots.length || !mapContainer) return;
    
    // Add hover effects for map dots
    mapDots.forEach(dot => {
      // Create tooltip
      const tooltip = document.createElement('div');
      tooltip.className = 'map-tooltip';
      tooltip.innerHTML = dot.getAttribute('title') || 'Junkyard Location';
      tooltip.style.visibility = 'hidden';
      mapContainer.appendChild(tooltip);
      
      // Show tooltip on hover
      dot.addEventListener('mouseenter', (e) => {
        const rect = dot.getBoundingClientRect();
        const containerRect = mapContainer.getBoundingClientRect();
        
        tooltip.style.visibility = 'visible';
        tooltip.style.opacity = '1';
        tooltip.style.left = (rect.left - containerRect.left + rect.width/2) + 'px';
        tooltip.style.top = (rect.top - containerRect.top - 30) + 'px';
      });
      
      // Hide tooltip when not hovering
      dot.addEventListener('mouseleave', () => {
        tooltip.style.visibility = 'hidden';
        tooltip.style.opacity = '0';
      });
    });
    
    // Create dynamic connection lines between dots
    function createConnections() {
      const mainDot = document.querySelector('.michigan-dot');
      if (!mainDot) return;
      
      const connections = document.querySelector('.network-connections');
      if (!connections) return;
      
      const mainRect = mainDot.getBoundingClientRect();
      const containerRect = mapContainer.getBoundingClientRect();
      
      const mainX = mainRect.left - containerRect.left + mainRect.width/2;
      const mainY = mainRect.top - containerRect.top + mainRect.height/2;
      
      // Create connection paths
      mapDots.forEach(dot => {
        if (dot.classList.contains('michigan-dot')) return;
        
        const dotRect = dot.getBoundingClientRect();
        const dotX = dotRect.left - containerRect.left + dotRect.width/2;
        const dotY = dotRect.top - containerRect.top + dotRect.height/2;
        
        // Calculate control points for curved paths
        const dx = dotX - mainX;
        const dy = dotY - mainY;
        const distance = Math.sqrt(dx*dx + dy*dy);
        
        const ctrl1X = mainX + dx * 0.3;
        const ctrl1Y = mainY + dy * 0.1;
        const ctrl2X = mainX + dx * 0.7;
        const ctrl2Y = mainY + dy * 0.9;
        
        const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        path.classList.add('connection-path');
        path.setAttribute('d', `M${mainX},${mainY} C${ctrl1X},${ctrl1Y} ${ctrl2X},${ctrl2Y} ${dotX},${dotY}`);
        path.style.strokeDasharray = '3,3';
        path.style.animationDuration = `${20 + Math.random() * 30}s`;
        
        connections.appendChild(path);
      });
    }
    
    // Create connections on initial load
    window.addEventListener('load', () => {
      setTimeout(createConnections, 1000);
    });
    
    // Recreate connections on window resize
    let resizeTimer;
    window.addEventListener('resize', () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        // Remove existing connections
        const connections = document.querySelector('.network-connections');
        if (connections) {
          while (connections.firstChild) {
            connections.removeChild(connections.firstChild);
          }
        }
        // Create new connections
        createConnections();
      }, 250);
    });
  }
  
  // Initialize map enhancements
  enhanceMap();
}); 