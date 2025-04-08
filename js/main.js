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

  // Enhanced USA Network Map
  function enhanceNetworkMap() {
    const mapDots = document.querySelectorAll('.map-dot');
    const mapContainer = document.querySelector('.usa-map-container');
    
    if (!mapDots.length || !mapContainer) return;
    
    // Create custom SVG connections between dots
    function createCustomConnections() {
      const mainDot = document.querySelector('.michigan-dot');
      if (!mainDot) return;
      
      const connectionsContainer = document.querySelector('.network-connections');
      if (!connectionsContainer) return;
      
      // Clear existing connections
      while (connectionsContainer.firstChild) {
        connectionsContainer.removeChild(connectionsContainer.firstChild);
      }
      
      // Get main dot position
      const mainRect = mainDot.getBoundingClientRect();
      const containerRect = mapContainer.getBoundingClientRect();
      
      const mainX = mainRect.left - containerRect.left + mainRect.width/2;
      const mainY = mainRect.top - containerRect.top + mainRect.height/2;
      
      // Create connections to other dots
      mapDots.forEach(dot => {
        if (dot.classList.contains('michigan-dot')) return;
        
        const dotRect = dot.getBoundingClientRect();
        const dotX = dotRect.left - containerRect.left + dotRect.width/2;
        const dotY = dotRect.top - containerRect.top + dotRect.height/2;
        
        // Create SVG path for connection
        const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        path.classList.add('connection-path');
        
        // Create curved path
        const dx = dotX - mainX;
        const dy = dotY - mainY;
        const distance = Math.sqrt(dx*dx + dy*dy);
        
        // Control points for curve
        const midX = mainX + dx/2;
        const midY = mainY + dy/2;
        const curveFactor = 0.2;
        const perpX = -dy * curveFactor;
        const perpY = dx * curveFactor;
        
        // Create curved path
        const pathData = `M${mainX},${mainY} Q${midX + perpX},${midY + perpY} ${dotX},${dotY}`;
        path.setAttribute('d', pathData);
        
        // Style the path
        path.setAttribute('stroke', '#c8102e');
        path.setAttribute('stroke-width', '1');
        path.setAttribute('fill', 'none');
        path.setAttribute('stroke-dasharray', '5,5');
        
        // Add animation
        path.innerHTML = `
          <animate 
            attributeName="stroke-dashoffset" 
            from="${distance}" 
            to="0" 
            dur="${10 + Math.random() * 5}s" 
            repeatCount="indefinite" />
        `;
        
        connectionsContainer.appendChild(path);
      });
    }
    
    // Add tooltip functionality
    mapDots.forEach(dot => {
      const tooltip = document.createElement('div');
      tooltip.className = 'map-tooltip';
      tooltip.textContent = dot.getAttribute('title') || 'Network Location';
      tooltip.style.position = 'absolute';
      tooltip.style.visibility = 'hidden';
      tooltip.style.opacity = '0';
      tooltip.style.transition = 'opacity 0.3s';
      mapContainer.appendChild(tooltip);
      
      // Show tooltip on hover
      dot.addEventListener('mouseenter', () => {
        const rect = dot.getBoundingClientRect();
        const containerRect = mapContainer.getBoundingClientRect();
        
        tooltip.style.left = (rect.left - containerRect.left + rect.width/2) + 'px';
        tooltip.style.top = (rect.top - containerRect.top - 30) + 'px';
        tooltip.style.visibility = 'visible';
        tooltip.style.opacity = '1';
      });
      
      // Hide tooltip
      dot.addEventListener('mouseleave', () => {
        tooltip.style.visibility = 'hidden';
        tooltip.style.opacity = '0';
      });
    });
    
    // Initialize connections
    createCustomConnections();
    
    // Update connections on resize
    let resizeTimer;
    window.addEventListener('resize', () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(createCustomConnections, 250);
    });
  }
  
  // Initialize map enhancements
  enhanceNetworkMap();
  
  // Form validation
  const contactForm = document.querySelector('.contact-form');
  if (contactForm) {
    contactForm.addEventListener('submit', function(e) {
      e.preventDefault();
      
      // Simple validation
      let isValid = true;
      const name = document.getElementById('name');
      const email = document.getElementById('email');
      const phone = document.getElementById('phone');
      const message = document.getElementById('message');
      
      // Reset previous validation messages
      const errorMessages = contactForm.querySelectorAll('.error-message');
      errorMessages.forEach(msg => msg.remove());
      
      // Validate name
      if (!name.value.trim()) {
        addErrorMessage(name, 'Please enter your name');
        isValid = false;
      }
      
      // Validate email
      if (!email.value.trim() || !isValidEmail(email.value)) {
        addErrorMessage(email, 'Please enter a valid email address');
        isValid = false;
      }
      
      // Validate message
      if (!message.value.trim()) {
        addErrorMessage(message, 'Please enter your message');
        isValid = false;
      }
      
      // If form is valid, show success message
      if (isValid) {
        contactForm.innerHTML = `
          <div class="form-success">
            <svg class="success-icon" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path d="M12,2 C6.48,2 2,6.48 2,12 C2,17.52 6.48,22 12,22 C17.52,22 22,17.52 22,12 C22,6.48 17.52,2 12,2 Z M10,17 L5,12 L6.41,10.59 L10,14.17 L17.59,6.58 L19,8 L10,17 Z"/>
            </svg>
            <h3>Thank you for your message!</h3>
            <p>We've received your inquiry and will get back to you as soon as possible.</p>
          </div>
        `;
      }
    });
    
    // Helper functions
    function addErrorMessage(element, message) {
      const errorDiv = document.createElement('div');
      errorDiv.className = 'error-message';
      errorDiv.textContent = message;
      element.parentNode.appendChild(errorDiv);
      element.classList.add('error');
    }
    
    function isValidEmail(email) {
      const re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
      return re.test(String(email).toLowerCase());
    }
  }
}); 