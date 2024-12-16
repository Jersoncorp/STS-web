// Import Firebase Firestore and storage references
import { firestore } from '../../../resources/script/config.js';
import { collection, addDoc, getDocs } from 'https://www.gstatic.com/firebasejs/10.12.4/firebase-firestore.js';

// Function to get and display the number of documents in a Firestore collection
async function fetchCollectionCount(collectionName, elementId) {
    try {
        const querySnapshot = await getDocs(collection(firestore, collectionName));
        const count = querySnapshot.size; // Number of documents
        document.getElementById(elementId).textContent = count;
    } catch (error) {
        console.error("Error fetching collection count:", error);
    }
}

// Fetch counts for apprehensions and registered drivers
fetchCollectionCount('apprehensions', 'apprehensionsCount');
fetchCollectionCount('registered_drivers', 'driversCount');


// Function to fetch monthly apprehension data
async function fetchMonthlyData() {
    const monthlyData = {};
    const locationData = {};

    try {
        const querySnapshot = await getDocs(collection(firestore, 'apprehensions'));
        querySnapshot.forEach((doc) => {
            const data = doc.data();
            const timestamp = data.timestamp; // Assuming 'timestamp' is the field name in epoch format
            const address = data.address; // Assuming 'address' is the field name

            // Convert epoch timestamp to month
            const date = new Date(timestamp * 1000);
            const month = date.toLocaleString('default', { month: 'long' }); // Get full month name

            // Count apprehensions per month
            if (!monthlyData[month]) {
                monthlyData[month] = 0;
            }
            monthlyData[month]++;

            // Count apprehensions per location
            if (locationData[address]) {
                locationData[address]++;
            } else {
                locationData[address] = 1;
            }
        });
    } catch (error) {
        console.error("Error fetching apprehension data:", error);
    }

    return { monthlyData, locationData };
}

// Function to prepare and render charts
async function renderCharts() {
    const { monthlyData, locationData } = await fetchMonthlyData();

    // Prepare monthly data for the chart
    const monthlyLabels = Object.keys(monthlyData);
    const monthlyCounts = Object.values(monthlyData);
    
    const monthlyChartData = {
        labels: monthlyLabels,
        datasets: [{
            label: 'Individuals Apprehended (Monthly)',
            data: monthlyCounts,
            backgroundColor: 'rgba(54, 162, 235, 0.5)',
            borderColor: 'rgba(54, 162, 235, 1)',
            borderWidth: 1
        }]
    };

    // Prepare location data for the chart
    const locationLabels = Object.keys(locationData);
    const locationCounts = Object.values(locationData);
    
    const locationChartData = {
        labels: locationLabels,
        datasets: [{
            label: 'Apprehensions by Location',
            data: locationCounts,
            backgroundColor: 'rgba(255, 99, 132, 0.5)',
            borderColor: 'rgba(255, 99, 132, 1)',
            borderWidth: 1
        }]
    };

    // Configurations for charts
    const configMonthly = {
        type: 'bar',
        data: monthlyChartData,
        options: {
            scales: {
                y: {
                    beginAtZero: true
                }
            }
        }
    };

    const configLocation = {
        type: 'bar',
        data: locationChartData,
        options: {
            scales: {
                y: {
                    beginAtZero: true
                }
            }
        }
    };

    // Render Charts
    new Chart(document.getElementById('monthlyChart'), configMonthly);
    new Chart(document.getElementById('locationChart'), configLocation);
}

// Call the renderCharts function to execute
renderCharts();