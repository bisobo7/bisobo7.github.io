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
        
        // If this element is an SVG object, trigger SVG animation
        const svgObject = entry.target.querySelector('object');
        if (svgObject) {
          svgObject.addEventListener('load', function() {
            const svgDoc = svgObject.contentDocument;
            if (svgDoc) {
              // Find all animated elements in the SVG
              const animatedSvgElements = svgDoc.querySelectorAll('[begin]');
              
              // Reset animations by restarting them
              animatedSvgElements.forEach(el => {
                el.setAttribute('begin', 'indefinite');
                setTimeout(() => {
                  el.beginElement();
                }, 100);
              });
            }
          });
          
          // If already loaded, trigger animation
          if (svgObject.contentDocument) {
            const svgDoc = svgObject.contentDocument;
            const animatedSvgElements = svgDoc.querySelectorAll('[begin]');
            
            animatedSvgElements.forEach(el => {
              el.setAttribute('begin', 'indefinite');
              setTimeout(() => {
                el.beginElement();
              }, 100);
            });
          }
        }
        
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

  // Enhanced USA Network Map Interactions
  function enhanceNetworkMap() {
    const networkMap = document.getElementById('usa-network-map');
    
    if (!networkMap) {
      console.log('Network map not found, will try again soon');
      setTimeout(enhanceNetworkMap, 500);
      return;
    }
    
    networkMap.addEventListener('load', function() {
      const svgDoc = networkMap.contentDocument;
      if (!svgDoc) {
        console.log('SVG document not accessible');
        return;
      }
      
      console.log('Network map SVG loaded, initializing interactions');
      
      // Get map elements
      const mainHub = svgDoc.getElementById('main-hub');
      const networkDots = svgDoc.querySelectorAll('.network-dot');
      const networkConnections = svgDoc.getElementById('network-connections');
      const usaOutline = svgDoc.getElementById('usa-outline');
      
      // Add hover effect for USA outline
      if (usaOutline) {
        usaOutline.addEventListener('mouseenter', () => {
          usaOutline.setAttribute('fill', 'url(#stateHover)');
        });
        
        usaOutline.addEventListener('mouseleave', () => {
          usaOutline.setAttribute('fill', 'url(#stateFill)');
        });
      }
      
      // Create dynamic connections between main hub and network dots
      function createConnections() {
        // Clear existing connections
        while (networkConnections.firstChild) {
          networkConnections.removeChild(networkConnections.firstChild);
        }
        
        // Get main hub position
        const hubTransform = mainHub.getAttribute('transform');
        const hubMatch = hubTransform.match(/translate\(([^,]+),\s*([^)]+)\)/);
        
        if (!hubMatch) {
          console.log('Could not determine hub position');
          return;
        }
        
        const hubX = parseFloat(hubMatch[1]);
        const hubY = parseFloat(hubMatch[2]);
        
        // Create connection to each network dot
        networkDots.forEach((dot, index) => {
          const dotX = parseFloat(dot.getAttribute('cx'));
          const dotY = parseFloat(dot.getAttribute('cy'));
          
          // Create path element
          const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
          
          // Calculate control points for a nice curve
          const dx = dotX - hubX;
          const dy = dotY - hubY;
        const distance = Math.sqrt(dx*dx + dy*dy);
        
          // Control point offset factor - varies by distance
          const curveFactor = Math.min(0.3, distance / 1000);
          
          // Control points perpendicular to line between dots
          const midX = hubX + dx * 0.5;
          const midY = hubY + dy * 0.5;
        const perpX = -dy * curveFactor;
        const perpY = dx * curveFactor;
        
          // Path data with quadratic curve
          const pathData = `M${hubX},${hubY} Q${midX + perpX},${midY + perpY} ${dotX},${dotY}`;
        path.setAttribute('d', pathData);
        
          // Styling
          path.setAttribute('stroke', 'url(#connLine)');
          path.setAttribute('stroke-width', '1.5');
        path.setAttribute('fill', 'none');
          path.setAttribute('stroke-dasharray', '5,3');
          path.setAttribute('class', 'connection-path');
          
          // Animation
          const flow = document.createElementNS('http://www.w3.org/2000/svg', 'animate');
          flow.setAttribute('attributeName', 'stroke-dashoffset');
          flow.setAttribute('from', distance.toString());
          flow.setAttribute('to', '0');
          flow.setAttribute('dur', `${10 + Math.random() * 10}s`);
          flow.setAttribute('repeatCount', 'indefinite');
          
          path.appendChild(flow);
          networkConnections.appendChild(path);
          
          // Animate the dot on hover
          dot.addEventListener('mouseenter', () => {
            dot.setAttribute('r', '8');
            path.setAttribute('stroke-width', '2.5');
            path.setAttribute('opacity', '0.9');
            
            // Create tooltip
            let tooltip = svgDoc.getElementById('map-tooltip');
            if (!tooltip) {
              tooltip = document.createElementNS('http://www.w3.org/2000/svg', 'g');
              tooltip.setAttribute('id', 'map-tooltip');
              svgDoc.querySelector('svg').appendChild(tooltip);
            }
            
            // Get location name from id
            const dotId = dot.getAttribute('id');
            const location = dotId.replace('-dot', '').toUpperCase();
            
            // Create tooltip content
            tooltip.innerHTML = `
              <rect x="${dotX - 60}" y="${dotY - 40}" width="120" height="30" rx="5" ry="5" 
                    fill="rgba(15, 25, 35, 0.9)" stroke="#fff" stroke-width="1" filter="url(#dropShadow)"/>
              <text x="${dotX}" y="${dotY - 20}" font-family="Arial, sans-serif" 
                    font-size="12" fill="white" text-anchor="middle" font-weight="bold">${location} PARTNER</text>
              <path d="M${dotX - 5},${dotY - 10} L${dotX},${dotY - 5} L${dotX + 5},${dotY - 10}" 
                    fill="rgba(15, 25, 35, 0.9)"/>
            `;
          });
          
          dot.addEventListener('mouseleave', () => {
            dot.setAttribute('r', '6');
            path.setAttribute('stroke-width', '1.5');
            path.setAttribute('opacity', '0.7');
            
            // Remove tooltip
            const tooltip = svgDoc.getElementById('map-tooltip');
            if (tooltip) {
              tooltip.remove();
            }
          });
          
          // Start animations with slight delay
          setTimeout(() => {
            flow.beginElement();
          }, index * 200);
        });
      }
      
      // Initialize connections
      createConnections();
      
      // Main hub interactions
      if (mainHub) {
        mainHub.addEventListener('mouseenter', () => {
          // Highlight all connections
          const connections = svgDoc.querySelectorAll('.connection-path');
          connections.forEach(conn => {
            conn.setAttribute('stroke-width', '2');
            conn.setAttribute('opacity', '0.9');
          });
          
          // Highlight all dots
          networkDots.forEach(dot => {
            dot.setAttribute('r', '7');
          });
        });
        
        mainHub.addEventListener('mouseleave', () => {
          // Reset connections
          const connections = svgDoc.querySelectorAll('.connection-path');
          connections.forEach(conn => {
            conn.setAttribute('stroke-width', '1.5');
            conn.setAttribute('opacity', '0.7');
          });
          
          // Reset dots
          networkDots.forEach(dot => {
            dot.setAttribute('r', '6');
          });
        });
      }
    });
  }
  
  // Enhanced Location Map Interactions
  function enhanceLocationMap() {
    const locationMap = document.getElementById('location-map');
    
    if (!locationMap) {
      console.log('Location map not found, will try again soon');
      setTimeout(enhanceLocationMap, 500);
      return;
    }
    
    locationMap.addEventListener('load', function() {
      const svgDoc = locationMap.contentDocument;
      if (!svgDoc) {
        console.log('Location SVG document not accessible');
        return;
      }
      
      console.log('Location map SVG loaded, initializing interactions');
      
      // Get map elements
      const mainMarker = svgDoc.getElementById('main-marker');
      const roads = svgDoc.querySelectorAll('#roads path');
      const buildings = svgDoc.querySelectorAll('#buildings rect');
      
      // Add hover effects for buildings
      buildings.forEach(building => {
        building.addEventListener('mouseenter', () => {
          // Store original fill if not already stored
          if (!building.dataset.originalFill) {
            building.dataset.originalFill = building.getAttribute('fill');
          }
          
          // Highlight building
          building.setAttribute('fill', '#c8102e');
          building.setAttribute('opacity', '0.7');
          building.setAttribute('filter', 'url(#softShadow)');
          
          // Show tooltip near building
          const buildingX = parseFloat(building.getAttribute('x')) + parseFloat(building.getAttribute('width')) / 2;
          const buildingY = parseFloat(building.getAttribute('y'));
          
          const tooltip = document.createElementNS('http://www.w3.org/2000/svg', 'g');
          tooltip.setAttribute('id', 'building-tooltip');
          
          tooltip.innerHTML = `
            <rect x="${buildingX - 40}" y="${buildingY - 30}" width="80" height="20" rx="5" ry="5" 
                  fill="rgba(15, 25, 35, 0.9)" stroke="#fff" stroke-width="0.5"/>
            <text x="${buildingX}" y="${buildingY - 16}" font-family="Arial, sans-serif" 
                  font-size="10" fill="white" text-anchor="middle">Local Business</text>
          `;
          
          svgDoc.querySelector('svg').appendChild(tooltip);
        });
        
        building.addEventListener('mouseleave', () => {
          // Restore original appearance
          if (building.dataset.originalFill) {
            building.setAttribute('fill', building.dataset.originalFill);
          }
          building.setAttribute('opacity', '1');
          building.setAttribute('filter', 'none');
          
          // Remove tooltip
          const tooltip = svgDoc.getElementById('building-tooltip');
          if (tooltip && tooltip.parentNode) {
            tooltip.parentNode.removeChild(tooltip);
          }
        });
      });
      
      // Add hover effects for roads
      roads.forEach(road => {
        road.addEventListener('mouseenter', () => {
          road.setAttribute('stroke-width', parseFloat(road.getAttribute('stroke-width')) * 1.2);
        });
        
        road.addEventListener('mouseleave', () => {
          road.setAttribute('stroke-width', parseFloat(road.getAttribute('stroke-width')) / 1.2);
        });
      });
      
      // Main marker animations and interactions
      if (mainMarker) {
        // Add click interaction to marker
        mainMarker.addEventListener('click', () => {
          // Animate marker bounce
          const markerPath = mainMarker.querySelector('path');
          if (markerPath) {
            markerPath.style.transformOrigin = 'center bottom';
            markerPath.style.animation = 'none';
            
            setTimeout(() => {
              markerPath.style.animation = 'markerBounce 0.5s ease-in-out 2';
            }, 10);
          }
          
          // Show more detailed info
          let detailsPanel = svgDoc.getElementById('location-details-panel');
          
          if (!detailsPanel) {
            detailsPanel = document.createElementNS('http://www.w3.org/2000/svg', 'g');
            detailsPanel.setAttribute('id', 'location-details-panel');
            
            detailsPanel.innerHTML = `
              <rect x="250" y="100" width="300" height="180" rx="10" ry="10" 
                    fill="white" stroke="#c8102e" stroke-width="2" filter="url(#dropShadow)"/>
              <text x="400" y="130" font-family="Arial, sans-serif" font-size="16" 
                    fill="#333" text-anchor="middle" font-weight="bold">Dixie Auto Land - Saginaw</text>
              <line x1="300" y1="145" x2="500" y2="145" stroke="#c8102e" stroke-width="1" stroke-dasharray="1,1"/>
              
              <text x="280" y="170" font-family="Arial, sans-serif" font-size="14" fill="#555">• Premium Used Vehicles</text>
              <text x="280" y="195" font-family="Arial, sans-serif" font-size="14" fill="#555">• OEM & Aftermarket Parts</text>
              <text x="280" y="220" font-family="Arial, sans-serif" font-size="14" fill="#555">• Paintless Dent Repair</text>
              <text x="280" y="245" font-family="Arial, sans-serif" font-size="14" fill="#555">• Windshield Replacement</text>
              
              <rect x="510" y="110" width="30" height="30" rx="15" ry="15" fill="#c8102e" cursor="pointer" id="close-details"/>
              <line x1="520" y1="120" x2="530" y2="130" stroke="white" stroke-width="2" stroke-linecap="round"/>
              <line x1="520" y1="130" x2="530" y2="120" stroke="white" stroke-width="2" stroke-linecap="round"/>
            `;
            
            svgDoc.querySelector('svg').appendChild(detailsPanel);
            
            // Add close button interaction
            const closeButton = svgDoc.getElementById('close-details');
            if (closeButton) {
              closeButton.addEventListener('click', () => {
                detailsPanel.style.opacity = '0';
                setTimeout(() => {
                  if (detailsPanel.parentNode) {
                    detailsPanel.parentNode.removeChild(detailsPanel);
                  }
                }, 300);
              });
            }
            
            detailsPanel.style.opacity = '0';
            setTimeout(() => {
              detailsPanel.style.opacity = '1';
              detailsPanel.style.transition = 'opacity 0.3s';
            }, 10);
          }
        });
      }
    });
  }
  
  // Initialize map enhancements
  enhanceNetworkMap();
  enhanceLocationMap();
  
  // Add marker bounce animation style
  const style = document.createElement('style');
  style.innerHTML = `
    @keyframes markerBounce {
      0%, 100% { transform: translateY(0); }
      50% { transform: translateY(-15px); }
    }
  `;
  document.head.appendChild(style);
  
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