document.addEventListener('DOMContentLoaded', function() {
    // DOM Elements
    const locationSelect = document.getElementById('location');
    const totalSqftInput = document.getElementById('total_sqft');
    const totalSqftRange = document.getElementById('total_sqft_range');
    const predictionForm = document.getElementById('predictionForm');
    const predictBtn = document.getElementById('predictBtn');
    const resultContainer = document.getElementById('resultContainer');
    const loadingIndicator = document.getElementById('loadingIndicator');
    const estimatedPriceElement = document.getElementById('estimatedPrice');
    const resultLocationElement = document.getElementById('resultLocation');
    const resultSqftElement = document.getElementById('resultSqft');
    const resultBhkElement = document.getElementById('resultBhk');
    const resultBathElement = document.getElementById('resultBath');
    const shareBtn = document.getElementById('shareBtn');
    const saveBtn = document.getElementById('saveBtn');
    
    // Sync range slider with input field
    totalSqftInput.addEventListener('input', function() {
        totalSqftRange.value = this.value;
    });
    
    totalSqftRange.addEventListener('input', function() {
        totalSqftInput.value = this.value;
    });
    
    // Load locations from Flask backend
    function loadLocations() {
        // Use relative URL since frontend is served from client/ directory
        fetch('http://localhost:5000/get_location_names')
            .then(response => response.json())
            .then(data => {
                // Clear existing options except the first one
                while (locationSelect.options.length > 1) {
                    locationSelect.remove(1);
                }
                
                // Add location options
                data.locations.forEach(location => {
                    const option = document.createElement('option');
                    option.value = location;
                    option.textContent = location;
                    locationSelect.appendChild(option);
                });
                
                console.log('Locations loaded successfully:', data.locations.length);
            })
            .catch(error => {
                console.error('Error loading locations:', error);
                // Fallback to some sample locations if API fails
                const sampleLocations = [
                    'Whitefield', 'Sarjapur Road', 'Electronic City', 
                    'Marathahalli', 'Bellandur', 'Koramangala', 
                    'Indiranagar', 'HSR Layout', 'JP Nagar', 'Yelahanka'
                ];
                
                sampleLocations.forEach(location => {
                    const option = document.createElement('option');
                    option.value = location;
                    option.textContent = location;
                    locationSelect.appendChild(option);
                });
                
                alert('Could not load locations from server. Using sample data.');
            });
    }
    
    // Format Indian currency
    function formatIndianCurrency(amount) {
        if (!amount) return '₹ 0';
        
        // Convert to number if it's a string
        amount = parseFloat(amount);
        
        // Format with commas for Indian numbering system
        const formatter = new Intl.NumberFormat('en-IN', {
            maximumFractionDigits: 0
        });
        
        return '₹ ' + formatter.format(amount);
    }
    
    // Handle form submission
    predictionForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        // Get form values
        const location = locationSelect.value;
        const totalSqft = totalSqftInput.value;
        const bhk = document.querySelector('input[name="bhk"]:checked').value;
        const bath = document.querySelector('input[name="bath"]:checked').value;
        
        // Validate form
        if (!location) {
            alert('Please select a location');
            locationSelect.focus();
            return;
        }
        
        if (!totalSqft || totalSqft < 300 || totalSqft > 10000) {
            alert('Please enter a valid square footage between 300 and 10,000');
            totalSqftInput.focus();
            return;
        }
        
        // Show loading indicator
        loadingIndicator.style.display = 'block';
        resultContainer.style.display = 'none';
        predictBtn.disabled = true;
        
        // Prepare form data
        const formData = new FormData();
        formData.append('location', location);
        formData.append('total_sqft', totalSqft);
        formData.append('bhk', bhk);
        formData.append('bath', bath);
        
        // Send prediction request to Flask backend
        fetch('http://localhost:5000/predict_home_price', {
            method: 'POST',
            body: formData
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(data => {
            // Hide loading indicator
            loadingIndicator.style.display = 'none';
            predictBtn.disabled = false;
            
            // Display result
            estimatedPriceElement.textContent = formatIndianCurrency(data.estimated_price) + ' lakh';
            resultLocationElement.textContent = location;
            resultSqftElement.textContent = `${totalSqft} sq. ft.`;
            resultBhkElement.textContent = `${bhk} BHK`;
            resultBathElement.textContent = bath;
            
            // Show result container with animation
            resultContainer.style.display = 'block';
            
            // Scroll to result
            resultContainer.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            
            console.log('Prediction successful:', data);
        })
        .catch(error => {
            // Hide loading indicator
            loadingIndicator.style.display = 'none';
            predictBtn.disabled = false;
            
            console.error('Error predicting price:', error);
            
            // Fallback to mock data for demo purposes
            const mockPrice = calculateMockPrice(location, totalSqft, bhk, bath);
            
            estimatedPriceElement.textContent = formatIndianCurrency(mockPrice);
            resultLocationElement.textContent = location;
            resultSqftElement.textContent = `${totalSqft} sq. ft.`;
            resultBhkElement.textContent = `${bhk} BHK`;
            resultBathElement.textContent = bath;
            
            // Show result container
            resultContainer.style.display = 'block';
            
            // Scroll to result
            resultContainer.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            
            alert('Server is not responding. Showing mock estimate for demonstration.');
        });
    });
    
    // Mock price calculation for demo when backend is not available
    function calculateMockPrice(location, totalSqft, bhk, bath) {
        // Base price per sq ft varies by location
        const locationFactors = {
            'Whitefield': 6500,
            'Sarjapur Road': 6200,
            'Electronic City': 5800,
            'Marathahalli': 6300,
            'Bellandur': 6700,
            'Koramangala': 8500,
            'Indiranagar': 9000,
            'HSR Layout': 7500,
            'JP Nagar': 7200,
            'Yelahanka': 5500
        };
        
        // Default base price if location not in list
        const basePricePerSqft = locationFactors[location] || 6000;
        
        // Adjust for BHK (more bedrooms = higher price per sq ft)
        const bhkFactor = 1 + (parseInt(bhk) - 1) * 0.1;
        
        // Adjust for bathrooms
        const bathFactor = 1 + (parseInt(bath) - 1) * 0.05;
        
        // Calculate estimated price
        const estimatedPrice = basePricePerSqft * totalSqft * bhkFactor * bathFactor;
        
        // Add some randomness to make it look realistic
        const randomVariation = 0.9 + Math.random() * 0.2; // 0.9 to 1.1
        
        return Math.round(estimatedPrice * randomVariation);
    }
    
    // Share result functionality
    shareBtn.addEventListener('click', function() {
        const price = estimatedPriceElement.textContent;
        const location = resultLocationElement.textContent;
        const sqft = resultSqftElement.textContent;
        const bhk = resultBhkElement.textContent;
        
        const shareText = `Check out this home price estimate for Bangalore:\n\nLocation: ${location}\nSize: ${sqft}\n${bhk}\nEstimated Price: ${price}\n\nGenerated by Bangalore Home Price Predictor`;
        
        // Try to use Web Share API if available
        if (navigator.share) {
            navigator.share({
                title: 'Bangalore Home Price Estimate',
                text: shareText,
                url: window.location.href
            })
            .catch(error => console.log('Error sharing:', error));
        } else {
            // Fallback to copying to clipboard
            navigator.clipboard.writeText(shareText)
                .then(() => {
                    alert('Estimate copied to clipboard!');
                })
                .catch(err => {
                    console.error('Could not copy text: ', err);
                });
        }
    });
    
    // Save estimate functionality
    saveBtn.addEventListener('click', function() {
        const price = estimatedPriceElement.textContent;
        const location = resultLocationElement.textContent;
        const sqft = resultSqftElement.textContent;
        const bhk = resultBhkElement.textContent;
        const bath = resultBathElement.textContent;
        
        const estimateData = {
            price: price,
            location: location,
            sqft: sqft,
            bhk: bhk,
            bath: bath,
            timestamp: new Date().toLocaleString()
        };
        
        // Get existing saved estimates
        let savedEstimates = JSON.parse(localStorage.getItem('bangaloreHomeEstimates')) || [];
        
        // Add new estimate
        savedEstimates.push(estimateData);
        
        // Keep only last 10 estimates
        if (savedEstimates.length > 10) {
            savedEstimates = savedEstimates.slice(-10);
        }
        
        // Save to localStorage
        localStorage.setItem('bangaloreHomeEstimates', JSON.stringify(savedEstimates));
        
        // Visual feedback
        const originalText = saveBtn.innerHTML;
        saveBtn.innerHTML = '<i class="fas fa-check me-2"></i>Saved!';
        saveBtn.classList.remove('btn-outline-success');
        saveBtn.classList.add('btn-success');
        
        setTimeout(() => {
            saveBtn.innerHTML = originalText;
            saveBtn.classList.remove('btn-success');
            saveBtn.classList.add('btn-outline-success');
        }, 2000);
        
        console.log('Estimate saved:', estimateData);
    });
    
    // Initialize the page
    loadLocations();
    
    // Smooth scrolling for anchor links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            e.preventDefault();
            
            const targetId = this.getAttribute('href');
            if (targetId === '#') return;
            
            const targetElement = document.querySelector(targetId);
            if (targetElement) {
                window.scrollTo({
                    top: targetElement.offsetTop - 80,
                    behavior: 'smooth'
                });
            }
        });
    });
    
    // Form reset functionality
    document.querySelector('button[type="reset"]').addEventListener('click', function() {
        setTimeout(() => {
            resultContainer.style.display = 'none';
        }, 100);
    });
});