// Import Firebase Firestore and storage references
import { firestore } from '../../../resources/script/config.js';
import { collection, getDocs } from 'https://www.gstatic.com/firebasejs/10.12.4/firebase-firestore.js';

// Function to fetch apprehension data (daily, monthly, yearly)
async function fetchApprehensionData() {
    const dailyData = {};
    const monthlyData = {};
    const yearlyData = {};
    const locationData = {};

    try {
        const querySnapshot = await getDocs(collection(firestore, 'apprehensions'));
        querySnapshot.forEach((doc) => {
            const data = doc.data();
            const timestamp = data.timestamp; // Assuming 'timestamp' is the field name in epoch format
            const address = data.address; // Assuming 'address' is the field name

            // Convert epoch timestamp to date
            const date = new Date(timestamp * 1000);
            const day = date.toLocaleDateString(); // Get full date (day)
            const month = date.toLocaleString('default', { month: 'long' }); // Get full month name
            const year = date.getFullYear(); // Get year

            // Count apprehensions per day
            if (!dailyData[day]) {
                dailyData[day] = 0;
            }
            dailyData[day]++;

            // Count apprehensions per month
            if (!monthlyData[month]) {
                monthlyData[month] = 0;
            }
            monthlyData[month]++;

            // Count apprehensions per year
            if (!yearlyData[year]) {
                yearlyData[year] = 0;
            }
            yearlyData[year]++;

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

    return { dailyData, monthlyData, yearlyData, locationData };
}

// Function to prepare and render charts
async function renderCharts() {
    const { dailyData, monthlyData, yearlyData, locationData } = await fetchApprehensionData();

    // Prepare daily data for the chart
    const dailyLabels = Object.keys(dailyData);
    const dailyCounts = Object.values(dailyData);
    
    const dailyChartData = {
        labels: dailyLabels,
        datasets: [{
            label: 'Individuals Apprehended (Daily)',
            data: dailyCounts,
            backgroundColor: 'rgba(75, 192, 192, 0.5)',
            borderColor: 'rgba(75, 192, 192, 1)',
            borderWidth: 1
        }]
    };

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

    // Prepare yearly data for the chart
    const yearlyLabels = Object.keys(yearlyData);
    const yearlyCounts = Object.values(yearlyData);
    
    const yearlyChartData = {
        labels: yearlyLabels,
        datasets: [{
            label: 'Individuals Apprehended (Yearly)',
            data: yearlyCounts,
            backgroundColor: 'rgba(255, 206, 86, 0.5)',
            borderColor: 'rgba(255, 206, 86, 1)',
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
    const configDaily = {
        type: 'line',
        data: dailyChartData,
        options: {
            scales: {
                y: {
                    beginAtZero: true
                }
            }
        }
    };

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

    const configYearly = {
        type: 'bar',
        data: yearlyChartData,
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
    new Chart(document.getElementById('dailyChart'), configDaily);
    new Chart(document.getElementById('monthlyChart'), configMonthly);
    new Chart(document.getElementById('yearlyChart'), configYearly);
    new Chart(document.getElementById('locationChart'), configLocation);
}

// Call the renderCharts function to execute
renderCharts();
